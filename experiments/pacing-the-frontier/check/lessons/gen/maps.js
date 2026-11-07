/* ---- GEN: the pattern generator (issue 36, step 2). Research only: every map here is act 9, so none joins the campaign or the dailies.
   [[ai gen]] Build: node build.mjs --only campaign+ship+reader+gen   (uses sh* from ship/, cp* from campaign/, coleFollow from reader/). Notes: gen/NOTES.md.

   A map is a list of BLOCKS. A block is one of the director's 18 patterns (issue 36) or one of three plain connectors (a box, a run of boxes, a
   list of rivals). A block can lay road (walls and boxes, in the shRoad item format: each obstacle `d` past the end of the one before), add rivals,
   or both. Patterns overlap because blocks stack: a rival block (a steward ahead) runs over every road block after it.

   Three ways to make a map:
   1. gnMap(spec): a spec names its blocks and their settings. The 12 shipped maps are written this way below (EXPRESS), and check.mjs shows each
      one lays exactly the shipped road, seed for seed.
   2. gnOne(id): one block on its own, with a short run-in and run-out. The debug mode: keys 'blk-<id>'.
   3. gnDraw(seed): the composer. It picks a difficulty shape and a deception level (both borrowed from the old genTrack), a rival pattern and
      three to five road patterns, fills each block's settings from where it sits on the road, and puts a micro moment into any long empty stretch.

   Settings are dice: a number is itself; [a,b] is uniform in a..b; {i:[a,k]} is a+floor(r*k); {pick:[...]} is one of the list. Dice are thrown when
   the road is laid (per race seed), in the same order the shipped maps throw them, which is what lets EXPRESS match exactly. ---- */

function gnD(r,v){ if(typeof v==='number'){ return v; } if(Array.isArray(v)){ return v[0]+r()*(v[1]-v[0]); } if(v&&v.i){ return v.i[0]+Math.floor(r()*v.i[1]); } if(v&&v.pick){ return shPick(r,v.pick); } throw new Error('gen: bad dice '+JSON.stringify(v)); }
/* a box width given as {full:[f,cap]}: f times the widest box a lab at that ceiling can clear clean (Two Endings sizes its boxes this way) */
function gnW(r,v,rise){ return v&&v.full?v.full[0]*cpFull(v.full[1],rise):gnD(r,v); }
/* ceiling a box raises you to: {base,step} by the box's index in its block, or a list, or nothing (15 above the last, as shRoad) */
function gnCap(o,i){ return o.caps?o.caps[i]:o.cap?o.cap.base+i*o.cap.step:undefined; }

/* the road: shRoad, plus `cap` on a box (the ceiling cpBox sizes it for, when it is not the last box's), `shade`, `calm` (a long stretch on purpose) */
function gnRoad(items,after,note){
  var bars=[],gs=[],x=0,i,o,g,cap=70;
  for(i=0;i<items.length;i++){ o=items[i]; x+=o.d;
    if(o.bar!==undefined){ g=segBar(x,o.bar); if(o.pub){ g.pub=true; } bars.push(g); }
    else { g=cpBox(x,o.rise,o.W,o.odds===undefined?15:o.odds,o.cap||cap); g.capTo=o.capTo===undefined?cap+15:o.capTo; cap=g.capTo; if(o.shade){ g.shade=true; } if(o.pub){ g.pub=true; } if(o.open){ g.pub=true; g.wpub=true; } gs.push(g); x=g.x+g.W; }
  }
  return {bars:bars,gaps:gs,finish:x+after,note:note||''};
}

/* ---- THE BLOCKS. Each: n (pattern number in issue 36, 0 for a connector), name, decision (what it asks of you), emit(c,r,o) lays road into c.it,
   rivals(o) the rivals it brings, gen(c,r) the settings the composer gives it at its place on the road (c.u: 0..1 along the road, c.hard: 0..1 from
   the shape, c.cap: the ceiling so far, c.A: deception). vin/vout: the speed it wants coming in and leaves you with ('fast', 'slow' or 'any'); the
   composer leaves a run-up between a 'slow' out and a 'fast' in. ---- */
var GN={};
function gnBlock(id,b){ b.id=id; GN[id]=b; }
function gnBox(c,o){ c.it.push(o); c.boxes++; }
function gnWall(c,d,h,pub){ c.it.push(pub?{d:d,bar:h,pub:true}:{d:d,bar:h}); }
/* composer helpers: a box f times the widest clean box at the ceiling so far; a wall that needs `over` more than a lab at a fraction of that
   ceiling can jump */
function gnFW(c,rise,f){ return Math.max(30,Math.round(f*cpFull(c.cap,rise))); }
function gnWallH(c,over){ return Math.round(0.6*c.cap+C.JUMP+over); }

/* connectors */
gnBlock('box',{n:0,name:'One box',decision:'none of its own',vin:'any',vout:'any',
  emit:function(c,r,o){ var d=gnD(r,o.d),rise=gnD(r,o.rise),W=gnW(r,o.W,rise); gnBox(c,{d:d,rise:rise,W:W,odds:o.odds,capTo:o.capTo,cap:o.boxCap,shade:o.shade,pub:o.pub}); },
  gen:function(c,r){ return {d:[260,380],rise:8+Math.round(20*c.hard),W:gnFW(c,8+Math.round(20*c.hard),0.4+0.4*c.hard),odds:10+Math.round(20*c.hard)}; }});
