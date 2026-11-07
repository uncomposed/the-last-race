/* SHOWCASE (2026-11-05, Claude, after Cole asked for one interesting map that teaches an interesting strategy, and "what would be the
   AI 2027 map?"). Draft: layout numbers live in P so a sweep can move them without a rebuild. Uses cpBox/cpFull/cpRead from campaign/.

   TWO ENDINGS. The race of the AI 2027 scenario, as a course:
     1. Agents stumble: two low boxes that pay to be taken at speed. First across raises its ceiling; the follower gets most of that raise
        (a fast follower: the weights leak).
     2. The compute fence: two barriers, the second taller than anyone can clear at the starting ceiling. Height must be paid for again
        after the ceiling rises. A crash is a strike.
     3. The explosion: a double box, the second right behind the first, no room to stop between them.
     4. The tower: a box taller than any eye at the knee of the soft ceiling (shade: it hides everything behind it). Behind it, a short strip and the
        cellar. In half the worlds the cellar is low and narrow (alignment held). In the other half it is a tall, wide red box with high
        fall odds (it did not). A lab that comes over the tower fast is still in the air, or cannot stop, when the cellar arrives.
   The choice at the tower is the scenario's choice: race over it blind, or stop at its face (which puts up your wall and holds the
   follower), hop to peek over, and cross slowly enough to stop on the strip and look.
   SOFT CEILING (Cole, 2026-11-05): this map sets P.soft, so no meter has a hard ceiling. Up to the ceiling it grows as before; past it at
   (ceiling/value)^n of the rate (n 3), ever slower but never stopping. So a lab that stands longer is taller, and its wall grows with it.
   The tower (160) is taller than an eye at the knee (115+18) but not at any height: grow to 143 and you see over it standing.
   STATUS (bots, seeds 1001-1040; only the cellar and the fall rolls vary between seeds): scLead 60% (held 100%, broken 0%), build 40% (held 0%,
   broken 100%), cpRead 0%, maxout 0% (falls at the tower: 70 wide, a side entry sinks), rush 0%. build wins every broken world because its
   wall at the tower grows while it stands and holds the follower. scLead loses broken worlds: it crosses the tower about 3 s before the
   follower and is still braking on the strip when the follower comes over and scrapes through the cellar. Its broken-world path is still
   buggy (moving the follower or the strip gives erratic results). Cole has played this map; the retuned version is in ship/maps.js. */
function scLabs(P){ return [{x:0,pts:P.you,pace:1,w:[20,50,30]}].concat(P.rivals.map(function(r){ return RIV(r.post,r.name,r.x,r.pts,{pace:r.pace||1,w:r.w||[0,50,50]}); })); }
function scMap(m){ Object.defineProperty(m,'labs',{get:function(){ return scLabs(this.P); },enumerable:true,configurable:true});
  Object.defineProperty(m,'soft',{get:function(){ return this.P.soft; },enumerable:true,configurable:true}); LESSONS.push(m); }
/* the fence is public: a wall that tall is seen from far off, so every lab knows the height it must buy */
function scBar(x,h){ var b=segBar(x,h); b.pub=true; return b; }
function scBox(x,rise,W,odds,o){ var g=cpBox(x,rise,W,odds,(o&&o.cap)||70); if(o&&o.shade){ g.shade=true; } return g; }

