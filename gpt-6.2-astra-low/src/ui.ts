import {Game,cells} from './game.js'
let game=new Game()
const el=(id:string)=>document.getElementById(id)!
const ctx=(id:string)=>(el(id) as HTMLCanvasElement).getContext('2d')!
const board=ctx('board'),hold=ctx('hold'),next=ctx('next')
const colors:Record<string,string>={I:'#51d6df',O:'#ffd55c',T:'#b78af6',S:'#7ada98',Z:'#f37780',J:'#6d9af9',L:'#ffa666'}
function block(c:CanvasRenderingContext2D,k:string,x:number,y:number,s:number,ghost=false){
 c.fillStyle=colors[k];c.strokeStyle=colors[k]
 if(ghost)c.strokeRect(x+2,y+2,s-4,s-4)
 else{c.fillRect(x+1,y+1,s-2,s-2);c.fillStyle='#ffffff40';c.fillRect(x+1,y+1,s-2,3)}
}
function preview(c:CanvasRenderingContext2D,k:string,i:number){
 const shape=cells(k),width=Math.max(...shape.map(p=>p[0]))+1
 const top=Math.min(...shape.map(p=>p[1]))
 for(const [x,y] of shape)block(c,k,(100-width*18)/2+x*18,i*60+10+(y-top)*18,18)
}
function render(){
 board.fillStyle='#0c1016';board.fillRect(0,0,300,600)
 game.board.slice(20).forEach((row,y)=>row.forEach((k,x)=>{
  board.strokeStyle='#18202a';board.strokeRect(x*30,y*30,30,30)
  if(k)block(board,k,x*30,y*30,30)
 }))
 if(!game.over){const ghost=game.ghost
 for(const [a,b] of cells(game.kind,game.r)){block(board,game.kind,(game.x+a)*30,(ghost+b-20)*30,30,true);block(board,game.kind,(game.x+a)*30,(game.y+b-20)*30,30)}}
 hold.clearRect(0,0,100,60);if(game.held)preview(hold,game.held,0)
 next.clearRect(0,0,100,300);game.queue.slice(0,5).forEach((k,i)=>preview(next,k,i))
 for(const key of ['score','lines','level'] as const)el(key).textContent=String(game[key])
 el('end').hidden=!game.over
}
const actions:Record<string,()=>void>={ArrowLeft:()=>game.move(-1),ArrowRight:()=>game.move(1),ArrowDown:()=>game.down(true),ArrowUp:()=>game.rotate(1),KeyX:()=>game.rotate(1),KeyZ:()=>game.rotate(-1),ControlLeft:()=>game.rotate(-1),Space:()=>game.drop(),KeyC:()=>game.hold(),KeyR:()=>{if(game.over)game=new Game()}}
onkeydown=e=>{if(actions[e.code]){e.preventDefault();if(!e.repeat||['ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))actions[e.code]();render()}}
let last=performance.now()
function frame(now:number){game.tick(Math.min(100,now-last));last=now;render();requestAnimationFrame(frame)}
requestAnimationFrame(frame)
