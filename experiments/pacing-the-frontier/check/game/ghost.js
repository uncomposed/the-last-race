/* ---------- recorded runs: what a ghost is, shared by the page and check/game/ghost-check.mjs ----------
   A run is its seed, its map and every change to the player's controls, stamped with the identity of the simulation it was played on. A ghost is never a stored
   path: it is that run raced again, in this browser, before it is shown. If this build's simulation or maps differ, or the replay does not end the way the run did,
   the ghost refuses to load. Nothing here touches the page, so the same text runs under Node. api = {K,KSNAP,SEGS,segUse,newGame,step,G}. */
function ghNew(sim,map,seed,chill){ return {v:1,sim:sim,map:map,seed:seed,chill:chill?1:0,inp:[],n:0,end:null}; }
/* call once per simulation step, after the controls are set and before the step: [tick,pace,sight,height,speed,auto,rev,fwd,jump] on any change */
function ghTick(r,i){
  var e=[r.n,i.pace,i.w[0],i.w[1],i.w[2],i.auto?1:0,i.rev?1:0,i.fwd?1:0,i.jump?1:0],l=r.last,k,same=!!l;
  if(l){ for(k=1;k<9;k++){ if(l[k]!==e[k]){ same=false; break; } } }
  if(!same){ r.inp.push(e); } r.last=e.slice(); r.n++;
}
/* call after the step: the step clears a jump press, so a second press on the next tick must log as a change */
function ghAfter(r,i){ if(r.last){ r.last[8]=i.jump?1:0; } }
/* every number that says how a race went: one bit of difference anywhere in any lab changes it */
function ghPrint(G){
  var h=2166136261,b=new Float64Array(1),w=new Uint32Array(b.buffer);
  function n(v){ b[0]=+v||0; h=Math.imul(h^w[0],16777619); h=Math.imul(h^w[1],16777619); }
  n(G.t); n(G.ev.length);
  G.labs.forEach(function(l){ n(l.x); n(l.v); n(l.jy); n(l.strikes); n(l.out?1:0); n(l.dissolved?1:0); n(l.done?1:0); n(l.pts[0]); n(l.pts[1]); n(l.pts[2]); });
  return h>>>0;
}
function ghEnd(r,G){ var w=G.result||{},h=G.labs[0]; r.end={type:w.type||'none',won:w.type==='win'&&w.winner===h,t:Math.round(G.t*1000)/1000,print:ghPrint(G)}; delete r.last; return r; }
/* the reason a run may not load in this build, or '' */
function ghRefuse(r,sim,SEGS){
  if(!r||r.v!==1){ return 'unknown format'; }
  if(r.sim!==sim){ return 'recorded on a different build'; }
  if(!SEGS.some(function(m){ return m.key===r.map; })){ return 'map not in this build'; }
  if(typeof r.seed!=='number'||!Array.isArray(r.inp)||typeof r.n!=='number'||r.n<1||r.n>200000||!r.end){ return 'malformed'; }
  for(var i=0,p=-1;i<r.inp.length;i++){ var e=r.inp[i]; if(!Array.isArray(e)||e.length!==9||!(e[0]>p)||e[0]>=r.n){ return 'malformed'; } p=e[0]; }
  return '';
}
/* race the run again. onTick(G,tick) sees each step, for tracing. Leaves K as it found it, and a finished race in G: the caller starts its own after */
function ghReplay(api,r,onTick){
  var K=api.K,k,c=K.chill,I,i=0,n=0,e,G;
  for(k in api.KSNAP){ K[k]=api.KSNAP[k]; } K.chill=r.chill;
  api.segUse(api.SEGS.findIndex(function(m){ return m.key===r.map; })+1);
  api.newGame(r.seed); G=api.G(); I=G.input;
  while(!G.over&&n<r.n){
    if(i<r.inp.length&&r.inp[i][0]===n){ e=r.inp[i++]; I.pace=e[1]; I.w=[e[2],e[3],e[4]]; I.auto=!!e[5]; I.rev=!!e[6]; I.fwd=!!e[7]; I.jump=!!e[8]; K.chill=e[5]?1:0; }
    api.step(1/60); n++;
    if(onTick){ onTick(G,n); }
  }
  var out={over:G.over,n:n,type:(G.result||{}).type||'none',t:Math.round(G.t*1000)/1000,print:ghPrint(G)};
  K.chill=c; return out;
}
function ghSame(a,r){ return a.over&&a.n===r.n&&a.type===r.end.type&&a.t===r.end.t&&a.print===r.end.print; }
