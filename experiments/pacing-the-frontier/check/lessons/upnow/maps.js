/* UP TO NOW, a prequel to Two Endings: the AI race so far. Built with campaign+showcase+upnow (uses cpBox, cpWc, cpOut, cpRead, scMap, scBox).

   DESIGN. Dynamic: four labs race over eight boxes. Each box gives its first crosser a higher knee (capTo 75 up to 110); everyone else
   gets 90% of that rise (a hidden dial, as in Two Endings). Under the soft ceiling (n 3), a lab keeps building past its knee, but only while
   it runs below its own top speed, so the labs bunch up. Most boxes are small, three quarters of what a lab at the knee clears clean, so
   racing has paid. One to three per race are wider than they look: they sit just inside the scrape band, so whoever crosses first at
   speed scrapes and takes a strike, and the box then narrows for everyone behind. So leading leaks: the leader takes the scrapes and gives
   up building, while a lab tucked in behind keeps building and slingshots at the end.
   Hidden fork (by seed, about half the races, never announced): one of boxes 6 and 7 is deep in the fall band. On a calm seed, breaking
   away early wins. On a rough seed, whoever breaks early meets that box first, at full speed and too fast to stop, and scrapes to the floor
   or falls. Patient labs win those.
   Rival temperaments:
   - Sprinter: racing has paid, so it races. It floors into every box and eats the scrapes.
   - Follower: a fast follower. It sits 45 behind whoever is ahead, overtakes a lab that dawdles, and floors it 700 from the finish.
   - Careful: the incumbent. It starts ahead with sight and reads every box, so it is safe and slow.
   Lever: when you stop building and floor it, and whom you sit behind on the way.
   Stake: the win; a fall rolls 3% (normal box), 5% (wide box) or 10% (last box) to end the world.
   End: the last box is public and taller (rise 60), a small echo of the tower in Two Endings, with no tower and no cellar.
   Dials: share 90 (hidden, shown after the race), soft ceiling n 3, step gaps on, chill off.

   STATUS (bot play, chill 0, measured with check.mjs --only upnow and scratch run.mjs). Win share for "you":
     posture                  seeds 1-40 (tuned)   seeds 1001-1040 (held out)
     unDraft (draft)          58%                  63%
     unBuild (floor at 900)   45%                  43%
     unBuild (floor at 1800)  48%                  38%
     unSprint                 28%                  23%
     maxout                   23%                  28%
     unCare                   8%                   15%
     scLead                   3%                   5%
   No timeouts in either block.
   Fork, early break (floor at 1800): calm seeds 18 of 21 and 13 of 17; rough seeds 1 of 19 and 2 of 23. Max-out: calm 0 of 21 and 0 of 17;
   rough 9 of 19 and 11 of 23.
   Mean race 46 s; range 40.8 to 63.9 s. */
