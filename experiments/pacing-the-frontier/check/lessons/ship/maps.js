/* ---- SHIP: the campaign. Nine hand-built maps in three acts, three dailies. No generator. Laid out by hand from the segment equations and judged by
   playing, not by bots. Bots here are guard rails only (ship/bench.mjs). Build: node build.mjs --only campaign+ship (uses cp* helpers from campaign/).
   m.act, m.slot: place in the campaign. m.daily: 1..3. SHIP_ORDER, SHIP_DAILIES: the keys in order. Every map uses the soft ceiling.
   [[ai gen]] Status of each map is in ship/NOTES.md. Nothing here is human_validated. ---- */

/* ---- road: a list of obstacles, each `d` past the end of the one before. {d,bar:h,pub} a wall; {d,rise,W,odds,capTo,shade,pub} a box ---- */
function shRoad(items,after,note){
  var bars=[],gs=[],x=0,i,o,g,cap=70;
  for(i=0;i<items.length;i++){ o=items[i]; x+=o.d;
    if(o.bar!==undefined){ g=segBar(x,o.bar); if(o.pub){ g.pub=true; } bars.push(g); }
    else { g=cpBox(x,o.rise,o.W,o.odds===undefined?15:o.odds,cap); g.capTo=o.capTo===undefined?cap+15:o.capTo; cap=g.capTo; if(o.shade){ g.shade=true; } if(o.pub){ g.pub=true; } if(o.open){ g.pub=true; g.wpub=true; } gs.push(g); x=g.x+g.W; }
  }
  return {bars:bars,gaps:gs,finish:x+after,note:note||''};
}
function shLabs(P){ return [{x:0,pts:P.you,pace:1,w:[20,50,30]}].concat(P.rivals.map(function(r){ return RIV(r.post,r.name,r.x,r.pts,{pace:r.pace||1,w:r.w||[0,50,50],strikes:r.strikes||0,pat:r.pat}); })); }
var SHIP=[];
function shMap(m){ Object.defineProperty(m,'labs',{get:function(){ return shLabs(this.P); },enumerable:true,configurable:true});
  m.soft=m.soft||{n:3}; m.look=m.look||''; m.claim=m.claim||{text:'',score:function(){ return 0; },need:0};
  SHIP.push(m); LESSONS.push(m); }
function shPick(r,a){ return a[Math.floor(r()*a.length)]; }
function shShuffle(r,a){ var b=a.slice(),i,j,t; for(i=b.length-1;i>0;i--){ j=Math.floor(r()*(i+1)); t=b[i]; b[i]=b[j]; b[j]=t; } return b; }

/* ---- shared driving ---- */
/* the meters in split w have reached the knee */
function shFull(l,w){ var i; for(i=0;i<3;i++){ if(w[i]>0&&l.pts[i]<l.cap-0.01){ return false; } } return true; }
/* known wall ahead, reach short of it: {b, need} */
function shWall(l){ var b=G.barriers[l.bi]; if(!b||b.x<=l.x||!knowsBar(l,l.bi)){ return null; } var need=b.h+1-C.JUMP-heightOf(l); return need>0?{b:b,need:need}:null; }
/* run so that the height arrives by the wall: slow to the pace that buys `need` over the road left, on the curve that can stop at it */
function shWallPace(l,wl){ var d=wl.b.x-l.x,T=Math.max(topSpeed(l),1),vs=cpStopV(l,wl.b.x,14),t=wl.need/K.invest,p=clamp(1-t/Math.max(t+d/T,0.01),0,1); return Math.min(p,cpPace(l,vs)); }
/* a planted wall at the next box face, too tall to jump: wait behind it and grow */
function shTower(l){ var g=G.gaps[l.gi]; return g&&towerOf(l,g)&&heightOf(l)+C.JUMP<g.stepH+2?g:null; }
/* the box's width is known (or believed, W): stand, build what it needs, back up if the run-up is short, go. Soft ceiling: standing always buys more */
function shPlan(l,g,st,W,fw){
  if(st.go){ return cpFloor(l,fw); }
  var d=g.x-l.x,h=heightOf(l),T=cpTopAt(l,l.pts[2])*0.98,Wm=W*1.05+2,vn=cpVNeed(h,Wm,g.rise,T),acc=accOf(l)*0.9;
  if(vn===Infinity){
    if(l.v*l.v/(2*decOf(l))>d-8&&l.v>2){ st.go=true; return cpFloor(l,fw); }
    if(d>60){ return sgInp(Math.min(0.6,cpPace(l,cpStopV(l,g.x,14))),[0,60,40]); }  /* still far off: come closer while building */
    return sgInp(0,[0,100,0]);  /* standing at the face: height, it needs no run-up */
  }
  var target=Math.min(vn*1.03,T),reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(reach>=target){ st.go=true; return cpFloor(l,fw); }
  if(l.v>1&&!st.rev){ return sgInp(0,[0,100,0]); }
  if(l.x>backLimit(l)+2&&d<target*target/(2*acc)+15){ st.rev=true; return sgInp(0,[0,100,0],{rev:true}); }
  st.go=true; return cpFloor(l,fw);
}
/* a seen box: known, plan. Seen more than it can clear, stop and plan. Otherwise hold the braking curve (eyes) or floor it until it knows (bold) */
function shBox(l,g,st,w,bold){
  if(st.go){ return cpFloor(l,w); }
  var known=knowsWidth(l,l.gi);
  if(known&&!st.stop){ var T0=Math.max(topSpeed(l),1); if(cpOut(T0*0.98,heightOf(l),gapWidth(l,g)*1.05+2,g.rise)===0&&Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*accOf(l)*0.9*Math.max(g.x-l.x-8,0))>=T0*0.98){ st.go=true; return cpFloor(l,w); } }
  if(known){ return shPlan(l,g,st,gapWidth(l,g),w); }
  if(st.stop){ if(heightOf(l)+18<g.rise+6||l.v>1){ return sgInp(0,[0,100,0]); } return sgInp(0,[0,0,100],l.jt<0?{jump:true}:{}); }
  var T=Math.max(topSpeed(l),1),wc=cpWc(heightOf(l),T,g.rise)*0.95,seen=seenW(l,g,shadows(l,1));
  if(seen>wc){ if(l.v*l.v/(2*decOf(l))>g.x-l.x-8&&l.v>2){ st.go=true; return cpFloor(l,w); } st.stop=true; return sgInp(0,[0,100,0]); }
  if(bold){ return cpFloor(l,w); }
  var vmax=Math.sqrt(2*0.9*decOf(l)*Math.max(g.x-l.x-16,0));
  return vmax<T?sgInp(cpPace(l,vmax),w):sgInp(1,w,{fwd:l.v>=T-0.5});
}
/* how fast a lab may go on road it cannot see */
function shBlindV(l){ var g=G.gaps[l.gi],b=G.barriers[l.bi],seen=g&&(g.pub||l.seenG[l.gi]); if(seen){ return Infinity; } return Math.sqrt(2*0.9*decOf(l)*Math.max(cpClear(l)-30,0)); }

