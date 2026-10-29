import {THEMES,load,stat,pass} from './themes.mjs';
const R=load(process.argv[2]);
for(const r of R){ const T=THEMES[r.seed]; const s=stat(r,T);
 console.log(r.seed,T.name.padEnd(14),T.L.padEnd(8),'L',s.pL+'/'+s.n,(s.rateL*100).toFixed(0)+'%','foil',s.fo,s.pF+'/'+s.n,'diff',(s.diff*100).toFixed(0)+'pp','rank',s.rank,'runner',s.runner,s.pR,'tiers L/foil',s.perTier.map(x=>x.join('v')).join(' '),'tierMean%',s.tierMean.map(x=>(x*100).toFixed(0)).join('/'),pass(s)?'PASS':'fail');}
