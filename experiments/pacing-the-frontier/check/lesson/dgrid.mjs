import {loadPF,setProbe,rng,CFG,ROSTERS} from './lib.mjs';
import {writeFileSync} from 'node:fs';
const PF=loadPF(); const rs=['ALL','SG','SP'];
function rate(S,seeds,nz){let w=0,n=0; PF.SKILL.probe=100;PF.K.chill=0;PF.setPlayerStrikes(3);
 for(const s of seeds)for(const r of rs)for(const z of nz){const g=rng(s*31+z); setProbe(PF,S,g,0.05,5); globalThis.NZ=z; const x=PF.run(s,'probe',ROSTERS[r]); n++; if(x.wid===0&&x.type==='win')w++;} return w/n;}
const out=[];
for(const pace of [0.5,0.7,0.9]) for(const sight of [5,25,50]) for(const hs of [30,60]) for(const pit of [0.3,1]) for(const pitPub of [0,0.5,1]) for(const safe of [true,false]) for(const bar of [0.5,1]){
 const rest=100-sight; const w=[sight,rest*hs/100,rest*(100-hs)/100]; const S={pace,w,safe,pit,pitPub,bar};
 out.push({S,g:rate(S,[322],[1,2,3,4,5,6]),gen:0});}
out.sort((a,b)=>b.g-a.g); writeFileSync('dgrid322.json',JSON.stringify(out)); console.log(out.length); for(const o of out.slice(0,10)) console.log(JSON.stringify(o));
const ref=(n)=>rate(CFG.strats[n],[322],[1,2,3,4,5,6]); console.log('rush',ref('rush'),'bold',ref('bold'),'runup',ref('runup'),'drafter',ref('drafter'));
