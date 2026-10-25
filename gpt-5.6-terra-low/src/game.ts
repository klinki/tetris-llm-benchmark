export type Kind = 'I'|'O'|'T'|'S'|'Z'|'J'|'L';
export const COLORS: Record<Kind,string> = { I:'#22d3ee', O:'#facc15', T:'#c084fc', S:'#4ade80', Z:'#fb7185', J:'#60a5fa', L:'#fb923c' };
type Cell = [number, number]; export type Piece = { kind: Kind; rotation: number; x: number; y: number };
const SHAPES: Record<Kind, Cell[][]> = {
 I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
 O: [[[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]]],
 T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
 S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
 Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
 J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
 L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]]
};
const JLSTZ_KICKS: Cell[] = [[0,0],[-1,0],[1,0],[-1,-1],[1,-1],[0,-2]]; const I_KICKS: Cell[] = [[0,0],[-2,0],[1,0],[-2,-1],[1,2],[0,-2]];
export class TetrisGame {
 board: (Kind|null)[][] = Array.from({length:20},()=>Array<Kind|null>(10).fill(null)); queue: Kind[]=[]; bag: Kind[]=[]; current!: Piece; hold: Kind|null=null; canHold=true; score=0; lines=0; level=1; over=false; combo=-1;
 constructor(){ this.fillQueue(); this.spawn(); }
 private random(){ if(!this.bag.length) this.bag = this.shuffle(['I','O','T','S','Z','J','L']); return this.bag.pop()!; }
 private shuffle(a:Kind[]){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
 private fillQueue(){ while(this.queue.length<5) this.queue.push(this.random()); }
 cells(p=this.current){ return SHAPES[p.kind][p.rotation].map(([x,y])=>[p.x+x,p.y+y] as Cell); }
 valid(p:Piece){ return this.cells(p).every(([x,y]) => x>=0 && x<10 && y<20 && (y<0 || !this.board[y][x])); }
 spawn(kind?:Kind){ const next=kind ?? this.queue.shift()!; this.fillQueue(); this.current={kind:next,rotation:0,x:3,y:-1}; this.canHold=true; if(!this.valid(this.current)) this.over=true; }
 move(dx:number,dy:number){ if(this.over) return false; const p={...this.current,x:this.current.x+dx,y:this.current.y+dy}; if(!this.valid(p)) return false; this.current=p; return true; }
 rotate(dir:1|-1){ if(this.over || this.current.kind==='O') return false; const r=(this.current.rotation+dir+4)%4; const kicks=this.current.kind==='I'?I_KICKS:JLSTZ_KICKS; for(const [x,y] of kicks){const p={...this.current,rotation:r,x:this.current.x+x,y:this.current.y+y}; if(this.valid(p)){this.current=p;return true;}} return false; }
 softDrop(){ if(this.move(0,1)){this.score++;return true;} this.lock(); return false; }
 hardDrop(){ let n=0; while(this.move(0,1))n++; this.score+=n*2; this.lock(); return n; }
 holdPiece(){ if(this.over||!this.canHold)return; const swap=this.hold; this.hold=this.current.kind; this.canHold=false; if(swap){this.current={kind:swap,rotation:0,x:3,y:-1};if(!this.valid(this.current))this.over=true;}else this.spawn(); this.canHold=false; }
 lock(){ for(const [x,y] of this.cells()) if(y>=0) this.board[y][x]=this.current.kind; const cleared=this.clearLines(); const points=[0,100,300,500,800][cleared]*this.level; if(cleared){this.combo++;this.score+=points+Math.max(0,this.combo)*50*this.level;this.lines+=cleared;this.level=Math.floor(this.lines/10)+1;}else this.combo=-1; this.spawn(); }
 private clearLines(){ const before=this.board.length; this.board=this.board.filter(r=>r.some(c=>!c)); const n=before-this.board.length; while(this.board.length<20)this.board.unshift(Array<Kind|null>(10).fill(null)); return n; }
 ghost(){ const p={...this.current}; while(this.valid({...p,y:p.y+1}))p.y++; return p; }
 reset(){ Object.assign(this,new TetrisGame()); }
}
