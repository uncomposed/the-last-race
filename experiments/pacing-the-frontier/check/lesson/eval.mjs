// node eval.mjs <seeds: a-b or a,b,c> <nzStart> <nzCount> <out.jsonl> [rosters comma list, default all 4]
import {loadPF,wins,STRATS,ROSTERS} from './lib.mjs';
import {writeFileSync} from 'node:fs';
const [spec,n0,nn,out,rs]=[process.argv[2],+process.argv[3],+process.argv[4],process.argv[5],process.argv[6]];
const seeds=spec.includes('-')?(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i))(spec.split('-').map(Number)):spec.split(',').map(Number);
const nz=Array.from({length:nn},(_,i)=>n0+i); const rl=(rs||'S,SG,SP,ALL').split(',');
const PF=loadPF(); const lines=[];
for(const s of seeds){ const rec={seed:s,n:nn,nz0:n0,w:{}};
  for(const r of rl){ rec.w[r]={}; for(const p of STRATS) rec.w[r][p]=wins(PF,p,s,ROSTERS[r],nz); }
  lines.push(JSON.stringify(rec)); }
writeFileSync(out,lines.join('\n')+'\n');