gnBlock('run',{n:0,name:'A run of boxes',decision:'none of its own',vin:'any',vout:'any',
  emit:function(c,r,o){ for(var i=0;i<o.n;i++){ var d=(i?0:o.d0||0)+gnD(r,i&&o.gap2?o.gap2:o.gap),rise=gnD(r,o.rise)+(o.riseStep||0)*i,W=gnW(r,o.W,rise);
    gnBox(c,{d:d,rise:rise,W:W,odds:(o.odds||15)+(o.oddsStep||0)*i,capTo:gnCap(o,i),cap:o.boxCap}); } },
  gen:function(c,r){ var rise=8+Math.round(24*c.hard); return {n:2+Math.floor(r()*2),gap:[300,420],rise:rise,W:[gnFW(c,rise,0.35),gnFW(c,rise,0.6+0.3*c.hard)],odds:15}; }});
gnBlock('rivals',{n:0,name:'Rivals',decision:'none of its own',vin:'any',vout:'any',emit:function(){},rivals:function(o){ return o.list; }});

/* 1. WALL BEHIND THE BOX: a wall a short strip past the box's far edge. Land fast and you hit it */
gnBlock('fence',{n:1,name:'Wall behind the box',decision:'cross at the minimum speed, or carry the height for both',vin:'any',vout:'slow',
  emit:function(c,r,o){ for(var i=0;i<(o.n||1);i++){ var d=gnD(r,o.gap),rise=gnD(r,o.rise),W=gnW(r,o.W,rise); gnBox(c,{d:d,rise:rise,W:W,odds:o.odds,capTo:gnCap(o,i)});
    if(!o.noWall){ gnWall(c,gnD(r,o.strip),o.walls?o.walls[i]:o.wall); } } },
  ablate:function(o){ o.noWall=true; return o; },
  gen:function(c,r){ var rise=10+Math.round(16*c.hard); return {n:1+Math.floor(r()*2),gap:[300,420],rise:rise,W:[gnFW(c,rise,0.45),gnFW(c,rise,0.75)],odds:20,strip:[45,70],wall:gnWallH(c,8+30*c.hard)}; }});

/* 2. TOWER AND CELLAR: a box too tall to see past; what is behind it changes the right move. behind: a list to pick from ('wall','box','none'), or
   cellar:{ok,bad,pBad} for one box that is either harmless or deadly */
gnBlock('tower',{n:2,name:'Tower and cellar',decision:'peek and pay the time, or commit blind',vin:'any',vout:'slow',
  emit:function(c,r,o){ var i,n=o.n||1;
    if(o.cellar){ var d=gnD(r,o.gap); gnBox(c,{d:d,rise:o.rise,W:o.W,odds:o.odds,capTo:o.capTo,cap:o.tcap,shade:true,pub:true}); var bad=r()<o.cellar.pBad,cl=bad?o.cellar.bad:o.cellar.ok;
      gnBox(c,{d:o.strip,rise:cl.rise,W:cl.W,odds:cl.odds,capTo:o.capTo,cap:o.ccap}); c.notes.push(bad?'The cellar did not hold: tall and wide.':'The cellar held: low and narrow.'); return; }
    for(i=0;i<n;i++){ var cap=gnCap(o,i),k=o.behind?shPick(r,o.behind):'none',s=o.behind?gnD(r,o.strip):0; c.notes.push(k);
      gnBox(c,{d:gnD(r,o.gap),rise:o.rise+(o.riseStep||0)*i,W:o.W,odds:o.odds,capTo:cap,shade:true,pub:true});
      if(k==='wall'){ gnWall(c,s,o.wall+(o.wallStep||0)*i); } if(k==='box'){ gnBox(c,{d:s,rise:o.back.rise,W:gnD(r,o.back.W),odds:o.odds,capTo:cap+8}); } } },
  ablate:function(o){ o.behind=['none']; return o; },
  gen:function(c,r){ var rise=Math.round(0.8*c.cap+20+20*c.hard); return {n:1,gap:[380,480],rise:rise,W:Math.round(0.6*cpFull(c.cap+20,rise)+20),odds:15,cap:{base:c.cap+20,step:20},behind:['wall','box','none'],strip:[140,200],wall:gnWallH(c,40+30*c.hard),back:{rise:30+Math.round(15*c.hard),W:[gnFW(c,40,0.9),gnFW(c,40,1.05)]}}; }});

