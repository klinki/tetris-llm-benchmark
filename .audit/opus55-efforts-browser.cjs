// Chromium assertions against unmodified npm-start servers in disposable copies.
// Main responses gain accessors only; native keyboard, input, frame and render bodies stay intact.
const {chromium} = require('../node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

async function runBrowser(base, mode, artifacts) {
  const audit = await import(pathToFileURL(path.join(__dirname,'opus55-efforts-audit.mjs')));
  const browser = await chromium.launch({headless:true});
  const result = {mode,browser:browser.version(),views:{}};
  try {
    for(const [name,width,height]of [['desktop',1280,800],['mobile',390,844]]) {
      const context = await browser.newContext({viewport:{width,height}});
      try {
        const page = await context.newPage(),errors=[],badResponses=[],failedRequests=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badResponses.push(`${r.status()} ${r.url()}`);});
        page.on('requestfailed',r=>failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
        await page.addInitScript(()=>{
          window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
          window.__draws=[];
          for(const op of ['fillRect','strokeRect','clearRect','fillText']){
            const original=CanvasRenderingContext2D.prototype[op];
            CanvasRenderingContext2D.prototype[op]=function(...args){
              window.__draws.push({id:this.canvas.id,op,args,alpha:this.globalAlpha,style:op==='strokeRect'?this.strokeStyle:this.fillStyle});
              return original.apply(this,args);
            };
          }
        });
        await page.route(new URL('dist/main.js',base).href,async route=>{
          const response=await route.fetch();
          const paint=mode==='low'?'render()':mode==='high'?'renderer.lastRevision=-1;renderer.render(game)':'renderer.render(game)';
          const clock=mode==='xhigh'?'lastTime=0':'last=0';
          await route.fulfill({response,body:await response.text()+`\nwindow.__app={get game(){return game},paint(){${paint}},resetClock(){${clock}}};`});
        });
        await page.goto(base,{waitUntil:'networkidle'});
        await page.evaluate(async ({mode,factory,probes,oracle})=>{
          const modules={game:await import('/dist/game.js'),pieces:await import('/dist/pieces.js')};
          if(mode==='xhigh')modules.bag=await import('/dist/randomizer.js');
          const a=(0,eval)(`(${factory})`)(modules,mode);
          window.__engineEvidence=(0,eval)(`(${probes})`)(a,oracle);
          const game=()=>window.__app.game;
          let clock=0;
          const frame=dt=>{clock+=dt;window.__draws=[];window.__frame(clock);};
          const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
          const state=()=>({active:a.active(game()),score:game().score,lines:game().lines,level:game().level,held:a.held(game()),canHold:a.canHold(game()),count:a.count(game()),over:a.over(game())});
          const paint=()=>{window.__draws=[];window.__app.paint();};
          const fresh=(type='T',rotation=0,x=3,y=5)=>{
            Object.assign(game(),a.make(42));a.clear(game());a.place(game(),type,rotation,x,y);
            window.__app.resetClock();clock=0;paint();
          };
          window.__v={a,game,state,paint,fresh,frame,advance};
          fresh();
        },{mode,factory:audit.createAdapter.toString(),probes:audit.runProbes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
        audit.assertRecorded(await page.evaluate(()=>__engineEvidence));
        const controls=[];
        for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
          const before=await page.evaluate(()=>__v.state());
          if(key==='ArrowDown'){
            await page.keyboard.down(key);await page.evaluate(()=>__v.frame(50));await page.keyboard.up(key);
          }else await page.keyboard.press(key);
          const after=await page.evaluate(()=>__v.state());controls.push({key,before,after});
        }
        assert.equal(controls[0].after.active.x,controls[0].before.active.x-1);
        assert.equal(controls[1].after.active.x,controls[1].before.active.x+1);
        for(let i=2;i<6;i++)assert.equal(controls[i].after.active.rotation,(controls[i].before.active.rotation+(i<4?1:3))%4);
        const softRows=mode==='low'?1:2;
        assert.equal(controls[6].after.active.y-controls[6].before.active.y,softRows);
        assert.equal(controls[6].after.score-controls[6].before.score,softRows);
        assert.equal(controls[7].after.count,4);
        assert.equal(controls[8].after.held,controls[8].before.active.type);
        assert.equal(controls[8].after.canHold,false);
        // The actual frame callback and real Down reproduce the transition.
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});
        const before=await page.evaluate(()=>__v.state());
        await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));
        const after=await page.evaluate(()=>__v.state());await page.keyboard.up('ArrowDown');
        const transition={rows:after.active.y-before.active.y,points:after.score-before.score};
        assert.deepEqual(transition,{rows:mode==='xhigh'?1:16,points:mode==='xhigh'?1:16});
        const landingFrame=await page.evaluate(()=>{
          __v.fresh('O',0,3,17);__v.advance(990);__v.frame(16);__v.advance(483);
          const at1489=__v.state().count;__v.frame(1);return {at1489,at1490:__v.state().count};
        });
        assert.deepEqual(landingFrame,{at1489:0,at1490:4});
        await page.evaluate(()=>__v.fresh('O',0,3,18));
        for(let i=0;i<15;i++){await page.evaluate(()=>__v.advance(10));await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');}
        const capBefore=await page.evaluate(()=>__v.state().count);await page.evaluate(()=>__v.frame(1));const capAfter=await page.evaluate(()=>__v.state().count);
        assert.deepEqual([capBefore,capAfter],mode==='low'?[0,0]:[0,4]);
        let exhaustedLedge=null;
        if(mode==='low'){
          await page.evaluate(()=>{__v.fresh('O',0,0,12);__v.a.put(__v.game(),0,14);});
          for(let i=0;i<15;i++)await page.keyboard.press('ArrowUp');
          await page.evaluate(()=>__v.advance(490));await page.keyboard.press('ArrowRight');
          exhaustedLedge=await page.evaluate(()=>{
            let elapsed=0,landedAt=null;while(!__v.a.get(__v.game(),1,19)&&elapsed<8000){__v.frame(1);elapsed++;if(landedAt===null&&__v.state().active?.y===18)landedAt=elapsed;}
            return {landedAt,lockedAt:elapsed,locked:!!__v.a.get(__v.game(),1,19)};
          });
          assert.deepEqual(exhaustedLedge,{landedAt:6000,lockedAt:6009,locked:true});
        }
        // Unchanged frame cadence, hold replacement phase and ledge safety.
        const clocks=await page.evaluate(()=>{
          const refresh={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100]]){
            const out=[];for(const hz of [60,144]){__v.fresh('O',0,3,0);__v.game().level=level;let t=0;while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);__v.frame(dt);t+=dt;}out.push(__v.state().active.y);}refresh[level+':'+duration]=out;
          }
          __v.fresh('O',0,0,12);__v.a.put(__v.game(),0,14);__v.advance(490);
          return {refresh};
        });
        assert.deepEqual(clocks.refresh,{'2:1480.001':[1,1],'10:600':[9,9],'15:100':[14,14]});
        await page.keyboard.press('ArrowRight');await page.evaluate(()=>__v.advance(20));assert.equal((await page.evaluate(()=>__v.state())).count,1);
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.press('c');
        const heldRow=(await page.evaluate(()=>__v.state())).active.y;await page.evaluate(()=>__v.advance(999));assert.equal((await page.evaluate(()=>__v.state())).active.y,heldRow);
        await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).active.y,heldRow+1);
        // Seven actual drawn ghosts against a separately computed collision oracle.
        const ghosts=[];
        for(const type of ['I','J','L','O','S','T','Z']){
          const ghost=await page.evaluate(({type,mode})=>{
            __v.fresh(type,0,3,0);const g=__v.game(),a=__v.a;a.put(g,4,16);__v.paint();
            let p=a.active(g);while(a.fits(g,{...p,y:p.y+1}))p={...p,y:p.y+1};
            const expected=a.cells(p).map(c=>c.join(',')).sort();
            const calls=__draws.filter(c=>mode==='low'?c.op==='strokeRect'&&c.args[2]===26:c.id==='board'&&c.op==='fillRect'&&Math.abs(c.alpha-(mode==='high'?0.18:0.2))<1e-8&&c.args[2]===(mode==='high'?30:28));
            const actual=calls.map(c=>[Math.floor((c.args[0]-(mode==='low'?180:0))/30),Math.floor(c.args[1]/30)-(mode==='high'?2:0)].join(',')).sort();
            return {type,expected,actual};
          },{type,mode});
          assert.deepEqual(ghost.actual,ghost.expected,`drawn ghost ${type}`);ghosts.push(ghost);
        }
        // Real Space -> blocked spawn, inert terminal keys, then real R.
        await page.evaluate(()=>{__v.fresh('O',0,0,18);__v.a.incoming(__v.game(),'T');__v.a.put(__v.game(),4,-2);});
        await page.keyboard.press('Space');await page.evaluate(()=>__v.paint());
        const over=await page.evaluate(()=>__v.state());assert(over.over);
        if(mode!=='low')assert.equal(await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display),'flex');
        for(const key of ['ArrowLeft','ArrowUp','Space','c'])await page.keyboard.press(key);
        assert.deepEqual(await page.evaluate(()=>__v.state()),over);
        await page.keyboard.press('r');await page.evaluate(()=>__v.paint());const restarted=await page.evaluate(()=>__v.state());
        assert.deepEqual([restarted.over,restarted.count,restarted.score,restarted.lines,restarted.level,restarted.held,restarted.canHold],[false,0,0,0,1,null,true]);
        if(mode!=='low')assert.equal(await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display),'none');
        // Deterministic O hold and five I next previews: forwarding draw records and pixels.
        const presentation=await page.evaluate(({mode})=>{
          const g=__v.game(),a=__v.a;
          if(mode==='low')g.hold='O';else g.held='O';
          if(mode==='xhigh')g.source={next:()=> 'I',peek:n=>Array(n).fill('I')};else g.queue.fill('I');
          __v.paint();
          const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
          const canvas=document.getElementById(mode==='low'?'game':'board');
          const boardBox=box(canvas);
          const board=mode==='low'?{x:boardBox.x+180,y:boardBox.y,width:300,height:600}:mode==='high'?{x:boardBox.x,y:boardBox.y+60,width:300,height:600}:boardBox;
          const preview=mode==='low'?[]:['hold','next'].map(id=>{
            const e=document.getElementById(id),b=box(e),pixels=e.getContext('2d').getImageData(0,0,e.width,e.height).data;
            const calls=__draws.filter(c=>c.id===id&&c.op==='fillRect'&&c.args[2]===(mode==='high'?22:20)&&c.args[3]===(mode==='high'?22:20));
            const outside=calls.filter(c=>c.args[0]<0||c.args[1]<0||c.args[0]+c.args[2]>e.width||c.args[1]+c.args[3]>e.height);
            return {id,...b,backing:[e.width,e.height],aspect:(b.width/e.width)/(b.height/e.height),cells:calls.length,outside:outside.length,painted:pixels.some((v,i)=>i%4===3&&v>0)};
          });
          return {documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,canvas:boardBox,board,previews:preview,overlay:mode==='low'?'canvas':getComputedStyle(document.getElementById('overlay')).display};
        },{mode});
        if(mode!=='low')for(const p of presentation.previews){assert.equal(p.cells,p.id==='hold'?4:20);assert(p.painted);assert.equal(p.outside,0);assert(Math.abs(p.aspect-1)<0.001);}
        assert.deepEqual(errors,[],'application errors');assert.deepEqual(badResponses,[],'required assets');assert.deepEqual(failedRequests,[],'failed requests');
        if(artifacts){fs.mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,`opus55-${mode}-${name}.png`),fullPage:true});}
        result.views[name]={exhaustedLedge,controls:controls.map(c=>c.key),transition,landingFrame,cap:[capBefore,capAfter],clocks,ghosts,restarted,presentation,errors,badResponses,failedRequests};
      } finally {await context.close();}
    }
  } finally {await browser.close();}
  assertBrowser(result);
  console.log(JSON.stringify(result));return result;
}
function assertBrowser(result) {
  assert.deepEqual(Object.keys(result.views),['desktop','mobile']);
  const geometry={
    low:{desktop:[1280,310,660,490,300,600],mobile:[525,-135,660,45,300,600]},
    high:{desktop:[1280,490,300,490,300,600],mobile:[495,45,300,45,300,600]},
    xhigh:{desktop:[1280,490,300,490,300,600],mobile:[684,192,300,192,300,600]},
  };
  for(const [name,view]of Object.entries(result.views)){
    const p=view.presentation;
    const actual=[p.documentWidth,p.canvas.x,p.canvas.width,p.board.x,p.board.width,p.board.height];
    geometry[result.mode][name].forEach((value,i)=>assert(Math.abs(actual[i]-value)<0.03,`${result.mode} ${name} geometry ${actual}`));
    if(result.mode!=='low'){
      const [hold,next]=p.previews;
      const xs=result.mode==='high'?(name==='desktop'?[351,821]:[-94,376]):name==='desktop'?[331,825]:[33,527];
      assert(Math.abs(hold.x-xs[0])<0.03&&Math.abs(next.x-xs[1])<0.03,'support bounds');
      assert.equal(p.overlay,'none');
    }
  }
}

module.exports={runBrowser};
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e.stack);process.exitCode=1;});
