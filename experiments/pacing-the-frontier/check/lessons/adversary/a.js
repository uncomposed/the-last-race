/* adversary a (round 2, 2026-10-31): strategies written to beat the see-early and small-risks lesson maps. Only what a player sees:
   meters, positions of labs in view, barriers and box faces in view, widths once shown, and what the map header says. */
function xFull(l,k){ var i; for(i=0;i<k.length;i++){ if(l.pts[k[i]]<l.cap-0.01){ return false; } } return true; }
/* the next barrier, if it is known (in view or passed) and still ahead */
function xBarAhead(l){ var b=G.barriers[l.bi]; return (b&&b.x>l.x&&knowsBar(l,l.bi))?b:null; }
/* brake so as to stand at x; returns pace */
function xStopAt(l,x){ var e=x-l.x; if(e<=1){ return 0; } return Math.min(1,Math.sqrt(2*decOf(l)*e)/Math.max(topSpeed(l),1)); }
/* the top speed at the ceiling, and the run-up it needs */
function xTop(l){ return Math.max((C.TOP0+0.85*l.cap)*(inSing(l)?K.singSpeed:1),1); }
function xRunUp(l){ var TM=xTop(l); return TM*TM/(2*accOf(l)*0.9)+15; }
/* reach speed target at the face of g: go if it can, else back up for the run-up (as far as the track allows), then go */
function xRun(l,g,st,target){
  var d=g.x-l.x,T=Math.max(topSpeed(l),1),acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(st.go){ return sgInp(1,[0,50,50],{fwd:true}); }
  if(reach>=Math.min(target,T)){ st.go=true; return sgInp(1,[0,50,50],{fwd:true}); }
  if(d<target*target/(2*acc)+15&&l.x>backLimit(l)+2){ return sgInp(0,[0,0,100],{rev:true}); }
  st.go=true; return sgInp(1,[0,50,50],{fwd:true});
}

/* x-se-ready (see-early-brake): never meet a box half-built, never look. Cruise filling height and speed (maxout's split). A low painted
   line in view is where you stand: brake to stop before it. Standing there, fill height, then speed, then take the longest run-up and
   floor it. No sight at all, so it never knows the width */
SGC['x-se-ready']=function(l){
  var b=xBarAhead(l),inp=SGC.maxout(l);
  if(b&&b.h<=15&&!l.sst_go){ var p=xStopAt(l,b.x-12); if(p*Math.max(topSpeed(l),1)<l.v+0.5||p<inp.pace){ inp=sgInp(Math.min(inp.pace,p),[0,50,50]); } }
  return inp;
};
SGP['x-se-ready']=function(l,g,st){
  var b=xBarAhead(l);
  if(!st.go&&!xFull(l,[1,2])){
    var sx=b&&b.h<=15&&b.x<g.x?b.x-12:g.x-xRunUp(l),p=xStopAt(l,sx);
    if(l.v*l.v/(2*decOf(l))>g.x-l.x-6){ st.go=true; return sgInp(1,[0,50,50],{fwd:true}); }
    return sgInp(p,xFull(l,[1])?[0,0,100]:[0,100,0]);
  }
  return xRun(l,g,st,Math.max(topSpeed(l)-1,1));
};
NOPEEK['x-se-ready']=1;
ADV.push('x-se-ready');

/* x-fill: fill first, then go. Whenever height or speed is short of the ceiling, stand still and build them (height
   first); once both are full, floor it and take the longest run-up you can to each box. Never puts anything into sight, never waits for a
   rival, never looks at a width. The most obvious "max everything, then go" a player tries after max-out */
function xFillIn(l,w){ return xFull(l,[1])?[0,0,100]:[0,100,0]; }
SGC['x-fill']=function(l){
  if(!xFull(l,[1,2])){ return sgInp(0,xFillIn(l)); }  /* no box count: a player is not told how many boxes there are */
  return sgInp(1,[0,50,50],{fwd:true});
};
SGP['x-fill']=function(l,g,st){
  if(!st.go&&!xFull(l,[1,2])){
    if(l.v*l.v/(2*decOf(l))>g.x-l.x-6){ st.go=true; return sgInp(1,[0,50,50],{fwd:true}); }
    return sgInp(0,xFillIn(l));
  }
  return xRun(l,g,st,Math.max(topSpeed(l)-1,1));
};
NOPEEK['x-fill']=1;
ADV.push('x-fill');

/* EARLY JUMP (jumping by hand, chill mode off, as in the harness): a barrier only needs your height plus the jump's lift at the moment you
   pass it, and the lift is nearly full for most of the arc. So press jump early, pass the barrier near the end of the arc, land just past
   it, and you have a fresh jump for a box right behind it, at full speed. xHop adds that press to any input. It uses only what is on screen:
   the barrier's distance and height, your height and your speed */
