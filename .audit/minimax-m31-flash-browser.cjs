// Reproducible Chromium checks, using unchanged served application bodies.
const {chromium}=require('../node_modules/playwright');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
function bootstrap(){window.__now=0;Object.defineProperty(performance,'now',{value:()=>__now});window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.__draws=[];for(const method of ['fillRect','strokeRect','roundRect','fillText','moveTo','fill']){const old=CanvasRenderingContext2D.prototype[method];CanvasRenderingContext2D.prototype[method]=function(...args){__draws.push({method,canvas:this.canvas.id,args,alpha:this.globalAlpha,color:this.fillStyle});return old.apply(this,args);};}}
function instrument(copy,mode,root){
 const audit=fs.readFileSync(resolve(root,'.audit/minimax-m31-flash-audit.mjs'),'utf8');
 const oracle=fs.readFileSync(resolve(root,'.audit/opus55-efforts-audit.mjs'),'utf8');
 const constants=oracle.slice(oracle.indexOf('export const reference'),oracle.indexOf('// This factory'));
 fs.writeFileSync(resolve(copy,'dist/__audit.js'),constants+audit.slice(audit.indexOf('export function createAdapter'),audit.indexOf('export function assertRecorded')));
 const main=resolve(copy,'dist/main.js'),s=fs.readFileSync(main,'utf8');
 const clock=mode==='max'?'previousTime':'last';
 const expose=`window.__app={game,renderer,resetClock(){${clock}=0;window.__now=0;}};\n`;
 const target=mode==='max'?'let previousTime': 'let last';fs.writeFileSync(main,s.replace(target,expose+target));
 const html=resolve(copy,'dist/index.html');fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('<head>',`<head><script>(${bootstrap.toString()})();</script>`));
}
async function setup(mode){
 const mod=await import('/__audit.js'),prefix=mode==='low'?'':'core/';
 const a=mod.createAdapter({game:await import('/'+prefix+'game.js'),pieces:await import('/'+prefix+'pieces.js'),board:await import('/'+prefix+'board.js'),bag:await import('/'+prefix+(mode==='xhigh'?'bag.js':'randomizer.js'))},mode);
 const evidence=mod.runProbes(a,mod);let time=0;
 const fresh=(t='T',r=0,x=3,y=5)=>{Object.assign(__app.game,a.make(42));__app.resetClock();time=0;a.clear(__app.game);a.place(__app.game,t,r,x,y);frame(0);};
 const frame=dt=>{time+=dt;window.__now=time;__draws.length=0;__frame(time);};
 const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
 const state=()=>({active:a.active(__app.game),count:a.count(__app.game),score:__app.game.score,held:a.held(__app.game),over:a.over(__app.game)});
 window.__v={a,g:__app.game,fresh,frame,advance,state,evidence};fresh();return evidence;
}
function scenario(name){
 const {a,g,fresh,frame,advance,state}=__v;
 if(name==='travel'){fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])a.put(g,x,y);}
 if(name==='mini'||name==='full'){fresh('T',3,3,17);for(const[x,y]of [[5,17],[3,19],name==='full'?[3,17]:[5,19]])a.put(g,x,y);}
 if(name==='soft'){fresh('O',0,3,0);advance(800);}
 if(name==='landing'){fresh('O',0,3,17);advance(990);frame(16);advance(483);}
 if(name==='pc'){fresh('I',0,3,18);for(let x=0;x<10;x++)if(x<3||x>6)a.put(g,x,19);}
 if(name==='display'){fresh();a.hold(g);a.clear(g);a.place(g,'T',0,3,4);frame(0);window.scrollTo(0,0);}
 return state();
}
function renderChecks(mode){
 const {a,g}=__v,p=a.active(g),ghost=a.cells({...p,y:a.ghost(g)}),key=cs=>cs.map(c=>c.join(',')).sort().join(' ');let actual,expected,previews;
 if(mode==='max'){actual=__draws.filter(d=>d.canvas==='board'&&d.method==='strokeRect'&&d.args[2]===26).map(d=>[d.args[0]-2,d.args[1]-2]);expected=ghost.map(([x,y])=>[x*30,y*30]);previews=__draws.filter(d=>d.canvas==='panel'&&d.method==='fillRect'&&d.args[2]===18&&d.args[3]===18).length;}
 if(mode==='low'){actual=__draws.filter(d=>d.method==='strokeRect'&&d.args[2]===24).map(d=>[d.args[0]-2,d.args[1]-2]);expected=ghost.map(([x,y])=>[x*28,y*28]);previews=__draws.filter(d=>d.method==='fillRect'&&d.args[0]>=280&&d.args[2]===d.args[3]&&d.args[2]<=13).length;}
 if(mode==='high'){const well=__draws.find(d=>d.method==='fillRect'&&d.color==='#161b24'),[x,y,w]=well.args,cell=w/10;actual=__draws.filter(d=>d.method==='strokeRect'&&d.alpha===.55).map(d=>[d.args[0]-2.5,d.args[1]-2.5]);expected=ghost.map(([xx,yy])=>[x+xx*cell,y+yy*cell]);previews=__draws.filter(d=>d.method==='roundRect'&&d.alpha===1&&d.args[0]>x+w&&d.args[2]===d.args[3]).length;}
 if(mode==='xhigh'){actual=__draws.filter(d=>d.canvas==='board'&&d.method==='roundRect'&&d.alpha===.35).map(d=>[d.args[0]-2,d.args[1]-2]);expected=ghost.map(([x,y])=>[x*30,y*30]);previews=__draws.filter(d=>(d.canvas==='hold'||d.canvas==='next')&&d.method==='roundRect'&&d.args[2]===d.args[3]).length;}
 if(mode==='medium'){actual=__draws.filter(d=>d.canvas==='board'&&d.method==='moveTo'&&d.alpha===.35).map(d=>[d.args[0]-4,d.args[1]-1]);expected=ghost.map(([x,y])=>[x*26,y*26]);previews=__draws.filter(d=>(d.canvas==='hold'||d.canvas==='next')&&d.method==='fill'&&!d.color.startsWith('rgba')).length;}
 return {actual,expected,ghostMatches:key(actual)===key(expected),previews};
}
function layout(){const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,rect:rect(c)})),draws:__draws.filter(d=>d.method==='strokeRect'||d.method==='roundRect'||d.method==='fillText'||d.method==='fillRect'&&d.args[2]===d.args[3])};}
async function runBrowser(base,mode,artifacts){
 const audit=await import(pathToFileURL(resolve(__dirname,'minimax-m31-flash-audit.mjs'))),browser=await chromium.launch({headless:true}),out={mode,browser:browser.version(),views:{}};
 const shutdown=async()=>{await browser.close();process.exit(130);};process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
 try{for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]){const context=await browser.newContext({viewport:{width,height}});try{const page=await context.newPage(),errors=[],assets=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push(r.url());});await page.goto(base,{waitUntil:'networkidle'});const engine=await page.evaluate(setup,mode);audit.assertRecorded(engine);
 const keys=[];for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);await page.evaluate(()=>__v.frame(1));keys.push({key,before,after:await page.evaluate(()=>__v.state())});}
 assert.equal(keys[0].after.active.x,keys[0].before.active.x-1);assert.equal(keys[1].after.active.x,keys[1].before.active.x+1);for(let i=2;i<6;i++)assert.equal(keys[i].after.active.rotation,(keys[i].before.active.rotation+(i<4?1:mode==='medium'&&i===5?0:3))%4);
 const spins={};for(const kind of ['travel','mini','full']){await page.evaluate(scenario,kind);await page.keyboard.press('ArrowUp');const distance=await page.evaluate(()=>__v.a.ghost(__v.g)-__v.state().active.y);await page.keyboard.press('Space');spins[kind]={distance,score:(await page.evaluate(()=>__v.state())).score};}assert.equal(spins.travel.distance,14);assert.equal(spins.travel.score,engine.scores.hardDownExtra);assert.equal(spins.mini.score,engine.scores['hard-mini-zero']);assert.equal(spins.full.score,engine.scores['hard-full-zero']);
 await page.evaluate(scenario,'soft');await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));const soft=await page.evaluate(()=>__v.state());await page.keyboard.up('ArrowDown');
 await page.evaluate(scenario,'pc');await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).score,engine.scores.pc1);
 await page.evaluate(()=>__v.fresh());let drops=0;while(!(await page.evaluate(()=>__v.state())).over&&drops++<100){await page.keyboard.press('Space');await page.evaluate(()=>__v.advance(100));}assert(drops<100);await page.keyboard.press('r');await page.evaluate(()=>__v.frame(0));const reset=await page.evaluate(()=>__v.state());assert.equal(reset.over,false);assert.equal(reset.score,0);
 const opening=[];for(let i=0;i<7;i++){opening.push((await page.evaluate(()=>__v.state())).active.type);await page.evaluate(()=>__v.a.clear(__v.g));await page.keyboard.press('Space');await page.evaluate(()=>__v.a.settle(__v.g));}
 assert.equal(new Set(opening).size,engine.restartBags[2]);
 const timedSpins={};for(const kind of ['mini','full']){await page.evaluate(scenario,kind);await page.keyboard.press('ArrowUp');await page.evaluate(()=>__v.advance(500));timedSpins[kind]=(await page.evaluate(()=>__v.state())).score;assert.equal(timedSpins[kind],engine.scores['timed-'+kind+'-zero']);}
 await page.evaluate(scenario,'landing');const at1489=await page.evaluate(()=>__v.state().count);await page.evaluate(()=>__v.frame(1));const at1490=await page.evaluate(()=>__v.state().count);assert.equal(at1489,0);assert.equal(at1490,['max','xhigh','high'].includes(mode)?4:0);
 let pause=null;if(mode==='max'){await page.evaluate(()=>__v.fresh());await page.keyboard.press('p');await page.keyboard.press('Space');pause=await page.evaluate(()=>__v.state());assert.equal(pause.count,4);}
 await page.evaluate(scenario,'display');const geometry=await page.evaluate(layout),rendered=await page.evaluate(renderChecks,mode);assert.equal(rendered.ghostMatches,true);assert.equal(rendered.previews,mode==='max'?16:24);await page.screenshot({path:resolve(artifacts,`${mode}-${name}.png`),fullPage:true});assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);out.views[name]={keys,spins,timedSpins,soft,reset,opening,landing:{at1489,at1490},pause,layout:geometry,rendered,errors,assets};}finally{await context.close();}}}finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown);}console.log(JSON.stringify(out));return out;
}
module.exports={bootstrap,instrument,setup,scenario,layout,runBrowser};
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
