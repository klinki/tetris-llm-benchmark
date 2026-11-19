// Installed Playwright; response instrumentation adds accessors only, no rule edits.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
async function main(base,artifacts,effort){
 const high=effort==='xhigh',max=!high;
 const audit=await import(pathToFileURL(resolve(__dirname,'gpt62-astra-xhigh-max-audit.mjs'))),browser=await chromium.launch({headless:true});
 const out={browser:browser.version(),views:{}};
 const shutdown=async()=>{await browser.close();process.exit(130)};process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
 try{for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height}});
 try{const page=await context.newPage(),errors=[],failedAssets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failedAssets.push(r.url())});page.on('requestfailed',r=>failedAssets.push(r.url()));
 await page.addInitScript(()=>{let seed=31415;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);window.__now=0;Object.defineProperty(performance,'now',{value:()=>__now});window.requestAnimationFrame=cb=>{window.__frame=cb;return 1}});
 await page.goto(base,{waitUntil:'networkidle'});
 const overlay=high?'#overlay':'#prompt',pause=high?'#pause':'#pause-button',sound=high?'#audio':'#sound-button';
 const baseline={title:await page.title(),overlay:await page.locator(overlay).isVisible()};assert(baseline.overlay);await page.keyboard.press('Enter');assert.equal(await page.locator(overlay).isVisible(),false);
 await page.route(new URL(high?'dist/app.js':'main.js',base).href,async route=>{const response=await route.fetch();const access=high?'window.__app={get game(){return game},reset(g){game=g;setPhase("playing");previous=0;lastView=""},render(){render(true)}};':'window.__app={get game(){return game},reset(g){game=g;lastPlacement=null;flashRows=[];setScreen("playing");previousTime=0},render};';await route.fulfill({response,body:(await response.text())+'\n'+access});});
 await page.reload({waitUntil:'networkidle'});
 const engine=await page.evaluate(async({factory,probe,oracle,effort})=>{
 const root=effort==='xhigh'?'/dist/':'/';const m={...await import(root+'game.js'),...await import(root+'pieces.js'),effort};const adapter=(0,eval)('('+factory+')'),run=new Function('adapter','m','oracle','return ('+probe+')(m,oracle)'),e=run(adapter,m,oracle),a=adapter(m);let now=0;
 const g=()=>a.wrap(__app.game),frame=dt=>{now+=dt;__now=now;__frame(now)},advance=ms=>{while(ms>1e-8){const dt=Math.min(10,ms);frame(dt);ms-=dt}};
 const fresh=(kind='T',r=0,x=3,y=4)=>{now=0;__now=0;__app.reset(a.make().raw);a.clear(g());a.place(g(),kind,r,x,y);__app.render()};
 const state=()=>({pose:a.pose(g()),count:a.count(g()),score:g().score,held:g().held,used:g().used,over:g().over});window.__v={a,g,frame,advance,fresh,state};fresh();return e;
 },{effort,factory:audit.adapter.toString(),probe:audit.probes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
 const keys=[];for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);keys.push({key,before,after:await page.evaluate(()=>__v.state())})}
 assert.equal(keys[0].after.pose.x,keys[0].before.pose.x-1);assert.equal(keys[1].after.pose.x,keys[1].before.pose.x+1);for(let i=2;i<6;i++)assert.equal(keys[i].after.pose.r,(keys[i].before.pose.r+(i<4?1:3))%4);assert.equal(keys[6].after.score,keys[6].before.score+1);assert.equal(keys[7].after.count,4);assert(keys[8].after.held);
 const spins={};for(const kind of ['travel','mini','full']){
 await page.evaluate(kind=>{const{a,g,fresh}=__v;if(kind==='travel'){fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])a.put(g(),x,y)}else{fresh('T',3,3,17);for(const[x,y]of [[5,17],[3,19],kind==='full'?[3,17]:[5,19]])a.put(g(),x,y)}},kind);
 await page.keyboard.press('ArrowUp');const distance=await page.evaluate(()=>__v.g().ghost-__v.g().y);await page.keyboard.press('Space');spins[kind]={distance,actual:(await page.evaluate(()=>__v.state())).score,expected:{travel:28,mini:100,full:400}[kind]};assert.equal(spins[kind].actual,spins[kind].expected);
 }
 await page.evaluate(()=>__v.fresh('O',0,3,18));await page.evaluate(()=>__v.advance(100));for(let i=0;i<14;i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');const after14=await page.evaluate(()=>__v.state());assert.equal(after14.count,0);await page.keyboard.press('ArrowRight');const after15=await page.evaluate(()=>__v.state());assert.equal(after15.count,high?0:4);await page.evaluate(()=>__v.advance(1));const after1=await page.evaluate(()=>__v.state());assert.equal(after1.count,4);
 await page.evaluate(()=>{__v.fresh('O',0,0,12);__v.a.put(__v.g(),0,14)});
 for(let i=0;i<14;i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');await page.keyboard.press('ArrowRight');
 const ledge=await page.evaluate(()=>{const{g,frame,advance,state}=__v;let t=0;while(g().y<38&&t++<8000)frame(1);const resets=g().resets;advance(400);return{resets,before:state()}});await page.keyboard.press('ArrowRight');await page.evaluate(()=>__v.advance(100));ledge.after=await page.evaluate(()=>__v.state());assert.equal(ledge.resets,0);assert.equal(ledge.after.count,1);
 const hidden=[];for(const partial of [false,true]){await page.evaluate(partial=>{const{fresh,a,g}=__v;fresh('O',0,0,partial?-1:-2);a.put(g(),0,partial?1:0);g().queue[0]='I'},partial);await page.keyboard.press('Space');hidden.push({partial,state:await page.evaluate(()=>__v.state())})}
 const contact=await page.evaluate(()=>{__v.fresh('O',0,3,17);let ms=0;while(!__v.state().count&&ms<2000){__v.frame(100);ms+=100}return{actual:ms,expected:1500}});
 await page.evaluate(()=>__v.fresh());let drops=0;while(!(await page.evaluate(()=>__v.state().over))&&drops++<100)await page.keyboard.press('Space');assert(drops<100);
 const gameover={state:await page.evaluate(()=>__v.state()),overlay:await page.locator(overlay).isVisible()};assert(gameover.overlay);await page.keyboard.press('r');const restarted=await page.evaluate(()=>__v.state());assert.equal(restarted.count,0);assert.equal(restarted.score,0);assert.equal(restarted.over,false);
 // Pause/resume, focused header Space, and visible touch buttons.
 await page.evaluate(()=>__v.fresh());await page.keyboard.press('p');const paused=await page.evaluate(()=>__v.state());await page.evaluate(()=>__v.advance(1000));assert.deepEqual(await page.evaluate(()=>__v.state()),paused);await page.keyboard.press('p');
 await page.locator(pause).click();await page.locator(pause).click();const focusedBefore=await page.evaluate(()=>__v.state());await page.keyboard.press('Space');const focusedAfter=await page.evaluate(()=>__v.state());assert.equal(focusedAfter.count,focusedBefore.count+4);
 await page.locator(sound).click();const soundBefore=await page.locator(sound).getAttribute('aria-pressed'),soundState=await page.evaluate(()=>__v.state());await page.keyboard.press('Space');const soundAfter=await page.locator(sound).getAttribute('aria-pressed'),soundFinal=await page.evaluate(()=>__v.state());assert.equal(soundFinal.count,soundState.count+(high?0:4));if(high)assert.notEqual(soundAfter,soundBefore);else assert.equal(soundAfter,soundBefore);
 const touch=[];if(name==='mobile')for(const code of high?['left','right','ccw','cw','down','drop','hold']:['ArrowLeft','ArrowRight','KeyZ','KeyX','ArrowDown','Space','hold']){await page.evaluate(()=>__v.fresh());const before=await page.evaluate(()=>__v.state());await page.locator(high?'[data-action="'+code+'"]':code==='hold'?'#hold-button':'[data-code="'+code+'"]').click();const after=await page.evaluate(()=>__v.state());assert.notDeepEqual(after,before);touch.push({code,before,after})}
 const layout=await page.evaluate(high=>{const{a,g,fresh}=__v;fresh();g().hold();a.clear(g());a.place(g(),'T',0,3,4);__app.render();window.scrollTo(0,0);const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}},board=document.querySelector('#board'),canvases=[document.querySelector('#held'),...document.querySelectorAll(high?'#queue canvas':'.queue canvas')],c=board.getContext('2d'),ghost=a.local(g().kind,g().r).map(([x,y])=>[x+g().x,y+g().ghost-20]),rgba=(x,y)=>[...c.getImageData(Math.floor(x*board.width/10),Math.floor(y*board.height/20),1,1).data];return{viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,board:rect(board),previewCells:canvases.map(n=>({id:n.id,rect:rect(n),backing:[n.width,n.height],objectFit:getComputedStyle(n).objectFit,rawAspect:(n.getBoundingClientRect().width/n.width)/(n.getBoundingClientRect().height/n.height)})),buttons:document.querySelectorAll('button').length,nextPieces:g().queue.slice(0,3),held:g().held,ghost:ghost.map(([x,y])=>({cell:[x,y],edge:rgba(x+.07,y+.1),center:rgba(x+.5,y+.5)})),score:document.querySelector('#score').textContent,overlay:!document.querySelector(high?'#overlay':'#prompt').hidden}},high);
 assert.equal(layout.nextPieces.length,3);assert.equal(layout.held,'T');assert.equal(layout.overlay,false);assert.equal(layout.scrollWidth,width);for(const p of layout.ghost)assert.notDeepEqual(p.edge,p.center);
 for(const p of layout.previewCells)assert(p.objectFit==='contain'||Math.abs(p.rawAspect-1)<.01);
 await page.evaluate(()=>{__v.g().held='O';__app.render()});await page.screenshot({path:resolve(artifacts,name+'-held-O.png'),fullPage:true});await page.evaluate(()=>{__v.g().held='T';__app.render()});
 await page.screenshot({path:resolve(artifacts,name+'.png'),fullPage:true});assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
 out.views[name]={baseline,engine,keys,spins,lockCap:{after14,after15,after1},ledge,hidden,contact,gameover,restarted,focusedSpace:{before:focusedBefore,after:focusedAfter},touch,soundSpace:{before:soundState,after:soundFinal,soundBefore,soundAfter},layout,errors,failedAssets};
 }finally{await context.close()}}
 }finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown)}
 console.log(JSON.stringify(out));
}
main(...process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1});
