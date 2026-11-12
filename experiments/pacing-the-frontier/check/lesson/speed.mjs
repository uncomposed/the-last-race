import {loadPF,wins,STRATS,ROSTERS} from './lib.mjs';
const PF=loadPF(); const t=Date.now();
const nz=[...Array(20).keys()].map(i=>i+1);
for(const s of STRATS) console.log(s, wins(PF,s,114,ROSTERS.S,nz));
console.log('ms per run',(Date.now()-t)/160);
