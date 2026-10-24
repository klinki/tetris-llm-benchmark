export type PieceType = 'I'|'O'|'T'|'S'|'Z'|'J'|'L';
export type Cell = PieceType | null;
export interface ActivePiece { type: PieceType; rotation: number; x: number; y: number; }
export const WIDTH=10, HEIGHT=22, VISIBLE=20;
const shapes: Record<PieceType, number[][][]> = {
 I:[[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]],
 O:[[[1,1],[1,1]]], T:[[[0,1,0],[1,1,1],[0,0,0]],[[1,0],[1,1],[1,0]],[[0,0,0],[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]],
 J:[[[1,0,0],[1,1,1],[0,0,0]],[[1,1],[1,0],[1,0]],[[0,0,0],[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]],
 L:[[[0,0,1],[1,1,1],[0,0,0]],[[1,0],[1,0],[1,1]],[[0,0,0],[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]],
 S:[[[0,1,1],[1,1,0],[0,0,0]],[[1,0],[1,1],[0,1]]], Z:[[[1,1,0],[0,1,1],[0,0,0]],[[0,1],[1,1],[1,0]]]
};
const types: PieceType[]=['I','O','T','S','Z','J','L'];
const kicks = [[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0]];
export class Game {
 board: Cell[][] = []; active: ActivePiece | null=null; hold: PieceType|null=null; canHold=true; queue: PieceType[]=[]; score=0; lines=0; level=0; gameOver=false; paused=false; dropTimer=0; lockTimer=0;
 constructor(public random=Math.random){ this.reset(); }
 reset(){ this.board=Array.from({length:HEIGHT},()=>Array<Cell>(WIDTH).fill(null)); this.hold=null; this.queue=[]; this.score=0; this.lines=0; this.level=0; this.gameOver=false; this.paused=false; this.canHold=true; this.refill(); this.spawn(); }
 refill(){ while(this.queue.length<7){ const bag=[...types]; for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];} this.queue.push(...bag); } }
 cells(p: ActivePiece=this.active!){ return shapes[p.type][p.rotation % shapes[p.type].length].flatMap((row,y)=>row.flatMap((v,x)=>v?[[p.x+x,p.y+y]]:[])); }
 valid(p:ActivePiece){ return this.cells(p).every(([x,y])=>x>=0&&x<WIDTH&&y<HEIGHT&&(y<0||!this.board[y][x])); }
 spawn(type:PieceType=this.queue.shift()!){ this.refill(); this.active={type,rotation:0,x: type==='I'?3:4,y:0}; this.canHold=true; this.lockTimer=0; if(!this.valid(this.active)) this.gameOver=true; }
 move(dx:number,dy=0){ if(!this.active||this.gameOver||this.paused)return false; const p={...this.active,x:this.active.x+dx,y:this.active.y+dy}; if(this.valid(p)){this.active=p; this.lockTimer=0; return true;} return false; }
 rotate(dir:1|-1){ if(!this.active||this.gameOver||this.paused)return false; const n=shapes[this.active.type].length; const r=(this.active.rotation+dir+n)%n; for(const [dx,dy] of kicks){const p={...this.active,rotation:r,x:this.active.x+dx,y:this.active.y-dy};if(this.valid(p)){this.active=p;this.lockTimer=0;return true;}} return false; }
 hardDrop(){if(!this.active)return;let d=0;while(this.move(0,1))d++;this.score+=d*2;this.lock();}
 softDrop(){if(this.move(0,1))this.score++;else this.lock();}
 lock(){if(!this.active)return; for(const [x,y] of this.cells())if(y>=0)this.board[y][x]=this.active.type; const cleared=this.clearLines(); if(cleared){this.lines+=cleared;this.level=Math.floor(this.lines/10);this.score += [0,100,300,500,800][cleared]*(this.level+1);} this.active=null; this.spawn();}
 clearLines(){let n=0;this.board=this.board.filter(row=>{if(row.every(Boolean)){n++;return false;}return true;});while(this.board.length<HEIGHT)this.board.unshift(Array<Cell>(WIDTH).fill(null));return n;}
 holdPiece(){if(!this.active||!this.canHold||this.gameOver)return;const t=this.active.type;this.hold=this.hold?this.hold:t;this.canHold=false;this.active=null;this.spawn(this.hold!);}
 tick(ms:number){if(!this.active||this.gameOver||this.paused)return; const speed=Math.max(80,800-this.level*65);this.dropTimer+=ms;if(this.dropTimer>=speed){this.dropTimer=0;this.softDrop();}if(this.active&&!this.valid({...this.active,y:this.active.y+1})){this.lockTimer+=ms;if(this.lockTimer>=500)this.lock();}}
 ghost(){if(!this.active)return null;let p={...this.active};while(this.valid({...p,y:p.y+1}))p.y++;return p;}
}
export {shapes};