/* ---- PLAYER BOTS. sp-<split>-<mode>. What a person who has chosen a build might do. eyes: never outruns its sight; bold: floors it and reacts to what it
   sees; slow: the sensible cruiser, 55% pace all the way, slows for anything big. tail: sits behind the nearest lab ahead and only passes near the finish ---- */
var SH_SPLITS={h:[0,100,0],s:[0,0,100],v:[100,0,0],hs:[0,50,50],vh:[50,50,0],vs:[50,0,50],even:[34,33,33],v60:[100,0,0]};  /* v60: sight to 60 first, then height and speed */
var SH_POOL=[];
function shCruise(l,w,mode){
  var wl=shWall(l),tw=shTower(l),T=Math.max(topSpeed(l),1),vb=mode==='bold'?Infinity:shBlindV(l);
  if(tw){ return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); }
  if(wl){ return sgInp(Math.min(shWallPace(l,wl),vb/T),[0,100,0]); }
  if(mode==='slow'){ return sgInp(Math.min(0.55,vb/T),w); }
  if(!shFull(l,w)){ return sgInp(Math.min(0.7,vb/T),w); }
  return vb<T?sgInp(vb/T,w):cpFloor(l,w);
}
/* the speed that holds `gap` behind a, and can still stop there if a stops dead */
function shFollowV(l,a,gap){ var room=a.x-l.x-gap; return Math.max(0,Math.min(a.v+0.8*room,Math.sqrt(2*decOf(l)*Math.max(room,0)+Math.max(a.v,0)*Math.max(a.v,0)))); }
function shTailAhead(l){ var a=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x){ continue; } if(!a||m.x<a.x){ a=m; } } return a; }
Object.keys(SH_SPLITS).forEach(function(k){ ['eyes','bold','slow','tail','scrape'].forEach(function(mode){
  var w0=SH_SPLITS[k],name='sp-'+k+'-'+mode,w=w0; SH_POOL.push(name); NOPEEK[name]=1;
  SGC[name]=function(l){ if(k==='v60'){ w=l.pts[0]<60?[100,0,0]:[0,50,50]; }
    if(mode==='tail'){ var a=shTailAhead(l),wl=shWall(l),tw=shTower(l),T=Math.max(topSpeed(l),1);
      if(tw){ return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); }
      if(wl){ return sgInp(shWallPace(l,wl),[0,100,0]); }
      if(a&&G.finish-a.x>220){ return sgInp(clamp(shFollowV(l,a,45)/T,0,1),w); }
      return shCruise(l,w,'bold'); }
    return shCruise(l,w,mode==='scrape'?'bold':mode); };
  SGP[name]=function(l,g,st){ if(k==='v60'){ w=l.pts[0]<60?[100,0,0]:[0,50,50]; }
    if(mode==='tail'){ var a=shTailAhead(l); if(a&&a.x<g.x+g.W&&g.crossedBy<0){ var d=g.x-l.x; return sgInp(cpPace(l,Math.min(cpStopV(l,g.x,10),shFollowV(l,a,45))),w); } return shBox(l,g,st,w,true); }
    if(mode==='scrape'&&!st.go&&knowsWidth(l,l.gi)&&l.strikes<K.strikes-1&&cpOut(Math.max(topSpeed(l),1)*0.98,heightOf(l),gapWidth(l,g)*1.02,g.rise)===1){ st.go=true; return cpFloor(l,w); }
    return shBox(l,g,st,w,mode==='bold'||mode==='scrape'); };
}); });

