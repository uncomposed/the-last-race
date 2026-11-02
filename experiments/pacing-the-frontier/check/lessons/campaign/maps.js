/* ---- campaign (2026-11-02): the playable campaign, maps designed from the segment equations (check/segmath). Every map is a run of
   barriers and boxes whose widths are drawn from the map's own pattern: you learn a box's width only by looking (the gradual reveal from
   height and sight), and you learn the map's pattern box by box. The lesson strategy, cpRead, plays as a player who reads the road would. */

/* the jump as the page makes it: auto-jump (chill) fires 0.3 s or 6 units before the face, a hand jump at a quarter of the arc */
function cpU0(v){ var jd=jumpDur(v); return K.chill?Math.min(1,Math.max(0.3,6/Math.max(v,1))/jd):C.BOXU; }
/* 0 clean, 1 scrape, 2 fall: a lab of height h meeting a box of width w and rise `rise` at face speed v (boxOutcome, from the ground) */
function cpOut(v,h,w,rise){ v=Math.max(v,1); var jd=jumpDur(v),u0=cpU0(v),a0=h+arcY(u0),alt=a0>=rise?flightAltJ(v,h,w,u0,jd):a0-sinkRate(jd)*w/v; return alt>=rise?0:(alt>0?1:2); }
/* the widest box cleared clean at height h and face speed v */
function cpWc(h,v,rise){ if(cpOut(v,h,1,rise)!==0){ return 0; } var lo=1,hi=800,m,i; for(i=0;i<24;i++){ m=(lo+hi)/2; if(cpOut(v,h,m,rise)===0){ lo=m; } else { hi=m; } } return lo; }
/* the slowest face speed (up to T) that clears width w clean at height h; Infinity if T does not */
function cpVNeed(h,w,rise,T){ if(cpOut(T,h,w,rise)!==0){ return Infinity; } var lo=1,hi=T,m,i; for(i=0;i<22;i++){ m=(lo+hi)/2; if(cpOut(m,h,w,rise)===0){ hi=m; } else { lo=m; } } return hi; }
function cpTopAt(l,s){ return (C.TOP0+0.85*s)*(inSing(l)?K.singSpeed:1); }
function cpFloor(l,w){ return sgInp(1,w||[0,50,50],{fwd:true}); }
/* the speed from which a lab can still stop `room` short of x */
function cpStopV(l,x,room){ return Math.sqrt(2*decOf(l)*Math.max(x-l.x-room,0)); }
function cpPace(l,v){ return clamp(v/Math.max(topSpeed(l),1),0,1); }

/* the width is known: build what the box needs (height first, then speed, standing), back up for the run-up, go. A box nobody can clear even
   at the ceiling is waited out: it narrows once someone crosses it */
function cpPlan(l,g,st,W){
  if(st.go){ return cpFloor(l); }
  var d=g.x-l.x,h=heightOf(l),Tm=cpTopAt(l,l.pts[2]),acc=accOf(l)*0.9,Wm=W*1.05+2;
  var vn=cpVNeed(h,Wm,g.rise,Tm*0.98); l.cpDbg='plan W'+Math.round(W)+' vn'+Math.round(vn);
  if(vn===Infinity){
    if(l.v*l.v/(2*decOf(l))>d-8&&l.v>2){ st.go=true; return cpFloor(l); }  /* too late to stop: commit */
    if(l.pts[1]<l.cap-0.01){ return sgInp(0,[0,100,0]); }
    if(l.pts[2]<l.cap-0.01){ return sgInp(0,[0,0,100]); }
    if(cpOut(Tm*0.98,h,W,g.rise)===1&&l.strikes<K.strikes-1){ vn=Tm*0.98; } else { return sgInp(0,[0,0,100]); }
  }
  var target=Math.min(vn*1.03,Tm),reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(reach>=target){ st.go=true; return cpFloor(l); }
  if(l.v>1&&!st.rev){ return sgInp(0,[0,100,0]); }
  if(d<target*target/(2*acc)+15&&l.x>backLimit(l)+2){ st.rev=true; return sgInp(0,[0,100,0],{rev:true}); }
  st.go=true; return cpFloor(l);
}
/* how far before the face a lab learns whether the box is wider than wc: once it has seen wc of it (edge or no edge) */
function cpKnowAt(l,g,wc){ var e=heightOf(l)+C.RW; if(e<=g.rise){ return 0; } return clamp(Math.min((e-g.rise)/C.SEEANG,sightRange(l))-wc,0,1e9); }
/* cpRead at a seen box: known width, plan it. Seen more of it than it can clear as it is, stop and build. Otherwise keep to a speed from
   which it could still stop 10 short of the face once it learns the answer */
