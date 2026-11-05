/* STRIKE THEM OUT (draft v5, Claude 2026-11-05). Prototype for experiments; not part of the campaign.

   DESIGN. The dynamic: a lab ahead of you and at least as tall as you hides the road past it. The Gambler is low and never builds sight,
   so if you are in front of it and taller, it cannot see a hedge behind you; it runs on, passes you, sees the hedge too late, crashes and
   takes a strike. Three strikes and it is dissolved. The hidden fork, a coin per seed and never announced: the red box at the end is
   shallow (about 60 wide) or deep (about 105 wide). Its face is public, its width is not; you learn it only by getting close and tall enough
   to see across. Shallow, the Gambler's bet pays and it may simply race you. Deep, a Gambler that arrives alive bets on it, and a fall there
   rolls 75 in 100 to end the world for everyone. The rivals: the Gambler floors it, builds nothing while running, slows only for a hedge it
   can see and never for road it cannot see, bets blind at a box, and starts with one strike already (its pips show). Steady is the clock:
   it runs only as fast as it could stop within the road it sees, stops and builds for every hedge, never crashes and never falls. The
   lever is where you stand and when: be ahead of the Gambler, taller than it and within its sight as it comes to each hedge. That costs
   time. Steady catches up while you wait, and once Steady and you have the same hedge in view while in sight of each other the hedge is
   public and the trap is gone. The last hedge, 185 high, is public from the start: nobody can be trapped there, and a lab that never
   looks (max-out) runs into it. The stake: goal 3 (nobody ends the world) against goal 1 (finish first). Strike the Gambler out and you
   can still lose to Steady; race on and you can win the race and still lose the world. Dials (P below): hedges 110, 135 and 160 high at
   600, 1450 and 2300, the public hedge 185 at 2750 (each hedge moved up to 60 and raised or lowered up to 8 by seed); boxes at 950 and
   1850 that lift the ceiling; the red box 350 past the last hedge, rise 110, shallow 60 or deep 105 (plus or minus 8), fall odds 75,
   deep with chance 0.6; the Gambler starts 60 behind you with one strike; Steady 200 behind; soft ceiling with n 3 for every meter.

   STATUS (measured 2026-11-05, chill 0, bots at skill 100, bot outcomes not probabilities). Seeds 1-40 (tuned): skHerd wins 73%, world
   ends 3%, Gambler dissolved 63%; skMax wins 43%, world ends 25%, Gambler dissolved 25%; maxout wins 20% (dissolved itself 33%); cpRead
   wins 0%. Seeds 1001-1040 (held out): skHerd 75% / ends 5% / Gambler dissolved 63%; skMax 50% / ends 23% / 23%; maxout 13%; cpRead 0%.
   No timeouts. Races last 41 to 66 s, about 50 s on average. check.mjs claim score 22 (tuned) and 18 (held out), needs 10. */
function skLabs(P){ return [{x:0,pts:P.you,pace:1,w:[20,50,30]}].concat(P.rivals.map(function(r){ return RIV(r.post,r.name,r.x,r.pts,{pace:r.pace||1,w:r.w||[0,50,50],strikes:r.strikes||0}); })); }
function skMap(m){ Object.defineProperty(m,'labs',{get:function(){ return skLabs(this.P); },enumerable:true,configurable:true});
  Object.defineProperty(m,'soft',{get:function(){ return this.P.soft; },enumerable:true,configurable:true}); LESSONS.push(m); }
function skBar(x,h,pub){ var b=segBar(x,h); b.pub=!!pub; return b; }
function skBox(x,rise,W,odds,o){ o=o||{}; var g=cpBox(x,rise,W,odds,o.cap||70); if(o.shade){ g.shade=true; } if(o.pub){ g.pub=true; } if(o.capTo){ g.capTo=o.capTo; } return g; }

