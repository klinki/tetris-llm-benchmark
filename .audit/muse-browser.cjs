// Playwright CLI run-code snippet. Serve only disposable builds with npm start.
async (page) => {
  const mode = new URL(page.url()).searchParams.get('audit');
  if (!['minimal','low','medium','high','xhigh'].includes(mode)) throw new Error('Unknown Muse effort');
  const errors=[], consoleErrors=[], badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.location().url?.endsWith('/favicon.ico'))consoleErrors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badResponses.push({status:r.status(),url:r.url()});});
  const check=(c,m)=>{if(!c)throw new Error(m);};
  const measure=()=>page.evaluate(mode=>{
    const box=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const canvas=box(mode==='low'?'#game':'#board');
    const border={minimal:2,medium:0,high:1,xhigh:2}[mode]??0;
    const board=mode==='low'?{x:canvas.x+20,y:canvas.y+20,width:280,height:560}:{x:canvas.x+border,y:canvas.y+border,width:300,height:600};
    return {viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,
      canvas,board,hold:box('#hold'),next:box('#next'),sidebars:[...document.querySelectorAll('.side,.panel')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,width:r.width};}),
      lowSideX:mode==='low'?canvas.x+324:null,
      overlay:document.querySelector('#overlay')?getComputedStyle(document.querySelector('#overlay')).display:null,
      legend:document.body.innerText,canvasLabel:document.querySelector('canvas').getAttribute('aria-label')};
  },mode);
  await page.setViewportSize({width:1280,height:800});await page.reload({waitUntil:'networkidle'});
  await page.evaluate(async mode=>{
    const core=await import(mode==='minimal'||mode==='high'?'/dist/tetris.js':'/dist/game.js');
    const Game=core.Game??core.TetrisGame, name=['medium','high'].includes(mode)?'tick':'update';
    const original=Game.prototype[name];
    Game.prototype[name]=function(dt){window.__museGame=this;window.__museStep=ms=>original.call(this,mode==='xhigh'?ms/1000:ms);if(!window.__museFreeze)return original.call(this,dt);};
    const grid=g=>mode==='minimal'||mode==='low'?g.grid:mode==='high'?g.board:g.board.grid;
    const raw=g=>mode==='minimal'||mode==='high'?g.active:g.current;
    const held=g=>mode==='minimal'||mode==='low'?g.holdKind:mode==='medium'?g.held:mode==='high'?g.holdType:g.hold;
    const queue=g=>mode==='minimal'?g.queue:mode==='medium'?g.next:g.nextQueue;
    window.__museState=()=>{const g=window.__museGame,p=raw(g);return {type:p?.type??p?.kind,rotation:p?.rotation??p?.rot,x:p?.x,y:p?.y,score:g.score,held:held(g),canHold:g.canHold,
      occupied:grid(g).flat().filter(Boolean).length,over:mode==='minimal'?g.over:mode==='low'?g.status==='over':g.gameOver,soft:mode==='high'?g.softDropping:g.softDrop};};
    window.__museGrid=()=>grid(window.__museGame);
    window.__musePlace=(type='T',y=5,x=3)=>{
      const g=window.__museGame;
      const p=mode==='minimal'?{kind:type,rot:0,x,y}:mode==='low'||mode==='xhigh'?{kind:type,rotation:0,x,y}:{type,rotation:0,x,y};
      g[mode==='minimal'||mode==='high'?'active':'current']=p;
      Object.assign(g,{score:0,lines:0,level:1,combo:-1,b2b:false,backToBack:false,fallAccum:0,fallAccMs:0,fallTimer:0,gravityTimer:0,lockTimer:0,lockMs:0,lockResets:0,
        lastMoveWasRotate:false,lastActionWasRotate:false,lastActionRotate:false,softDrop:false,softDropping:false,canHold:true,gameOver:false,over:false});
      if(mode==='low'){g.status='playing';g.onGround=false;}
      grid(g).forEach(r=>r.fill(mode==='minimal'||mode==='high'?0:null));
      queue(g).splice(0,queue(g).length,...['I','O','S','Z','J','L','T','I','O']);
    };
    // Forwarding wrappers observe the real installed DOM input handlers.
    window.__museCalls=[];
    const names=[mode==='low'||mode==='xhigh'?'tryMove':'move',mode==='low'||mode==='xhigh'?'tryRotate':'rotate',mode==='minimal'?'hardDropWithScore':'hardDrop',mode==='xhigh'?'holdPiece':'hold',mode==='low'||mode==='medium'?'restart':'reset'];
    for(const name of names){const fn=Game.prototype[name];Game.prototype[name]=function(...args){const before=window.__museState(),value=fn.apply(this,args);window.__museCalls.push({name,args,before,after:window.__museState()});return value;};}
  },mode);
  await page.waitForFunction(()=>!!window.__museGame);
  await page.evaluate(()=>{window.__museFreeze=true;window.__musePlace();});
  for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft'])await page.keyboard.press(key);
  let calls=await page.evaluate(()=>window.__museCalls);
  check(calls.length===6,'Unexpected input calls');
  check(calls[0].after.x===calls[0].before.x-1&&calls[1].after.x===calls[1].before.x+1,'Horizontal keys failed');
  for(let i=2;i<6;i++)check(calls[i].args[0]===(i<4?1:-1)&&calls[i].after.rotation===(calls[i].before.rotation+(i<4?1:-1)+4)%4,'Rotation key failed');
  const softBefore=await page.evaluate(()=>window.__museState());
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(120);
  const softAfter=await page.evaluate(()=>{for(let i=0;i<6;i++)window.__museStep(16);window.__museStep(24);return window.__museState();});
  await page.keyboard.up('ArrowDown');
  check(softAfter.soft&&softAfter.y>softBefore.y&&softAfter.score>softBefore.score,'Soft drop binding failed');
  await page.keyboard.press('Space');
  const hardAfter=await page.evaluate(()=>window.__museState());check(hardAfter.occupied===4&&hardAfter.canHold,'Hard drop binding failed');
  await page.keyboard.press('c');const holdAfter=await page.evaluate(()=>window.__museState());
  check(holdAfter.held===hardAfter.type&&!holdAfter.canHold,'Hold key failed');
  await page.keyboard.press('c');check((await page.evaluate(()=>window.__museState())).type===holdAfter.type,'Hold restriction failed');
  await page.waitForTimeout(40);const desktop=await measure();await page.screenshot({path:`muse-${mode}-desktop.png`});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(50);const mobile=await measure();
  await page.screenshot({path:`muse-${mode}-mobile.png`});
  check(desktop.documentWidth===1280&&desktop.board.width>=280,'Desktop board failed');
  const expectedPhone={
    minimal:[501,43,304,45,-102,372], low:[505,-115,620,-95,null,null],
    medium:[537,45,300,45,-115,372.6875],high:[502,44,302,45,-99,375],xhigh:[515,43,304,45,-113,363],
  }[mode];
  const observed=[mobile.documentWidth,mobile.canvas.x,mobile.canvas.width,mobile.board.x,mobile.hold?.x??null,mobile.next?.x??null];
  check(observed.every((v,i)=>v===null?expectedPhone[i]===null:Math.abs(v-expectedPhone[i])<0.02),`Phone layout changed: ${JSON.stringify(mobile)}`);
  if(mode==='xhigh')check(desktop.overlay==='none'&&mobile.overlay==='none','Active overlay visible');
  await page.evaluate(mode=>{window.__musePlace('O',0,mode==='minimal'||mode==='low'?3:4);for(let i=0;i<50;i++)window.__museStep(16);},mode);
  const timerBefore=await page.evaluate(()=>window.__museState());
  await page.keyboard.down('ArrowDown');const keydownAfter=await page.evaluate(()=>window.__museState());
  const timerAfter=await page.evaluate(()=>{window.__museStep(1);return window.__museState();});await page.keyboard.up('ArrowDown');
  const expected=mode==='minimal'?1:mode==='low'||mode==='xhigh'?20:mode==='high'?17:16;
  check(timerAfter.y-timerBefore.y===expected,'Real ArrowDown timer transition changed');
  check(timerAfter.score===(mode==='high'?16:expected),'Soft transition score changed');
  if(mode==='high'){
    check(keydownAfter.y-timerBefore.y===1&&keydownAfter.score===0,'Documented unscored initial soft row changed');
    await page.evaluate(()=>window.__musePlace('O',5,4));await page.keyboard.down('ArrowDown');
    const initialSoft=await page.evaluate(()=>window.__museState());await page.keyboard.up('ArrowDown');
    check(initialSoft.y===6&&initialSoft.score===0,'Isolated unscored Down row changed');
  }
  // Place the next T spawn behind one injected block; actual Space triggers top-out.
  await page.evaluate(mode=>{window.__musePlace('O',20,mode==='minimal'||mode==='low'?-1:0);const g=window.__museGame;
    const q=mode==='minimal'?g.queue:mode==='medium'?g.next:g.nextQueue;q[0]='T';window.__museGrid()[0][4]='J';},mode);
  await page.keyboard.press('Space');await page.waitForTimeout(30);
  const beforeRestart=await page.evaluate(()=>window.__museState());check(beforeRestart.over,'Blocked-spawn game over failed');
  const gameOverLayout=await measure();if(mode==='xhigh')check(gameOverLayout.overlay==='flex','Game-over overlay not shown');
  await page.keyboard.press('r');await page.waitForTimeout(30);const afterRestart=await page.evaluate(()=>window.__museState());
  check(!afterRestart.over&&afterRestart.score===0&&afterRestart.occupied===0&&afterRestart.held===null&&afterRestart.canHold,'Real R restart failed');
  if(mode==='xhigh')check((await measure()).overlay==='none','Restart overlay not hidden');
  // Record preview drawing bounds without changing any renderer behavior.
  let preview=null,legend=null;
  if(mode==='medium'||mode==='low'){
    await page.evaluate(mode=>{window.__musePlace('I',5);const g=window.__museGame;
      if(mode==='medium'){g.held='I';g.next[0]='I';}
      window.__musePaint=[];const proto=CanvasRenderingContext2D.prototype;
      const fill=proto.fillRect,text=proto.fillText;
      proto.fillRect=function(...a){if(this.canvas.id==='hold'||this.canvas.id==='next')window.__musePaint.push({id:this.canvas.id,op:'rect',a,canvasWidth:this.canvas.width,style:this.fillStyle});return fill.apply(this,a);};
      proto.fillText=function(...a){if(this.canvas.id==='game')window.__musePaint.push({id:'game',op:'text',a,font:this.font,width:this.measureText(a[0]).width});return text.apply(this,a);};
    },mode);
    await page.waitForTimeout(40);
    const paints=await page.evaluate(()=>window.__musePaint);
    if(mode==='medium'){
      preview=paints.filter(p=>p.op==='rect'&&p.style==='#00e5ff');
      check(preview.some(p=>p.id==='hold'&&p.a[0]===74&&p.a[2]===20&&p.canvasWidth===88)
        &&preview.some(p=>p.id==='next'&&p.a[0]===74&&p.a[2]===20&&p.canvasWidth===88),'I preview clipping no longer reproduces');
      const edge=await page.evaluate(()=>{const c=document.querySelector('#hold');return [...c.getContext('2d').getImageData(87,26,1,1).data];});
      check(JSON.stringify(edge)==='[0,229,255,255]','Clipped I must reach the preview canvas edge');
    } else {
      legend=paints.filter(p=>p.op==='text'&&String(p.a[0]).includes('rotate'));
      check(legend.some(p=>p.a[1]===184&&p.a[2]===544),'Overlaid legend finding changed');
    }
    await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(30);
    await page.screenshot({path:`muse-${mode}-detail.png`});
  }
  check(!errors.length&&!consoleErrors.length&&!badResponses.length,JSON.stringify({errors,consoleErrors,badResponses}));
  const result={mode,browser:page.context().browser().version(),desktop,mobile,calls,softBefore,softAfter,hardAfter,holdAfter,
    timerBefore,keydownAfter,timerAfter,beforeRestart,afterRestart,preview,legend,errors,consoleErrors,badResponses};
  await page.evaluate(r=>{window.__tetrisAudit=r;},result);console.log(JSON.stringify(result,null,2));
}
