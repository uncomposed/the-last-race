import {readFileSync, writeFileSync} from 'node:fs';
let s = readFileSync('../scenarios/page-scen.html', 'utf8'); const n0 = s.length;
const rep = (a, b) => { if (!s.includes(a)) throw new Error('miss ' + a.slice(0, 40)); s = s.replace(a, b); };
rep('var K={p1:4,', 'var K={eDecay:0,eRun:0,eCapSplit:0,eSum:0,p1:4,');
rep('var w=capped(l)?[50,50,0]:inp.w,', 'var w=capped(l)?(K.eCapSplit?[100,0,0]:[50,50,0]):inp.w,');
rep('  if(Math.abs(l.v)<0.5){l.still+=dt;', `  /* economy lab: eRun = % of K.invest that running at full pace pays into max speed; eDecay = height lost per s at full pace (from 60% of top);
     eSum = height + max speed may not exceed eSum% of the ceiling (speed squeezes height) */
  if(!l.gx&&l.v>0&&!l.out){ var vf=clamp(l.v/top,0,1);
    if(K.eRun>0&&!capped(l)){ l.pts[2]=Math.min(l.cap,l.pts[2]+K.eRun/100*vf*K.invest*dt); }
    if(K.eDecay>0&&vf>0.6){ l.pts[1]=Math.max(0,l.pts[1]-K.eDecay*(vf-0.6)/0.4*dt); } }
  if(K.eSum>0){ l.pts[1]=Math.max(0,Math.min(l.pts[1],K.eSum/100*l.cap-l.pts[2])); }
  if(Math.abs(l.v)<0.5){l.still+=dt;`);
writeFileSync('page-econ.html', s); console.log('patched', s.length - n0);
