// Builds the shipped game page from the lesson harness: three acts of three hand-built maps, a daily, and nothing else.
//   1. node ../lessons/build.mjs --only <folders> makes a lesson page of the map folders (segments.html must be current)
//   2. this script cuts the old game's campaign, daily, ghost links, achievements, recap and tuning, then adds game.js, game.css and screens.html
// Writes game.html beside this script, one static file with no build step for the player. Also copies it to ../lessons/lessons.html, because the Pages workflow on main
// only previews that path before merge (/preview/pr-N/lessons.html). ../lessons/build.mjs still builds the old lesson page there when run
// on its own; once pages.yml from this branch is on main the copy can go.
// Every replacement must match exactly once and every removed name and element must be unused, or this script fails.   node build.mjs
import {readFileSync, writeFileSync, existsSync, unlinkSync, copyFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const HERE = dirname(fileURLToPath(import.meta.url)), LES = join(HERE, '..', 'lessons');
const REAL = existsSync(join(LES, 'ship', 'maps.js'));
const FOLDERS = REAL ? 'campaign+showcase+ship' : 'campaign+showcase', LAST = REAL ? 'ship' : 'showcase';
execFileSync(process.execPath, [join(LES, 'build.mjs'), '--only', FOLDERS], {stdio: 'inherit'});
const TMP = join(LES, LAST, 'page.html');
let S = readFileSync(TMP, 'utf8');
unlinkSync(TMP);
const read = f => readFileSync(join(HERE, f), 'utf8');
function rep(a, b) { const n = S.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ' for: ' + a.slice(0, 80)); S = S.replace(a, () => b); }
const removed = [];
// cut from the start of marker a up to the start of marker b (each once)
function cut(a, b, put = '') {
  const i = S.indexOf(a); if (i < 0 || S.indexOf(a, i + 1) >= 0) throw new Error('cut start: ' + a.slice(0, 70));
  const j = S.indexOf(b, i + a.length); if (j < 0) throw new Error('cut end: ' + b.slice(0, 70));
  removed.push(S.slice(i, j)); S = S.slice(0, i) + put + S.slice(j);
}

// ---- which maps: only those with an act and slot or a daily number, in play order
const PLACE = read('placeholder.js');  // fills only the places ship/maps.js leaves empty
rep('if(LESSONS.length){ SEGS=LESSONS; }', PLACE + "\nSEGS=LESSONS.filter(function(m){ return m.daily||(m.act&&m.slot); }).sort(function(a,b){ return (a.daily?1:0)-(b.daily?1:0)||(a.daily||0)-(b.daily||0)||(a.act-b.act)||(a.slot-b.slot); });\nglobalThis.SHIP_ACTS=typeof SHIP_ACTS!=='undefined'?SHIP_ACTS:[];");
rep('window.PF={segUse:segUse,', 'window.PF={SHIP_ACTS:globalThis.SHIP_ACTS,segUse:segUse,');

// ---- CSS: the old game's sections
cut('/* ---- achievements (begin)', '/* ---- achievements (end) ---- */');
cut('/* ---- campaign (begin)', '/* ---- ghost links (end) ---- */');
rep('</style>\n\n<main', read('game.css') + '\n</style>\n\n<main');

// ---- phones: track labels are placed so they cannot sit on each other (track-labels.js); all of it after the simulation, so the stamp does not move
rep('function drawLab(l,cam,VW,FW,isHuman,idx){', read('track-labels.js') + 'function drawLab(l,cam,VW,FW,isHuman,idx){');
rep('ctx.setTransform(dpr*Z,0,0,dpr*Z,0,dpr*GY*(1-Z));  /* world: x scaled from the left edge, y about the ground line */', 'ctx.setTransform(dpr*Z,0,0,dpr*Z,0,dpr*GY*(1-Z));  /* world: x scaled from the left edge, y about the ground line */ lblBegin();');
rep('ctx.setTransform(dpr,0,0,dpr,0,0);  /* HUD: screen pixels */', 'lblEnd(VW,U); ctx.setTransform(dpr,0,0,dpr,0,0);  /* HUD: screen pixels */');
rep('ctx.fillText(lt,lx,ly);', 'lblLab=isHuman?2:1; ctx.fillText(lt,lx,ly); lblLab=0;');
rep('<text class="t-key" x="130" y="212" text-anchor="middle">keys 1 to 7 jump to a mark</text>', '<text class="t-key" id="tri-keys" x="130" y="212" text-anchor="middle">keys 1 to 7 jump to a mark</text>');