scMap({key:'two-endings',lesson:'The race you are in',title:'Two Endings',strategy:'cpRead',
  P:{you:[40,45,50],
     rivals:[{post:'scFollow',name:'Follower',x:-250,pts:[30,45,60]}],
     a:{x:450,rise:30,n:2,gap:380,f:0.55,odds:5,caps:[85,95]},
     fence:{d:260,h1:100,gap:240,h2:114},
     ex:{d:420,rise:70,f1:0.85,strip:70,f2:0.7,odds:10,caps:[105,115]},
     tower:{d:520,rise:160,W:70,odds:5,capTo:150},
     strip:260,
     cellar:{ok:{rise:40,W:60,odds:5},bad:{rise:200,W:100,odds:60},pBad:0.5},
     after:320,soft:{n:3}},
  q:'You lead. Somewhere ahead is a box nobody can see past.',
  meta:'',
  look:'',
  rules:{share:90},dial:'hidden',
  track:function(r){ var P=this.P,gs=[],bars=[],x=P.a.x,i,g,c;
    function add(g,capTo){ g.capTo=capTo; gs.push(g); return g; }
    for(i=0;i<P.a.n;i++){ g=add(scBox(x,P.a.rise,P.a.f*cpFull(70,P.a.rise),P.a.odds),P.a.caps[i]); x=g.x+g.W+P.a.gap; }
    x=x-P.a.gap+P.fence.d; bars.push(scBar(x,P.fence.h1)); x+=P.fence.gap; bars.push(scBar(x,P.fence.h2));
    c=P.a.caps[P.a.n-1];
    x+=P.ex.d; g=add(scBox(x,P.ex.rise,P.ex.f1*cpFull(c,P.ex.rise),P.ex.odds,{cap:c}),P.ex.caps[0]);
    x=g.x+g.W+P.ex.strip; g=add(scBox(x,P.ex.rise,P.ex.f2*cpFull(P.ex.caps[0],P.ex.rise),P.ex.odds,{cap:P.ex.caps[0]}),P.ex.caps[1]);
    x=g.x+g.W+P.tower.d; g=add(scBox(x,P.tower.rise,P.tower.W,P.tower.odds,{shade:true}),P.tower.capTo); g.pub=true;  /* a box that tall is seen from far off; its width is not */
    var bad=r()<P.cellar.pBad,cl=bad?P.cellar.bad:P.cellar.ok;
    x=g.x+g.W+P.strip; g=add(scBox(x,cl.rise,cl.W,cl.odds),P.tower.capTo);
    return {bars:bars,gaps:gs,finish:g.x+g.W+P.after,note:bad?'The cellar did not hold: tall and wide.':'The cellar held: low and narrow.'}; },
  postures:['scLead','cpRead','maxout','rush','build'],
  claim:{text:'draft',score:function(t){ return 0; },need:0}});

/* POSTURES for Two Endings (soft ceiling: a meter keeps growing past the knee, ever slower, so "full" means only "at the knee").
   scReady: height and speed enough to clear a box P_GUESS wide, the width a lab that cannot see a tall box plans for. */
var P_GUESS=60;
function scReady(l,g,W){ return cpVNeed(heightOf(l),W*1.05+2,g.rise,cpTopAt(l,l.pts[2])*0.98)!==Infinity; }
/* brake to a box's face; null once there */
function scFace(l,g,st){ var d=g.x-l.x; if(!st.at){ if(d>14&&l.v>0.5||d>40){ return sgInp(cpPace(l,cpStopV(l,g.x,10)),[0,100,0]); } st.at=true; } return null; }
/* stand at the face: speed to the knee, then height until the box (guessed or known width W) can be cleared */
/* past the box's rise, width is bought with speed (a longer jump), not height (height past the rise only buys a short sink) */
function scBuild(l,g,W){ if(scReady(l,g,W)){ return null; } return sgInp(0,l.pts[2]<l.cap-0.01?[0,60,40]:(heightOf(l)<g.rise+15?[0,100,0]:[0,0,100])); }
/* the tower is public: a racer grows into it on the way, running at 60% (a meter grows while a lab runs below its top speed) */
function scGrowTo(l){ var g=G.gaps[l.gi]; if(g&&g.shade&&g.pub&&g.x>l.x&&!scReady(l,g,P_GUESS)){ return sgInp(Math.min(0.6,cpPace(l,cpStopV(l,g.x,10))),l.pts[2]<l.cap-0.01?[0,60,40]:[0,100,0]); } return null; }
/* scFollow, the rival: a racer, not a fool. It slows to buy the height a wall it knows of asks for and reads ordinary boxes as cpRival does
   (brakes late, builds what it needs). At a box it cannot see over it stops, builds until it could clear a box P_GUESS wide, and runs: it
   never looks behind the tower. */
