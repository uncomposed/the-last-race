/* ---- steward-pack: The Steward in the pack. [[ai gen]] Claude, 2026-10-31 (round 2). See NOTES.md.
   Source: Karnofsky, "Racing through a minefield" (2022): cautious actors must move fast enough not to be overpowered and slowly
   enough not to cause the disaster.
   The lesson strategy, posture steward-pack-steward (written before round 2's tuning, then the follow distance was set from the foils):
     Stay in the race a stopping distance behind the leaders, never faster than you can stop on road you have seen (hop to look over
     them). At a box nobody has sized, stand one run-up short and build. Go the moment someone shows you the width. If nobody is left
     to show you, creep up and look yourself. Don't park and wait, and don't tail the leaders blind.
   Other postures here (all prefixed with the lesson key):
     steward-pack-close   the same brain, but it runs 45 behind the front instead of 250. The rival Eager plays it.
     steward-pack-far5    the same brain, 500 behind the front: falling well back.
     steward-pack-tail    tails the front at 35 and never hops to look; the same brain at a box it has seen.
     steward-pack-lurkv   cruises at 0.7 building sight only, floors it once sight is full, never hops; the same brain at a box. The
                          strongest strategy found outside the adversary pool (see NOTES.md).
   Wrapped in a function so nothing here collides with another lesson's maps. ---- */
