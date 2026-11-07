/* ---- act5 (2026-11-05): Act V of the campaign, "Pace the Frontier" (CAMPAIGN-PROPOSAL.md, Act V and section 4b). The only maps that set a
   dial (lessons-sim.js, DIALS). Each is a twin of another map with one dial changed, made with whatIf, except Slow Is Smooth, the base for
   the speed limit pair. Their claims say what the dial does; none has a lesson strategy for the judge, since the lesson is the comparison.
   Build with every lesson (node build.mjs or --all): the twins' bases live in campaign/. ---- */

/* Slow Is Smooth: a map built for the speed limit (designed 2026-11-04, CAMPAIGN-PROPOSAL.md section 6c). Box widths come from cpWc
   (campaign/maps.js: the sim's flight rules, auto-jump on) against the ceiling a lab has at that box if it never crossed first (cpCapAt), at a
   face speed of 80: under the limit only a lab built close to its ceiling lands a box clean. Without the limit a lab at modest height and full
   speed (about 110) lands them too, which tempts the pack to floor it */
var PACE={n:4,x0:800,gap:700,rise:10,v:80,f:0.95,odds:35,olast:50};
LESSONS.push({key:'pace-open',lesson:'Pacing',title:'Slow Is Smooth',
  q:'Three labs start together, and every box can be landed at full speed with modest height. Nobody is limiting anyone. How does it go?',
  meta:'In a neck-and-neck race on a fast road, nobody can afford to look, and a fall rolls everyone’s dice.',
  look:'Four low boxes. At full speed a lab with modest height lands them; at 80, only a lab built close to its ceiling does. The Rusher floors it and builds height and speed, never sight. Falls roll 35%, the last box 50%.',
  strategy:null,
  labs:[{x:0,pts:[20,40,50],pace:1,w:[30,50,20]},RIV('rush','Rusher',-12,[20,40,50],{pace:1,w:[0,50,50]}),RIV('build','Careful',-24,[20,40,50],{pace:1,w:[20,50,30]})],
  track:function(r){ var P=PACE,gs=[],i,x=P.x0,g,cap,W;
    for(i=0;i<P.n;i++){ cap=cpCapAt(i); W=P.f*cpWc(cap,Math.min(P.v,C.TOP0+0.85*cap),P.rise);
      g=cpBox(x,P.rise,W,i===P.n-1?P.olast:P.odds,70); gs.push(g); x+=g.W+P.gap; }
    return {bars:[],gaps:gs,finish:gs[gs.length-1].x+gs[gs.length-1].W+120,note:gs.map(function(q,k){ return 'Box '+(k+1)+': '+q.W+' wide.'; }).join(' ')+' Falls roll '+P.odds+'%, the last box '+P.olast+'%.'}; },
  postures:['cpRead','rush','build','maxout'],
  claim:{text:'Without a limit, the race ends in extinction in at least a third of races, whatever you play',
    score:function(t){ return Math.min(t.cpRead.ext,t.build.ext,t.maxout.ext); },need:33}});

/* the policy pair: the same race under Cole's speed limit */
whatIf('pace-open',{key:'pace-limit',title:'Slow Is Smooth, With a Speed Limit',dial:'policy',rules:{pace:80},
  q:'The same three labs and the same boxes. This time nobody may go faster than 80. How does it go now?',
  meta:'Pacing limits how fast anyone may go, not how far. Nobody breaks away, and the speed nobody may use goes into sight and height. It makes the race survivable; it does not choose the winner.',
  claim:{text:'With the limit, extinction falls below 10% whatever you play',
    score:function(t){ return 10-Math.max(t.cpRead.ext,t.build.ext,t.maxout.ext); },need:0}});

/* an announced what-if: Pattern Breaks when care is slower. The judge's rule grid found the reader losing at build rate 10 (campaign/JUDGE.md) */
whatIf('cp-break',{key:'slower-care',lesson:'Same track, different rules',title:'The Pattern Breaks, When Care Is Slower',dial:'announced',rules:{build:10},
  q:'The Pattern Breaks again, with one change: building takes longer. Does reading the road still win?',
  meta:'The constants of the race are not known. Here one of them moves and nothing else does: if the result flips, the rule decided it, not you.',
  strategy:null,postures:['cpRead','maxout','adv-h-go','build'],
  claim:{text:'When care is slower, a simple height-first habit beats reading the road',
    score:function(t){ return t['adv-h-go'].win-t.cpRead.win; },need:15}});

/* Unknown World: Warning Signs with a hidden dial. The card doesn't say what changed; the reveal does. The judge's grid found it flipping
   at follower share 70 (campaign/JUDGE.md). Cue on screen: labs behind you jump up whenever you cross first */
whatIf('cp-signs',{key:'unknown-world',lesson:'Unknown world',title:'Unknown World',dial:'hidden',rules:{share:70},
  q:'Barriers, then boxes, as on Warning Signs. Something about this world is different. Can you tell what, while you race?',
  meta:'You never know the constants of the race for sure. You infer them from what happens, and the race does not wait while you do.',
  strategy:null,postures:['cpRead','x-fill','maxout','build'],
  claim:{text:'In this world filling up and following beats reading the road',
    score:function(t){ return t['x-fill'].win-t.cpRead.win; },need:15}});