function cpReadBox(l,g,st,w){
  if(st.go){ l.cpDbg='go'; return cpFloor(l,w); }
  if(st.stop||knowsWidth(l,l.gi)){ var W=knowsWidth(l,l.gi)?gapWidth(l,g):Infinity; if(W===Infinity){ st.stop=true; if(l.v>1){ return sgInp(0,[0,100,0]); } return sgInp(0,[0,100,0]); } return cpPlan(l,g,st,W); }
  var h=heightOf(l),T=Math.max(topSpeed(l),1),wc=cpWc(h,T,g.rise)*0.95,seen=seenW(l,g,shadows(l,1)); l.cpDbg='seen'+Math.round(seen)+' wc'+Math.round(wc);
  if(seen>wc){ st.stop=true; if(l.v*l.v/(2*decOf(l))>g.x-l.x-8&&l.v>2){ st.go=true; return cpFloor(l,w); } return sgInp(0,[0,100,0]); }
  var vmax=Math.sqrt(2*0.9*decOf(l)*Math.max(g.x-l.x-16,0));  /* on the braking curve to 16 short of the face, so it can stop whenever it learns */
  return vmax<T?sgInp(cpPace(l,vmax),w):sgInp(1,w,{fwd:l.v>=T-0.5});
}
/* how much road ahead a lab knows is clear: its sight, cut short by a rival's shadow. Past a rival it can only count on the road as far as
   that rival could stop (a rival braking hard is a sign) */
function cpClear(l){ var sh=shadows(l,1),a=sightRange(l),i,m; for(i=0;i<sh.length;i++){ m=sh[i].by; a=Math.min(a,sh[i].a+Math.max(m.v,0)*Math.max(m.v,0)/(2*decOf(m))); }
  return Math.max(a,cpRhythm(l)); }
/* the map's rhythm, learned box by box: no box has come sooner after the last one than the shortest spacing seen so far, so the road up to
   there counts as clear (a lab expects the pattern to hold; a map can break it) */
function cpRhythm(l){
  var i=l.gi-1,pg=G.gaps[i],m=Infinity,k; if(!pg||l.gi<2){ return 0; }
  for(k=1;k<l.gi;k++){ m=Math.min(m,G.gaps[k].x-(G.gaps[k-1].x+G.gaps[k-1].W)); }
  return pg.x+pg.W+m-l.x;
}
/* cruising: never faster than it can stop within what it sees (a box can appear at the edge of sight), and build for the next known barrier */
function cpCruise(l,w){
  var b=G.barriers[l.bi],v=Infinity;
  if(b&&b.x>l.x&&knowsBar(l,l.bi)&&heightOf(l)+C.JUMP<b.h+1){
    if(l.pts[1]>=l.cap-0.01){ return null; }
    var need=b.h+1-C.JUMP-heightOf(l),t=need/(K.invest*(1-0.5)); v=Math.min(v,cpStopV(l,b.x,15));
    if(b.x-l.x<l.v*t+30){ return sgInp(Math.min(0.5,cpPace(l,v)),[0,100,0]); }
  }
  var g=G.gaps[l.gi]; if(g&&!(g.pub||l.seenG[l.gi])&&!l.cpBold){ v=Math.min(v,Math.sqrt(2*0.9*decOf(l)*Math.max(cpClear(l)-30,0))); }
  if(shadows(l,1).length){ w=[0,100,0]; }  /* blind behind a rival: grow taller than it, to see past it */
  /* invest while the road is clear: below top speed the meters grow, so run at 70% until every meter it builds is full, then floor it */
  var T=Math.max(topSpeed(l),1),full=true,i; for(i=0;i<3;i++){ if(w[i]>0&&l.pts[i]<l.cap-0.01){ full=false; } }
  if(!full&&l.id===0&&CP.read&&CP.read.invest){ return sgInp(Math.min(0.7,cpPace(l,v)),w); }
  return v<T?sgInp(cpPace(l,v),w):sgInp(1,w,{fwd:true});
}
/* the map being played (set when its track is built). P.read tunes the player's reader: invest (cruise at 70% until the meters it builds are
   full) and w (the build split) */
