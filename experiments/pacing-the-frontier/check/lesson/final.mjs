import {THEMES,load,stat,pass} from './themes.mjs';
import {STRATS} from './lib.mjs';
const C=[...load('all_rep.jsonl'),...load('all_keepC.jsonl'),...load('all_keepC2.jsonl')]; const by=Object.fromEntries(C.map(r=>[r.seed,r]));
const ROS={S:'Steward',SG:'Steward+Gambler',SP:'Sprinter+Steward',ALL:'all three'};
const picks={114:1823,1784:1784,1167:676,717:717,2972:2972,1548:698,1115:1531,322:null,199:2785};
for(const [old,neu] of Object.entries(picks)){ if(!neu) continue; const T=THEMES[old]; const r=by[neu]; const x=stat(r,T);
  const p1=x.pL/x.n,p2=x.pF/x.n,se=Math.sqrt(p1*(1-p1)/x.n+p2*(1-p2)/x.n);
  // per-roster difficulty (mean of 8 probes) and L rate, all four rosters, report block C n=100
  const rows=['S','SG','SP','ALL'].map(k=>({k,mean:STRATS.reduce((a,p)=>a+r.w[k][p],0)/8,L:r.w[k][T.L],inSet:T.R.includes(k)}));
  const order=rows.filter(o=>o.inSet).sort((a,b)=>b.mean-a.mean);
  console.log(old,'->',neu,T.name,T.L,'| C: L',x.pL+'/'+x.n,'foil',x.fo,x.pF+'/'+x.n,'diff',(x.diff*100).toFixed(1)+'pp +-'+(1.96*se*100).toFixed(1),'rank',x.rank,'(runner',x.runner,x.pR+')','| ladder easiest->hardest:',order.map(o=>`${o.k} mean ${o.mean.toFixed(1)} (L ${o.L})`).join(' > '));
}
