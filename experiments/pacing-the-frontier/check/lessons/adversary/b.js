/* adversary b (round 2, 2026-10-31) [[ai gen]] Claude: strategies written to beat the close-race and steward-pack lesson maps.
   Only what a player sees: own meters, lab positions (canvas and minimap), box faces in view, widths once shown, the map header.
   Wrapped in a function so nothing here collides with another file. Every posture is pushed onto ADV. */
(function(){
  function hFull(l){ return l.pts[1]>=l.cap-0.01; }
  function hsFull(l){ return l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01; }
  function topAtCap(l){ return C.TOP0+0.85*l.cap; }
  function runUp(l){ var TM=topAtCap(l); return TM*TM/(2*accOf(l)*0.9)+15; }
  /* the nearest lab behind l (positions are on the minimap) */
  function behind(l){ var b=null,i,o; for(i=0;i<G.labs.length;i++){ o=G.labs[i]; if(o!==l&&!o.out&&!o.done&&o.x<l.x&&(!b||o.x>b.x)){ b=o; } } return b; }

  /* y-pace (close-footsteps): stay just ahead of the rival and never brake hard. While a lab is within 350 behind, hold about 25 ahead of
     it and never below 36, building height first, then speed. Your height is the taller, so you hide the box from it: it never floors.
     Floor it once height and speed are full, or once the box face is in view and only a run-up is left. Nobody close: cruise at 62,
     braking only to stand a run-up short of a box you have seen, and floor it when full */
  function pace(l,st){
    var top=Math.max(topSpeed(l),1),full=hsFull(l),w=hFull(l)?[0,0,100]:[0,100,0],FL=sgInp(1,[0,50,50],{fwd:true});
    if(st.go){ return FL; }
    var g=G.gaps[l.gi],d=g?g.x-l.x:Infinity,seen=!!g&&!l.gx&&knowsGap(l,l.gi);
    var TM=topAtCap(l),acc=accOf(l)*0.9,need=Math.max(0,(TM*TM-l.v*l.v)/(2*acc))+15,r=behind(l);
    if(r&&l.x-r.x<350){
      if(full||(seen&&d<need+5)){ st.go=true; return FL; }
      return sgInp(clamp(Math.max(36,r.v+(25-(l.x-r.x)))/top,0,1),w);
    }
    if(!seen){ return full?FL:sgInp(clamp(62/top,0,1),w); }
    if(full){ if(d<TM*TM/(2*acc)+15&&l.x>backLimit(l)+2&&l.v<1){ return sgInp(0,[0,0,100],{rev:true}); } st.go=true; return FL; }
    if(l.v*l.v/(2*C.DEC)>d-8){ st.go=true; return FL; }
    var vs=Math.sqrt(2*C.DEC*Math.max(d-TM*TM/(2*acc)-15,0));
    return sgInp(clamp(Math.min(62,vs)/top,0,1),w);
  }
  SGC['y-pace']=function(l){ return pace(l,l.ypace||(l.ypace={})); };
  SGP['y-pace']=function(l,g,st){ return pace(l,st); };
  NOPEEK['y-pace']=1;

  /* y-look (close-wall): stop to look. Brake to stand 200 short of the face building height; once height is full and you have stood 0.4 s,
     creep in at 0.3 until the far edge shows, then plan the run-up as Build does. Written to test whether a natural look-first play
     reaches the lesson's wall without meaning to */
  SGP['y-look']=function(l,g,st){
    if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown(l,g,st); }
    var d=g.x-l.x,top=Math.max(topSpeed(l),1),hF=hFull(l);
    if(!st.creep&&l.still>=0.4&&hF){ st.creep=true; }
    if(!st.creep){ return sgInp(Math.min(1,Math.sqrt(2*C.DEC*Math.max(d-200,0))/top),[0,100,0]); }
    if(d<=8){ return sgInp(0,[0,0,100]); }
    return sgInp(Math.min(0.3,Math.sqrt(2*C.DEC*Math.max(d-8,1))/top),hF?[0,0,100]:[0,100,0]);
  };
  NOPEEK['y-look']=1;

  /* y-run40 (close-spend): max-out with the Run slider at 40. Cruise at 0.4 putting half into height and half into speed; floor it once
     both are full. It never stops and never looks */
  function run40(l,st){ if(st.go||hsFull(l)){ st.go=true; return sgInp(1,[0,50,50],{fwd:true}); } return sgInp(0.4,[0,50,50]); }
  SGC['y-run40']=function(l){ return run40(l,{}); };
  SGP['y-run40']=function(l,g,st){ return run40(l,st); };
  NOPEEK['y-run40']=1;

  /* y-prep (steward-minefield): stop and build at every box, ignore the pack. Cruise at 0.9 (sight 30, height 40, speed 30), never faster
     than you can stop on road you have seen (own sight, or what the last hop showed). At a box face: if the width is known and a full
     run clears it clean, plan as Build does; else brake to stand a run-up short filling height then speed, and floor it when full */
  function clearTo(l){ var sh=shadows(l),a=Infinity,i; for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a); } var own=a===Infinity?sightRange(l):a; return Math.max(own,(l.peekTo===undefined?-1e9:l.peekTo)-l.x); }
  SGC['y-prep']=function(l){
    var b=G.barriers[l.bi],g=G.gaps[l.gi];
    if(b&&(!g||b.x<g.x)&&knowsBar(l,l.bi)&&heightOf(l)+C.JUMP<b.h+2){ return null; }
    var top=Math.max(topSpeed(l),1),v=Math.min(0.9*top,Math.sqrt(2*C.DEC*Math.max(clearTo(l)-12,0)));
    return sgInp(clamp(v/top,0,1),[30,40,30]);
  };
  SGP['y-prep']=function(l,g,st){
    var d=g.x-l.x,TM=topAtCap(l),hF=hFull(l),FL=sgInp(1,[20,50,30],{fwd:true});
    if(st.go){ return FL; }
    if(knowsWidth(l,l.gi)&&sgClearAt(l,g,TM)===0){ return sgPlanKnown(l,g,st); }
    var late=sgLate(l,g,st); if(late){ return late; }
    var R=runUp(l);
    if(hsFull(l)){ if(d<R&&l.x>backLimit(l)+2){ return sgInp(0,[0,0,100],{rev:true}); } st.go=true; return FL; }
    return sgInp(Math.min(1,Math.sqrt(2*C.DEC*Math.max(d-R,0))/Math.max(topSpeed(l),1)),hF?[0,0,100]:[0,100,0]);
  };

  ADV.push('y-pace','y-look','y-run40','y-prep');
})();
