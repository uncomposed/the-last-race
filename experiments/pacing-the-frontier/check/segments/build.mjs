// Builds segments.html from the hidden-width page (../hidden-width/page-hidden.html): hidden width, step gaps and the posture bots, plus
//   1. sim hooks: the track hook gets the seed, globalThis.SEGPOST(G) runs once the labs exist, and a box's own odds (g.odds) replace the
//      level odds when set
//   2. segments-sim.js, injected into the sim section (so check.mjs runs the same code in Node), with segUse and SEGS on window.PF
//   3. the page: hidden-width mode always on, ?seg=N (1 to 12) picks the segment, and the header becomes a segment picker with the question,
//      what to look for, and a reveal of the variant you just raced
// Every replacement must match exactly once, or this script fails.   node build.mjs
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
let S = readFileSync(join(HERE, '..', 'hidden-width', 'page-hidden.html'), 'utf8');
const SIMJS = readFileSync(join(HERE, 'segments-sim.js'), 'utf8');
function rep(a, b) { const n = S.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ' for: ' + a.slice(0, 80)); S = S.replace(a, () => b); }

// 1. sim hooks
rep("globalThis.SCEN(T,{C:C,K:K,", "globalThis.SCEN(T,{seed:seed,C:C,K:K,");
rep("  log('Run started. Seed '+seed+'. '+T.label+'.');", "  if(globalThis.SEGPOST){ globalThis.SEGPOST(G); }\n  log('Run started. Seed '+seed+'. '+T.label+'.');");
// a stopped lab's barrier at a box face is its height rounded down, not to nearest: rounding up made a lab at the same height (often the
// ceiling, 69.9 against 70) jump the barrier just before the box, so it came down inside the box and fell
rep("function installBarrier(l,g){\n  var hh=Math.round(heightOf(l))", "function installBarrier(l,g){\n  var hh=Math.floor(heightOf(l)+1e-6)");
// the wall rule (Cole, 2026-11-05): a lab that stops or backs off in front of a box it can see puts its wall up at once, and the wall grows with
// its height while it stays; it no longer appears only when the lab moves off, and the old fixed 260 zone is replaced by the lab's own sight
rep("A tower (barrier) stands before a box only if a lab stopped in front of it and built: see installBarrier.",
  "A tower (barrier) stands before a box only if a lab stopped or backed off in front of it: see installBarrier.");
rep("/* step mode: a lab that stood still in front of a box and then leaves puts up a barrier just before the face, as tall as it is when it leaves (after building).\n" +
  "   The taller barrier stays. Labs already past its spot, and the installer if it is tall enough, are not stopped by it. Non-lethal, like any tower. */\n" +
  "function installBarrier(l,g){\n  var hh=Math.floor(heightOf(l)+1e-6),i,m; l.stopG=-1;\n  if(hh<8){return;}\n" +
  "  if(hh>(g.stepH||0)){\n    g.stepH=hh; ev(l,'barrier',{gap:l.gi+1,h:hh});\n" +
  "    log(l.name+' stopped before gap '+(l.gi+1)+' and left a barrier of '+hh+' at its edge.');\n",
  "/* step mode: a lab that stops (stands still 0.3 s) or backs off in front of a box, with the face within its sight and seen, puts up a wall just\n" +
  "   before the face at once, as tall as it is (8 at least). While it stays stopped or backing off there the wall grows with its height; it stops\n" +
  "   growing when the lab moves forward again. The taller wall stays. Labs already past its spot, and the lab whose height it matches, are not\n" +
  "   stopped by it. Non-lethal, like any tower. l.stopG marks the box whose wall this lab is raising. */\n" +
  "function installBarrier(l,g){\n  var hh=Math.floor(heightOf(l)+1e-6),i,m,first=l.stopG!==l.gi;\n  if(hh<8){return;}\n  l.stopG=l.gi;\n" +
  "  if(hh>(g.stepH||0)){\n    g.stepH=hh;\n" +
  "    if(first){ ev(l,'barrier',{gap:l.gi+1,h:hh}); log(l.name+' stopped before gap '+(l.gi+1)+' and put up a wall of '+hh+' at its edge.'); }\n");
rep("  if(sg0&&stepOn(sg0)&&!l.gx&&!l.out&&!l.stepDone[l.gi]){\n    var sdist=sg0.x-l.x;\n" +
  "    if(sdist>0&&sdist<=C.STEPD+110&&l.still>=0.3){ l.stopG=l.gi; }\n" +
  "    if(l.stopG===l.gi&&l.v>1&&sdist>0){ installBarrier(l,sg0); }\n  }",
  "  if(sg0&&stepOn(sg0)&&!l.gx&&!l.out){\n    var sdist=sg0.x-l.x;\n" +
  "    if(sdist>0&&(l.still>=0.3||(l.v<-0.5&&!l.bounce))&&(l.stopG===l.gi||(!l.stepDone[l.gi]&&sdist<=sightRange(l)&&knowsGap(l,l.gi)))){ installBarrier(l,sg0); }\n  }");
