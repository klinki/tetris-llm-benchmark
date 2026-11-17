// Actual Chromium keys; observation-only served response seams, no delivered edits.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
async function runBrowser(base,mode,artifacts,record){
 const audit=await import(pathToFileURL(resolve(__dirname,'gpt62-sol-audit.mjs'))),browser=await chromium.launch({headless:true}),out={mode,browser:browser.version(),views:{}};
 const shutdown=async()=>{await browser.close();process.exit(130);};process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
 try{for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height}});
 try{const page=await context.newPage(),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push(r.url());});page.on('requestfailed',r=>assets.push(r.url()));
 await page.addInitScript(()=>{window.__now=0;Object.defineProperty(performance,'now',{value:()=>__now});window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.__draws=[];for(const method of ['fillRect','strokeRect']){const old=CanvasRenderingContext2D.prototype[method];CanvasRenderingContext2D.prototype[method]=function(...args){__draws.push({method,canvas:this.canvas.id,args,color:method==='strokeRect'?this.strokeStyle:this.fillStyle});return old.apply(this,args);};}});
 const main=mode==='high'?'main.js':'dist/main.js';
 await page.route(new URL(main,base).href,async route=>{const response=await route.fetch(),body=await response.text();const seam=mode==='low'?`window.__app={get game(){return game},reset(g){game=g;last=0},render};`:mode==='medium'?`window.__app={get game(){return game},reset(g){game=g;previousFrame=0;drawnState='';drawnTurn=-1;setMode('playing')},render};`:`window.__app={get game(){return game},reset(g){game=g;lastFrame=0;pressed.clear();setState('playing')},render};`;await route.fulfill({response,body:body+'\n'+seam});});
 await page.goto(base,{waitUntil:'networkidle'});
 const engine=await page.evaluate(async({mode,factory,probe,oracle})=>{
 const prefix=mode==='high'?'/':'/dist/',m={game:await import(prefix+'game.js'),pieces:mode==='low'?null:await import(prefix+'pieces.js')},a=(0,eval)(`(${factory})`)(m,mode),e=(0,eval)(`(${probe})`)(a,oracle);
 let time=0;const g=()=>__app.game,frame=dt=>{time+=dt;__now=time;__draws.length=0;__frame(time);};
 const fresh=(type=a.types[0],r=0,x=4,y=5)=>{time=0;__now=0;__app.reset(a.make());a.clear(g());a.place(g(),type,r,x,y);__draws.length=0;__app.render();};
 const advance=ms=>{while(ms>1e-8){const dt=Math.min(16,ms);frame(dt);ms-=dt;}};
 const state=()=>({active:a.active(g()),count:a.count(g()),score:g().score,held:g().held,over:g().over});window.__v={a,g,fresh,frame,advance,state};fresh();return e;
 },{mode,factory:audit.createAdapter.toString(),probe:audit.runProbes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
 if(!record)audit.assertRecorded(engine);
 const keys=[];for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);await page.evaluate(()=>__v.frame(0));keys.push({key,before,after:await page.evaluate(()=>__v.state())});}
 assert.equal(keys[0].after.active.x,keys[0].before.active.x-1);assert.equal(keys[1].after.active.x,keys[1].before.active.x+1);for(let i=2;i<6;i++)assert.equal(keys[i].after.active.rotation,(keys[i].before.active.rotation+(i<4?1:3))%4);assert.equal(keys[6].after.score,keys[6].before.score+1);assert(keys[7].after.count>0);assert.notEqual(keys[8].after.held,null);
 const spins={};if(mode==='medium')for(const kind of ['travel','mini','full']){
 await page.evaluate(kind=>{const{a,g,fresh}=__v;if(kind==='travel'){fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])a.put(g(),x,y);}else{fresh('T',3,3,17);for(const[x,y]of [[5,17],[3,19],kind==='full'?[3,17]:[5,19]])a.put(g(),x,y);}},kind);
 await page.keyboard.press('ArrowUp');const distance=await page.evaluate(()=>__v.a.ghost(__v.g())-__v.state().active.y);await page.keyboard.press('Space');spins[kind]={distance,score:(await page.evaluate(()=>__v.state())).score};assert.equal(spins[kind].score,{travel:28,mini:100,full:400}[kind]);}
 const clocks={};
 await page.evaluate(()=>{const{a,g,fresh}=__v;fresh();const p=a.active(g());a.place(g(),p.type,0,4,a.H-1-Math.max(...a.local(p.type,0).map(c=>c[1])));});
 for(let i=0;i<15;i++)await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');
 clocks.after15=await page.evaluate(()=>__v.state().count);
 assert.equal(clocks.after15,mode==='medium'?4:0);
 const timedSpins={};if(mode==='medium')for(const full of [false,true]){await page.evaluate(full=>{const{a,g,fresh}=__v;fresh('T',3,3,17);for(const[x,y]of [[5,17],[3,19],full?[3,17]:[5,19]])a.put(g(),x,y);},full);await page.keyboard.press('ArrowUp');await page.evaluate(()=>__v.advance(500));timedSpins[full?'full':'mini']=(await page.evaluate(()=>__v.state())).score;assert.equal(timedSpins[full?'full':'mini'],full?400:100);}
 let pause=null;if(mode!=='low'){await page.evaluate(()=>__v.fresh());await page.keyboard.press(mode==='medium'?'Escape':'p');const before=await page.evaluate(()=>__v.state());await page.keyboard.press('ArrowLeft');await page.evaluate(()=>__v.advance(1000));pause=await page.evaluate(()=>__v.state());assert.deepEqual(pause,before);await page.keyboard.press(mode==='medium'?'Escape':'p');}
 await page.evaluate(()=>__v.fresh());let drops=0;while(!(await page.evaluate(()=>__v.state().over))&&drops++<100)await page.keyboard.press('Space');assert(drops<100);await page.keyboard.press('r');await page.evaluate(()=>__v.frame(0));const reset=await page.evaluate(()=>__v.state());assert.equal(reset.over,false);assert.equal(reset.score,0);assert.equal(reset.count,0);
 const display=await page.evaluate(()=>{const{a,g,fresh}=__v;fresh();a.hold(g());a.clear(g());a.place(g(),a.types[0],0,4,5);__draws.length=0;__app.render();window.scrollTo(0,0);const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};const p=a.active(g()),ghost=a.cells({...p,y:a.ghost(g())}),size=document.querySelector('#board').width/a.W,offset=a.mode==='low'?2:a.mode==='medium'?4:3,expected=ghost.map(([x,y])=>[x*size+offset,y*size+offset]),actual=__draws.filter(d=>d.canvas==='board'&&d.method==='strokeRect').map(d=>d.args.slice(0,2));return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,backing:[c.width,c.height],rect:rect(c)})),ghost:{actual,expected},previews:[...document.querySelectorAll('#next .mini i')].length,draws:__draws.filter(d=>d.canvas!=='board')};});
 assert.deepEqual(display.ghost.actual.sort(),display.ghost.expected.sort());
 await page.screenshot({path:resolve(artifacts,`${mode}-${name}.png`),fullPage:true});assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
 out.views[name]={engine,keys,spins,timedSpins,clocks,pause,reset,layout:display,errors,assets};
 }finally{await context.close();}}
 }finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown);}console.log(JSON.stringify(out));return out;
}
module.exports={runBrowser};if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