/* 3. POTHOLE IN A RHYTHM: a run of small boxes, one (mode 'one') or a few ('some') of them wide. 'none' is the rhythm alone */
gnBlock('rhythm',{n:3,name:'Pothole in a rhythm',decision:'keep sight up when the road teaches you not to',vin:'fast',vout:'any',
  emit:function(c,r,o){ var n=gnD(r,o.n),pot=o.mode==='one'?o.potAt[0]+Math.floor(r()*(Math.min(o.potAt[1],n-1)-o.potAt[0])):-1,nw=0,i,w;
    for(i=0;i<n;i++){
      if(o.mode==='some'){ w=r()<o.pw&&i>0; if(w&&nw>=(o.maxWide||3)){ w=false; } if(i===n-1&&nw===0){ w=true; } if(w){ nw++; } } else { w=i===pot; }
      var d=w&&o.potD?o.potD:gnD(r,o.gap),rise=gnD(r,o.rise),W=w?gnD(r,o.wide):gnD(r,o.W);
      gnBox(c,{d:d,rise:rise,W:W,odds:o.odds,capTo:gnCap(o,i),pub:w&&o.potPub?true:undefined}); }
    if(o.mode==='one'){ c.notes.push('The wide one was box '+(pot+1)+' of '+n+'.'); } if(o.mode==='some'){ c.notes.push(nw+' of the '+n+' boxes were wide.'); } },
  ablate:function(o){ o.mode='none'; return o; },
  gen:function(c,r){ var n=5+Math.floor(r()*4); return {n:n,mode:'one',potAt:[2,n-1],gap:[140,240],rise:{i:[8,7]},W:[26,42],wide:[gnFW(c,14,0.8),gnFW(c,14,1.0)],odds:10,cap:{base:c.cap,step:4}}; }});

/* 4. HEIGHT GATE: walls taller than a default build. shuffle:[a,b] shuffles hs[a..b); insert puts one box after wall `after` (The Picket) */
gnBlock('gate',{n:4,name:'Height gate',decision:'pay for height now, and when',vin:'any',vout:'any',
  emit:function(c,r,o){ var hs=o.hs,i; if(o.shuffle){ hs=hs.slice(0,o.shuffle[0]).concat(shShuffle(r,hs.slice(o.shuffle[0],o.shuffle[1])),hs.slice(o.shuffle[1])); }
    for(i=0;i<hs.length;i++){ gnWall(c,i?gnD(r,o.gap):gnD(r,o.first),hs[i],o.pub); if(o.insert&&i===o.insert.after){ var b=o.insert.box; gnBox(c,{d:b.d,rise:b.rise,W:b.W,odds:b.odds,capTo:b.capTo}); } }
    if(o.shuffle){ c.notes.push('Walls in this order: '+hs.join(', ')+'.'); } },
  ablate:function(o){ o.hs=o.hs.map(function(){ return 60; }); return o; },  /* walls a default build jumps */
  gen:function(c,r){ var n=2+Math.floor(r()*3),hs=[],i; for(i=0;i<n;i++){ hs.push(gnWallH(c,10+25*c.hard+12*i)); } return {hs:hs,first:[200,300],gap:[170,260]}; }});

/* 5. HIDDEN WALL: a wall in the shadow of a box you cannot see over, instead of in view from far off */
gnBlock('hidden',{n:5,name:'Hidden wall',decision:'plan ahead for what you cannot see, or rely on sight',vin:'any',vout:'slow',
  emit:function(c,r,o){ var d=gnD(r,o.gap),rise=gnD(r,o.rise),W=gnD(r,o.W); gnBox(c,{d:d,rise:rise,W:W,odds:o.odds,capTo:o.capTo,shade:!o.open}); gnWall(c,gnD(r,o.strip),gnD(r,o.wall),o.open); },
  ablate:function(o){ o.open=true; return o; },  /* the same wall, seen from far off */
  gen:function(c,r){ var rise=Math.round(0.6*c.cap+10); return {gap:[320,420],rise:rise,W:[gnFW(c,rise,0.35),gnFW(c,rise,0.55)],odds:15,strip:[60,110],wall:[gnWallH(c,20+20*c.hard),gnWallH(c,35+25*c.hard)]}; }});

/* 6. CEILING-RAISE BOX: each box lifts the ceiling a lot, and the first across gains most (The Ladder) */
gnBlock('ceiling',{n:6,name:'Ceiling-raise box',decision:'go first for the raise, or follow for the share',vin:'fast',vout:'any',
  emit:function(c,r,o){ var rise=o.rise0,i; for(i=0;i<o.n;i++){ gnBox(c,{d:gnD(r,o.gap),rise:rise,W:gnD(r,o.W),odds:o.odds+(o.oddsStep||0)*i,capTo:o.cap.base+i*o.cap.step}); rise+=gnD(r,o.step); }
    c.notes.push(o.n+' steps, highest '+Math.round(rise)+'.'); },
  ablate:function(o){ o.cap={base:o.cap.base,step:0}; return o; },
  gen:function(c,r){ return {n:3+Math.floor(r()*2),rise0:Math.round(0.3*c.cap),step:[16,24],gap:[320,420],W:[50,70],odds:15,oddsStep:5,cap:{base:c.cap+32,step:32}}; }});

/* 7. BOX WITH WARNING SIGNS: walls whose heights are clues to the width of the box after them. A: how much the clues lie (genTrack's deception) */
gnBlock('signs',{n:7,name:'Box with warning signs',decision:'read the clues, or prepare for the worst',vin:'any',vout:'any',
  emit:function(c,r,o){ var f=r(),i; for(i=0;i<o.k;i++){ gnWall(c,gnD(r,i?o.gap:o.first),Math.round(o.h[0]+(o.h[1]-o.h[0])*(o.flat?0.5+0*r():clamp(f+o.A*(2*r()-1),0,1)))); }
    var W=o.W[0]+f*(o.W[1]-o.W[0]); gnBox(c,{d:gnD(r,o.boxD),rise:o.rise,W:W,odds:o.odds,capTo:o.capTo}); c.notes.push('Signs said '+Math.round(100*f)+'% of the way to the widest box.'); },
  ablate:function(o){ o.flat=true; return o; },  /* walls that say nothing */
  gen:function(c,r){ var rise=14+Math.round(14*c.hard); return {k:2+Math.floor(r()*2),first:[220,300],gap:[200,280],h:[gnWallH(c,-10),gnWallH(c,35)],A:c.A,boxD:[300,380],rise:rise,W:[gnFW(c,rise,0.4),gnFW(c,rise,1.0)],odds:25}; }});

