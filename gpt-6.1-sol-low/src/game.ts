export type Kind = 'I'|'O'|'T'|'S'|'Z'|'J'|'L';
export type Cell = Kind|null;
export type Point = [number,number];
export interface Piece {kind:Kind; rotation:number; x:number; y:number}
export const COLORS:Record<Kind,string> = {I:'#56dce8',O:'#f7ce58',T:'#b48af7',S:'#72d39a',Z:'#f17686',J:'#6c9cf5',L:'#f2ac66'};
const SHAPES:Record<Kind,Point[]> = {
 I:[[0,1],[1,1],[2,1],[3,1]],O:[[1,0],[2,0],[1,1],[2,1]],T:[[1,0],[0,1],[1,1],[2,1]],
 S:[[1,0],[2,0],[0,1],[1,1]],Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]]
};
// SRS offsets use screen coordinates (positive y is downward).
const NORMAL:Record<string,Point[]> = {
 '0>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'1>0':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
 '1>2':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],'2>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
 '2>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'3>2':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
 '3>0':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'0>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]]
};
const IKICKS:Record<string,Point[]> = {
 '0>1':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],'1>0':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
 '1>2':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],'2>1':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
 '2>3':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],'3>2':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
 '3>0':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],'0>3':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};
export function blocks(p:Piece):Point[] {
 return SHAPES[p.kind].map(([bx,by])=>{
   let x=bx,y=by; const center=p.kind==='I'?1.5:1;
   if(p.kind!=='O') for(let i=0;i<p.rotation;i++) [x,y]=[center-(y-center),center+(x-center)];
   return [x+p.x,y+p.y];
 });
}
export class Game {
 board:Cell[][]=[]; queue:Kind[]=[]; active!:Piece; held:Kind|null=null; canHold=true;
 score=0; lines=0; level=1; over=false; paused=false; combo=-1; backToBack=false;
 gravityTimer=0; lockTimer=0; lockResets=0; lastRotate=false; lastKick=0;
 constructor(private random:()=>number=Math.random){this.reset();}
 reset(){this.board=Array.from({length:22},()=>Array<Cell>(10).fill(null));this.queue=[];this.held=null;this.canHold=true;this.score=0;this.lines=0;this.level=1;this.over=false;this.paused=false;this.combo=-1;this.backToBack=false;this.spawn();}
 refill(){while(this.queue.length<7){const bag:Kind[]=['I','O','T','S','Z','J','L'];for(let i=6;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}this.queue.push(...bag);}}
 spawn(kind?:Kind){this.refill();this.active={kind:kind??this.queue.shift()!,rotation:0,x:3,y:0};this.refill();this.gravityTimer=0;this.lockTimer=0;this.lockResets=0;this.lastRotate=false;if(!this.valid(this.active))this.over=true;}
 valid(p:Piece){return blocks(p).every(([x,y])=>x>=0&&x<10&&y<22&&(y<0||!this.board[y][x]));}
 get grounded(){return !this.valid({...this.active,y:this.active.y+1});}
 get gravity(){return Math.max(16,1000*Math.pow(Math.max(.05,.8-(this.level-1)*.007),this.level-1));}
 resetLock(wasGrounded:boolean){if(wasGrounded&&this.lockResets<15){this.lockTimer=0;this.lockResets++;}}
 move(dx:number,dy=0){if(this.over||this.paused)return false;const p={...this.active,x:this.active.x+dx,y:this.active.y+dy};if(!this.valid(p))return false;const grounded=this.grounded;this.active=p;this.lastRotate=false;if(dx)this.resetLock(grounded);return true;}
 rotate(direction:1|-1){if(this.over||this.paused)return false;const from=this.active.rotation,to=(from+direction+4)%4;const grounded=this.grounded;const kicks=this.active.kind==='O'?[[0,0]]: (this.active.kind==='I'?IKICKS:NORMAL)[`${from}>${to}`];for(let i=0;i<kicks.length;i++){const [dx,dy]=kicks[i];const p={...this.active,rotation:to,x:this.active.x+dx,y:this.active.y+dy};if(this.valid(p)){this.active=p;this.lastRotate=true;this.lastKick=i;this.resetLock(grounded);return true;}}return false;}
 ghost(){let p={...this.active};while(this.valid({...p,y:p.y+1}))p.y++;return p;}
 softDrop(){if(this.move(0,1))this.score++;}
 hardDrop(){if(this.over||this.paused)return;const p=this.ghost();this.score+=2*(p.y-this.active.y);if(p.y!==this.active.y)this.lastRotate=false;this.active=p;this.lock();}
 hold(){if(!this.canHold||this.over||this.paused)return;const kind=this.active.kind;const previous=this.held;this.held=kind;this.spawn(previous??undefined);this.canHold=false;}
 lock(){
  const p=this.active;
  const occupied=(x:number,y:number)=>x<0||x>=10||y>=22||(y>=0&&!!this.board[y][x]);
  let spin=0;
  if(p.kind==='T'&&this.lastRotate){const x=p.x+1,y=p.y+1;const corners=[occupied(x-1,y-1),occupied(x+1,y-1),occupied(x+1,y+1),occupied(x-1,y+1)];if(corners.filter(Boolean).length>=3){const fronts=[[0,1],[1,2],[2,3],[3,0]][p.rotation];spin=(corners[fronts[0]]&&corners[fronts[1]])||this.lastKick===4?2:1;}}
  for(const [x,y] of blocks(p)){if(y<0){this.over=true;return;}this.board[y][x]=p.kind;}
  const remaining=this.board.filter(row=>row.some(c=>!c));const count=22-remaining.length;
  while(remaining.length<22)remaining.unshift(Array<Cell>(10).fill(null));this.board=remaining;
  const difficult=count>0&&(count===4||spin>0);
  let base=spin===2?[400,800,1200,1600][count]:spin===1?[100,200,400][count]:[0,100,300,500,800][count];
  if(difficult&&this.backToBack)base*=1.5;
  if(count){this.combo++;this.score+=50*this.combo*this.level;this.backToBack=difficult;}else this.combo=-1;
  this.score+=base*this.level;
  if(count&&this.board.every(row=>row.every(c=>!c)))this.score+=([0,800,1200,1800,2000][count])*this.level;
  this.lines+=count;this.level=Math.floor(this.lines/10)+1;this.canHold=true;this.spawn();
 }
 update(ms:number,soft=false){if(this.over||this.paused)return;ms=Math.min(ms,100);this.gravityTimer+=ms;const interval=soft?Math.min(this.gravity,50):this.gravity;while(this.gravityTimer>=interval){this.gravityTimer-=interval;if(!this.move(0,1))break;if(soft)this.score++;}if(this.grounded){this.lockTimer+=ms;if(this.lockTimer>=500)this.lock();}else this.lockTimer=0;}
}
