type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Cell = PieceType | null;
type Piece = { type: PieceType; matrix: Cell[][]; x: number; y: number; rotation: number };
type GameState = 'ready' | 'playing' | 'paused' | 'over';

const WIDTH = 10;
const HEIGHT = 20;
const CELL = 30;
const COLORS: Record<PieceType, string> = {
  I: '#54d9e8', O: '#f6cf58', T: '#ac82fa', S: '#89dc78', Z: '#ff7188', J: '#6f9bff', L: '#ffad61'
};
const SHAPES: Record<PieceType, string[]> = {
  I: ['....', 'IIII', '....', '....'], O: ['OO', 'OO'], T: ['.T.', 'TTT', '...'],
  S: ['.SS', 'SS.', '...'], Z: ['ZZ.', '.ZZ', '...'], J: ['J..', 'JJJ', '...'], L: ['..L', 'LLL', '...']
};
const TYPES = Object.keys(SHAPES) as PieceType[];
const JLSTZ_KICKS: Record<string, Array<[number, number]>> = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]], '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const I_KICKS: Record<string, Array<[number, number]>> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};

const boardCanvas = document.querySelector<HTMLCanvasElement>('#board')!;
const boardCtx = boardCanvas.getContext('2d')!;
const holdCanvas = document.querySelector<HTMLCanvasElement>('#hold-canvas')!;
const holdCtx = holdCanvas.getContext('2d')!;
const overlay = document.querySelector<HTMLElement>('#overlay')!;
const nextContainer = document.querySelector<HTMLElement>('#next-pieces')!;
const scoreNode = document.querySelector<HTMLElement>('#score')!;
const linesNode = document.querySelector<HTMLElement>('#lines')!;
const levelNode = document.querySelector<HTMLElement>('#level')!;
const bestNode = document.querySelector<HTMLElement>('#best-score')!;