// ---- markup
cut('<header>', '</header>', '<header id="gm-head"><p class="eyebrow" id="gm-where"></p><h1 id="gm-title"></h1><p class="seg-q" id="gm-q"></p>');
cut('<div class="ov" id="ov">', '<div class="ov" id="ready" hidden>');
cut('        <!-- campaign (begin): difficulty picker', '        <button id="ready-snd"');
rep('<button id="ready-camp" type="button">Campaign</button><!-- campaign -->', '<button id="ready-back" type="button">Back to maps</button>');
rep('<h2 id="sing-h">Singularity ahead</h2>', '<h2 id="sing-h">The last box</h2>');
rep('<label for="auto" title="Auto-jump for everyone. Off: you jump by hand, and the bots jump with their own timing error."><input type="checkbox" id="auto" checked>Chill mode</label>',
  '<label for="auto" title="Auto-jump for every lab. Off: you jump by hand, and the rivals jump with their own timing error."><input type="checkbox" id="auto" checked>Auto-jump</label>');
rep('<label for="watch"><input type="checkbox" id="watch">Watch bots</label>', '');
rep('<button id="btn-restart" type="button">New run</button>', '<button id="btn-restart" type="button">Restart</button>');
rep('<button id="btn-camp" type="button">Campaign</button><!-- campaign -->', '<button id="btn-maps" type="button">Maps</button>');
cut('<label class="seedbox" for="seed-in">', '</div>', '');
rep('<p class="hint" id="hint" role="status" aria-live="polite" hidden></p>', '<p class="hint" id="hint" role="status" aria-live="polite" hidden></p>\n    <p class="gm-toast" id="gm-toast" role="status" aria-live="polite" hidden></p>');
cut('<div class="panel">\n    <h2>Events</h2>', '<p class="foot" id="seed"></p>');
cut('<p class="foot" id="seed"></p>', '<p class="foot">A game about racing');
cut('<!-- campaign (begin): the map list', '<script>\n/* sound', read('screens.html') + '\n');
rep('role="img" aria-label="Side-scrolling track. Your lab and three rivals run toward a finish line past barriers and hidden gaps."', 'role="img" aria-label="Side-scrolling track. Your lab and its rivals run toward a finish line past walls and boxes."');

// ---- script: the recap's commentary, the epilogue, and the old game's sections
cut('<script>\n/* end-of-run story', '<script>\n(function(){');
{ const i = S.indexOf('<script>\n/* Epilogue.'), j = S.indexOf('</script>', i) + 9; if (i < 0) throw new Error('epilogue'); removed.push(S.slice(i, j)); S = S.slice(0, i) + S.slice(j); }
rep("  $('log').innerHTML=li;\n", '');
rep("  $('seed').textContent='Seed '+G.seed+'. Track '+Math.round(G.finish)+' long. Time '+G.t.toFixed(1)+' s.';\n", '');
rep("  $('world').textContent=G.world.label;\n", '');
rep("  ghDraw(cam,VW,FW);", "  ");
cut('/* ---------- you raced like', 'var cardAt=-1e9;');
rep("var cards=['sing','ov'],i,b,bs;", "var cards=['sing'],i,b,bs;");
cut('function showOverlay(', 'var fresh=true;', 'function endScreen(){ gmEnd(); }\n');
cut('function parseSeed(', 'function go(){',
  "/* a race loads its track and waits on the map card, so the bar and the split can be set before Go */\n" +
  "function start(seed){\n  newGame(seed===undefined?(Math.random()*4294967295)>>>0:seed);\n  running=false; paused=false; acc=0; fresh=false; singShown=false;\n" +
  "  $('sing').hidden=true; $('btn-pause').textContent='Pause'; $('ready').hidden=false; cardAt=performance.now();\n}\n");
