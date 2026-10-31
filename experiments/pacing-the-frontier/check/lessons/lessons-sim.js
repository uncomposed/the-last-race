/* ---- LESSONS (check/lessons): the rule knobs every lesson map is tested against, and the list of lesson maps. Injected by build.mjs after
   the segments code, so a lesson map is a segment (same fields as SEGS in segments-sim.js) plus a lesson name and a claim. See LESSONS.md.
   RULES are the only knobs a lesson is tuned against. Maps never set them: a map that only works at one setting is a map that breaks the
   next time the game is tuned. check.mjs --grid reruns each claim at every rule's low and high value. ---- */
var RULES=[
  {key:'odds',k:'oddsX',def:100,lo:50,hi:150,name:'Fall odds',unit:'% of each box’s own odds',
   means:'The chance that everyone dies when a lab falls into a box. Each box sets its own odds; this scales them all.'},
  {key:'share',k:'share',def:40,lo:20,hi:70,name:'Follower share',unit:'% of the level-up',
   means:'When the first lab crosses a box it gets the next ceiling. Every other lab gets this share of the raise.'},
  {key:'narrow',k:'stepL0',def:25,lo:12,hi:50,name:'Narrowing distance',unit:'track units',
   means:'A crossed box narrows for everyone behind as the first lab moves past it: half as wide once the leader is this far past. Smaller means following gets safe sooner.'},
  {key:'sight',k:'sightX',def:100,lo:70,hi:130,name:'Sight per point',unit:'% of 4.4 units per point',
   means:'How far each point of sight lets a lab see. Sight range is 80 plus this times the sight meter.'},
  {key:'build',k:'invest',def:14,lo:10,hi:18,name:'Build rate',unit:'points per second',
   means:'How fast a lab fills its meters. This is the price of stopping: a slow build makes care expensive.'},
  {key:'strikes',k:'strikes',def:3,lo:2,hi:4,name:'Strikes',unit:'strikes',
   means:'How many scrapes and crashes a lab survives before it dissolves.'},
  /* experiments (exp:1): rules under trial, 2026-10-31. Not in the grid; set them with ?rules= or check.mjs --rules */
  {key:'brake',k:'brakeX',def:100,lo:100,hi:256,exp:1,name:'Braking',unit:'% of 15.6 (acceleration is 40, so 256 brakes as hard as it speeds up)',
   means:'How hard every lab can brake.'},
  {key:'brakesight',k:'brakeSight',def:0,lo:0,hi:150,exp:1,name:'Braking from sight',unit:'% extra braking with the sight meter at the ceiling',
   means:'A lab that invests in seeing ahead trusts what it sees and stops sooner: braking grows with the sight meter as a share of the ceiling.'},
  {key:'space',k:'space',def:100,lo:50,hi:100,exp:1,name:'Track spacing',unit:'% of the open track between obstacles',
   means:'Shrinks the open run between obstacles (the first 100 of each stretch is kept, so a barrier right before a box stays right before it). Less track, less time to build.'},
  {key:'wallstop',k:'wallStop',def:0,lo:0,hi:1,exp:1,name:'Wall when stopped',unit:'0 off, 1 on',
   means:'On: a lab stopped at a box leaves its barrier at once, growing with its height. Off: the barrier appears only when it starts forward again.'}
];
/* braking for lab l: every C['DEC'] in the sim and the bots is replaced by decOf(l) in the lesson build */
function decOf(l){ if(K.brakeX===100&&!K.brakeSight){ return C['DEC']; } return C['DEC']*K.brakeX/100*(1+K.brakeSight/100*(l&&l.cap?clamp(l.pts[0]/l.cap,0,1):0)); }
/* track spacing: every stretch of open track between obstacles (from the start, 0) keeps its first 100 and shrinks the rest to K.space% */
function lessonSpace(t){
  if(K.space===100){ return t; }
  var f=K.space/100,ob=[],i,o,shift=0,prevEnd=0,prevEnd0=0,len;
  t.bars.forEach(function(b){ ob.push({o:b,x:b.x,w:0}); }); t.gaps.forEach(function(g){ ob.push({o:g,x:g.x,w:g.W}); });
  ob.sort(function(a,b){ return a.x-b.x; });
  for(i=0;i<ob.length;i++){ o=ob[i]; len=o.x-prevEnd0; var nl=len>100?100+f*(len-100):len; o.o.x=Math.round(prevEnd+nl); prevEnd0=o.x+o.w; prevEnd=o.o.x+o.w; }
  len=t.finish-prevEnd0; t.finish=Math.round(prevEnd+(len>100?100+f*(len-100):len));
  return t;
}
var LESSONS=[];
/* a lesson may add its own postures: SGP.name=function(l,g,st) runs once a box is next and seen (as in segments-sim.js), SGC.name=function(l)
   runs while cruising (return null for the page's own bot plan). NOPEEK.name=1 stops a posture from hopping to peek (rush never peeks). */
var SGC={},NOPEEK={rush:1};
/* ?rules=share:70,odds:150 (page) or check.mjs: set rule knobs by key; returns the canonical query fragment */
function rulesApply(o){ var out=[],i,r; for(i=0;i<RULES.length;i++){ r=RULES[i]; if(o[r.key]!==undefined){ K[r.k]=+o[r.key]; out.push(r.key+':'+(+o[r.key])); } } return out.join(','); }
/* maxout: the strategy Cole found by playing (2026-10-31). Split Run 70 / Build 30 into height and speed only, never sight; once both are
   at the ceiling, floor it. It never stops and never looks. check.mjs runs it on every map: a lesson map should beat it */
SGC.maxout=function(l){ var full=l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01; return sgInp(full?1:0.7,[0,50,50],full?{fwd:true}:{}); };
SGP.maxout=function(l,g,st){ return SGC.maxout(l); };
NOPEEK.maxout=1;
/* ADVERSARY POOL (2026-10-31): simple strategies a player who plays to win would try first. A lesson map should make its lesson beat
   every one of them. Named adv-<split>-<box>:
     split  what the build goes into while running at 70%, flooring it once those meters are at the ceiling:
            hs height+speed (= maxout), s speed, h height, v sight, even all three, vs sight-heavy
     box    at a seen box: go (never brakes), plan (once the width is known, plan the crossing; if not, go), wait (hold back until the width
            is known or 15 s pass, then plan) */
var ADV_SPLITS={hs:[0,50,50],s:[0,0,100],h:[0,100,0],v:[100,0,0],even:[34,33,33],vs:[50,25,25]};
var ADV=[];
function advCruise(l,w){ var full=true,i; for(i=0;i<3;i++){ if(w[i]>0&&l.pts[i]<l.cap-0.01){ full=false; } } return full?sgInp(1,w,{fwd:true}):sgInp(0.7,w); }
Object.keys(ADV_SPLITS).forEach(function(sk){
  var w=ADV_SPLITS[sk];
  ['go','plan','wait'].forEach(function(bx){
    var name='adv-'+sk+'-'+bx; ADV.push(name); NOPEEK[name]=1;
    SGC[name]=function(l){ return advCruise(l,w); };
    SGP[name]=function(l,g,st){
      if(bx==='go'){ return advCruise(l,w); }
      if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown(l,g,st); }
      if(bx==='plan'){ return advCruise(l,w); }
      var late=sgLate(l,g,st); if(late){ return late; }
      st.t=(st.t||0)+1/60; if(st.t>15){ st.go=true; return sgInp(1,w,{fwd:true}); }
      return sgHold(l,g,w);
    };
  });
});
ADV.push('rush','build','wait');
