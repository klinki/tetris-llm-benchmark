export const shapes = {
  I:['....','IIII','....','....'], J:['J..','JJJ','...'], L:['..L','LLL','...'],
  O:['OO','OO'], S:['.SS','SS.','...'], T:['.T.','TTT','...'], Z:['ZZ.','.ZZ','...']
};
export type Kind = keyof typeof shapes;
type Point = [number,number];
export function cells(kind:Kind,rotation=0):Point[] {
  const rows=shapes[kind], result:Point[]=[];
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='.') return;
    let a=x,b=y;
    for(let i=0;i<rotation;i++) [a,b]=[rows.length-1-b,a];
    result.push([a,b]);
  }));
  return result;
}
// SRS translation tests, in screen coordinates.
const normal:Point[][]=[
 [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
 [[0,0],[1,0],[1,-1],[0,2],[1,2]], [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]]
];
const straight:Point[][]=[
 [[0,0],[-2,0],[1,0],[-2,1],[1,-2]], [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
 [[0,0],[2,0],[-1,0],[2,-1],[-1,2]], [[0,0],[1,0],[-2,0],[1,2],[-2,-1]]
];
export class Game {
  grid:(Kind|null)[][]=Array.from({length:40},()=>Array(10).fill(null));
  queue:Kind[]=[]; kind!:Kind; held:Kind|null=null; used=false;
  x=3; y=18; rotation=0; score=0; lines=0; over=false;
  fall=0; lock=0; resets=0; spin=false; lastKick=0; combo=-1; chain=false;
  constructor(){this.spawn(this.next());}
  get level(){return 1+Math.floor(this.lines/10);}
  next(){
    while(this.queue.length<6){
      const bag=Object.keys(shapes) as Kind[];
      for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]];}
      this.queue.push(...bag);
    }
    return this.queue.shift()!;
  }
  occupied(x:number,y:number){return x<0||x>=10||y<0||y>=40||!!this.grid[y][x];}
  fits(x:number,y:number,r=this.rotation){return cells(this.kind,r).every(([a,b])=>!this.occupied(x+a,y+b));}
  spawn(k:Kind){
    this.kind=k; this.x=k==='O'?4:3; this.y=18; this.rotation=0;
    this.lock=this.fall=this.resets=0; this.spin=false;
    if(!this.fits(this.x,this.y)) this.over=true;
    else if(this.fits(this.x,19)) this.y=19;
  }
  resetLock(){if(!this.fits(this.x,this.y+1)&&this.resets<15){this.lock=0; this.resets++;}}
  move(dx:number){if(!this.over&&this.fits(this.x+dx,this.y)){this.resetLock(); this.x+=dx; this.spin=false;}}
  rotate(dir:number){
    if(this.over||this.kind==='O') return;
    const r=(this.rotation+dir+4)%4;
    const tests=(this.kind==='I'?straight:normal)[dir===1?this.rotation:r];
    for(const [i,[a,b]] of tests.entries()){
      const x=this.x+a*dir,y=this.y+b*dir;
      if(this.fits(x,y,r)){this.resetLock(); this.x=x; this.y=y; this.rotation=r; this.spin=true; this.lastKick=i; return;}
    }
  }
  hold(){
    if(this.over||this.used)return;
    const k=this.held??this.next(); this.held=this.kind; this.spawn(k); this.used=true;
  }
  ghost(){let y=this.y; while(this.fits(this.x,y+1)) y++; return y;}
  down(soft=false){if(!this.over&&this.fits(this.x,this.y+1)){this.y++; this.spin=false; if(soft)this.score++;}}
  drop(){if(this.over)return; const y=this.ghost(); if(y!==this.y)this.spin=false; this.score+=2*(y-this.y); this.y=y; this.place();}
  tick(ms:number){
    if(this.over)return;
    this.fall+=ms;
    const l=Math.min(15,this.level)-1, interval=1000*(0.8-l*0.007)**l;
    while(this.fall>=interval){this.down(); this.fall-=interval;}
    if(!this.fits(this.x,this.y+1)){this.lock+=ms; if(this.lock>=500)this.place();}
  }
  place(){
    const corners=[[0,0],[2,0],[2,2],[0,2]].map(([x,y])=>this.occupied(this.x+x,this.y+y));
    const twist=this.kind==='T'&&this.spin&&corners.filter(Boolean).length>=3;
    const mini=twist&&!(corners[this.rotation]&&corners[(this.rotation+1)%4])&&this.lastKick!==4;
    for(const [x,y] of cells(this.kind,this.rotation))this.grid[y+this.y][x+this.x]=this.kind;
    this.grid=this.grid.filter(row=>row.includes(null));
    const n=40-this.grid.length;
    while(this.grid.length<40)this.grid.unshift(Array(10).fill(null));
    const difficult=n>0&&(twist||n===4);
    const points=mini?[100,200,400]:twist?[400,800,1200,1600]:[0,100,300,500,800];
    this.combo=n?this.combo+1:-1;
    this.score+=this.level*(points[n]*(difficult&&this.chain?1.5:1)+50*Math.max(0,this.combo));
    if(n&&this.grid.every(row=>row.every(c=>!c)))this.score+=this.level*([0,800,1200,1800,this.chain?3200:2000][n]);
    if(n)this.chain=difficult;
    this.lines+=n; this.used=false; this.spawn(this.next());
  }
}
