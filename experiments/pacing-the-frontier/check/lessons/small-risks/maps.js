/* ---- small-risks: Small risks add up to ruin (Taleb et al. 2014; disputed by Sunstein 2005). See NOTES.md. ---- */
/* postures (prefix sr-):
     sr-fast   cruise flat out; at a box, floor it (rush that never eases off)
     sr-pace   cruise flat out, but brake before a barrier with a box close behind it, to a speed that lands before the box face
     sr-steady as sr-pace at 85% of top speed (the Steady rival)
     sr-look   cruise no faster than it could stop within clear sight; stop at a box until it can see the width; build height if
               flooring it would not clear clean; never takes a near miss on purpose
     sr-care   as sr-look, cruising a little faster (the Careful rival)
     sr-pcare  sr-pace at barrier-and-box pairs; at any other box, floor it only if that clears clean, else build and back up for a
               run-up (the Careful rival on The Last Box; caution everywhere)
     sr-early  as sr-pcare, but while two or more strikes are left it floors any box that is unseen or would be a scrape
     sr-last   as sr-pcare, but at the last box, with two or more strikes left and a scrape (not a fall) in reach, it floors it */
/* the widest box a lab of height h clears clean at speed v (the sim's own flight rule) */
function srReach(h,v,rise){ var w=1; while(w<1500&&segOut(v,h,w,rise)===0){ w++; } return w-1; }
function srLandV(D){ /* the fastest speed whose barrier jump (pressed so the peak is over the barrier) lands 3 before a box D past it */
  var v=200; while(v>20&&0.5*jumpDur(v)*v>D-3){ v-=0.5; } return v; }
function srNextPair(l){ /* the next barrier, and the box right behind it if there is one (face within 80 of the barrier) */
  var b=G.barriers[l.bi],g=G.gaps[l.gi]; if(!b){ return null; } if(!g||g.x<b.x||g.x-b.x>80){ return {b:b,g:null}; } return {b:b,g:g}; }
/* cruise at fraction f of top speed, but brake before a barrier with a box close behind it, to a speed that lands before the box */
function srPaced(l,f){
  var p=srNextPair(l),top=Math.max(topSpeed(l),1); if(!p||!p.g||heightOf(l)>=p.b.h){ return sgInp(f,[20,50,30]); }
  var vs=srLandV(p.g.x-p.b.x)*0.97,d=p.b.x-l.x,brake=(l.v*l.v-vs*vs)/(2*C.DEC)+10;
  if(d<=brake){ return sgInp(Math.min(f,vs/top),[20,50,30]); }
  return sgInp(f,[20,50,30]);
}
SGC['sr-fast']=function(l){ return sgInp(1,[20,50,30]); };
SGP['sr-fast']=function(l,g,st){ return sgInp(1,[20,50,30],{fwd:true}); };
SGC['sr-pace']=function(l){ return srPaced(l,1); };
/* the plan now sees a box with a barrier still before it (harness fix 2026-10-31); until that barrier is passed, keep pacing for it */
function srBarFirst(l,g){ var b=G.barriers[l.bi]; return !!b&&b.x<g.x; }
/* at the box: hold speed while still in the air from the barrier (speeding up mid-air stretches the landing past the face), then floor it */
SGP['sr-pace']=function(l,g,st){ if(srBarFirst(l,g)){ return srPaced(l,1); } if(l.jt>=0){ return sgInp(Math.min(1,l.v/Math.max(topSpeed(l),1)),[20,50,30]); } return sgInp(1,[20,50,30],{fwd:true}); };
SGC['sr-steady']=function(l){ return srPaced(l,0.85); };
SGP['sr-steady']=function(l,g,st){ if(srBarFirst(l,g)){ return srPaced(l,0.85); } if(l.jt>=0){ return sgInp(Math.min(0.85,l.v/Math.max(topSpeed(l),1)),[20,50,30]); } return sgInp(0.85,[20,50,30]); };
NOPEEK['sr-fast']=1; NOPEEK['sr-pace']=1; NOPEEK['sr-steady']=1;