/* 8. SCRAPE-ONLY BOX: no clean crossing at the expected build; you spend a strike, or build past the ceiling. Three Strikes: a run of near misses,
   up to `nb` of them too wide to scrape at all */
gnBlock('scrape',{n:8,name:'Scrape-only box',decision:'when to spend a strike',vin:'fast',vout:'any',
  emit:function(c,r,o){ var nb=0,i; for(i=0;i<o.n;i++){ var b=i>0&&r()<o.pb&&nb<(o.nb||2); if(b){ nb++; }
      var d=gnD(r,o.gap),rise=gnD(r,o.rise),W=gnD(r,b?o.Wb:o.Wn)+i*(o.Wg||0); gnBox(c,{d:d,rise:rise,W:W,odds:o.odds,capTo:gnCap(o,i),open:o.open}); }
    c.notes.push(nb+' of the boxes were too wide to scrape.'); },
  ablate:function(o){ o.Wn=[o.Wn[0]*0.85,o.Wn[1]*0.85]; o.Wb=[o.Wb[0]*0.85,o.Wb[1]*0.85]; return o; },  /* clean crossings exist */
  gen:function(c,r){ var rise=20+Math.round(20*c.hard),Wc=cpFull(c.cap,rise); return {n:1+Math.floor(r()*2),pb:0,gap:[420,540],rise:rise,Wn:[Math.round(Wc*1.04),Math.round(Wc*1.12)],Wb:[Wc*1.3,Wc*1.4],odds:20,open:true}; }});

/* 9. DOUBLE BOX: a second box right after the first, no room to stop between */
gnBlock('double',{n:9,name:'Double box',decision:'commit to both before the first',vin:'fast',vout:'any',
  emit:function(c,r,o){ var rise=gnD(r,o.rise); gnBox(c,{d:gnD(r,o.d),rise:rise,W:gnW(r,o.W1,rise),odds:o.odds,capTo:o.caps[0]}); gnBox(c,{d:gnD(r,o.strip),rise:rise,W:gnW(r,o.W2,rise),odds:o.odds,capTo:o.caps[1]}); },
  ablate:function(o){ o.strip=300; return o; },  /* room to stop between */
  gen:function(c,r){ var rise=30+Math.round(30*c.hard); return {d:[360,440],rise:rise,W1:{full:[0.7+0.15*c.hard,c.cap]},W2:{full:[0.6+0.1*c.hard,c.cap+10]},strip:[50,80],odds:10,caps:[c.cap+10,c.cap+20]}; }});

/* 10. RISING STAKES: fall odds that climb box by box */
gnBlock('stakes',{n:10,name:'Rising stakes',decision:'the same mistake costs more later, so caution should grow',vin:'any',vout:'any',
  emit:function(c,r,o){ for(var i=0;i<o.odds.length;i++){ var d=gnD(r,o.gap),rise=gnD(r,o.rise),W=gnD(r,o.W); gnBox(c,{d:d,rise:rise,W:W,odds:o.odds[i]}); } },
  ablate:function(o){ var m=Math.round(o.odds.reduce(function(a,b){ return a+b; },0)/o.odds.length); o.odds=o.odds.map(function(){ return m; }); return o; },
  gen:function(c,r){ var rise=12+Math.round(14*c.hard); return {odds:[5,25,50],gap:[300,400],rise:rise,W:[gnFW(c,rise,0.55),gnFW(c,rise,0.95)]}; }});

/* 11. STEWARD AHEAD: a rival that stops at every box and builds while its wall grows behind it */
gnBlock('steward',{n:11,name:'Steward ahead',decision:'shelter behind it, or pass it',vin:'any',vout:'any',emit:function(){},
  rivals:function(o){ return o.list||[{post:o.abl?'rvRead':'rvSteward',name:'Warden',x:420,pts:[40,50,62],pat:1.5,w:[20,50,30]}]; },gen:function(){ return {}; },
  ablate:function(o){ o.abl=true; return o; },road:{n:4,gap:[340,480],rise:[28,44],W:[58,108],odds:25}});
/* 12. PIONEER: a rival that always crosses first, and pays for it */
gnBlock('pioneer',{n:12,name:'Pioneer',decision:'patience for the share, or take the lead',vin:'any',vout:'any',emit:function(){},
  rivals:function(o){ return o.list||(o.abl?[{post:'rvRead',name:'Reader',x:-20,pts:[25,40,50],w:[25,40,35]}]:[{post:'rvRead',name:'Pioneer',x:150,pts:[50,75,70],w:[25,50,25]}]); },gen:function(){ return {}; },
  ablate:function(o){ o.abl=true; return o; },road:{n:4,gap:[420,560],W:[106,120],rise:12,odds:40}});
