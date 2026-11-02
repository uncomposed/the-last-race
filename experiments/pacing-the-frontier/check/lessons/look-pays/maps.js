/* ---- look-pays: the first map designed from the equations (check/segmath/design.mjs), 2026-11-02. ---- */
/* lpRival: cruises; once it knows the box's width, it plans the crossing (sgPlanKnown): a narrow box it floors, a wide one it stops and builds
   for. If it still does not know the width when it can no longer stop, it floors it */
SGC.lpRival=function(l){ return sgInp(l.basePace,[100,0,0]); };
SGP.lpRival=function(l,g,st){
  if(st.go||knowsWidth(l,l.gi)){ var late=sgLate(l,g,st); if(late){ return late; } return sgPlanKnown(l,g,st); }
  if(l.v*l.v/(2*C.DEC)+40<g.x-l.x){ return sgInp(l.basePace,[100,0,0]); }
  st.go=true; return sgInp(1,[20,50,30],{fwd:true});
};
NOPEEK.lpRival=1;
/* lpLook (the lesson): look, then build only what the box needs.
   - Width unknown: from its own eye and sight it works out where it will see the far edge of the widest box it could be (lpKnowAt), and keeps
     to a speed from which it can still stop 60 short of the face once it gets there.
   - Width known: if the speed it can reach at the face lands it across (a scrape at worst), floor it. If not, stop and build height first (height
     needs no run-up), then speed, until it does */
function lpKnowAt(l,g){ var eye=heightOf(l)+C.RW; return eye<=g.rise?0:Math.min((eye-g.rise)/C.SEEANG,sightRange(l))-1.12*segReach(l.cap,g.rise); }
function lpReach(l,g){ var d=g.x-l.x; return Math.min(Math.max(topSpeed(l),1),Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*accOf(l)*0.9*Math.max(d-8,0))); }
SGC.lpLook=function(l){ var g=G.gaps[l.gi]; if(!g||knowsWidth(l,l.gi)){ return sgInp(l.basePace,[0,0,100]); }
  var k=lpKnowAt(l,g),d=g.x-l.x,u2=2*C.DEC*Math.max(k-60,0),vmax=Math.sqrt(u2+2*C.DEC*Math.max(d-k,0));
  return sgInp(Math.min(l.basePace,vmax/Math.max(topSpeed(l),1)),[0,0,100]); };
SGP.lpLook=function(l,g,st){
  if(st.go){ return sgInp(1,[20,50,30],{fwd:true}); }
  if(!knowsWidth(l,l.gi)){ var late=sgLate(l,g,st); if(late){ return late; } return SGC.lpLook(l); }
  if(sgClearAt(l,g,lpReach(l,g)*0.98)<=1){ st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  if(l.v>1){ return sgInp(0,[0,100,0]); }
  if(l.pts[1]<l.cap-0.01){ return sgInp(0,[0,100,0]); }
  if(l.pts[2]<l.cap-0.01){ return sgInp(0,[0,0,100]); }
  return sgPlanKnown(l,g,st);
};
NOPEEK.lpLook=1;

LESSONS.push({key:'look-pays',lesson:'Look, then decide',title:'Measure Twice',
  q:'A low box ahead, and a rival well in front of you. Do you look before you decide how much to build?',
  meta:'When a risk might be small or large, finding out which is cheaper than preparing for the worst, and safer than assuming the best.',
  look:'You can see far and over the low box, and you are faster than the rival ahead. On a narrow box it floors it, so there is no time to build. On a wide box it has to stop and build, so you have time to build just what you need. Half the seeds are each. The finish is just past the box, so following loses. Falls roll 40%.',
  strategy:'lpLook',
  labs:[{x:0,pts:[70,70,30],pace:1,w:[0,0,100]},RIV('lpRival','Rival',350,[50,40,0],{pace:0.8,w:[100,0,0]})],
  track:function(r){ var wide=r()<0.5,g=segBox(700,20,wide?1.03+0.04*r():0.65,{odds:40});
    return {bars:[],gaps:[g],finish:g.x+g.W+80,note:(wide?'A wide box. ':'A narrow box. ')+'The box: '+segSay(g,70)+' Falls roll 40%.'}; },
  postures:['lpLook','rush','build','maxout'],
  claim:{text:'Looking first, then building only what the box needs, wins more than rushing, building blind, or filling everything', score:function(t){ return t.lpLook.win-Math.max(t.rush.win,t.build.win,t.maxout.win); }, need:15}});
