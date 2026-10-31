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
   means:'How many scrapes and crashes a lab survives before it dissolves.'}
];
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
