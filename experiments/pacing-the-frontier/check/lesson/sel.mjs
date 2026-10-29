import {THEMES,load,stat,pass} from './themes.mjs';
import {readFileSync} from 'node:fs';
const R=load('all_sel.jsonl'),by=Object.fromEntries(R.map(r=>[r.seed,r])); const SL=JSON.parse(readFileSync('shortlist.json','utf8'));
for(const t of [114,1167,1548,1115,199]){ const T=THEMES[t];
  const rows=SL[t].map(s=>({seed:s,s:stat(by[s],T)})).sort((a,b)=>b.s.diff-a.s.diff);
  console.log('==',t,T.name,T.L,'passing in select block:',rows.filter(x=>pass(x.s)).length,'of',rows.length);
  rows.slice(0,6).forEach(x=>console.log(' ',x.seed,'L',x.s.pL+'/'+x.s.n,'foil',x.s.fo,x.s.pF,'diff',(x.s.diff*100).toFixed(0)+'pp rank',x.s.rank,'runner',x.s.runner,x.s.pR,'tierMean%',x.s.tierMean.map(v=>(v*100).toFixed(0)).join('/'),'tiers L/foil',x.s.perTier.map(p=>p.join('v')).join(' ')));
}
