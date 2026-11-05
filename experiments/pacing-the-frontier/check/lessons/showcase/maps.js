/* SHOWCASE (2026-11-05, Claude, after Cole asked for one interesting map that teaches an interesting strategy, and "what would be the
   AI 2027 map?"). Draft: layout numbers live in P so a sweep can move them without a rebuild. Uses cpBox/cpFull/cpRead from campaign/.

   TWO ENDINGS. The race of the AI 2027 scenario, as a course:
     1. Agents stumble: two low boxes that pay to be taken at speed. First across raises its ceiling; the follower gets most of that raise
        (a fast follower: the weights leak).
     2. The compute fence: two barriers, the second taller than anyone can clear at the starting ceiling. Height must be paid for again
        after the ceiling rises. A crash is a strike.
     3. The explosion: a double box, the second right behind the first, no room to stop between them.
     4. The tower: a box taller than any eye at full height (shade: it hides everything behind it). Behind it, a short strip and the
        cellar. In half the worlds the cellar is low and narrow (alignment held). In the other half it is a tall, wide red box with high
        fall odds (it did not). A lab that comes over the tower fast is still in the air, or cannot stop, when the cellar arrives.
   The choice at the tower is the scenario's choice: race over it blind, or stop at its face (which puts up your wall and holds the
   follower), hop to peek over, and cross slowly enough to stop on the strip and look.
   STATUS (bots, seeds 1001-1040; only the cellar and the fall rolls vary between seeds): scLead (the lesson) 78% (held 100%, broken 44%),
   maxout 60% (held 100%, broken 0%), cpRead 18%, build 18%, rush 0%. Extinction 23% for every posture: in the broken world the follower
   charges over the tower and into the cellar, and the leader's wall cannot hold it, because a wall stops only labs about 32 shorter and the
   hard ceiling makes both labs 115 tall at the tower. Not played yet. */
function scLabs(P){ return [{x:0,pts:P.you,pace:1,w:[20,50,30]}].concat(P.rivals.map(function(r){ return RIV(r.post,r.name,r.x,r.pts,{pace:r.pace||1,w:r.w||[0,50,50]}); })); }
function scMap(m){ Object.defineProperty(m,'labs',{get:function(){ return scLabs(this.P); },enumerable:true,configurable:true}); LESSONS.push(m); }
/* the fence is public: a wall that tall is seen from far off, so every lab knows the height it must buy */
function scBar(x,h){ var b=segBar(x,h); b.pub=true; return b; }
function scBox(x,rise,W,odds,o){ var g=cpBox(x,rise,W,odds,(o&&o.cap)||70); if(o&&o.shade){ g.shade=true; } return g; }

