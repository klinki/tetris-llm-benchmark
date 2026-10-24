// Playwright CLI audit. The entry response is appended only with fixture access
// to existing lexical bindings; engine, input, rendering and RAF bodies stay intact.
async page => {
 const mode=new URL(page.url()).searchParams.get('audit');
 if(!['low','medium','high','xhigh','max'].includes(mode))throw Error('Unknown effort');
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const errors=[],consoleErrors=[],badResponses=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.endsWith('/favicon.ico'))consoleErrors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badResponses.push({status:r.status(),url:r.url()});});
 await page.addInitScript(()=>{window.requestAnimationFrame=cb=>{window.__vFrame=cb;return 1;};});
 const entry=mode==='high'?'/dist/game.js':mode==='xhigh'?'/main.js':'/dist/main.js';
 if(mode!=='medium')await page.route(`**${entry}`,async route=>{
  const response=await route.fetch(),body=await response.text();
  const access=mode==='low'?`
   window.__v={local:t=>cells({kind:t,rotation:0,x:0,y:0}),g:()=>game.state,raw:game,reset:start,render,step:ms=>game.tick(ms),place:(t,x,y)=>{game.state.active={kind:t,rotation:0,x,y};game.gravityMs=0;game.lockMs=0;game.lockResets=0;}};`
   :mode==='high'?`
   window.__v={local:t=>matrixFor(t).flatMap((row,y)=>row.flatMap((v,x)=>v?[[x,y]]:[])),g:()=>game,raw:game,reset:()=>game.reset(),render:()=>game.render(),step:ms=>{if(!game.lastTime)game.lastTime=1000;game.frame(game.lastTime+ms);},place:(t,x,y)=>{game.current=game.makePiece(t);Object.assign(game.current,{x,y});game.dropAccumulator=0;game.lockAccumulator=0;game.lockResets=0;}};`
   :mode==='xhigh'?`
   window.__v={local:t=>cellsFor(t),g:()=>game,reset:restart,render,step:ms=>updateGame(game,ms),place:(t,x,y)=>{game.active={type:t,rotation:0,x,y};game.gravityClock=0;game.lockClock=0;game.lockResets=0;game.lastAction='move';}};`
   :`
   window.__v={local:t=>getCells(t),g:()=>game,raw:game,reset:restart,render,step:(ms,soft=false)=>game.tick(ms,soft),place:(t,x,y)=>{game.current={type:t,rotation:0,x,y};game.gravityAccumulator=0;game.lockTimer=0;game.lockResets=0;game.lastAction='spawn';}};`;
  await route.fulfill({response,body:body+'\n'+access});
 });
 await page.setViewportSize({width:1280,height:800});await page.reload({waitUntil:'networkidle'});
 if(mode!=='medium')await page.evaluate(mode=>{
  const v=window.__v;
  v.state=()=>{const g=v.g(),p=g.active??g.current;return{type:p?.type??p?.kind,x:p?.x,y:p?.y,rotation:p?.rotation,score:g.score,lines:g.lines,level:g.level,occupied:g.board.flat().filter(Boolean).length,held:mode==='high'?g.held:(g.hold??null),canHold:mode==='xhigh'?!g.holdUsed:g.canHold,over:mode==='high'?g.state==='over':g.gameOver};};
 },mode);
 const measure=()=>page.evaluate(mode=>{
  const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
  const canvases=[...document.querySelectorAll('canvas')].map(c=>({id:c.id,...box(c),native:[c.width,c.height],display:getComputedStyle(c).display}));
  const board=document.querySelector(mode==='max'?'#game-board':'#board');
  const node=document.querySelector(mode==='max'?'#board-overlay':mode==='xhigh'?'#game-over':'#overlay');
  return{viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,board:box(board),canvases,overlay:{display:getComputedStyle(node).display,opacity:getComputedStyle(node).opacity},nextVisible:mode==='low'?document.querySelector('#next').getBoundingClientRect().width>0:mode==='medium'?document.querySelector('#next').getBoundingClientRect().width>0:mode==='high'?document.querySelector('#next-pieces').getBoundingClientRect().width>0:mode==='xhigh'?document.querySelector('.next-panel').getBoundingClientRect().width>0:document.querySelector('#next-queue').getBoundingClientRect().width>0};
 },mode);
 const views={};
 for(const [name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const controls=[];
  if(mode!=='medium'){
   await page.evaluate(()=>{const v=window.__v;v.reset();v.place('T',3,5);v.render();});
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
    const before=await page.evaluate(()=>window.__v.state());await page.keyboard.press(key);const after=await page.evaluate(()=>window.__v.state());controls.push({key,before,after});
   }
   check(controls[0].after.x===controls[0].before.x-1&&controls[1].after.x===controls[1].before.x+1,'Movement binding');
   for(let i=2;i<6;i++)check(controls[i].after.rotation===(controls[i].before.rotation+(i<4?1:3))%4,'Rotation binding '+controls[i].key);
   check(controls[6].after.y===controls[6].before.y+1&&controls[6].after.score===controls[6].before.score+1,'Down binding');
   check(controls[7].after.occupied===4,'Hard drop');check(controls[8].after.held===controls[8].before.type&&!controls[8].after.canHold,'Hold');
   await page.keyboard.press('c');check(!(await page.evaluate(()=>window.__v.state())).canHold,'Hold restriction');await page.evaluate(()=>window.__v.render());
  }
  if(mode==='medium'){
   await page.locator('#start').click();for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c','r'])await page.keyboard.press(key);
   check((await page.locator('#score').textContent())==='0','Static medium score changed');check(!(await page.evaluate(()=>Boolean(window.__v))),'Medium unexpectedly runs');
  }
  await page.waitForTimeout(230);views[name]={...await measure(),controls};
  const view=views[name];check(view.documentWidth===width,'Document overflow');
  const expectedBoard=name==='desktop'?[mode==='high'?490:491,300,600]:mode==='low'?[77,300,600]:mode==='medium'?[79,300,600]:mode==='high'?[45,300,600]:mode==='xhigh'?[13,249,498]:[46,298,598];
  for(const [i,key]of ['x','width','height'].entries())check(Math.abs(view.board[key]-expectedBoard[i])<.02,`${name} ${key} geometry`);
  check(view.nextVisible===(name==='desktop'?true:!['medium','xhigh'].includes(mode)),'Next visibility finding changed');
  if(mode==='low'&&name==='mobile')check(view.canvases.find(c=>c.id==='hold').width===0,'Hidden mobile hold changed');
  if(mode!=='medium')check(view.overlay.display==='none'||Number(view.overlay.opacity)===0,'Active overlay visible');
  await page.screenshot({path:`gpt6-luna-${mode}-${name}.png`,fullPage:true});
 }
 const findings={};
 if(mode==='high'){
  await page.locator('.next-card').scrollIntoViewIfNeeded();findings.scrolledNext=await page.locator('.next-card').boundingBox();
  check(findings.scrolledNext.y>=0&&findings.scrolledNext.y+findings.scrolledNext.height<=844,'High next unreachable');await page.evaluate(()=>scrollTo(0,0));
 }
 if(mode==='max'){
  findings.phonePreview=await page.evaluate(()=>{
   const v=window.__v;v.g().nextQueue.splice(0,5,'I','I','I','I','I');v.render();
   return [...document.querySelectorAll('#next-queue canvas')].map(c=>{
    const b=c.getBoundingClientRect(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=c.width,max=-1,top=c.height,bottom=-1;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]){min=Math.min(min,x);max=Math.max(max,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    return{native:[c.width,c.height],css:[b.width,b.height],paintedCss:[(max-min+1)*b.width/c.width,(bottom-top+1)*b.height/c.height]};
   });
  });
  check(JSON.stringify(findings.phonePreview.map(c=>c.native[0]))===JSON.stringify([310,155,103,77,61]),'Progressive phone preview backing widths changed');
  check(findings.phonePreview[0].paintedCss[0]<15&&findings.phonePreview[4].paintedCss[0]>30,'Squashed identical I preview finding');
 }
 if(mode!=='medium'){
  findings.ghosts=await page.evaluate(mode=>{
   const v=window.__v,c=document.querySelector(mode==='max'?'#game-board':'#board'),ctx=c.getContext('2d'),result=[];
   for(const type of ['I','J','L','O','S','T','Z']){
    v.reset();v.place(type,3,0);const g=v.g(),p=g.active??g.current;g.board[17][4]='J';let y=p.y;
    const fits=y=>v.local(type).every(([dx,dy])=>y+dy<g.board.length&&(y+dy<0||g.board[y+dy][p.x+dx]===null));while(fits(y+1))y++;
    const expected=v.local(type).map(([x,dy])=>[p.x+x,y+dy-(mode==='xhigh'?2:0)].join(',')).sort();
    const calls=[],name=mode==='high'?'roundRect':'fillRect',original=ctx[name],alpha=mode==='high'?.18:mode==='xhigh'?.28:.22;
    ctx[name]=function(...a){if(Math.abs(this.globalAlpha-alpha)<.001)calls.push(a);return original.apply(this,a);};
    v.render();ctx[name]=original;
    const stride=mode==='low'||mode==='high'?3:1,inset=mode==='low'?1:mode==='max'?2:1.65;
    const actual=calls.filter((_,i)=>i%stride===0).map(([x,y])=>[Math.round((x-inset)/30),Math.round((y-inset)/30)].join(',')).sort();
    if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Ghost drawing '+type+JSON.stringify({expected,actual}));result.push({type,y,actual});
   }
   return result;
  },mode);
  // Real callback timestamps, no replacement of the delivered simulation body.
  findings.refresh=[];
  for(const [hz,base]of [[60,10000],[144,20000]]){
   const result=await page.evaluate(({hz,base,mode})=>{
    const v=window.__v;window.__vFrame(base);v.reset();v.place('O',3,0);v.g().level=15;v.g().lines=140;
    let elapsed=0;while(elapsed<600-1e-8){elapsed+=Math.min(1000/hz,600-elapsed);window.__vFrame(base+elapsed);}
    return{hz,...v.state()};
   },{hz,base,mode});findings.refresh.push(result);
  }
  check(mode==='high'?findings.refresh[0].y===12&&findings.refresh[1].y===10:findings.refresh[0].y===findings.refresh[1].y,'Frame rate outcome');
  await page.evaluate(()=>{const v=window.__v;v.reset();v.place('O',3,0);for(let i=0;i<50;i++)v.step(16);v.render();});
  findings.softBefore=await page.evaluate(()=>window.__v.state());await page.keyboard.down('ArrowDown');await page.evaluate(()=>window.__v.step(1,true));findings.softAfter=await page.evaluate(()=>window.__v.state());await page.keyboard.up('ArrowDown');
  const expected=mode==='max'?18:1;check(findings.softAfter.y-findings.softBefore.y===expected&&findings.softAfter.score-findings.softBefore.score===expected,'Normal to soft outcome');
  if(mode==='low'){
   findings.preview=await page.evaluate(()=>{
    const v=window.__v,c=document.querySelector('#next'),ctx=c.getContext('2d'),events=[];
    const clear=ctx.clearRect,fill=ctx.fillRect;ctx.clearRect=function(...args){events.push({kind:'clear',args});return clear.apply(this,args);};ctx.fillRect=function(...args){events.push({kind:'fill',args});return fill.apply(this,args);};
    v.render();ctx.clearRect=clear;ctx.fillRect=fill;
    const last=events.map(e=>e.kind).lastIndexOf('clear');return{clears:events.filter(e=>e.kind==='clear').length,drawsAfterLastClear:events.slice(last+1).length,queue:v.g().queue.slice(0,5),lastEvents:events.slice(last)};
   });check(findings.preview.clears===6&&findings.preview.drawsAfterLastClear===12,'Erased next previews changed');
  }
  // Exercise actual Space/R at each requested viewport.
  findings.restarts=[];
  for(const [width,height]of [[1280,800],[390,844]]){
  await page.setViewportSize({width,height});
  await page.evaluate(mode=>{const v=window.__v;v.reset();v.place('O',0,mode==='xhigh'?20:18);for(let y=0;y<3;y++)for(let x=3;x<7;x++)v.g().board[y][x]='J';v.render();},mode);
  await page.keyboard.press('Space');await page.waitForTimeout(230);findings.beforeRestart=await page.evaluate(()=>window.__v.state());check(findings.beforeRestart.over,'Blocked spawn');
  await page.keyboard.press('r');await page.waitForTimeout(230);findings.afterRestart=await page.evaluate(()=>window.__v.state());check(!findings.afterRestart.over&&findings.afterRestart.score===0&&findings.afterRestart.occupied===0&&findings.afterRestart.held===null&&findings.afterRestart.canHold,'R reset');
  findings.restarts.push({viewport:[width,height],before:findings.beforeRestart,after:findings.afterRestart});
  }
  check(!errors.length&&!consoleErrors.length&&!badResponses.length,JSON.stringify({errors,consoleErrors,badResponses}));
 }else{
  check(errors.length===0,'Unexpected static-page exception');check(badResponses.some(r=>r.url.endsWith('/dist/main.js')),'Missing game module should fail');
 }
 const result={mode,browser:page.context().browser().version(),staticOnly:mode==='medium',...views,...findings,errors,consoleErrors,badResponses};await page.evaluate(r=>window.__tetrisAudit=r,result);console.log(JSON.stringify(result,null,2));
}
