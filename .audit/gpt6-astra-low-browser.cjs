// Installed Playwright/Chromium only. Response appends state accessors, no rule edits.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
async function main(base,artifacts){
 const audit=await import(pathToFileURL(resolve(__dirname,'gpt6-astra-low-audit.mjs')));
 const browser=await chromium.launch({headless:true}),out={browser:browser.version(),views:{}};
 const shutdown=async()=>{await browser.close();process.exit(130)};
 process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
 try{for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height}});
  try{
   const page=await context.newPage(),errors=[],failedAssets=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failedAssets.push(r.url())});
   page.on('requestfailed',r=>failedAssets.push(r.url()));
   // First load is wholly uninstrumented, including the delivered RAF clock.
   await page.goto(base,{waitUntil:'networkidle'});
   await page.locator('#play').click();await page.keyboard.press('Space');
   const baseline=await page.evaluate(()=>({score:document.querySelector('#score').textContent,overlay:getComputedStyle(document.querySelector('#overlay')).display}));
   assert(Number(baseline.score)>0);assert.equal(baseline.overlay,'none');
   await page.screenshot({path:resolve(artifacts,name+'-baseline.png'),fullPage:true});
   await page.addInitScript(()=>{let seed=31415;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);window.requestAnimationFrame=cb=>{window.__frame=cb;return 1}});
   await page.route(new URL('dist/main.js',base).href,async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text())+'\nwindow.__app={get game(){return game},reset(g){game=g;started=true;paused=false;last=0;repeat=0;keys.clear()},render:draw,get paused(){return paused}};'});
   });
   await page.reload({waitUntil:'networkidle'});
   const engine=await page.evaluate(async({factory,probe,oracle})=>{
    const m=await import('/dist/game.js'),adapter=(0,eval)('('+factory+')');
    const e=new Function('adapter','m','oracle','return ('+probe+')(m,oracle)')(adapter,m,oracle),a=adapter(m);
    let now=0;
    const g=()=>__app.game,frame=dt=>{now+=dt;__frame(now)},advance=ms=>{while(ms>1e-8){const dt=Math.min(10,ms);frame(dt);ms-=dt}};
    const fresh=(kind='T',r=0,x=3,y=4)=>{now=0;__app.reset(a.make());a.clear(g());a.place(g(),kind,r,x,y);__app.render()};
    const state=()=>({pose:a.pose(g()),count:a.count(g()),score:g().score,held:g().held,used:g().usedHold,over:g().over});
    window.__v={a,g,frame,advance,fresh,state};fresh();return e;
   },{factory:audit.adapter.toString(),probe:audit.probes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
   const keys=[];
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
    const before=await page.evaluate(()=>__v.state());
    if(key==='ArrowDown'){await page.keyboard.down(key);await page.evaluate(()=>__v.advance(50));await page.keyboard.up(key)}else await page.keyboard.press(key);
    keys.push({key,before,after:await page.evaluate(()=>__v.state())});
   }
   assert.equal(keys[0].after.pose.x,keys[0].before.pose.x-1);assert.equal(keys[1].after.pose.x,keys[1].before.pose.x+1);
   for(let i=2;i<6;i++)assert.equal(keys[i].after.pose.r,(keys[i].before.pose.r+(i<4?1:3))%4);
   assert.equal(keys[6].after.score,keys[6].before.score+1);assert.equal(keys[7].after.count,4);assert(keys[8].after.held);
   const spins={};
   for(const kind of ['travel','mini','full']){
    await page.evaluate(kind=>{const{a,g,fresh}=__v;
     if(kind==='travel'){fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])a.put(g(),x,y)}
     else{fresh('T',3,3,17);for(const[x,y]of [[5,17],[3,19],kind==='full'?[3,17]:[5,19]])a.put(g(),x,y)}
    },kind);
    await page.keyboard.press('ArrowUp');
    const distance=await page.evaluate(()=>__v.g().ghost().y-__v.g().active.y);await page.keyboard.press('Space');
    spins[kind]={distance,actual:(await page.evaluate(()=>__v.state())).score,expected:{travel:28,mini:100,full:400}[kind]};
    assert.equal(spins[kind].actual,{travel:128,mini:100,full:400}[kind]);
   }
   await page.evaluate(()=>__v.fresh('O',0,3,18));await page.evaluate(()=>__v.advance(100));
   for(let i=0;i<15;i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');
   const after15=await page.evaluate(()=>__v.state());assert.equal(after15.count,0);
   await page.evaluate(()=>__v.advance(499));const after499=await page.evaluate(()=>__v.state());assert.equal(after499.count,0);
   await page.evaluate(()=>__v.advance(1));assert.equal((await page.evaluate(()=>__v.state())).count,4);
   await page.evaluate(()=>{__v.fresh('O',0,-1,12);__v.a.put(__v.g(),0,14);__v.a.put(__v.g(),1,14)});
   for(let i=0;i<14;i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');
   await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
   const ledge=await page.evaluate(()=>{const{g,frame,advance,state}=__v;let t=0;while(g().active.y<20&&t++<8000)frame(1);const resets=g().resets;advance(400);return{resets,before:state()}});
   await page.keyboard.press('ArrowRight');await page.evaluate(()=>__v.advance(100));ledge.after=await page.evaluate(()=>__v.state());assert.equal(ledge.after.count,6);
   const hidden=[];
   for(const partial of [false,true]){
    await page.evaluate(partial=>{const{fresh,a,g}=__v;fresh('O',0,-1,partial?-1:-2);a.put(g(),0,partial?1:0);g().queue[0]='I'},partial);
    await page.keyboard.press('Space');hidden.push({partial,state:await page.evaluate(()=>__v.state())});
   }
   assert.equal(hidden[0].state.over,false);assert.equal(hidden[1].state.over,false);
   const contact=await page.evaluate(()=>{__v.fresh('O',0,3,17);let ms=0;while(!__v.state().count&&ms<2000){__v.frame(50);ms+=50}return{actual:ms,expected:1500}});
   assert.equal(contact.actual,1450);
   await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800)});
   await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));await page.keyboard.up('ArrowDown');
   const softEntry=await page.evaluate(()=>__v.state());assert.equal(softEntry.pose.y,16);assert.equal(softEntry.score,16);
   const refresh=[];
   for(const hz of [60,144])refresh.push(await page.evaluate(hz=>{__v.fresh('O',0,3,1);for(let i=0;i<hz;i++)__v.frame(1100/hz);return{hz,state:__v.state()}},hz));
   for(const r of refresh)assert.equal(r.state.pose.y,2);
   await page.evaluate(()=>__v.fresh());const beforePause=await page.evaluate(()=>__v.state());
   await page.keyboard.press('p');await page.keyboard.press('Space');await page.evaluate(()=>__v.advance(2000));
   assert.deepEqual(await page.evaluate(()=>__v.state()),beforePause);await page.keyboard.press('p');
   await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).count,4);
   await page.evaluate(()=>{__v.fresh();window.dispatchEvent(new Event('blur'))});assert(await page.evaluate(()=>__app.paused));
   await page.keyboard.press('p');
   await page.evaluate(()=>__v.fresh());let drops=0;
   while(!(await page.evaluate(()=>__v.state().over))&&drops++<100)await page.keyboard.press('Space');assert(drops<100);
   const gameover=await page.evaluate(()=>({state:__v.state(),message:document.querySelector('#overlay').textContent,overlay:getComputedStyle(document.querySelector('#overlay')).display}));
   assert.equal(gameover.overlay,'flex');assert(gameover.message.includes('Press R'));
   await page.keyboard.press('r');const restarted=await page.evaluate(()=>__v.state());assert.equal(restarted.count,0);assert.equal(restarted.score,0);assert.equal(restarted.over,false);
   const layout=await page.evaluate(()=>{
    const{a,g,fresh}=__v;fresh('O');g().hold();a.clear(g());a.place(g(),'T',0,3,4);__app.render();window.scrollTo(0,0);
    const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
    const board=document.querySelector('#board'),c=board.getContext('2d'),ghost=a.local(g().active.kind,g().active.r).map(([x,y])=>[x+g().active.x,y+g().ghost().y-2]),rgba=(x,y)=>[...c.getImageData(x,y,1,1).data];
    return{viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,board:rect(board),hold:rect(document.querySelector('#hold')),next:rect(document.querySelector('#next')),footer:rect(document.querySelector('footer')),nextPieces:g().queue.slice(0,5),held:g().held,ghost:ghost.map(([x,y])=>({cell:[x,y],edge:rgba(x*30+2,y*30+3),center:rgba(x*30+15,y*30+15)})),overlay:getComputedStyle(document.querySelector('#overlay')).display};
   });
   assert.equal(layout.scrollWidth,width);assert.equal(layout.held,'O');assert.equal(layout.overlay,'none');assert.equal(layout.nextPieces.length,5);
   for(const p of layout.ghost)assert.notDeepEqual(p.edge,p.center);
   await page.screenshot({path:resolve(artifacts,name+'.png'),fullPage:true});
   assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
   // Real-clock baseline has variable score. Record a stable successful-start fact only.
   out.views[name]={baseline:{started:true,hardDropPointsPositive:true},engine,keys,spins,lockCap:{after15,after499},ledge,hidden,contact,softEntry,refresh,pauseAndBlur:'pass',gameover,restarted,layout,errors,failedAssets};
  }finally{await context.close()}
 }}finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown)}
 console.log(JSON.stringify(out));
}
main(...process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1});
