import {one, PF, C, PLAYERS} from './scen.mjs';
const by={};
for (let s=0;s<120;s++) for (const p of PLAYERS){ const r=one(null,p,0,{seed0:s}); const G=PF.G();
  r.arr.forEach((a,i)=>{ if(!a||G.gaps[i].sing||G.gaps[i].inner) return; const g=G.gaps[i]; const b=(by[p]=by[p]||{n:0,h:0,v:0,hr:0,side:0,o:{}}); b.n++; b.h+=a.h/a.cap; b.v+=a.v; b.hr+=(a.h+34-g.rise)/a.cap; b.side+=a.side; b.o[r.bx[i]]=(b.o[r.bx[i]]||0)+1; }); }
for (const [p,b] of Object.entries(by)) console.log(p.padEnd(9), 'n',b.n,'h/cap',(b.h/b.n).toFixed(2),'v',(b.v/b.n).toFixed(0),'slack/cap',(b.hr/b.n).toFixed(2),'side',(b.side/b.n).toFixed(2), JSON.stringify(b.o));
