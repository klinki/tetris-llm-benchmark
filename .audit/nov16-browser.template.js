async (page) => {
  const mode=__MODE__, name=__NAME__, url=__URL__, fixture=__FIXTURE__, oracle=__ORACLE__, artifacts=__ARTIFACTS__;
  const browser=page.context().browser(), result={mode,browser:browser.version(),views:{}};
  for(const [view,viewport] of Object.entries({desktop:{width:1280,height:800},mobile:{width:390,height:844}})) {
    const context=await browser.newContext({viewport,deviceScaleFactor:2});
    const p=await context.newPage(), errors=[],assets=[];
    p.on('pageerror',e=>errors.push(e.message));
    p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push([r.url(),r.status()]);});
    await p.addInitScript(()=>{
      window.__clock=1000;window.__raf=[];
      Object.defineProperty(performance,'now',{value:()=>window.__clock});
      window.requestAnimationFrame=fn=>(window.__raf.push(fn),window.__raf.length);
      window.__frame=ms=>{window.__clock+=ms;for(const fn of window.__raf.splice(0))fn(window.__clock);};
      window.__textDraws=[];
      const fillText=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){const m=this.measureText(String(text));window.__textDraws.push({text:String(text),x,y,font:this.font,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent});return fillText.call(this,text,x,y,...rest);};
    });
    await context.route('**/__audit/engine.mjs',r=>r.fulfill({contentType:'text/javascript',body:fixture}));
    await context.route(`**/dist/${mode==='hy4'?'index':'main'}.js`,async route=>{
      const response=await route.fetch(),body=await response.text();
      if(body.split('const game = new Game();').length!==2)throw Error('Game exposure point changed');
      await route.fulfill({response,body:body.replace('const game = new Game();','const game = new Game(); window.__auditGame = game;')});
    });
    try {
      await p.goto(url);await p.waitForFunction(()=>window.__auditGame&&window.__raf.length);
      await p.evaluate(()=>window.__frame(0));
      await p.screenshot({path:`${artifacts}/${name}-${view}-initial.png`,fullPage:true});
      const engine=await p.evaluate(async({mode,oracle})=>{
        const u=await import('/__audit/engine.mjs');
        const m={game:await import('/dist/game.js'),pieces:await import('/dist/pieces.js')};
        if(mode==='high'||mode==='low')m.srs=await import('/dist/srs.js');
        window.__a=u.createAdapter(m,mode);
        window.__setup=(t='T',r=0,x=3,y=3)=>{const a=window.__a,g=window.__auditGame;a.restart(g);a.clear(g);a.place(g,t,r,x,y);window.__frame(0);};
        window.__state=()=>{const a=window.__a,g=window.__auditGame;return {pose:a.active(g),score:g.score,lines:g.lines,over:a.over(g),count:a.count(g),held:mode==='hy4'?g.holdType:g.hold};};
        return u.runProbes(window.__a,oracle);
      },{mode,oracle});
      const controls=[];
      for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']) {
        await p.evaluate(()=>window.__setup());
        const before=await p.evaluate(()=>window.__state());
        if(key==='ArrowDown'){await p.keyboard.down(key);await p.evaluate(()=>window.__frame(60));await p.keyboard.up(key);}
        else await p.keyboard.press(key);
        const after=await p.evaluate(()=>window.__state());
        const good=key==='ArrowLeft'?after.pose.x===2:key==='ArrowRight'?after.pose.x===4
          :['ArrowUp','x'].includes(key)?after.pose.rotation===1:['z','ControlLeft'].includes(key)?after.pose.rotation===3
          :key==='ArrowDown'?after.pose.y>before.pose.y&&after.score>0:key==='Space'?after.count===4:after.held==='T';
        if(!good)throw Error(`Input ${key} failed: ${JSON.stringify({before,after})}`);
        controls.push(key);
      }
      const spins={};
      for(const kind of ['travel','mini','full']) {
        await p.evaluate(kind=>{
          window.__setup('T',kind==='travel'?0:3,kind==='travel'?0:3,kind==='travel'?3:17);
          const stack=kind==='travel'?[[0,17],[0,19],[2,19]]:kind==='mini'?[[5,17],[3,19],[5,19]]:[[5,17],[3,19],[3,17]];
          for(const[x,y]of stack)window.__a.put(window.__auditGame,x,y);
        },kind);
        await p.keyboard.press('ArrowUp');
        const pose=await p.evaluate(()=>({pose:window.__a.active(window.__auditGame),ghost:window.__a.ghost(window.__auditGame)}));
        await p.keyboard.press('Space');
        spins[kind]={...pose,score:(await p.evaluate(()=>window.__state())).score,expected:kind==='travel'?28:kind==='mini'?100:400};
      }
      await p.evaluate(()=>{window.__setup();window.__a.step(window.__auditGame,900);});
      const y=await p.evaluate(()=>window.__state().pose.y);
      await p.keyboard.down('ArrowDown');await p.evaluate(()=>window.__frame(1));await p.keyboard.up('ArrowDown');
      const softEntryRows=(await p.evaluate(()=>window.__state())).pose.y-y;
      await p.evaluate(()=>window.__setup());let drops=0;
      while(!(await p.evaluate(()=>window.__state().over))&&drops<100){await p.keyboard.press('Space');await p.evaluate(()=>window.__a.finish(window.__auditGame));drops++;}
      if(drops===100)throw Error('No terminal state');
      const terminal=await p.evaluate(()=>window.__state());
      for(const key of ['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','c'])await p.keyboard.press(key);
      if(JSON.stringify(await p.evaluate(()=>window.__state()))!==JSON.stringify(terminal))throw Error('Terminal actions changed state');
      await p.keyboard.press('r');const restarted=await p.evaluate(()=>window.__state());
      if(restarted.over||restarted.score||restarted.lines||restarted.count||restarted.held!==null)throw Error('R restart failed');
      const restartOpening=[];
      for(let i=0;i<7;i++){restartOpening.push((await p.evaluate(()=>window.__state())).pose.type);await p.evaluate(()=>window.__a.clear(window.__auditGame));await p.keyboard.press('Space');await p.evaluate(()=>window.__a.finish(window.__auditGame));}
      await p.evaluate(()=>{window.__setup('T',0,3,4);window.__textDraws=[];window.__frame(0);window.scrollTo(0,0);});
      const layout=await p.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
        return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
          canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,rect:rect(c)})),
          statsTextOverlaps:window.__textDraws.filter(d=>['SCORE','LEVEL','LINES'].includes(d.text)).map(label=>{const value=window.__textDraws.find(d=>d.x===label.x&&d.y>label.y&&d.y<label.y+30&&/^\d+$/.test(d.text));return{label,value,overlap:value?Math.max(0,label.bottom-value.top):0};})};
      });
      await p.screenshot({path:`${artifacts}/${name}-${view}.png`,fullPage:true});
      if(errors.length||assets.length)throw Error(JSON.stringify({errors,assets}));
      result.views[view]={controls,spins,softEntryRows,terminalDrops:drops,restarted,restartOpening,layout,errors,assets,
        engine:{checks:engine.checks.length,failures:engine.checks.filter(c=>!c.pass),observations:engine.observations}};
    } finally {await context.close();}
  }
  return result;
}
