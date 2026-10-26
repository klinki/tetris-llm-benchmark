export type Kind = 'I'|'O'|'T'|'S'|'Z'|'J'|'L';
export type Piece = {kind:Kind; x:number; y:number; rotation:number};
export const WIDTH=10, HEIGHT=20;
const shapes: Record<Kind,number[][][]> = {
 I:[[[0,1],[1,1],[2,1],[3,1]],[[2,0],[2,1],[2,2],[2,3]],[[0,2],[1,2],[2,2],[3,2]],[[1,0],[1,1],[1,2],[1,3]]],
 O:Array(4).fill([[1,0],[2,0],[1,1],[2,1]]),
 T:[[[1,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[2,1],[1,2]],[[1,0],[0,1],[1,1],[1,2]]],
 S:[[[1,0],[2,0],[0,1],[1,1]],[[1,0],[1,1],[2,1],[2,2]],[[1,1],[2,1],[0,2],[1,2]],[[0,0],[0,1],[1,1],[1,2]]],
 Z:[[[0,0],[1,0],[1,1],[2,1]],[[2,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[1,2],[2,2]],[[1,0],[0,1],[1,1],[0,2]]],
 J:[[[0,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,2]],[[1,0],[1,1],[0,2],[1,2]]],
 L:[[[2,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[1,2],[2,2]],[[0,1],[1,1],[2,1],[0,2]],[[0,0],[1,0],[1,1],[1,2]]]
};
// SRS offsets, with positive y pointing down.
const normal:Record<string,number[][]>={'0>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'1>0':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],'1>2':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],'2>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'2>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'3>2':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'3>0':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'0>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]]};
const ikicks:Record<string,number[][]>={'0>1':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],'1>0':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],'1>2':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],'2>1':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],'2>3':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],'3>2':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],'3>0':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],'0>3':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]]};
export class Game {
 board:(Kind|null)[][]=[]; queue:Kind[]=[]; current!:Piece; held:Kind|null=null; canHold=true; over=false; score=0; lines=0; level=1; combo=-1; backToBack=false; lastRotation=false; lockElapsed=0; lockResets=0; gravityElapsed=0;
 constructor(private random:()=>number=Math.random){this.reset()}
 reset(){this.board=Array.from({length:HEIGHT},()=>Array(WIDTH).fill(null));this.queue=[];this.held=null;this.canHold=true;this.over=false;this.score=0;this.lines=0;this.level=1;this.combo=-1;this.backToBack=false;this.refill();this.spawn()}
 refill(){while(this.queue.length<7){const bag:Kind[]=['I','O','T','S','Z','J','L'];for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}this.queue.push(...bag)}}
 spawn(kind?:Kind){this.refill();this.current={kind:kind??this.queue.shift()!,x:3,y:0,rotation:0};this.refill();this.lockElapsed=0;this.lockResets=0;this.gravityElapsed=0;this.lastRotation=false;if(!this.valid(this.current))this.over=true}
 cells(p:Piece=this.current){return shapes[p.kind][p.rotation].map(([x,y])=>[x+p.x,y+p.y])}
 valid(p:Piece){return this.cells(p).every(([x,y])=>x>=0&&x<WIDTH&&y<HEIGHT&&(y<0||!this.board[y][x]))}
 grounded(){return !this.valid({...this.current,y:this.current.y+1})}
 move(dx:number,dy:number,soft=false){if(this.over)return false;const p={...this.current,x:this.current.x+dx,y:this.current.y+dy};if(!this.valid(p))return false;const wasGrounded=this.grounded();this.current=p;this.lastRotation=false;if(soft)this.score+=dy;if(dx&&wasGrounded)this.resetLock();return true}
 resetLock(){if(this.lockResets<15){this.lockElapsed=0;this.lockResets++}}
 rotate(direction:number){if(this.over)return false;const from=this.current.rotation,to=(from+direction+4)%4;const kicks=this.current.kind==='O'?[[0,0]]:(this.current.kind==='I'?ikicks:normal)[`${from}>${to}`];const wasGrounded=this.grounded();for(const [x,y] of kicks){const p={...this.current,rotation:to,x:this.current.x+x,y:this.current.y+y};if(this.valid(p)){this.current=p;this.lastRotation=true;if(wasGrounded)this.resetLock();return true}}return false}
 ghost(){let p={...this.current};while(this.valid({...p,y:p.y+1}))p.y++;return p}
 hardDrop(){if(this.over)return;const p=this.ghost();this.score+=(p.y-this.current.y)*2;this.current=p;this.lock()}
 hold(){if(this.over||!this.canHold)return;const old=this.held;this.held=this.current.kind;this.spawn(old??undefined);this.canHold=false}
 lock(){if(this.over)return;const p=this.current;let tspin=false;if(p.kind==='T'&&this.lastRotation){const cx=p.x+1,cy=p.y+1;let corners=0;for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=cx+dx,y=cy+dy;if(x<0||x>=WIDTH||y>=HEIGHT||(y>=0&&this.board[y][x]))corners++}tspin=corners>=3}
 for(const [x,y] of this.cells()){if(y<0){this.over=true;return}this.board[y][x]=p.kind}let cleared=0;this.board=this.board.filter(row=>{if(row.every(Boolean)){cleared++;return false}return true});while(this.board.length<HEIGHT)this.board.unshift(Array(WIDTH).fill(null));const difficult=cleared===4||(tspin&&cleared>0);let points=tspin?([400,800,1200,1600][cleared]||0):([0,100,300,500,800][cleared]||0);if(difficult&&this.backToBack)points*=1.5;if(cleared){this.combo++;points+=50*this.combo;this.backToBack=difficult}else this.combo=-1;this.score+=points*this.level;this.lines+=cleared;this.level=Math.floor(this.lines/10)+1;this.canHold=true;this.spawn()}
 tick(ms:number){if(this.over)return;const interval=Math.max(16,1000*Math.pow(0.8-(this.level-1)*0.007,this.level-1));this.gravityElapsed+=ms;while(this.gravityElapsed>=interval){this.gravityElapsed-=interval;if(!this.move(0,1))break}if(this.grounded()){this.lockElapsed+=ms;if(this.lockElapsed>=500)this.lock()}else this.lockElapsed=0}
}
