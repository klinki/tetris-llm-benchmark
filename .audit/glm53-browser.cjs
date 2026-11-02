// Actual Chromium keyboard/RAF checks; no edited application rules or rendering.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

async function runBrowser(base,mode,artifacts) {
  const audit=await import(pathToFileURL(path.join(__dirname,'glm53-audit.mjs')));
  const browser=await chromium.launch({headless:true});
  const result={mode,browser:browser.version(),views:{}};
  const shutdown=async()=>{await browser.close();process.exit(130);};
  process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
  try {
    for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]) {
      const context=await browser.newContext({viewport:{width,height}});
      try {
        const page=await context.newPage(),errors=[],assets=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push(r.url());});
        page.on('requestfailed',r=>assets.push(r.url()));
        await page.addInitScript(()=>{
          window.__now=0;Object.defineProperty(performance,'now',{value:()=>window.__now});window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.__draws=[];
          for(const op of ['fillRect','strokeRect','fillText']){const original=CanvasRenderingContext2D.prototype[op];CanvasRenderingContext2D.prototype[op]=function(...args){__draws.push({canvas:this.canvas.id,op,args,alpha:this.globalAlpha,style:this.fillStyle});return original.apply(this,args);};}
        });
        await page.route(new URL('dist/main.js',base).href,async route=>{
          const response=await route.fetch();
          await route.fulfill({response,body:await response.text()+`\nwindow.__app={game,input,paint(){renderer.draw(${mode==='low'?'game':'window.__now'})},resetClock(){last=0;input.releaseAll();window.__now=0}};`});
        });
        await page.goto(base,{waitUntil:'networkidle'});
        const engine=await page.evaluate(async({mode,factory,probe,oracle})=>{
          const prefix=mode==='low'?'/dist/':'/dist/core/';
          const a=(0,eval)(`(${factory})`)({game:await import(prefix+'game.js'),pieces:await import(prefix+(mode==='low'?'tetromino.js':'pieces.js')),bag:await import(prefix+'randomizer.js')},mode);
          const e=(0,eval)(`(${probe})`)(a,oracle);let time=0;
          const game=()=>__app.game,paint=()=>{__draws.length=0;__app.paint();};
          const fresh=(t='T',r=0,x=3,y=5)=>{Object.assign(game(),a.make(42));__app.resetClock();time=0;a.clear(game());a.place(game(),t,r,x,y);paint();};
          const frame=dt=>{time+=dt;window.__now=time;__draws.length=0;__frame(time);};
          const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
          const state=()=>({active:a.active(game()),count:a.count(game()),score:game().score,lines:game().lines,level:game().level,held:game().hold,canHold:game().canHold,over:a.over(game())});
          window.__v={a,game,paint,fresh,frame,advance,state};fresh();return e;
        },{mode,factory:audit.createAdapter.toString(),probe:audit.runProbes.toString(),oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
        audit.assertRecorded(engine);
        const controls=[];
        for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']) {
          const before=await page.evaluate(()=>__v.state());
          if(key==='ArrowDown'){await page.keyboard.down(key);await page.evaluate(()=>__v.frame(50));await page.keyboard.up(key);}else await page.keyboard.press(key);
          controls.push({key,before,after:await page.evaluate(()=>__v.state())});
        }
        assert.equal(controls[0].after.active.x,controls[0].before.active.x-1);assert.equal(controls[1].after.active.x,controls[1].before.active.x+1);
        for(let i=2;i<6;i++)assert.equal(controls[i].after.active.rotation,(controls[i].before.active.rotation+(i<4?1:3))%4);
        assert.equal(controls[6].after.active.y-controls[6].before.active.y,1);assert.equal(controls[6].after.score,1);
        assert.equal(controls[7].after.count,4);assert.equal(controls[8].after.held,controls[8].before.active.type);assert.equal(controls[8].after.canHold,false);
        // Held direction and blur release with the unchanged input+frame bodies.
        await page.evaluate(()=>__v.fresh('O',0,3,0));await page.keyboard.down('ArrowLeft');await page.evaluate(()=>__v.advance(400));
        assert.equal((await page.evaluate(()=>__v.state())).active.x,-1);await page.keyboard.up('ArrowLeft');
        await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowDown');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
        const blur=await page.evaluate(()=>{const x=__v.state().active.x;__v.advance(300);return {sameX:x===__v.state().active.x,soft:__v.game().softDropping};});assert.deepEqual(blur,{sameX:true,soft:false});
        await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));
        const soft=await page.evaluate(()=>({rows:__v.state().active.y,points:__v.state().score}));await page.keyboard.up('ArrowDown');assert.deepEqual(soft,{rows:16,points:16});
        await page.evaluate(()=>{__v.fresh('O',0,3,17);__v.advance(990);__v.frame(16);__v.advance(483);});const at1489=(await page.evaluate(()=>__v.state())).count;await page.evaluate(()=>__v.frame(1));assert.equal(at1489,0);assert.equal((await page.evaluate(()=>__v.state())).count,4);
        await page.evaluate(()=>{__v.fresh('I',0,3,18);for(let x=0;x<10;x++)if(x<3||x>6)__v.a.put(__v.game(),x,19);});await page.keyboard.press('Space');
        const pc=await page.evaluate(()=>__v.state());assert.equal(pc.score,100);assert.equal(pc.count,0);assert.equal(pc.lines,1);
        const downSpins={};
        for(const method of ['hard','soft']) {
          await page.evaluate(()=>{__v.fresh('T',0,0,3);for(const[x,y]of [[0,17],[0,19],[2,19]])__v.a.put(__v.game(),x,y);});
          await page.keyboard.press('ArrowUp');
          if(method==='soft'){await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.advance(700));await page.keyboard.up('ArrowDown');}
          const before=(await page.evaluate(()=>__v.state())).score;await page.keyboard.press('Space');downSpins[method]=(await page.evaluate(()=>__v.state())).score-before;
        }
        assert.deepEqual(downSpins,{hard:mode==='low'?28:128,soft:100});
        // Direct key rotation shows high's wrong J state; low is canonical.
        await page.evaluate(()=>__v.fresh('J',0,3,8));await page.keyboard.press('ArrowUp');
        const jCells=await page.evaluate(()=>__v.a.local('J',__v.state().active.rotation).map(c=>c.join(',')).sort());
        assert.deepEqual(jCells,(mode==='low'?audit.reference.J[1]:audit.reference.L[1]).map(c=>c.join(',')).sort());
        const deepKicks=[];
        for(const fifth of [false,true]) {
          await page.evaluate(fifth=>{__v.fresh('T',1,3,17);const stack=fifth?[[4,15],[6,15],[6,17],[3,18],[6,18],[3,16]]:[[3,15],[3,17],[5,17],[3,18],[6,19]];for(const[x,y]of stack)__v.a.put(__v.game(),x,y);},fifth);
          await page.keyboard.press(fifth?'ArrowUp':'z');await page.keyboard.press('Space');deepKicks.push((await page.evaluate(()=>__v.state())).score);
        }
        assert.deepEqual(deepKicks,mode==='low'?[400,400]:[100,400]);
        await page.evaluate(()=>{__v.fresh();const a=__v.a,g=__v.game();a.clear(g);a.put(g,3,0);a.put(g,4,0);a.spawn(g,'T');});await page.keyboard.press('ArrowUp');
        const ceiling=(await page.evaluate(()=>__v.state())).active;assert.deepEqual(ceiling,mode==='low'?{type:'T',rotation:0,x:3,y:-2}:{type:'T',rotation:1,x:2,y:-3});
        let aboveBuffer=null;
        if(mode==='high') {
          await page.evaluate(()=>{__v.fresh();const a=__v.a,g=__v.game();a.clear(g);for(const[x,y]of [[5,0],[3,0],[6,1]])a.put(g,x,y);a.spawn(g,'I');a.incoming(g,'T');});
          await page.keyboard.press('ArrowUp');await page.evaluate(()=>__v.advance(1000));const pose=(await page.evaluate(()=>__v.state())).active;await page.keyboard.press('Space');aboveBuffer={pose,over:(await page.evaluate(()=>__v.state())).over};assert.deepEqual(aboveBuffer,{pose:{type:'I',rotation:1,x:4,y:-3},over:true});
          await page.evaluate(()=>{__v.fresh('S',1,-1,-2);__v.a.put(__v.game(),2,-2);__v.a.put(__v.game(),0,0);});await page.keyboard.press('z');assert.deepEqual((await page.evaluate(()=>__v.state())).active,{type:'S',rotation:0,x:-1,y:-4});
        }
        // Real restart after actual repeated hard drops; no forced status assignment.
        await page.evaluate(()=>{__v.fresh();__v.game().reset();});
        let drops=0;while(!(await page.evaluate(()=>__v.state())).over&&drops<100){await page.keyboard.press('Space');drops++;}
        assert(drops<100);await page.keyboard.press('r');const reset=await page.evaluate(()=>__v.state());assert.deepEqual([reset.over,reset.score,reset.lines,reset.level,reset.held,reset.canHold],[false,0,0,1,null,true]);
        const opening=[];for(let i=0;i<7;i++){opening.push((await page.evaluate(()=>__v.state())).active.type);await page.evaluate(()=>__v.a.clear(__v.game()));await page.keyboard.press('Space');}assert.equal(new Set(opening).size,6);
        // Render recognizable fixed state with hold and all five next previews.
        await page.evaluate(()=>{__v.fresh('T',0,3,4);const g=__v.game();g.hold='I';g.canHold=true;g.queue.splice(0,g.queue.length,'I','O','T','S','L');for(let x=0;x<10;x++)if(x!==4)__v.a.put(g,x,19,'J');__v.paint();});
        const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvas:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,rect:{x:c.getBoundingClientRect().x,y:c.getBoundingClientRect().y,width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}})),previewDraws:__draws.filter(d=>d.op==='fillRect'&&(((d.canvas==='hold'||d.canvas==='next')&&d.args[2]===28&&d.args[3]===28)||d.canvas==='game'&&d.args[2]===20&&d.args[3]===20)).length}));
        assert.equal(layout.previewDraws,24); // 4 hold + 5×4 upcoming cells.
        for(const c of layout.canvas)assert(Math.abs((c.rect.width/c.width)/(c.rect.height/c.height)-1)<.02,'proportional canvas '+c.id);
        if(mode==='low'){assert(layout.scrollWidth<=width);assert(layout.canvas[0].rect.x>=0);assert(layout.canvas[0].rect.x+layout.canvas[0].rect.width<=width+.01);}else if(name==='mobile'){assert(layout.scrollWidth>width);assert(layout.canvas.find(c=>c.id==='board').rect.x<0);}
        await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:false});
        assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
        result.views[name]={controls:controls.map(x=>x.key),engine:{states:engine.states,rotationMismatches:engine.rotations.mismatches,bags:engine.bags},soft,landing:{at1489,at1490:4},pc:{score:pc.score,cells:pc.count,lines:pc.lines},downSpins,deepKicks,ceiling,aboveBuffer,restart:{drops,opening},layout,errors,assets};
      }finally{await context.close();}
    }
  }finally{await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown);}
  console.log(JSON.stringify(result));return result;
}
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e);process.exit(1);});
module.exports={runBrowser};
