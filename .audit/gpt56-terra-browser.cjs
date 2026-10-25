// Reproducible Chromium evidence. Reused by qwen38-max-browser.cjs.
// App entry responses gain accessors only; no rule/input/frame/render body changes.
const { chromium } = require('../node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const check = (ok,message) => { if(!ok)throw Error(message); };

async function runBrowser(base,mode,artifacts,family='terra') {
  const qwen=family==='qwen',low=mode==='low',medium=mode==='medium',max=!qwen&&mode==='max';
  const browser=await chromium.launch({headless:true});
  const result={family,mode,browser:browser.version(),views:{}};
  try {
    for(const [name,width,height] of [['desktop',1280,800],['mobile',390,844]]) {
      const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
      const errors=[],badResponses=[],failedRequests=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badResponses.push(`${r.status()} ${r.url()}`);});
      page.on('requestfailed',r=>failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
      await page.addInitScript(()=>{
        window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
        window.__draws=[];
        for(const op of ['fillRect','strokeRect','clearRect']){
          const original=CanvasRenderingContext2D.prototype[op];
          CanvasRenderingContext2D.prototype[op]=function(x,y,w,h){
            window.__draws.push({id:this.canvas.id,op,x,y,w,h,alpha:this.globalAlpha,style:op==='strokeRect'?this.strokeStyle:this.fillStyle});
            return original.apply(this,arguments);
          };
        }
      });
      const entry=qwen&&low?'dist/src/main.js':qwen?'dist/main.js':mode==='high'||max?'main.js':mode==='xhigh'?'dist/index.js':'dist/main.js';
      await page.route(new URL(entry,base).href,async route=>{
        const response=await route.fetch();
        const clocks=max?'previousFrame=0;game.gravityElapsed=0;game.lockElapsed=0;game.lockResets=0;':qwen?'last=0;':mode==='high'?'last=0;gravityElapsed=0;lockElapsed=0;lockResets=0;':mode==='xhigh'?'previousTime=0;gravityElapsed=0;groundedElapsed=0;lockResets=0;':'last=0;elapsed=0;';
        const paint=qwen?'renderer.draw(game)':mode==='medium'?'draw()':mode==='xhigh'?'redraw()':'render()';
        await route.fulfill({response,body:await response.text()+`\nwindow.__app={get game(){return game},paint(){${paint}},resetClock(){${clocks}}};`});
      });
      await page.goto(base,{waitUntil:'networkidle'});
      await page.evaluate(({family,mode})=>{
        const qwen=family==='qwen',low=mode==='low',medium=mode==='medium',max=!qwen&&mode==='max';
        const offset=qwen?(low?4:2):mode==='high'||max?2:0;
        const g=()=>window.__app.game;
        const native=()=>qwen?(low?g().piece:g().current):low||medium?g().current:g().active;
        let clock=0;
        const local=(type,rotation)=>{
          const spawn={I:[[0,1],[1,1],[2,1],[3,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]],O:qwen?[[0,0],[1,0],[0,1],[1,1]]:[[1,0],[2,0],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],T:[[1,0],[0,1],[1,1],[2,1]],Z:[[0,0],[1,0],[1,1],[2,1]]};
          return spawn[type].map(([x,y])=>{if(type!=='O')for(let i=0;i<rotation;i++)[x,y]=[(type==='I'?3:2)-y,x];return[x,y];});
        };
        const active=()=>{const p=native();return p&&{type:p.type??p.kind,rotation:p.rotation??p.rot,x:p.x??p.col,y:(p.y??p.row)-offset};};
        const get=(x,y)=>y+offset<0?0:qwen?(low?g().board.grid[y+offset][x]:g().board.cells[(y+offset)*10+x]):g().board[y+offset][x];
        const cells=p=>local(p.type,p.rotation).map(([x,y])=>[p.x+x,p.y+y]);
        const fits=p=>cells(p).every(([x,y])=>x>=0&&x<10&&y<20&&!get(x,y));
        const count=()=>qwen?(low?g().board.grid.flat():Array.from(g().board.cells)).filter(Boolean).length:g().board.flat().filter(Boolean).length;
        const state=()=>({active:active(),score:g().score,lines:g().lines,level:g().level,held:qwen?(low?g().holdType:g().hold):mode==='high'?g().held:g().hold,canHold:max?!g().holdUsed:g().canHold,over:max?g().phase==='gameover':qwen?(low?g().state==='over':g().gameOver):low||medium?g().over:g().gameOver,count:count()});
        const clear=()=>{if(qwen)g().board.reset();else g().board.forEach(r=>r.fill(null));};
        const put=(x,y)=>{if(qwen){if(low)g().board.grid[y+offset][x]=1;else g().board.cells[(y+offset)*10+x]=2;}else g().board[y+offset][x]='J';};
        const frame=ms=>{clock+=ms;window.__draws=[];window.__frame(clock);};
        const place=(type,rotation,x,y)=>{
          if(qwen&&!low)g().current={type,rot:rotation,col:x,row:y+offset};
          else {const p={...(qwen||(!low&&!medium)?{type}:{kind:type}),rotation,x,y:y+offset};if(qwen)g().piece=p;else if(low||medium)g().current=p;else g().active=p;}
          if(qwen)Object.assign(g(),{fallTimer:0,gravityAccum:0,lockTimer:0,lockResets:0,lastMoveWasRotation:false,lastKickIndex:-1});
          g().lastAction='move';window.__app.resetClock();clock=0;
        };
        const ghost=()=>{let p=active();while(fits({...p,y:p.y+1}))p={...p,y:p.y+1};return p;};
        window.__v={g,state,clear,put,place,frame,cells,ghost,paint:()=>{window.__draws=[];window.__app.paint();},queue:()=>qwen?g().nextQueue:g().queue};
        window.__app.resetClock();
      },{family,mode});
      const v=(fn,arg)=>page.evaluate(fn,arg);
      check(!(await v(()=>__v.state().over)),`${family} ${mode} starts`);
      if(max&&artifacts){fs.mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,`terra-max-${name}-initial.png`),fullPage:true});}
      await v(()=>{__v.clear();__v.place('T',0,3,5);__v.paint();});
      const controls=[];
      for(const k of ['ArrowLeft','ArrowRight','ArrowUp','x','z','ControlLeft','ArrowDown','Space','c']){
        const before=await v(()=>__v.state());
        if(k==='ArrowDown'&&qwen){await page.keyboard.down(k);await v(()=>__v.frame(50));await page.keyboard.up(k);}else await page.keyboard.press(k);
        const after=await v(()=>__v.state());controls.push({key:k,before,after});
      }
      check(controls[0].after.active.x===controls[0].before.active.x-1,'left');
      check(controls[1].after.active.x===controls[1].before.active.x+1,'right');
      for(let i=2;i<6;i++)check(controls[i].after.active.rotation===(controls[i].before.active.rotation+(i<4?1:3))%4,controls[i].key);
      check(controls[6].after.active.y===controls[6].before.active.y+1&&controls[6].after.score===controls[6].before.score+1,'soft points');
      check(controls[7].after.count===4,'hard locks four cells');
      check(controls[8].after.held===controls[8].before.active.type&&!controls[8].after.canHold,'hold');
      let clicks=null,landingFramePartition=null;
      if(max){
        await v(()=>{__v.clear();__v.place('T',0,3,5);__v.paint();});
        clicks=[];
        for(const command of ['left','right','rotateClockwise','rotateCounterClockwise','softDrop','hardDrop','hold']){
          const before=await v(()=>__v.state());
          await page.locator(`[data-command="${command}"]`).click();
          const after=await v(()=>__v.state());clicks.push({command,before,after});
        }
        check(clicks[0].after.active.x===clicks[0].before.active.x-1,'button left');
        check(clicks[1].after.active.x===clicks[1].before.active.x+1,'button right');
        check(clicks[2].after.active.rotation===(clicks[2].before.active.rotation+1)%4,'button CW');
        check(clicks[3].after.active.rotation===(clicks[3].before.active.rotation+3)%4,'button CCW');
        check(clicks[4].after.active.y===clicks[4].before.active.y+1&&clicks[4].after.score===clicks[4].before.score+1,'button soft');
        check(clicks[5].after.count===4,'button hard');
        check(clicks[6].after.held===clicks[6].before.active.type&&!clicks[6].after.canHold,'button hold');
        await page.locator('#newGame').click();
        const fresh=await v(()=>__v.state());check(!fresh.over&&fresh.count===0&&fresh.score===0&&fresh.held===null&&fresh.canHold,'New game button');
        landingFramePartition=await v(()=>{
          const out=[];for(const parts of [[1000],Array(10).fill(100)]){__v.clear();__v.place('O',0,3,17);for(const ms of parts)__v.frame(ms);out.push(__v.state().count);}return out;
        });
        assert.deepEqual(landingFramePartition,[4,0]);
      }
      // Actual drawing for all seven independent obstructed ghosts.
      const ghosts=[];
      for(const type of ['I','J','L','O','S','T','Z']){
        const out=await v(({type,family,mode})=>{
          __v.clear();__v.place(type,0,3,0);__v.put(4,16);__v.paint();
          const p=__v.ghost(),expected=__v.cells(p).sort(),qwen=family==='qwen';
          let actual;
          if(!qwen&&mode==='high')actual=[...document.querySelectorAll('#board .cell')].flatMap((e,i)=>e.classList.contains('ghost')?[[i%10,Math.floor(i/10)]]:[]);
          else {
            const max=!qwen&&mode==='max',size=max?32:!qwen&&mode==='xhigh'?36:30;
            const calls=__draws.filter(c=>c.id===(max?'boardCanvas':'board')&&(qwen&&mode==='low'?c.op==='strokeRect'&&c.w===26:c.op==='fillRect'&&c.alpha<0.3&&c.alpha>0.1&&Math.abs(c.w-(max?27.2:mode==='xhigh'&&!qwen?36:28))<1e-8&&Math.abs(c.h-(max?27.2:mode==='xhigh'&&!qwen?36:28))<1e-8));
            actual=calls.map(c=>[Math.floor(c.x/size),Math.floor(c.y/size)]);
          }
          return {type,expected,actual:actual.sort()};
        },{type,family,mode});
        check(JSON.stringify(out.actual)===JSON.stringify(out.expected),`ghost ${type}: ${JSON.stringify(out)}`);ghosts.push(out);
      }
      await v(()=>{__v.clear();__v.g().score=0;__v.g().level=1;__v.place('O',0,3,0);for(let i=0;i<50;i++)__v.frame(16);});
      const before=await v(()=>__v.state());await page.keyboard.down('ArrowDown');await v(()=>__v.frame(1));const after=await v(()=>__v.state());await page.keyboard.up('ArrowDown');
      const transition={rows:after.active.y-before.active.y,points:after.score-before.score};
      const refresh=await v(()=>{
        const out=[];for(const hz of [60,144]){__v.clear();__v.g().level=10;__v.place('O',0,3,0);let t=0;while(t<600-1e-8){const d=Math.min(1000/hz,600-t);__v.frame(d);t+=d;}out.push(__v.state().active.y);}__v.g().level=1;return out;
      });
      const refreshVariants=await v(()=>{
        const out={};for(const [level,duration] of [[2,1480.001],[2,1564],[10,600],[15,600]]){
          const rows=[];for(const hz of [60,144]){__v.clear();__v.g().level=level;__v.place('O',0,3,0);let t=0;while(t<duration-1e-8){const d=Math.min(1000/hz,duration-t);__v.frame(d);t+=d;}rows.push(__v.state().active.y);}out[level+':'+duration]=rows;
        }__v.g().level=1;return out;
      });
      // Blocked incoming spawn via real Space and complete restart via real R.
      await v(({family,mode})=>{__v.clear();__v.place('O',0,0,18);__v.queue()[0]='T';__v.put(4,family==='terra'&&(mode==='low'||mode==='medium')?0:family==='terra'&&mode==='xhigh'?1:-2);__v.paint();},{family,mode});
      await page.keyboard.press('Space');await v(()=>__v.paint());const over=await v(()=>__v.state());check(over.over,'blocked spawn');
      for(const k of ['ArrowLeft','ArrowUp','Space','c'])await page.keyboard.press(k);
      check(JSON.stringify(await v(()=>__v.state()))===JSON.stringify(over),'game-over keyboard guard');
      await page.keyboard.press('r');await v(()=>__v.paint());const restarted=await v(()=>__v.state());
      check(!restarted.over&&restarted.count===0&&restarted.score===0&&restarted.lines===0&&restarted.held===null&&restarted.canHold,'R restart');
      let restartBag=null;
      if(!qwen&&mode==='xhigh'){
        await v(async()=>{
          const {TetrisGame}=await import('/dist/engine.js');let seed=42;
          Object.assign(__v.g(),new TetrisGame(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32)));
          window.__app.resetClock();
        });
        let drops=0;while(!(await v(()=>__v.state().over))&&drops<100){await page.keyboard.press('Space');drops++;}
        check((await v(()=>__v.state().over)),'actual hard drops reach game over');
        await page.keyboard.press('r');
        const opening=await v(()=>[__v.state().active.type,...__v.queue().slice(0,6)]);
        restartBag={drops,opening,types:new Set(opening).size};
        assert.deepEqual(restartBag,{drops:11,opening:['J','Z','Z','T','L','I','J'],types:5});
      }
      // Deterministic previews: I hold plus five I next pieces. Canvas pixels
      // and forwarded drawing calls distinguish blank/clipped content from CSS.
      const previews=await v(({family,mode})=>{
        const g=__v.g();if(family==='qwen'){if(mode==='low')g.holdType='I';else g.hold='I';}else if(mode==='high')g.held='I';else g.hold='I';
        __v.queue().fill('I');__v.paint();
        return ['hold','next'].map(id=>{
          const el=document.getElementById(mode==='max'&&family==='terra'?id+'Canvas':id),rect=el.getBoundingClientRect();
          if(!(el instanceof HTMLCanvasElement))return {id,text:el.innerText,display:getComputedStyle(el).display,width:rect.width,height:rect.height};
          const data=el.getContext('2d').getImageData(0,0,el.width,el.height).data;let pixels=0;for(let i=3;i<data.length;i+=4)if(data[i])pixels++;
          const calls=__draws.filter(c=>c.id===el.id&&c.op==='fillRect');
          const outside=calls.filter(c=>c.x<0||c.y<0||c.x+c.w>el.width||c.y+c.h>el.height);
          const visible=calls.filter(c=>c.x<el.width&&c.y<el.height&&c.x+c.w>0&&c.y+c.h>0);
          return {id,backing:[el.width,el.height],...(mode==='max'&&family==='terra'?{css:[rect.width,rect.height],cellAspect:(rect.width/el.width)/(rect.height/el.height)}:{}),pixels,calls:calls.length,visible:visible.length,outside:outside.map(c=>({x:c.x,y:c.y,w:c.w,h:c.h})),display:getComputedStyle(el).display};
        });
      },{family,mode});
      const layout=await v(()=>{
        const box=e=>{const r=e.getBoundingClientRect();return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2)};};
        const overlay=document.querySelector('#game-over,#overlay,#message,#gameOver');
        return {documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,board:box(document.getElementById(__v.g().phase!==undefined?'boardCanvas':'board')),support:['hold','next'].map(id=>({id,...box(document.getElementById(__v.g().phase!==undefined?id+'Canvas':id))})),activeOverlay:overlay?{hidden:overlay.hidden,display:getComputedStyle(overlay).display,opacity:getComputedStyle(overlay).opacity,text:overlay.innerText}:null};
      });
      check(errors.filter(e=>!e.includes('favicon.ico')).length===0,'application errors '+JSON.stringify(errors));check(badResponses.length===0&&failedRequests.length===0,'required assets');
      if(artifacts){fs.mkdirSync(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,`${family}-${mode}-${name}.png`),fullPage:true});}
      result.views[name]={controls:controls.map(c=>c.key),...(max?{clicks:clicks.map(c=>c.command),landingFramePartition}:{}),ghosts,transition,refresh,refreshVariants,over,restarted,restartBag,previews,layout,errors,badResponses,failedRequests};
      await context.close();
    }
  } finally {await browser.close();}
  assertBrowser(result);
  console.log(JSON.stringify(result));return result;
}
function assertBrowser(result){
  const id=result.family+'-'+result.mode;
  // [document width, board x, board width, board height, hold x/width, next x/width].
  const geometry={
    'terra-low':{desktop:[1280,490,300,600,345,120,817,120],mobile:[413,105,202.8,405.59,13,80,320.8,80]},
    'terra-medium':{desktop:[1280,488,304,604,336,100,821,120],mobile:[513,130.44,237.12,471.12,11.88,78,390.18,93.6]},
    'terra-high':{desktop:[1280,515,250,500,333,145,802,145],mobile:[390,18,260,520,0,0,303,72]},
    'terra-xhigh':{desktop:[1280,465,350,700,293,148,839,148],mobile:[390,20,350,700,7,183,200,183]},
    'terra-max':{desktop:[1280,481,318,636,153,295,832,295],mobile:[390,11,268,536,19,144,303,77.22]},
    'qwen-low':{desktop:[1280,488,304,604,341,120,817,120],mobile:[503,43,304,604,-104,120,372,120]},
    'qwen-medium':{desktop:[1280,489,302,602,339,130,811,130],mobile:[516,44,302,602,-106,130,366,130]},
  };
  const refresh={
    'terra-low':{'2:1480.001':[1,2],'2:1564':[2,2],'10:600':[2,2],'15:600':[5,5]},
    'terra-medium':{'2:1480.001':[1,1],'2:1564':[2,1],'10:600':[2,2],'15:600':[7,7]},
    'terra-high':{'2:1480.001':[1,1],'2:1564':[1,1],'10:600':[9,8],'15:600':[10,10]},
    'terra-xhigh':{'2:1480.001':[1,1],'2:1564':[1,1],'10:600':[9,8],'15:600':[10,10]},
    'terra-max':{'2:1480.001':[1,1],'2:1564':[1,1],'10:600':[9,9],'15:600':[18,18]},
    'qwen-low':{'2:1480.001':[1,1],'2:1564':[1,1],'10:600':[9,9],'15:600':[18,18]},
    'qwen-medium':{'2:1480.001':[1,1],'2:1564':[1,1],'10:600':[9,9],'15:600':[18,18]},
  };
  for(const [name,view]of Object.entries(result.views)){
    check(view.ghosts.length===7,'seven drawn ghosts');
    const rows=result.family==='qwen'?16:result.mode==='low'?2:1;
    assert.deepEqual(view.transition,{rows,points:rows});
    assert.deepEqual(view.refreshVariants,refresh[id]);
    const b=view.layout.board,[h,n]=view.layout.support;
    const actual=[view.layout.documentWidth,b.x,b.width,b.height,h.x,h.width,n.x,n.width];
    geometry[id][name].forEach((value,i)=>check(Math.abs(actual[i]-value)<0.03,`${id} ${name} geometry ${actual}`));
    if(id==='terra-low'){
      check(view.layout.activeOverlay.hidden&&view.layout.activeOverlay.display==='grid','false active game-over overlay');
      check(view.previews[0].outside.length===1&&view.previews[1].outside.length===5,'clipped I previews');
      check(view.previews.every(p=>p.outside.every(c=>c.x===-11&&c.w===22)),'exact half-cell clipping');
    }else if(id==='terra-xhigh'){
      check(view.previews[0].pixels===0&&view.previews[0].visible===0,'held piece entirely outside canvas');
      check(view.previews[1].visible===12&&view.previews[1].calls===60&&view.previews[1].outside.length===48,'only one of five next pieces visible');
      check(view.layout.activeOverlay.display==='none','active overlay hidden');
    }else if(id==='terra-high'){
      check(view.previews[1].text.replace(/\s/g,'')==='IIIII','five textual next entries');
      check(name==='desktop'?h.width>0:h.width===0,'phone hold removal');
    }else if(id==='terra-max'){
      check(view.previews.every(p=>p.pixels>0&&p.outside.length===0),'complete max previews');
      assert.deepEqual(view.previews.map(p=>p.calls),[5,21],'four hold/five complete next shapes plus backgrounds');
      check(view.layout.activeOverlay.opacity==='0','active max overlay transparent');
      check(view.layout.documentWidth===(name==='desktop'?1280:390),'max fits horizontally');
      check(Math.abs(view.previews[0].cellAspect-1)<0.001,'max hold scales uniformly');
      const aspect=view.previews[1].cellAspect;
      check(name==='desktop'?Math.abs(aspect-1)<0.001:aspect>0.70&&aspect<0.71,'max phone next preview distortion');
      if(name==='mobile')assert.equal(view.previews[1].css[1],260,'phone next forced minimum height');
    }else{
      check(view.previews.every(p=>p.pixels>0&&p.outside.length===0),'complete preview backing pixels');
      if(id==='terra-medium'||id==='qwen-low')check(view.layout.activeOverlay.display==='none','active overlay hidden');
    }
  }
}
module.exports={runBrowser};
if(require.main===module)runBrowser(...process.argv.slice(2)).catch(e=>{console.error(e.stack);process.exitCode=1;});