/* spBait: build height first, get in front of the rivals and stay within their sight line so they run blind into walls, then stop at the big box */
SGC.spBait=function(l){ var i,m,near=-1,T=Math.max(topSpeed(l),1),w=[0,70,30],c=shCruise(l,w,'bold'); for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m!==l&&!m.out&&m.x<l.x&&(near<0||m.x>near)){ near=m.x; } }
  if(near>=0&&l.x-near>170&&G.barriers[l.bi]&&G.barriers[l.bi].x>l.x&&c){ return sgInp(Math.min(c.pace,0.5),w); }
  var g=G.gaps[l.gi]; if(g&&(!G.barriers[l.bi]||G.barriers[l.bi].x>g.x)&&c){ return sgInp(Math.min(c.pace,cpPace(l,cpStopV(l,g.x,12))),w); } return c; };  /* past the last wall: come in on a curve that can stop at the box */
SGP.spBait=function(l,g,st){ if(st.go||knowsWidth(l,l.gi)){ return shPlan(l,g,st,gapWidth(l,g),[0,70,30]); } return sgInp(cpPace(l,cpStopV(l,g.x,12)),[0,100,0]); };
NOPEEK.spBait=1;

/* ---- RIVALS, by temperament ---- */
/* Sprinter: floors it. Slows for a wall only once it sees it, stands and grows if it has to. Reads a box late, as cpRival */
SGC.rvSprint=function(l){ var tw=shTower(l),wl=shWall(l),w=l.cpW||[0,50,50]; if(tw){ return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); } if(wl){ return sgInp(Math.min(0.5,cpPace(l,cpStopV(l,wl.b.x,14))),[0,100,0]); } if(l.basePace<1&&!shFull(l,w)){ return sgInp(l.basePace,w); } return cpFloor(l,w); };
SGP.rvSprint=function(l,g,st){
  if(st.go){ return cpFloor(l); }
  var known=knowsWidth(l,l.gi),T=Math.max(topSpeed(l),1),wc=cpWc(heightOf(l),T,g.rise)*0.97,seen=known?gapWidth(l,g):(st.seen=Math.max(st.seen||0,seenW(l,g,shadows(l,1))));
  if(!st.stop&&seen<=wc){ if(known){ st.go=true; } return cpFloor(l); }
  if(!st.stop){ if(l.v*l.v/(2*0.85*decOf(l))<g.x-l.x-16){ return cpFloor(l); } st.stop=true; }
  return known?shPlan(l,g,st,gapWidth(l,g)):sgInp(0,[0,100,0]);
};
NOPEEK.rvSprint=1;
/* Builder: floors it unless a wall needs height, which it buys just in time. Reads boxes as Reader does */
SGC.rvBuild=function(l){ return shCruise(l,l.cpW||[0,70,30],'bold'); };
SGP.rvBuild=function(l,g,st){ return shBox(l,g,st,l.cpW||[0,70,30],true); };
NOPEEK.rvBuild=1;
/* Reader: a good steady lab. Never outruns its sight, stops at what it cannot clear, builds, goes */
SGC.rvRead=function(l){ return shCruise(l,l.cpW||[30,40,30],'eyes'); };
SGP.rvRead=function(l,g,st){ return shBox(l,g,st,l.cpW||[30,40,30],false); };
NOPEEK.rvRead=1;

/* Gambler: a Sprinter that never stops for a box. It only stops for a wall it can see. Behind a taller lab it sees nothing */
SGC.rvGamble=SGC.rvSprint;
SGP.rvGamble=function(l,g,st){ return cpFloor(l,l.cpW||[0,50,50]); };
NOPEEK.rvGamble=1;
/* Steward: runs steady, stops at the face of every box it reaches, stands there building (its wall grows behind it), then crosses */
SGC.rvSteward=function(l){ return shCruise(l,l.cpW||[20,60,20],'bold'); };
SGP.rvSteward=function(l,g,st){ if(st.go){ return cpFloor(l); } var d=g.x-l.x;
  if(!st.at){ if(d>14&&l.v>0.5||d>40){ return sgInp(cpPace(l,cpStopV(l,g.x,10)),[0,100,0]); } st.at=true; st.t0=G.t; }
  if(G.t-st.t0<(l.pat||4)){ return sgInp(0,[0,100,0]); }
  return shPlan(l,g,st,gapWidth(l,g)); };
NOPEEK.rvSteward=1;
/* Shadow: never leads. Sits right behind whoever is ahead, stops when they stop, crosses when they have. It trusts the lab in front: it does not look. Past the last box it sprints */
SGC.rvShadow=function(l){ var a=shTailAhead(l),tw=shTower(l),T=Math.max(topSpeed(l),1),b=G.barriers[l.bi],wl=shWall(l),g=G.gaps[l.gi];
  if(tw){ return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); }
  if(b&&l.crashedOn[l.bi]&&wl){ return sgInp(Math.min(0.5,cpPace(l,cpStopV(l,wl.b.x,14))),[0,100,0]); }
  if(a&&(g||G.barriers[l.bi])){ return sgInp(clamp(shFollowV(l,a,55)/T,0,1),l.cpW||[0,20,80]); }
  return cpFloor(l,l.cpW||[0,20,80]); };