skMap({key:'strike-out',lesson:'Strike them out',title:'Strike Them Out',strategy:'skHerd',
  P:{you:[45,50,45],
     rivals:[{post:'skGamble',name:'Gambler',x:-60,pts:[70,35,55],strikes:1},{post:'skSteady',name:'Steady',x:-200,pts:[80,55,60],w:[30,40,30],pace:0.9}],
     items:[['bar',600,110],['box',950,20,55,5,90],['bar',1450,135],['box',1850,30,65,5,115],['bar',2300,160],['bar',2750,185,1]],
     jit:{x:60,h:8,rw:8},
     red:{d:350,rise:110,ok:60,bad:105,odds:75,pBad:0.6},
     after:250,soft:{n:3}},
  q:'A gambler is racing you to a box that can end the world.',
  meta:'You cannot always stop a reckless rival by beating it to the line. Sometimes the only lever is where you stand when it comes past.',
  look:'A lab no taller than the one in front of it sees nothing past it. The Gambler is low, never builds sight, and slows only for a hedge it can see. Stand in front of a hedge, taller than the Gambler, and it runs past you into it. Three strikes and it is out; its pips are by its name. When two labs in sight of each other see a hedge at the same time, the hedge becomes public and the trap is gone. The last hedge is public from the start. The red box at the end is public; its width is not.',
  track:function(r){ var P=this.P,J=P.jit||{x:0,h:0},gs=[],bars=[],x=0,j=function(a){ return Math.round((r()*2-1)*a); };
    P.items.forEach(function(it){ var g;
      if(it[0]==='bar'){ x=it[1]+j(J.x); bars.push(skBar(x,it[2]+j(J.h),it[3])); }
      else if(it[0]==='box'){ g=skBox(it[1]+j(J.x),it[2],it[3]+j(J.w||0),it[4],{capTo:it[5]}); gs.push(g); x=g.x+g.W; } });
    var bad=r()<P.red.pBad,W=(bad?P.red.bad:P.red.ok)+j(J.rw||0),g=skBox(x+P.red.d+j(J.x),P.red.rise,W,P.red.odds,{pub:true,capTo:145}); gs.push(g);
    return {bars:bars,gaps:gs,finish:g.x+g.W+P.after,note:bad?'The red box was deep ('+g.W+' wide).':'The red box was shallow ('+g.W+' wide).'}; },
  postures:['skHerd','skMax','cpRead','maxout'],
  claim:{text:'Herding the Gambler into hedges (skHerd) ends the world less often than racing with eyes (skMax), by at least 10 points',score:function(t){ return t.skMax.ext-t.skHerd.ext; },need:10}});

/* the Gambler: floors it and invests nothing. It slows only for a barrier it can see and cannot jump (then builds just enough height); it
   never slows for road it cannot see (a lab ahead, a tall box). At a box it cannot see across it bets and floors it. At a box it knows it
   cannot clear it takes a scrape, unless that would be its last strike; one it would fall into it stops and builds for. */
SGC.skGamble=function(l){ return skWall(l)||skBarStop(l,12)||sgInp(1,[0,0,100],{fwd:true}); };
SGP.skGamble=function(l,g,st){
  if(skBarAhead(l)){ return SGC.skGamble(l); }
  if(st.go){ return cpFloor(l,[0,0,100]); }
  if(!knowsWidth(l,l.gi)){ return cpFloor(l,[0,0,100]); }
  var W=gapWidth(l,g),T=Math.max(topSpeed(l),1),o=cpOut(T,heightOf(l),W,g.rise);
  if(o===0||(o===1&&l.strikes<K.strikes-1)){ st.go=true; return cpFloor(l,[0,0,100]); }
  return cpPlan(l,g,st,W);
};
NOPEEK.skGamble=1;

/* shared helpers. skWall: a wall at the next box this lab cannot jump; skBarStop: brake for a barrier it knows and cannot jump, and build
   height until it can (with a soft ceiling the knee is not a limit, so it keeps building past it) */
function skBarAhead(l){ var b=G.barriers[l.bi],g=G.gaps[l.gi]; return b&&b.x>l.x&&(!g||b.x<g.x)?b:null; }
function skBarStop(l,room){ var b=skBarAhead(l); if(b&&knowsBar(l,l.bi)&&heightOf(l)+C.JUMP<b.h+2){ return sgInp(cpPace(l,cpStopV(l,b.x,room||14)),[0,100,0]); } return null; }
function skWall(l){ var g=G.gaps[l.gi]; if(g&&towerOf(l,g)&&heightOf(l)+C.JUMP<g.stepH+2){ return sgInp(cpPace(l,cpStopV(l,stepX(g),10)),[0,100,0]); } return null; }
/* how far ahead this lab can see open road: its sight, cut short by a shadow */
function skClear(l){ var sh=shadows(l,1),a=sightRange(l),i; for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a+(sh[i].by.box?0:Math.max(sh[i].by.v,0)*Math.max(sh[i].by.v,0)/(2*decOf(sh[i].by)))); } return a; }