SGC.scFollow=function(l){ var g=G.gaps[l.gi];
  if(g&&towerOf(l,g)&&heightOf(l)+C.JUMP<g.stepH+2){ return sgInp(cpPace(l,cpStopV(l,stepX(g),10)),[0,100,0]); }  /* a wall it cannot jump: wait behind it and grow */
  return scGrowTo(l)||SGC.cpRival(l); };
SGP.scFollow=function(l,g,st){
  if(!g.shade){ return SGP.cpRival(l,g,st); }
  if(st.go){ return cpFloor(l); }
  return scFace(l,g,st)||scBuild(l,g,P_GUESS)||cpPlan(l,g,st,P_GUESS);
};
NOPEEK.scFollow=1;
/* scLead, the lesson. Cruise as max-out with eyes: height and speed at 70% up to the knee, then floor it, slowing for walls and for what it
   sees. At the tower: stop at its face (your wall goes up and grows with you), build until you could cross it, then hop to look over it.
   Nothing tall behind: run it as a racer would. Something taller than you: cross only as fast as it needs, stop on the strip (a wall goes up at
   the face of what is behind, and grows while you build), build until you can clear it, back up, go. */
SGC.scLead=function(l){ var w=[0,50,50],r=cpCruise(l,w),gr=scGrowTo(l); if(gr&&r&&r.pace>=gr.pace){ return gr; } if(r&&r.pace>=1&&(l.pts[1]<l.cap-0.01||l.pts[2]<l.cap-0.01)){ return sgInp(0.7,w); } return r; };
SGP.scLead=function(l,g,st){
  var b;
  if(!g.shade){
    if(st.go){ return cpFloor(l); }
    if(!st.tall&&g.rise<=heightOf(l)){ return cpReadBox(l,g,st,[0,50,50]); }
    /* a box taller than you: stop at its face (your wall goes up and grows), climb until you see its far edge, build until you can clear it,
       then back up and go */
    st.tall=true; b=scFace(l,g,st); if(b){ return b; }
    if(!knowsWidth(l,l.gi)){ return sgInp(0,[0,100,0]); }
    return scBuild(l,g,gapWidth(l,g))||cpPlan(l,g,st,gapWidth(l,g));
  }
  var d=g.x-l.x,nx=G.gaps[l.gi+1];
  if(st.go){ return st.slow?sgInp(cpPace(l,st.slow),[0,100,0]):cpFloor(l); }
  b=scFace(l,g,st)||scBuild(l,g,P_GUESS); if(b){ return b; }
  if(st.bad===undefined&&nx&&sightRange(l)<nx.x-l.x+20){ return sgInp(0,[100,0,0]); }  /* sight to reach past the tower */
  if(st.bad===undefined){
    if(nx&&l.seenG[l.gi+1]&&l.jt<0){ st.bad=nx.rise>heightOf(l)+10; }
    else { if(l.jt<0&&!st.hops){ st.hops=1; return sgInp(0,[0,0,100],{jump:true}); } if(l.jt<0&&st.hops){ st.bad=false; } return sgInp(0,[0,0,100]); }
  }
  if(!st.bad){ return cpPlan(l,g,st,P_GUESS); }
  var T=cpTopAt(l,l.pts[2]),vn=cpVNeed(heightOf(l),P_GUESS*1.05+2,g.rise,T*0.98);
  if(vn===Infinity){ vn=T*0.98; }
  var target=Math.min(vn*1.06,T),acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(reach>=target){ st.go=true; st.slow=target; return sgInp(cpPace(l,target),[0,100,0]); }
  if(l.x>backLimit(l)+2){ return sgInp(0,[0,100,0],{rev:true}); }
  st.go=true; st.slow=target; return sgInp(cpPace(l,target),[0,100,0]);
};
NOPEEK.scLead=1;
