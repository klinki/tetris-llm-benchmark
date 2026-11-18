export const shapes: Record<string,string[]> = {I:['....','IIII','....','....'],J:['J..','JJJ','...'],L:['..L','LLL','...'],O:['OO','OO'],S:['.SS','SS.','...'],T:['.T.','TTT','...'],Z:['ZZ.','.ZZ','...']}
type Point=[number,number]
export function cells(kind:string,r=0):Point[]{
 const rows=shapes[kind], result:Point[]=[]
 rows.forEach((row,y)=>[...row].forEach((c,x)=>{
  if(c==='.')return
  let a=x,b=y
  for(let i=0;i<r;i++) [a,b]=[rows.length-1-b,a]
  result.push([a,b])
 }))
 return result
}
// SRS offsets use upward-positive coordinates.
const normal:Point[][]=[[[0,0],[0,0],[0,0],[0,0],[0,0]],[[0,0],[1,0],[1,-1],[0,2],[1,2]],[[0,0],[0,0],[0,0],[0,0],[0,0]],[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]]]
const line:Point[][]=[[[0,0],[-1,0],[2,0],[-1,0],[2,0]], [[-1,0],[0,0],[0,0],[0,1],[0,-2]], [[-1,1],[1,1],[-2,1],[1,0],[-2,0]], [[0,1],[0,1],[0,1],[0,-1],[0,2]]]
// Matrix rotation already includes the first offset's translation.
export class Game{
 board=Array.from({length:40},()=>Array<string>(10).fill(''))
 queue:string[]=[]; held=''; used=false; kind=''; x=3;y=18;r=0
 score=0; lines=0; over=false; fall=0; lock=0; resets=0; combo=-1; back=false; spin=0
 constructor(){this.spawn(this.next())}
 get level(){return 1+Math.floor(this.lines/10)}
 next(){
  if(this.queue.length<6){const bag=Object.keys(shapes)
   for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
   this.queue.push(...bag)}
  return this.queue.shift()!
 }
 spawn(k:string){this.kind=k;this.r=0;this.x=k==='O'?4:3;this.y=18;this.lock=this.resets=this.fall=this.spin=0
  this.over=!this.fits(this.x,this.y);if(!this.over&&this.fits(this.x,this.y+1))this.y++}
 fits(x:number,y:number,r=this.r){return cells(this.kind,r).every(([a,b])=>this.board[y+b]?.[x+a]==='')}
 get ghost(){let y=this.y;while(this.fits(this.x,y+1))y++;return y}
 adjust(){if(!this.fits(this.x,this.y+1)&&this.resets<15){this.resets++;this.lock=0}}
 move(dx:number){if(!this.over&&this.fits(this.x+dx,this.y)){this.adjust();this.x+=dx;this.spin=0}}
 rotate(d:number){if(this.over||this.kind==='O')return
  const n=(this.r+d+4)%4,table=this.kind==='I'?line:normal
  const offsets=(r:number,i:number,j:number)=>table[r][i][j]-table[r][0][j]
  for(let i=0;i<5;i++){const x=this.x+offsets(this.r,i,0)-offsets(n,i,0),y=this.y-offsets(this.r,i,1)+offsets(n,i,1)
   if(this.fits(x,y,n)){this.adjust();this.x=x;this.y=y;this.r=n;this.spin=i+1;return}}
 }
 hold(){if(this.over||this.used)return;const k=this.held;this.held=this.kind;this.used=true;this.spawn(k||this.next())}
 down(soft=false){if(!this.over&&this.fits(this.x,this.y+1)){this.y++;this.spin=0;if(soft)this.score++}}
 drop(){if(this.over)return;const distance=this.ghost-this.y;this.score+=2*distance;if(distance)this.spin=0;this.y+=distance;this.place()}
 place(){
  const corners=[[0,0],[2,0],[2,2],[0,2]].map(([a,b])=>this.board[this.y+b]?.[this.x+a]!=='')
  const twist=this.kind==='T'&&this.spin&&corners.filter(Boolean).length>=3
  const full=twist&&(this.spin===5||(corners[this.r]&&corners[(this.r+1)%4]))
  for(const [a,b] of cells(this.kind,this.r))this.board[this.y+b][this.x+a]=this.kind
  this.board=this.board.filter(row=>row.includes(''));const count=40-this.board.length
  while(this.board.length<40)this.board.unshift(Array(10).fill(''))
  const difficult=count===4||Boolean(twist&&count)
  const base=(full?[400,800,1200,1600]:twist?[100,200,400]:[0,100,300,500,800])[count]
  this.combo=count?this.combo+1:-1
  const perfect=count&&this.board.every(row=>row.every(v=>!v))
  this.score+=this.level*(base*(difficult&&this.back?1.5:1)+50*Math.max(0,this.combo)+(perfect?[0,800,1200,1800,this.back?3200:2000][count]:0))
  if(count)this.back=difficult
  this.lines+=count;this.used=false;this.spawn(this.next())
 }
 tick(ms:number){if(this.over)return
  const l=Math.min(15,this.level)-1,interval=1000*(0.8-l*0.007)**l
  this.fall+=ms
  while(this.fall>=interval){this.fall-=interval;this.down();if(!this.fits(this.x,this.y+1)){this.fall=0;break}}
  if(!this.fits(this.x,this.y+1)){this.lock+=ms;if(this.lock>=500)this.place()}
 }
}
