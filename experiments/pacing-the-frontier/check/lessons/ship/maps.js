/* ---- SHIP: the campaign. Nine hand-built maps in three acts, three dailies. No generator. Laid out by hand from the segment equations and judged by
   playing, not by bots. Bots here are guard rails only (ship/bench.mjs). Build: node build.mjs --only campaign+ship (uses cp* helpers from campaign/).
   m.act, m.slot: place in the campaign. m.daily: 1..3. SHIP_ORDER, SHIP_DAILIES: the keys in order. Every map uses the soft ceiling.
   [[ai gen]] Status of each map is in ship/NOTES.md. Nothing here is human_validated. ---- */

/* ---- road: a list of obstacles, each `d` past the end of the one before. {d,bar:h,pub} a wall; {d,rise,W,odds,capTo,shade,pub} a box ---- */
function shRoad(items,after,note){
  var bars=[],gs=[],x=0,i,o,g,cap=70;
  for(i=0;i<items.length;i++){ o=items[i]; x+=o.d;
    if(o.bar!==undefined){ g=segBar(x,o.bar); if(o.pub){ g.pub=true; } bars.push(g); }
    else { g=cpBox(x,o.rise,o.W,o.odds===undefined?15:o.odds,cap); g.capTo=o.capTo===undefined?cap+15:o.capTo; cap=g.capTo; if(o.shade){ g.shade=true; } if(o.pub){ g.pub=true; } gs.push(g); x=g.x+g.W; }
  }
  return {bars:bars,gaps:gs,finish:x+after,note:note||''};
}
function shLabs(P){ return [{x:0,pts:P.you,pace:1,w:[20,50,30]}].concat(P.rivals.map(function(r){ return RIV(r.post,r.name,r.x,r.pts,{pace:r.pace||1,w:r.w||[0,50,50],strikes:r.strikes||0}); })); }
var SHIP=[];
function shMap(m){ Object.defineProperty(m,'labs',{get:function(){ return shLabs(this.P); },enumerable:true,configurable:true});
  m.soft=m.soft||{n:3}; m.look=m.look||''; m.claim=m.claim||{text:'',score:function(){ return 0; },need:0};
  m.rules=undefined; SHIP.push(m); LESSONS.push(m); }
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
    return sgInp(0,(l.pts[2]<l.cap-0.01&&d>120)?[0,30,70]:[0,100,0]);  /* standing at the face: height, it needs no run-up */
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
function shTailAhead(l){ var a=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x){ continue; } if(!a||m.x<a.x){ a=m; } } return a; }
Object.keys(SH_SPLITS).forEach(function(k){ ['eyes','bold','slow','tail'].forEach(function(mode){
  var w0=SH_SPLITS[k],name='sp-'+k+'-'+mode,w=w0; SH_POOL.push(name); NOPEEK[name]=1;
  SGC[name]=function(l){ if(k==='v60'){ w=l.pts[0]<60?[100,0,0]:[0,50,50]; }
    if(mode==='tail'){ var a=shTailAhead(l),wl=shWall(l),tw=shTower(l),T=Math.max(topSpeed(l),1);
      if(tw){ return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); }
      if(wl){ return sgInp(shWallPace(l,wl),[0,100,0]); }
      if(a&&G.finish-a.x>220){ var v=Math.max(0,a.v+0.8*(a.x-l.x-45)); return sgInp(clamp(v/T,0,1),w); }
      return shCruise(l,w,'bold'); }
    return shCruise(l,w,mode); };
  SGP[name]=function(l,g,st){ if(k==='v60'){ w=l.pts[0]<60?[100,0,0]:[0,50,50]; }
    if(mode==='tail'){ var a=shTailAhead(l); if(a&&a.x<g.x&&g.crossedBy<0&&!a.gx){ var d=g.x-l.x; return sgInp(cpPace(l,Math.min(cpStopV(l,g.x,10),Math.max(0,a.v+0.8*(a.x-l.x-45)))),w); } return shBox(l,g,st,w,true); }
    return shBox(l,g,st,w,mode==='bold'); };
}); });

/* ---- RIVALS, by temperament ---- */
/* Sprinter: floors it. Slows for a wall only once it sees it, stands and grows if it has to. Reads a box late, as cpRival */
SGC.rvSprint=function(l){ var tw=shTower(l),wl=shWall(l),w=l.cpW||[0,50,50]; if(tw){ return sgInp(cpPace(l,cpStopV(l,stepX(tw),10)),[0,100,0]); } if(wl){ return sgInp(Math.min(0.5,cpPace(l,cpStopV(l,wl.b.x,14))),[0,100,0]); } return cpFloor(l,w); };
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

/* ---- ACT 1, MAP 1. THE PICKET. Tall walls, close together, no time for anything but height. A wall is a strike and it costs your speed ---- */
shMap({key:'picket',act:1,slot:1,lesson:'',title:'The Picket',strategy:'sp-h-eyes',
  P:{you:[30,20,70],rivals:[{post:'rvBuild',name:'Foreman',x:12,pts:[30,28,70],w:[0,70,30]}],first:280,gap:[170,260],hs:[58,76,92,106,118,128,138,148]},
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

var SHIP_ORDER=SHIP.filter(function(m){ return m.act; }).sort(function(a,b){ return a.act-b.act||a.slot-b.slot; }).map(function(m){ return m.key; });
var SHIP_DAILIES=SHIP.filter(function(m){ return m.daily; }).sort(function(a,b){ return a.daily-b.daily; }).map(function(m){ return m.key; });
