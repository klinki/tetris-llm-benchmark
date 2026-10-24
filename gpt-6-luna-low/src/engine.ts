export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = PieceKind | null;
export interface ActivePiece { kind: PieceKind; rotation: number; x: number; y: number }
export interface GameState { board: Cell[][]; active: ActivePiece | null; queue: PieceKind[]; hold: PieceKind | null; canHold: boolean; score: number; lines: number; level: number; pieces: number; gameOver: boolean; started: boolean }
export const WIDTH = 10, HEIGHT = 20;
export const COLORS: Record<PieceKind, string> = { I:'#52d6d1', O:'#f3c84b', T:'#b276e8', S:'#78cf79', Z:'#ed6470', J:'#5989ed', L:'#f09a49' };
const SHAPES: Record<PieceKind, number[][]> = {
  I:[[0,1],[1,1],[2,1],[3,1]], O:[[1,0],[2,0],[1,1],[2,1]], T:[[1,0],[0,1],[1,1],[2,1]], S:[[1,0],[2,0],[0,1],[1,1]], Z:[[0,0],[1,0],[1,1],[2,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]]
};
type Offset = [number, number];
// Guideline SRS kick data: tests are ordered in the direction of rotation.
const JLSTZ: Record<string, Offset[]> = {
  '0>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0':[[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2':[[0,0],[1,0],[1,-1],[0,2],[1,2]], '2>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3>2':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const I_KICKS: Record<string, Offset[]> = {
  '0>1':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};
const kinds: PieceKind[] = ['I','O','T','S','Z','J','L'];
export function cells(piece: ActivePiece): Offset[] {
  const source = SHAPES[piece.kind];
  if (piece.kind === 'O') return source.map(([x,y]) => [x + piece.x, y + piece.y]);
  return source.map(([x,y]) => { let px=x, py=y; for(let i=0;i<piece.rotation;i++) [px,py]=[3-py,px]; return [px+piece.x,py+piece.y]; });
}
export class TetrisGame {
  state: GameState = this.emptyState();
  private bag: PieceKind[] = [];
  private gravityMs = 0;
  private lockMs = 0;
  private lockResets = 0;
  private readonly lockDelay = 500;
  private readonly maxLockResets = 15;
  private emptyState(): GameState { return {board:Array.from({length:HEIGHT},()=>Array<Cell>(WIDTH).fill(null)),active:null,queue:[],hold:null,canHold:true,score:0,lines:0,level:1,pieces:0,gameOver:false,started:false}; }
  start(): void { this.state=this.emptyState(); this.bag=[]; this.gravityMs=0; this.lockMs=0; this.lockResets=0; this.state.started=true; this.fillQueue(); this.spawn(); }
  private drawBag(): PieceKind { if(!this.bag.length){this.bag=[...kinds];for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}return this.bag.pop()!; }
  private fillQueue(): void { while(this.state.queue.length<5) this.state.queue.push(this.drawBag()); }
  private spawn(kind=this.state.queue.shift()!): void { this.fillQueue(); this.state.active={kind,rotation:0,x:3,y:0};this.state.canHold=true;this.gravityMs=0;this.lockMs=0;this.lockResets=0;if(!this.valid(this.state.active))this.endGame(); }
  private valid(piece: ActivePiece): boolean { return cells(piece).every(([x,y])=>x>=0&&x<WIDTH&&y<HEIGHT&&(y<0||!this.state.board[y][x])); }
  private grounded(): boolean { return !!this.state.active&&!this.valid({...this.state.active,y:this.state.active.y+1}); }
  move(dx:number): boolean { if(!this.state.started||this.state.gameOver||!this.state.active)return false;const p=this.state.active;if(!this.valid({...p,x:p.x+dx}))return false;p.x+=dx;this.resetLockIfGrounded();return true; }
  rotate(direction:1|-1=1): boolean { const p=this.state.active;if(!this.state.started||this.state.gameOver||!p)return false;const from=p.rotation,to=(from+direction+4)%4;if(p.kind==='O'){p.rotation=to;return true;}const key=`${from}>${to}`;const tests=(p.kind==='I'?I_KICKS:JLSTZ)[key];for(const [dx,dy] of tests){const candidate={...p,rotation:to,x:p.x+dx,y:p.y-dy};if(this.valid(candidate)){Object.assign(p,candidate);this.resetLockIfGrounded();return true;}}return false; }
  softDrop(): boolean { if(!this.state.active||this.state.gameOver)return false;if(this.valid({...this.state.active,y:this.state.active.y+1})){this.state.active.y++;this.state.score++;this.gravityMs=0;return true;}return false; }
  hardDrop(): number { const p=this.state.active;if(!p||this.state.gameOver)return 0;let distance=0;while(this.valid({...p,y:p.y+1})){p.y++;distance++;}this.state.score+=distance*2;this.lockPiece();return distance; }
  holdPiece(): void { const s=this.state,p=s.active;if(!s.started||s.gameOver||!p||!s.canHold)return;const outgoing=p.kind;if(s.hold){const incoming=s.hold;s.hold=outgoing;s.canHold=false;this.spawn(incoming);s.canHold=false;}else{s.hold=outgoing;s.canHold=false;this.spawn();s.canHold=false;} }
  tick(deltaMs:number): void { if(!this.state.started||this.state.gameOver||!this.state.active)return;const dt=Math.min(deltaMs,100);this.gravityMs+=dt;const interval=Math.max(50,1000*Math.pow(0.8,this.state.level-1));while(this.gravityMs>=interval){this.gravityMs-=interval;if(this.valid({...this.state.active,y:this.state.active.y+1}))this.state.active.y++;else break;}if(this.grounded()){this.lockMs+=dt;if(this.lockMs>=this.lockDelay)this.lockPiece();}else this.lockMs=0; }
  private resetLockIfGrounded(): void { if(this.grounded()&&this.lockResets<this.maxLockResets){this.lockMs=0;this.lockResets++;} }
  private lockPiece(): void { const p=this.state.active;if(!p)return;for(const [x,y] of cells(p)){if(y<0){this.endGame();return;}if(y>=0&&y<HEIGHT)this.state.board[y][x]=p.kind;}this.state.pieces++;this.clearLines();this.spawn(); }
  private clearLines(): void { const kept=this.state.board.filter(row=>row.some(cell=>!cell));const cleared=HEIGHT-kept.length;if(!cleared)return;while(kept.length<HEIGHT)kept.unshift(Array<Cell>(WIDTH).fill(null));this.state.board=kept;const points=[0,100,300,500,800][cleared]??1200;this.state.score+=points*this.state.level;this.state.lines+=cleared;this.state.level=Math.floor(this.state.lines/10)+1; }
  private endGame(): void { this.state.gameOver=true;this.state.active=null; }
}
