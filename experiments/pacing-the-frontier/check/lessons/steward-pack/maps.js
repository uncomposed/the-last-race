/* ---- steward-pack: The Steward in the pack. [[ai gen]] Claude, 2026-10-31. See NOTES.md.
   Source: Karnofsky, "Racing through a minefield" (2022): cautious actors must move fast enough not to be overpowered and slowly
   enough not to cause the disaster.
   Postures added here (names prefixed with the lesson key):
     steward-pack-steward  stays close to the lab ahead, hops to peek over it, and caps its speed so it can stop before the road it has
                           seen. Once a box face is seen it brakes to a speed it can stop from; once the width is known (its own eye, or a
                           rival crossing or falling) it plans the jump as the segment bots do, building only if it has to.
     steward-pack-tail     the same brain at the box, but it tails the lab ahead closely at that lab's speed and never peeks: it brakes
                           only on what it sees, and behind an equal-height rival it sees nothing.
     steward-pack-stop     the "stop and fall behind" foil: it hangs 150 behind the lab ahead, stops 270 short of every box until its
                           height is full, then creeps up to look. Written here because the segments' build posture fell at boxes that sit
                           behind a barrier (the shared next-box helper skips a box while a barrier comes first).
   Wrapped in a function so nothing here collides with another lesson's maps. ---- */