rep("  campGo();  /* campaign: fix the race's chill state and difficulty */\n", '');
rep("  dailyGo();  /* daily: count the attempt and fix the race's chill state */\n", '');
rep("  recStart();  /* every run: start the input log */\n", '');
rep("  achGo();  /* achievements: start this run's chill and shadow tally */\n", '');
rep("  RL=rlNew();  /* you raced like: start this run's habit tally */\n", '');
rep("syncInput(); ghRec(); recTick(); stepGame(1/60); achTick(1/60); rlTick(RL,hm,1/60); acc-=1/60;", "syncInput(); stepGame(1/60); gmTick(); acc-=1/60;");
rep("'</span> wide, the widest gap on this track. A fall here rolls '+Math.round(gapOdds(G.sing))+'%.'", "'</span> wide, the widest box on this track.'");
rep("$('btn-restart').addEventListener('click',function(){ if(CAMP){ campStart(CAMP.i,CAMP.tier); } else if(DLY){ dailyStart(DLY.date,DLY.tier); } else { start(); } });\n", "$('btn-restart').addEventListener('click',function(){ gmRestart(); });\n$('btn-maps').addEventListener('click',function(){ gmLeave(); });\n$('ready-back').addEventListener('click',function(){ gmLeave(); });\n");
cut("$('btn-seed').addEventListener(", "document.addEventListener('keyup',");
rep("  if(!$('achg').hidden){ if(e.code==='Escape'){e.preventDefault();achClose();} return; }  /* achievements gallery open: only Escape */\n", "  if(!$('gm').hidden){ return; }  /* a game screen is up: only its own buttons */\n");
rep("  if(!$('camp').hidden){ if(e.code==='Escape'){e.preventDefault();campClose();} return; }  /* campaign list open: only Escape */\n", '');
rep("e.target.id!=='ready-camp'", "e.target.id!=='ready-back'");
rep("gap:function(){ return '<b>Gap ahead.</b> '", "gap:function(){ return '<b>Box ahead.</b> '");
rep("'This gap needs speed. Move the dot", "'This box needs speed. Move the dot");
cut('  /* "How to play" on the Ready card', '})();\n\n/* knobs */');
cut('/* knobs */', '/* ---- HIDDEN_WIDTH_UI', read('ghost.js') + read('game.js') + '\n');
rep('syncInput(); stepGame(1/60); gmTick(); acc-=1/60;', 'syncInput(); if(REC){ ghTick(REC,G.input); } stepGame(1/60); if(REC){ ghAfter(REC,G.input); } gmTick(); acc-=1/60;');
rep('    /* ghost link: drawn under the labs, never part of the sim */\n', '    ghDrawBest(cam,VW,FW);  /* drawn under the labs, never part of the sim */\n');
cut("var qh=/[?&]hidden=(0|1)/", "if(window.HIDDEN){", "window.HIDDEN=true; window.NBOX=1; window.WF0=null;\n");
rep("  K.stepGaps=1; var hsgi=$('k-stepGaps'); if(hsgi){ hsgi.checked=true; $('o-k-stepGaps').textContent='on'; }\n", "  K.stepGaps=1;\n");
{ const a = 'CM?GY-21*U:GY+86', n = S.split(a).length - 1; if (n !== 3) throw new Error('expected 3 jump labels, got ' + n); S = S.split(a).join('CM?Math.min(GY-21*U,GY-gtop-20*U):GY+86'); }  /* phones: the jump line sits above the box label, not on it */
rep("  if(!qc){ K.chill=0; ui.auto=false; $('auto').checked=false; showChill(); }\n", "  K.chill=1; ui.auto=true; $('auto').checked=true; showChill();  /* auto-jump on by default (Cole) */\n");
cut('var qsg=/[?&]seg=', 'newGame(s0===null', "var SEGN=1; segUse(1);\n");
rep("newGame(s0===null?(Math.random()*4294967295)>>>0:s0);\nshowSeed(); $('pace').value=ui.pace;", "newGame(1);\n$('pace').value=ui.pace;");
cut("if(qd){ var dd=''", '})();\n</script>', "gmBoot();\n");
S = S.split('C.DEC').join('decOf(l)');
S = S.replace(/<title>[^<]*<\/title>/, '<title>Pacing the Frontier</title>');

// ---- nothing kept may need what was cut
const scripts = [...S.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const code = scripts.replace(/\/\*[\s\S]*?\*\//g, '');
const names = new Set();
for (const r of removed) for (const m of r.matchAll(/^(?:function ([A-Za-z_$][\w$]*)|var ([A-Za-z_$][\w$]*))/gm)) names.add(m[1] || m[2]);
const defined = new Set([...code.matchAll(/(?:function |var |,)([A-Za-z_$][\w$]*)(?=[(=])/g)].map(m => m[1]));
const bare = code.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
names.delete('read');  // the epilogue's private helper; the name kept code uses is the SGP.read object key
const dangling = [...names].filter(n => new RegExp('(^|[^\\w$.])' + n.replace(/\$/g, '\\$') + '\\b').test(bare) && !defined.has(n));
if (dangling.length) throw new Error('kept code uses removed names: ' + dangling.join(', '));
const ids = new Set([...S.matchAll(/\bid="([\w-]+)"/g)].map(m => m[1]));
const missing = [...new Set([...code.matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]))].filter(i => !ids.has(i));
if (missing.length) throw new Error('kept code uses removed elements: ' + missing.join(', '));

// stamp the page with the hash of its simulation section, maps included, so a recorded run from any other build refuses to load
{ const L = S.split('\n'), a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={')); if (a < 0 || b < a) throw new Error('simulation section');
  const id = createHash('sha256').update(L.slice(a, b + 1).join('\n')).digest('hex').slice(0, 16); rep("var SIM_ID='';", "var SIM_ID='" + id + "';"); }

writeFileSync(join(HERE, 'game.html'), S);
copyFileSync(join(HERE, 'game.html'), join(LES, 'lessons.html'));
console.log('wrote game.html and the preview copy, ' + Math.round(S.length / 1024) + ' KB, maps: ' + (REAL ? 'ship' : 'placeholders'));