/* widths: what a lab at the knee c (height c, speed meter c), floored, clears clean, and the widest it does not fall into */
function unClean(c,rise){ return cpWc(c,C.TOP0+0.85*c,rise); }
function unFallW(c,rise){ var v=C.TOP0+0.85*c,w=1; while(w<600&&cpOut(v,c,w,rise)<2){ w++; } return w; }
function unBoxes(P,r){
  var gs=[],x=P.x0,i,g,k=P.n,inc={},nInc=P.inc.counts[Math.min(P.inc.counts.length-1,Math.floor(r()*P.inc.counts.length))],pool=[],j;
  for(i=P.inc.from;i<=P.inc.to;i++){ pool.push(i); }
  for(j=0;j<nInc&&pool.length;j++){ var pk=Math.floor(r()*pool.length); inc[pool[pk]]=true; pool.splice(pk,1); }
  var rough=P.rough&&r()<P.rough.p?P.rough.at[0]+Math.floor(r()*(P.rough.at[1]-P.rough.at[0]+1)):-1;  /* the hidden fork: one late box deep in the fall band */
  if(rough>=0){ inc[rough]=true; }
  for(i=0;i<k;i++){
    var knee=i===0?70:P.caps[i-1],rise=P.rise[0]+Math.round(r()*(P.rise[1]-P.rise[0])),last=i===k-1&&P.last,cl=unClean(knee,rise),W;
    if(last){ rise=P.last.rise; W=P.last.W; }
    else if(inc[i]){ W=cl+(i===rough?P.rough.f:P.inc.f)*(unFallW(knee,rise)-cl); }
    else { W=P.fn*cl; }
    g=scBox(x,rise,W,last?P.last.odds:(inc[i]?P.inc.odds:P.odds),{cap:knee}); g.capTo=P.caps[i]; g.inc=!!inc[i]; g.rough=i===rough;
    if(last){ g.pub=true; }
    gs.push(g); x=g.x+g.W+P.gap[0]+Math.round(r()*(P.gap[1]-P.gap[0]));
  }
  return {gs:gs,rough:rough,inc:Object.keys(inc).map(Number).sort(function(a,b){return a-b;})};
}
scMap({key:'up-to-now',lesson:'The race so far',title:'Up to Now',strategy:'scLead',
  P:{you:[40,45,50],
     rivals:[{post:'unSprint',name:'Sprinter',x:40,pts:[20,50,60]},{post:'unDraft',name:'Follower',x:-40,pts:[30,45,55]},{post:'unCare',name:'Careful',x:150,pts:[60,55,50]}],
     n:8,x0:450,gap:[420,600],rise:[36,44],caps:[75,80,85,90,95,100,105,110],
     fn:0.75,odds:3,inc:{counts:[1,2,2,3],from:1,to:6,f:0.15,odds:5},
     last:{rise:60,W:60,odds:10},
     draft:{D:45,R:260,pass:0.7,sling:700},sprint:{pace:0.75},
     after:300,soft:{n:3},
     rough:{p:0.5,f:0.7,at:[5,6]},go:900,build:0.9},
  q:'Everyone is racing. So far, racing has paid.',
  meta:'',look:'',
  rules:{share:90},dial:'hidden',
  track:function(r){ var P=this.P,b=unBoxes(P,r),gs=b.gs,e=gs[gs.length-1];
    return {bars:[],gaps:gs,finish:e.x+e.W+P.after,note:'Wider than they looked: box '+b.inc.map(function(i){return i+1;}).join(', ')+'.'+(b.rough>=0?' Box '+(b.rough+1)+' was the deep one: racing stopped paying there.':' No deep box: racing paid all the way.')+' '+cpSay(gs)}; },
  postures:['unDraft','unBuild','maxout','scLead','unSprint','unCare'],
  /* the guard rail as a claim: how many postures other than max-out win at least 20% and beat max-out */
  claim:{text:'more than one way to play wins a real share (20% or more), each ahead of max-out',
    score:function(t){ var m=t.maxout?t.maxout.win:0; return Object.keys(t).filter(function(p){ return p!=='maxout'&&t[p].win>=20&&t[p].win>m; }).length; },need:2}});

/* the nearest lab ahead of l within R */
function unAhead(l,R){ var a=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x||m.x-l.x>R){continue;} if(!a||m.x<a.x){a=m;} } return a; }
function unP(){ return (SEG&&SEG.P)||{}; }
/* the racer's cruise: run at pace p, building split w, while height or speed is under the knee; floor it once both are there */
function unRun(l,p,w){ var hl=l.pts[1]<l.cap-0.01,sl=l.pts[2]<l.cap-0.01; if(!hl&&!sl){ return cpFloor(l,w); }
  return sgInp(p,w[0]?w:[0,hl?w[1]||50:0,sl?w[2]||50:0]); }  /* a racer builds whichever of height and speed is under the knee */
function unFull(l){ return l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01; }
/* unSprint, the Sprinter: racing has paid, so it races. It builds height and speed while it runs, floors it once both are at the knee, and
   floors it into every box (from 150 out): it never brakes for one */
SGC.unSprint=function(l){ return unRun(l,(unP().sprint||{}).pace||0.75,[0,50,50]); };
SGP.unSprint=function(l,g,st){ return g.x-l.x<150?cpFloor(l):SGC.unSprint(l); };
NOPEEK.unSprint=1;
/* unDraft, the Follower: a racer that builds as the Sprinter does. Once at the knee, with a lab ahead within R, it sits D behind it: it runs
   below its own top speed there, so it keeps building past the knee (the soft ceiling), and faster for being behind. It trusts the lab ahead
   to cross first (the box narrows behind it) and follows it over. A lab ahead that dawdles (under pass x the Follower's top speed) it
   overtakes at once. sling from the finish it floors it: the slingshot */
