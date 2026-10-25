import { TetrisGame, HIDDEN_ROWS, VISIBLE_HEIGHT, BOARD_WIDTH, pieceCells, previewCells, type PieceKind } from "./game.js";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const context = canvas.getContext("2d")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold-canvas")!;
const scoreElement = document.querySelector<HTMLElement>("#score")!;
const levelElement = document.querySelector<HTMLElement>("#level")!;
const linesElement = document.querySelector<HTMLElement>("#lines")!;
const nextList = document.querySelector<HTMLElement>("#next-list")!;
const overlay = document.querySelector<HTMLElement>("#overlay")!;
const overlayKicker = document.querySelector<HTMLElement>("#overlay-kicker")!;
const overlayTitle = document.querySelector<HTMLElement>("#overlay-title")!;
const overlayCopy = document.querySelector<HTMLElement>("#overlay-copy")!;
const callout = document.querySelector<HTMLElement>("#callout")!;

const COLORS: Record<PieceKind, string> = { I:"#39e7ff", J:"#5977ff", L:"#ff9b35", O:"#ffe24b", S:"#54e77d", T:"#b85cff", Z:"#ff466d" };
const game = new TetrisGame();
let soundEnabled = true;
let audioContext: AudioContext | null = null;
let previousMessage = "";
let lastTime = performance.now();

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1): void {
  const inset = Math.max(1, size * .055);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = alpha < .5 ? 0 : size * .16;
  ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
  ctx.shadowBlur = 0;
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, "rgba(255,255,255,.32)");
  gradient.addColorStop(.4, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(0,0,0,.25)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + inset + .5, y + inset + .5, size - inset * 2 - 1, size - inset * 2 - 1);
  ctx.globalAlpha = 1;
}

function drawBoard(): void {
  const state = game.snapshot();
  const cell = canvas.width / BOARD_WIDTH;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0a0d17";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(150,170,220,.055)";
  context.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x++) { context.beginPath(); context.moveTo(x*cell+.5,0); context.lineTo(x*cell+.5,canvas.height); context.stroke(); }
  for (let y = 0; y <= VISIBLE_HEIGHT; y++) { context.beginPath(); context.moveTo(0,y*cell+.5); context.lineTo(canvas.width,y*cell+.5); context.stroke(); }

  for (let y = HIDDEN_ROWS; y < state.board.length; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const kind = state.board[y]?.[x];
      if (kind) block(context, x * cell, (y-HIDDEN_ROWS)*cell, cell, COLORS[kind]);
    }
  }
  if (state.status !== "gameover") {
    const ghost = { ...state.active, y: state.ghostY };
    for (const {x,y} of pieceCells(ghost)) if (y >= HIDDEN_ROWS) block(context,x*cell,(y-HIDDEN_ROWS)*cell,cell,COLORS[ghost.kind],.16);
    for (const {x,y} of pieceCells(state.active)) if (y >= HIDDEN_ROWS) block(context,x*cell,(y-HIDDEN_ROWS)*cell,cell,COLORS[state.active.kind]);
  }

  scoreElement.textContent = String(state.score).padStart(6,"0");
  levelElement.textContent = String(state.level).padStart(2,"0");
  linesElement.textContent = String(state.lines).padStart(2,"0");
  drawPreview(holdCanvas, state.hold, !state.canHold);
  renderNext(state.next);

  if (state.message && state.message !== previousMessage && state.status === "playing") {
    callout.textContent = state.message;
    callout.classList.remove("show");
    void callout.offsetWidth;
    callout.classList.add("show");
  }
  previousMessage = state.message;

  if (state.status === "gameover") showOverlay("Signal lost", "Game over", `Final score: ${String(state.score).padStart(6,"0")}`);
  else if (state.status === "paused") showOverlay("System standby", "Paused", "Press P or Escape to continue");
  else overlay.classList.add("hidden");
}

