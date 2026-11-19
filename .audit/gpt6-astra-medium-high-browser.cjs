// Installed Playwright; baseline entry is unchanged. Instrumentation only adds accessors.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
async function main(base,artifacts,effort){
 const high=effort==='high',audit=await import(pathToFileURL(resolve(__dirname,'gpt6-astra-medium-high-audit.mjs')));
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
   await page.goto(base,{waitUntil:'networkidle'});
   if(high)await page.locator('#play').click();
   await page.keyboard.press('Space');
   await page.waitForFunction(()=>Number(document.querySelector('#score').textContent.replaceAll(',',''))>0);
   await page.screenshot({path:resolve(artifacts,name+'-baseline.png'),fullPage:true});
   await page.addInitScript(()=>{let seed=31415;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);window.requestAnimationFrame=cb=>{window.__frame=cb;return 1}});
   await page.route(new URL('dist/main.js',base).href,async route=>{
    const response=await route.fetch();
    const access=high?`window.__app={get game(){return game},reset(g){Object.assign(game,g.raw);clearInput();previousTime=0;previousStatus=''},render(){renderer.draw(game);updateUI(0)},get paused(){return game.status==='paused'}};`:`window.__app={get game(){return game},reset(g){game=g.raw;last=0;repeatTime=0;direction=0;keys.clear()},render:draw,get paused(){return game.paused}};`;
    await route.fulfill({response,body:(await response.text())+'\n'+access});
   });
   await page.reload({waitUntil:'networkidle'});
   const engine=await page.evaluate(async({factory,probe,normalizer,oracle,high})=>{
    let raw=await import('/dist/game.js');if(high)raw={...raw,...await import('/dist/pieces.js')};
    const m=(0,eval)('('+normalizer+')')(raw,high),adapter=(0,eval)('('+factory+')');
    const engine=new Function('adapter','m','oracle','return ('+probe+')(m,oracle)')(adapter,m,oracle),a=adapter(m);
    let now=0;
    const g=()=>m.wrap(__app.game),frame=dt=>{now+=dt;__frame(now)},advance=ms=>{while(ms>1e-8){const dt=Math.min(10,ms);frame(dt);ms-=dt}};
    const fresh=(kind='T',r=0,x=3,y=4)=>{now=0;__app.reset(a.make());a.clear(g());a.place(g(),kind,r,x,y);__app.render()};
    const state=()=>({pose:a.pose(g()),count:a.count(g()),score:g().score,held:g().held,used:g().usedHold,over:g().over});
    window.__v={a,g,frame,advance,fresh,state};fresh();return engine;
   },{factory:audit.adapter.toString(),probe:audit.probes.toString(),normalizer:audit.normalize.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks},high});
   const keys=[];
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
    const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);
    await page.evaluate(()=>__app.render());keys.push({key,before,after:await page.evaluate(()=>__v.state())});
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
    assert.equal(spins[kind].actual,{travel:high?28:128,mini:100,full:400}[kind]);
   }
   await page.evaluate(()=>__v.fresh('O',0,3,18));await page.evaluate(()=>__v.advance(100));
   for(let i=0;i<15;i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');
   const after15=await page.evaluate(()=>__v.state());assert.equal(after15.count,0);
   await page.evaluate(()=>__v.advance(499));const after499=await page.evaluate(()=>__v.state());assert.equal(after499.count,0);
   await page.evaluate(()=>__v.advance(1));assert.equal((await page.evaluate(()=>__v.state())).count,4);
   const ledges=[];
   for(const retained of [false,true]){
    await page.evaluate(()=>{__v.fresh('O',0,-1,12);__v.a.put(__v.g(),0,14);__v.a.put(__v.g(),1,14)});
    for(let i=0;i<(retained?15:14);i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');
    if(retained)await page.evaluate(()=>__v.advance(490));
    await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    const ledge=await page.evaluate(retained=>{const{g,frame,advance,state}=__v;let t=0;while(g().active.y<20&&t++<8000)frame(1);const resets=g().resets;if(!retained)advance(400);return{resets,land:t,before:state()}},retained);
    if(!retained)await page.keyboard.press('ArrowRight');
    await page.evaluate(retained=>__v.advance(retained?10:100),retained);ledge.after=await page.evaluate(()=>__v.state());
    assert.equal(ledge.after.count,retained&&!high?2:6);ledges.push({retained,...ledge});
   }
   const hidden=[];for(const partial of [false,true]){
    await page.evaluate(partial=>{const{fresh,a,g}=__v;fresh('O',0,-1,partial?-1:-2);a.put(g(),0,partial?1:0);g().queue[0]='I'},partial);
    await page.keyboard.press('Space');hidden.push({partial,state:await page.evaluate(()=>__v.state())});
   }
   assert.equal(hidden[0].state.over,high);assert.equal(hidden[1].state.over,false);
   const contact=await page.evaluate(()=>{__v.fresh('O',0,3,17);let ms=0;while(!__v.state().count&&ms<2000){__v.frame(100);ms+=100}return{actual:ms,expected:1500}});
   assert.equal(contact.actual,high?1500:1400);
   await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800)});
   await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));await page.keyboard.up('ArrowDown');
   const softEntry=await page.evaluate(()=>__v.state());assert.equal(softEntry.pose.y,high?1:17);assert.equal(softEntry.score,high?1:17);
   // Reachable failure path: softDrop cannot clear gravityTime while grounded.
   await page.evaluate(()=>{__v.fresh('O',0,-1,12);const{a,g}=__v;a.put(g(),0,14);a.put(g(),1,14);__v.advance(400)});
   await page.keyboard.press('ArrowRight');await page.evaluate(()=>__v.advance(400));
   await page.keyboard.down('ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.evaluate(()=>__v.frame(1));await page.keyboard.up('ArrowDown');
   const softEntryLedge=await page.evaluate(()=>__v.state());assert.equal(softEntryLedge.pose.y,18);assert.equal(softEntryLedge.score,6);
   const refresh=[];for(const hz of [60,144])refresh.push(await page.evaluate(hz=>{__v.fresh('O',0,3,1);for(let i=0;i<hz;i++)__v.frame(1100/hz);return{hz,state:__v.state()}},hz));
   for(const r of refresh)assert.equal(r.state.pose.y,2);
   await page.evaluate(()=>__v.fresh());const beforePause=await page.evaluate(()=>__v.state());
   await page.keyboard.press('p');await page.keyboard.press('Space');await page.evaluate(()=>__v.advance(2000));
   assert.deepEqual(await page.evaluate(()=>__v.state()),beforePause);await page.keyboard.press('p');await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).count,4);
   await page.evaluate(()=>{__v.fresh();window.dispatchEvent(new Event('blur'))});assert(await page.evaluate(()=>__app.paused));await page.keyboard.press('p');
   await page.evaluate(()=>__v.fresh());let drops=0;while(!(await page.evaluate(()=>__v.state().over))&&drops++<100)await page.keyboard.press('Space');assert(drops<100);
   await page.evaluate(()=>__app.render());const gameover=await page.evaluate(()=>({state:__v.state(),message:document.querySelector('#overlay').textContent,overlay:getComputedStyle(document.querySelector('#overlay')).display}));
   assert.notEqual(gameover.overlay,'none');assert(gameover.message.toLowerCase().includes('press r'));
   await page.keyboard.press('r');const restarted=await page.evaluate(()=>__v.state());assert.equal(restarted.count,0);assert.equal(restarted.score,0);assert.equal(restarted.over,false);
   const layout=await page.evaluate(()=>{
    const{a,g,fresh}=__v;fresh('O');g().hold();a.clear(g());a.place(g(),'T',0,3,4);__app.render();window.scrollTo(0,0);
    const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
    return{viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,board:rect(document.querySelector('#board')),hold:rect(document.querySelector('#hold')),next:rect(document.querySelector('#next')),footer:rect(document.querySelector('footer')),held:g().held,overlay:getComputedStyle(document.querySelector('#overlay')).display};
   });
   assert.equal(layout.scrollWidth,width);assert.equal(layout.held,'O');assert.equal(layout.overlay,'none');assert.equal(layout.next.width===0,!high&&name==='mobile');
   await page.screenshot({path:resolve(artifacts,name+'.png'),fullPage:true});
   // Header buttons must release Space for the next hard drop.
   await page.evaluate(()=>__v.fresh());await page.locator('#pause').click();await page.locator('#pause').click();
   const beforeButtonSpace=await page.evaluate(()=>__v.state());await page.keyboard.press('Space');const afterButtonSpace=await page.evaluate(()=>__v.state());
   assert.equal(afterButtonSpace.count,4);
   assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
   out.views[name]={baseline:{started:true,hardDropPointsPositive:true},engine,keys,spins,lockCap:{after15,after499},ledges,hidden,contact,softEntry,softEntryLedge,refresh,pauseAndBlur:'pass',gameover,restarted,layout,buttonSpace:{before:beforeButtonSpace,after:afterButtonSpace},errors,failedAssets};
  }finally{await context.close()}
 }}finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown)}
 console.log(JSON.stringify(out));
}
main(...process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1});