var CP={};
function cpRw(l){ return l.id===0&&CP.read&&CP.read.w||l.cpW||[30,50,20]; }
SGC.cpRead=function(l){ return cpCruise(l,cpRw(l)); };
SGP.cpRead=function(l,g,st){ return cpReadBox(l,g,st,cpRw(l)); };
/* cpRival: floors it while cruising; at a box it brakes only once it sees it cannot clear it, as late as it can, then builds what it needs */
SGC.cpRival=function(l){ var b=G.barriers[l.bi],g0=G.gaps[l.gi];  if(g0&&b&&b.x<g0.x&&b.x>l.x&&g0.x-b.x<40&&(g0.pub||l.seenG[l.gi])&&l.sst){ return SGP.cpRival(l,g0,l.sst.s[l.gi]||(l.sst.s[l.gi]={})); } if(b&&b.x>l.x&&knowsBar(l,l.bi)&&heightOf(l)+C.JUMP<b.h+1&&l.pts[1]<l.cap-0.01){ return sgInp(Math.min(0.5,cpPace(l,cpStopV(l,b.x,15))),[0,100,0]); } return sgInp(1,l.cpW||[0,50,50],{fwd:true}); };
SGP.cpRival=function(l,g,st){
  if(st.go){ return cpFloor(l); }
  var known=knowsWidth(l,l.gi),h=heightOf(l),T=Math.max(topSpeed(l),1),wc=cpWc(h,T,g.rise)*0.97,seen=known?gapWidth(l,g):(st.seen=Math.max(st.seen||0,seenW(l,g,shadows(l,1))));
  if(!st.stop&&seen<=wc){ return known?(st.go=true,cpFloor(l)):cpFloor(l); }
  if(!st.stop){ if(l.v*l.v/(2*0.85*decOf(l))<g.x-l.x-16){ return cpFloor(l); } st.stop=true; }
  return known?cpPlan(l,g,st,gapWidth(l,g)):sgInp(0,[0,100,0]);
};
NOPEEK.cpRival=1;

/* the clean reach of a full lab (height and speed at the ceiling cap) over a box of this rise, in the jump mode being played */
function cpFull(cap,rise){ return cpWc(cap,C.TOP0+0.85*cap,rise); }
/* the ceiling a lab has at box k if it never crossed first: it keeps the follower share of each raise */
function cpCapAt(k){ var c=C.CAPS[0],i; for(i=0;i<k;i++){ c+=K.share/100*(C.CAPS[i+1]-C.CAPS[i]); } return c; }
/* a box of exact width W (not a multiple of reach): segBox, then set W */
function cpBox(x,rise,W,odds,cap){ var g=segBox(x,rise,1,{odds:odds,cap:cap||70}); g.W=Math.round(W); g.f=Math.round(g.W/segReach(cap||70,rise)*100)/100; return g; }
function cpSay(gs){ return gs.map(function(g,i){ return 'Box '+(i+1)+': '+g.W+' wide, rise '+g.rise+'.'; }).join(' '); }

/* the maps read their numbers from P (this.P when the sim calls track), so campaign/sweep.mjs can try other numbers without a rebuild.
   Labs come from P too: labsOf builds you and the rivals from P.you and P.rivals */
function cpLabs(P){ return [{x:0,pts:P.you,pace:1,w:P.youW||[30,50,20]}].concat(P.rivals.map(function(r){ return RIV(r.post||'cpRival',r.name||'Rival',r.x,r.pts,{pace:1,w:r.w||[0,50,50]}); })); }
function cpMap(m){ m.labs=cpLabs(m.P); Object.defineProperty(m,'labs',{get:function(){ return cpLabs(this.P); },enumerable:true,configurable:true}); m.strategy=m.strategy||'cpRead'; if(!m.draft){ LESSONS.push(m); } }
/* a run of boxes: P.n boxes, the first at P.x0, P.gap apart (face to face of the next, after the box), widths from wf(i,r) */
function cpRun(P,r,wf){ var x=P.x0,gs=[],i,g; for(i=0;i<P.n;i++){ g=cpBox(x,P.rise,wf(i,r),P.odds); gs.push(g); x=g.x+g.W+P.gap; } return gs; }

