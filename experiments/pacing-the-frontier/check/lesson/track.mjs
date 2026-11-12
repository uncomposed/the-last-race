import {loadPF} from './lib.mjs';
const PF=loadPF();
for(const s of process.argv.slice(2).map(Number)){ PF.newGame(s,'custom',['steward']); const G=PF.G();
 const ev=[]; G.barriers.forEach(b=>ev.push({x:b.x,t:'B',v:Math.round(b.h??b.w??0),o:b})); G.gaps.forEach(g=>ev.push({x:g.x,t:g.sing?'SING':(g.inner?'in':'G'),v:Math.round(g.W),o:g}));
 ev.sort((a,b)=>a.x-b.x);
 console.log('SEED',s,'finish',Math.round(G.finish),'keys b:',Object.keys(G.barriers[0]||{}).join(','),'g:',Object.keys(G.gaps[0]||{}).join(','),'tower?',(G.towers||[]).length);
 console.log(ev.map(e=>`${Math.round(e.x)}${e.t}${e.v}`).join(' '));}