rep("function gapOdds(k){var g=G.gaps[k];return ", "function gapOdds(k){var g=G.gaps[k];if(g.odds!==undefined){return g.odds;}return ");

// tall boxes that hide what is behind them (Cole, 2026-11-05): a box with shade:true casts a sight shadow like a lab. The edge that limits the
// view is the near top corner when the eye is below the box's top, the far top corner when it is above. Only boxes marked shade do this, so
// every existing map races as before. A shadow's `top` replaces the lab height in the see-over test; bots do not slow for a box's shadow
rep("    if(end>db){out.push({by:m,a:db,b:Math.min(end,sr)});}\n  }\n  return out;\n}",
  "    if(end>db){out.push({by:m,a:db,b:Math.min(end,sr)});}\n  }\n" +
  "  for(i=0;i<G.gaps.length;i++){ var gq=G.gaps[i]; if(!gq.shade||!stepOn(gq)){continue;}\n" +
  "    var gt=gq.rise,ga=(eye>gt?gq.x+gq.W:gq.x)-l.x; if(ga<=0||ga>=sr){continue;}\n" +
  "    var gend=eye>gt?ga*eye/(eye-gt):sr; if(gend>ga){out.push({by:{name:'the tall box',box:true,v:0,still:99},top:gt,a:ga,b:Math.min(gend,sr)});} }\n" +
  "  return out;\n}");
rep("rt=heightOf(sh[i].by)+C.RW; line=", "rt=sh[i].top!==undefined?sh[i].top:heightOf(sh[i].by)+C.RW; line=");
rep("var m=sh[si].by; if(m.v<l.v+1){", "var m=sh[si].by; if(!m.box&&m.v<l.v+1){");

// a box may set the ceiling it hands out (Cole's maps need a ceiling curve the map controls, 2026-11-05): with g.capTo the first lab across
// gets capTo and every other lab its share of the rise from the crosser's old ceiling. Boxes without capTo use C.CAPS by index, as before
rep("  var d=C.CAPS[k+1]-C.CAPS[k],T=C.CAPS[k+1]+(G.gaps[k].sing?C.SINGUP:0);",
  "  var gk=G.gaps[k],own=gk.capTo!==undefined,hi=own?gk.capTo:C.CAPS[k+1],d=own?Math.max(0,gk.capTo-by.cap):C.CAPS[k+1]-C.CAPS[k],T=hi+(gk.sing?C.SINGUP:0);");
rep("    else { l.cap=Math.min(C.CAPS[k+1],Math.max(l.cap,", "    else { l.cap=Math.min(hi,Math.max(l.cap,");
// a later lab that crosses a capTo box itself gets that box's ceiling, as crossing any box gives its full ceiling
rep("    l.cap=Math.max(l.cap,C.CAPS[k+1]); l.gapStopT=undefined;", "    l.cap=Math.max(l.cap,g.capTo!==undefined?g.capTo:C.CAPS[k+1]); l.gapStopT=undefined;");

// SOFT CEILING (Cole, 2026-11-05): a map with soft:{n:...} has no hard ceiling. Up to the ceiling a meter grows at the usual rate, as before;
// past it at the usual rate times (cap/p)^n, so ever slower (n 3: 30% at 1.5 times the ceiling, 12% at twice it), but it never stops. The
// ceiling becomes the knee of the curve, and crossing a box first still moves it. n is the bend (bigger: sharper knee), one number or one per meter [sight, height, speed]. Maps without soft are
// unchanged: K.soft is 0 unless segUse sets it from the map
rep("    for(var i=0;i<3;i++){ l.pts[i]=Math.min(l.cap,l.pts[i]+r*(w[i]/tot)*((l.id===0&&K.investYou>0)?K.investYou:K.invest)*M*dt); }",
  "    for(var i=0;i<3;i++){ var gr=r*(w[i]/tot)*((l.id===0&&K.investYou>0)?K.investYou:K.invest)*M*dt;\n" +
  "      if(K.soft){ l.pts[i]+=l.pts[i]<=l.cap?Math.min(gr,l.cap-l.pts[i])+Math.max(0,gr-(l.cap-l.pts[i]))*Math.pow(l.cap/Math.max(l.pts[i]+gr,1),softN(i)):gr*Math.pow(l.cap/l.pts[i],softN(i)); } else { l.pts[i]=Math.min(l.cap,l.pts[i]+gr); } }");
