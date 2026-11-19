export const types = ['I','J','L','O','S','T','Z'] as const;
export type Kind = typeof types[number];
export const colors: Record<Kind,string>={I:'#52dcf1',J:'#6285ff',L:'#ffac59',O:'#f4d969',S:'#6ee3ad',T:'#bb8aff',Z:'#ff6f91'};
const shapes:Record<Kind,number[][]>={I:[[0,1],[1,1],[2,1],[3,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]],O:[[1,0],[2,0],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],T:[[1,0],[0,1],[1,1],[2,1]],Z:[[0,0],[1,0],[1,1],[2,1]]};
type Piece={kind:Kind,x:number,y:number,r:number};
const normal:Record<string,number[][]>={'0>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'1>0':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'1>2':[[0,0],[1,0],[1,-1],[0,2],[1,2]],'2>1':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],'2>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],'3>2':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'3>0':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],'0>3':[[0,0],[1,0],[1,1],[0,-2],[1,-2]]};
const ik:Record<string,number[][]>={'0>1':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],'1>0':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],'1>2':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],'2>1':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],'2>3':[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],'3>2':[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],'3>0':[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],'0>3':[[0,0],[-1,0],[2,0],[-1,2],[2,-1]]};
export function cells(p:Piece):number[][] {return shapes[p.kind].map(([x,y])=>{for(let i=0;i<p.r && p.kind!=='O';i++) [x,y]=[(p.kind==='I'?3:2)-y,x];return [x+p.x,y+p.y];});}
export class Game{
 board:(Kind|null)[][]=Array.from({length:22},()=>Array(10).fill(null));
 queue:Kind[]=[]; active!:Piece; held:Kind|null=null; usedHold=false; over=false; score=0; lines=0; combo=-1; b2b=false; fall=0; lock=0; resets=0; rotated=false; kick=0;
 constructor(public random= Math.random){this.fill();this.spawn();}
 get level(){return 1+Math.floor(this.lines/10);}
 get gravity(){return Math.max(10,1000*Math.pow(Math.max(.01,.8-(this.level-1)*.007),this.level-1));}
 fill(){while(this.queue.length<7){const bag=[...types];for(let i=6;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}this.queue.push(...bag);}}
 spawn(kind?:Kind){this.fill();this.active={kind:kind??this.queue.shift()!,x:3,y:0,r:0};this.fill();this.fall=this.lock=this.resets=0;this.rotated=false;if(!this.valid(this.active))this.over=true;}
 valid(p:Piece){return cells(p).every(([x,y])=>x>=0&&x<10&&y>=0&&y<22&&!this.board[y][x]);}
 grounded(){return !this.valid({...this.active,y:this.active.y+1});}
 resetLock(was:boolean){if(was&&this.resets<15){this.lock=0;this.resets++;}}
 move(dx:number,dy=0){if(this.over)return false;const p={...this.active,x:this.active.x+dx,y:this.active.y+dy};if(!this.valid(p))return false;const was=this.grounded();this.active=p;this.rotated=false;if(dx)this.resetLock(was);return true;}
 rotate(dir:number){if(this.over)return;const r=(this.active.r+dir+4)%4;const kicks=(this.active.kind==='I'?ik:normal)[this.active.r+'>'+r];for(let i=0;i<kicks.length;i++){const [x,y]=kicks[i];const p={...this.active,r,x:this.active.x+x,y:this.active.y-y};if(this.valid(p)){const was=this.grounded();this.active=p;this.resetLock(was);this.rotated=true;this.kick=i;break;}}}
 ghost(){const p={...this.active};while(this.valid({...p,y:p.y+1}))p.y++;return p;}
 hold(){if(this.over||this.usedHold)return;const old=this.held;this.held=this.active.kind;this.spawn(old??undefined);this.usedHold=true;}
 hardDrop(){if(this.over)return;const p=this.ghost();this.score+=(p.y-this.active.y)*2;this.active=p;this.place();}
 tick(ms:number,soft=false){if(this.over)return;this.fall+=ms;const interval=soft?Math.min(50,this.gravity/20):this.gravity;while(this.fall>=interval){this.fall-=interval;if(!this.move(0,1))break;if(soft)this.score++;}if(this.grounded()){this.lock+=ms;if(this.lock>=500)this.place();}else this.lock=0;}
 place(){let spin=false,mini=false;const p=this.active;if(p.kind==='T'&&this.rotated){const occupied=(x:number,y:number)=>x<0||x>=10||y<0||y>=22||!!this.board[y][x];const corners=[[0,0],[2,0],[2,2],[0,2]].map(([x,y])=>occupied(p.x+x,p.y+y));spin=corners.filter(Boolean).length>=3;mini=spin&&!(corners[p.r]&&corners[(p.r+1)%4])&&this.kick!==4;}
 cells(p).forEach(([x,y])=>this.board[y][x]=p.kind);const count=this.board.filter(row=>row.every(Boolean)).length;this.board=this.board.filter(row=>!row.every(Boolean));while(this.board.length<22)this.board.unshift(Array(10).fill(null));
 let base=spin?(mini?[100,200,400][count]??1600:[400,800,1200,1600][count]):[0,100,300,500,800][count];const difficult=count>0&&(spin||count===4);if(difficult&&this.b2b)base*=1.5;if(count){this.combo++;this.score+=50*this.combo*this.level;this.b2b=difficult;}else this.combo=-1;this.score+=base*this.level;this.lines+=count;this.usedHold=false;this.spawn();}
}
