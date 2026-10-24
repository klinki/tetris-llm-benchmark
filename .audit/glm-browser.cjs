// Playwright CLI snippet. Open the disposable npm start URL with ?audit=effort.
async (page) => {
  const mode = new URL(page.url()).searchParams.get('audit');
  if (!['low', 'high', 'max'].includes(mode)) throw new Error('Unknown effort');
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [], consoleErrors = [], badResponses = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.location().url?.endsWith('/favicon.ico')) consoleErrors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) badResponses.push({ status:r.status(),url:r.url() }); });
  // Retain the actual delivered frame callback. Time is driven explicitly,
  // making controls and refresh-rate probes independent of machine load.
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => { window.__glmFrame = callback; return 1; };
  });
  await page.setViewportSize({ width:1280,height:800 });
  await page.reload({ waitUntil:'networkidle' });
  await page.evaluate(async mode => {
    const { Game } = await import(mode === 'low' ? '/game/game.js' : '/dist/game.js');
    const original = Game.prototype.move;
    Game.prototype.move = function (...args) { window.__glmGame = this; return original.apply(this,args); };
    window.__glmOriginalMove = original;
    window.__glmPrototype = Game.prototype;
  },mode);
  await page.keyboard.press('ArrowLeft');
  await page.evaluate(mode => {
    const g=window.__glmGame,p=window.__glmPrototype;
    p.move=window.__glmOriginalMove;
    const bottom=mode==='max'?21:19, blank=mode==='low'?0:null;
    const grid=()=>mode==='low'?g.board:mode==='high'?g.board.grid:g.field.cells;
    const state=()=>({ ...g.piece, score:mode==='low'?g.stats.score:g.score,
      held:mode==='high'?g.holdKind:g.hold, canHold:mode==='high'?g.canHold:!g.holdUsed,
      occupied:grid().flat().filter(c=>c!==blank).length,
      over:mode==='low'?g.status==='over':mode==='high'?g.over:g.state==='over' });
    const reset=()=>{ (g.restart??g.reset).call(g); };
    const place=(type,x,y)=>{
      g.piece=mode==='low'?{id:'IJLOSTZ'.indexOf(type),rotation:0,x,y}:mode==='high'?{kind:type,rot:0,x,y}:{type,rot:0,x,y};
      Object.assign(g,mode==='low'?{gravityAccumulator:0,lockFrames:0,moveResetCount:0}
        :mode==='high'?{fallTimer:0,lockTimer:0,lockResets:0,lowestY:y,lastActionRotation:false}
        :{gravityAcc:0,softAcc:0,lockAcc:0,lockResets:0,grounded:false,lastRotation:false});
    };
    window.__glmState=state;window.__glmReset=reset;window.__glmPlace=place;window.__glmGrid=grid;
    window.__glmStep=(mode==='low'?g.tick:g.update).bind(g);
    window.__glmDraw=()=>window.__glmFrame(performance.now());
    window.__glmKeys=[];
    for(const name of ['move','rotate','hardDrop',mode==='high'?'hold':'holdPiece']){
      const original=p[name];p[name]=function(...args){const before=state(),result=original.apply(this,args),after=state();
        window.__glmKeys.push({name,args,before,after,result});return result;};
    }
    if(mode==='low'){
      // The main loop resets `last` on every frame and discards the remainder.
      // This forwards every tick; only the callback timestamps are controlled.
      let ticks=0;g.tick=function(){ticks++;window.__glmStep();};
      window.__glmFrame(1000);reset();place('O',4,0);ticks=0;
      for(let i=1;i<=120;i++)window.__glmFrame(1000+i*1000/120);
      const fast={ticks,y:g.piece.y,occupied:state().occupied};
      ticks=0;for(let i=1;i<=60;i++)window.__glmFrame(2000+i*17);
      window.__glmRefresh={hz120:fast,hz60:{ticks}};
    }
    // Freeze simulation in the frame callback, retaining real input/drawing.
    g[mode==='low'?'tick':'update']=()=>{};
    reset();place('T',3,5);window.__glmKeys=[];
    window.__glmDraw();
    window.__glmBottom=bottom;
  },mode);
  const refresh = await page.evaluate(() => window.__glmRefresh ?? null);
  if(mode==='low')check(refresh.hz120.ticks===0&&refresh.hz120.y===0&&refresh.hz120.occupied===0&&refresh.hz60.ticks===60,'Frame-remainder defect changed');
  const measure=()=>page.evaluate(mode=>{
    const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    const canvases=[...document.querySelectorAll('canvas')].map(c=>({id:c.id,...box(c)}));
    const main=canvases.find(c=>c.id===(mode==='max'?'tetris':'board'));
    const scale=mode==='max'?main.width/598:1;
    return{viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,canvases,
      board:mode==='max'?{x:main.x+12*scale,y:main.y+12*scale,width:320*scale,height:640*scale}
        :{x:main.x+(mode==='high'?1:0),y:main.y+(mode==='high'?1:0),width:mode==='low'?240:300,height:mode==='low'?480:600},
      overlay:mode==='high'?{hidden:document.querySelector('#overlay').hidden,display:getComputedStyle(document.querySelector('#overlay')).display}:null};
  },mode);
  const desktop=await measure();
  for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft'])await page.keyboard.press(key);
  const softBefore=await page.evaluate(()=>window.__glmState());
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(120);
  await page.evaluate(mode=>{if(mode==='low')window.__glmStep();else window.__glmStep(100);},mode);
  await page.keyboard.up('ArrowDown');
  const softAfter=await page.evaluate(()=>window.__glmState());
  await page.keyboard.press('Space');await page.keyboard.press('c');
  const controls=await page.evaluate(()=>window.__glmKeys);
  check(controls.length===8,'Required action count changed');
  check(controls[0].after.x===controls[0].before.x-1&&controls[1].after.x===controls[1].before.x+1,'Side movement failed');
  for(let i=0;i<4;i++){
    const c=controls[i+2],dir=i<2?1:-1;
    check(c.args[0]===(mode==='max'?(dir===1?'cw':'ccw'):dir),'Rotation direction failed');
    check((c.after.rot??c.after.rotation)===((c.before.rot??c.before.rotation)+dir+4)%4,'Rotation state failed');
  }
  const hard=controls[6],held=controls[7];
  check(softAfter.y>softBefore.y&&softAfter.score-softBefore.score===(mode==='low'?0:mode==='high'?2:7),'Soft movement/points changed');
  check(hard.after.occupied===4&&held.after.held===(held.before.id??held.before.kind??held.before.type)&&!held.after.canHold,'Hard drop/hold failed');
  await page.evaluate(()=>window.__glmDraw());
  await page.screenshot({path:`glm-${mode}-desktop.png`});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(100); // allow the resized compositor surface to settle
  await page.evaluate(()=>window.__glmDraw());
  const mobile=await measure();
  await page.screenshot({path:`glm-${mode}-mobile.png`});
  check(desktop.documentWidth===1280,'Desktop overflow');
  if(mode==='high')check(mobile.documentWidth===464&&mobile.board.x===45&&mobile.canvases.find(c=>c.id==='hold').x===-74
    &&mobile.canvases.find(c=>c.id==='next').x===360,`Phone sidebar finding changed: ${JSON.stringify(mobile)}`);
  else check(mobile.documentWidth===390&&mobile.board.x>=0&&mobile.board.x+mobile.board.width<=390,'Fitting mobile layout changed');
  if(mode==='high')check(desktop.overlay.hidden&&desktop.overlay.display==='none','Overlay visible during play');
  // Independent normal-to-soft input transition from a fresh O and no lock.
  await page.evaluate(mode=>{window.__glmReset();window.__glmPlace('O',4,0);
    if(mode!=='low')for(let i=0;i<50;i++)window.__glmStep(mode==='high'?16:5);},mode);
  const timerBefore=await page.evaluate(()=>window.__glmState());
  await page.keyboard.down('ArrowDown');
  await page.evaluate(mode=>window.__glmStep(mode==='low'?undefined:1),mode);
  const timerAfter=await page.evaluate(()=>window.__glmState());await page.keyboard.up('ArrowDown');
  check(timerAfter.y-timerBefore.y===(mode==='low'?18:mode==='high'?16:0)&&timerAfter.score===(mode==='high'?16:0),'Soft transition changed');
  // Force the upcoming spawn to collide (low relocates it above the stack).
  await page.evaluate(mode=>{
    window.__glmReset();window.__glmPlace('O',0,window.__glmBottom-1);
    const g=window.__glmGame,rows=mode==='max'?[0,1,2]:[0,1];
    for(const y of rows)for(let x=1;x<10;x++)window.__glmGrid()[y][x]=mode==='low'?2:'J';
  },mode);
  await page.keyboard.press('Space');
  if(mode==='low'){
    check(!(await page.evaluate(()=>window.__glmState())).over,'Low block-out relocation changed');
    await page.keyboard.press('Space'); // now locks the hidden piece and ends
  }
  const beforeRestart=await page.evaluate(()=>window.__glmState());
  check(beforeRestart.over,'Game over fixture failed');
  await page.evaluate(()=>window.__glmDraw());
  if(mode==='high')check((await measure()).overlay.display==='flex','Game-over overlay failed');
  await page.keyboard.press('r');await page.evaluate(()=>window.__glmDraw());
  const afterRestart=await page.evaluate(()=>window.__glmState());
  check(!afterRestart.over&&afterRestart.score===0&&afterRestart.held===null&&afterRestart.canHold&&afterRestart.occupied===0,'R restart failed');
  if(mode==='high')check((await measure()).overlay.display==='none','Restart overlay failed');
  let preview=null;
  if(mode==='low'){
    preview=await page.evaluate(async()=>{
      const {createRenderer}=await import('/game/dom.js');
      const g=window.__glmGame;window.__glmReset();g.hold=0;g.nextQueue=[0,1,2,3,4];
      window.__glmPlace('T',3,5);
      const calls=[],original=CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle});return original.call(this,x,y,w,h);};
      try{createRenderer(document.querySelector('canvas')).draw(g.snapshot());}finally{CanvasRenderingContext2D.prototype.fillRect=original;}
      return{canvasWidth:document.querySelector('canvas').width,cells:calls.filter(c=>c.color==='#00bcd4'&&c.h===17)};
    });
    check(preview.cells.length===8&&preview.cells.some(c=>c.x===358&&c.w===17)
      &&preview.cells.some(c=>c.x===310)&&preview.cells.some(c=>c.x===301),'I preview clipping/overlap finding changed');
    await page.screenshot({path:'glm-low-detail.png'});
  }
  check(!errors.length&&!consoleErrors.length&&!badResponses.length,JSON.stringify({errors,consoleErrors,badResponses}));
  const result={mode,browser:page.context().browser().version(),desktop,mobile,controls,softBefore,softAfter,timerBefore,timerAfter,
    refresh,preview,beforeRestart,afterRestart,errors,consoleErrors,badResponses};
  await page.evaluate(result=>{window.__tetrisAudit=result;},result);
  console.log(JSON.stringify(result,null,2));
}
