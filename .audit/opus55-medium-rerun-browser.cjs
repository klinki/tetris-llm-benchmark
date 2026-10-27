// Reproducible real Chromium checks; served rule/input/frame/render bodies are unchanged.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

async function runBrowser(base,artifacts) {
  const audit=await import(pathToFileURL(path.join(__dirname,'opus55-medium-rerun-audit.mjs')));
  const browser=await chromium.launch({headless:true});
  const result={browser:browser.version(),views:{}};
  const shutdown=async()=>{await browser.close();process.exit(130);};
  process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
  try {
    for(const[name,width,height]of [['desktop',1280,800],['mobile',390,844]]) {
      const context=await browser.newContext({viewport:{width,height}});
      try {
        const page=await context.newPage(),errors=[],assets=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push(r.url());});
        page.on('requestfailed',r=>assets.push(r.url()));
        await page.addInitScript(()=>{
          window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.__draws=[];
          for(const op of ['fillRect','strokeRect','fillText']) {
            const original=CanvasRenderingContext2D.prototype[op];
            CanvasRenderingContext2D.prototype[op]=function(...args) {
              __draws.push({id:this.canvas.id,canvas:[this.canvas.width,this.canvas.height],op,args,alpha:this.globalAlpha,style:this.fillStyle});
              return original.apply(this,args);
            };
          }
        });
        await page.route(new URL('dist/main.js',base).href,async route=>{
          const response=await route.fetch();
          await route.fulfill({response,body:await response.text()+
            '\nwindow.__app={game,paint(){renderer.previewKey="";renderer.draw(game)},resetClock(){last=0}};'});
        });
        await page.goto(base,{waitUntil:'networkidle'});
        const engine=await page.evaluate(async({factory,probes,common,oracle})=>{
          const modules={game:await import('/dist/game.js'),pieces:await import('/dist/pieces.js')};
          const a=(0,eval)(`(${factory})`)(modules);
          const evidence=(0,eval)(`(${probes})`)(a,oracle,(0,eval)(`(${common})`));
          const game=()=>__app.game;let time=0;
          const paint=()=>{__draws.length=0;__app.paint();};
          const fresh=(type='T',rotation=0,x=3,y=5)=>{
            Object.assign(game(),a.make(42));a.clear(game());a.place(game(),type,rotation,x,y);
            __app.resetClock();time=0;paint();
          };
          const frame=dt=>{time+=dt;__draws.length=0;__frame(time);};
          const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
          const state=()=>({active:a.active(game()),count:a.count(game()),score:game().score,lines:game().lines,
            level:game().level,held:a.held(game()),canHold:a.canHold(game()),over:a.over(game())});
          window.__v={a,game,paint,fresh,frame,advance,state};fresh();return evidence;
        },{factory:audit.createAdapter.toString(),probes:audit.runProbes.toString(),common:audit.calibratedProbes.toString(),
          oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
        audit.assertRecorded(engine);

        const controls=[];
        for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']) {
          const before=await page.evaluate(()=>__v.state());
          if(key==='ArrowDown') {await page.keyboard.down(key);await page.evaluate(()=>__v.frame(50));await page.keyboard.up(key);}
          else await page.keyboard.press(key);
          controls.push({key,before,after:await page.evaluate(()=>__v.state())});
        }
        assert.equal(controls[0].after.active.x,controls[0].before.active.x-1);
        assert.equal(controls[1].after.active.x,controls[1].before.active.x+1);
        for(let i=2;i<6;i++)assert.equal(controls[i].after.active.rotation,(controls[i].before.active.rotation+(i<4?1:3))%4);
        assert.equal(controls[6].after.active.y-controls[6].before.active.y,1);assert.equal(controls[6].after.score,1);
        assert.equal(controls[7].after.count,4);assert.equal(controls[8].after.held,controls[8].before.active.type);
        assert.equal(controls[8].after.canHold,false);

        // Round 2: real held-key repeat, most-recent direction, release and blur.
        await page.evaluate(()=>__v.fresh('T',0,3,5));
        await page.keyboard.down('ArrowRight');await page.evaluate(()=>__v.advance(700));
        assert.equal((await page.evaluate(()=>__v.state())).active.x,7);
        await page.keyboard.up('ArrowRight');await page.evaluate(()=>__v.advance(100));
        assert.equal((await page.evaluate(()=>__v.state())).active.x,7);
        await page.evaluate(()=>__v.fresh('T',0,3,5));
        await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowRight');
        await page.evaluate(()=>__v.advance(250));
        const recent=(await page.evaluate(()=>__v.state())).active.x;
        assert(recent>3,'most-recent direction repeats');
        await page.keyboard.up('ArrowRight');await page.evaluate(()=>__v.advance(250));
        assert((await page.evaluate(()=>__v.state())).active.x<recent,'remaining left resumes');
        await page.keyboard.up('ArrowLeft');
        await page.evaluate(()=>__v.fresh('T',0,3,5));
        await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowDown');
        await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
        const blurBefore=await page.evaluate(()=>__v.state());await page.evaluate(()=>__v.advance(300));
        const blurAfter=await page.evaluate(()=>__v.state());
        assert.deepEqual(blurAfter,blurBefore,'blur releases held movement and soft drop');
        await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowDown');
        // Repeated keydown must not rotate again or bypass hold restriction.
        await page.evaluate(()=>__v.fresh('T',0,3,5));
        await page.keyboard.down('x');await page.keyboard.down('x');await page.keyboard.up('x');
        assert.equal((await page.evaluate(()=>__v.state())).active.rotation,1);
        await page.keyboard.press('c');const heldOnce=await page.evaluate(()=>__v.state());
        await page.keyboard.press('c');assert.deepEqual(await page.evaluate(()=>__v.state()),heldOnce);
        // Paused real-key actions must preserve both state and the saved phase.
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});
        await page.keyboard.press('p');const paused=await page.evaluate(()=>__v.state());
        for(const key of ['ArrowLeft','ArrowRight','ArrowUp','z','Space','c'])await page.keyboard.press(key);
        await page.evaluate(()=>__v.advance(2000));assert.deepEqual(await page.evaluate(()=>__v.state()),paused);
        await page.keyboard.press('Escape');await page.evaluate(()=>__v.advance(199));
        assert.equal((await page.evaluate(()=>__v.state())).active.y,0);
        await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).active.y,1);

        // Real Space, not a direct scoring helper, reproduces the missing PC.
        await page.evaluate(()=>{__v.fresh('I',0,3,18);for(let x=0;x<10;x++)if(x<3||x>6)__v.a.put(__v.game(),x,19);});
        await page.keyboard.press('Space');const pc=await page.evaluate(()=>__v.state());
        assert.equal(pc.lines,1);assert.equal(pc.count,0);assert.equal(pc.score,100);
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});
        await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));
        const soft=await page.evaluate(()=>__v.state());await page.keyboard.up('ArrowDown');
        assert.equal(soft.active.y,16);assert.equal(soft.score,16);

        const clocks=await page.evaluate(()=>{
          __v.fresh('O',0,3,17);__v.advance(990);__v.frame(16);__v.advance(483);
          const landing=[__v.state().count];__v.frame(1);landing.push(__v.state().count);
          __v.advance(15);landing.push(__v.state().count);__v.frame(1);landing.push(__v.state().count);
          const refresh={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100]]) {
            refresh[level]=[];for(const hz of [60,144]) {
              __v.fresh('O',0,3,0);__v.game().level=level;let t=0;
              while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);__v.frame(dt);t+=dt;}
              refresh[level].push(__v.state().active.y);
            }
          }return {landing,refresh};
        });
        assert.deepEqual(clocks,{landing:[0,0,0,4],refresh:{2:[1,1],10:[9,9],15:[14,14]}});
        await page.evaluate(()=>__v.fresh('O',0,3,18));
        for(let i=0;i<15;i++){await page.evaluate(()=>__v.advance(10));await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');}
        await page.evaluate(()=>__v.advance(499));assert.equal((await page.evaluate(()=>__v.state())).count,0);
        await page.keyboard.press('ArrowLeft');await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).count,4);
        await page.evaluate(()=>{__v.fresh('O',0,0,12);__v.a.put(__v.game(),0,14);});
        for(let i=0;i<15;i++){await page.evaluate(()=>__v.frame(1));await page.keyboard.press('ArrowUp');}
        await page.evaluate(()=>__v.advance(490));await page.keyboard.press('ArrowRight');
        const ledge=await page.evaluate(()=>{let elapsed=0,landedAt=null;
          while(!__v.a.get(__v.game(),1,19)&&elapsed<9000){__v.frame(1);elapsed++;if(landedAt===null&&__v.state().active?.y===18)landedAt=elapsed;}
          return {landedAt,lockedAt:elapsed};});
        assert.deepEqual(ledge,{landedAt:6000,lockedAt:6500});
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});await page.keyboard.press('c');
        const heldY=(await page.evaluate(()=>__v.state())).active.y;
        await page.evaluate(()=>__v.advance(999));assert.equal((await page.evaluate(()=>__v.state())).active.y,heldY);
        await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).active.y,heldY+1);

        // Whole and partial hidden locks replay only public actions from real spawn.
        for(const whole of [true,false]) {
          await page.evaluate(whole=>{__v.fresh();const a=__v.a,g=__v.game();a.clear(g);
            for(const[x,y]of (whole?[[2,0],[3,1],[4,1]]:[[8,1]]))a.put(g,x,y);
            a.spawn(g,'T');a.incoming(g,'I');},whole);
          for(const key of (whole?['ArrowUp','z','ArrowLeft','ArrowLeft']:Array(4).fill('ArrowRight')))await page.keyboard.press(key);
          assert.deepEqual((await page.evaluate(()=>__v.state())).active,whole?{type:'T',rotation:0,x:0,y:-2}:{type:'T',rotation:0,x:7,y:-1});
          await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).over,whole);
        }
        await page.evaluate(()=>{__v.fresh('O',0,0,18);__v.a.incoming(__v.game(),'T');__v.a.put(__v.game(),4,-2);});
        await page.keyboard.press('Space');await page.evaluate(()=>__v.paint());
        const terminal=await page.evaluate(()=>__v.state());assert(terminal.over);
        assert.equal(await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display),'flex');
        for(const key of ['ArrowLeft','ArrowRight','ArrowUp','z','ControlLeft','ArrowDown','Space','c'])await page.keyboard.press(key);
        await page.evaluate(()=>__v.advance(1000));assert.deepEqual(await page.evaluate(()=>__v.state()),terminal);
        await page.keyboard.press('r');await page.evaluate(()=>__v.paint());
        const reset=await page.evaluate(()=>__v.state());
        assert.deepEqual([reset.over,reset.count,reset.score,reset.lines,reset.level,reset.held,reset.canHold],[false,0,0,0,1,null,true]);
        assert.equal(await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display),'none');
        await page.keyboard.press('p');await page.evaluate(()=>__v.paint());
        assert.equal(await page.locator('#overlay').evaluate(e=>getComputedStyle(e).display),'flex');await page.keyboard.press('p');

        const ghosts=[];
        for(const type of Object.keys(audit.reference)) {
          const g=await page.evaluate(type=>{
            __v.fresh(type,0,3,0);const a=__v.a,game=__v.game();a.put(game,4,16);__v.paint();
            const p=a.active(game);let y=p.y;while(a.fits(game,{...p,y:y+1}))y++;
            return {type,expected:a.cells({...p,y}).map(c=>c.join(',')).sort(),
              drawn:__draws.filter(c=>c.id==='board'&&c.op==='fillRect'&&c.alpha===.25).map(c=>[c.args[0]/30,c.args[1]/30].join(',')).sort()};
          },type);assert.deepEqual(g.drawn,g.expected,'drawn ghost '+type);ghosts.push(g);
        }
        const presentation=await page.evaluate(()=>{
          __v.fresh();const g=__v.game();g.holdPiece='O';g.nextPieces;g.bag.queue.fill('I');__v.paint();
          const canvases=[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();return {id:c.id,x:r.x,y:r.y,width:r.width,height:r.height,backing:[c.width,c.height]};});
          const preview=__draws.filter(c=>c.id!=='board'&&c.op==='fillRect'&&c.args[2]===20&&c.args[3]===20);
          return {documentWidth:document.documentElement.scrollWidth,canvases,previewCells:preview.length,
            outside:preview.filter(c=>c.args[0]<0||c.args[1]<0||c.args[0]+20>c.canvas[0]||c.args[1]+20>c.canvas[1]).length};
        });
        assert.equal(presentation.previewCells,24);assert.equal(presentation.outside,0);
        const board=presentation.canvases.find(c=>c.id==='board');assert.equal(board.width,300);assert.equal(board.height,600);
        const expected=name==='desktop'?{documentWidth:1280,positions:[352,490,828]}:{documentWidth:503,positions:[-93,45,383]};
        assert.equal(presentation.documentWidth,expected.documentWidth);
        presentation.canvases.forEach((c,i)=>assert(Math.abs(c.x-expected.positions[i])<.03,'exact canvas x'));
        assert(board.x>=0&&board.x+board.width<=width);
        const holdCanvas=presentation.canvases[0],nextCanvas=presentation.canvases[2];
        assert.deepEqual([holdCanvas.width,holdCanvas.height,nextCanvas.width,nextCanvas.height],[100,60,100,300]);
        assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
        if(artifacts)await page.screenshot({path:path.join(artifacts,`medium-rerun-${name}.png`),fullPage:true});
        result.views[name]={presentation,pc:{score:pc.score,lines:pc.lines,count:pc.count},soft:{rows:soft.active.y,points:soft.score},
          clocks,ledge,ghosts:ghosts.length,controls:controls.map(c=>c.key),
          round2:{rotationOutcomes:engine.rotationOutcomes,spinFacings:engine.spinFacings,
            nonadjacentClear:engine.nonadjacentClear,scaledScores:engine.scaledScores,
            pauseGravity:engine.pauseGravity,pauseLock:engine.pauseLock,softRelease:engine.softRelease,
            heldRepeat:true,latestDirection:true,blurRelease:true,repeatSuppression:true,pauseKeys:true},errors,assets};
      } finally {await context.close();}
    }
  } finally {process.off('SIGTERM',shutdown);process.off('SIGINT',shutdown);await browser.close();}
  console.log(JSON.stringify(result));return result;
}
module.exports={runBrowser};
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e.stack);process.exitCode=1;});
