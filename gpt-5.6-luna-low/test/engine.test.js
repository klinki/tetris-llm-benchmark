const {Game}=require('../dist/engine.js');
const g=new Game(()=>0.5); if(g.queue.length<6||!g.active)throw Error('spawn failed'); g.hardDrop(); if(g.score<0)throw Error('score failed'); g.holdPiece(); if(!g.hold)throw Error('hold failed'); console.log('engine smoke tests passed');