/* 13. BAIT CORRIDOR: reckless labs ahead, and walls they will not see in time if you lead them */
gnBlock('bait',{n:13,name:'Bait corridor',decision:'lead the reckless labs into the walls',vin:'any',vout:'any',
  emit:function(c,r,o){ for(var i=0;i<o.walls.length;i++){ gnWall(c,i?gnD(r,o.gap):gnD(r,o.first),o.walls[i]); } },
  rivals:function(o){ var p=o.abl?'rvRead':'rvGamble'; return o.list||[{post:p,name:'Ace',x:50,pts:[45,15,48],pace:1,strikes:1,w:[0,30,70]},{post:p,name:'Deuce',x:20,pts:[45,15,48],pace:1,strikes:1,w:[0,30,70]}]; },
  ablate:function(o){ o.abl=true; return o; },  /* careful labs instead of reckless ones */
  gen:function(c,r){ return {walls:[gnWallH(c,0),gnWallH(c,22),gnWallH(c,40)],first:[420,520],gap:[300,380]}; }});
/* 14. FALSE CALM: a long empty stretch that tempts you to pour everything into speed, then a wide box (The Only Box) */
gnBlock('calm',{n:14,name:'False calm',decision:'keep investing in sight during the calm',vin:'any',vout:'slow',
  emit:function(c,r,o){ var W=gnD(r,o.W),d=gnD(r,o.d),rise=gnD(r,o.rise); gnBox(c,{d:d,rise:rise,W:W,odds:o.odds,capTo:o.capTo,calm:true}); c.notes.push('The box was '+W+' wide.'); },
  ablate:function(o){ o.d=[350,450]; return o; },  /* no long stretch */
  gen:function(c,r){ return {W:{pick:[gnFW(c,10,0.5),gnFW(c,10,1.0),gnFW(c,10,1.3)]},d:[1100,1500],rise:[6,12],odds:20}; }});
/* 15. PATTERN BREAK: early boxes sized one way, then a last box sized to the leader's raised ceiling */
gnBlock('break',{n:15,name:'Pattern break',decision:'treat past evidence as evidence, not a promise',vin:'any',vout:'any',
  emit:function(c,r,o){ var i,cap=o.cap0; for(i=0;i<o.n;i++){ cap+=o.raise; gnBox(c,{d:gnD(r,o.gap),rise:o.rise,W:gnD(r,o.W),odds:o.odds,capTo:cap}); }
    gnBox(c,{d:gnD(r,o.gap),rise:o.same?o.rise:o.lastRise,W:o.same?gnD(r,o.W):Math.round(o.f*cpFull(cap,o.lastRise)),odds:o.lastOdds,capTo:cap+20}); },
  ablate:function(o){ o.same=true; return o; },  /* the last box like the others */
  gen:function(c,r){ return {n:2+Math.floor(r()*2),cap0:c.cap,raise:25,gap:[300,400],rise:12,W:[gnFW(c,12,0.4),gnFW(c,12,0.6)],odds:10,lastRise:24,f:0.6+0.2*c.hard,lastOdds:40}; }});
/* 16. UNKNOWN FINISH: the run-out after the last obstacle is drawn from a range, and the finish is hidden until it is within sight: the game page
   hides the flag and the minimap tick (game.js), and gnBlind below makes every bot posture see a far-off finish until then */
gnBlock('finish',{n:16,name:'Unknown finish',decision:'when to sprint becomes a bet',vin:'any',vout:'any',
  emit:function(c,r,o){ c.after=Math.round(gnD(r,o.after)); c.hideFinish=true; },gen:function(){ return {after:[150,900]}; },
  ablate:function(o){ o.after=525; return o; }});
/* 17. CHICKEN WALL: a very tall wall; whoever climbs it first lifts the labs watching (spill) */
gnBlock('chicken',{n:17,name:'Chicken wall',decision:'climb, or wait and dare them',vin:'any',vout:'any',
  emit:function(c,r,o){ gnWall(c,gnD(r,o.d),o.h); },
  ablate:function(o){ o.h=60; return o; },
  rivals:function(o){ return o.list||[{post:'rvBuild',name:'Mason',x:-20,pts:[25,40,45],w:[0,60,40]}]; },
  gen:function(c,r){ return {d:[320,420],h:gnWallH(c,60+30*c.hard)}; }});
/* 18. CLUMP START: every lab leaves together */
gnBlock('clump',{n:18,name:'Clump start',decision:'nerve, and using sight shadows',vin:'any',vout:'any',emit:function(){},
  rivals:function(o){ return o.list||[{post:'rvSprint',name:'Kite',x:30,pts:[12,30,52],pace:0.85,w:[0,20,80]},{post:'rvSprint',name:'Rook',x:-18,pts:[12,34,50],pace:0.85,w:[0,40,60]},{post:'rvGamble',name:'Jack',x:-40,pts:[12,28,50],pace:0.88,w:[0,10,90]}].map(function(q,i){ return o.abl?Object.assign({},q,{x:q.x+250*(i+1)}):q; }); },gen:function(){ return {}; },
  ablate:function(o){ o.abl=true; return o; },road:{n:6,gap:[130,250],rise:10,W:[26,44],odds:10}});  /* ablated: the rivals start spread out */