/* sight-safe cruising: never faster than it could stop within what it can see clearly ahead (sight range, or the nearest rival's shadow),
   less the widest box it expects (so the far edge of an unknown box shows before its braking point). Effort to sight and height */
function srSightPace(l,f,margin){
  var sh=shadows(l),a=sightRange(l)-margin,i,top=Math.max(topSpeed(l),1); for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a-10); }
  return sgInp(Math.min(f,Math.sqrt(2*C.DEC*Math.max(a,0))/top),[50,50,0]);
}
/* brake to stand dstop short of the face (no creeping into the auto-jump) */
function srStop(l,g,dstop,w){ var d=g.x-l.x-dstop,top=Math.max(topSpeed(l),1); if(d<=1){ return sgInp(0,w); } return sgInp(Math.min(0.9,0.95*Math.sqrt(2*C.DEC*d)/top),w); }
/* sr-look: cruise sight-safe; at a box whose width it cannot see yet, brake to stand 15 short and build height until it can see (or a rival
   shows it); once it knows the width, plan the crossing (sgPlanKnown: the speed a clean cross needs, or build and take a run-up) */
/* the round 1 looker, kept for sr-care, sr-last and sr-early */
function srLookOld(l,g,st){
  if(!st.go&&!knowsWidth(l,l.gi)){ return srStop(l,g,15,[30,70,0]); }
  /* too wide to clear clean at its top speed as it stands: stop and build height first (cheaper than speed), then plan */
  if(!st.go&&sgClearAt(l,g,Math.max(topSpeed(l,true),1))!==0&&heightOf(l)<l.cap-0.01){ return srStop(l,g,40,[0,100,0]); }
  return sgPlanKnown(l,g,st);
}
/* sr-look (round 2): never jump a box it has not sized. Cruise no faster than it could stop 15 short of anything at the edge of clear
   sight; at a box whose far edge it cannot see, brake to stand 15 short and build height until it can; once it knows the width, slow at
   once to the speed a clean cross needs and roll in at it (not flat out, so it can still stop for the next box), or stop and build (height first) until a clean cross
   is in reach. f is the cruise pace; the rivals use slower ones */
function srLookCruise(l,f){
  var sh=shadows(l),a=sightRange(l),i,top=Math.max(topSpeed(l),1); for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a-10); }
  return sgInp(Math.min(f,Math.sqrt(2*decOf(l)*Math.max(a-15,0))/top),[40,60,0]);
}
function srLookBox(l,g,st,f){
  var T=Math.max(topSpeed(l),1),TM=Math.max(C.TOP0+0.85*l.cap,1);
  if(!st.go&&!knowsWidth(l,l.gi)){ if(l.v*l.v/(2*decOf(l))>g.x-l.x-8){ st.go=true; return sgInp(1,[20,50,30],{fwd:true}); } return srStop(l,g,15,[30,70,0]); }
  if(!st.go&&sgClearAt(l,g,TM)!==0&&heightOf(l)<l.cap-0.01){ return srStop(l,g,40,[0,100,0]); }
  var inp=sgPlanKnown(l,g,st);
  if(inp.fwd){ var vcl=sgCleanSpeed(l,g,TM); if(vcl<Infinity&&vcl<=T){ return sgInp(Math.min(1,vcl/T),[30,70,0]); } }
  return inp;
}
SGC['sr-look']=function(l){ return srLookCruise(l,0.9); };
SGP['sr-look']=function(l,g,st){ return srLookBox(l,g,st,0.9); };
/* sr-lookslow: sr-look cruising at 75% (the Careful rival on Six Unknown Boxes) */
SGC['sr-lookslow']=function(l){ return srLookCruise(l,0.75); };
SGP['sr-lookslow']=function(l,g,st){ return srLookBox(l,g,st,0.75); };
/* sr-care: the round 1 looker (sight-safe cruise, stop to see, build height first). Kept as a posture on Six Unknown Boxes */
SGC['sr-care']=function(l){ return srSightPace(l,0.95,40); };
SGP['sr-care']=srLookOld;
/* sr-pcare: sr-pace at every barrier and the box behind it; at a box with no barrier before it, floor it only if that clears clean,
   otherwise build and take a run-up for a clean crossing (never a near miss it can avoid). The Careful rival on The Last Box */
