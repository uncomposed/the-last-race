// Builds a lesson page from the segments page (../segments/segments.html, as committed; rebuild that first if segments-sim.js changed):
//   1. sim: two rule knobs the segments page lacks (K.oddsX scales every box's own fall odds, K.sightX scales sight per point); postures in
//      NOPEEK never hop to peek (rush would not use what it saw; in segment 3 the hop alone made it fall); SGC adds cruise behaviour
//   2. lessons-sim.js and the lesson maps (<lesson>/maps.js, which push onto LESSONS), injected before window.PF; the maps replace SEGS
//   3. the page: ?map=<key> picks a map (?seg=N still works), ?rules=share:70,odds:150 sets rule knobs, and the header says which lesson
// Every replacement must match exactly once, or this script fails.
//   node build.mjs                  all lessons -> lessons.html
//   node build.mjs --only <lesson>  one lesson  -> <lesson>/page.html (what a lesson author builds and checks; never touches lessons.html)
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
let S = readFileSync(join(HERE, '..', 'segments', 'segments.html'), 'utf8');
function rep(a, b) { const n = S.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ' for: ' + a.slice(0, 80)); S = S.replace(a, () => b); }

const dirs = readdirSync(HERE, {withFileTypes: true}).filter(d => d.isDirectory() && existsSync(join(HERE, d.name, 'maps.js'))).map(d => d.name).sort();
const pick = ONLY ? dirs.filter(d => d === ONLY) : dirs.filter(d => d !== 'example');
if (ONLY && !pick.length) throw new Error('no ' + ONLY + '/maps.js');
const MAPS = pick.map(d => '/* ---- lesson: ' + d + ' ---- */\n' + readFileSync(join(HERE, d, 'maps.js'), 'utf8')).join('\n');

// 1. sim
rep('peek:1,stepGaps:0', 'peek:1,oddsX:100,sightX:100,stepGaps:0');
rep('function sightRange(l){return C.SIGHT0+4.4*l.pts[0];}', 'function sightRange(l){return C.SIGHT0+4.4*K.sightX/100*l.pts[0];}');
rep('if(g.odds!==undefined){return g.odds;}', 'if(g.odds!==undefined){return clamp(g.odds*K.oddsX/100,0,95);}');
rep('if(!K.peek){ return inp; }', 'if(!K.peek||(l.post&&NOPEEK[l.post])){ return inp; }');
rep("  if(!g){\n    if(p==='tail'){", "  if(!g){\n    if(SGC[p]){ return SGC[p](l); }\n    if(p==='tail'){");

// 2. lessons and maps
rep('\nwindow.PF={segUse:segUse,SEGS:SEGS,', '\n' + readFileSync(join(HERE, 'lessons-sim.js'), 'utf8') + '\n' + MAPS +
  '\nif(LESSONS.length){ SEGS=LESSONS; }\nwindow.PF={segUse:segUse,SEGS:SEGS,RULES:RULES,LESSONS:LESSONS,rulesApply:rulesApply,');

// 3. the page
rep('var qsg=/[?&]seg=(\\d+)/.exec(location.search),SEGN=qsg?Math.max(1,Math.min(SEGS.length,+qsg[1])):1; segUse(SEGN);',
  'var qsg=/[?&]seg=(\\d+)/.exec(location.search),SEGN=qsg?Math.max(1,Math.min(SEGS.length,+qsg[1])):1;\n' +
  '/* LESSONS: ?map=<key> picks a map by its key; ?rules=share:70 sets rule knobs (kept when you move between maps) */\n' +
  'var qmk=/[?&]map=([A-Za-z0-9_-]+)/.exec(location.search); if(qmk){ for(var mi=0;mi<SEGS.length;mi++){ if(SEGS[mi].key===qmk[1]){ SEGN=mi+1; } } }\n' +
  'var qru=/[?&]rules=([a-z0-9:.,]+)/i.exec(location.search),RULESQ=\'\';\n' +
  'if(qru){ var ro={}; qru[1].split(\',\').forEach(function(p){ var kv=p.split(\':\'); if(kv.length===2){ ro[kv[0]]=kv[1]; } }); RULESQ=rulesApply(ro); }\n' +
  'segUse(SEGN);');
rep("location.search='?seg='+n+(c?'&chill='+c[1]:'');", "location.search='?map='+SEGS[n-1].key+(RULESQ?'&rules='+RULESQ:'')+(c?'&chill='+c[1]:'');");
rep("'?seg='+SEGN+'&seed='+G.seed+(G_ROSTER", "'?map='+SEG.key+(RULESQ?'&rules='+RULESQ:'')+'&seed='+G.seed+(G_ROSTER");
rep("$('seg-n').textContent='Segment '+SEGN+' of '+SEGS.length;",
  "$('seg-n').textContent=(SEG.lesson?'Lesson: '+SEG.lesson+' · ':'')+'Map '+SEGN+' of '+SEGS.length+(RULESQ?' · rules '+RULESQ.replace(/,/g,', '):'');");
rep('aria-label="Previous segment"', 'aria-label="Previous map"');
rep('aria-label="Pick a segment"', 'aria-label="Pick a map"');
rep('aria-label="Next segment"', 'aria-label="Next map"');
rep('New run draws a new variant of the same segment.', 'New run draws a new variant of the same map.');
S = S.replace(/<title>[^<]*<\/title>/, '<title>Lesson Maps</title>');
const out = ONLY ? join(HERE, ONLY, 'page.html') : join(HERE, 'lessons.html');
writeFileSync(out, S);
console.log('wrote ' + out.slice(HERE.length + 1) + ' (' + pick.join(', ') + ')');