/* ---- gnMap(spec): spec = {key, title, q, strategy, you, after, blocks:[[id,settings],...], rules, dial, space, maxGap}. Rivals come from the blocks
   (fixed per map); road dice are thrown per race. space: put a micro moment into any stretch longer than maxGap (not into a false calm) ---- */
function gnMap(s){
  var rivals=[]; s.blocks.forEach(function(b){ if(!GN[b[0]]){ throw new Error('gen: no block '+b[0]); } if(GN[b[0]].rivals){ rivals=rivals.concat(GN[b[0]].rivals(b[1]||{})); } });
  var m={key:s.key,act:9,slot:s.slot||1,'lesson':'',title:s.title||s.key,strategy:s.strategy||'coleFollow',q:s.q||'',meta:s.meta||'',spec:s,
    hideFinish:s.blocks.some(function(b){ return b[0]==='finish'; }),  /* pattern 16: the page hides the flag and bots can't read the finish until it is in sight */
    P:{you:s.you||[20,35,50],rivals:rivals},
    track:function(r){ var c={it:[],boxes:0,notes:[],after:s.after===undefined?250:s.after,hideFinish:false};
      s.blocks.forEach(function(b){ var k=c.it.length; GN[b[0]].emit(c,r,b[1]||{}); if(b[1]&&b[1].runup&&c.it.length>k){ c.it[k].d+=200; } });  /* a 'slow' block before a 'fast' one: room to get back up to speed */
      if(s.space){ gnSpace(c,r,s.maxGap||600); }
      var t=gnRoad(c.it,c.after,(s.note?s.note+' ':'')+c.notes.join(' ')); t.hideFinish=c.hideFinish; return t; }};
  if(s.rules){ m.rules=s.rules; m.dial=s.dial; }
  if(s.soft){ m.soft=s.soft; }
  return m;
}
/* the micro rule (Cole's verdict on PR 38): never go long without a decision. A stretch longer than max gets a wall that needs a little more height
   than a lab at 60% of the ceiling can jump, or a small box with a low wall right behind it, in turns */
function gnSpace(c,r,max){
  var out=[],cap=70,k=0,i,o;
  for(i=0;i<c.it.length;i++){ o=c.it[i];
    if(o.d>max&&!o.calm){ var a=Math.round(o.d*(0.4+0.2*r())),h=Math.round(0.6*cap+C.JUMP+6+r()*14);
      if(k++%2===0){ out.push({d:a,bar:h,micro:1}); out.push(Object.assign({},o,{d:o.d-a})); }
      else { var W=Math.round(0.5*cpFull(cap,10)); out.push({d:a,rise:10,W:W,odds:10,capTo:cap,micro:1}); out.push({d:40+Math.round(r()*30),bar:Math.round(0.6*cap+C.JUMP-6),micro:1}); out.push(Object.assign({},o,{d:Math.max(120,o.d-a-W-70)})); } }
    else { out.push(o); }
    if(o.bar===undefined&&o.capTo!==undefined){ cap=o.capTo; } else if(o.bar===undefined){ cap+=15; } }
  c.it=out;
}
function gnAdd(m){ LESSONS.push(Object.assign(m,{soft:m.soft||{n:3},look:'',claim:{text:'',score:function(){ return 0; },need:0}})); Object.defineProperty(m,'labs',{get:function(){ return shLabs(this.P); },enumerable:true,configurable:true}); return m; }

/* ---- gnOne(id): one block on its own. A short run-in, the block with the settings the composer would give it a third of the way along a medium
   road, and a run-out. A pattern with no rivals of its own races one Reader (a steady lab), so there is somebody to beat ---- */
function gnOne(id,o,abl){
  var b=GN[id],c={u:0.35,hard:0.5,cap:70,A:0.2},set=JSON.parse(JSON.stringify(o||b.gen(c,rngMaker(7)))),blocks=[];
  if(abl){ set=b.ablate(set); }
  if(!b.rivals){ blocks.push(['rivals',{list:[{post:'rvRead',name:'Reader',x:-20,pts:[25,40,50],w:[25,40,35]}]}]); }
  blocks.push([id,set]);
  if(!b.emit.length){ blocks.push(['run',b.road||{n:3,gap:[300,420],rise:14,W:[46,70],odds:20}]); }  /* a rival pattern needs road */
  return gnFirst(gnMap({key:(abl?'abl-':'blk-')+id,title:'Block: '+b.name,q:b.decision,blocks:blocks,after:300}),id==='steward'?700:0);
}

/* ---- gnDraw(seed): the composer. Borrowed from genTrack: a difficulty shape over the road (steady climb, early wall, staircase, late cliff) and a
   deception level A (how far warning signs lie). Then one rival pattern, three to five road patterns, each placed at u along the road and given
   settings for that place, and the micro rule. Rules it keeps:
   - patterns overlap: the rival pattern runs over all the road patterns;
   - an interruption: at least one of tower, break, gate, fence, hidden, scrape sits in the second half (the strategy that won the first half
     meets something it did not plan for);
   - hidden information: at least one of tower, rhythm, hidden, signs, calm;
   - a 'slow' block followed by a 'fast' one gets a longer run-up;
   - a hidden finish on about a third of draws (pattern 16: unseen until in sight, by the player and the bots). ---- */
