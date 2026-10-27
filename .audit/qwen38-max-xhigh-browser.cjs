// Real Chromium events and unchanged frame/render bodies, disposable own servers.
const {chromium}=require('../node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

async function runBrowser(base,mode,artifacts) {
  const audit=await import(pathToFileURL(path.join(__dirname,'qwen38-max-xhigh-audit.mjs')));
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
        page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
        page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push(r.url());});
        page.on('requestfailed',r=>assets.push(r.url()));
        await page.addInitScript(()=>{
          window.__now=0;Object.defineProperty(performance,'now',{value:()=>window.__now});window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};window.__draws=[];
          for(const op of ['fillRect','strokeRect','fillText']) {
            const original=CanvasRenderingContext2D.prototype[op];
            CanvasRenderingContext2D.prototype[op]=function(...args) {
              __draws.push({op,args,alpha:this.globalAlpha,style:this.fillStyle});
              return original.apply(this,args);
            };
          }
        });
        await page.route(new URL('dist/main.js',base).href,async route=>{
          const response=await route.fetch();
          await route.fulfill({response,body:await response.text()+
            '\nwindow.__app={game,paint(){renderer.render(game)},resetClock(){last=0;input.handleBlur();window.__now=0}};'});
        });
        await page.goto(base,{waitUntil:'networkidle'});
        const tested=await page.evaluate(async({mode,factory,probe,additional,oracle})=>{
          const prefix='/dist/';
          const a=(0,eval)(`(${factory})`)({game:await import(prefix+'game.js'),pieces:await import(prefix+'pieces.js')},mode);
          const evidence=(0,eval)(`(${probe})`)(a,oracle);
          const extra=(0,eval)(`(${additional})`)(a);let time=0;const game=()=>__app.game;
          const paint=()=>{__draws.length=0;__app.paint();};
          const reset=()=>{Object.assign(game(),a.make(42));__app.resetClock();time=0;};
          const fresh=(type='T',rotation=0,x=3,y=5)=>{reset();a.clear(game());a.place(game(),type,rotation,x,y);paint();};
          const frame=dt=>{time+=dt;window.__now=time;__draws.length=0;__frame(time);};
          const advance=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);frame(dt);ms-=dt;}};
          const state=()=>({active:a.active(game()),count:a.count(game()),score:game().score,lines:game().lines,
            level:game().level,held:a.held(game()),canHold:a.canHold(game()),over:a.over(game())});
          window.__v={a,game,paint,reset,fresh,frame,advance,state};fresh();return {evidence,extra};
        },{mode,factory:audit.createAdapter.toString(),probe:audit.runProbes.toString(),additional:audit.additionalProbes.toString(),
          oracle:{reference:audit.reference,normalKicks:audit.normalKicks,iKicks:audit.iKicks}});
        const engine=tested.evidence;audit.assertRecorded(engine,tested.extra);
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
        assert.equal(controls[6].after.active.y-controls[6].before.active.y,1);
        assert.equal(controls[6].after.score,1);
        assert.equal(controls[7].after.count,4);
        assert.equal(controls[8].after.held,controls[8].before.active.type);assert.equal(controls[8].after.canHold,false);

        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});
        await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));
        const soft=await page.evaluate(()=>({rows:__v.state().active.y,points:__v.state().score}));
        await page.keyboard.up('ArrowDown');
        assert.deepEqual(soft,{rows:0,points:0});
        await page.evaluate(()=>__v.fresh('O',0,3,18));
        await page.keyboard.down('ArrowDown');await page.evaluate(()=>__v.frame(1));
        const blockedSoft=(await page.evaluate(()=>__v.state())).count;await page.keyboard.up('ArrowDown');
        assert.equal(blockedSoft,0);

        // Actual conforming CCW floor-I outcomes, independently of intercepted tables.
        const floor=[];
        for(const [rotation,y]of [[0,18],[2,17]]) {
          await page.evaluate(({rotation,y})=>__v.fresh('I',rotation,3,y),{rotation,y});
          await page.keyboard.press('z');floor.push((await page.evaluate(()=>__v.state())).active);
        }
        assert.deepEqual(floor,[engine.concreteKicks.IFloorCCW.pose,engine.concreteKicks.I2FloorCCW.pose]);
        // Real Space repeats scoring findings without assigning spin credit.
        const spins=[];
        for(const full of [false,true]) {
          await page.evaluate(full=>{__v.fresh('T',3,3,17);const a=__v.a,g=__v.game();
            for(const[x,y]of [[5,17],[3,19],full?[3,17]:[5,19]])a.put(g,x,y);
          },full);
          await page.keyboard.press('ArrowUp');await page.keyboard.press('Space');
          spins.push((await page.evaluate(()=>__v.state())).score);
        }
        assert.deepEqual(spins,[0,0]);
        await page.evaluate(()=>{__v.fresh('I',0,3,18);for(let x=0;x<10;x++)if(x<3||x>6)__v.a.put(__v.game(),x,19);});
        await page.keyboard.press('Space');
        const pc=await page.evaluate(()=>({score:__v.state().score,cells:__v.state().count,lines:__v.state().lines}));
        assert.deepEqual(pc,{score:100,cells:0,lines:1});

        await page.evaluate(()=>__v.fresh());
        const b2b=[];
        for(const action of ['tetris','none','tetris']) {
          await page.evaluate(action=>{const a=__v.a,g=__v.game();
            if(action==='tetris') {a.clear(g);for(let y=16;y<20;y++)for(let x=0;x<10;x++)if(x!==4)a.put(g,x,y);a.put(g,0,10);a.place(g,'I',1,2,16);}
            else {a.clear(g);a.place(g,'O',0,7,18);}
          },action);
          if(!b2b.length)await page.evaluate(()=>__v.game().score=0);
          await page.keyboard.press('Space');b2b.push((await page.evaluate(()=>__v.state())).score);
        }
        assert.deepEqual(b2b,[800,800,1600]);
        const clocks=await page.evaluate(()=>{
          __v.fresh('O',0,3,17);__v.advance(990);__v.frame(16);__v.advance(483);
          const landing=[__v.state().count];__v.frame(1);landing.push(__v.state().count);
          const refresh={};for(const[level,duration]of [[2,1480.001],[10,600],[15,100]]) {
            refresh[level+':'+duration]=[];
            for(const hz of [60,144]){__v.fresh('O',0,3,0);__v.game().level=level;let t=0;
              while(t<duration-1e-8){const dt=Math.min(1000/hz,duration-t);__v.frame(dt);t+=dt;}
              refresh[level+':'+duration].push(__v.state().active.y);
            }
          }
          return {landing,refresh};
        });
        assert.deepEqual(clocks.landing,[0,0]);assert.deepEqual(clocks.refresh,engine.refresh);
        await page.evaluate(()=>__v.fresh('O',0,3,18));
        for(let i=0;i<15;i++){await page.evaluate(()=>__v.advance(10));await page.keyboard.press(i%2?'ArrowLeft':'ArrowRight');}
        await page.evaluate(()=>__v.advance(499));assert.equal((await page.evaluate(()=>__v.state())).count,0);
        await page.keyboard.press('ArrowLeft');await page.evaluate(()=>__v.frame(1));
        assert.equal((await page.evaluate(()=>__v.state())).count,4);
        await page.evaluate(()=>{__v.fresh('O',0,0,12);__v.a.put(__v.game(),0,14);});
        for(let i=0;i<15;i++){await page.evaluate(()=>__v.frame(1));await page.keyboard.press('ArrowUp');}
        await page.evaluate(()=>__v.advance(490));await page.keyboard.press('ArrowRight');
        const ledge=await page.evaluate(()=>{let elapsed=0,landedAt=null;
          while(!__v.a.get(__v.game(),1,19)&&elapsed<9000){__v.frame(1);elapsed++;if(landedAt===null&&__v.state().active?.y===18)landedAt=elapsed;}
          return {landedAt,lockedAt:elapsed};
        });assert.deepEqual(ledge,{landedAt:6000,lockedAt:6500});
        await page.evaluate(()=>{__v.fresh('O',0,3,0);__v.advance(800);});
        await page.keyboard.press('c');const holdY=(await page.evaluate(()=>__v.state())).active.y;
        await page.evaluate(()=>__v.advance(999));assert.equal((await page.evaluate(()=>__v.state())).active.y,holdY);
        await page.evaluate(()=>__v.frame(1));assert.equal((await page.evaluate(()=>__v.state())).active.y,holdY+1);

        for(const fixture of engine.hidden) {
          await page.evaluate(f=>{__v.fresh();const a=__v.a,g=__v.game();a.clear(g);
            for(const[x,y]of f.stack)a.put(g,x,y);a.spawn(g,'T');a.incoming(g,'I');
          },fixture);
          for(const action of fixture.path) {
            if(action==='WAIT1000')await page.evaluate(()=>__v.advance(1000));
            else await page.keyboard.press({L:'ArrowLeft',R:'ArrowRight',CW:'ArrowUp',CCW:'z'}[action]);
          }
          assert.deepEqual((await page.evaluate(()=>__v.state())).active,fixture.pose);
          await page.keyboard.press('Space');assert.equal((await page.evaluate(()=>__v.state())).over,fixture.over);
        }
        await page.evaluate(()=>{__v.fresh();const a=__v.a,g=__v.game();a.spawn(g,'T');
          const[x,y]=a.cells(a.active(g))[0];a.put(g,x,y);a.place(g,'O',0,0,18);a.incoming(g,'T');
        });await page.keyboard.press('Space');
        const terminal=await page.evaluate(()=>__v.state());assert(terminal.over);
        for(const key of ['ArrowLeft','ArrowUp','Space','c','ArrowDown'])await page.keyboard.press(key);
        await page.evaluate(()=>__v.advance(1000));assert.deepEqual(await page.evaluate(()=>__v.state()),terminal);
        await page.keyboard.press('r');
        assert.deepEqual(await page.evaluate(()=>{const s=__v.state();return[s.over,s.count,s.score,s.lines,s.level,s.held,s.canHold];}),[false,0,0,0,1,null,true]);
        // Twelve actual Space presses to game over, real R, then seven actual spawns.
        await page.evaluate(()=>__v.reset());let drops=0;
        while(!(await page.evaluate(()=>__v.state())).over&&drops<100){await page.keyboard.press('Space');drops++;}
        assert.equal(drops,12);assert((await page.evaluate(()=>__v.state())).over);
        await page.keyboard.press('r');const opening=[];
        for(let i=0;i<7;i++) {opening.push((await page.evaluate(()=>__v.state())).active.type);
          await page.evaluate(()=>__v.a.clear(__v.game()));await page.keyboard.press('Space');}
        const restartBag={drops,opening,types:new Set(opening).size};assert.deepEqual(restartBag,engine.restartBag);

        // Actual held keys, latest direction, release, repeat suppression and blur.
        await page.evaluate(()=>__v.fresh());await page.keyboard.down('ArrowRight');await page.evaluate(()=>__v.advance(700));
        assert.equal((await page.evaluate(()=>__v.state())).active.x,7);await page.keyboard.up('ArrowRight');
        await page.evaluate(()=>__v.fresh());await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowRight');
        await page.evaluate(()=>__v.advance(250));const recent=(await page.evaluate(()=>__v.state())).active.x;assert(recent>3);
        await page.keyboard.up('ArrowRight');await page.evaluate(()=>__v.advance(250));assert((await page.evaluate(()=>__v.state())).active.x<recent);
        await page.keyboard.up('ArrowLeft');await page.evaluate(()=>__v.fresh());
        await page.keyboard.down('x');await page.keyboard.down('x');await page.keyboard.up('x');
        assert.equal((await page.evaluate(()=>__v.state())).active.rotation,1);
        await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowDown');
        await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blur=await page.evaluate(()=>__v.state());
        await page.evaluate(()=>__v.advance(300));assert.deepEqual(await page.evaluate(()=>__v.state()),blur);
        await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowDown');

        const ghosts=[];
        for(const type of Object.keys(audit.reference)) {
          const actual=await page.evaluate(({type,mode})=>{
            __v.fresh(type,0,3,0);__v.a.put(__v.game(),4,16);__v.paint();
            const ox=178;
            const calls=__draws.filter(c=>c.op==='fillRect'&&c.alpha>.1&&c.alpha<.2&&c.args[2]===26&&c.args[3]===26);
            return calls.map(c=>[Math.floor((c.args[0]-ox-1)/28),Math.floor((c.args[1]-17)/28)]).sort();
          },{type,mode});
          const expected=audit.reference[type][0].map(([x,y])=>[x+3-(type==='O'?1:0),y+14]).sort();
          assert.deepEqual(actual,expected);ghosts.push({type,y:14});
        }
        const previews=await page.evaluate(mode=>{
          __v.fresh();const g=__v.game();g.held='O';
          __v.a.queue(g).fill('I');__v.paint();
          const cells=__draws.filter(c=>c.op==='fillRect'&&c.args[2]===18&&c.args[3]===18);
          const canvas=document.querySelector('canvas');
          return {cells:cells.length,outside:cells.filter(c=>c.args[0]<0||c.args[1]<0||c.args[0]+c.args[2]>canvas.width||c.args[1]+c.args[3]>canvas.height).length};
        },mode);assert.deepEqual(previews,{cells:16,outside:0});
        const layout=await page.evaluate(()=>{
          const c=document.querySelector('canvas'),r=c.getBoundingClientRect();
          return {documentWidth:document.documentElement.scrollWidth,canvas:{x:r.x,y:r.y,width:r.width,height:r.height},
            field:{x:r.x+178,width:280,height:560},holdX:r.x+16,nextX:r.x+470,
            aspect:r.width/c.width/(r.height/c.height)};
        });
        assert.equal(layout.canvas.x,name==='desktop'?322:-123);
        assert.equal(layout.canvas.width,636);assert.equal(layout.canvas.height,592);
        assert.equal(layout.documentWidth,name==='desktop'?1280:513);assert.equal(layout.aspect,1);
        if(name==='mobile')assert.deepEqual([layout.field.x,layout.holdX,layout.nextX],[55,-107,347]);
        assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
        await page.screenshot({path:path.join(artifacts,`${mode}-${name}.png`),fullPage:true});
        result.views[name]={controls:controls.map(c=>c.key),soft,blockedSoft,floor,spins,pc,clocks,ledge,restartBag,
          ghosts,previews,layout,b2b,extra:tested.extra,heldKeys:true,blurRelease:true,errors,assets};
      } finally {await context.close();}
    }
  } finally {await browser.close();process.removeListener('SIGTERM',shutdown);process.removeListener('SIGINT',shutdown);}
  console.log(JSON.stringify(result));return result;
}
runBrowser(process.argv[2],process.argv[3],process.argv[4]).catch(e=>{console.error(e.stack);process.exitCode=1;});
