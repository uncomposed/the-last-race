import {one, PF, C} from './scen.mjs';
let rows=[];
for (let s=0;s<300;s++){ const r=one(null,'custom'==='x'?'':'rush',0,{seed0:s}); const G=PF.G(); G.gaps.forEach((g,i)=>{const cap=C.CAPS[g.inner?G.world.n:i]; rows.push({w:g.W,r:g.rise,cap,wr:g.W/cap,rr:g.rise/cap,sing:!!g.sing,inner:!!g.inner,nw:!!g.nowarn,o:r.bx[i]});}); }
const q=(a,f)=>{a=a.slice().sort((x,y)=>x-y);return f.map(p=>a[Math.floor(p*(a.length-1))].toFixed(2)).join(' ');};
const reg=rows.filter(r=>!r.sing&&!r.inner);
console.log('n',reg.length,'W/cap q10..90',q(reg.map(r=>r.wr),[.1,.25,.5,.75,.9]),' rise/cap',q(reg.map(r=>r.rr),[.1,.25,.5,.75,.9]));
console.log('W/rise',q(reg.map(r=>r.w/r.r),[.1,.25,.5,.75,.9,.99]));
const oc={};for(const r of reg){oc[r.o]=(oc[r.o]||0)+1;} console.log('rush outcomes on regular boxes',oc);