/* Steady, the second rival: careful. It runs at most at a speed it could stop from within the road it can see (a lab ahead cuts that
   short), builds while it runs, stops for any barrier it cannot jump and builds for it, and at a box it cannot read it stops at the face and
   builds until it can see the width and clear it (cpPlan: height to the knee, then speed, past the knee if need be). It never crashes into a
   hedge and never falls; it is the clock. */
SGC.skSteady=function(l){ var r=skWall(l)||skBarStop(l,14); if(r){ return r; }
  var T=Math.max(topSpeed(l),1),v=Math.sqrt(2*0.9*decOf(l)*Math.max(skClear(l)-25,0));
  return sgInp(Math.min(l.basePace||0.85,v/T),l.cpW||[30,40,30]); };
SGP.skSteady=function(l,g,st){ var b=skBarAhead(l),f; if(b){ return SGC.skSteady(l); } if(st.go){ return cpFloor(l,l.cpW||[30,40,30]); }
  if(knowsWidth(l,l.gi)){ return cpPlan(l,g,st,gapWidth(l,g)); } f=scFace(l,g,st); return f||sgInp(0,[0,100,0]); };
NOPEEK.skSteady=1;

/* skMax (bot for lab 0): max-out with eyes. Build height and speed while running at 70% until both reach the knee, then floor it. It looks:
   it brakes for a barrier it sees and cannot jump and builds for it, and at a box it reads the box (scLead: a box it can clear at speed it
   takes at speed; a box taller than it, it stops at, builds for, and crosses) */
SGC.skMax=function(l){ var r=skWall(l)||skBarStop(l,14); if(r){ return r; }
  var full=l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01; return full?cpFloor(l):sgInp(0.7,[0,50,50]); };
SGP.skMax=function(l,g,st){ var b=skBarAhead(l); if(b){ return SGC.skMax(l); } return SGP.scLead(l,g,st); };
NOPEEK.skMax=1;

/* skHerd (bot for lab 0): skMax, plus the ambush. At a hedge that is not public and that the Gambler cannot jump, with the Gambler alive
   and behind it, it stops just short of the hedge and stands there (building height) until the Gambler has crashed into it, passed it or
   stood still, or HZ.wait seconds pass; then it jumps it and goes. While the Gambler is alive and behind, it runs no faster than it could
   stop within the road it sees (skEyes), so it can always brake for a hedge. globalThis.HZ holds the knobs the solvability sweep turns
   (pace, hw build split, only: which hedges to ambush, wait, room); unset, the defaults below are the bot measured in STATUS. */
function skGam(){ for(var i=1;i<G.labs.length;i++){ if(G.labs[i].post==='skGamble'){ return G.labs[i]; } } return null; }
function skAmbush(l){ var b=skBarAhead(l),m=skGam(),Z=globalThis.HZ||{};
  if(!(b&&!b.pub&&knowsBar(l,l.bi)&&m&&!m.out&&m.x<l.x&&!m.crashedOn[l.bi]&&heightOf(m)+C.JUMP<b.h+2)){ return null; }
  if(Z.only&&Z.only.indexOf(l.bi)<0){ return null; }
  l.hz=l.hz||{}; var st=l.hz[l.bi]||(l.hz[l.bi]={t:0}); if(st.done){ return null; }
  var d=b.x-l.x; if(d>(Z.room||16)+2){ return sgInp(cpPace(l,cpStopV(l,b.x,Z.room||16)),[0,100,0]); }
  st.t+=1/60; if(st.t<(Z.wait||15)&&!(m.v<0.5&&m.still>2)){ return sgInp(0,heightOf(l)+C.JUMP<b.h+2?[0,100,0]:(Z.w||[0,60,40])); }
  st.done=true; return null; }
function skEyes(l){ var m=skGam(); if(!m||m.out||m.x>l.x){ return null; } var Z=globalThis.HZ||{},T=Math.max(topSpeed(l),1),v=Math.sqrt(2*0.9*decOf(l)*Math.max(skClear(l)-20,0));
  var full=l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01; return sgInp(Math.min(full?1:(Z.pace||0.7),v/T),Z.hw||[20,40,40]); }
SGC.skHerd=function(l){ return skAmbush(l)||skWall(l)||skBarStop(l,14)||skEyes(l)||SGC.skMax(l); };
SGP.skHerd=function(l,g,st){ var b=skBarAhead(l); if(b){ return SGC.skHerd(l); } return SGP.scLead(l,g,st); };
NOPEEK.skHerd=1;
