// Tetris implementation
const COLS = 10, ROWS = 20, BLOCK = 32;
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const pieces: any = {
  I: { shape: [[1,1,1,1]], color: '#00f0f0' },
  O: { shape: [[1,1],[1,1]], color: '#f0f000' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#00f000' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#f00000' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#f0a000' }
};
let bag: string[] = [];
function nextBag() { bag = Object.keys(pieces).sort(() => Math.random()-0.5); }
function getPiece() { if (!bag.length) nextBag(); return bag.pop()!; }
let board: number[][] = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let colors: string[][] = Array.from({length: ROWS}, () => Array(COLS).fill(''));
let cur: any = null; let score = 0, lines = 0, level = 1;
function spawn() {
  const type = getPiece();
  const p = pieces[type];
  cur = { type, shape: p.shape, color: p.color, x: 3, y: 0 };
  if (collide(cur, 0, 0)) { gameOver(); }
}
function collide(p: any, dx: number, dy: number) {
  for (let r=0;r<p.shape.length;r++) for (let c=0;c<p.shape[r].length;c++) {
    if (p.shape[r][c]) {
      const nx = p.x+c+dx, ny = p.y+r+dy;
      if (nx<0||nx>=COLS||ny>=ROWS) return true;
      if (ny>=0 && board[ny][nx]) return true;
    }
  }
  return false;
}
function rotate(shape: number[][]) { return shape[0].map((_,i) => shape.map(r => r[i]).reverse()); }
function lock() {
  for (let r=0;r<cur.shape.length;r++) for (let c=0;c<cur.shape[r].length;c++) {
    if (cur.shape[r][c]) { board[cur.y+r][cur.x+c] = 1; colors[cur.y+r][cur.x+c] = cur.color; }
  }
  clearLines();
  spawn();
}
function clearLines() {
  let cleared = 0;
  for (let r=ROWS-1;r>=0;r--) {
    if (board[r].every(v=>v)) {
      board.splice(r,1); colors.splice(r,1);
      board.unshift(Array(COLS).fill(0)); colors.unshift(Array(COLS).fill(''));
      cleared++; r++;
    }
  }
  if (cleared) { lines += cleared; score += [0,100,300,500,800][cleared]*level; level = Math.floor(lines/10)+1; updateUI(); }
}
function updateUI() {
  document.getElementById('score')!.textContent = String(score);
  document.getElementById('level')!.textContent = String(level);
  document.getElementById('lines')!.textContent = String(lines);
}
let gameOverFlag = false;
function gameOver() { gameOverFlag = true; }
function draw() {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (board[r][c]) { ctx.fillStyle = colors[r][c]; ctx.fillRect(c*BLOCK,r*BLOCK,BLOCK-1,BLOCK-1); }
  }
  if (cur) {
    ctx.fillStyle = cur.color;
    for (let r=0;r<cur.shape.length;r++) for (let c=0;c<cur.shape[r].length;c++) {
      if (cur.shape[r][c]) ctx.fillRect((cur.x+c)*BLOCK,(cur.y+r)*BLOCK,BLOCK-1,BLOCK-1);
    }
  }
}
let last = 0, dropCounter = 0, dropInterval = 1000;
function update(time: number) {
  if (gameOverFlag) { ctx.fillStyle='#fff'; ctx.font='30px sans-serif'; ctx.fillText('Game Over', 80, 300); return; }
  const delta = time-last; last=time; dropCounter+=delta;
  if (dropCounter > 1000/level) { if (!collide(cur,0,1)) cur.y++; else lock(); dropCounter=0; }
  draw();
  requestAnimationFrame(update);
}
document.addEventListener('keydown', e => {
  if (gameOverFlag && e.key==='r') { board = Array.from({length: ROWS}, () => Array(COLS).fill(0)); colors = Array.from({length: ROWS}, () => Array(COLS).fill('')); score=0; lines=0; level=1; gameOverFlag=false; updateUI(); spawn(); return; }
  if (!cur) return;
  if (e.key==='ArrowLeft') { if (!collide(cur,-1,0)) cur.x--; }
  else if (e.key==='ArrowRight') { if (!collide(cur,1,0)) cur.x++; }
  else if (e.key==='ArrowDown') { if (!collide(cur,0,1)) cur.y++; }
  else if (e.key==='ArrowUp' || e.key==='x') { const r = rotate(cur.shape); const old = cur.shape; cur.shape = r; if (collide(cur,0,0)) cur.shape = old; }
  else if (e.key==='z') { const r = rotate(rotate(rotate(cur.shape))); const old = cur.shape; cur.shape = r; if (collide(cur,0,0)) cur.shape = old; }
  else if (e.key===' ') { while (!collide(cur,0,1)) cur.y++; lock(); }
  draw();
});
nextBag(); spawn(); requestAnimationFrame(update);