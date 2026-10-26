export type Kind = 'I'|'J'|'L'|'O'|'S'|'T'|'Z';
type Point = [number, number];
export type Piece = { kind: Kind; x: number; y: number; rotation: number };
export const KINDS: Kind[] = ['I','J','L','O','S','T','Z'];
const SPAWN: Record<Kind, Point[]> = {
 I:[[0,1],[1,1],[2,1],[3,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]],
 O:[[1,0],[2,0],[1,1],[2,1]], S:[[1,0],[2,0],[0,1],[1,1]], T:[[1,0],[0,1],[1,1],[2,1]], Z:[[0,0],[1,0],[1,1],[2,1]]
};
const JL: Record<string, Point[]> = {
 '0,1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '1,0':[[0,0],[1,0],[1,-1],[0,2],[1,2]],
 '1,2':[[0,0],[1,0],[1,-1],[0,2],[1,2]], '2,1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
 '2,3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]], '3,2':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
 '3,0':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '0,3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};
const IK: Record<string, Point[]> = {
 '0,1':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]], '1,0':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
 '1,2':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]], '2,1':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
 '2,3':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]], '3,2':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
 '3,0':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]], '0,3':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
};
export function cells(p: Piece): Point[] {
 return SPAWN[p.kind].map(([sx,sy]) => { let x=sx, y=sy; if (p.kind !== 'O') for(let i=0;i<p.rotation;i++){ const n=p.kind==='I'?3:2; [x,y]=[n-y,x]; } return [x+p.x,y+p.y]; });
}
export class Game {
 board: (Kind|null)[][] = Array.from({length:22},()=>Array(10).fill(null));
 queue: Kind[] = []; active!: Piece; hold: Kind|null = null; canHold=true; over=false; score=0; lines=0; level=1; combo=-1; backToBack=false; lastRotation=false; lastKick=0; message='';
 private random: () => number;
 constructor(random:()=>number=Math.random){ this.random=random; this.fillQueue(); this.spawn(); }
 private fillQueue(){ while(this.queue.length<7){ const bag=[...KINDS]; for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]];} this.queue.push(...bag); } }
 spawn(kind?:Kind){ this.fillQueue(); this.active={kind:kind || this.queue.shift()!,x:3,y:0,rotation:0}; this.fillQueue(); this.lastRotation=false; if(!this.fits(this.active)) this.over=true; }
 fits(p:Piece){ return cells(p).every(([x,y])=>x>=0&&x<10&&y<22&&(y<0||!this.board[y][x])); }
 move(dx:number,dy:number){ if(this.over)return false; const p={...this.active,x:this.active.x+dx,y:this.active.y+dy}; if(!this.fits(p))return false; this.active=p; if(dx) this.lastRotation=false; return true; }
 rotate(dir:number){ if(this.over)return false; const from=this.active.rotation, to=(from+dir+4)%4; const kicks=this.active.kind==='O'?[[0,0]]:(this.active.kind==='I'?IK:JL)[`${from},${to}`]; for(let i=0;i<kicks.length;i++){const [dx,dy]=kicks[i]; const p={...this.active,rotation:to,x:this.active.x+dx,y:this.active.y-dy}; if(this.fits(p)){this.active=p; this.lastRotation=true; this.lastKick=i; return true;}} return false; }
 ghost(){let p={...this.active}; while(this.fits({...p,y:p.y+1}))p.y++; return p;}
 softDrop(){if(this.move(0,1)){this.score++; return true;} return false;}
 hardDrop(){const p=this.ghost(); this.score+=(p.y-this.active.y)*2; this.active=p; this.lock();}
 swap(){if(!this.canHold||this.over)return; const old=this.hold; this.hold=this.active.kind; this.canHold=false; this.spawn(old || undefined);}
 lock(){if(this.over)return; const p=this.active; let spin: 'full'|'mini'|null=null;
  if(p.kind==='T'&&this.lastRotation){ const cx=p.x+1,cy=p.y+1; const occupied=(x:number,y:number)=>x<0||x>=10||y>=22||(y>=0&&!!this.board[y][x]); const corners=[[cx-1,cy-1],[cx+1,cy-1],[cx+1,cy+1],[cx-1,cy+1]]; const flags=corners.map(([x,y])=>occupied(x,y)); if(flags.filter(Boolean).length>=3){const front=[[0,1],[1,2],[2,3],[3,0]][p.rotation]; spin=(flags[front[0]]&&flags[front[1]])||this.lastKick===4?'full':'mini';} }
  const points=cells(p); for(const [x,y] of points) if(y>=0)this.board[y][x]=p.kind;
  if(points.every(([,y])=>y<2)){this.over=true;return;}
  let cleared=0; for(let y=21;y>=0;y--){if(this.board[y].every(Boolean)){this.board.splice(y,1);this.board.unshift(Array(10).fill(null));cleared++;y++;}}
  const difficult=cleared===4 || (!!spin&&cleared>0); let base=spin==='full'?([400,800,1200,1600][cleared]||0):spin==='mini'?([100,200,400][cleared]||0):([0,100,300,500,800][cleared]||0);
  if(difficult&&this.backToBack)base*=1.5; if(cleared){this.combo++; if(this.combo>0)base+=50*this.combo; this.backToBack=difficult;} else this.combo=-1;
  this.score+=base*this.level; this.lines+=cleared; this.level=Math.floor(this.lines/10)+1;
  this.message=spin?`T-SPIN${spin==='mini'?' MINI':''}${cleared?' · '+['','SINGLE','DOUBLE','TRIPLE'][cleared]:''}`:cleared?['','SINGLE','DOUBLE','TRIPLE','TETRIS'][cleared]:'';
  this.canHold=true; this.spawn();
 }
 gravity(){return Math.max(0.016,Math.pow(Math.max(0.01,0.8-(this.level-1)*0.007),this.level-1));}
}
