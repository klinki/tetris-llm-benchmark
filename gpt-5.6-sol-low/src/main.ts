import { TetrisGame, COLORS, COLS, ROWS, VISIBLE_ROWS, cells, type ActivePiece, type PieceName } from "./game.js";

const canvas = document.querySelector<HTMLCanvasElement>("#board")!;
const ctx = canvas.getContext("2d")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold")!;
const nextCanvas = document.querySelector<HTMLCanvasElement>("#next")!;
const scoreEl = document.querySelector("#score")!;
const linesEl = document.querySelector("#lines")!;
const levelEl = document.querySelector("#level")!;
const statusEl = document.querySelector("#status")!;
const overlay = document.querySelector<HTMLElement>("#overlay")!;
const overlayTitle = overlay.querySelector("h2")!;
const overlayText = overlay.querySelector("p")!;
const pauseButton = document.querySelector<HTMLButtonElement>("#pause")!;
const game = new TetrisGame();
const CELL = 32;
let lastFall = performance.now();
let groundedAt: number | null = null;

function block(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, ghost = false): void {
  context.save(); context.globalAlpha = ghost ? .18 : 1;
  context.fillStyle = color; context.fillRect(x + 1, y + 1, size - 2, size - 2);
  context.strokeStyle = ghost ? color : "rgba(255,255,255,.3)"; context.lineWidth = ghost ? 2 : 1; context.strokeRect(x + 2, y + 2, size - 4, size - 4);
  if (!ghost) { const glow = context.createLinearGradient(x,y,x+size,y+size); glow.addColorStop(0,"rgba(255,255,255,.24)"); glow.addColorStop(.45,"transparent"); context.fillStyle = glow; context.fillRect(x+2,y+2,size-4,size-4); }
  context.restore();
}

function drawBoard(): void {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bg = ctx.createLinearGradient(0,0,0,canvas.height); bg.addColorStop(0,"#11182a"); bg.addColorStop(1,"#080b14"); ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1;
  for (let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,canvas.height);ctx.stroke();}
  for (let y=0;y<=VISIBLE_ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(canvas.width,y*CELL);ctx.stroke();}
  for (let y=ROWS-VISIBLE_ROWS;y<ROWS;y++) for (let x=0;x<COLS;x++) { const name=game.board[y][x]; if(name) block(ctx,x*CELL,(y-(ROWS-VISIBLE_ROWS))*CELL,CELL,COLORS[name]); }
  if (!game.gameOver) {
    const ghost: ActivePiece = {...game.active,y:game.ghostY()};
    cells(ghost).forEach(([x,y]) => { if(y>=ROWS-VISIBLE_ROWS) block(ctx,x*CELL,(y-(ROWS-VISIBLE_ROWS))*CELL,CELL,COLORS[ghost.name],true); });
    cells(game.active).forEach(([x,y]) => { if(y>=ROWS-VISIBLE_ROWS) block(ctx,x*CELL,(y-(ROWS-VISIBLE_ROWS))*CELL,CELL,COLORS[game.active.name]); });
  }
}

function mini(context: CanvasRenderingContext2D, name: PieceName | null, top: number, size = 21): void {
  if (!name) return;
  const piece: ActivePiece = {name,rotation:0,x:0,y:0}; const points=cells(piece); const minX=Math.min(...points.map(p=>p[0])), maxX=Math.max(...points.map(p=>p[0]));
  const width=(maxX-minX+1)*size, start=(context.canvas.width-width)/2;
  points.forEach(([x,y])=>block(context,start+(x-minX)*size,top+y*size,size,COLORS[name]));
}
function drawPanels(): void {
  const h=holdCanvas.getContext("2d")!; h.clearRect(0,0,holdCanvas.width,holdCanvas.height); mini(h,game.holdPiece,16,22);
  const n=nextCanvas.getContext("2d")!; n.clearRect(0,0,nextCanvas.width,nextCanvas.height); game.next.slice(0,4).forEach((name,i)=>mini(n,name,i*74+6,18));
}
function render(): void {
  drawBoard(); drawPanels(); scoreEl.textContent=game.score.toLocaleString(); linesEl.textContent=String(game.lines); levelEl.textContent=String(game.level); statusEl.textContent=game.lastAction;
  overlay.hidden=!(game.gameOver||game.paused);
  if(game.gameOver){overlayTitle.textContent="GAME OVER";overlayText.textContent="Press R or tap Restart";}
  else if(game.paused){overlayTitle.textContent="PAUSED";overlayText.textContent="Press P to continue";}
  pauseButton.textContent=game.paused?"Resume":"Pause";
}
function action(name: string): void {
  const wasGrounded=game.ghostY()===game.active.y;
  if(name==="left")game.move(-1,0); if(name==="right")game.move(1,0); if(name==="down"&&game.move(0,1))game.score+=1; if(name==="cw")game.rotate(1); if(name==="ccw")game.rotate(-1); if(name==="drop")game.hardDrop(); if(name==="hold")game.hold();
  if(name==="restart")game.restart(); if(name==="pause"&&!game.gameOver)game.paused=!game.paused;
  if(wasGrounded&&["left","right","cw","ccw"].includes(name))groundedAt=performance.now(); render();
}
document.addEventListener("keydown",e=>{
  const keys:Record<string,string>={ArrowLeft:"left",ArrowRight:"right",ArrowDown:"down",ArrowUp:"cw",x:"cw",X:"cw",z:"ccw",Z:"ccw",Control:"ccw"," ":"drop",c:"hold",C:"hold",r:"restart",R:"restart",p:"pause",P:"pause",Escape:"pause"};
  const a=keys[e.key]; if(a){e.preventDefault();action(a);}
});
document.querySelectorAll<HTMLElement>("[data-action]").forEach(button=>button.addEventListener("pointerdown",e=>{e.preventDefault();action(button.dataset.action!);}));

function loop(now:number):void {
  if(!game.paused&&!game.gameOver){
    if(now-lastFall>=game.gravityMs()){ if(!game.move(0,1)){ if(groundedAt===null)groundedAt=now; } else groundedAt=null; lastFall=now; }
    if(game.ghostY()===game.active.y){if(groundedAt===null)groundedAt=now;if(now-groundedAt>=500){game.lock();groundedAt=null;lastFall=now;}} else groundedAt=null;
  }
  render(); requestAnimationFrame(loop);
}
render(); requestAnimationFrame(loop);
