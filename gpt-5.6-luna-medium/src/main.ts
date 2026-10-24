import { TetrisGame, cellsFor, COLS, ROWS, HIDDEN_ROWS, type Cell, type PieceType, type ActivePiece } from "./game.js";
import "./style.css";

const game = new TetrisGame();
const boardCanvas = document.querySelector<HTMLCanvasElement>("#board")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold")!;
const nextCanvas = document.querySelector<HTMLCanvasElement>("#next")!;
const ctx = boardCanvas.getContext("2d")!;
const colors: Record<PieceType, string> = { I:"#4bd9e8", O:"#f5c451", T:"#b478ed", S:"#69d391", Z:"#ef6470", J:"#638bf2", L:"#f18d54" };
const cellSize = boardCanvas.width / COLS;

function roundedRect(context: CanvasRenderingContext2D, x:number, y:number, width:number, height:number, radius:number): void { context.beginPath(); context.roundRect(x+1,y+1,width-2,height-2,radius); context.fill(); }
function drawCell(context: CanvasRenderingContext2D, x:number, y:number, type:PieceType, size:number, alpha=1): void { context.globalAlpha=alpha; context.fillStyle=colors[type]; roundedRect(context,x*size,y*size,size,size,Math.max(3,size*.14)); context.fillStyle="#ffffff55"; context.fillRect(x*size+size*.2,y*size+size*.17,size*.6,size*.08); context.globalAlpha=1; }
function draw(): void {
  ctx.fillStyle="#13141f"; ctx.fillRect(0,0,boardCanvas.width,boardCanvas.height);
  ctx.strokeStyle="#ffffff09"; ctx.lineWidth=1; for(let x=1;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*cellSize,0);ctx.lineTo(x*cellSize,boardCanvas.height);ctx.stroke()} for(let y=1;y<ROWS-HIDDEN_ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*cellSize);ctx.lineTo(boardCanvas.width,y*cellSize);ctx.stroke()}
  game.board.slice(HIDDEN_ROWS).forEach((row,y)=>row.forEach((cell,x)=>{if(cell)drawCell(ctx,x,y,cell,cellSize)}));
  const ghost=game.ghost(); cellsFor(ghost).forEach(([x,y])=>{if(y>=HIDDEN_ROWS)drawCell(ctx,x,y-HIDDEN_ROWS,ghost.type,cellSize,.2)}); cellsFor(game.active).forEach(([x,y])=>{if(y>=HIDDEN_ROWS)drawCell(ctx,x,y-HIDDEN_ROWS,game.active.type,cellSize)});
  document.querySelector("#score")!.textContent=game.score.score.toLocaleString(); document.querySelector("#lines")!.textContent=String(game.score.lines); document.querySelector("#level")!.textContent=String(game.score.level);
  const overlay=document.querySelector("#overlay")!; overlay.classList.toggle("hidden",!game.over); drawPreview(holdCanvas,game.hold?[game.hold]:[]); drawPreview(nextCanvas,game.next.slice(0,5));
}
function drawPreview(canvas:HTMLCanvasElement,pieces:PieceType[]):void { const c=canvas.getContext("2d")!; c.clearRect(0,0,canvas.width,canvas.height); const size=22; pieces.forEach((type,index)=>{const piece:ActivePiece={type,rotation:0,x:0,y:0}; const cells=cellsFor(piece); const minX=Math.min(...cells.map(a=>a[0])), maxX=Math.max(...cells.map(a=>a[0])); const offset=(canvas.width-(maxX-minX+1)*size)/2-minX*size; const top=index*50+4; cells.forEach(([x,y])=>drawCell(c,x*size/size+offset/size,y*size/size+top/size,type,size))});}
let last=performance.now(); function frame(now:number):void{game.tick(Math.min(50,now-last));last=now;draw();requestAnimationFrame(frame)} requestAnimationFrame(frame);
document.addEventListener("keydown",event=>{const key=event.key.toLowerCase(); if(["arrowleft","arrowright","arrowdown"," "].includes(event.key)||["x","z","c","r","control"].includes(key))event.preventDefault(); if(key==="arrowleft")game.move(-1); else if(key==="arrowright")game.move(1); else if(key==="arrowdown")game.softDrop(); else if(event.key===" " )game.hardDrop(); else if(key==="arrowup"||key==="x")game.rotate(1); else if(key==="z"||key==="control")game.rotate(-1); else if(key==="c")game.holdPiece(); else if(key==="r")game.reset(); else if(key==="p")game.paused=!game.paused;}); document.querySelector("#restart")!.addEventListener("click",()=>game.reset());
