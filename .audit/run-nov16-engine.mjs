import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {reference,normalKicks,iKicks} from './opus55-efforts-audit.mjs';
import {createAdapter,runProbes} from './nov16-engine.mjs';
const projects={hy4:'hy4-flash-free-high',none:'hy4-flash-free-none',high:'qwen4-max-high',low:'qwen4-max-low',xhigh:'qwen4-max-xhigh'};
const oracle={reference,normalKicks,iKicks};
const destination=resolve('output/playwright/nov16');
writeFileSync(resolve(destination,'oracle.json'),JSON.stringify(oracle));
for(const [mode,name] of Object.entries(projects)){
  const load=file=>import(pathToFileURL(resolve(process.argv[2]??'/private/tmp/tetris-nov16-audit',name,'dist',file)));
  const m={game:await load('game.js')};
  if(mode==='none')m.constants=await load('constants.js');else m.pieces=await load('pieces.js');
  if(mode==='high'||mode==='low')m.srs=await load('srs.js');
  const result=runProbes(createAdapter(m,mode),oracle);
  writeFileSync(resolve(destination,name+'-engine.json'),JSON.stringify(result,null,2)+'\n');
  console.log(name,JSON.stringify({checks:result.checks.length,failures:result.checks.filter(c=>!c.pass),observations:result.observations}));
}