/* ---- map 1: Look Before You Leap. Low boxes, each narrow or wide (a coin each). Narrow ones you clear as you are; wide ones need you to
   stop and build. The rival floors it and sees far ---- */
cpMap({key:'cp-look',lesson:'Look before you leap',title:'Look Before You Leap',
  P:{n:4,x0:600,gap:550,rise:10,fn:0.62,fw:1,pw:0.33,odds:30,after:80,you:[45,20,60],rivals:[{x:-40,pts:[70,70,50]}]},
  q:'Four low boxes. Most are narrow, some are wide, and you only find out by looking. How fast do you dare to go?',
  meta:'When a risk might be small or large, finding out which is cheaper than preparing for the worst, and safer than assuming the best.',
  look:'About one box in three is wide. You see a box’s far edge only from close in, or from higher up. A narrow box you clear as you are. A wide one takes a full lab: stop, build, back up for a run-up. The rival behind you sees further and never slows for a box it can clear.',
  track:function(r){ var P=this.P,gs=cpRun(P,r,function(i){ return (r()<P.pw?P.fw:P.fn)*cpFull(cpCapAt(i),P.rise); }),e=gs[gs.length-1];
    return {bars:[],gaps:gs,finish:e.x+e.W+P.after,note:cpSay(gs)+' Falls roll '+P.odds+'%.'}; },
  postures:['cpRead','rush','build','maxout']});

/* box widths for box i: the map's pattern says narrow (fn) or wide (fw), as a share of a full lab's clean reach at the ceiling a follower has there */
function cpW(P,i,wide){ var c=wide&&P.wlead?C.CAPS[i]:cpCapAt(i); return (wide?P.fw:P.fn)*cpFull(Math.min(c,P.wcap||999),P.rise); }
function cpEnd(P,gs,bars,note){ var e=gs[gs.length-1]; CP=P; return {bars:bars||[],gaps:gs,finish:e.x+e.W+P.after,note:note}; }

/* ---- map 2: Rise Above the Fog. A rival as tall as you runs just ahead: its shadow hides every box from you. Hang back, or grow taller than
   it and see past it ---- */
cpMap({key:'cp-fog',draft:1,lesson:'Don’t follow blind',title:'Rise Above the Fog',
  P:{n:4,x0:650,gap:550,rise:30,fn:0.6,fw:1,pw:0.33,odds:30,after:80,you:[40,40,60],rivals:[{x:30,pts:[40,40,50]}]},
  q:'A rival just as tall as you runs right ahead. You cannot see past it. Something is out there.',
  meta:'Following the leader is not the same as knowing what the leader knows.',
  look:'A lab no taller than the one in front sees nothing past it. Grow taller than your rival and you see over it; drop back and you see around it. About one box in three is wide, and these boxes are tall: you need height to see across them.',
  track:function(r){ var P=this.P,gs=cpRun(P,r,function(i){ return cpW(P,i,r()<P.pw); }); return cpEnd(P,gs,[],cpSay(gs)+' Falls roll '+P.odds+'%.'); },
  postures:['cpRead','rush','build','maxout']});

/* ---- map 3: Warning Signs. A barrier stands before every box. On this map a tall barrier means a wide box behind it ---- */
cpMap({key:'cp-signs',lesson:'Small incidents are evidence',title:'Warning Signs',
  P:{n:4,x0:650,gap:600,rise:10,fn:0.62,fw:1,pw:0.4,odds:30,after:80,lead:170,bt:72,bs:36,you:[40,30,60],rivals:[{x:-40,pts:[60,60,50]}]},
  q:'Every box has a barrier in front of it. Some barriers are tall. Is the road telling you something?',
  meta:'Small incidents are evidence about the big one.',
  look:'On this map a tall barrier stands before a wide box, and a short one before a narrow box. You still see the box itself only once you are close or tall.',
  track:function(r){ var P=this.P,bars=[],gs=cpRun(P,r,function(i){ var wide=r()<P.pw; P._w=wide; return cpW(P,i,wide); });
    gs.forEach(function(g){ bars.push(segBar(g.x-P.lead,g.W>0.8*cpFull(70,P.rise)?P.bt:P.bs)); });
    return cpEnd(P,gs,bars,cpSay(gs)+' Barriers: '+bars.map(function(b){ return b.h; }).join(', ')+'. Falls roll '+P.odds+'%.'); },
  postures:['cpRead','rush','build','maxout']});