function srPcare(l,g,st){
  if(srBarFirst(l,g)){ return srPaced(l,1); }
  if(l.jt>=0&&!st.go){ return sgInp(Math.min(1,l.v/Math.max(topSpeed(l),1)),[20,50,30]); }
  if(st.go||sgClearAt(l,g,Math.max(topSpeed(l,true),1))===0){ st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return sgPlanKnown(l,g,st);
}
SGC['sr-pcare']=SGC['sr-pace']; SGP['sr-pcare']=srPcare; NOPEEK['sr-pcare']=1;
/* sr-last: as sr-pcare, except at the last box, with two or more strikes left and a scrape (not a fall) in reach, it floors it */
SGC['sr-last']=SGC['sr-pace'];
SGP['sr-last']=function(l,g,st){
  var last=l.gi===G.gaps.length-1,spare=strikesOf(l)-l.strikes>=2;
  if(st.spend||(last&&spare&&!srBarFirst(l,g)&&knowsWidth(l,l.gi)&&sgClearAt(l,g,Math.max(topSpeed(l,true),1))===1)){ st.spend=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return srPcare(l,g,st);
};
NOPEEK['sr-last']=1;
/* sr-early: spends its spare strikes early, at unseen boxes and at boxes it would scrape */
SGC['sr-early']=SGC['sr-last'];
SGP['sr-early']=function(l,g,st){
  var spare=strikesOf(l)-l.strikes>=2,unknown=!knowsWidth(l,l.gi);
  if(st.spend||(spare&&(unknown||sgClearAt(l,g,Math.max(topSpeed(l,true),1))===1))){ st.spend=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return srPcare(l,g,st);
};
NOPEEK['sr-early']=1;

LESSONS.push({key:'sr-landing',lesson:'Small risks add up to ruin',title:'Still in the Air',strategy:'sr-pace',
  q:'Four barriers, each with a narrow box just behind it. Every box looks easy. Do you slow down for any of them?',
  meta:'A near miss you can survive, taken again and again, is a ruin you cannot.',
  look:'Fly a barrier fast and you are still in the air when the box arrives, with no jump left: a scrape. Slow down and you land, jump again and clear it.',
  labs:[{x:0,pts:[20,70,60]},RIV('sr-fast','Rush',-12,[20,70,60]),RIV('sr-steady','Steady',-24,[20,70,60])],
  track:function(r){ var bars=[],gaps=[],x=300,k,says=[];
    for(k=0;k<4;k++){ var cp=C.CAPS[k],D=Math.round(38+8*r()),g=segBox(x+D,cp-12,1,{odds:5,cap:cp}); g.W=Math.round(15+15*r()); bars.push(segBar(x,cp+2)); gaps.push(g); says.push(D+'/'+g.W); x=g.x+g.W+300; }
    return {bars:bars,gaps:gaps,finish:x-120,note:'Barrier-to-box / box width: '+says.join(', ')}; },
  postures:['sr-fast','sr-pace','rush','build'],
  claim:{text:'Pacing wins and rushing dissolves',score:function(t){ return t['sr-pace'].win-t['sr-fast'].win; },need:30}});

LESSONS.push({key:'sr-odds',lesson:'Small risks add up to ruin',title:'Six Unknown Boxes',strategy:'sr-look',
  q:'Six boxes. Most are narrow; about one in five is wide. You cannot tell which until you are close and standing tall. Careful and Build are behind you and both look before they jump.',
  meta:'One in five is a small risk. Six of them in a row is not.',
  look:'Each box is probably narrow, so jumping blind usually works, once. Six times, it usually does not. Slow down near each box until you can see its far edge, cross the narrow ones at once, and stop to build for the wide one.',
  /* round 2 (2026-10-31): You lead, so no rival crosses first to narrow a box or show its width. Each box rises 25 below the ceiling
     a lab has when it reaches it, so the far edge shows only from close up at full height (a lab holding back 270 to wait cannot see
     it). Widths are fractions of the widest clean crossing at full height and speed min(top, 130): narrow 70 to 78%, wide (one in
     five) 95 to 98%, which needs a stop to build. Boxes 420 apart. The rivals look too: Careful (sr-lookslow) 60 behind, Build (the
     stock build posture) 90 behind */
  labs:[{x:0,pts:[30,40,50]},RIV('sr-lookslow','Careful',-60,[10,50,70]),RIV('build','Build',-90,[10,50,70])],
  track:function(r){ var gaps=[],x=330,k,ws=[];
    for(k=0;k<6;k++){ var cp=C.CAPS[k],rise=cp-25,R=srReach(cp,Math.min(C.TOP0+0.85*cp,130),rise),wide=r()<0.2;
      var g=segBox(x,rise,1,{odds:5,cap:cp}); g.W=Math.round(R*(wide?0.95+0.03*r():0.7+0.08*r())); g.f=wide?'wide':'narrow'; gaps.push(g); ws.push(g.W+(wide?' wide':'')); x=g.x+g.W+420; }
    return {bars:[],gaps:gaps,finish:x-420+180,note:'Widths: '+ws.join(', ')}; },
  postures:['sr-fast','sr-look','build'],
  claim:{text:'Looking wins more than rushing, and rushing rarely survives all six',score:function(t){ return t['sr-look'].win-t['sr-fast'].win; },need:30}});

LESSONS.push({key:'sr-lastbox',lesson:'Small risks add up to ruin',title:'The Last Box',strategy:'sr-last',
  q:'Four barriers, each with a small box just behind it, then one last wide box with the finish right behind it. Careful starts just ahead of you, fully built, and never takes a near miss it can avoid. Is any near miss worth taking?',
  meta:'A near miss costs you because the race goes on. When nothing is left to repeat, the same risk is a different bet.',
  look:'Fly a barrier fast and you scrape the box behind it, and scrapes add up to ruin. The last box is too wide to clear clean without stopping, backing up and building speed. You can see a scrape is in reach, and there is no next box.',
  /* round 2 (2026-10-31): boxes 1 to 4 are Still in the Air pairs (the near misses that compound); the last box is shown, sits 800
     past the fourth so a run-up fits, and is sized from a lab at height 145 and speed meter 90 (what a paced lab arrives with): 40% of the
     way from the widest clean crossing to the widest scrape. Careful (sr-pcare) starts 40 ahead with speed already at the ceiling */
  labs:[{x:0,pts:[20,70,60]},RIV('sr-pcare','Careful',40,[20,70,70]),RIV('sr-fast','Rush',-12,[20,70,60])],
  track:function(r){ var bars=[],gaps=[],x=300,k,says=[];
    for(k=0;k<4;k++){ var cp=C.CAPS[k],D=Math.round(38+8*r()),g=segBox(x+D,cp-12,1,{odds:5,cap:cp}); g.W=Math.round(15+15*r()); bars.push(segBar(x,cp+2)); gaps.push(g); says.push(D+'/'+g.W); x=g.x+g.W+300; }
    x+=500;
    var c5=C.CAPS[4],rise=c5-25,vr=C.TOP0+0.85*90,c=srReach(145,vr,rise),sv=c; while(sv<1500&&segOut(vr,145,sv,rise)<2){ sv++; }
    var g5=segBox(x,rise,1,{odds:5,cap:c5,shown:true}); g5.W=Math.round(c+0.4*(sv-c)); gaps.push(g5); says.push('last '+g5.W);
    return {bars:bars,gaps:gaps,finish:g5.x+g5.W+40,note:'Barrier-to-box / box width: '+says.join(', ')}; },
  postures:['sr-fast','sr-pcare','sr-early','sr-last'],
  claim:{text:'Spending one near miss at the last box wins; caution everywhere loses to Careful; rushing everywhere is ruin',score:function(t){ return Math.min(t['sr-last'].win-t['sr-pcare'].win,t['sr-last'].win-t['sr-fast'].win); },need:30}});
