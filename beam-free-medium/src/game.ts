export type Cell = number; // 0 empty, >0 color index
export type Board = Cell[][];

export const COLS = 10;
export const ROWS = 20;

export const PIECES: any = [
  // I
  [[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
   [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]],
  // O
  [[[1,1],[1,1]]],
  // T
  [[[0,1,0],[1,1,1],[0,0,0]],
   [[0,1,0],[0,1,1],[0,1,0]],
   [[0,0,0],[1,1,1],[0,1,0]],
   [[0,1,0],[1,1,0],[0,1,0]]],
  // S
  [[[0,1,1],[1,1,0],[0,0,0]],
   [[0,1,0],[0,1,1],[0,0,1]]],
  // Z
  [[[1,1,0],[0,1,1],[0,0,0]],
   [[0,0,1],[0,1,1],[0,1,0]]],
  // J
  [[[1,0,0],[1,1,1],[0,0,0]],
   [[0,1,1],[0,1,0],[0,1,0]],
   [[0,0,0],[1,1,1],[0,0,1]],
   [[0,1,0],[0,1,0],[1,1,0]]],
  // L
  [[[0,0,1],[1,1,1],[0,0,0]],
   [[0,1,0],[0,1,0],[0,1,1]],
   [[0,0,0],[1,1,1],[1,0,0]],
   [[1,1,0],[0,1,0],[0,1,0]]]
];

export const COLORS: string[] = ['','#00f0f0','#f0f000','#a000f0','#00f000','#f00000','#0000f0','#f0a000'];

export interface PieceState { type:number; rot:number; x:number; y:number; }

export function newBoard(): Board {
  const b: Board = [];
  for (let r=0;r<ROWS;r++) b.push(new Array(COLS).fill(0));
  return b;
}

export function shapeOf(p: PieceState): number[][] {
  return PIECES[p.type][p.rot % PIECES[p.type].length];
}

export function collides(board: Board, p: PieceState): boolean {
  const sh = shapeOf(p);
  for (let r=0;r<sh.length;r++) for (let c=0;c<sh[r].length;c++) {
    if (!sh[r][c]) continue;
    const x = p.x + c, y = p.y + r;
    if (x<0||x>=COLS||y>=ROWS) return true;
    if (y>=0 && board[y][x]) return true;
  }
  return false;
}

export function rotate(p: PieceState, dir: 1|-1): PieceState {
  const t = p.type;
  const rotations = PIECES[t].length;
  const nr = ((p.rot + (dir===1?1:-1)) % rotations + rotations) % rotations;
  return { type:t, rot:nr, x:p.x, y:p.y };
}

// Simplify: try small offsets
export function tryRotate(board: Board, p: PieceState, dir: 1|-1): PieceState | null {
  const base = rotate(p, dir);
  const offsets = [[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[-1,-1],[1,-1],[0,1]];
  for (const [ox,oy] of offsets) {
    const cand = { type: base.type, rot: base.rot, x: base.x+ox, y: base.y+oy };
    if (!collides(board, cand)) return cand;
  }
  return null;
}

export function lock(board: Board, p: PieceState): void {
  const sh = shapeOf(p);
  for (let r=0;r<sh.length;r++) for (let c=0;c<sh[r].length;c++) {
    if (!sh[r][c]) continue;
    const x=p.x+c, y=p.y+r;
    if (y>=0 && y<ROWS && x>=0 && x<COLS) board[y][x] = p.type+1;
  }
}

export function clearLines(board: Board): number {
  let cleared = 0;
  for (let r=ROWS-1;r>=0;r--) {
    if (board[r].every(c=>c!==0)) {
      board.splice(r,1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  return cleared;
}

export class Bag {
  private bag: number[] = [];
  next(): number {
    if (this.bag.length===0) {
      this.bag = [0,1,2,3,4,5,6];
      // shuffle
      for (let i=this.bag.length-1;i>0;i--) {
        const j = Math.floor(Math.random()*(i+1));
        [this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}

export interface GameState {
  board: Board;
  current: PieceState | null;
  hold: number | null;
  holdUsed: boolean;
  queue: number[];
  bag: Bag;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  // lock delay
  lockTimer: number;
  onGround: boolean;
}

export function spawnPiece(type: number): PieceState {
  const sh = PIECES[type][0];
  const x = Math.floor((COLS - sh[0].length)/2);
  return { type, rot:0, x, y: - (sh.length-2) } as any;
  // adjust: start y 0-ish? Guideline spawn above top; use y=0 for top row visibility? We'll use y=-1 for I? 
}

// Actually spawn at top row (y=0) with offset; handle collision top-out
export function spawn(state: GameState, type?: number): boolean {
  const t = type ?? state.queue.shift() ?? state.bag.next();
  if (state.queue.length < 5) state.queue.push(state.bag.next());
  const p = { type: t, rot:0, x: Math.floor((COLS - PIECES[t][0][0].length)/2), y: 0 };
  // for I piece, spawn one row up? Guideline: I spawns row 20? We'll keep y=0 and top-out if collides
  // adjust y for pieces with height 3? Standard spawn y=-1 for some. Keep simple: y=0
  if (collides(state.board, p)) {
    // try y=-1
    p.y = -1;
    if (collides(state.board, p)) {
      state.gameOver = true;
      state.current = null;
      return false;
    }
  }
  state.current = p;
  state.holdUsed = false;
  state.lockTimer = 0;
  state.onGround = false;
  return true;
}

export function initGame(): GameState {
  const s: GameState = {
    board: newBoard(),
    current: null,
    hold: null,
    holdUsed: false,
    queue: [],
    bag: new Bag(),
    score: 0,
    lines: 0,
    level: 0,
    gameOver: false,
    lockTimer: 0,
    onGround: false,
  };
  for (let i=0;i<5;i++) s.queue.push(s.bag.next());
  spawn(s);
  return s;
}

export function gravityInterval(level: number): number {
  // ms per cell
  const speeds = [800,717,633,550,467,383,300,217,133,100,83,67,50,33,17];
  const l = Math.min(level, speeds.length-1);
  return speeds[l];
}

export function softDrop(state: GameState): void {
  if (!state.current) return;
  const p = { ...state.current, y: state.current.y+1 };
  if (!collides(state.board, p)) {
    state.current = p;
    state.score += 1;
  }
}

export function hardDrop(state: GameState): number {
  if (!state.current) return 0;
  let dist = 0;
  while (true) {
    const cur: any = state.current;
    const p: any = { ...cur, y: cur.y+1 };
    if (collides(state.board, p)) break;
    state.current = p;
    dist++;
  }
  state.score += 2*dist;
  lockPiece(state);
  return dist;
}

export function move(state: GameState, dx: number): boolean {
  if (!state.current) return false;
  const p = { ...state.current, x: state.current.x+dx };
  if (collides(state.board, p)) return false;
  state.current = p;
  return true;
}

export function rotateCW(state: GameState): boolean {
  if (!state.current) return false;
  const cand = tryRotate(state.board, state.current, 1);
  if (!cand) return false;
  state.current = cand;
  return true;
}
export function rotateCCW(state: GameState): boolean {
  if (!state.current) return false;
  const cand = tryRotate(state.board, state.current, -1);
  if (!cand) return false;
  state.current = cand;
  return true;
}

export function hold(state: GameState): void {
  if (!state.current || state.holdUsed) return;
  const t = state.current.type;
  if (state.hold === null) {
    state.hold = t;
    spawn(state);
  } else {
    const h = state.hold;
    state.hold = t;
    // spawn held type
    const p = { type: h, rot:0, x: Math.floor((COLS - PIECES[h][0][0].length)/2), y: 0 };
    if (collides(state.board, p)) { p.y=-1; if (collides(state.board,p)){ state.gameOver=true; state.current=null; return; } }
    state.current = p;
  }
  state.holdUsed = true;
}

export function lockPiece(state: GameState): void {
  if (!state.current) return;
  lock(state.board, state.current);
  const cleared = clearLines(state.board);
  // scoring
  const lineScores = [0,100,300,500,800];
  state.score += (lineScores[cleared]||0) * (state.level+1);
  state.lines += cleared;
  state.level = Math.floor(state.lines/10);
  state.current = null;
  if (!state.gameOver) spawn(state);
}

export function ghostY(state: GameState): number {
  if (!state.current) return 0;
  let y = state.current.y;
  while (true) {
    const p = { ...state.current, y: y+1 };
    if (collides(state.board, p)) break;
    y++;
  }
  return y;
}