function matrixFor(type: PieceType): Cell[][] {
  return SHAPES[type].map(row => [...row].map(char => char === '.' ? null : type));
}
function rotate(matrix: Cell[][], clockwise: boolean): Cell[][] {
  const size = matrix.length;
  return Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => clockwise ? matrix[size - 1 - x][y] : matrix[x][size - 1 - y]));
}
function randomBag(): PieceType[] {
  const bag = [...TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

class Tetris {
  board: Cell[][] = this.emptyBoard();
  queue: PieceType[] = [];
  current!: Piece;
  held: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  state: GameState = 'ready';
  dropAccumulator = 0;
  lockAccumulator = 0;
  lockResets = 0;
  lastTime = 0;
  sound = false;
  audio: AudioContext | null = null;
  best = Number(localStorage.getItem('tetris-best') || 0);

  constructor() {
    this.fillQueue();
    this.current = this.makePiece(this.takeNext());
    bestNode.textContent = this.format(this.best);
    this.render();
    requestAnimationFrame(time => this.frame(time));
  }
  emptyBoard(): Cell[][] { return Array.from({ length: HEIGHT }, () => Array<Cell>(WIDTH).fill(null)); }
  fillQueue(): void { while (this.queue.length < 7) this.queue.push(...randomBag()); }
  takeNext(): PieceType { this.fillQueue(); return this.queue.shift()!; }
  makePiece(type: PieceType): Piece { return { type, matrix: matrixFor(type), x: Math.floor((WIDTH - matrixFor(type).length) / 2), y: 0, rotation: 0 }; }
  format(value: number): string { return Math.floor(value).toString().padStart(6, '0'); }
  gravity(): number { return Math.max(0.045, 0.8 * Math.pow(0.82, this.level - 1)); }
  collides(piece: Piece, dx = 0, dy = 0, matrix = piece.matrix): boolean {
    for (let y = 0; y < matrix.length; y++) for (let x = 0; x < matrix[y].length; x++) {
      if (!matrix[y][x]) continue;
      const bx = piece.x + x + dx, by = piece.y + y + dy;
      if (bx < 0 || bx >= WIDTH || by >= HEIGHT || (by >= 0 && this.board[by][bx])) return true;
    }
    return false;
  }
  start(): void {
    if (this.state === 'over') this.reset();
    if (this.state === 'ready') { this.state = 'playing'; overlay.classList.add('hidden'); }
  }
  reset(): void {
    this.board = this.emptyBoard(); this.queue = []; this.fillQueue(); this.current = this.makePiece(this.takeNext());
    this.held = null; this.canHold = true; this.score = 0; this.lines = 0; this.level = 1;
    this.dropAccumulator = 0; this.lockAccumulator = 0; this.lockResets = 0; this.state = 'playing';
    overlay.classList.add('hidden'); document.body.classList.remove('paused'); this.updateStats(); this.render();
  }
  move(dx: number): void {
    if (this.state !== 'playing' || this.collides(this.current, dx)) return;
    this.current.x += dx; this.resetLock(); this.render();
  }
  rotatePiece(clockwise: boolean): void {
    if (this.state !== 'playing' || this.current.type === 'O') return;
    const from = this.current.rotation, to = (from + (clockwise ? 1 : 3)) % 4;
    const matrix = rotate(this.current.matrix, clockwise);
    const kicks = (this.current.type === 'I' ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`];
    for (const [dx, up] of kicks) {
      if (!this.collides(this.current, dx, -up, matrix)) {
        this.current.x += dx; this.current.y -= up; this.current.matrix = matrix; this.current.rotation = to;
        this.resetLock(); this.render(); return;
      }
    }
  }
  resetLock(): void { if (this.lockResets < 15) { this.lockAccumulator = 0; this.lockResets++; } }
  softDrop(): void {
    if (this.state !== 'playing') return;
    if (!this.collides(this.current, 0, 1)) { this.current.y++; this.score++; this.updateStats(); }
    this.render();
  }
  hardDrop(): void {
    if (this.state !== 'playing') return;
    let distance = 0;
    while (!this.collides(this.current, 0, 1)) { this.current.y++; distance++; }
    this.score += distance * 2; this.lockPiece();
  }
  hold(): void {
    if (this.state !== 'playing' || !this.canHold) return;
    const type = this.current.type;
    this.current = this.held ? this.makePiece(this.held) : this.makePiece(this.takeNext());
    this.held = type; this.canHold = false; this.dropAccumulator = 0; this.lockAccumulator = 0;
    if (this.collides(this.current)) this.gameOver();
    this.render();
  }
  lockPiece(): void {
    for (let y = 0; y < this.current.matrix.length; y++) for (let x = 0; x < this.current.matrix[y].length; x++) {
      if (!this.current.matrix[y][x]) continue;
      const by = this.current.y + y, bx = this.current.x + x;
      if (by < 0) { this.gameOver(); return; }
      this.board[by][bx] = this.current.type;
    }
    this.clearLines();
    this.current = this.makePiece(this.takeNext()); this.canHold = true; this.dropAccumulator = 0; this.lockAccumulator = 0; this.lockResets = 0;
    if (this.collides(this.current)) this.gameOver();
    this.render();
  }
  clearLines(): void {
    let count = 0;
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(Boolean)) { this.board.splice(y, 1); this.board.unshift(Array<Cell>(WIDTH).fill(null)); count++; y++; }
    }
    if (!count) return;
    const points = [0, 100, 300, 500, 800];
    this.score += (points[count] || count * 200) * this.level;
    this.lines += count; this.level = Math.floor(this.lines / 10) + 1; this.updateStats(); this.playClearSound();
  }
  gameOver(): void {
    this.state = 'over'; overlay.classList.remove('hidden');
    overlay.innerHTML = `<div class="overlay-content"><span class="overlay-kicker">STACK COMPLETE</span><h1>Game<br /><em>over.</em></h1><p>Score ${this.format(this.score)} · ${this.lines} lines cleared</p><button class="primary-button" id="start-button">PLAY AGAIN <span>↗</span></button></div>`;
    document.querySelector('#start-button')!.addEventListener('click', () => this.reset());
    if (this.score > this.best) { this.best = this.score; localStorage.setItem('tetris-best', String(this.best)); bestNode.textContent = this.format(this.best); }
    this.render();
  }
  togglePause(): void {
    if (this.state === 'playing') { this.state = 'paused'; document.body.classList.add('paused'); }
    else if (this.state === 'paused') { this.state = 'playing'; document.body.classList.remove('paused'); this.lastTime = performance.now(); }
  }
  toggleSound(button: HTMLButtonElement): void {
    this.sound = !this.sound; button.querySelector('span')!.textContent = this.sound ? 'ON' : 'OFF'; button.title = this.sound ? 'Sound is on' : 'Sound is off';
    if (this.sound && !this.audio) this.audio = new AudioContext();
  }
  playClearSound(): void {
    if (!this.sound || !this.audio) return;
    const oscillator = this.audio.createOscillator(), gain = this.audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 520; gain.gain.setValueAtTime(.08, this.audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, this.audio.currentTime + .2);
    oscillator.connect(gain); gain.connect(this.audio.destination); oscillator.start(); oscillator.stop(this.audio.currentTime + .2);
  }
  updateStats(): void { scoreNode.textContent = this.format(this.score); linesNode.textContent = String(this.lines); levelNode.textContent = String(this.level); }
  frame(time: number): void {
    const dt = Math.min(time - (this.lastTime || time), 50); this.lastTime = time;
    if (this.state === 'playing') {
      this.dropAccumulator += dt;
      if (this.dropAccumulator >= this.gravity() * 1000) {
        this.dropAccumulator = 0;
        if (!this.collides(this.current, 0, 1)) this.current.y++;
      }
      if (this.collides(this.current, 0, 1)) { this.lockAccumulator += dt; if (this.lockAccumulator >= 500) this.lockPiece(); }
      else this.lockAccumulator = 0;
      this.render();
    }
    requestAnimationFrame(next => this.frame(next));
  }
  drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: PieceType, alpha = 1): void {
    ctx.globalAlpha = alpha;
    const inset = Math.max(1, size * .055);
    ctx.fillStyle = COLORS[type]; ctx.beginPath(); ctx.roundRect(x * size + inset, y * size + inset, size - inset * 2, size - inset * 2, size * .16); ctx.fill();
    ctx.fillStyle = '#ffffff32'; ctx.beginPath(); ctx.roundRect(x * size + inset + 2, y * size + inset + 2, size - inset * 2 - 4, Math.max(2, size * .11), size * .07); ctx.fill();
    ctx.fillStyle = '#00000018'; ctx.beginPath(); ctx.roundRect(x * size + inset + 2, y * size + size * .78, size - inset * 2 - 4, Math.max(2, size * .08), size * .06); ctx.fill();
    ctx.globalAlpha = 1;
  }
  drawMini(canvas: HTMLCanvasElement, type: PieceType | null): void {
    const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    const matrix = matrixFor(type), size = 19;
    const cells: Array<[number, number]> = [];
    matrix.forEach((row, y) => row.forEach((cell, x) => { if (cell) cells.push([x, y]); }));
    const minX = Math.min(...cells.map(cell => cell[0])), maxX = Math.max(...cells.map(cell => cell[0]));
    const minY = Math.min(...cells.map(cell => cell[1])), maxY = Math.max(...cells.map(cell => cell[1]));
    const ox = (canvas.width - (maxX - minX + 1) * size) / 2, oy = (canvas.height - (maxY - minY + 1) * size) / 2;
    for (const [x, y] of cells) this.drawCell(ctx, ox / size + x - minX, oy / size + y - minY, size, type);
  }
  renderQueue(): void {
    nextContainer.replaceChildren();
    this.queue.slice(0, 3).forEach(type => {
      const canvas = document.createElement('canvas'); canvas.width = 136; canvas.height = 64; canvas.setAttribute('aria-label', `Next ${type} piece`); this.drawMini(canvas, type); nextContainer.append(canvas);
    });
  }
  render(): void {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.fillStyle = '#111520'; boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.strokeStyle = '#ffffff0a'; boardCtx.lineWidth = 1;
    for (let x = 1; x < WIDTH; x++) { boardCtx.beginPath(); boardCtx.moveTo(x * CELL + .5, 0); boardCtx.lineTo(x * CELL + .5, HEIGHT * CELL); boardCtx.stroke(); }
    for (let y = 1; y < HEIGHT; y++) { boardCtx.beginPath(); boardCtx.moveTo(0, y * CELL + .5); boardCtx.lineTo(WIDTH * CELL, y * CELL + .5); boardCtx.stroke(); }
    this.board.forEach((row, y) => row.forEach((type, x) => { if (type) this.drawCell(boardCtx, x, y, CELL, type); }));
    if (this.state === 'playing' || this.state === 'paused') {
      let ghostY = this.current.y; while (!this.collides(this.current, 0, ghostY - this.current.y + 1)) ghostY++;
      this.current.matrix.forEach((row, y) => row.forEach((type, x) => { if (type && ghostY + y >= 0) this.drawCell(boardCtx, this.current.x + x, ghostY + y, CELL, type, .18); }));
      this.current.matrix.forEach((row, y) => row.forEach((type, x) => { if (type && this.current.y + y >= 0) this.drawCell(boardCtx, this.current.x + x, this.current.y + y, CELL, type); }));
    }
    this.drawMini(holdCanvas, this.held); this.renderQueue(); this.updateStats();
  }
}

const game = new Tetris();
document.querySelector('#start-button')!.addEventListener('click', () => game.start());
document.querySelector('#restart-button')!.addEventListener('click', () => game.reset());
document.querySelector<HTMLButtonElement>('#sound-toggle')!.addEventListener('click', event => game.toggleSound(event.currentTarget as HTMLButtonElement));
window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' ', 'control'].includes(key)) event.preventDefault();
  if ((game.state === 'ready' || game.state === 'over') && (key === ' ' || key === 'enter')) { game.start(); return; }
  if (game.state === 'over' && key === 'r') { game.reset(); return; }
  if (key === 'p' || key === 'escape') { game.togglePause(); return; }
  if (game.state !== 'playing') return;
  switch (key) {
    case 'arrowleft': case 'a': game.move(-1); break;
    case 'arrowright': case 'd': game.move(1); break;
    case 'arrowdown': case 's': game.softDrop(); break;
    case 'arrowup': case 'x': game.rotatePiece(true); break;
    case 'z': case 'control': game.rotatePiece(false); break;
    case ' ': game.hardDrop(); break;
    case 'c': case 'shift': game.hold(); break;
  }
});
