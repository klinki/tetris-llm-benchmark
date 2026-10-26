// Reproduce recorded outcomes, including delivery failures, in real Chromium.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

async function runBrowser(base,mode,artifacts) {
  const audit=await import(pathToFileURL(path.join(__dirname,'beam-mimo-audit.mjs')));
  const browser=await chromium.launch({headless:true});
  const result={mode,browser:browser.version(),views:{}};
  const shutdown=async()=>{await browser.close();process.exit(130);};
  process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
  try {
    for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
      const context=await browser.newContext({viewport:{width,height}});
      try {
        const page=await context.newPage(),errors=[],assets=[],consoleErrors=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))consoleErrors.push(m.text());});
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push([r.status(),r.url()]);});
        page.on('requestfailed',r=>assets.push([r.failure()?.errorText,r.url()]));
        await page.addInitScript(()=>{
          window.__pending=0;window.__draws=[];window.__callbacks=[];
          window.requestAnimationFrame=cb=>{__pending++;__callbacks.push(cb);return __pending;};
          window.__step=ts=>{const callbacks=__callbacks.splice(0);for(const cb of callbacks)cb(ts);};
          for(const op of ['fillRect','strokeRect','fillText']){
            const original=CanvasRenderingContext2D.prototype[op];
            CanvasRenderingContext2D.prototype[op]=function(...args){__draws.push({op,args,alpha:this.globalAlpha,style:this.fillStyle});return original.apply(this,args);};
          }
        });
        if(mode==='low')await page.route(new URL('dist/main.js',base).href,async route=>{
          const r=await route.fetch();const glue=audit.lowAccess.replace("document.dispatchEvent({type:'keydown',key})","document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}))");
          await route.fulfill({response:r,body:await r.text()+glue});
        });
        if(mode==='mimo')await page.route(new URL('dist/index.js',base).href,async route=>{
          const r=await route.fetch();await route.fulfill({response:r,body:await r.text()+`\nwindow.__app={game,renderer,input,paint(){renderer.render(game)},resetClock(){previous=0}};`});
        });
        await page.goto(base,{waitUntil:'networkidle'});
        const geometry=await page.evaluate(()=>{
          const c=document.querySelector('canvas'),r=c.getBoundingClientRect();
          return {documentWidth:document.documentElement.scrollWidth,innerWidth,canvas:{x:r.x,y:r.y,width:r.width,height:r.height,backing:[c.width,c.height]},viewportMeta:!!document.querySelector('meta[name=viewport]')};
        });
        const view={geometry,errors,assets,consoleErrors};
        if(mode==='medium'){
          assert.deepEqual(errors,['exports is not defined']);assert.deepEqual(assets,[]);
          assert.equal(await page.evaluate(()=>__callbacks.length),0);
          assert.equal(await page.locator('#hud').textContent(),'');
          // Photograph the delivered static failure before diagnostics.
          if(artifacts)await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:true});
          for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c','r'])await page.keyboard.press(key);
          assert.equal(await page.locator('#hud').textContent(),'');
          const gameSource=await(await page.request.get(new URL('dist/game.js',base).href)).text();
          const mainSource=await(await page.request.get(new URL('dist/main.js',base).href)).text();
          const diagnostic=await page.evaluate(({gameSource,mainSource,probe,clock,glue,reference})=>{
            const exports={};new Function('exports',gameSource)(exports);
            const evidence=(0,eval)(`(${probe})`)(exports,reference);
            new Function('exports','require',mainSource+glue)({},()=>exports);
            evidence.clock=(0,eval)(`(${clock})`)(__medium,exports);
            return evidence;
          },{gameSource,mainSource,probe:audit.runMedium.toString(),clock:audit.runMediumClock.toString(),glue:audit.mediumAccess,reference:audit.reference});
          audit.assertRecorded(diagnostic);view.diagnostic=diagnostic;
          const previews=await page.evaluate(()=>{
            __medium.fresh();__draws.length=0;__medium.draw();const before=JSON.stringify(__draws),hud=document.getElementById('hud').textContent;
            __medium.state.hold=1;__medium.state.queue=Array(5).fill(0);__draws.length=0;__medium.draw();
            return {unchangedDrawing:JSON.stringify(__draws)===before,unchangedHud:document.getElementById('hud').textContent===hud,canvases:document.querySelectorAll('canvas').length};
          });assert.deepEqual(previews,{unchangedDrawing:true,unchangedHud:true,canvases:1});view.missingPreviews=previews;
          view.delivery='static failure; CommonJS diagnostic is not a browser-start pass';
        } else if(mode==='low') {
          assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
          const engine=await page.evaluate(({probe,reference})=>(0,eval)(`(${probe})`)(__low,reference),{probe:audit.runLow.toString(),reference:audit.reference});
          audit.assertRecorded(engine);view.engine=engine;
          await page.evaluate(()=>__low.fresh());
          const controls=[];
          for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
            const before=await page.evaluate(()=>({p:JSON.parse(JSON.stringify(__low.cur)),score:__low.score,count:__low.count()}));
            await page.keyboard.press(key);
            const after=await page.evaluate(()=>({p:JSON.parse(JSON.stringify(__low.cur)),score:__low.score,count:__low.count()}));
            controls.push({key,before,after});
          }
          assert.equal(controls[0].after.p.x,controls[0].before.p.x-1);assert.equal(controls[1].after.p.x,controls[1].before.p.x+1);
          for(const i of [2,3,4])assert.notDeepEqual(controls[i].after.p.shape,controls[i].before.p.shape);
          assert.deepEqual(controls[5].after,controls[5].before);
          assert.equal(controls[6].after.p.y,controls[6].before.p.y+1);assert.equal(controls[6].after.score,0);
          assert.equal(controls[7].after.count,4);assert.equal(controls[7].after.score,0);assert.deepEqual(controls[8].after,controls[8].before);
          view.controls=controls.map(c=>c.key);
          const frozen=await page.evaluate(()=>{
            __callbacks.length=0;__low.fresh('O',[[1,1],[1,1]],0,18);__low.next('O');__low.put(3,0);__low.key(' ');__low.update(1100);
            return {over:__low.over,pending:__callbacks.length};
          });
          assert.deepEqual(frozen,{over:true,pending:0});await page.keyboard.press('r');
          const restart=await page.evaluate(()=>{const before=__low.cur.y;__step(5000);return {over:__low.over,count:__low.count(),pending:__callbacks.length,before,after:__low.cur.y};});
          assert.deepEqual(restart,{over:false,count:0,pending:0,before:0,after:0});view.restart=restart;
          const drawing=await page.evaluate(()=>{__low.fresh();__draws.length=0;__low.draw();return {blocks:__draws.filter(c=>c.op==='fillRect'&&c.args[2]===31).length,ghosts:__draws.filter(c=>c.alpha<1||c.op==='strokeRect').length,canvases:document.querySelectorAll('canvas').length};});
          assert.deepEqual(drawing,{blocks:4,ghosts:0,canvases:1});view.drawing=drawing;
          if(artifacts)await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:true});
        } else {
          assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
          const evidence=await page.evaluate(async({factory,probe,oracle})=>{
            const a=(0,eval)(`(${factory})`)({game:await import('/dist/game.js'),pieces:await import('/dist/pieces.js')});
            window.__adapter=a;return (0,eval)(`(${probe})`)(a,oracle);
          },{factory:audit.mimoAdapter.toString(),probe:audit.runMimo.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
          audit.assertRecorded(evidence);view.engine=evidence;
          await page.evaluate(()=>{
            let clock=0;const a=__adapter,g=__app.game;
            const fresh=(type='T',rot=0,x=3,y=5)=>{Object.assign(g,a.make());a.clear(g);a.place(g,type,rot,x,y);__callbacks.length=0;__app.resetClock();clock=0;__app.paint();};
            const frame=dt=>{clock+=dt;__draws.length=0;frameBody(clock);};
            // Existing callback captured before clearing its scheduling queue.
            const frameBody=__callbacks[0];
            window.__v={a,g,fresh,frame,advance(ms){while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}},state(){return {p:a.active(g),score:g.score,count:a.count(g),hold:g.hold,canHold:g.canHold,over:g.gameOver};}};fresh();
          });
          const controls=[];
          for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
            const before=await page.evaluate(()=>__v.state());await page.keyboard.press(key);const after=await page.evaluate(()=>__v.state());controls.push({key,before,after});
          }
          assert.equal(controls[0].after.p.x,controls[0].before.p.x-1);assert.equal(controls[1].after.p.x,controls[1].before.p.x+1);
          for(let i=2;i<6;i++)assert.equal(controls[i].after.p.rot,(controls[i].before.p.rot+(i<4?1:3))%4);
          assert.equal(controls[6].after.p.y,controls[6].before.p.y+1);assert.equal(controls[6].after.score,1);assert.equal(controls[7].after.count,4);assert.equal(controls[8].after.hold,controls[8].before.p.type);
          await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));
          view.soft=await page.evaluate(()=>({rows:__v.a.active(__v.g).y,points:__v.g.score}));await page.keyboard.up('ArrowDown');assert.deepEqual(view.soft,{rows:17,points:17});
          // Real callback reproduces delay, cap, ledge and held-piece phase.
          view.clocks=await page.evaluate(()=>{
            __v.fresh('O',0,3,18);__v.advance(499);const before=__v.a.count(__v.g);__v.frame(1);const after=__v.a.count(__v.g);
            __v.fresh('O',0,3,0);__v.advance(800);return {ground:[before,after]};
          });assert.deepEqual(view.clocks,{ground:[0,4]});await page.keyboard.press('c');
          const heldY=(await page.evaluate(()=>__v.state())).p.y;await page.evaluate(()=>__v.advance(999));assert.equal((await page.evaluate(()=>__v.state())).p.y,heldY);await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).p.y,heldY+1);
          view.refresh=await page.evaluate(()=>{
            const out={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100.001]]){out[level]=[];for(const hz of [60,144]){__v.fresh('O',0,3,0);__v.g.level=level;let elapsed=0;while(elapsed<duration-1e-8){const dt=Math.min(1000/hz,duration-elapsed);__v.frame(dt);elapsed+=dt;}out[level].push(__v.a.active(__v.g).y);}}return out;
          });assert.deepEqual(view.refresh,{'2':[1,1],'10':[9,9],'15':[6,6]});
          const ghosts=[];for(const type of Object.keys(audit.reference)){
            const ghost=await page.evaluate(type=>{
              __v.fresh(type,0,3,0);__v.a.put(__v.g,4,16);__draws.length=0;__app.paint();
              const y=__v.g.ghostY()-20,expected=__v.a.cells({...__v.a.active(__v.g),y}).map(p=>p.join(',')).sort();
              const actual=__draws.filter(c=>c.op==='fillRect'&&c.alpha===.22&&c.args[2]===24&&c.args[3]===24).map(c=>[Math.round((c.args[0]-13)/30),Math.round((c.args[1]-13)/30)].join(',')).sort();return {type,expected,actual};
            },type);assert.deepEqual(ghost.actual,ghost.expected);ghosts.push(ghost);
          }view.ghosts=ghosts;
          await page.evaluate(()=>{__v.fresh('O',0,0,18);__v.g.bag.queue=['T'];__v.a.put(__v.g,4,0);});await page.keyboard.press('Space');
          const terminal=await page.evaluate(()=>__v.state());assert(terminal.over);for(const key of ['ArrowLeft','ArrowUp','Space','c'])await page.keyboard.press(key);assert.deepEqual(await page.evaluate(()=>__v.state()),terminal);await page.keyboard.press('r');
          assert.deepEqual(await page.evaluate(()=>[__v.g.gameOver,__v.a.count(__v.g),__v.g.score,__v.g.lines,__v.g.level,__v.g.hold,__v.g.canHold]),[false,0,0,0,1,null,true]);
          view.presentation=await page.evaluate(()=>{
            __v.g.hold='O';__v.g.bag.queue=Array(5).fill('I');__v.g.combo=1;__v.g.backToBack=true;__draws.length=0;__app.paint();
            const preview=__draws.filter(c=>c.op==='fillRect'&&c.args[2]===13&&c.args[3]===13),outside=preview.filter(c=>c.args[0]<0||c.args[1]<0||c.args[0]+c.args[2]>480||c.args[1]+c.args[3]>620);
            const stats=__draws.filter(c=>c.op==='fillText'&&['COMBO','B2B','x1','x1.5'].includes(c.args[0])).map(c=>c.args);
            return {previews:preview.length,outside:outside.length,stats};
          });assert.equal(view.presentation.previews,24);assert.equal(view.presentation.outside,0);assert.deepEqual(view.presentation.stats,[['COMBO',320,615],['x1',320,630],['B2B',320,660],['x1.5',320,675]]);
          if(artifacts)await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:true});
          view.controls=controls.map(c=>c.key);
        }
        assert.deepEqual(consoleErrors,[],'application console errors');result.views[name]=view;
      } finally {await context.close();}
    }
  } finally {process.off('SIGINT',shutdown);process.off('SIGTERM',shutdown);await browser.close();}
  // CSS viewport sizing matches the previous audit (desktop user agent).
  for(const [name,v]of Object.entries(result.views)){
    if(mode==='mimo'){
      assert.equal(v.geometry.documentWidth,name==='desktop'?1280:435);assert.equal(v.geometry.innerWidth,name==='desktop'?1280:390);assert.equal(v.geometry.canvas.x,name==='desktop'?400:-45);assert.equal(v.geometry.canvas.width,480);
    } else {
      assert.equal(v.geometry.innerWidth,name==='desktop'?1280:390);assert.equal(v.geometry.viewportMeta,false);
      if(mode==='low'){
        assert.equal(v.geometry.documentWidth,name==='desktop'?1280:399);assert.equal(v.geometry.canvas.width,324);assert.equal(v.geometry.canvas.height,644);
        assert(Math.abs(v.geometry.canvas.x-(name==='desktop'?436.203125:-8.796875))<.03);
      } else {assert.equal(v.geometry.documentWidth,name==='desktop'?1280:390);assert.deepEqual(v.geometry.canvas.backing,[300,150]);}
    }
  }
  console.log(JSON.stringify(result));return result;
}
module.exports={runBrowser};
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e.stack);process.exitCode=1;});
