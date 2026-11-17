async (page) => {
  const browser=page.context().browser(), result={mode:'none',browser:browser.version(),delivery:'unmodified CommonJS classic-script build',views:{}};
  for(const [view,viewport] of Object.entries({desktop:{width:1280,height:800},mobile:{width:390,height:844}})) {
    const context=await browser.newContext({viewport,deviceScaleFactor:2});
    try {
      const p=await context.newPage(),errors=[],assets=[];
      p.on('pageerror',e=>errors.push(e.message));
      p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))assets.push([r.url(),r.status()]);});
      await p.goto(__URL__);
      await p.waitForFunction(()=>document.readyState==='complete');
      const state=()=>p.evaluate(()=>({score:document.querySelector('#score').textContent,level:document.querySelector('#level').textContent,lines:document.querySelector('#lines').textContent,
        canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,nonzero:c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(Boolean)}))}));
      const before=await state();
      for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c','r'])await p.keyboard.press(key);
      const after=await state();
      const layout=await p.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
        canvases:[...document.querySelectorAll('canvas')].map(c=>{const r=c.getBoundingClientRect();return{id:c.id,x:r.x,y:r.y,width:r.width,height:r.height};})}));
      await p.screenshot({path:__ARTIFACTS__+'/hy4-flash-free-none-'+view+'.png',fullPage:true});
      if(!errors.includes('exports is not defined'))throw Error('Expected delivery failure changed '+JSON.stringify(errors));
      if(JSON.stringify(before)!==JSON.stringify(after)||after.canvases.some(c=>c.nonzero))throw Error('Blank delivery changed');
      result.views[view]={errors,assets,before,after,layout,controlsResponded:false};
    } finally {await context.close();}
  }
  return result;
}