(function(){
  var P='steward-pack-',ST=P+'steward',TL=P+'tail',SP=P+'stop';
  /* the nearest lab still racing ahead of l, within range */
  function ahead(l,range){ var a=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x||m.x-l.x>range){continue;} if(!a||m.x<a.x){a=m;} } return a; }
  /* a barrier comes before the next box and the lab can't clear it: leave it to the page's own bot plan */
  function barFirst(l){ var b=G.barriers[l.bi],g=G.gaps[l.gi]; return b&&(!g||b.x<g.x)&&knowsBar(l,l.bi)&&heightOf(l)+C.JUMP<b.h+2; }
  /* how far ahead the road is known to be free of a box face: own sight when nobody shadows it, else what the last peek showed */
  function clearTo(l){
    var sh=shadows(l),a=Infinity,i; for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a); }
    var own=a===Infinity?sightRange(l):a;
    return Math.max(own,(l.peekTo===undefined?-1e9:l.peekTo)-l.x);
  }
  /* cruise: follow the lab ahead at gap D, never faster than it can stop before the road it has seen. A careful lab passes a lab that has
     stopped or is crawling (it is not racing), but only as fast as the road it has seen allows */
  function follow(l,D,careful){
    if(barFirst(l)){ return null; }
    var top=Math.max(topSpeed(l),1),a=ahead(l,Math.max(sightRange(l),160)),v=l.basePace*top;
    if(a&&!(careful&&(a.still>1||a.v<0.4*v))){ v=Math.max(0,a.v+0.8*(a.x-l.x-D)); }
    if(careful){
      var vs=Math.sqrt(2*C.DEC*Math.max(clearTo(l)-12,0)),g=G.gaps[l.gi];
      /* a box it has seen beyond a barrier: keep a speed it can stop from before the face, unless it already knows it clears it clean */
      if(g&&!l.gx&&knowsGap(l,l.gi)&&!(knowsWidth(l,l.gi)&&cleanFrom(l,g,top)<=top)){ vs=Math.min(vs,Math.sqrt(2*C.DEC*Math.max(g.x-l.x-12,0))); }
      v=Math.min(v,vs);
    }
    return sgInp(clamp(v/top,0,1),careful?[30,50,20]:[15,50,35]);
  }
  /* the least speed from which every faster speed up to vt still clears the box clean (a downward scan: the flight rules are not monotonic at low speed) */
  function cleanFrom(l,g,vt){ var v=Math.floor(vt); if(sgClearAt(l,g,v)!==0){ return Infinity; } while(v>2&&sgClearAt(l,g,v-1)===0){ v--; } return v; }
  /* the run-up from a standstill to full speed at its ceiling */
  function runUp(l){ var TM=C.TOP0+0.85*l.cap; return TM*TM/(2*accOf(l)*0.9)+15; }
  /* the width is known: if it can't cross clean even at full speed, stand and fill height first (the segments' planner would take the scrape) */
  function known(l,g,st){
    var atCap=l.pts[1]>=l.cap-0.01,TM=Math.max(C.TOP0+0.85*l.cap,1),d=g.x-l.x;
    if(!st.go&&!atCap&&sgClearAt(l,g,TM)!==0&&l.v*l.v/(2*C.DEC)<d-6){ return sgInp(0,[0,100,0]); }
    var res=sgPlanKnown(l,g,st),T=Math.max(topSpeed(l),1),vcl=cleanFrom(l,g,TM);
    /* go at the speed a clean cross needs, not flat out, so it can still brake for whatever comes next */
    if(res.fwd&&isFinite(vcl)&&vcl*1.08<T){ return sgInp(vcl*1.08/T,[20,50,30]); }
    return res;
  }
  /* at a box whose face it has seen but whose width it doesn't know: brake to stand a full run-up short of the face (if it saw the face too
     late for that, at the face), filling the speed meter, ready to go the moment the width is known. After 2 s standing with nobody
     ahead to show it, it creeps forward to look for itself */
  function atBox(l,g,st){
    var d=g.x-l.x,top=Math.max(topSpeed(l),1),atCap=l.pts[1]>=l.cap-0.01;
    if(st.go||knowsWidth(l,l.gi)){ return known(l,g,st); }
    var R=runUp(l),brake=l.v*l.v/(2*C.DEC);
    if(st.mark===undefined){ st.mark=brake<d-R-4?R:8; }
    var w=atCap?[10,10,80]:[0,100,0],stand=Math.max(st.mark,8);
    if(st.creep||(l.still>2&&!ahead(l,d+20))){ st.creep=true; stand=8; }
    if(d<=stand+2){ return sgInp(0,w); }
    var vmax=Math.sqrt(2*C.DEC*Math.max(d-stand,0));
    return sgInp(Math.min(l.basePace,(st.creep?Math.min(vmax,0.25*top):vmax)/top),w);
  }
  /* stop: the segments' build at the box (stand 270 short, fill height, creep until the far edge is in view), with the same known-width
     plan as the steward; while cruising it hangs 150 behind the lab ahead and brakes for what it has seen */
  function stopAtBox(l,g,st){
    var atCap=l.pts[1]>=l.cap-0.01,d=g.x-l.x;
    if(!atCap&&!st.go){ return sgHold(l,g,[0,100,0]); }
    if(st.go||knowsWidth(l,l.gi)){ return known(l,g,st); }
    if(d<=8){ return sgInp(0,[0,100,0]); }
    var vmax=Math.sqrt(2*C.DEC*Math.max(d-6,1)); return sgInp(Math.min(0.25,vmax/Math.max(topSpeed(l),1)),[0,100,0]);
  }
  SGP[SP]=stopAtBox; SGC[SP]=function(l){ return follow(l,150,true); };
  SGP[ST]=atBox; SGP[TL]=atBox;
  SGC[ST]=function(l){ return follow(l,45,true); };
  /* tail: keep 35 behind the front of the pack (the frontmost lab within 220 ahead), at its speed, passing anyone slower on the way */
  SGC[TL]=function(l){
    if(barFirst(l)){ return null; }
    var top=Math.max(topSpeed(l),1),f=null,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x||m.x-l.x>220){continue;} if(!f||m.x>f.x){f=m;} }
    var v=f?Math.max(0,f.v+0.8*(f.x-l.x-35)):l.basePace*top; return sgInp(clamp(v/top,0,1),[15,50,35]);
  };
  NOPEEK[TL]=1;

  var YOU=[ST,TL,SP];
  function edge(t,a,b){ return t[a].win-t[b].win; }

  LESSONS.push({key:'steward-minefield',lesson:'The Steward in the pack',title:'The Minefield',
    q:'Two rushers lead you into three boxes. They are as tall as you, so you cannot see past them. Keep up, or hang back?',
    meta:'A careful lab cannot just stop: it has to stay close enough to take the lead when the reckless ones stumble, and slow enough not to fall with them.',
    look:'Hop to look over the pack: in the air you see a box’s face, never its width. When a rusher crosses or falls, everyone learns the width, and a crossed box shrinks behind it.',
    labs:[{x:0,pts:[20,50,30]},RIV('rush','Rush A',40,[15,45,40],{pace:0.85,w:[10,30,60]}),RIV('rush','Rush B',20,[15,45,40],{pace:0.85,w:[10,30,60]}),RIV(ST,'Steward',-60,[20,50,30])],
    track:function(r){ var gaps=[],bars=[],says=[],x=420,k,cp=[70,90,115],f;
      for(k=0;k<3;k++){ f=r()<0.5?0.85:1.08; var g=segBox(x,0.6*cp[k],f,{odds:8,cap:cp[k]}); gaps.push(g); says.push('Box '+(k+1)+': '+segSay(g,cp[k])); bars.push(segBar(x-220,0.4*cp[k])); x=g.x+g.W+520; }
      return {bars:bars,gaps:gaps,finish:x-320,note:says.join(' ')+' Falls roll 8%.'}; },
    postures:YOU.concat(['rush']),
    claim:{text:'The steward wins more often than the lab that stops and falls behind, and more often than the lab that tails blind',
      score:function(t){ return Math.min(edge(t,ST,SP),edge(t,ST,TL)); },need:20}});

})();