SGP.rvShadow=function(l,g,st){ var a=shTailAhead(l); if(a&&a.x<g.x+g.W&&!(g.crossedBy>=0)){ return SGC.rvShadow(l); } if(st.go){ return cpFloor(l); } if(g.crossedBy>=0&&cpOut(Math.max(topSpeed(l),1)*.98,heightOf(l),gapWidth(l,g)*1.05+2,g.rise)===0){ return cpFloor(l); } return shBox(l,g,st,l.cpW||[0,20,80],true); };
NOPEEK.rvShadow=1;

/* ---- ACT 1, MAP 1. THE PICKET. Tall walls, close together, no time for anything but height. A wall is a strike and it costs your speed ---- */
shMap({key:'picket',act:1,slot:1,lesson:'',title:'The Picket',strategy:'sp-h-eyes',
  P:{you:[30,20,70],rivals:[{post:'rvBuild',name:'Foreman',x:0,pts:[30,28,70],w:[0,70,30]}],first:280,gap:[170,260],hs:[58,76,92,106,118,128,138,148]},
  q:'There is a fence across the road. Then another.',
  meta:'Scaling hits a wall the size of the next data center: you buy the height or you take the crash.',
  track:function(r){ var P=this.P,mid=P.hs.slice(1,5),s=shShuffle(r,mid),hs=[P.hs[0]].concat(s,P.hs.slice(5)),it=[],i;
    for(i=0;i<hs.length;i++){ it.push({d:i?P.gap[0]+r()*(P.gap[1]-P.gap[0]):P.first,bar:hs[i]}); if(i===3){ it.push({d:120,rise:12,W:40,odds:10,capTo:95}); } }
    return shRoad(it,160,'Walls in this order: '+hs.join(', ')+'.'); }});

/* ---- ACT 1, MAP 2. LONG SIGHT. A flat sea of low boxes. Most are narrow. Some are three times as wide, and from the ground they look the same ---- */
shMap({key:'long-sight',act:1,slot:2,lesson:'',title:'Long Sight',strategy:'sp-v60-eyes',
  P:{you:[10,45,45],rivals:[{post:'rvRead',name:'Survey',x:-30,pts:[35,45,45],w:[25,35,40]}],n:7,gap:[320,460],fn:[42,62],fw:[104,116],pw:0.4,odds:30},
  q:'The road ahead looks flat.',
  meta:'Whether a risk is small or huge is the thing you cannot see from where you are: evaluations are how you see further.',
  track:function(r){ var P=this.P,it=[],i,wide=[],nw=0; for(i=0;i<P.n;i++){ var w=r()<P.pw&&i>0; if(w&&nw>=3){ w=false; } if(i===P.n-1&&nw===0){ w=true; } if(w){ nw++; } wide.push(w);
      it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:6,W:w?P.fw[0]+r()*(P.fw[1]-P.fw[0]):P.fn[0]+r()*(P.fn[1]-P.fn[0]),odds:P.odds,capTo:70+i*6}); }
    return shRoad(it,70,nw+' of the '+P.n+' boxes were wide.'); }});

/* ---- ACT 1, MAP 3. ELBOWS. Tiny boxes as fast as you can read them, three labs at your elbow. One box in the run is a pothole, and it is in a different place every time ---- */
shMap({key:'elbows',act:1,slot:3,lesson:'',title:'Elbows',strategy:'sp-s-bold',
  P:{you:[12,30,42],rivals:[{post:'rvSprint',name:'Kite',x:30,pts:[12,30,60],pace:0.85,w:[0,20,80]},{post:'rvSprint',name:'Rook',x:-18,pts:[12,34,58],pace:0.85,w:[0,40,60]},{post:'rvGamble',name:'Jack',x:-40,pts:[12,28,56],pace:0.88,w:[0,10,90]}],n:11,gap:[130,250],W:[26,44],pot:[86,100],odds:10},
  q:'Everybody leaves at once.',
  meta:'In a close race every second you spend looking is a second somebody else is not. Most of the time, they are right.',
  track:function(r){ var P=this.P,it=[],i,pot=4+Math.floor(r()*(P.n-5)); for(i=0;i<P.n;i++){ it.push({d:i===pot?430:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:8+Math.floor(r()*7),W:i===pot?P.pot[0]+r()*(P.pot[1]-P.pot[0]):P.W[0]+r()*(P.W[1]-P.W[0]),odds:P.odds,capTo:70+i*5,pub:i===pot}); }
    return shRoad(it,120,'The wide one was box '+(pot+1)+' of '+P.n+'.'); }});