rep("function capped(l){", "function softN(i){ var n=K.softN; return typeof n==='number'?n:(n&&n[i])||3; }\nfunction capped(l){");
// with a soft ceiling the meters show the value and the knee as a marker only ("130 · knee 115" would crowd the canvas)
rep("v=Math.round(l.pts[i])+'/'+Math.round(l.cap),nm=names[i];", "v=K.soft?String(Math.round(l.pts[i])):Math.round(l.pts[i])+'/'+Math.round(l.cap),nm=names[i];");
rep("$('v'+i).textContent=Math.round(l.pts[i])+' / '+Math.round(l.cap);", "$('v'+i).textContent=K.soft?Math.round(l.pts[i])+' (knee '+Math.round(l.cap)+')':Math.round(l.pts[i])+' / '+Math.round(l.cap);");

// with a soft ceiling standing still is building, so "everyone has stood 12 s: nobody will cross" waits 60 s instead
rep("if(sm.still>=12&&!sm.gx){st++;}", "if(sm.still>=(K.soft?60:12)&&!sm.gx){st++;}");

// 2. the segments, just before window.PF (inside the section check.mjs extracts)
rep("\nwindow.PF={setRoster:", "\n" + SIMJS + "\nwindow.PF={segUse:segUse,SEGS:SEGS,setRoster:");

// 3. the page
rep("window.HIDDEN=!!(qh&&qh[1]==='1');", "window.HIDDEN=true;  /* SEGMENTS: always on */");
rep("\nvar qr=/[?&]rivals=([a-z,]+)/i.exec(location.search);",
  "\n/* SEGMENTS: ?seg=N picks the segment and fills the header */\n" +
  "var qsg=/[?&]seg=(\\d+)/.exec(location.search),SEGN=qsg?Math.max(1,Math.min(SEGS.length,+qsg[1])):1; segUse(SEGN);\n" +
  "(function(){\n" +
  "  var sel=$('seg-pick'),i,o,go=function(n){ var c=/[?&]chill=(0|1)/.exec(location.search); location.search='?seg='+n+(c?'&chill='+c[1]:''); };\n" +
  "  for(i=0;i<SEGS.length;i++){ o=document.createElement('option'); o.value=i+1; o.textContent=(i+1)+'. '+SEGS[i].title; if(i+1===SEGN){o.selected=true;} sel.appendChild(o); }\n" +
  "  sel.onchange=function(){ go(+sel.value); };\n" +
  "  $('seg-prev').onclick=function(){ go(SEGN>1?SEGN-1:SEGS.length); }; $('seg-next').onclick=function(){ go(SEGN<SEGS.length?SEGN+1:1); };\n" +
  "  $('seg-n').textContent='Segment '+SEGN+' of '+SEGS.length; $('seg-title').textContent=SEG.title; $('seg-q').textContent=SEG.q;\n" +
  "  $('seg-meta').textContent=SEG.meta; $('seg-look').textContent=SEG.look;\n" +
  "  $('seg-rev').addEventListener('toggle',function(){ $('seg-note').textContent=(G&&G.world&&G.world.note)||''; });\n" +
  "})();\n" +
  "var qr=/[?&]rivals=([a-z,]+)/i.exec(location.search);");
rep("'?seed='+G.seed+(G_ROSTER", "'?seg='+SEGN+'&seed='+G.seed+(G_ROSTER");
rep(`    <p class="eyebrow">Prototype 0.3</p>
    <h1>Pacing the Frontier</h1>`,
  `    <p class="eyebrow" id="seg-n">Segment</p>
    <h1 id="seg-title">Pacing the Frontier</h1>
    <p class="seg-q" id="seg-q"></p>
    <div class="seg-bar"><button type="button" id="seg-prev" aria-label="Previous segment">&lsaquo; Prev</button><select id="seg-pick" aria-label="Pick a segment"></select><button type="button" id="seg-next" aria-label="Next segment">Next &rsaquo;</button></div>
    <details class="seg-more"><summary>What this is about</summary><p id="seg-meta"></p><p id="seg-look"></p></details>
    <details class="seg-more" id="seg-rev"><summary>After the race: what was this variant?</summary><p id="seg-note"></p><p class="seg-tip">New run draws a new variant of the same segment.</p></details>`);
rep('<p class="sub">Race three rival labs to the finish.', '<p class="sub" hidden>Race three rival labs to the finish.');
rep("</style>\n\n<main", "/* SEGMENTS */\n.seg-q{font-size:17px;max-width:62ch;margin:4px 0 10px}\n.seg-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px}\n.seg-bar select,.seg-bar button{font:500 14px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:6px 10px;min-height:36px}\n.seg-bar select{flex:1;min-width:0;max-width:340px}\n.seg-more{max-width:62ch;margin:0 0 6px;color:var(--muted)}\n.seg-more summary{cursor:pointer;color:var(--ink)}\n.seg-more p{margin:6px 0}\n.seg-tip{font-size:14px}\n</style>\n\n<main");
S = S.replace(/<title>[^<]*<\/title>/, '<title>Race Segments</title>');
writeFileSync(join(HERE, 'segments.html'), S);
console.log('wrote segments.html');
