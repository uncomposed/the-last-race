import {readFileSync} from 'node:fs';
export const PAGE=new URL('../../prototype.html',import.meta.url);  /* the game page, two folders up */
// Loads the sim from the page (read-only) with a NOISE hook: globalThis.NZ changes the rival hand and roll streams, not the track.
export function loadPF(){
  const lines=readFileSync(PAGE,'utf8').split('\n');
  const a=lines.findIndex(l=>l.startsWith('function $(id)')),b=lines.findIndex(l=>l.startsWith('window.PF={'));
  let src=lines.slice(a,b+1).join('\n');
  const from='rb=rngMaker((seed^0x9E3779B9)>>>0),rr=rngMaker((seed^0x85EBCA6B)>>>0)';
  if(!src.includes(from)) throw new Error('hook point missing');
  src=src.replace(from,'rb=rngMaker((seed^0x9E3779B9^Math.imul(globalThis.NZ||0,0x27D4EB2F))>>>0),rr=rngMaker((seed^0x85EBCA6B^Math.imul(globalThis.NZ||0,0x165667B1))>>>0)');
  return new Function('window','document',src+'\nreturn window.PF;')({},null);
}
export const CFG=JSON.parse(readFileSync(new URL('./strats.json',import.meta.url),'utf8'));
export const STRATS=['runup','climber','gamble','scout','balanced','bold','rush','drafter'];
export const ROSTERS={S:['steward'],SG:['steward','gambler'],SP:['sprinter','steward'],ALL:['sprinter','steward','gambler']};
export function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function setProbe(PF,s,r,jp,jw){
  const pace=Math.min(1,Math.max(0.2,s.pace+(r()*2-1)*jp));
  let w=s.w.map(x=>Math.max(1,x+(r()*2-1)*jw)); const t=w.reduce((a,b)=>a+b,0); w=w.map(x=>x/t*100);
  PF.POL.probe={pace,jit:0,pit:s.pit??1,pitPub:s.pitPub??1,bar:s.bar??1,safe:s.safe??true,w};
  PF.KINDS.probe={name:'Probe',col:'a',w:[w[0]/100,w[1]/100,w[2]/100]};
}
// wins of strategy `name` on (seed, roster) over noise ids nz[] (each with its own probe jitter); chill off, Medium (3 strikes)
export function wins(PF,name,seed,roster,nz){
  PF.SKILL.probe=100; PF.K.chill=0; PF.setPlayerStrikes(3);
  const S=CFG.strats[name]; let w=0;
  for(const z of nz){
    const r=rng((seed*7919+z*104729+STRATS.indexOf(name))>>>0);
    setProbe(PF,S,r,CFG.jp,CFG.jw);
    globalThis.NZ=z;
    const res=PF.run(seed,'probe',roster);
    if(res.wid===0&&res.type==='win')w++;
  }
  globalThis.NZ=0; return w;
}
