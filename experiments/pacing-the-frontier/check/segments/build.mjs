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
rep("function gapOdds(k){var g=G.gaps[k];return ", "function gapOdds(k){var g=G.gaps[k];if(g.odds!==undefined){return g.odds;}return ");

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