function drawPreview(target: HTMLCanvasElement, kind: PieceKind | null, muted = false): void {
  const ctx = target.getContext("2d")!;
  ctx.clearRect(0,0,target.width,target.height);
  if (!kind) return;
  const cells = previewCells(kind);
  const minX = Math.min(...cells.map(p=>p.x)); const maxX = Math.max(...cells.map(p=>p.x));
  const minY = Math.min(...cells.map(p=>p.y)); const maxY = Math.max(...cells.map(p=>p.y));
  const size = Math.min(26,target.width/(maxX-minX+2),target.height/(maxY-minY+2));
  const ox = (target.width-(maxX-minX+1)*size)/2-minX*size;
  const oy = (target.height-(maxY-minY+1)*size)/2-minY*size;
  for (const point of cells) block(ctx,ox+point.x*size,oy+point.y*size,size,COLORS[kind],muted?.32:1);
}

function renderNext(next: PieceKind[]): void {
  while (nextList.children.length < 5) {
    const wrapper = document.createElement("div"); wrapper.className="next-piece";
    const mini = document.createElement("canvas"); mini.width=112; mini.height=64;
    wrapper.append(mini); nextList.append(wrapper);
  }
  next.forEach((kind,index)=>drawPreview(nextList.children[index]!.querySelector("canvas")!,kind));
}

function showOverlay(kicker: string, title: string, copy: string): void {
  overlayKicker.textContent=kicker; overlayTitle.textContent=title; overlayCopy.textContent=copy; overlay.classList.remove("hidden");
  const button = document.querySelector<HTMLButtonElement>("#restart-button")!;
  button.textContent = game.status === "paused" ? "Resume" : "Run it back";
}

function tone(frequency: number, duration = .045): void {
  if (!soundEnabled) return;
  audioContext ??= new AudioContext();
  const oscillator=audioContext.createOscillator(), gain=audioContext.createGain();
  oscillator.type="square"; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(.025,audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
  oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime+duration);
}

function action(name: string): void {
  let success=false;
  if (name==="left") success=game.move(-1,0);
  if (name==="right") success=game.move(1,0);
  if (name==="down") success=game.softDrop();
  if (name==="cw") success=game.rotate(1);
  if (name==="ccw") success=game.rotate(-1);
  if (name==="hold") success=game.hold();
  if (name==="drop") { success=game.status==="playing"; game.hardDrop(); }
  if (success) tone(name==="drop"?95:name==="hold"?260:180);
  drawBoard();
}

const keyActions: Record<string,string> = { ArrowLeft:"left",ArrowRight:"right",ArrowDown:"down",ArrowUp:"cw",x:"cw",X:"cw",z:"ccw",Z:"ccw",Control:"ccw",c:"hold",C:"hold"," ":"drop" };
document.addEventListener("keydown",event=>{
  if (event.key==="r"||event.key==="R") { game.reset(); tone(320,.08); drawBoard(); return; }
  if (event.key==="p"||event.key==="P"||event.key==="Escape") { game.togglePause(); drawBoard(); return; }
  const mapped=keyActions[event.key]; if (!mapped||event.repeat&&mapped==="drop") return;
  event.preventDefault(); action(mapped);
});
document.querySelector("#restart-button")!.addEventListener("click",()=>{ if(game.status==="paused") game.togglePause(); else game.reset(); drawBoard(); });
document.querySelector("#pause-button")!.addEventListener("click",()=>{game.togglePause();drawBoard();});
document.querySelector("#sound-button")!.addEventListener("click",event=>{soundEnabled=!soundEnabled;(event.currentTarget as HTMLElement).textContent=soundEnabled?"SOUND ON":"SOUND OFF";});
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(button=>button.addEventListener("pointerdown",event=>{event.preventDefault();action(button.dataset.action!);}));

function loop(now: number): void { game.tick(Math.min(now-lastTime,100)); lastTime=now; drawBoard(); requestAnimationFrame(loop); }
drawBoard(); requestAnimationFrame(loop);