/* ---- ACT 2, MAP 1. THE STEWARD. A lab ahead stops at the face of every box and its wall grows while it stands. Behind it you need its height. Ahead of it you need its nerve ---- */
shMap({key:'steward',act:2,slot:1,lesson:'',title:'The Steward',strategy:'sp-vh-eyes',
  P:{you:[30,30,50],rivals:[{post:'rvSteward',name:'Warden',x:420,pts:[40,45,60],pat:2.5,w:[20,50,30]}],n:6,gap:[340,480],rise:[28,44],W:[58,108],odds:25},
  q:'Someone is ahead of you, taking their time.',
  meta:'A careful lab makes the road safer for whoever follows it, and raises the bar they must clear. You can shelter behind it or pass it, not both.',
  track:function(r){ var P=this.P,it=[],i; for(i=0;i<P.n;i++){ it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:P.rise[0]+r()*(P.rise[1]-P.rise[0]),W:P.W[0]+r()*(P.W[1]-P.W[0]),odds:P.odds,capTo:70+i*10}); }
    return shRoad(it,110,'Box widths: '+it.map(function(o){ return Math.round(o.W); }).join(', ')+'.'); }});

/* ---- ACT 2, MAP 2. TAKEOFF. Pebbles, pebbles, pebbles. Then the road stands up, at a place you cannot predict. It turns once, and the build that won the first half loses the second ---- */
shMap({key:'takeoff',act:2,slot:2,lesson:'',title:'Takeoff',strategy:'sp-hs-eyes',
  P:{you:[20,25,50],rivals:[{post:'rvSprint',name:'Volt',x:20,pts:[15,20,55],pace:0.95,w:[0,10,90]},{post:'rvRead',name:'Anchor',x:-120,pts:[30,45,45],w:[20,50,30]}],n:[2,4],gap:[260,360],tower:{rise:80,W:62,odds:25,capTo:125},wall:125,b2:{rise:60,W:70,odds:30,capTo:150},b3:{rise:30,W:96,odds:30,capTo:170}},
  q:'A quiet start.',
  meta:'Capability looks like pebbles until the day it does not. Everything you skipped while it was easy comes due at once.',
  track:function(r){ var P=this.P,it=[],i,n=P.n[0]+Math.floor(r()*(P.n[1]-P.n[0]+1)); for(i=0;i<n;i++){ it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:10,W:36+r()*18,odds:10,capTo:70+i*4}); }
    it.push({d:400,rise:P.tower.rise,W:P.tower.W,odds:P.tower.odds,capTo:P.tower.capTo,shade:true,pub:true});
    it.push({d:230+r()*60,bar:P.wall,pub:true});
    it.push({d:300,rise:P.b2.rise,W:P.b2.W+r()*10,odds:P.b2.odds,capTo:P.b2.capTo,pub:true});
    it.push({d:330,rise:P.b3.rise,W:P.b3.W+r()*10,odds:P.b3.odds,capTo:P.b3.capTo});
    return shRoad(it,260,'The road turned after '+n+' pebbles.'); }});

/* ---- ACT 2, MAP 3. RED BOX. Two gamblers ahead of you, a strike down already. At the end a box they will not stop for, with high odds. Only a wall they do not see can stop them ---- */
shMap({key:'red-box',act:2,slot:3,lesson:'',title:'Red Box',strategy:'spBait',
  P:{you:[20,35,50],rivals:[{post:'rvGamble',name:'Ace',x:50,pts:[45,15,48],pace:1,strikes:1,w:[0,30,70]},{post:'rvGamble',name:'Deuce',x:20,pts:[45,15,48],pace:1,strikes:1,w:[0,30,70]}],walls:[{h:76},{h:100},{h:120},{h:136}],gap:[300,380],first:520,red:{rise:40,W:[112,132],odds:75}},
  q:'Two labs ahead of you are not slowing down for anything.',
  meta:'One reckless lab rolls the dice for everyone. You cannot talk them out of it. You can only be in front of them when the road gets hard.',
  track:function(r){ var P=this.P,it=[],i; for(i=0;i<P.walls.length;i++){ it.push({d:i?P.gap[0]+r()*(P.gap[1]-P.gap[0]):P.first,bar:P.walls[i].h}); }
    var W=P.red.W[0]+r()*(P.red.W[1]-P.red.W[0]); it.push({d:520,rise:P.red.rise,W:W,odds:P.red.odds,capTo:110});
    return shRoad(it,170,'The red box was '+Math.round(W)+' wide.'); }});

/* ---- ACT 3, MAP 1. TRAILBREAKER. Boxes too wide for anyone to want to go first. One lab will. Let it. It pays for every box, you get every box half price, and the last stretch is long ---- */
shMap({key:'trailbreaker',act:3,slot:1,lesson:'',title:'Trailbreaker',strategy:'sp-h-tail',
  P:{you:[10,30,45],rivals:[{post:'rvRead',name:'Pioneer',x:150,pts:[50,60,50],w:[25,50,25]}],n:4,gap:[420,560],W:[106,120],rise:12,odds:40,after:520},
  q:'The boxes are enormous. Someone is already on their way.',
  meta:'Whoever goes first pays for the road. A fast follower gets most of the gain for a fraction of the cost. That is a good strategy and a bad reason to be proud.',
  track:function(r){ var P=this.P,it=[],i; for(i=0;i<P.n;i++){ it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:P.rise,W:P.W[0]+r()*(P.W[1]-P.W[0]),odds:P.odds,capTo:80+i*15}); }
    return shRoad(it,P.after,'Box widths: '+it.map(function(o){ return Math.round(o.W); }).join(', ')+'.'); }});