/* ---- map 4: Small Risks Add Up. Every box is a little wider than you clear at a cruise. A scrape gets you across, at the price of a strike,
   height and speed. Three strikes and you are out ---- */
cpMap({key:'cp-strikes',draft:1,lesson:'Small risks add up',title:'Small Risks Add Up',
  P:{n:5,x0:600,gap:550,rise:30,fn:0.88,fw:0.96,pw:0.5,odds:20,after:80,you:[45,30,60],rivals:[{x:-40,pts:[60,70,70]}]},
  q:'Five boxes, each just a little too wide to clear at a cruise. You could scrape across every one. Should you?',
  meta:'Each near miss looks affordable. Together they are not.',
  look:'A scrape costs a strike, some height and your top speed for a while. Three strikes and your lab dissolves. Stopping to build lets you clear a box clean.',
  track:function(r){ var P=this.P,gs=cpRun(P,r,function(i){ return cpW(P,i,r()<P.pw); }); return cpEnd(P,gs,[],cpSay(gs)+' Falls roll '+P.odds+'%.'); },
  postures:['cpRead','rush','build','maxout']});

/* ---- map 5: The Pattern Breaks. Box after box is narrow, and the road teaches you to trust it. The last box is the exception ---- */
cpMap({key:'cp-break',lesson:'Patterns hold until they don’t',title:'The Pattern Breaks',
  P:{n:5,x0:600,gap:550,rise:10,fn:0.6,fw:1,wcap:130,plast:0.75,odds:20,olast:60,after:80,you:[45,20,60],rivals:[{x:-40,pts:[70,70,50],post:'cpRead'}]},
  q:'Five boxes. The first ones are easy. How much do you trust the road by the end?',
  meta:'A record of safe steps is not proof the next one is safe.',
  look:'On this map the early boxes are narrow, and the last one is usually wide, with much higher odds. Only looking tells you which.',
  track:function(r){ var P=this.P,gs=cpRun(P,r,function(i){ return cpW(P,i,i===P.n-1&&r()<P.plast); }); gs[gs.length-1].odds=P.olast;
    return cpEnd(P,gs,[],cpSay(gs)+' Falls roll '+P.odds+'%, the last box '+P.olast+'%.'); },
  postures:['cpRead','rush','build','maxout']});

/* ---- map 6: The Last Race. Everything at once: warning signs, a rival's fog, a mixed road, and odds that climb box by box ---- */
cpMap({key:'cp-final',draft:1,lesson:'Read the whole landscape',title:'The Last Race',
  P:{n:6,x0:650,gap:600,rise:20,fn:0.62,fw:1,pw:0.33,odds:15,ostep:8,after:80,lead:170,bt:72,bs:36,you:[45,30,60],rivals:[{x:30,pts:[40,30,50]},{x:-60,pts:[70,60,50],name:'Steady'}]},
  q:'Six boxes, barriers that warn, a rival in your way and one behind you. The odds climb with every box. What have you learned?',
  meta:'Every lesson so far, at once.',
  look:'Tall barriers stand before wide boxes. A rival as tall as you runs ahead and blocks your view. Each box rolls higher odds than the last.',
  track:function(r){ var P=this.P,bars=[],gs=cpRun(P,r,function(i){ return cpW(P,i,r()<P.pw); });
    gs.forEach(function(g,i){ g.odds=P.odds+P.ostep*i; if(r()<0.67){ bars.push(segBar(g.x-P.lead,g.W>0.8*cpFull(70,P.rise)?P.bt:P.bs)); } });
    return cpEnd(P,gs,bars,cpSay(gs)+' Barriers: '+bars.map(function(b){ return b.h; }).join(', ')+'. Falls roll '+gs.map(function(g){ return g.odds; }).join(', ')+'%.'); },
  postures:['cpRead','rush','build','maxout']});
