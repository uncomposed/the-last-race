// Builds page-hidden.html from the scenario lab's page-scen.html (BOXU 0.25 timing, SCEN track hook) with three sim patches:
//   1. globalThis.CTRL(l, G) -> input | null: an outside controller for any lab (null falls back to the page's own bot plan)
//   2. a box's far edge is hidden until a lab's line of sight over the box top reaches the ground before the far edge, or until any lab
//      has crossed, scraped or fallen at that box (g.wpub). Per lab: l.wseen[i]. Exposed as PF.knowsWidth(l, i).
//      Eye level is height plus body, as in shadows(). A lab no taller than the box never sees past the face.
//   3. nothing else: the physics, the bots' own plan (which still reads the true width) and the bar are unchanged.
//   8. the jump peek (K.peek): a lab in the air looks from its jump height, so it can see a box face (or a barrier) over a rival's head.
//      Width is still judged from standing eye height, so a peek says "a box, this tall" but never how wide (Cole, 2026-10-30).
//      Bots peek too: shadowed, next box unknown, and only once they near the far end of what their last peek showed.
// Every replacement must match exactly once, or this script fails.
import {readFileSync, writeFileSync} from 'node:fs';
const [src, dst] = process.argv.slice(2);
let S = readFileSync(src, 'utf8');
function rep(a, b) { const n = S.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ' for: ' + a.slice(0, 70)); S = S.replace(a, b); }

// 1. controller hook
rep("var inp=l.human?humanInput(l):botInput(l);",
    "var inp=l.human?humanInput(l):botPeek(l,(globalThis.CTRL&&globalThis.CTRL(l,G))||botInput(l));");

// 2a. per-lab memory of far edges seen
rep("crashedOn:{},stepDone:{},seenB:{},seenG:{},flash:null,",
    "crashedOn:{},stepDone:{},seenB:{},seenG:{},wseen:{},flash:null,");

// 2b. far-edge visibility, checked each step next to the near-face check in updatePublic
rep("    for(j=l.gi;j<ng&&G.gaps[j].x-l.x<=sightRange(l);j++){ if(inView(l,G.gaps[j].x,s)){l.seenG[j]=true;sg[j].push(l);} }",
    "    var s0=shadows(l,1);  /* width: standing eye (no peeking at it) */\n    for(j=l.gi;j<ng&&G.gaps[j].x-l.x<=sightRange(l);j++){ if(gapInView(l,G.gaps[j],s)){l.seenG[j]=true;sg[j].push(l);} if(!l.wseen[j]&&farEdgeInView(l,G.gaps[j],s0)){l.wseen[j]=true;} }");

// 2c. the geometry. A box top is seen from above at a grazing angle: with the eye above the rise, the top surface is in view from the face
//     out to (eye - rise) / C.SEEANG from the lab, never past sight range, and the far edge must not sit in a rival's shadow. seenW is how
//     much of the top is in view (0 to W); the width is known once that reaches W. So "at least N wide" grows as a lab approaches or gets taller.
rep("function knowsGap(l,i){",
    "function seenW(l,g,sh){\n" +
    "  var d=g.x-l.x,eye=heightOf(l)+C.RW,sr=sightRange(l);\n" +
    "  if(!stepOn(g)||g.rise<=0){ return inView(l,g.x+g.W,sh)?g.W:0; }\n" +
    "  if(d<=0){ return g.W; }\n" +
    "  if(d>sr||eye<=g.rise){ return 0; }\n" +
    "  return clamp(Math.min((eye-g.rise)/C.SEEANG-d,sr-d),0,g.W);\n" +
    "}\n" +
    "function farEdgeInView(l,g,sh){ if(seenW(l,g,sh)<g.W-1e-9){ return false; } return g.x-l.x<=0||inView(l,g.x+g.W,sh); }\n" +
    "function knowsWidth(l,i){ var g=G.gaps[i]; return !!g&&(g.wpub||l.gi>i||!!l.wseen[i]||farEdgeInView(l,g,shadows(l,1))); }\n" +
    "/* a box face is seen through a rival's shadow when its top stands above the sight line over that rival's head */\n" +
    "function inViewTop(l,x,top,sh){\n" +
    "  var d=x-l.x; if(d>sightRange(l)){return false;}\n" +
    "  var eye=eyeOf(l),i,rt,line;\n" +
    "  for(i=0;i<sh.length;i++){ if(d>sh[i].a&&d<sh[i].b){ rt=heightOf(sh[i].by)+C.RW; line=eye+(rt-eye)*d/sh[i].a; if(top<line){return false;} } }\n" +
    "  return true;\n" +
    "}\n" +
    "function gapInView(l,g,sh){ return stepOn(g)?inViewTop(l,g.x,g.rise,sh):inView(l,g.x,sh); }\n" +
    "function knowsGap(l,i){");
rep("function knowsGap(l,i){var g=G.gaps[i];return !!g&&(g.pub||l.gi>i||!!l.seenG[i]||inView(l,g.x,shadows(l)));}",
    "function knowsGap(l,i){var g=G.gaps[i];return !!g&&(g.pub||l.gi>i||!!l.seenG[i]||gapInView(l,g,shadows(l)));}");
rep("BOXU:0.25,BOXFIT:0}", "BOXU:0.25,BOXFIT:0,SEEANG:0.15}");

// 2d. a crossing (clean or scrape) or a fall makes the width public
rep("function crossGap(l,g,k){\n", "function crossGap(l,g,k){\n  g.wpub=true;\n");
rep("function fall(l,k){\n", "function fall(l,k){\n  if(G.gaps[k]){ G.gaps[k].wpub=true; }\n");

