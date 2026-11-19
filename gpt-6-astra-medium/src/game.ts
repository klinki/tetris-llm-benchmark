export const TYPES = ['I','J','L','O','S','T','Z'] as const;
export type Kind = typeof TYPES[number];
export const COLORS: Record<Kind,string> = {I:'#54dcf4',J:'#5685ff',L:'#ffac54',O:'#f6d65b',S:'#73df9b',T:'#b58aff',Z:'#fa718b'};
const SHAPES: Record<Kind,number[][]>={I:[[0,1],[1,1],[2,1],[3,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]],O:[[1,0],[2,0],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],T:[[1,0],[0,1],[1,1],[2,1]],Z:[[0,0],[1,0],[1,1],[2,1]]};
export interface Piece {kind:Kind;x:number;y:number;rotation:number}
export function cells(p:Piece):number[][] {return SHAPES[p.kind].map(([x,y])=>{if(p.kind!=='O')for(let i=0;i<p.rotation;i++){[x,y]=[(p.kind==='I'?3:2)-y,x];}return [x+p.x,y+p.y];});}
// SRS offsets use upward-positive Y; board coordinates use downward-positive Y.
const JL:Record<string,number[][]>={'01':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'10':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'12':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'21':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'23':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],'32':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'30':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'03':[[0,0],[1,0],[1,1],[0,-2],[1,-2]]};
const IK:Record<string,number[][]>={'01':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],'10':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],'12':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],'21':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],'23':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],'32':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],'30':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],'03':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]]};
export class Game {
 board:(Kind|null)[][]=Array.from({length:40},()=>Array(10).fill(null));
 queue:Kind[]=[]; active!:Piece; held:Kind|null=null; holdUsed=false; over=false; paused=false;
 score=0; lines=0; combo=-1; backToBack=false; gravityTime=0; lockTime=0; resets=0; lastRotation=false; lastKick=0; message='Ready to stack';
 constructor(private random:()=>number=Math.random){this.fill();this.spawn();}
 get level(){return Math.floor(this.lines/10)+1;}
 get interval(){return Math.max(1,1000*Math.pow(Math.max(.05,.8-(this.level-1)*.007),this.level-1));}
 fill(){while(this.queue.length<7){const bag=[...TYPES];for(let i=6;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}this.queue.push(...bag);}}
 fits(p:Piece){return cells(p).every(([x,y])=>x>=0&&x<10&&y>=0&&y<40&&!this.board[y][x]);}
 spawn(kind?:Kind){this.fill();this.active={kind:kind??this.queue.shift()!,x:3,y:18,rotation:0};this.fill();this.gravityTime=this.lockTime=this.resets=0;this.lastRotation=false;if(!this.fits(this.active))this.over=true;}
 get grounded(){return !this.fits({...this.active,y:this.active.y+1});}
 resetLock(wasGrounded:boolean){if(wasGrounded&&this.resets<15){this.lockTime=0;this.resets++;}}
 move(dx:number,dy=0){if(this.over||this.paused)return false;const p={...this.active,x:this.active.x+dx,y:this.active.y+dy};if(!this.fits(p))return false;const ground=this.grounded;this.active=p;this.lastRotation=false;if(dx)this.resetLock(ground);return true;}
 rotate(dir:number){if(this.over||this.paused)return false;const from=this.active.rotation,to=(from+dir+4)%4;const kicks=this.active.kind==='O'?[[0,0]]:(this.active.kind==='I'?IK:JL)[`${from}${to}`];for(let i=0;i<kicks.length;i++){const [x,y]=kicks[i],p={...this.active,rotation:to,x:this.active.x+x,y:this.active.y-y};if(this.fits(p)){const ground=this.grounded;this.active=p;this.resetLock(ground);this.lastRotation=true;this.lastKick=i;return true;}}return false;}
 ghost(){const p={...this.active};while(this.fits({...p,y:p.y+1}))p.y++;return p;}
 softDrop(){if(this.move(0,1))this.score++;}
 hardDrop(){if(this.over||this.paused)return;const p=this.ghost();this.score+=(p.y-this.active.y)*2;this.active=p;this.lock();}
 hold(){if(this.over||this.paused||this.holdUsed)return;const old=this.held;this.held=this.active.kind;this.spawn(old??undefined);this.holdUsed=true;}
 lock(){const p=this.active;let spin=false,mini=false;if(p.kind==='T'&&this.lastRotation){const occupied=(x:number,y:number)=>x<0||x>=10||y<0||y>=40||!!this.board[y][x];const corners=[[0,0],[2,0],[2,2],[0,2]].map(([x,y])=>occupied(p.x+x,p.y+y));spin=corners.filter(Boolean).length>=3;const fronts=[[0,1],[1,2],[2,3],[3,0]][p.rotation];mini=spin&&!(corners[fronts[0]]&&corners[fronts[1]])&&this.lastKick!==4;}
 for(const [x,y]of cells(p))this.board[y][x]=p.kind;
 const remaining=this.board.filter(row=>row.some(v=>v===null));const count=40-remaining.length;while(remaining.length<40)remaining.unshift(Array(10).fill(null));this.board=remaining;
 const difficult=count>0&&(count===4||spin);let points=spin?(mini?[100,200,400][count]??1600:[400,800,1200,1600][count]??1600):[0,100,300,500,800][count];if(difficult&&this.backToBack)points*=1.5;if(count){this.combo++;points+=50*this.combo;if(this.board.every(row=>row.every(v=>!v)))points+=[0,800,1200,1800,2000][count];this.backToBack=difficult;}else this.combo=-1;
 this.score+=points*this.level;this.lines+=count;this.message=spin?`${mini?'Mini ':''}T-spin${count?' + '+count:''}`:count?['','Single','Double','Triple','Tetris!'][count]:'Keep it flowing';this.holdUsed=false;this.spawn();}
 tick(ms:number,soft=false){if(this.over||this.paused)return;this.gravityTime+=ms;const interval=soft?Math.min(50,this.interval/20):this.interval;while(this.gravityTime>=interval){this.gravityTime-=interval;if(!this.move(0,1))break;if(soft)this.score++;}if(this.grounded){this.lockTime+=ms;if(this.lockTime>=500)this.lock();}else this.lockTime=0;}
}