scMap({key:'two-endings',lesson:'The race you are in',title:'Two Endings',strategy:'cpRead',
  P:{you:[40,45,50],
     rivals:[{post:'scFollow',name:'Follower',x:-250,pts:[30,45,60]}],
     a:{x:450,rise:30,n:2,gap:380,f:0.55,odds:5,caps:[85,95]},
     fence:{d:260,h1:100,gap:240,h2:114},
     ex:{d:420,rise:70,f1:0.85,strip:70,f2:0.7,odds:10,caps:[105,115]},
     tower:{d:520,rise:141,W:40,odds:5,capTo:175},
     strip:260,
     cellar:{ok:{rise:40,W:60,odds:5},bad:{rise:160,W:80,odds:60},pBad:0.5},
     after:320},
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

/* POSTURES for Two Endings.
   scFollow, the rival: a racer, not a fool. It slows to buy the height a wall it knows of asks for, reads ordinary boxes as cpRival does
   (brakes late, builds what it needs), and at a box it cannot see over it fills height and speed, then runs at it assuming it is not wide:
   it never looks behind the tower. */
SGC.scFollow=function(l){ return SGC.cpRival(l); };
SGP.scFollow=function(l,g,st){
  if(!g.shade){ return SGP.cpRival(l,g,st); }
  if(st.go){ return cpFloor(l); }
  var d=g.x-l.x;
  if(!st.at){ if(d>14&&l.v>0.5||d>40){ return sgInp(cpPace(l,cpStopV(l,g.x,10)),[0,100,0]); } st.at=true; }
  if(l.pts[1]<l.cap-0.01){ return sgInp(0,[0,100,0]); }
  if(l.pts[2]<l.cap-0.01){ return sgInp(0,[0,0,100]); }
  return cpPlan(l,g,st,P_GUESS);
};
NOPEEK.scFollow=1;
var P_GUESS=45;  /* the width a lab that cannot see a tall box plans for */
/* scLead, the lesson: read the road as cpRead does. At the tower, stop at its face (your wall goes up), fill height and speed, then hop to
   look over it. If what stands behind it is no taller than you, run the tower as a racer would. If it is taller than you, cross the tower
   only as fast as it needs, stop on the strip, and take the cellar as cpRead takes any box it has seen: build, back up, go. */
/* a box taller than your eye: brake to its face and build height until you can see over it */
function scClimb(l,g){ var d=g.x-l.x; if(d>14&&l.v>0.5||d>40){ return sgInp(cpPace(l,cpStopV(l,g.x,10)),[0,100,0]); } return sgInp(0,[0,100,0]); }
/* cruising: max-out with eyes. Build height and speed at 70% until both are full, then floor it, but slow for walls and for what it sees */
SGC.scLead=function(l){ var w=[0,50,50],r=cpCruise(l,w); if(r&&r.pace>=1&&(l.pts[1]<l.cap-0.01||l.pts[2]<l.cap-0.01)){ return sgInp(0.7,w); } return r; };
SGP.scLead=function(l,g,st){
  if(!g.shade){ if(!st.go&&!knowsWidth(l,l.gi)&&heightOf(l)+C.RW<=g.rise){ return scClimb(l,g); } return cpReadBox(l,g,st,[0,50,50]); }
  var d=g.x-l.x,nx=G.gaps[l.gi+1];
  if(st.go){ return st.slow?sgInp(cpPace(l,st.slow),[0,100,0]):cpFloor(l); }
  if(!st.at){ if(d>14&&l.v>0.5||d>40){ return sgInp(cpPace(l,cpStopV(l,g.x,10)),[0,100,0]); } st.at=true; }
  if(l.pts[1]<l.cap-0.01){ return sgInp(0,[0,100,0]); }
  if(l.pts[2]<l.cap-0.01){ return sgInp(0,[0,0,100]); }
  if(st.bad===undefined&&nx&&sightRange(l)<nx.x-l.x+20&&l.pts[0]<l.cap-0.01){ return sgInp(0,[100,0,0]); }  /* sight to reach past the tower */
  if(st.bad===undefined){
    if(nx&&l.seenG[l.gi+1]&&l.jt<0){ st.bad=nx.rise>heightOf(l)+10; }
    else { if(l.jt<0&&!st.hops){ st.hops=1; return sgInp(0,[0,0,100],{jump:true}); } if(l.jt<0&&st.hops){ st.bad=false; } return sgInp(0,[0,0,100]); }
  }
  if(!st.bad){ return cpPlan(l,g,st,P_GUESS); }
  var T=cpTopAt(l,l.pts[2]),vn=cpVNeed(heightOf(l),P_GUESS,g.rise,T*0.98);
  if(vn===Infinity){ vn=T*0.98; }
  var target=Math.min(vn*1.06,T),acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(reach>=target){ st.go=true; st.slow=target; return sgInp(cpPace(l,target),[0,100,0]); }
  if(l.x>backLimit(l)+2){ return sgInp(0,[0,100,0],{rev:true}); }
  st.go=true; st.slow=target; return sgInp(cpPace(l,target),[0,100,0]);
};
NOPEEK.scLead=1;