var GN_ROAD=['fence','tower','rhythm','gate','hidden','ceiling','signs','scrape','double','stakes','calm','break'],GN_RIV=['steward','pioneer','bait','clump','chicken'];
var GN_INTR=['tower','break','gate','fence','hidden','scrape'],GN_INFO=['tower','rhythm','hidden','signs','calm'];
function gnShape(k,u){ return clamp(k===0?0.2+0.7*u:k===1?(u<0.35?0.8:0.35+0.3*u):k===2?0.2+0.25*Math.floor(u*4):(u<0.7?0.25+0.15*u:0.95),0,1); }
function gnDraw(seed){
  var r=rngMaker(seed*7919+13),shape=Math.floor(r()*4),A=0.05+0.35*r(),riv=shPick(r,GN_RIV),n=3+Math.floor(r()*3),road=[],tries=0;
  do { road=shShuffle(r,GN_ROAD).slice(0,n); tries++; }
  while(tries<50&&(!road.slice(Math.floor(n/2)).some(function(b){ return GN_INTR.indexOf(b)>=0; })||!road.some(function(b){ return GN_INFO.indexOf(b)>=0; })));
  var c={cap:70,A:A},blocks=[[riv,GN[riv].gen(c,r)]],prev=null;
  if(riv==='steward'){ c.minFirst=700; }
  road.forEach(function(id,i){ c.u=(i+0.5)/n; c.hard=gnShape(shape,c.u); var set=GN[id].gen(c,r);
    if(prev&&GN[prev].vout==='slow'&&GN[id].vin==='fast'){ set.runup=true; }
    blocks.push([id,set]); prev=id; c.cap=gnCapAfter(id,set,c.cap); });
  if(r()<0.35){ blocks.push(['finish',GN.finish.gen(c,r)]); }
  var s={key:'gn-'+seed,title:'Draw '+seed,q:'',blocks:blocks,space:true,maxGap:600,after:250,
    note:'['+SHAPES[shape]+', A '+A.toFixed(2)+': '+blocks.map(function(b){ return b[0]; }).join(' + ')+']'};
  return gnFirst(gnMap(s),c.minFirst||0);
}
/* the ceiling after a block: lay it once with throwaway dice and follow its boxes' ceilings as gnRoad does (15 up when a box sets none) */
function gnCapAfter(id,set,cap){ var c={it:[],boxes:0,notes:[]}; GN[id].emit(c,rngMaker(1),set); c.it.forEach(function(o){ if(o.bar===undefined){ cap=o.capTo===undefined?cap+15:o.capTo; } }); return cap; }
/* the first obstacle no nearer than `x` (a steward starts 420 up the road and must not start inside a box), and a run-up after a slow block */
function gnFirst(m,x){ var tr=m.track; m.track=function(r){ var t=tr.call(this,r),i,first=Infinity,shift;
    t.bars.forEach(function(b){ first=Math.min(first,b.x); }); t.gaps.forEach(function(g){ first=Math.min(first,g.x); });
    shift=Math.max(0,x-first); if(shift){ t.bars.forEach(function(b){ b.x+=shift; }); t.gaps.forEach(function(g){ g.x+=shift; }); t.finish+=shift; }
    return t; }; return m; }

