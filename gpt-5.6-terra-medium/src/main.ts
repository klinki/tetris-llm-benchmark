type Kind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
type Cell = Kind | null;
type Piece = { kind: Kind; rotation: number; x: number; y: number };

const W = 10, H = 20, CELL = 30;
const COLORS: Record<Kind, string> = { I: "#37dfff", O: "#ffe14a", T: "#c46cff", S: "#5de46a", Z: "#ff5967", J: "#5b8cff", L: "#ff9c40" };
const SHAPES: Record<Kind, readonly (readonly [number, number][])[]> = {
  I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
  O: [[[1,0],[2,0],[1,1],[2,1]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
  S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]]
};
const JLSTZ_KICKS = [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1],[0,1]];
const I_KICKS = [[0,0],[-2,0],[1,0],[-1,0],[2,0],[0,-1],[0,1]];

export class TetrisGame {
  board: Cell[][] = Array.from({ length: H }, () => Array<Cell>(W).fill(null));
  current!: Piece; queue: Kind[] = []; hold: Kind | null = null; canHold = true; score = 0; lines = 0; level = 1; over = false;
  private bag: Kind[] = [];
  constructor() { this.refill(); this.spawn(); }
  private randomKind(): Kind { if (!this.bag.length) this.bag = this.shuffle(["I","O","T","S","Z","J","L"]); return this.bag.pop()!; }
  private shuffle<T>(items: T[]): T[] { for (let i = items.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items; }
  private refill() { while (this.queue.length < 5) this.queue.push(this.randomKind()); }
  cells(p = this.current) { return SHAPES[p.kind][p.rotation % SHAPES[p.kind].length].map(([x,y]) => [p.x+x,p.y+y] as [number,number]); }
  valid(p: Piece) { return this.cells(p).every(([x,y]) => x >= 0 && x < W && y < H && (y < 0 || !this.board[y][x])); }
  spawn(kind = this.queue.shift()!) { this.refill(); this.current = { kind, rotation: 0, x: 3, y: -1 }; this.canHold = true; if (!this.valid(this.current)) this.over = true; }
  move(dx: number, dy: number) { const p = { ...this.current, x: this.current.x + dx, y: this.current.y + dy }; if (!this.valid(p)) return false; this.current = p; return true; }
  rotate(dir: 1 | -1) { if (this.current.kind === "O") return; const count = SHAPES[this.current.kind].length; const p = { ...this.current, rotation: (this.current.rotation + dir + count) % count }; for (const [x,y] of this.current.kind === "I" ? I_KICKS : JLSTZ_KICKS) { const kicked = { ...p, x: p.x+x, y: p.y+y }; if (this.valid(kicked)) { this.current = kicked; return; } } }
  softDrop() { if (this.move(0,1)) { this.score++; return true; } this.lock(); return false; }
  hardDrop() { let d = 0; while (this.move(0,1)) d++; this.score += d * 2; this.lock(); }
  ghostY() { let p = { ...this.current }; while (this.valid({ ...p, y: p.y+1 })) p.y++; return p.y; }
  holdPiece() { if (!this.canHold) return; const old = this.hold; this.hold = this.current.kind; if (old) { this.current = { kind: old, rotation: 0, x: 3, y: -1 }; if (!this.valid(this.current)) this.over = true; } else this.spawn(); this.canHold = false; }
  private lock() { for (const [x,y] of this.cells()) if (y >= 0) this.board[y][x] = this.current.kind; this.clearLines(); this.spawn(); }
  private clearLines() { let cleared = 0; this.board = this.board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (this.board.length < H) this.board.unshift(Array<Cell>(W).fill(null)); if (cleared) { this.lines += cleared; this.score += [0,100,300,500,800][cleared] * this.level; this.level = Math.floor(this.lines / 10) + 1; } }
}

const board = document.querySelector<HTMLCanvasElement>("#board")!, ctx = board.getContext("2d")!;
const holdCanvas = document.querySelector<HTMLCanvasElement>("#hold")!, nextCanvas = document.querySelector<HTMLCanvasElement>("#next")!;
const scoreEl = document.querySelector("#score")!, levelEl = document.querySelector("#level")!, linesEl = document.querySelector("#lines")!, message = document.querySelector("#message")!;
let game = new TetrisGame(), last = performance.now(), elapsed = 0;
function block(c: CanvasRenderingContext2D, x: number, y: number, color: string, size = CELL, alpha = 1) { c.globalAlpha = alpha; c.fillStyle = color; c.fillRect(x*size+1,y*size+1,size-2,size-2); c.fillStyle = "#ffffff33"; c.fillRect(x*size+3,y*size+3,size-6,3); c.globalAlpha = 1; }
function mini(canvas: HTMLCanvasElement, pieces: (Kind | null)[]) { const c = canvas.getContext("2d")!; c.clearRect(0,0,canvas.width,canvas.height); pieces.forEach((kind,n) => { if (!kind) return; const ox = 15, oy = n*58 + 12; SHAPES[kind][0].forEach(([x,y]) => block(c,x+1,y+oy/20,COLORS[kind],20)); }); }
function draw() { ctx.fillStyle = "#0b1120"; ctx.fillRect(0,0,board.width,board.height); ctx.strokeStyle = "#14203a"; for(let i=0;i<=W;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,H*CELL);ctx.stroke();} for(let i=0;i<=H;i++){ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(W*CELL,i*CELL);ctx.stroke();}
  game.board.forEach((row,y) => row.forEach((v,x) => v && block(ctx,x,y,COLORS[v]))); const ghost = { ...game.current, y: game.ghostY() }; game.cells(ghost).forEach(([x,y]) => y>=0 && block(ctx,x,y,COLORS[ghost.kind],CELL,.18)); game.cells().forEach(([x,y]) => y>=0 && block(ctx,x,y,COLORS[game.current.kind]));
  mini(holdCanvas,[game.hold]); mini(nextCanvas,game.queue.slice(0,5)); scoreEl.textContent=String(game.score); levelEl.textContent=String(game.level); linesEl.textContent=String(game.lines);
  message.classList.toggle("hidden",!game.over); message.innerHTML = "GAME OVER<br><small>Press R to restart</small>";
}
function loop(now: number) { const dt = now-last; last=now; if(!game.over) { elapsed+=dt; if(elapsed >= Math.max(80, 850-(game.level-1)*70)) { game.softDrop(); elapsed=0; } } draw(); requestAnimationFrame(loop); }
window.addEventListener("keydown", e => { const key=e.key.toLowerCase(); if (["arrowleft","arrowright","arrowup","arrowdown"," "].includes(key)) e.preventDefault(); if (game.over) { if(key==="r") game=new TetrisGame(); return; } if(key==="arrowleft")game.move(-1,0); else if(key==="arrowright")game.move(1,0); else if(key==="arrowdown")game.softDrop(); else if(key==="arrowup"||key==="x")game.rotate(1); else if(key==="z"||key==="control")game.rotate(-1); else if(key===" ")game.hardDrop(); else if(key==="c")game.holdPiece(); draw(); });
draw(); requestAnimationFrame(loop);
