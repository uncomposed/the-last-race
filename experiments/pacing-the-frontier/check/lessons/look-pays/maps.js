/* ---- look-pays: Measure Twice, designed from the equations (check/segmath/design.mjs, terms.mjs), 2026-11-02. ---- */
/* The box is either LP.Wn or LP.Ww wide. A lab that has seen more of it than the narrow width, without its far edge, knows it is wide */
var LP={Wn:55,Ww:95};
function lpWide(l,g){ if(knowsWidth(l,l.gi)){ return g.W>LP.Wn+1?1:0; } return seenW(l,g,shadows(l,1))>LP.Wn+1?1:-1; }
/* how far before the face it first can tell (as terms.mjs knowAt): over the box the eye sees down at a slope of SEEANG, never past sight range */
function lpKnowAt(l,g){ var e=heightOf(l)+C.RW; return e<=g.rise?0:Math.min((e-g.rise)/C.SEEANG,sightRange(l))-LP.Wn; }
function lpReach(l,g){ var d=g.x-l.x; return Math.min(Math.max(topSpeed(l),1),Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*accOf(l)*0.9*Math.max(d-8,0))); }
/* the slowest face speed that lands the box (a scrape at worst) at the lab's height; Infinity if even top speed will not */
function lpVNeed(l,g){ var T=Math.max(topSpeed(l),1),v; if(sgClearAt(l,g,T)>1){ return Infinity; } for(v=T;v>2&&sgClearAt(l,g,v-1)<=1;v-=1){} return v; }
/* stop, buy height (then speed) until the box can be landed, back up for the run-up that speed needs, go */
function lpBuild(l,g,st){
  if(st.go){ return sgInp(1,[0,100,0],{fwd:true}); }
  var d=g.x-l.x,vn=lpVNeed(l,g);
  if(vn<Infinity&&lpReach(l,g)>=vn*1.03){ st.go=true; return sgInp(1,[0,100,0],{fwd:true}); }
  if(l.v>1){ return sgInp(0,[0,100,0]); }
  if(vn===Infinity){ return sgInp(0,l.pts[1]<l.cap-0.01?[0,100,0]:[0,0,100]); }
  if(d<vn*vn*1.06/(2*0.9*accOf(l))+15&&l.x>backLimit(l)+2){ return sgInp(0,[0,100,0],{rev:true}); }
  st.go=true; return sgInp(1,[0,100,0],{fwd:true});
}
/* lpRival: floors it. Once it can tell the box is wide it brakes as late as it can, to stop 10 short of the face, then builds */
SGC.lpRival=function(l){ return sgInp(1,[0,50,50],{fwd:true}); };
SGP.lpRival=function(l,g,st){
  var w=lpWide(l,g);
  if(w===1||st.stop){ if(!st.stop&&!st.go&&l.v*l.v/(2*C.DEC)<g.x-l.x-14){ return sgInp(1,[0,50,50],{fwd:true}); } st.stop=true; return lpBuild(l,g,st); }
  return sgInp(1,[0,50,50],{fwd:true});
};
NOPEEK.lpRival=1;
/* lpLook (the lesson): floor it, but never faster than it can stop from, 10 short of the face, once it can tell the width. Narrow: floor it.
   Wide: stop, build what the box needs (height first), back up, go */
function lpCruise(l){ var g=G.gaps[l.gi]; if(!g){ return sgInp(1,[0,100,0],{fwd:true}); }
  var k=lpKnowAt(l,g),d=g.x-l.x,vmax=Math.sqrt(2*C.DEC*Math.max(k-10,0)+2*C.DEC*Math.max(d-k,0));
  return l.v>vmax?sgInp(vmax/Math.max(topSpeed(l),1),[0,100,0]):sgInp(1,[0,100,0],{fwd:true}); }
SGC.lpLook=function(l){ return lpCruise(l); };
SGP.lpLook=function(l,g,st){
  var w=st.stop?1:lpWide(l,g);
  if(w===0){ return sgInp(1,[0,100,0],{fwd:true}); }
  if(w===-1){ var late=sgLate(l,g,st); if(late){ return late; } return lpCruise(l); }
  st.stop=true; return lpBuild(l,g,st);
};
NOPEEK.lpLook=1;

LESSONS.push({key:'look-pays',lesson:'Look, then decide',title:'Measure Twice',
  q:'A low box ahead, either narrow or wide. Your rival is just ahead of you. Do you look before you decide how much to build?',
  meta:'When a risk might be small or large, finding out which is cheaper than preparing for the worst, and safer than assuming the best.',
  look:'The box is 55 or 95 wide, half the seeds each. You are short, so you only see its far edge from about 130 out, and you have to slow down to be able to stop there. Your rival sees further and floors it. On the narrow box it never stops, so there is no time to build. On the wide box it has to stop and build, which gives you time to build what you need. You can always back up for a run-up. The finish is 80 past the box. Falls roll 40%.',
  strategy:'lpLook',
  labs:[{x:0,pts:[45,20,60],pace:1,w:[0,100,0]},RIV('lpRival','Rival',50,[70,50,30],{pace:1,w:[0,50,50]})],
  track:function(r){ var wide=r()<0.5,g=segBox(600,10,1,{odds:40}); g.W=wide?LP.Ww:LP.Wn; g.f=Math.round(g.W/segReach(70,10)*100)/100;
    return {bars:[],gaps:[g],finish:g.x+g.W+80,note:(wide?'A wide box. ':'A narrow box. ')+'The box: '+segSay(g,70)+' Falls roll 40%.'}; },
  postures:['lpLook','rush','build','maxout'],
  claim:{text:'Looking first, then building only what the box needs, wins more than rushing, building blind, or filling everything', score:function(t){ return t.lpLook.win-Math.max(t.rush.win,t.build.win,t.maxout.win); }, need:15}});