// 4. the crash or scrape cap ends a distance ahead (K.capDist, scrapeCap) OR after K.capSecs seconds, whichever comes first,
//    so a lab that stands still while capped is not stuck under the forced split for ever (Cole, 2026-10-30)
rep("function capped(l){return l.capUntil>l.x;}", "function capped(l){return l.capUntil>l.x&&!(l.capT!==undefined&&G.t>=l.capT);}");
rep("l.capUntil=Math.max(l.capUntil,bx+K.capDist);", "l.capUntil=Math.max(l.capUntil,bx+K.capDist); l.capT=G.t+K.capSecs;");
rep("l.capUntil=Math.max(l.capUntil,g.x+gw2+K.scrapeCap*lost2);", "l.capUntil=Math.max(l.capUntil,g.x+gw2+K.scrapeCap*lost2); l.capT=G.t+K.capSecs;");
rep("l.capUntil=Math.max(l.capUntil,g.x+gw+K.scrapeCap*lost);", "l.capUntil=Math.max(l.capUntil,g.x+gw+K.scrapeCap*lost); l.capT=G.t+K.capSecs;");
rep("singGap:100,stepGaps:0,", "singGap:100,capSecs:5,peek:1,stepGaps:0,");
// 6. stalemate: when nobody has finished and every lab still in the race has stood still for 12 s (none in the air), the run ends as a time-out
//    at once instead of running the 300 s clock (Cole, 2026-10-30: two refusing bots left the race hanging)
rep("  if(!G.over&&G.t>C.TLIMIT){G.over=true;G.result={type:'timeout'};log('Time limit reached.');}",
    "  if(!G.over&&G.t>C.TLIMIT){G.over=true;G.result={type:'timeout'};log('Time limit reached.');}\n" +
    "  if(!G.over){ var sl=0,st=0,si; for(si=0;si<G.labs.length;si++){ var sm=G.labs[si]; if(sm.out||sm.done){continue;} sl++; if(sm.still>=12&&!sm.gx){st++;} } if(sl>0&&st===sl){ G.over=true; G.result={type:'timeout'}; log('Nobody will cross. The run ends with no winner.'); } }");
// 7. the barrier a stopped lab leaves at a box face does not limit backing up: a lab that stood close to see the box could otherwise never
//    make room for its run-up (Cole, 2026-10-30: "they aren't backing up"). Real barriers and the previous box still do.
rep("  if(cg&&l.stepDone[l.gi]){lim=Math.max(lim,stepX(cg)+C.BW+2);}\n", "  /* HIDDEN WIDTH: the guard a stopped lab left does not limit backing up */\n");
// 5. beacon boxes: g.beacon is set by the track; the width is public from the start (g.wpub) and so is the box (g.pub), set where the track is built

// 8. the jump peek. Eye level adds the jump height while in the air (K.peek), for the sight shadow and for box faces seen over a rival's head.
//    shadows(l, 1) is the standing look, which is all the width check uses. Bots: hop while shadowed and the next box is unknown, but only
//    once they near the far end of what their last peek showed (sight range at the top of that hop), less their braking distance.
rep("function shadows(l){\n  var out=[],sr=sightRange(l),eye=heightOf(l)+C.RW;",
    "/* JUMP PEEK: in the air the eye is at the jump height, so a lab can look over a rival ahead. stand=1 is the eye on the ground (the width check) */\n" +
    "function eyeOf(l,stand){ return heightOf(l)+C.RW+(!stand&&K.peek&&l.jt>=0?l.jy:0); }\n" +
    "function shadows(l,stand){\n  var out=[],sr=sightRange(l),eye=eyeOf(l,stand);");
rep("function knowsGap(l,i){",
    "/* JUMP PEEK for bots: shadowed by a rival and the next box not yet seen, hop to look; at the top of the hop remember how far it saw (l.peekTo),\n" +
    "   and hop again only when that frontier comes within braking distance. Never next to a known barrier, whose own jump comes first */\n" +
    "function botPeek(l,inp){\n" +
    "  if(!K.peek){ return inp; }\n" +
    "  if(l.jt>=0){ if(l.jy>=0.9*C.JUMP){ l.peekTo=Math.max(l.peekTo===undefined?-1e9:l.peekTo,l.x+sightRange(l)); } return inp; }\n" +
    "  if(inp.jump||inp.rev||l.gx||l.bounce||l.out||l.done||l.v<0){ return inp; }\n" +
    "  if(!G.gaps[l.gi]||knowsGap(l,l.gi)||!shadows(l,1).length){ return inp; }\n" +
    "  if(G.barriers[l.bi]&&knowsBar(l,l.bi)&&G.barriers[l.bi].x-l.x<Math.max(l.v,0)*jumpDur(l.v)+30){ return inp; }\n" +
    "  if(l.peekTo!==undefined&&l.x+l.v*l.v/(2*C.DEC)+40<l.peekTo){ return inp; }\n" +
    "  return Object.assign({},inp,{jump:true});\n" +
    "}\n" +
    "function knowsGap(l,i){");

// 2e. expose
rep("knowsBar:knowsBar,knowsGap:knowsGap,", "knowsBar:knowsBar,knowsGap:knowsGap,knowsWidth:knowsWidth,farEdgeInView:farEdgeInView,seenW:seenW,shadows:shadows,eyeOf:eyeOf,");

writeFileSync(dst, S);
console.log('wrote', dst);
