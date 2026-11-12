import {THEMES,load,stat,pass} from './themes.mjs';
const R=load('all_rep.jsonl'),by=Object.fromEntries(R.map(r=>[r.seed,r]));
const G={114:[1823,329,2202],1167:[676,1973,183],1548:[661,2229,698],1115:[1531,2898,2624],199:[959,2785,822]};
for(const t in G){const T=THEMES[t];console.log('==',t,T.name,T.L,'foil set',T.F.join('/'),'rosters',T.R.join('/'));
 for(const s of G[t]){const x=stat(by[s],T);
  // 95% CI half-width for difference of two proportions (unpaired approx), n each
  const p1=x.pL/x.n,p2=x.pF/x.n,se=Math.sqrt(p1*(1-p1)/x.n+p2*(1-p2)/x.n);
  console.log(' ',s,'L',x.pL+'/'+x.n,'foil',x.fo,x.pF+'/'+x.n,'diff',(x.diff*100).toFixed(1)+'pp +-'+(1.96*se*100).toFixed(1),'rank',x.rank,'runner',x.runner,x.pR,'perTier L/foil of 100:',x.perTier.map(p=>p.join('v')).join(' '),'tierMean%',x.tierMean.map(v=>(v*100).toFixed(0)).join('/'),pass(x)?'PASS':'fail');}}
