// Real Chromium, served unchanged module bodies and input/RAF/render handlers.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function runBrowser(base,mode,artifacts) {
 const audit=await import(pathToFileURL(path.join(__dirname,'hy4-audit.mjs')));
 const browser=await chromium.launch({headless:true}),result={mode,browser:browser.version(),views:{}};
 const shutdown=async()=>{await browser.close();process.exit(130);};process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
 try {for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height}});
  try {
   const page=await context.newPage(),errors=[],assets=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push(r.url());});page.on('requestfailed',r=>assets.push(r.url()));
   await page.addInitScript(()=>{
    window.__now=0;Object.defineProperty(performance,'now',{value:()=>__now});window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.__draws=[];const original=CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){__draws.push({canvas:this.canvas.id,x,y,w,h,alpha:this.globalAlpha,color:this.fillStyle});return original.call(this,x,y,w,h);};
   });
   await page.route(new URL('dist/main.js',base).href,async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__app={game,input,renderer,resetClock(){last=0;input.clear();window.__now=0;}};'});});
   await page.goto(base,{waitUntil:'networkidle'});
   const engine=await page.evaluate(async({factory,probe,oracle})=>{
    const a=(0,eval)(`(${factory})`)({game:await import('/dist/game.js'),pieces:await import('/dist/pieces.js')});
    const e=(0,eval)(`(${probe})`)(a,oracle);let time=0;
    const game=()=>__app.game,paint=()=>{__draws.length=0;__app.renderer.render(game());};
    const fresh=(t='T',r=0,x=3,y=5)=>{Object.assign(game(),a.make(42));__app.resetClock();time=0;a.clear(game());a.place(game(),t,r,x,y);paint();};
    const frame=dt=>{time+=dt;window.__now=time;__draws.length=0;__frame(time);};
    const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
    const state=()=>({active:a.active(game()),count:a.count(game()),score:game().score,lines:game().lines,level:game().level,held:game().holdPiece,canHold:game().canHoldPiece,over:game().gameOver});
    window.__v={a,game,paint,fresh,frame,advance,state};fresh();return e;
   },{factory:audit.createAdapter.toString(),probe:audit.runProbes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
   audit.assertRecorded(engine);
   const refresh=[];for(const hz of [60,144]){refresh.push(await page.evaluate(hz=>{__v.fresh('O',0,3,0);__v.game().scoring.level=10;let t=0;while(t<600-1e-8){const dt=Math.min(1000/hz,600-t);__v.frame(dt);t+=dt;}return __v.state().active.y;},hz));}assert.deepEqual(refresh,[9,9]);await page.evaluate(()=>__v.fresh());
   const controls=[];
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);controls.push({key,before,after:await page.evaluate(()=>__v.state())});}
   assert.equal(controls[0].after.active.x,controls[0].before.active.x-1);assert.equal(controls[1].after.active.x,controls[1].before.active.x+1);
   for(let i=2;i<6;i++)assert.equal(controls[i].after.active.rotation,(controls[i].before.active.rotation+(i<4?1:3))%4);
   assert.equal(controls[6].after.score,1);assert.equal(controls[6].after.active.y,controls[6].before.active.y+1);assert.equal(controls[7].after.count,4);assert.equal(controls[8].after.held,controls[8].before.active.type);
   await page.evaluate(()=>__v.fresh('O',0,3,0));await page.keyboard.down('ArrowLeft');await page.evaluate(()=>__v.advance(400));assert.equal((await page.evaluate(()=>__v.state())).active.x,-1);
   await page.keyboard.down('ArrowRight');await page.evaluate(()=>__v.advance(500));assert.equal((await page.evaluate(()=>__v.state())).active.x,7);
   await page.keyboard.up('ArrowRight');await page.evaluate(()=>__v.advance(500));assert.equal((await page.evaluate(()=>__v.state())).active.x,-1);await page.keyboard.up('ArrowLeft');
   await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowDown');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
   const beforeBlur=await page.evaluate(()=>__v.state());await page.evaluate(()=>__v.advance(300));const afterBlur=await page.evaluate(()=>__v.state());assert.equal(afterBlur.active.x,beforeBlur.active.x);assert.equal(afterBlur.score,beforeBlur.score);await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');
   await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));const soft=await page.evaluate(()=>({rows:__v.state().active.y,points:__v.state().score}));assert.deepEqual(soft,{rows:1,points:1});await page.keyboard.up('ArrowDown');
   await page.evaluate(()=>__v.fresh('O',0,3,18));await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.advance(499));assert.equal((await page.evaluate(()=>__v.state())).count,0);await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).count,4);await page.keyboard.up('ArrowDown');
   await page.evaluate(()=>{__v.fresh('O',0,3,17);__v.advance(990);__v.frame(16);__v.advance(483);});assert.equal((await page.evaluate(()=>__v.state())).count,0);await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).count,4);
   const downSpins={};for(const method of ['hard','soft']){
    await page.evaluate(()=>{__v.fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])__v.a.put(__v.game(),x,y);});await page.keyboard.press('ArrowUp');
    assert.equal((await page.evaluate(()=>__v.a.ghost(__v.game()))),17);
    if(method==='soft'){await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.advance(560));await page.keyboard.up('ArrowDown');}
    const before=(await page.evaluate(()=>__v.state())).score;await page.keyboard.press('Space');downSpins[method]=(await page.evaluate(()=>__v.state())).score-before;
   }assert.deepEqual(downSpins,{hard:28,soft:0});
   const spinControls=[];for(const full of [false,true])for(const timed of [false,true]){
    await page.evaluate(full=>{__v.fresh('T',3,3,17);for(const[x,y]of [[5,17],[3,19],full?[3,17]:[5,19]])__v.a.put(__v.game(),x,y);},full);
    await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>__v.a.ghost(__v.game())-__v.state().active.y),0);
    if(timed)await page.evaluate(()=>__v.advance(500));else await page.keyboard.press('Space');spinControls.push({full,timed,actual:(await page.evaluate(()=>__v.state())).score,expected:full?400:100});
   }assert(spinControls.every(x=>x.actual===400));
   await page.evaluate(()=>{__v.fresh('T',1,3,16);for(const[x,y]of [[3,18],[5,18],[4,19]])__v.a.put(__v.game(),x,y);});await page.keyboard.press('ArrowUp');await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).score,400);
   await page.evaluate(()=>{__v.fresh('I',0,3,18);__v.game().scoring.lines=9;for(let x=0;x<10;x++)if(x<3||x>6)__v.a.put(__v.game(),x,19);});await page.keyboard.press('Space');const pcCrossing=await page.evaluate(()=>__v.state());assert.equal(pcCrossing.score,1700);assert.equal(pcCrossing.count,0);
   await page.evaluate(()=>{__v.fresh();const a=__v.a,g=__v.game();a.clear(g);for(const[x,y]of [[5,1],[3,1],[6,1]])a.put(g,x,y);a.spawn(g,'I');a.incoming(g,'T');});await page.keyboard.press('ArrowUp');const bufferPose=(await page.evaluate(()=>__v.state())).active;await page.keyboard.press('Space');const buffer=await page.evaluate(()=>__v.state());assert.deepEqual(bufferPose,{type:'I',rotation:1,x:4,y:-3});assert.equal(buffer.count,6);assert.equal(buffer.over,false);
   await page.evaluate(()=>{__v.fresh('S',1,-1,-2);__v.a.put(__v.game(),2,-2);__v.a.put(__v.game(),0,0);});await page.keyboard.press('z');const ceilingWall=(await page.evaluate(()=>__v.state())).active;assert.deepEqual(ceilingWall,{type:'S',rotation:0,x:-1,y:-4});
   await page.evaluate(()=>__v.fresh());let drops=0;while(!(await page.evaluate(()=>__v.state())).over&&drops<100){await page.keyboard.press('Space');drops++;}assert(drops<100);await page.evaluate(()=>__v.frame(0));assert(await page.locator('#overlay').isVisible());
   const terminal=await page.evaluate(()=>__v.state());for(const key of ['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','c'])await page.keyboard.press(key);assert.deepEqual(await page.evaluate(()=>__v.state()),terminal);
   await page.keyboard.press('r');await page.evaluate(()=>__v.frame(0));assert.equal(await page.locator('#overlay').isVisible(),false);const reset=await page.evaluate(()=>__v.state());assert.deepEqual([reset.over,reset.score,reset.lines,reset.level,reset.held,reset.canHold],[false,0,0,1,null,true]);
   const opening=[];for(let i=0;i<7;i++){opening.push((await page.evaluate(()=>__v.state())).active.type);await page.evaluate(()=>__v.a.clear(__v.game()));await page.keyboard.press('Space');}assert.equal(new Set(opening).size,7);
   await page.evaluate(()=>__v.fresh());await page.keyboard.press('p');await page.evaluate(()=>__v.frame(0));assert(await page.locator('#overlay').isVisible());await page.locator('#overlay').click();await page.evaluate(()=>__v.frame(0));assert.equal(await page.locator('#overlay').isVisible(),false);await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).count,4);
   await page.evaluate(()=>{__v.fresh('T',0,3,4);const g=__v.game();g.held='O';g.canHold=true;g.queue.splice(0,g.queue.length,'I','O','T','S','L');__v.frame(0);__v.paint();});
   await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,rect:rect(c)})),legend:getComputedStyle(document.querySelector('.controls')).display,previews:__draws.filter(d=>(d.canvas==='hold'||d.canvas==='next')&&d.w===20&&d.h===20),ghost:__draws.filter(d=>d.canvas==='board'&&d.alpha===.12)};});
   assert.equal(layout.scrollWidth,width);assert.equal(layout.previews.length,24);for(const d of layout.previews){const c=layout.canvases.find(c=>c.id===d.canvas);assert(d.x>=0&&d.y>=0&&d.x+20<=c.width&&d.y+20<=c.height);}
   for(const c of layout.canvases){assert(c.rect.x>=0&&c.rect.x+c.rect.width<=width);assert(Math.abs((c.rect.width/c.width)/(c.rect.height/c.height)-1)<.01);}
   const ghost=await page.evaluate(()=>__v.game().cellsOf(__v.game().ghost).map(c=>[c.x*30,(c.y-2)*30]));assert.deepEqual(layout.ghost.map(d=>[d.x,d.y]),ghost);
   await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:true});assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
   result.views[name]={controls:controls.map(x=>x.key),engine:{rotations:engine.rotations.mismatches,bags:engine.bags},soft,refresh,downSpins,spinControls,pcCrossing:pcCrossing.score,buffer:{pose:bufferPose,count:buffer.count},ceilingWall,restart:{drops,opening},layout,errors,assets};
  }finally{await context.close();}
 }}finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown);}
 console.log(JSON.stringify(result));return result;
}
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e);process.exit(1);});
module.exports={runBrowser};
