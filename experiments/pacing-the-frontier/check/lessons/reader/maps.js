/* ---- READER: Cole's own winning strategy as a bot, and maps where it should not win. Research only: nothing here ships.
   [[ai gen]] Build: node build.mjs --only campaign+ship+reader (uses sh* helpers from ship/ and cp* from campaign/). Notes: reader/NOTES.md.

   coleFollow, rule by rule (Cole's words paraphrased, then how the code does it):
   1. Start at about 80% build, even split.         -> for the first 12 s, until a leader is a gap ahead, pace 0.2 (or less, never into a
                                                       leader's planted wall) with split [34,33,33].
   2. Follow the leader at about sight range         -> hold a gap of 8 lab lengths (8*18=144), never past sightRange-30, behind the nearest lab
      (roughly 8 lengths).                              ahead (shFollowV: the speed that holds that gap and can still stop if the leader stops
                                                       dead). The leader is the scout: while following, neither blind speed nor own sight caps
                                                       you. Inside sight a wall the leader clears spills 40% of the height difference to you.
   3. Spare effort: sight once height and speed      -> split: even until height and speed reach the knee of the soft ceiling, then sight
      flatten, then all to max speed; height for        [100,0,0] until sight reaches it, then [0,0,100]. A known wall too tall for your
      walls and boxes ahead.                            jump switches to [0,100,0] at the pace that buys it in time (shWallPace).
   4. Leader stops at a box: back off, build 100%    -> leader within 140 of the face and still: stand at sight range behind it with split
      height and speed, wait. Leader backs up for       [0,50,50]. Leader moving backwards: sprint (plan your own crossing at once).
      a run-up: sprint past.
   5. Clear every box by the minimum.               -> cross at the fastest speed that still leaves room to stop before the next obstacle
                                                       known past the box (or the leader's position, or the end of sight), and never below
                                                       the slowest clean speed from cpVNeed plus 8%. The sight cap never pulls it under that.
   6. In the lead: hold the gap, do not extend it;   -> no lab ahead: run as the eyes cruiser, never faster than you could stop in the road you
      sight is worth most here.                         see; no faster than the nearest lab behind once the lead passes 8 lengths; split puts
                                                       sight first ([60,20,20]) until it reaches the knee.
   7. Choose when to sprint for the lead.           -> sprint once every box left has been crossed and the road left is short enough to pass
                                                       the leader at top speed with margin 1.5; floored if every wall left is known, else
                                                       capped at sight speed. ---- */

function cfAhead(l){ return shTailAhead(l); }
function cfBehind(l){ var b=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x>=l.x){ continue; } if(!b||m.x>b.x){ b=m; } } return b; }
/* rule 2: Cole said "about sight range (roughly 8 lengths)". A lab is C.RW=18 long, so 8 lengths is 144, well inside any sight range (80+4.4*sight). Taken as 8 lengths, never past sight */
var CF={gap:8};
function cfGap(l){ return Math.min(CF.gap*C.RW,Math.max(60,sightRange(l)-30)); }
/* rule 6, used everywhere: never faster than you could stop from in the road you can see */
function cfSightV(l){ return Math.sqrt(2*0.9*decOf(l)*Math.max(sightRange(l)-30,0)); }
/* rule 3 and 6: where the spare effort goes */
function cfW(l,lead){ var k=l.cap-0.01;
  if(lead&&l.pts[0]<k){ return [60,20,20]; }
  if(l.pts[1]<k||l.pts[2]<k){ return l.pts[0]<k?[34,33,33]:[0,50,50]; }
  if(l.pts[0]<k){ return [100,0,0]; }
  return [0,0,100]; }
/* every wall left before the finish is known (seen, or public) */
function cfWallsKnown(l){ var i; for(i=l.bi;i<G.barriers.length;i++){ if(G.barriers[i].x>l.x&&!knowsBar(l,i)){ return false; } } return true; }
/* rule 7: is it time to go for the lead? */
function cfSprint(l,a){ var T=Math.max(topSpeed(l),1),left=G.finish-l.x,i;
  for(i=l.gi;i<G.gaps.length;i++){ if(G.gaps[i].x>l.x&&G.gaps[i].crossedBy<0){ return false; } }
  if(!cfWallsKnown(l)){ T=Math.min(T,cfSightV(l)); } var catchT=(a.x-l.x+30)/Math.max(T-Math.max(a.v,0),5);
  return left<=T*catchT*1.5+60; }
