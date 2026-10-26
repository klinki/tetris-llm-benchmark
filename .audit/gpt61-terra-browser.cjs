// Real Chromium keyboard/RAF/render checks against each own disposable server.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function runBrowser(base,mode,artifacts){
  const audit=await import(pathToFileURL(path.join(__dirname,'gpt61-terra-audit.mjs')));
  const browser=await chromium.launch({headless:true}),result={mode,browser:browser.version(),views:{}};
  const shutdown=async()=>{await browser.close();process.exit(130);};process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
  try{
    for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
      const context=await browser.newContext({viewport:{width,height}});
      try{
        const page=await context.newPage(),errors=[],assets=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error'&&!/404|fonts.googleapis/.test(m.text()))errors.push(m.text());});
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico')&&!r.url().includes('fonts.googleapis'))assets.push(r.url());});
        page.on('requestfailed',r=>{if(!/fonts.googleapis|fonts.gstatic/.test(r.url()))assets.push(r.url());});
        await page.addInitScript(()=>{
          window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.__draws=[];
          for(const op of ['fillRect','strokeRect','fillText']){const original=CanvasRenderingContext2D.prototype[op];CanvasRenderingContext2D.prototype[op]=function(...args){__draws.push({id:this.canvas.id,canvas:[this.canvas.width,this.canvas.height],op,args,alpha:this.globalAlpha,style:op==='strokeRect'?this.strokeStyle:this.fillStyle});return original.apply(this,args);};}
        });
        const entry=mode==='low'?'bundle.js':'dist/main.js';
        await page.route(new URL(entry,base).href,async route=>{
          const response=await route.fetch();let body=await response.text(),glue=audit.accessors(mode);
          if(mode==='low'){
            body=body.replace('const gameModule=exports;','globalThis.__core=exports;const gameModule=exports;');
            const tail=body.lastIndexOf('})()})()');assert(tail>=0,'own CommonJS bundle tail');body=body.slice(0,tail)+glue+body.slice(tail);
          }else body+=glue;
          await route.fulfill({response,body});
        });
        await page.goto(base,{waitUntil:'networkidle'});
        const evidence=await page.evaluate(async({mode,factory,probe,oracle})=>{
          const core=mode==='low'?__core:await import('/dist/game.js');let current=null,time=0;
          const attach=g=>{if(current!==g){current=g;time=0;__app.setGame(g);__app.resetClock();}};
          const clock=(g,ms)=>{attach(g);time+=ms;__frame(time);};clock.action=(g,action)=>{attach(g);const before=JSON.stringify(g.active);__app.action(action);return before!==JSON.stringify(g.active);};
          const a=(0,eval)(`(${factory})`)(core,mode,clock);window.__adapter=a;
          return (0,eval)(`(${probe})`)(a,oracle);
        },{mode,factory:audit.createAdapter.toString(),probe:audit.runProbes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
        audit.assertRecorded(evidence);assert.equal(await page.evaluate(()=>new Set(Object.values(__app.colors)).size),7);
        await page.evaluate(()=>{
          const a=__adapter;let time=0;const game=()=>__app.game;
          const paint=()=>{__draws.length=0;__app.paint();};
          const fresh=(type='T',rotation=0,x=3,y=5)=>{Object.assign(game(),a.make(42));a.clear(game());a.place(game(),type,rotation,x,y);__app.resetClock();time=0;paint();};
          const frame=dt=>{time+=dt;__draws.length=0;__frame(time);};
          const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
          const state=()=>({active:a.active(game()),count:a.count(game()),score:game().score,held:a.held(game()),canHold:a.canHold(game()),over:a.over(game())});
          window.__v={a,game,paint,fresh,frame,advance,state};fresh();
        });
        const controls=[];for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
          const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);const after=await page.evaluate(()=>__v.state());controls.push({key,before,after});
        }
        assert.equal(controls[0].after.active.x,controls[0].before.active.x-1);assert.equal(controls[1].after.active.x,controls[1].before.active.x+1);
        for(let i=2;i<6;i++)assert.equal(controls[i].after.active.rotation,(controls[i].before.active.rotation+(i<4?1:3))%4);
        assert.equal(controls[6].after.active.y,controls[6].before.active.y+1);assert.equal(controls[6].after.score,1);assert.equal(controls[7].after.count,4);assert.equal(controls[8].after.held,controls[8].before.active.type);assert.equal(controls[8].after.canHold,false);
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));const soft=await page.evaluate(()=>__v.state());await page.keyboard.up('ArrowDown');
        assert.equal(soft.active.y,mode==='xhigh'?17:1);assert.equal(soft.score,mode==='xhigh'?17:1);
        const clocks=await page.evaluate(()=>{
          __v.fresh('O',0,3,17);__v.advance(990);__v.frame(16);__v.advance(483);const landing=[__v.state().count];__v.frame(1);landing.push(__v.state().count);
          const refresh={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100.001]]){refresh[level]=[];for(const hz of [60,144]){__v.fresh('O',0,3,0);__v.game().level=level;let t=0;while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);__v.frame(dt);t+=dt;}refresh[level].push(__v.state().active.y);}}
          return {landing,refresh};
        });assert.deepEqual(clocks.landing,evidence.landing);assert.deepEqual(clocks.refresh,evidence.refresh);
        // Exhausted ledge uses actual Up/Right and the unchanged main frame.
        await page.evaluate(()=>{__v.fresh('O',0,-1,12);__v.a.put(__v.game(),0,14);});for(let i=0;i<15;i++)await page.keyboard.press('ArrowUp');await page.evaluate(()=>__v.advance(490));await page.keyboard.press('ArrowRight');
        const ledge=await page.evaluate(()=>{let elapsed=0,landedAt=null;while(!__v.a.get(__v.game(),1,19)&&elapsed<9000){__v.frame(1);elapsed++;if(landedAt===null&&__v.state().active?.y===18)landedAt=elapsed;}return {landedAt,lockedAt:elapsed};});assert.deepEqual(ledge,evidence.exhaustedLedge);
        // Fresh held-piece clock through real C.
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.press('c');const heldY=(await page.evaluate(()=>__v.state())).active.y;await page.evaluate(()=>__v.advance(200));assert.equal((await page.evaluate(()=>__v.state())).active.y,heldY);
        // Repeated real keyboard actions reproduce both hidden fixtures.
        for(const fixture of evidence.hidden){
          await page.evaluate(f=>{__v.fresh();const a=__v.a,g=__v.game();a.clear(g);for(const[x,y]of f.stack)a.put(g,x,y);a.spawn(g,'T');a.incoming(g,'I');__v.paint();},fixture);
          for(const action of fixture.path)await page.keyboard.press({L:'ArrowLeft',R:'ArrowRight',CW:'ArrowUp',CCW:'z'}[action]);
          assert.deepEqual((await page.evaluate(()=>__v.state())).active,fixture.pose);await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).over,fixture.over);
        }
        // Real blocked spawn, inert terminal keys, and real R.
        await page.evaluate(()=>{__v.fresh();const a=__v.a,g=__v.game();a.spawn(g,'T');const[x,y]=a.cells(a.active(g)).find(c=>c[1]>=a.top);a.put(g,x,y);a.place(g,'O',0,0,18);a.incoming(g,'T');});await page.keyboard.press('Space');
        const terminal=await page.evaluate(()=>__v.state());assert(terminal.over);for(const key of ['ArrowLeft','ArrowUp','Space','c'])await page.keyboard.press(key);assert.deepEqual(await page.evaluate(()=>__v.state()),terminal);
        await page.keyboard.press('r');assert.deepEqual(await page.evaluate(()=>{const v=__v;return [v.state().over,v.state().count,v.game().score,v.game().lines,v.game().level,v.state().held,v.state().canHold];}),[false,0,0,0,1,null,true]);
        assert.equal(await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display),'none');
        if(mode==='medium'){
          const direct=await page.evaluate(()=>{const a=__v.a,g=__v.game();__v.fresh();a.spawn(g,'T');const[x,y]=a.cells(a.active(g))[0];a.put(g,x,y);a.place(g,'O',0,0,18);a.incoming(g,'T');g.hardDrop();const before=g.score;g.hardDrop();return {over:g.over,scoreChange:g.score-before};});assert.equal(direct.over,true);assert.equal(direct.scoreChange,40);
        }
        // Actual seven drawn ghosts against independent engine-independent cells.
        const ghosts=[];for(const type of Object.keys(audit.reference)){
          const record=await page.evaluate(({type,mode})=>{__v.fresh(type,0,3,0);const a=__v.a,g=__v.game();a.put(g,4,16);__v.paint();const p=a.active(g);let y=p.y;while(a.fits(g,{...p,y:y+1}))y++;
            const calls=__draws.filter(c=>c.id==='board'&&(mode==='low'?c.op==='fillRect'&&c.alpha===.2:mode==='medium'?c.op==='fillRect'&&c.style==='rgba(190, 210, 208, 0.09)':mode==='max'?c.op==='strokeRect'&&Math.abs(c.args[2]-25.3)<.01:c.op==='strokeRect'&&c.alpha<1));
            return {type,expected:a.cells({...p,y}).map(c=>c.join(',')).sort(),actual:calls.map(c=>[Math.floor(c.args[0]/30),Math.floor(c.args[1]/30)].join(',')).sort()};
          },{type,mode});assert.deepEqual(record.actual,record.expected,'drawn ghost '+type);ghosts.push(record);
        }
        // Mouse pause/resume followed by real Space checks focus retention.
        let focus=null;const pause={medium:'#pause',xhigh:'#pause',max:'#pause-button',ultra:'#pause'}[mode];
        if(pause){await page.evaluate(()=>__v.fresh());await page.locator(pause).click();await page.locator(pause).click();const before=await page.evaluate(()=>__v.state());await page.keyboard.press('Space');focus={before,after:await page.evaluate(()=>__v.state()),focused:await page.evaluate(()=>document.activeElement.id),overlay:await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display)};}
        if(focus){if(mode==='ultra'){assert.deepEqual(focus.after,focus.before);assert.equal(focus.focused,'pause');assert.equal(focus.overlay,'flex');}else{assert.equal(focus.after.count,4);assert.equal(focus.overlay,'none');}}
        // Repaint deterministic preview fixtures and inspect every canvas box.
        const presentation=await page.evaluate(mode=>{
          __v.fresh('T',0,3,0);const g=__v.game();if(mode==='medium'||mode==='high')g.hold='O';else g.held='O';__v.a.queue(g).fill('I');__app.resetClock();__v.paint();
          const canvases=Array.from(document.querySelectorAll('canvas')).map(c=>{const r=c.getBoundingClientRect();return {id:c.id,label:c.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height,backing:[c.width,c.height],aspect:(r.width/c.width)/(r.height/c.height)};});
          const previewCalls=__draws.filter(c=>c.id!=='board'&&c.op==='fillRect'&&c.args[2]>2&&c.args[2]<25&&Math.abs(c.args[2]-c.args[3])<.01);
          return {documentWidth:document.documentElement.scrollWidth,canvases,previewCells:previewCalls.length,outside:previewCalls.filter(c=>c.args[0]<0||c.args[1]<0||c.args[0]+c.args[2]>c.canvas[0]+.01||c.args[1]+c.args[3]>c.canvas[1]+.01).length};
        },mode);
        assert.equal(presentation.documentWidth,width);for(const c of presentation.canvases)assert(c.x>=-.03&&c.x+c.width<=width+.03,'canvas fits horizontally');
        const expected={low:name==='desktop'?[491,300,600]:[107,176,354],medium:name==='desktop'?[492,296,592]:[101,188,376],high:name==='desktop'?[491,298,596]:[99,192,384],xhigh:name==='desktop'?[523.5,233,466]:[99,192,384],max:name==='desktop'?[503.5,273,546]:[90.796875,208.390625,416.78125],ultra:name==='desktop'?[813.453125,242,484]:[28.5,230,460]}[mode];
        const board=presentation.canvases.find(c=>c.id==='board');[board.x,board.width,board.height].forEach((v,i)=>assert(Math.abs(v-expected[i])<.03,'exact board geometry'));
        for(const c of presentation.canvases.filter(c=>c.id!=='board')){const ratio=mode==='medium'?(c.id==='hold'?(name==='mobile'?.7:1):(name==='mobile'?52/120/(55/70):110/120)):mode==='max'&&name==='desktop'&&c.id==='next'?240/210:1;assert(Math.abs(c.aspect-ratio)<.01,'preview aspect');}
        assert.equal(presentation.outside,0);assert.equal(presentation.previewCells,['low','medium','ultra'].includes(mode)?16:24);
        assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
        if(artifacts)await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:true});
        result.views[name]={presentation,soft:{rows:soft.active.y,points:soft.score},clocks,ledge,focus,ghosts:ghosts.length,controls:controls.map(c=>c.key),errors,assets};
      }finally{await context.close();}
    }
  }finally{process.off('SIGTERM',shutdown);process.off('SIGINT',shutdown);await browser.close();}
  console.log(JSON.stringify(result));return result;
}
module.exports={runBrowser};if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e.stack);process.exitCode=1;});
