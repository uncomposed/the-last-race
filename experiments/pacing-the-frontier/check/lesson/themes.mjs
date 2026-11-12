import {readFileSync} from 'node:fs';
import {STRATS} from './lib.mjs';
export const THEMES={
 114:{name:'Long Approach',L:'runup',F:['scout','balanced'],R:['S','SG','SP']},
 1784:{name:'The Long Climb',L:'climber',F:['balanced','rush','bold'],R:['S','SG','ALL']},
 1167:{name:'Coin Toss',L:'gamble',F:['scout','balanced','climber'],R:['S','SG','ALL']},
 717:{name:'Fog Line',L:'scout',F:['climber','balanced','bold','rush'],R:['S','ALL','SG']},
 2972:{name:'Even Keel',L:'balanced',F:['rush','climber','scout','drafter'],R:['SP','S','SG']},
 1548:{name:'Nerve',L:'bold',F:['balanced','scout','climber'],R:['S','SG','SP']},
 1115:{name:'Open Throttle',L:'rush',F:['balanced','scout','drafter'],R:['S','ALL','SP']},
 322:{name:'Slipstream',L:'drafter',F:['rush','bold'],R:['ALL','SG','SP']},
 199:{name:'Sheer Face',L:'climber',F:['balanced','rush','bold'],R:['ALL','S','SP']},
};
export const load=f=>readFileSync(f,'utf8').trim().split('\n').map(l=>JSON.parse(l));
export function stat(rec,T){
  const n=rec.n*T.R.length; const tot={};
  for(const p of STRATS) tot[p]=T.R.reduce((a,r)=>a+rec.w[r][p],0);
  const pL=tot[T.L]; let fo=T.F[0]; for(const f of T.F) if(tot[f]>tot[fo]) fo=f;
  const others=STRATS.filter(p=>p!==T.L).sort((a,b)=>tot[b]-tot[a]);
  const rank=1+STRATS.filter(p=>tot[p]>pL).length;
  const perTier=T.R.map(r=>[rec.w[r][T.L],rec.w[r][fo]]);
  const tierMean=T.R.map(r=>STRATS.reduce((a,p)=>a+rec.w[r][p],0)/8/rec.n);
  return {n,pL,fo,pF:tot[fo],diff:(pL-tot[fo])/n,rank,runner:others[0],pR:tot[others[0]],perTier,tierMean,rateL:pL/n};
}
export const pass=s=>s.diff>=0.15&&s.rank<=2&&s.rateL>=0.20;
