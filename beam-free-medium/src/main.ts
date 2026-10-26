import { initGame, move, rotateCW, rotateCCW, softDrop, hardDrop, hold, lockPiece, ghostY, gravityInterval, collides, COLORS, COLS, ROWS, shapeOf } from './game';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const CELL = 24;
canvas.width = COLS*CELL;
canvas.height = ROWS*CELL;

let state = initGame();
let last = 0;
let acc = 0;
let over = false;

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // board
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const v = state.board[r][c];
    if (v) { ctx.fillStyle = COLORS[v]; ctx.fillRect(c*CELL, r*CELL, CELL-1, CELL-1); }
  }
  // ghost
  if (state.current) {
    const gy = ghostY(state);
    const sh = shapeOf(state.current);
    ctx.globalAlpha = 0.25;
    for (let r=0;r<sh.length;r++) for (let c=0;c<sh[r].length;c++) {
      if (!sh[r][c]) continue;
      const x = state.current.x+c, y = gy+r;
      if (y>=0) { ctx.fillStyle = COLORS[state.current.type+1]; ctx.fillRect(x*CELL, y*CELL, CELL-1, CELL-1); }
    }
    ctx.globalAlpha = 1;
    // current
    for (let r=0;r<sh.length;r++) for (let c=0;c<sh[r].length;c++) {
      if (!sh[r][c]) continue;
      const x = state.current.x+c, y = state.current.y+r;
      if (y>=0) { ctx.fillStyle = COLORS[state.current.type+1]; ctx.fillRect(x*CELL, y*CELL, CELL-1, CELL-1); }
    }
  }
  // HUD
  const hud = document.getElementById('hud')!;
  hud.textContent = `Score ${state.score}  Lines ${state.lines}  Level ${state.level}${state.gameOver?'  GAME OVER (R)':''}`;
}

function tick(ts: number) {
  const dt = ts - last; last = ts;
  if (!state.gameOver) {
    acc += dt;
    const interval = gravityInterval(state.level);
    if (acc >= interval) {
      acc = 0;
      if (state.current) {
        const p = { ...state.current, y: state.current.y+1 };
        if (!collides(state.board, p)) { state.current = p; }
        else {
          // lock delay simple: lock immediately
          lockPiece(state);
        }
      }
    }
  }
  draw();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (e) => {
  if (state.gameOver) {
    if (e.key.toLowerCase()==='r') { state = initGame(); acc=0; }
    return;
  }
  switch (e.key) {
    case 'ArrowLeft': move(state,-1); break;
    case 'ArrowRight': move(state,1); break;
    case 'ArrowUp': case 'x': case 'X': rotateCW(state); break;
    case 'z': case 'Z': case 'Control': rotateCCW(state); break;
    case 'ArrowDown': softDrop(state); break;
    case ' ': hardDrop(state); break;
    case 'c': case 'C': hold(state); break;
  }
  e.preventDefault();
});

requestAnimationFrame((t)=>{ last=t; tick(t); });