function unDP(l){ var P=unP(); return (l.id===0&&P.draftYou)||P.draft||{D:45,R:260,pass:0.7,sling:700}; }
SGC.unDraft=function(l){
  var P=unDP(l),top=Math.max(topSpeed(l),1);
  if(G.finish-l.x<P.sling){ return cpFloor(l); }
  var a=unAhead(l,P.R);
  if(l.unPass!==undefined&&(!a||l.unPass!==a.id)){ l.unPass=undefined; }
  if(a&&(l.unPass===a.id||(a.v<P.pass*top&&a.x-l.x<140&&l.v>a.v))){ l.unPass=a.id; return cpFloor(l); }
  if(!unFull(l)||!a){ return unRun(l,0.7,[0,50,50]); }
  var v=a.v+0.8*(a.x-l.x-P.D); if(v>=top){ return cpFloor(l); }
  return sgInp(clamp(v/top,0,1),[0,30,70]);
};
SGP.unDraft=function(l,g,st){
  var P=unDP(l),a=unAhead(l,P.R);
  if(a&&a.gi<=l.gi&&a.x<g.x&&a.v>=P.pass*Math.max(topSpeed(l),1)&&G.finish-l.x>=P.sling){ var d=SGC.unDraft(l); return g.x-l.x<150?Object.assign(d,{pace:Math.max(d.pace,a.v/Math.max(topSpeed(l),1))}):d; }
  return g.x-l.x<150?cpFloor(l):SGC.unDraft(l);
};
NOPEEK.unDraft=1;
/* a wall at the next box this lab cannot jump (height + jump under the wall + 2): stop short of it and grow (as scFollow does) */
function unWall(l){ var g=G.gaps[l.gi]; if(g&&towerOf(l,g)&&heightOf(l)+C.JUMP<g.stepH+2){ return sgInp(cpPace(l,cpStopV(l,stepX(g),10)),[0,100,0]); } return null; }
/* unCare, the Careful lab: reads every box as cpRead does, with a sight-heavy build, and waits behind a wall it cannot jump */
SGC.unCare=function(l){ l.cpW=[40,30,30]; return unWall(l)||unRun(l,0.7,[40,30,30]); };
SGP.unCare=function(l,g,st){ l.cpW=[40,30,30]; return SGP.cpRead(l,g,st); };
NOPEEK.unCare=1;

/* ---- a strategy for "you" (bot checks only; unDraft also plays you, with P.draftYou if set) ---- */
/* unBuild: build as the racers do (pace 0.7 under the knee), keep building past the knee at pace P.build, and floor it from P.go before the
   finish (and within 150 of every box). P.go is the decision: 900 is the default bot, 1800 the early break */
SGC.unBuild=function(l){ var P=unP(); if(G.finish-l.x<(P.go||900)){ return cpFloor(l); } return unFull(l)?sgInp(P.build||0.9,[0,40,60]):unRun(l,0.7,[0,50,50]); };
SGP.unBuild=function(l,g,st){ return g.x-l.x<150?cpFloor(l):SGC.unBuild(l); };
NOPEEK.unBuild=1;

/* a box taller than this lab (rise above height - 4): stop short of it and grow height until it is 12 over (no bot jumps a box it cannot clear) */
function unTall(l,g){ if(!g||g.x<l.x){ return null; } var h=heightOf(l); if(g.rise>h-4||(l.unTallG===g&&h<g.rise+12)){ l.unTallG=g; return sgInp(cpPace(l,cpStopV(l,g.x,30)),[0,100,0]); } return null; }
/* on this map only, every bot posture waits behind a wall it cannot jump instead of crashing into it again and again, and stops short of a box
   taller than itself (unTall). Other maps on the same page are untouched (SEG.key check) */
['scLead','maxout','unDraft','unSprint','cpRead','unBuild','unCare'].forEach(function(p){ var c=SGC[p]; if(c){ SGC[p]=function(l){ return (SEG&&SEG.key==='up-to-now'&&unWall(l))||c(l); }; }
  var q=SGP[p]; if(q){ SGP[p]=function(l,g,st){ return (SEG&&SEG.key==='up-to-now'&&unTall(l,g))||q(l,g,st); }; } });