/* ---- EXPRESS: the 12 shipped maps as block sequences. Each must lay exactly the shipped road for every seed (check.mjs) ---- */
function gnShip(key){ for(var i=0;i<SHIP.length;i++){ if(SHIP[i].key===key){ return SHIP[i]; } } throw new Error('gen: no ship map '+key); }
var GN_EXPRESS={
  'picket':function(P){ return [['rivals',{list:P.rivals}],['gate',{hs:P.hs,first:P.first,gap:P.gap,shuffle:[1,5],insert:{after:3,box:{d:120,rise:12,W:40,odds:10,capTo:95}}}]]; },
  'long-sight':function(P){ return [['rivals',{list:P.rivals}],['rhythm',{n:P.n,mode:'some',pw:P.pw,maxWide:3,gap:P.gap,rise:6,W:P.fn,wide:P.fw,odds:P.odds,cap:{base:70,step:6}}]]; },
  'elbows':function(P){ return [['clump',{list:P.rivals}],['rhythm',{n:P.n,mode:'one',potAt:[4,P.n-1],potD:320,potPub:true,gap:P.gap,rise:{i:[8,7]},W:P.W,wide:P.pot,odds:P.odds,cap:{base:70,step:5}}]]; },
  'steward':function(P){ return [['steward',{list:P.rivals}],['run',{n:P.n,d0:P.rivals[0].x+260,gap:P.gap,rise:P.rise,W:P.W,odds:P.odds,cap:{base:70,step:10}}]]; },
  'takeoff':function(P){ return [['rivals',{list:P.rivals}],['rhythm',{n:{i:[P.n[0],P.n[1]-P.n[0]+1]},mode:'none',gap:P.gap,rise:10,W:[36,54],odds:10,cap:{base:70,step:4}}],
    ['tower',{n:1,gap:400,rise:P.tower.rise,W:P.tower.W,odds:P.tower.odds,caps:[P.tower.capTo]}],['gate',{hs:[P.wall],first:[230,290],pub:true}],
    ['box',{d:300,rise:P.b2.rise,W:[P.b2.W,P.b2.W+10],odds:P.b2.odds,capTo:P.b2.capTo,pub:true}],['gate',{hs:[P.wall+25],first:280,pub:true}],
    ['box',{d:330,rise:P.b3.rise,W:[P.b3.W,P.b3.W+10],odds:P.b3.odds,capTo:P.b3.capTo}]]; },
  'red-box':function(P){ return [['bait',{list:P.rivals,walls:P.walls.map(function(w){ return w.h; }),first:P.first,gap:P.gap}],['box',{d:520,rise:P.red.rise,W:P.red.W,odds:P.red.odds,capTo:110}]]; },
  'trailbreaker':function(P){ return [['pioneer',{list:P.rivals}],['run',{n:P.n,gap:P.gap,rise:P.rise,W:P.W,odds:P.odds,cap:{base:80,step:15}}]]; },
  'three-strikes':function(P){ return [['rivals',{list:P.rivals}],['scrape',{n:P.n,pb:P.pb,nb:2,gap:P.gap,rise:P.rise,Wn:P.Wn,Wb:P.Wb,Wg:P.Wg,odds:P.odds,cap:{base:70,step:8},open:true}]]; },
  'only-box':function(P){ return [['rivals',{list:P.rivals}],['calm',{W:{pick:P.Ws},d:P.d,rise:P.rise,odds:P.odds,capTo:100}]]; },
  'ladder':function(P){ return [['rivals',{list:P.rivals}],['ceiling',{n:P.n,rise0:P.rise0,step:P.step,gap:P.gap,W:P.W,odds:P.odds,oddsStep:5,cap:{base:70+P.capStep,step:P.capStep}}]]; },
  'second-order':function(P){ return [['rivals',{list:P.rivals}],['tower',{n:P.n,gap:P.gap,rise:P.tower.rise,riseStep:10,W:P.tower.W,odds:P.odds,cap:{base:80,step:25},behind:P.behind,strip:P.strip,wall:128,wallStep:14,back:P.back}]]; },
  'two-endings':function(P){ var c=P.a.caps[P.a.n-1]; return [['rivals',{list:P.rivals}],
    ['run',{n:P.a.n,gap:P.a.x,gap2:P.a.gap,rise:P.a.rise,W:{full:[P.a.f,70]},odds:P.a.odds,caps:P.a.caps,boxCap:70}],
    ['gate',{hs:[P.fence.h1,P.fence.h2],first:P.fence.d,gap:P.fence.gap,pub:true}],
    ['double',{d:P.ex.d,rise:P.ex.rise,W1:{full:[P.ex.f1,c]},W2:{full:[P.ex.f2,P.ex.caps[0]]},strip:P.ex.strip,odds:P.ex.odds,caps:P.ex.caps}],
    ['tower',{gap:P.tower.d,rise:P.tower.rise,W:P.tower.W,odds:P.tower.odds,capTo:P.tower.capTo,tcap:70,ccap:70,strip:P.strip,cellar:P.cellar}]]; }
};
var GN_AFTER={'picket':function(P){ return P.after; },'long-sight':function(){ return 70; },'elbows':function(){ return 120; },'steward':function(){ return 110; },'takeoff':function(){ return 260; },
  'red-box':function(){ return 170; },'trailbreaker':function(P){ return P.after; },'three-strikes':function(){ return 110; },'only-box':function(){ return 220; },'ladder':function(){ return 160; },
  'second-order':function(){ return 170; },'two-endings':function(P){ return P.after; }};
function gnExpress(key){ var sm=gnShip(key),P=sm.P;
  return gnMap({key:'ex-'+key,title:'As blocks: '+sm.title,q:sm.q,strategy:sm.strategy,you:P.you,blocks:GN_EXPRESS[key](P),after:GN_AFTER[key](P),rules:sm.rules,dial:sm.dial,soft:sm.soft}); }

/* pattern 16 for bots: on a map with a hidden finish, a posture deciding for lab l sees the finish far away until it is within l's sight. Done by
   wrapping every posture (SGC/SGP) and swapping G.finish only while it decides, so the sim itself is untouched. Only maps with hideFinish change */
function gnFinSeen(l){ return !SEG||!SEG.hideFinish||G.finish-l.x<=sightRange(l); }
function gnBlindWrap(f){ if(f.gnBlind){ return f; } var g=function(l){ if(gnFinSeen(l)){ return f.apply(this,arguments); } var real=G.finish; G.finish=l.x+1e6;
  try{ return f.apply(this,arguments); } finally { G.finish=real; } }; g.gnBlind=1; return g; }
function gnBlind(){ [SGC,SGP].forEach(function(T){ Object.keys(T).forEach(function(k){ if(typeof T[k]==='function'){ T[k]=gnBlindWrap(T[k]); } }); }); }
gnBlind();

/* register: one map per block (debug mode) and the 12 shipped maps as blocks. Drawn maps are added by the checks (gnAdd(gnDraw(seed))). The game page
   sets GN_NOREG: it only draws maps on demand (?gen=1&seed=N) */
if(typeof GN_NOREG==='undefined'){
Object.keys(GN).filter(function(id){ return GN[id].n>0; }).forEach(function(id){ gnAdd(gnOne(id)); gnAdd(gnOne(id,null,true)); });  /* abl-<id>: the same map without the pattern's key feature, for the proof */
Object.keys(GN_EXPRESS).forEach(function(k){ gnAdd(gnExpress(k)); });
}