/* ---- ACT 3, MAP 2. THREE STRIKES. Tall boxes just past what you can clear. You can scrape any of them for a strike, twice. A third is the end. Some cannot be scraped at all ---- */
shMap({key:'three-strikes',act:3,slot:2,lesson:'',title:'Three Strikes',strategy:'sp-hs-scrape',
  P:{you:[30,50,50],rivals:[{post:'rvSprint',name:'Brink',x:50,pts:[30,50,55],pace:0.9,strikes:1,w:[0,50,50]},{post:'rvRead',name:'Ledger',x:-320,pts:[35,60,50],w:[20,45,35]}],n:6,gap:[300,440],rise:[50,66],Wn:[78,90],Wb:[126,136],pb:0.34,odds:20},
  q:'The road is full of near misses.',
  meta:'Each near miss looks affordable. You get to spend exactly two. The skill is knowing which two.',
  track:function(r){ var P=this.P,it=[],i,nb=0; for(i=0;i<P.n;i++){ var b=i>0&&r()<P.pb&&nb<2; if(b){ nb++; } it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:P.rise[0]+r()*(P.rise[1]-P.rise[0]),W:b?P.Wb[0]+r()*(P.Wb[1]-P.Wb[0]):P.Wn[0]+r()*(P.Wn[1]-P.Wn[0]),odds:P.odds,capTo:70+i*8,open:true}); }
    return shRoad(it,110,nb+' of the boxes were too wide to scrape.'); }});

/* ---- DAILY 1. THE ONLY BOX. One road, one box, one rival right behind you. The box is 40, 85 or 130 wide. Everything you do for thirty seconds is a bet on which ---- */
shMap({key:'only-box',daily:1,lesson:'',title:'The Only Box',strategy:'sp-even-eyes',
  P:{you:[45,30,40],rivals:[{post:'rvSprint',name:'Tail',x:-300,pts:[45,30,40],pace:0.85,w:[0,40,60]}],d:2200,rise:18,Ws:[50,110,150],odds:30},
  q:'There is one box on this road.',
  meta:'When there is only one decision, all the preparation is a guess about it.',
  track:function(r){ var P=this.P,W=shPick(r,P.Ws); return shRoad([{d:P.d,rise:P.rise,W:W,odds:P.odds,capTo:100}],220,'Today the box was '+W+' wide.'); }});

/* ---- DAILY 2. THE LADDER. Each box a step up from the last, each much higher ceiling only for whoever gets there first. Lead at box one or chase forever ---- */
shMap({key:'ladder',daily:2,lesson:'',title:'The Ladder',strategy:'sp-hs-bold',
  P:{you:[10,35,45],rivals:[{post:'rvSprint',name:'Climber',x:10,pts:[10,35,48],pace:0.9,w:[0,50,50]}],n:6,rise0:18,step:[16,24],gap:[340,420],W:[50,70],capStep:32,odds:20},
  q:'Up.',
  meta:'Compounding. The first lab across each step stands higher for the next. Followers get a share, and a share of a share.',
  track:function(r){ var P=this.P,it=[],i,rise=P.rise0; for(i=0;i<P.n;i++){ it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:rise,W:P.W[0]+r()*(P.W[1]-P.W[0]),odds:P.odds+i*5,capTo:70+(i+1)*P.capStep}); rise+=P.step[0]+r()*(P.step[1]-P.step[0]); }
    return shRoad(it,160,'Six steps, highest '+Math.round(rise)+'.'); }});

/* ---- DAILY 3 (the mean one). SECOND ORDER. Tall boxes you cannot see over. Behind each, a strip, and then a wall, or a worse box, or nothing at all. Charge and you pay for it twice ---- */
shMap({key:'second-order',daily:3,lesson:'',title:'Second Order',strategy:'sp-hs-eyes',
  P:{you:[30,55,50],rivals:[{post:'rvSprint',name:'Haste',x:-70,pts:[20,60,55],pace:0.92,w:[0,50,50]}],n:3,tower:{rise:96,W:52},strip:[150,210],gap:[420,520],behind:['wall','box','none'],odds:45},
  q:'You can not see what is behind that.',
  meta:'Handling a risk is not the same as thinking through what it does next.',
  track:function(r){ var P=this.P,it=[],i,says=[]; for(i=0;i<P.n;i++){ var cap=80+i*25,k=shPick(r,P.behind),s=P.strip[0]+r()*(P.strip[1]-P.strip[0]); says.push(k);
      it.push({d:P.gap[0]+r()*(P.gap[1]-P.gap[0]),rise:P.tower.rise+i*10,W:P.tower.W,odds:P.odds,capTo:cap,shade:true,pub:true});
      if(k==='wall'){ it.push({d:s,bar:128+i*14}); } if(k==='box'){ it.push({d:s,rise:64,W:96,odds:P.odds+15,capTo:cap+8}); } }
    return shRoad(it,170,'Behind the towers: '+says.join(', ')+'.'); }});