/* rule 5: "clear by the minimum, so he can still stop for what comes next": the fastest crossing that still leaves room to stop before the next
   obstacle it knows of past the box (or before the end of its sight), and never slower than the slowest clean jump +8% */
function cfAfterV(l,g){ var end=g.x+g.W,nx=Infinity,i,b,q; for(i=l.bi;i<G.barriers.length;i++){ b=G.barriers[i]; if(b.x>end&&knowsBar(l,i)&&heightOf(l)+C.JUMP<b.h+4){ nx=Math.min(nx,b.x); break; } }  /* a wall you can jump needs height, not a stop */
  q=G.gaps[l.gi+1]; if(q&&(q.pub||l.seenG[l.gi+1])){ nx=Math.min(nx,q.x); } if(nx===Infinity){ var a=cfAhead(l); nx=Math.max(l.x+sightRange(l),a?a.x:0); }  /* the leader is the scout: the road up to it has been crossed */
  return Math.sqrt(2*0.9*decOf(l)*Math.max(nx-end-20,0)); }
function cfBox(l,g,st,w){
  /* meet the face at the slowest clean speed: run in on the curve that brakes to it there */
  if(st.go){ return sgInp(cpPace(l,Math.min(cfAhead(l)?Infinity:Math.max(cpSightVb(l),st.tv),Math.sqrt(st.tv*st.tv+2*0.9*decOf(l)*Math.max(g.x-l.x-8,0)))),w); }
  if(!knowsWidth(l,l.gi)){ return shBox(l,g,st,w,false); }
  var T=cpTopAt(l,l.pts[2])*0.98,W=gapWidth(l,g),vn=cpVNeed(heightOf(l),W*1.05+2,g.rise,T);
  if(vn===Infinity){ return shPlan(l,g,st,W,[0,50,50]); }
  var tv=Math.max(vn*1.08,Math.min(T,cfAfterV(l,g),cfAhead(l)?Infinity:cfSightV(l))),d=g.x-l.x,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*accOf(l)*0.9*Math.max(d-8,0));
  if(reach>=tv||l.v>=tv){ st.go=true; st.tv=tv; return cfBox(l,g,st,w); }
  var r=shPlan(l,g,st,W,[0,50,50]); if(st.go){ st.tv=tv; return cfBox(l,g,st,w); } return r; }
function cpSightVb(l){ return Math.max(cfSightV(l),1); }

SGC.coleFollow=function(l){
  var a=cfAhead(l),T=Math.max(topSpeed(l),1),tw=shTower(l),wl=shWall(l),w=cfW(l,!a),vb=shBlindV(l);
  if(G.t<12&&(!a||a.x-l.x<cfGap(l))&&!wl&&!tw){ l.cfR='1start'; return sgInp(a?Math.min(0.2,clamp(shFollowV(l,a,cfGap(l))/T,0,1)):0.2,[34,33,33]); }  /* rule 1 */
  if(tw){ l.cfR='tower'; return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); }
  if(wl){ l.cfR='3wall'; return sgInp(Math.min(shWallPace(l,wl),vb/T),[0,100,0]); }
  if(a){
    if(cfSprint(l,a)){ l.cfR='7sprint'; var cap=cfWallsKnown(l)?T:Math.min(T,cfSightV(l)); return sgInp(clamp(cap/T,0,1),w,{fwd:cap>=T}); }
    l.cfR='2follow';
    return sgInp(clamp(shFollowV(l,a,cfGap(l))/T,0,1),w);  /* following: the leader is the scout, so neither blind speed nor own sight caps it */
  }
  var c=shCruise(l,w,'eyes'),b=cfBehind(l);
  l.cfR='6lead'; if(!c){ return c; } var p=Math.min(c.pace,cfSightV(l)/T); if(b&&l.x-b.x>cfGap(l)){ l.cfR='6hold'; p=Math.min(p,Math.max(b.v,0.3*T)/T); }  /* rule 6 */
  return sgInp(p,c.w,{fwd:!!c.fwd&&p>=c.pace}); };
