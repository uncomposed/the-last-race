/* ---- small-risks: Small risks add up to ruin (Taleb et al. 2014; disputed by Sunstein 2005). See NOTES.md. ---- */
/* postures (prefix sr-):
     sr-fast   cruise flat out; at a box, floor it (rush that never eases off)
     sr-pace   cruise flat out, but brake before a barrier with a box close behind it, to a speed that lands before the box face
     sr-steady as sr-pace at 85% of top speed (the Steady rival)
     sr-look   cruise no faster than it could stop within clear sight; stop at a box until it can see the width; build height if
               flooring it would not clear clean; never takes a near miss on purpose
     sr-care   as sr-look, cruising a little faster (the Careful rival)
     sr-early  as sr-care, but while two or more strikes are left it floors any box that is unseen or would be a scrape
     sr-last   as sr-care, but at the last box, with two or more strikes left and a scrape (not a fall) in reach, it floors it */
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
/* at the box: hold speed while still in the air from the barrier (speeding up mid-air stretches the landing past the face), then floor it */
SGP['sr-pace']=function(l,g,st){ if(l.jt>=0){ return sgInp(Math.min(1,l.v/Math.max(topSpeed(l),1)),[20,50,30]); } return sgInp(1,[20,50,30],{fwd:true}); };
SGC['sr-steady']=function(l){ return srPaced(l,0.85); };
SGP['sr-steady']=function(l,g,st){ if(l.jt>=0){ return sgInp(Math.min(0.85,l.v/Math.max(topSpeed(l),1)),[20,50,30]); } return sgInp(0.85,[20,50,30]); };
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
SGC['sr-look']=function(l){ return srSightPace(l,0.9,120); };
SGP['sr-look']=function(l,g,st){
  if(!st.go&&!knowsWidth(l,l.gi)){ return srStop(l,g,15,[30,70,0]); }
  /* too wide to clear clean at its top speed as it stands: stop and build height first (cheaper than speed), then plan */
  if(!st.go&&sgClearAt(l,g,Math.max(topSpeed(l,true),1))!==0&&heightOf(l)<l.cap-0.01){ return srStop(l,g,40,[0,100,0]); }
  return sgPlanKnown(l,g,st);
};
/* sr-care: as sr-look, cruising faster (it expects to see widths early). sr-last: as sr-care, except at the last box, if a strike is
   to spare (two or more left) and flooring it would be a scrape rather than a fall, it floors it and takes the scrape */
SGC['sr-care']=function(l){ return srSightPace(l,0.95,40); };
SGP['sr-care']=SGP['sr-look'];
SGC['sr-last']=SGC['sr-care'];
SGP['sr-last']=function(l,g,st){
  var last=l.gi===G.gaps.length-1,spare=strikesOf(l)-l.strikes>=2;
  if(st.spend||(last&&spare&&knowsWidth(l,l.gi)&&sgClearAt(l,g,Math.max(topSpeed(l,true),1))===1)){ st.spend=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return SGP['sr-care'](l,g,st);
};
/* sr-early: spends its spare strikes early, at unseen boxes and at boxes it would scrape */
SGC['sr-early']=SGC['sr-care'];
SGP['sr-early']=function(l,g,st){
  var spare=strikesOf(l)-l.strikes>=2,unknown=!knowsWidth(l,l.gi);
  if(st.spend||(spare&&(unknown||sgClearAt(l,g,Math.max(topSpeed(l,true),1))===1))){ st.spend=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return SGP['sr-care'](l,g,st);
};

LESSONS.push({key:'sr-landing',lesson:'Small risks add up to ruin',title:'Still in the Air',
  q:'Four barriers, each with a narrow box just behind it. Every box looks easy. Do you slow down for any of them?',
  meta:'A near miss you can survive, taken again and again, is a ruin you cannot.',
  look:'Fly a barrier fast and you are still in the air when the box arrives, with no jump left: a scrape. Slow down and you land, jump again and clear it.',
  labs:[{x:0,pts:[20,70,60]},RIV('sr-fast','Rush',-12,[20,70,60]),RIV('sr-steady','Steady',-24,[20,70,60])],
  track:function(r){ var bars=[],gaps=[],x=300,k,says=[];
    for(k=0;k<4;k++){ var cp=C.CAPS[k],D=Math.round(38+8*r()),g=segBox(x+D,cp-12,1,{odds:5,cap:cp}); g.W=Math.round(15+15*r()); bars.push(segBar(x,cp+2)); gaps.push(g); says.push(D+'/'+g.W); x=g.x+g.W+300; }
    return {bars:bars,gaps:gaps,finish:x-120,note:'Barrier-to-box / box width: '+says.join(', ')}; },
  postures:['sr-fast','sr-pace','rush','build'],
  claim:{text:'Pacing wins and rushing dissolves',score:function(t){ return t['sr-pace'].win-t['sr-fast'].win; },need:30}});

LESSONS.push({key:'sr-odds',lesson:'Small risks add up to ruin',title:'Six Unknown Boxes',
  q:'Six boxes of the same height. Most are narrow. Now and then one is wide. You cannot tell which until you are close and tall enough to see.',
  meta:'One in five is a small risk. Six of them in a row is not.',
  look:'Rush floors it at every box and is blind every time. Slowing to see costs a second a box. Count the boxes before you decide.',
  labs:[{x:0,pts:[30,35,70]},RIV('sr-fast','Rush',-12,[30,35,70]),RIV('sr-fast','Dash',-24,[30,35,70])],
  track:function(r){ var gaps=[],x=330,k,ws=[];
    for(k=0;k<6;k++){ var wide=r()<0.2,g=segBox(x,45,1,{odds:5}); g.W=Math.round(wide?95+8*r():44+18*r()); g.f=wide?'wide':'narrow'; gaps.push(g); ws.push(g.W); x=g.x+g.W+450; }
    return {bars:[],gaps:gaps,finish:x-270,note:'Widths: '+ws.join(', ')}; },
  postures:['sr-fast','sr-look','sr-care'],
  claim:{text:'Looking wins more than rushing, and rushing rarely survives all six',score:function(t){ return t['sr-look'].win-t['sr-fast'].win; },need:30}});

LESSONS.push({key:'sr-lastbox',lesson:'Small risks add up to ruin',title:'The Last Box',
  q:'Five boxes. Careful is just ahead of you and stops whenever it cannot clear clean. Rushing every box is ruin. Is any near miss worth taking?',
  meta:'A near miss costs you because the race goes on. When nothing is left to repeat, the same risk is a different bet.',
  look:'A scrape costs height and a strike. Early on, you pay for both again at the next box. At the last box there is no next box.',
  labs:[{x:0,pts:[60,35,70]},RIV('sr-care','Careful',40,[60,35,70]),RIV('sr-fast','Rush',-12,[60,35,70])],
  track:function(r){ var gaps=[],x=400,k,ws=[];
    for(k=0;k<5;k++){ var g=segBox(x,45,1,{odds:5,shown:k===4}); g.W=Math.round(k<4?72+6*r():104+6*r()); gaps.push(g); ws.push(g.W); x=g.x+g.W+(k<3?450:550); }
    return {bars:[],gaps:gaps,finish:gaps[4].x+gaps[4].W+40,note:'Widths: '+ws.join(', ')}; },
  postures:['sr-fast','sr-care','sr-early','sr-last'],
  claim:{text:'Spending one near miss at the last box wins; caution everywhere loses to Careful; rushing everywhere is ruin',score:function(t){ return Math.min(t['sr-last'].win-t['sr-care'].win,t['sr-last'].win-t['sr-fast'].win); },need:30}});