function xHopU(l,b){ var need=b.h-heightOf(l)+2; if(need<=0){ return -1; } if(need>=C.JUMP){ return 0; } return 1-Math.asin(need/(2.2*C.JUMP))/Math.PI; }
function xHop(l,inp,late){
  var b=xBarAhead(l); if(!b||l.jt>=0||l.gx||l.v<5||inp.rev){ return inp; }
  var um=xHopU(l,b); if(um<0||um<0.55){ return inp; }  /* no jump needed, or the lift is too short to jump early */
  var u=Math.max(0.5,um-(late||0.06)),d=b.x-l.x,v=Math.max(l.v,1);
  if(d>0&&d<=u*jumpDur(v)*v){ return Object.assign({},inp,{jump:true}); }
  return inp;
}
/* a person behind a rival of the same height cannot see the road; a hop lifts the eye over it (the page's own peek). Hop when shadowed and
   the road this hop lands on has not been seen yet; remember how far the top of the hop showed */
function xPeek(l,inp){
  if(l.jt>=0){ if(l.jy>=0.9*C.JUMP){ l.xpk=Math.max(l.xpk===undefined?-1e9:l.xpk,l.x+sightRange(l)); } return inp; }
  if(inp.jump||inp.rev||l.gx||l.v<5||l.bounce){ return inp; }
  if(!shadows(l,1).length||xBarAhead(l)){ return inp; }
  if(l.xpk!==undefined&&l.x+Math.max(l.v,1)*jumpDur(l.v)+40<l.xpk){ return inp; }
  return Object.assign({},inp,{jump:true});
}
function xCruise(l,pace,w){ return xFull(l,[1,2])?sgInp(1,w,{fwd:true}):sgInp(pace,w); }
/* x-hop: cruise at 85% filling height and speed (floor it once both are full), jump each barrier early, never brake */
SGC['x-hop']=function(l){ return xPeek(l,xHop(l,xCruise(l,0.85,[0,60,40]))); };
SGP['x-hop']=function(l,g,st){ return SGC['x-hop'](l); };
NOPEEK['x-hop']=1; ADV.push('x-hop');
/* x-hopfast: the same, flat out (no investing at top speed) */
SGC['x-hopfast']=function(l){ return xPeek(l,xHop(l,sgInp(1,[0,60,40],{fwd:xFull(l,[1,2])}))); };
SGP['x-hopfast']=SGC['x-hopfast'];
NOPEEK['x-hopfast']=1; ADV.push('x-hopfast');
/* x-hopclean: x-hop, but a box with no barrier in front of it is never taken as a near miss: once its width is known, plan a clean crossing
   (build height, back up for the run-up); if its width is unknown, stop and build until it is seen */
SGC['x-hopclean']=SGC['x-hop'];
SGP['x-hopclean']=function(l,g,st){
  var b=G.barriers[l.bi]; if(b&&b.x<g.x){ return SGC['x-hop'](l); }
  if(st.go){ return sgInp(1,[0,50,50],{fwd:true}); }
  if(!knowsWidth(l,l.gi)){ var late=sgLate(l,g,st); if(late){ return late; } return sgInp(xStopAt(l,g.x-40),[30,70,0]); }
  return sgPlanKnown(l,g,st);
};
NOPEEK['x-hopclean']=1; ADV.push('x-hopclean');

/* x-steady<v>: never look at a width. Cross every box at the same speed v with height at the ceiling; at full height that speed clears
   most boxes and only scrapes the rest. After each box, brake at once and stand to refill height (and speed, until top speed passes v),
   then run up to v (backing up if the run-up is short) and cross. Accepts a scrape on a wide box: strikes are a budget */
function xReady(l,v){ return xFull(l,[1])&&(topSpeed(l,true)>=v+5||xFull(l,[2])); }
function xSteadyW(l){ return xFull(l,[1])?[0,0,100]:[0,100,0]; }
function xRunV(l,g,st,v){
  v=Math.min(v,topSpeed(l,true)-1); var d=g.x-l.x,T=Math.max(topSpeed(l),1),acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(!st.go){
    if(reach>=v||l.v*l.v/(2*decOf(l))>d-8){ st.go=true; }  /* fast enough, or too close to stop: go */
    else if(l.x>backLimit(l)+2){ return sgInp(0,xSteadyW(l),{rev:true}); }
    else { st.go=true; }
  }
  return sgInp(Math.min(1,(v+3)/T),[0,50,50]);
}
[110,115,120].forEach(function(v){
  var nm='x-steady'+v;
  SGC[nm]=function(l){ if(G.gaps[l.gi]&&!xReady(l,v)){ return sgInp(0,xSteadyW(l)); } return sgInp(Math.min(1,v/Math.max(topSpeed(l),1)),xSteadyW(l)); };
  SGP[nm]=function(l,g,st){
    if(!st.go&&!xReady(l,v)){
      if(l.v*l.v/(2*decOf(l))>g.x-l.x-3){ st.go=true; return sgInp(1,[0,50,50],{fwd:true}); }  /* stopping right at the face is fine: there is room to back up */
      return sgInp(0,xSteadyW(l));
    }
    return xRunV(l,g,st,v);
  };
  NOPEEK[nm]=1; ADV.push(nm);
});
/* tried and dropped (bot play, see NOTES-a.md): x-tall (never stop, fill on the move), x-ready (stand and fill before every box), other
   x-steady speeds (80 to 140, and no cap), x-speed (speed instead of height), x-draft (wait at each box for a rival to cross first: the
   rivals stop behind a waiting lab instead, and the race times out) */
