// Installed Playwright only; module accessors and RAF capture do not alter rules.
const {chromium}=require('/Users/david/projects/own/tetris-llm-benchmark/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const [base,probeFile,artifacts]=process.argv.slice(2);
const eq=(a,b,n)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(n+': '+JSON.stringify({actual:a,expected:b}));};
(async()=>{
 const browser=await chromium.launch({headless:true});const result={version:browser.version(),views:{}};
 try{for(const [name,width,height,touch]of [['desktop',1280,800,false],['phone',390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});const page=await context.newPage();
  try{
   const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
   await page.addInitScript(()=>{window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};});
   await page.route('**/dist/main.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.__g=game;window.__controls=controls;window.__clock=()=>lastFrame;'});});
   await page.route('**/__audit.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(probeFile,'utf8')}));
   await page.goto(base,{waitUntil:'networkidle'});
   const engine=await page.evaluate(async()=>{const {probes}=await import('/__audit.mjs');return probes({...await import('/dist/engine.js'),...await import('/dist/pieces.js')});});
   await page.keyboard.press('Enter');
   await page.evaluate(()=>{
    window.__step=ms=>{while(ms>1e-8){const dt=Math.min(ms,16);window.__frame(window.__clock()+dt);ms-=dt;}};
    window.__place=(kind='T',rotation=0,x=3,y=5)=>{__g.setUp({clear:true,active:{kind,rotation,x,y}});};
   });
   const state=()=>page.evaluate(()=>({active:{...__g.active},status:__g.status,score:__g.score,pieces:__g.pieces,held:__g.held,canHold:__g.canHold}));
   const controls=[];
   await page.evaluate(()=>__place());
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){const before=await state();await page.keyboard.press(key);const after=await state();controls.push({key,before,after});}
   eq(controls[0].after.active.x,2,'left');eq(controls[1].after.active.x,3,'right');
   eq(controls.slice(2,6).map(c=>c.after.active.rotation),[1,2,1,0],'rotations');
   eq(controls[6].after.active.y-controls[6].before.active.y,1,'soft rows');eq(controls[6].after.score-controls[6].before.score,1,'soft points');
   eq(controls[7].after.pieces-controls[7].before.pieces,1,'Space lock');eq(controls[8].after.held,controls[8].before.active.kind,'C hold');
   await page.evaluate(()=>{__g.restart();__place('O',0,3,0);__step(800);});const softBefore=await state();await page.keyboard.down('ArrowDown');await page.evaluate(()=>__step(1));const softAfter=await state();await page.keyboard.up('ArrowDown');
   const softEntry={actualRows:softAfter.active.y-softBefore.active.y,actualPoints:softAfter.score-softBefore.score,expectedRows:1,expectedPoints:1};eq(softEntry.actualRows,1,'real soft entry');eq(softEntry.actualPoints,1,'real soft points');
   const rafRefresh=await page.evaluate(()=>{const out=[];for(const hz of [60,144]){__g.restart();__g.setUp({lines:90});__place('O',0,3,0);let t=0;while(t<600-1e-9){const dt=Math.min(1000/hz,600-t);__frame(__clock()+dt);t+=dt;}out.push({hz,rows:__g.active.y,points:__g.score});}return out;});eq(rafRefresh.map(r=>r.rows),[9,9],'unchanged RAF refresh');
   // Required SPEC fixtures through real Up/Space; timed controls run in probes too.
   const hd=[];
   for(const mode of ['travel','mini','full']){
    await page.evaluate(mode=>{__g.restart();const stack=mode==='travel'?[[0,17],[0,19],[2,19]]:[[5,17],[3,19],mode==='full'?[3,17]:[5,19]];__g.setUp({clear:true,stack:stack.map(([x,y])=>[x,y,'J']),active:mode==='travel'?{kind:'T',rotation:0,x:0,y:3}:{kind:'T',rotation:3,x:3,y:17}});},mode);
    await page.keyboard.press('ArrowUp');const pose=await state();const ghost=await page.evaluate(()=>({...__g.ghost()}));eq(ghost.y,17,'browser HD ghost');
    await page.keyboard.press('Space');const actual=await page.evaluate(()=>__g.score),expected=mode==='travel'?28:mode==='mini'?100:400;eq(actual,expected,'real HD '+mode);hd.push({mode,pose:pose.active,ghost,actual,expected});
   }
   const focus=[];
   for(const clicks of [['#sound'],['#pause','#pause']]){
    await page.evaluate(()=>{__g.restart();__place();__step(1);});for(const selector of clicks){await page.click(selector);await page.evaluate(()=>__step(1));}
    const before=await state();await page.keyboard.press('Space');const after=await state();eq(after.pieces-before.pieces,1,'Space after header click');focus.push({clicks,hardDropped:true});
   }
   await page.keyboard.press('p');const paused=await state();await page.evaluate(()=>__step(1000));eq(await state(),paused,'paused freeze');await page.keyboard.press('Escape');eq((await state()).status,'playing','resume');
   await page.evaluate(()=>__place('O',0,3,5));
   await page.keyboard.down('ArrowRight');await page.evaluate(()=>__step(166));const dasBefore=await state();await page.evaluate(()=>__step(1));eq((await state()).active.x,dasBefore.active.x+1,'DAS 167');await page.keyboard.up('ArrowRight');
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));eq((await state()).status,'paused','blur');await page.keyboard.press('Enter');
   // Top-out, inert keys and R restart.
   await page.evaluate(()=>{__g.restart();__g.setUp({clear:true,stack:[[4,-2,'J'],[4,-1,'J']],active:{kind:'O',rotation:0,x:-1,y:18}});});
   await page.keyboard.press('Space');await page.evaluate(()=>__step(1));eq((await state()).status,'over','blocked spawn');const terminal=await state();
   for(const key of ['ArrowLeft','ArrowUp','ArrowDown','Space','c'])await page.keyboard.press(key);eq(await state(),terminal,'terminal keys inert');
   await page.keyboard.press('r');await page.evaluate(()=>__step(1));eq([(await state()).status,(await state()).score,(await state()).held],['playing',0,null],'R restart');
   const touchActions=[];if(touch){for(const action of ['left','right','cw','ccw','soft','drop','hold']){
    await page.evaluate(()=>{__g.restart();__place();__step(1);});const before=await state();await page.tap(`[data-action="${action}"]`);const after=await state();
    if(action==='left'||action==='right')eq(after.active.x,before.active.x+(action==='left'?-1:1),'tap '+action);
    if(action==='cw'||action==='ccw')eq(after.active.rotation,action==='cw'?1:3,'tap '+action);
    if(action==='soft')eq(after.active.y,before.active.y+1,'tap soft');
    if(action==='drop')eq(after.pieces-before.pieces,1,'tap drop');if(action==='hold')eq(after.held,before.active.kind,'tap hold');touchActions.push(action);
   }}
   await page.evaluate(()=>{__g.restart();__place('O',0,3,5);__g.hold();__place('T',0,3,4);__step(16);});
   const layout=await page.evaluate(()=>{
    const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    return{documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,board:box(document.getElementById('board')),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,...box(c),backing:[c.width,c.height],aspect:(c.width/c.height)/(c.clientWidth/c.clientHeight)})),touch:[...document.querySelectorAll('[data-action]')].map(b=>({action:b.dataset.action,...box(b)}))};
   });
   eq(layout.documentWidth,width,'no horizontal overflow');if(layout.documentHeight>height)throw Error('vertical overflow '+JSON.stringify(layout));
   for(const c of layout.canvases){if(c.x<0||c.x+c.width>width+.01||Math.abs(c.aspect-1)>.03)throw Error('canvas layout '+JSON.stringify(c));}
   const screenshot=path.join(artifacts,`candidate-run-${name}.png`);await page.screenshot({path:screenshot,fullPage:true});
   eq(errors,[],'application errors');eq(failed,[],'asset failures');result.views[name]={engine,controls:controls.map(c=>c.key),softEntry,rafRefresh,hd,focus,touchActions,layout,errors,failed};
  }finally{await context.close();}
 }}finally{await browser.close();}
 console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.stack);process.exit(1);});
