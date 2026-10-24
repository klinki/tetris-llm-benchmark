// Playwright CLI snippet, served by each unchanged temporary npm start server.
async (page) => {
  const mode=new URL(page.url()).searchParams.get('audit');
  if(!['low','high','max'].includes(mode))throw new Error('Unknown effort');
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  const errors=[],consoleErrors=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.endsWith('/favicon.ico'))consoleErrors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badResponses.push({status:r.status(),url:r.url()});});
  await page.addInitScript(()=>{window.requestAnimationFrame=cb=>{window.__vFrame=cb;return 1;};});
  await page.setViewportSize({width:1280,height:800});
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(async mode=>{
    const {Game}=await import(mode==='low'?'/dist/game.js':mode==='high'?'/core/game.js':'/game.js');
    const p=Game.prototype,name=mode==='high'?'moveLeft':'move',original=p[name];
    p[name]=function(...args){window.__vGame=this;return original.apply(this,args);};
    window.__vCapture={p,name,original};
  },mode);
  await page.keyboard.press('ArrowLeft');
  await page.evaluate(mode=>{
    const g=window.__vGame,{p,name,original}=window.__vCapture;p[name]=original;
    const grid=()=>mode==='high'?g.board.cells:g.board;
    const state=()=>({...g.active,score:g.score,held:g.holdType,canHold:g.canHold,
      occupied:grid().flat().filter(c=>c!==null).length,
      over:mode==='low'?g.gameOver:mode==='high'?g.status==='gameover':g.state==='gameover'});
    const reset=()=>{(mode==='max'?g.reset:g.restart).call(g);};
    const place=(t,x,y)=>{
      g.active={type:t,rotation:0,x,y};Object.assign(g,{gravityAccum:0,dropTimer:0,lockTimer:0,lockResets:0,lowestY:y,lastAction:null,lastMoveWasRotation:false,lastKickIndex:0});
    };
    const update=g.update.bind(g),step=ms=>update(mode==='max'?ms/1000:ms);
    window.__vState=state;window.__vReset=reset;window.__vPlace=place;window.__vGrid=grid;window.__vStep=step;
    // Actual delivered frame callbacks; no replacement of the time conversion.
    const refresh=[];
    for(const [hz,base]of [[60,10000],[144,20000]]){
      window.__vFrame(base);reset();place('O',4,mode==='high'?1:0);let elapsed=0;
      for(let i=1;i<=hz;i++){window.__vFrame(base+1100*i/hz);elapsed++;}
      refresh.push({hz,frames:elapsed,...state()});
    }
    window.__vRefresh=refresh;
    // Freeze animation-only simulation while keeping actual keys and drawing.
    g.update=()=>{};window.__vDraw=()=>window.__vFrame(performance.now());
    window.__vKeys=[];
    for(const method of [mode==='high'?'moveLeft':'move',...(mode==='high'?['moveRight']:[]),'rotate','hardDrop',mode==='high'?'holdPiece':'hold']){
      const original=p[method];p[method]=function(...args){const before=state(),result=original.apply(this,args),after=state();
        window.__vKeys.push({method,args,before,after});return result;};
    }
  },mode);
  const refresh=await page.evaluate(()=>window.__vRefresh);
  for(const r of refresh)check(r.y===(mode==='high'?2:1)&&r.occupied===0,'Actual 60/144 Hz clock changed');
  const measure=()=>page.evaluate(mode=>{
    const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    const canvases=[...document.querySelectorAll('canvas')].map(c=>({id:c.id,...box(c),native:[c.width,c.height]}));
    const c=canvases.find(c=>c.id===(mode==='low'?'game':'board')),scale=c.width/640;
    const board=mode==='low'?{x:c.x+30*scale,y:c.y+30*scale,width:300*scale,height:600*scale}:c;
    const overlay=mode==='low'?null:getComputedStyle(document.querySelector(mode==='high'?'#overlay':'#gameover-overlay')).display;
    return{viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,canvases,board,overlay};
  },mode);
  const views={};
  for(const [view,width,height]of [['desktop',1280,800],['mobile',390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    await page.evaluate(()=>{window.__vReset();window.__vPlace('T',3,5);window.__vKeys=[];window.__vDraw();});
    for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft'])await page.keyboard.press(key);
    const softBefore=await page.evaluate(()=>window.__vState());
    await page.keyboard.down('ArrowDown');await page.waitForTimeout(120);
    await page.evaluate(()=>window.__vStep(100.000001));await page.keyboard.up('ArrowDown');
    const softAfter=await page.evaluate(()=>window.__vState());
    await page.keyboard.press('Space');await page.keyboard.press('c');
    await page.evaluate(()=>window.__vDraw());
    const controls=await page.evaluate(()=>window.__vKeys),layout=await measure();
    check(controls.length===8,`Action count ${controls.length}`);
    check(controls[0].after.x===controls[0].before.x-1&&controls[1].after.x===controls[1].before.x+1,'Side movement failed');
    for(let i=0;i<4;i++){const a=controls[i+2],d=i<2?1:-1;check(a.args[0]===d&&a.after.rotation===(a.before.rotation+d+4)%4,'Rotation binding failed');}
    check(softAfter.y-softBefore.y===2&&softAfter.score-softBefore.score===2,'Soft movement/points failed');
    check(controls[6].after.occupied===4&&controls[7].after.held===controls[7].before.type&&!controls[7].after.canHold,'Hard/hold failed');
    check(layout.documentWidth===width,`${view} horizontal overflow: ${JSON.stringify(layout)}`);
    check(layout.board.x>=0&&layout.board.x+layout.board.width<=width&&layout.board.width>150,'Fitting playfield changed');
    check(layout.overlay===null||layout.overlay==='none','Active overlay visible');
    for(const c of layout.canvases)check(c.x>=0&&c.x+c.width<=width,'Supporting canvas clipped horizontally');
    const expected=mode==='low'?(view==='desktop'?[358.15625,291.5625,583.125]:[40.9375,159.375,318.75])
      :mode==='high'?(view==='desktop'?[490,300,660]:[62.40625,265.1875,581])
      :(view==='desktop'?[487,286,572]:[103,174,348]);
    for(const [i,name]of ['x','width','height'].entries())check(Math.abs(layout.board[name]-expected[i])<0.02,`${view} ${name} geometry changed`);
    await page.screenshot({path:`deepseek-v41-${mode}-${view}.png`});
    views[view]={...layout,controls,softBefore,softAfter};
    if(view==='mobile'&&mode==='high'){
      await page.locator('#next').scrollIntoViewIfNeeded();
      views[view].scrolledNext=await page.locator('#next').boundingBox();
      check(views[view].scrolledNext.y>=0&&views[view].scrolledNext.y+views[view].scrolledNext.height<=height,'Reflowed next queue is unreachable');
      await page.screenshot({path:`deepseek-v41-${mode}-mobile-scrolled.png`});
      await page.evaluate(()=>window.scrollTo(0,0));
    }
  }
  await page.evaluate(()=>{window.__vReset();window.__vPlace('O',4,0);for(let i=0;i<50;i++)window.__vStep(16);});
  const timerBefore=await page.evaluate(()=>window.__vState());
  await page.keyboard.down('ArrowDown');await page.evaluate(()=>window.__vStep(1));
  const timerAfter=await page.evaluate(()=>window.__vState());await page.keyboard.up('ArrowDown');
  check(timerAfter.y-timerBefore.y===16&&timerAfter.score===16,'Soft transition finding changed');
  // Block only the next spawn region, keeping the current floor lock legal.
  await page.evaluate(mode=>{
    window.__vReset();window.__vPlace('O',0,mode==='max'?18:20);
    for(let y=0;y<3;y++)for(let x=3;x<7;x++)window.__vGrid()[y][x]='J';
  },mode);
  await page.keyboard.press('Space');await page.evaluate(()=>window.__vDraw());
  const beforeRestart=await page.evaluate(()=>window.__vState());check(beforeRestart.over,'Blocked spawn failed');
  if(mode!=='low')check((await measure()).overlay==='flex','Game-over overlay failed');
  await page.keyboard.press('r');await page.evaluate(()=>window.__vDraw());
  const afterRestart=await page.evaluate(()=>window.__vState());
  check(!afterRestart.over&&afterRestart.score===0&&afterRestart.occupied===0&&afterRestart.held===null&&afterRestart.canHold,'Real R restart failed');
  if(mode!=='low')check((await measure()).overlay==='none','Restart overlay failed');
  check(!errors.length&&!consoleErrors.length&&!badResponses.length,JSON.stringify({errors,consoleErrors,badResponses}));
  const result={mode,browser:page.context().browser().version(),...views,refresh,timerBefore,timerAfter,beforeRestart,afterRestart,errors,consoleErrors,badResponses};
  await page.evaluate(result=>{window.__tetrisAudit=result;},result);
  console.log(JSON.stringify(result,null,2));
}