(function(){
  var P='steward-pack-',ST=P+'steward',CLOSE=P+'close',FAR5=P+'far5',TAIL=P+'tail',LURKV=P+'lurkv';
  /* the frontmost lab still racing ahead of l, within range */
  function front(l,range){ var f=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x||m.x-l.x>range){continue;} if(!f||m.x>f.x){f=m;} } return f; }
  function anyAhead(l,range){ var i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m!==l&&!m.out&&!m.done&&m.x>l.x&&m.x-l.x<=range){ return true; } } return false; }
  /* a barrier comes before the next box and the lab can't clear it: leave it to the page's own bot plan */
  function barFirst(l){ var b=G.barriers[l.bi],g=G.gaps[l.gi]; return b&&(!g||b.x<g.x)&&knowsBar(l,l.bi)&&heightOf(l)+C.JUMP<b.h+2; }
  /* how far ahead the road is known to be free of a box face: own sight when nobody shadows it, else what the last peek showed */
  function clearTo(l){
    var sh=shadows(l),a=Infinity,i; for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a); }
    var own=a===Infinity?sightRange(l):a;
    return Math.max(own,(l.peekTo===undefined?-1e9:l.peekTo)-l.x);
  }
  /* the least speed from which every faster speed up to vt still clears the box clean (a downward scan: the flight rules are not monotonic at low speed) */
  function cleanFrom(l,g,vt){ var v=Math.floor(vt); if(sgClearAt(l,g,v)!==0){ return Infinity; } while(v>2&&sgClearAt(l,g,v-1)===0){ v--; } return v; }
  /* the run-up from a standstill to full speed at its ceiling */
  function runUp(l){ var TM=C.TOP0+0.85*l.cap; return TM*TM/(2*accOf(l)*0.9)+15; }
  /* cruise: as fast as the road it has seen allows, but no closer than D behind the front of the pack */
  function cruise(l,D,w){
    if(barFirst(l)){ return null; }
    var top=Math.max(topSpeed(l),1),f=front(l,Math.max(sightRange(l),240)),v=top;
    if(f){ v=Math.max(0,f.v+0.8*(f.x-l.x-D)); }
    var vs=Math.sqrt(2*C.DEC*Math.max(clearTo(l)-12,0)),g=G.gaps[l.gi];
    /* a box it has seen: keep a speed it can stop from before the face, unless it already knows it clears it clean */
    if(g&&!l.gx&&knowsGap(l,l.gi)&&!(knowsWidth(l,l.gi)&&cleanFrom(l,g,top)<=top)){ vs=Math.min(vs,Math.sqrt(2*C.DEC*Math.max(g.x-l.x-12,0))); }
    return sgInp(clamp(Math.min(v,vs)/top,0,1),w);
  }
  /* the width is known: if it can't cross clean even at full speed, stand and fill height first (the segments' planner would take the scrape) */
  function known(l,g,st){
    var atCap=l.pts[1]>=l.cap-0.01,TM=Math.max(C.TOP0+0.85*l.cap,1),d=g.x-l.x;
    if(!st.go&&!atCap&&sgClearAt(l,g,TM)!==0&&l.v*l.v/(2*C.DEC)<d-6){ return sgInp(0,[0,100,0]); }
    /* then the segments' planner: the run-up a clean cross needs, flat out over the face. (Round 1 crossed at the least clean speed instead;
       a box narrowed behind a lab that later falls widens again, and a lab floating over it slowly fell in) */
    return sgPlanKnown(l,g,st);
  }
  /* at a box whose face it has seen but whose width it doesn't know: brake to stand a full run-up short of the face (if it saw the face too
     late for that, at the face), filling height then speed, ready to go the moment the width is known. After 2 s standing with nobody
     ahead to show it, it creeps forward to look for itself */
  function atBox(l,g,st){
    var d=g.x-l.x,top=Math.max(topSpeed(l),1),atCap=l.pts[1]>=l.cap-0.01;
    if(st.go||knowsWidth(l,l.gi)){ return known(l,g,st); }
    var R=runUp(l),brake=l.v*l.v/(2*C.DEC);
    if(st.mark===undefined){ st.mark=brake<d-R-4?R:8; }
    var w=atCap?[10,10,80]:[0,100,0],stand=Math.max(st.mark,8);
    if(st.creep||(l.still>2&&!anyAhead(l,d+20))){ st.creep=true; stand=8; }
    if(d<=stand+2){ return sgInp(0,w); }
    var vmax=Math.sqrt(2*C.DEC*Math.max(d-stand,0));
    return sgInp(Math.min(1,(st.creep?Math.min(vmax,0.25*top):vmax)/top),w);
  }
  var WL=[10,70,20];
  SGP[ST]=atBox; SGC[ST]=function(l){ return cruise(l,250,WL); };
  SGP[CLOSE]=atBox; SGC[CLOSE]=function(l){ return cruise(l,45,WL); };
  SGP[FAR5]=atBox; SGC[FAR5]=function(l){ return cruise(l,500,WL); };
  SGP[TAIL]=atBox; NOPEEK[TAIL]=1;
  SGC[TAIL]=function(l){ if(barFirst(l)){ return null; } var top=Math.max(topSpeed(l),1),f=front(l,240); var v=f?Math.max(0,f.v+0.8*(f.x-l.x-35)):top; return sgInp(clamp(v/top,0,1),WL); };
  SGP[LURKV]=atBox; NOPEEK[LURKV]=1;
  SGC[LURKV]=function(l){ return sgInp(l.pts[0]>=l.cap-0.01?1:0.7,[100,0,0]); };

  function edge(t,a,b){ return t[a].win-t[b].win; }

  LESSONS.push({key:'steward-minefield',lesson:'The Steward in the pack',title:'The Minefield',strategy:ST,
    q:'Two rushers lead you into three boxes, and Eager, another careful lab, runs right on their heels. You cannot see past them. Keep up, hang back, or stop and wait?',
    meta:'A careful lab cannot just stop: it has to stay in the race, close enough to take over when the reckless ones fall, and slow enough not to fall with them.',
    look:'Hop to look over the pack: in the air you see a box’s face, never its width. When a rusher crosses or falls, everyone learns the width. Most boxes here are wider than a full lab can clear clean, and a rusher who meets one falls.',
    labs:[{x:0,pts:[20,50,30]},RIV('rush','Rush A',40,[15,35,45],{pace:0.85,w:[10,20,70]}),RIV('rush','Rush B',20,[15,35,45],{pace:0.85,w:[10,20,70]}),RIV(CLOSE,'Eager',-60,[20,50,30])],
    /* per box two draws: u picks wide (60%) or narrow, v places it in the band. Wide is 1.02 to 1.10 of a full lab's clean reach: a full
       lab scrapes through, a rusher falls. Narrow is 0.60 to 0.80: everyone clears it */
    track:function(r){ var gaps=[],bars=[],says=[],x=420,k,cp=[70,90,115],f;
      for(k=0;k<3;k++){ var u=r(),v=r(); f=u<0.6?1.02+0.08*v:0.6+0.2*v; var g=segBox(x,0.6*cp[k],f,{odds:8,cap:cp[k]}); gaps.push(g); says.push('Box '+(k+1)+': '+segSay(g,cp[k])); bars.push(segBar(x-220,0.4*cp[k])); x=g.x+g.W+520; }
      return {bars:bars,gaps:gaps,finish:gaps[2].x+gaps[2].W+200,note:says.join(' ')+' Falls roll 8%.'}; },
    postures:[ST,CLOSE,FAR5,TAIL,'build','rush'],
    /* close and far5 are in the table as foils, not in the claim: the follow distance (45 to 500) is not well separated, see NOTES.md */
    claim:{text:'The steward wins more often than parking to build and than tailing the leaders blind',
      score:function(t){ return Math.min(edge(t,ST,'build'),edge(t,ST,TAIL)); },need:15}});

})();
