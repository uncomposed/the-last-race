// Shipped rival noise (NZ=0, the game's own bot/roll draws for the seed), probe jitter varies over 100 draws; pooled over the 3 rosters of the theme
import {loadPF,setProbe,rng,CFG,STRATS,ROSTERS} from './lib.mjs';
import {THEMES} from './themes.mjs';
const PF=loadPF(); const picks=JSON.parse(process.argv[2]);
for(const [old,list] of Object.entries(picks)) for(const seed of list){ const T=THEMES[old]; const tot={};
  for(const p of STRATS){ let w=0; PF.SKILL.probe=100; PF.K.chill=0; PF.setPlayerStrikes(3); globalThis.NZ=0;
    for(const rk of T.R) for(let j=0;j<100;j++){ const r=rng((seed*7919+j*104729+STRATS.indexOf(p)+5000)>>>0); setProbe(PF,CFG.strats[p],r,CFG.jp,CFG.jw);
      const res=PF.run(seed,'probe',ROSTERS[rk]); if(res.wid===0&&res.type==='win')w++; } tot[p]=w; }
  const fo=T.F.reduce((a,b)=>tot[b]>tot[a]?b:a); const rank=1+STRATS.filter(p=>tot[p]>tot[T.L]).length;
  console.log(old,seed,T.L,tot[T.L]+'/300','foil',fo,tot[fo]+'/300','rank',rank,'top:',Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e.join(' ')).join(', ')); }