SGP.coleFollow=function(l,g,st){
  var a=cfAhead(l),w=cfW(l,!a),gap=cfGap(l);
  if(st.go){ l.cfR='5go'; return cfBox(l,g,st,w); }
  if(a&&a.gi===l.gi&&g.crossedBy<0&&!st.sprint){
    if(a.v<-1&&a.x<g.x){ st.sprint=true; l.cfR='4pass'; }  /* rule 4: the leader backs up for a run-up */
    else if(g.x-a.x<140&&Math.abs(a.v)<3){ l.cfR='4wait'; return sgInp(cpPace(l,Math.min(cpStopV(l,a.x-gap,5),shFollowV(l,a,gap))),[0,50,50]); }
    else { l.cfR='2followBox'; return sgInp(cpPace(l,Math.min(cpStopV(l,g.x,10),shFollowV(l,a,gap))),w); }
  }
  if(!st.go){ l.cfR='5box'; }
  return cfBox(l,g,st,w); };
NOPEEK.coleFollow=1;

/* ---- READER MAPS: where following should lose. Layout only (no new sim rules). act 9 keeps them out of the campaign: SHIP_ORDER is built from
   SHIP, and these never join SHIP. Each P holds the layout numbers so a test can move them without a rebuild. */
function rdMap(m){ Object.defineProperty(m,'labs',{get:function(){ return shLabs(this.P); },enumerable:true,configurable:true});
  m.soft=m.soft||{n:3}; m.look=m.look||''; m.meta=m.meta||''; m.claim=m.claim||{text:'',score:function(){ return 0; },need:0}; LESSONS.push(m); }

/* FENCE BEHIND (Cole's idea): Trailbreaker's road, where a tall Pioneer goes first over wide boxes, but each box has a wall a short strip past
   its far edge. Crossing a box fast is no longer free: you land with no room to stop, so you need the wall's height as well as the box's.
   A lab a gap behind a taller leader cannot see past it (the leader's shadow), so it learns of the wall late. */
rdMap({key:'fence-behind',act:9,slot:1,lesson:'',title:'Fence Behind',strategy:'coleFollow',
  P:{you:[10,30,45],rivals:[{post:'rvRead',name:'Pioneer',x:150,pts:[50,75,70],w:[25,50,25]}],n:4,gap:[420,560],W:[106,120],rise:12,odds:40,
     strip:[50,70],wall:[100,115,130,145],after:520},
  q:'The boxes are enormous, and something stands just behind each one.',
  track:function(r){ var P=this.P,it=[],i; for(i=0;i<P.n;i++){ it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:P.rise,W:P.W[0]+r()*(P.W[1]-P.W[0]),odds:P.odds,capTo:80+i*15});
      it.push({d:P.strip[0]+r()*(P.strip[1]-P.strip[0]),bar:P.wall[i]}); }
    return shRoad(it,P.after,''); }});

/* WINNER KEEPS: the follower share is at its floor (20% of a level-up, normally 40%), each box raises the ceiling a lot, and the boxes are
   narrow enough that a fast leader never has to stop. Being first compounds; there is no stop for a follower to exploit. */
rdMap({key:'winner-keeps',act:9,slot:2,lesson:'',title:'Winner Keeps',strategy:'coleFollow',rules:{share:20},dial:'hidden',
  P:{you:[20,40,50],rivals:[{post:'sp-hs-eyes',name:'Racer',x:60,pts:[30,45,60],w:[0,50,50]}],n:5,gap:[300,380],W:[40,55],rise:20,odds:20,step:30,after:400},
  q:'One lab is already moving. Nobody shares much here.',
  track:function(r){ var P=this.P,it=[],i; for(i=0;i<P.n;i++){ it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:P.rise+i*12,W:P.W[0]+r()*(P.W[1]-P.W[0]),odds:P.odds,capTo:70+(i+1)*P.step}); }
    return shRoad(it,P.after,''); }});
