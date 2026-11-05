/* ---- LESSONS (check/lessons): the rule knobs every lesson map is tested against, and the list of lesson maps. Injected by build.mjs after
   the segments code, so a lesson map is a segment (same fields as SEGS in segments-sim.js) plus a lesson name and a claim. See LESSONS.md.
   RULES are the only knobs a lesson is tuned against. check.mjs --grid reruns each claim at every rule's low and high value.
   DIALS (2026-11-05, CAMPAIGN-PROPOSAL.md section 4b). The rules are of two kinds. World dials are facts about the race nobody knows (the six
   grid rules, and spill). The policy dial is a choice people make: the speed limit (kind:'policy'), the only one. A map in Acts I to IV sets
   no dial: a map that only works at one setting breaks the next time the game is tuned, and the player is still learning the defaults. Only
   Act V maps set a dial, exactly one, in one of three ways (dialCheck enforces it; the page fails to load otherwise):
     dial:'announced'  one world dial, named on the map card: a what-if
     dial:'hidden'     one world dial, named only after the race: Unknown World
     dial:'policy'     the speed limit, named on the card
   whatIf(baseKey, fields) makes such a map as a twin of another map: same track and rivals, one dial changed. ---- */
var RULES=[
  {key:'odds',k:'oddsX',def:100,lo:50,hi:150,name:'Fall odds',unit:'% of each box’s own odds',
   says:function(v){ return 'Falls are '+(v>100?'more':'less')+' likely to end the world: '+v+'% of each box’s usual odds.'; },
   means:'The chance that everyone dies when a lab falls into a box. Each box sets its own odds; this scales them all.'},
  {key:'share',k:'share',def:40,lo:20,hi:70,name:'Follower share',unit:'% of the level-up',
   says:function(v){ return 'Breakthroughs leak '+(v>40?'more':'less')+': labs behind get '+v+'% of the first crosser’s level-up (normally 40%).'; },
   means:'When the first lab crosses a box it gets the next ceiling. Every other lab gets this share of the raise.'},
  {key:'narrow',k:'stepL0',def:25,lo:12,hi:50,name:'Narrowing distance',unit:'track units',
   says:function(v){ return 'A crossed box narrows '+(v<25?'sooner':'later')+' behind the first lab across (half as wide once it is '+v+' past; normally 25).'; },
   means:'A crossed box narrows for everyone behind as the first lab moves past it: half as wide once the leader is this far past. Smaller means following gets safe sooner.'},
  {key:'sight',k:'sightX',def:100,lo:70,hi:130,name:'Sight per point',unit:'% of 4.4 units per point',
   says:function(v){ return 'Each point of sight sees '+(v>100?'further':'less far')+' than usual: '+v+'%.'; },
   means:'How far each point of sight lets a lab see. Sight range is 80 plus this times the sight meter.'},
  {key:'build',k:'invest',def:14,lo:10,hi:18,name:'Build rate',unit:'points per second',
   says:function(v){ return 'Care is '+(v<14?'slower':'faster')+': meters fill at '+v+' points a second (normally 14).'; },
   means:'How fast a lab fills its meters. This is the price of stopping: a slow build makes care expensive.'},
  {key:'strikes',k:'strikes',def:3,lo:2,hi:4,name:'Strikes',unit:'strikes',
   says:function(v){ return 'Labs are shut down at '+v+' strikes (normally 3).'; },
   means:'How many scrapes and crashes a lab survives before it dissolves.'},
  /* experiments (exp:1): rules under trial, 2026-10-31. Not in the grid; set them with ?rules= or check.mjs --rules */
  {key:'brake',k:'brakeX',def:100,lo:100,hi:256,exp:1,name:'Braking',unit:'% of 15.6 (acceleration is 40, so 256 brakes as hard as it speeds up)',
   means:'How hard every lab can brake.'},
  {key:'brakesight',k:'brakeSight',def:0,lo:0,hi:150,exp:1,name:'Braking from sight',unit:'% extra braking with the sight meter at the ceiling',
   means:'A lab that invests in seeing ahead trusts what it sees and stops sooner: braking grows with the sight meter as a share of the ceiling.'},
  {key:'space',k:'space',def:100,lo:50,hi:100,exp:1,name:'Track spacing',unit:'% of the open track between obstacles',
   means:'Shrinks the open run between obstacles (the first 100 of each stretch is kept, so a barrier right before a box stays right before it). Less track, less time to build.'},
  {key:'spill',k:'spill',def:40,lo:0,hi:80,exp:1,name:'Barrier spillover',unit:'% of what the crosser knows, up to the wall',
   says:function(v){ return 'Watching a lab clear a wall lifts you by '+v+'% of what it knows (normally 40%).'; },
   means:'A lab that clears a barrier lifts each lab behind it that saw it, once per barrier, by this share of the gap between the watcher’s height and the smaller of the wall and the crosser’s height. A watcher never passes the lab it watched.'},
  {key:'spillrule',k:'spillRule',def:1,lo:0,hi:1,exp:1,name:'Spill rule',unit:'0 old, 1 new',
   means:'0: the old rule (this % of the wall’s height, from every crossing in view, labs ahead too). 1: the share of what the crosser knows, once per barrier, labs behind only.'},
  /* the policy dial (2026-11-05): Cole's speed limit. A cap on every lab's top speed (after the singularity multiplier), while ceilings still
     rise; and the speed a lab may not use is not lost: investment uses the top speed it would have without the limit (build.mjs). Tested in
     bot play in CAMPAIGN-PROPOSAL.md section 6c. Off (0) changes nothing */
  {key:'pace',k:'paceCap',def:0,lo:0,hi:0,exp:1,kind:'policy',name:'Speed limit',unit:'top speed, 0 off (a full speed meter is about 110)',
   says:function(v){ return v>0?'A speed limit of '+v+': nobody may go faster. Ceilings still rise, and the speed you may not use goes into building.':'No speed limit.'; },
   means:'Pacing: no lab may go faster than this. Capability still grows, since ceilings rise as boxes are crossed. A lab held at the limit keeps building as if it could go faster, so the spare goes to its meters. A paced map’s boxes must be crossable at the limit.'},
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
/* dials: the rule entry for a key, what a map's dial says in words, and applying a map's dial (segUse calls dialApply after configure) */
function ruleOf(key){ for(var i=0;i<RULES.length;i++){ if(RULES[i].key===key){ return RULES[i]; } } return null; }
function dialKey(m){ return m&&m.rules?Object.keys(m.rules)[0]:null; }
function dialText(m){ var k=dialKey(m),r=ruleOf(k); if(!r){ return ''; } return m.dialSays||(r.says?r.says(m.rules[k]):r.name+' is '+m.rules[k]+' (normally '+r.def+').'); }
function dialApply(m){ var k=dialKey(m),r=ruleOf(k); if(r){ K[r.k]=+m.rules[k]; } }
function dialCheck(){ LESSONS.forEach(function(m){
  if(!m.rules&&!m.dial){ return; }
  var keys=m.rules?Object.keys(m.rules):[],r=ruleOf(keys[0]),bad=function(w){ throw new Error('map '+m.key+': '+w+' (lessons-sim.js, DIALS)'); };
  if(keys.length!==1){ bad('a map sets exactly one dial, not '+keys.length); }
  if(!r){ bad('unknown dial '+keys[0]); }
  if(r.kind==='policy'?m.dial!=='policy':(m.dial!=='announced'&&m.dial!=='hidden')){ bad(r.kind==='policy'?'the speed limit needs dial:\'policy\'':'a world dial needs dial:\'announced\' or \'hidden\''); }
  if(!r.kind&&(r.exp&&r.key!=='spill')){ bad('only the grid rules and spill are world dials'); }
}); }
/* whatIf('cp-break', {key, title, q, dial, rules, ...}): a map that is another map with one dial changed. Resolved after every lesson's maps
   are loaded (build.mjs), so the base may live in any folder; the twin keeps the base's track, rivals, strategy and claim unless overridden */
var WHATIF=[];
function whatIf(base,o){ WHATIF.push({base:base,o:o}); }
function whatIfResolve(){ WHATIF.forEach(function(w){
  var b=LESSONS.filter(function(m){ return m.key===w.base; })[0],m={};
  if(!b){ throw new Error('whatIf: no map '+w.base+'. Build with every lesson (node build.mjs, or --all), not --only'); }
  Object.defineProperties(m,Object.getOwnPropertyDescriptors(b));  /* keeps getters, such as the campaign maps' labs */
  Object.keys(w.o).forEach(function(k){ Object.defineProperty(m,k,{value:w.o[k],enumerable:true,writable:true,configurable:true}); });
  m.twin=w.base; LESSONS.push(m);
}); WHATIF=[]; }
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