/* ---- ACT 3, MAP 3. TWO ENDINGS. The showcase map (showcase/maps.js) moved here and retuned: see NOTES.md ---- */
/* the fence is public: a wall that tall is seen from far off, so every lab knows the height it must buy */
function finBar(x,h){ var b=segBar(x,h); b.pub=true; return b; }
function finBox(x,rise,W,odds,o){ var g=cpBox(x,rise,W,odds,(o&&o.cap)||70); if(o&&o.shade){ g.shade=true; } return g; }

shMap({key:'two-endings',act:3,slot:3,lesson:'',title:'Two Endings',strategy:'finLead',
  P:{you:[40,45,50],
     rivals:[{post:'finFollow',name:'Follower',x:-640,pts:[30,45,55]}],
     a:{x:450,rise:30,n:2,gap:380,f:0.55,odds:5,caps:[85,95]},
     fence:{d:260,h1:100,gap:240,h2:114},
     ex:{d:420,rise:70,f1:0.85,strip:70,f2:0.7,odds:10,caps:[105,115]},
     tower:{d:520,rise:160,W:56,odds:5,capTo:150},
     strip:340,
     cellar:{ok:{rise:40,W:60,odds:5},bad:{rise:200,W:170,odds:60},pBad:0.5},
     after:320,soft:{n:3}},
  q:'You lead. Somewhere ahead is a box nobody can see past.',
  meta:'Two versions of the same race. In one the alignment held and the labs that slowed down lost. In the other it did not, and stopping to look was the only thing that mattered. You do not get to know which until you are standing on the strip.',
  rules:{share:90},dial:'hidden',
  track:function(r){ var P=this.P,gs=[],bars=[],x=P.a.x,i,g,c;
    function add(g,capTo){ g.capTo=capTo; gs.push(g); return g; }
    for(i=0;i<P.a.n;i++){ g=add(finBox(x,P.a.rise,P.a.f*cpFull(70,P.a.rise),P.a.odds),P.a.caps[i]); x=g.x+g.W+P.a.gap; }
    x=x-P.a.gap+P.fence.d; bars.push(finBar(x,P.fence.h1)); x+=P.fence.gap; bars.push(finBar(x,P.fence.h2));
    c=P.a.caps[P.a.n-1];
    x+=P.ex.d; g=add(finBox(x,P.ex.rise,P.ex.f1*cpFull(c,P.ex.rise),P.ex.odds,{cap:c}),P.ex.caps[0]);
    x=g.x+g.W+P.ex.strip; g=add(finBox(x,P.ex.rise,P.ex.f2*cpFull(P.ex.caps[0],P.ex.rise),P.ex.odds,{cap:P.ex.caps[0]}),P.ex.caps[1]);
    x=g.x+g.W+P.tower.d; g=add(finBox(x,P.tower.rise,P.tower.W,P.tower.odds,{shade:true}),P.tower.capTo); g.pub=true;  /* a box that tall is seen from far off; its width is not */
    var bad=r()<P.cellar.pBad,cl=bad?P.cellar.bad:P.cellar.ok;
    x=g.x+g.W+P.strip; g=add(finBox(x,cl.rise,cl.W,cl.odds),P.tower.capTo);
    return {bars:bars,gaps:gs,finish:g.x+g.W+P.after,note:bad?'The cellar did not hold: tall and wide.':'The cellar held: low and narrow.'}; },
  });

/* POSTURES for Two Endings (soft ceiling: a meter keeps growing past the knee, ever slower, so "full" means only "at the knee").
   finReady: height and speed enough to clear a box FIN_GUESS wide, the width a lab that cannot see a tall box plans for. */
var FIN_GUESS=60;
function finReady(l,g,W){ return cpVNeed(heightOf(l),W*1.05+2,g.rise,cpTopAt(l,l.pts[2])*0.98)!==Infinity; }
/* brake to a box's face; null once there */
function finFace(l,g,st){ var d=g.x-l.x; if(!st.at){ if(d>14&&l.v>0.5||d>40){ return sgInp(cpPace(l,cpStopV(l,g.x,10)),[0,100,0]); } st.at=true; } return null; }
/* stand at the face: speed to the knee, then height until the box (guessed or known width W) can be cleared */
/* past the box's rise, width is bought with speed (a longer jump), not height (height past the rise only buys a short sink) */
function finBuild(l,g,W){ if(finReady(l,g,W)){ return null; } return sgInp(0,l.pts[2]<l.cap-0.01?[0,60,40]:(heightOf(l)<g.rise+15?[0,100,0]:[0,0,100])); }
/* the tower is public: a racer grows into it on the way, running at 60% (a meter grows while a lab runs below its top speed) */
function finGrowTo(l){ var g=G.gaps[l.gi]; if(g&&g.shade&&g.pub&&g.x>l.x&&!finReady(l,g,FIN_GUESS)){ return sgInp(Math.min(0.6,cpPace(l,cpStopV(l,g.x,10))),l.pts[2]<l.cap-0.01?[0,60,40]:[0,100,0]); } return null; }
/* finFollow, the rival: a racer, not a fool. It slows to buy the height a wall it knows of asks for and reads ordinary boxes as cpRival does
   (brakes late, builds what it needs). At a box it cannot see over it stops, builds until it could clear a box FIN_GUESS wide, and runs: it
   never looks behind the tower. */
