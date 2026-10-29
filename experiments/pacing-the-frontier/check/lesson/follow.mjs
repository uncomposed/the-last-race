// node follow.mjs <seeds a-b|list> <nz0> <nzCount> <out>  ; strategies: follower (sight 5%), twin (same but sight 50%), rush, bold
import {loadPF,setProbe,rng,CFG,ROSTERS} from './lib.mjs';
import {writeFileSync} from 'node:fs';
export const FS={follower:{pace:0.5,w:[5,57,38],safe:true,pit:1,pitPub:1,bar:1},twin:{pace:0.5,w:[50,30,20],safe:true,pit:1,pitPub:1,bar:1},rush:CFG.strats.rush,bold:CFG.strats.bold};
const [spec,n0,nn,out,shipped]=[process.argv[2],+process.argv[3],+process.argv[4],process.argv[5],process.argv[6]];
const seeds=spec.includes('-')?(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i))(spec.split('-').map(Number)):spec.split(',').map(Number);
const PF=loadPF(); const L=[]; PF.SKILL.probe=100;PF.K.chill=0;PF.setPlayerStrikes(3);
const names=Object.keys(FS);
for(const s of seeds){const rec={seed:s,n:nn,w:{}}; for(const r of ['ALL','SG','SP']){rec.w[r]={};
  for(const [k,nm] of names.entries()){let w=0; for(let z=n0;z<n0+nn;z++){const g=rng((s*7919+z*104729+k)>>>0); setProbe(PF,FS[nm],g,0.05,5); globalThis.NZ=shipped?0:z; const x=PF.run(s,'probe',ROSTERS[r]); if(x.wid===0&&x.type==='win')w++;} rec.w[r][nm]=w;}}
  L.push(JSON.stringify(rec));}
if(out) writeFileSync(out,L.join('\n')+'\n');
