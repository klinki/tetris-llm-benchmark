export type Kind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Point = [number, number];
export type Piece = { kind: Kind; rotation: number; x: number; y: number };
export const WIDTH = 10, HEIGHT = 20;
const KINDS: Kind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
// Coordinates are in SRS's 4x4 (I/O) or 3x3 rotation boxes.
const SHAPES: Record<Kind, Point[][]> = {
 I: [[[0,1],[1,1],[2,1],[3,1]],[[2,0],[2,1],[2,2],[2,3]],[[0,2],[1,2],[2,2],[3,2]],[[1,0],[1,1],[1,2],[1,3]]],
 O: [[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]]],
 T: [[[1,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[2,1],[1,2]],[[1,0],[0,1],[1,1],[1,2]]],
 J: [[[0,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,2]],[[1,0],[1,1],[0,2],[1,2]]],
 L: [[[2,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[1,2],[2,2]],[[0,1],[1,1],[2,1],[0,2]],[[0,0],[1,0],[1,1],[1,2]]],
 S: [[[1,0],[2,0],[0,1],[1,1]],[[1,0],[1,1],[2,1],[2,2]],[[1,1],[2,1],[0,2],[1,2]],[[0,0],[0,1],[1,1],[1,2]]],
 Z: [[[0,0],[1,0],[1,1],[2,1]],[[2,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[1,2],[2,2]],[[1,0],[0,1],[1,1],[0,2]]]
};
// SRS kick offsets use positive y upwards; conversion happens during rotation.
const JLSTZ: Record<string, Point[]> = {
 '0>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1>0':[[0,0],[1,0],[1,-1],[0,2],[1,2]],
 '1>2':[[0,0],[1,0],[1,-1],[0,2],[1,2]], '2>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
 '2>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3>2':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
 '3>0':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const IKICKS: Record<string, Point[]> = {
 '0>1':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1>0':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
 '1>2':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2>1':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
 '2>3':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3>2':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
 '3>0':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0>3':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};
export function cells(p: Piece): Point[] { return SHAPES[p.kind][p.rotation].map(([x,y]) => [x+p.x,y+p.y]); }
export class Game {
 board: (Kind | null)[][] = [];
 queue: Kind[] = [];
 active!: Piece;
 hold: Kind | null = null;
 holdUsed = false;
 over = false;
 score = 0; lines = 0; level = 1;
 combo = -1; backToBack = false;
 lastRotation = false; lastKick = 0;
 gravityTime = 0; lockTime = 0; lockResets = 0;
 constructor(private random: () => number = Math.random) { this.restart(); }
 restart() {
  this.board = Array.from({length:HEIGHT}, () => Array<Kind|null>(WIDTH).fill(null));
  this.queue=[]; this.hold=null; this.holdUsed=false; this.over=false; this.score=0; this.lines=0; this.level=1; this.combo=-1; this.backToBack=false;
  this.fillQueue(); this.spawn();
 }
 private fillQueue() { while (this.queue.length < 7) { const bag = [...KINDS]; for (let i=bag.length-1;i>0;i--) { const j=Math.floor(this.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]]; } this.queue.push(...bag); } }
 private spawn(kind?: Kind) { this.fillQueue(); this.active={kind:kind ?? this.queue.shift()!,rotation:0,x:3,y:-1}; this.fillQueue(); this.gravityTime=0; this.lockTime=0; this.lockResets=0; this.lastRotation=false; this.lastKick=0; if (!this.valid(this.active)) this.over=true; }
 valid(p: Piece): boolean { return cells(p).every(([x,y]) => x>=0 && x<WIDTH && y<HEIGHT && (y<0 || !this.board[y][x])); }
 grounded(): boolean { return !this.valid({...this.active,y:this.active.y+1}); }
 private resetLock(wasGrounded: boolean) { if (wasGrounded && this.lockResets<15) {this.lockTime=0; this.lockResets++;} }
 move(dx: number): boolean { if(this.over) return false; const grounded=this.grounded(), p={...this.active,x:this.active.x+dx}; if(!this.valid(p)) return false; this.active=p; this.lastRotation=false; this.resetLock(grounded); return true; }
 rotate(direction: 1|-1): boolean { if(this.over) return false; const old=this.active.rotation, next=(old+direction+4)%4, grounded=this.grounded(); const kicks=this.active.kind==='O'?[[0,0] as Point]:(this.active.kind==='I'?IKICKS:JLSTZ)[`${old}>${next}`]; for(let i=0;i<kicks.length;i++){const [x,y]=kicks[i], p={...this.active,rotation:next,x:this.active.x+x,y:this.active.y-y}; if(this.valid(p)){this.active=p; this.lastRotation=true; this.lastKick=i; this.resetLock(grounded); return true;}} return false; }
 softDrop(): boolean { if(this.over) return false; const p={...this.active,y:this.active.y+1}; if(!this.valid(p)) return false; this.active=p; this.score++; this.lastRotation=false; return true; }
 ghost(): Piece { let p={...this.active}; while(this.valid({...p,y:p.y+1})) p.y++; return p; }
 hardDrop() { if(this.over) return; const p=this.ghost(); const distance=p.y-this.active.y; this.score+=distance*2; if(distance>0) this.lastRotation=false; this.active=p; this.lock(); }
 swapHold() { if(this.over || this.holdUsed) return; const current=this.active.kind, held=this.hold; this.hold=current; this.holdUsed=true; this.spawn(held ?? undefined); }
 private spin(): 'none'|'mini'|'full' { if(this.active.kind!=='T'||!this.lastRotation) return 'none'; const {x,y,rotation}=this.active; const occupied=(cx:number,cy:number)=>cx<0||cx>=WIDTH||cy>=HEIGHT||(cy>=0 && !!this.board[cy][cx]); const corners=[occupied(x,y),occupied(x+2,y),occupied(x+2,y+2),occupied(x,y+2)]; if(corners.filter(Boolean).length<3) return 'none'; const front=[[0,1],[1,2],[2,3],[3,0]][rotation]; return (corners[front[0]] && corners[front[1]]) || this.lastKick===4 ? 'full':'mini'; }
 lock() { if(this.over) return; const spin=this.spin(); const blocks=cells(this.active); if(blocks.some(([,y])=>y<0)){this.over=true;return;} for(const [x,y] of blocks) this.board[y][x]=this.active.kind;
  let cleared=0; this.board=this.board.filter(row=>{if(row.every(Boolean)){cleared++;return false;} return true;}); while(this.board.length<HEIGHT) this.board.unshift(Array<Kind|null>(WIDTH).fill(null));
  const difficult=cleared===4 || (spin!=='none' && cleared>0); let base=spin==='full' ? ([400,800,1200,1600][cleared] ?? 0) : spin==='mini' ? ([100,200,400][cleared] ?? 0) : ([0,100,300,500,800][cleared] ?? 0);
  if(difficult && this.backToBack) base=Math.floor(base*1.5); if(cleared>0){this.combo++; if(this.combo>0) base+=50*this.combo; this.backToBack=difficult;} else this.combo=-1;
  this.score+=base*this.level; this.lines+=cleared; this.level=Math.floor(this.lines/10)+1; this.holdUsed=false; this.spawn();
 }
 update(ms: number) { if(this.over) return; // Gravity follows the Guideline level curve, measured in milliseconds per cell.
  const interval=Math.max(1,1000*Math.pow(Math.max(0.01,0.8-(this.level-1)*0.007),this.level-1)); this.gravityTime+=Math.min(ms,1000);
  while(this.gravityTime>=interval && !this.grounded()){this.active.y++; this.gravityTime-=interval; this.lastRotation=false;}
  if(this.grounded()){this.gravityTime=0; this.lockTime+=ms; if(this.lockTime>=500) this.lock();} else this.lockTime=0;
 }
}