SGC.finFollow=function(l){ var g=G.gaps[l.gi];
  if(g&&towerOf(l,g)&&heightOf(l)+C.JUMP<g.stepH+2){ return sgInp(cpPace(l,cpStopV(l,stepX(g),10)),[0,100,0]); }  /* a wall it cannot jump: wait behind it and grow */
  return finGrowTo(l)||SGC.cpRival(l); };
SGP.finFollow=function(l,g,st){
  if(!g.shade){ return SGP.cpRival(l,g,st); }
  if(st.go){ return cpFloor(l); }
  return finFace(l,g,st)||finBuild(l,g,FIN_GUESS)||cpPlan(l,g,st,FIN_GUESS);
};
NOPEEK.finFollow=1;
/* finLead, the lesson. Cruise as max-out with eyes: height and speed at 70% up to the knee, then floor it, slowing for walls and for what it
   sees. At the tower: stop at its face (your wall goes up and grows with you), build until you could cross it, then hop to look over it.
   Nothing tall behind: run it as a racer would. Something taller than you: cross only as fast as it needs, stop on the strip (a wall goes up at
   the face of what is behind, and grows while you build), build until you can clear it, back up, go. */
SGC.finLead=function(l){ var w=[0,50,50],r=cpCruise(l,w),gr=finGrowTo(l); if(gr&&r&&r.pace>=gr.pace){ return gr; } if(r&&r.pace>=1&&(l.pts[1]<l.cap-0.01||l.pts[2]<l.cap-0.01)){ return sgInp(0.7,w); } return r; };
SGP.finLead=function(l,g,st){
  var b;
  if(!g.shade){
    if(st.go){ return cpFloor(l); }
    if(!st.tall&&g.rise<=heightOf(l)){ return cpReadBox(l,g,st,[0,50,50]); }
    /* a box taller than you: stop at its face (your wall goes up and grows), climb until you see its far edge, build until you can clear it,
       then back up and go */
    st.tall=true; b=finFace(l,g,st); if(b){ return b; }
    if(!knowsWidth(l,l.gi)){ return sgInp(0,[0,100,0]); }
    /* the broken cellar cannot be cleared clean by anyone: build until a jump lands at all, take the strike. Back up for the run-up first */
    if(gapWidth(l,g)>=150){ var Tb=cpTopAt(l,l.pts[2])*0.98,rch=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*accOf(l)*0.9*Math.max(g.x-l.x-8,0)); if(cpOut(Tb,heightOf(l),gapWidth(l,g)+6,g.rise)>1){ return sgInp(0,[0,100,0]); } if(st.run||rch>=Tb*0.97||l.x<=backLimit(l)+2){ st.run=true; return cpFloor(l); } return sgInp(0,[0,100,0],{rev:true}); }
    return finBuild(l,g,gapWidth(l,g))||cpPlan(l,g,st,gapWidth(l,g));
  }
  var d=g.x-l.x,nx=G.gaps[l.gi+1];
  if(st.go){ return st.slow?sgInp(cpPace(l,st.slow),[0,100,0]):cpFloor(l); }
  b=finFace(l,g,st)||finBuild(l,g,FIN_GUESS); if(b){ return b; }
  if(st.bad===undefined&&nx&&sightRange(l)<nx.x-l.x+20){ return sgInp(0,[100,0,0]); }  /* sight to reach past the tower */
  if(st.bad===undefined){
    if(nx&&l.seenG[l.gi+1]&&l.jt<0){ st.bad=nx.rise>heightOf(l)+10; }
    else { if(l.jt<0&&!st.hops){ st.hops=1; return sgInp(0,[0,0,100],{jump:true}); } if(l.jt<0&&st.hops){ st.bad=false; } return sgInp(0,[0,0,100]); }
  }
  if(!st.bad){ return cpPlan(l,g,st,FIN_GUESS); }
  var T=cpTopAt(l,l.pts[2]),vn=cpVNeed(heightOf(l),FIN_GUESS*1.05+2,g.rise,T*0.98);
  if(vn===Infinity){ vn=T*0.98; }
  var target=Math.min(vn*1.06,T),acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(reach>=target){ st.go=true; st.slow=target; return sgInp(cpPace(l,target),[0,100,0]); }
  if(l.x>backLimit(l)+2){ return sgInp(0,[0,100,0],{rev:true}); }
  st.go=true; st.slow=target; return sgInp(cpPace(l,target),[0,100,0]);
};
NOPEEK.finLead=1;

var SHIP_ORDER=SHIP.filter(function(m){ return m.act; }).sort(function(a,b){ return a.act-b.act||a.slot-b.slot; }).map(function(m){ return m.key; });
var SHIP_DAILIES=SHIP.filter(function(m){ return m.daily; }).sort(function(a,b){ return a.daily-b.daily; }).map(function(m){ return m.key; });
