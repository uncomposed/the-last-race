import {THEMES,load,stat,pass} from './themes.mjs';
import {writeFileSync} from 'node:fs';
const R=load('all_scr.jsonl'); const used=new Set(Object.keys(THEMES).map(Number));
const targets=[114,1167,1548,1115,199,322]; const out={};
for(const t of targets){ const T=THEMES[t];
  const c=R.filter(r=>!used.has(r.seed)).map(r=>({seed:r.seed,s:stat(r,T)})).filter(x=>x.s.rateL>=0.15&&x.s.diff>=0.10)
    .sort((a,b)=>(b.s.diff-a.s.diff)).slice(0,25);
  out[t]=c.map(x=>x.seed);
  console.log(t,T.name,T.L,'screen passers(rule):',R.filter(r=>!used.has(r.seed)).filter(r=>pass(stat(r,T))).length,'top5:',c.slice(0,5).map(x=>`${x.seed}:${(x.s.diff*100).toFixed(0)}pp/rank${x.s.rank}/${(x.s.rateL*100).toFixed(0)}%`).join(' '));}
writeFileSync('shortlist.json',JSON.stringify(out));
