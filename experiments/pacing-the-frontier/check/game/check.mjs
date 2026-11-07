// Checks the shipped game page (game.html, built by build.mjs) under plain Node, no install:
//   a. it is one static file, and no part of the page outside the simulation refers to a removed feature
//   b. three acts of three maps and three dailies, and each of the 12 loads and runs bot races to a finish
//   c. the daily rotates through its three maps by UTC date, with dice set by the date
// Bot play only: this shows the maps run. It says nothing about whether a person can win them or enjoys them.   node check.mjs
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), SRC = readFileSync(join(HERE, 'game.html'), 'utf8'), LINES = SRC.split('\n');
const fails = []; const fail = m => { fails.push(m); console.log('FAIL ' + m); };

// a. the page
if (/<script[^>]+src=/.test(SRC)) fail('page loads an external script');
const A = LINES.findIndex(l => l.startsWith('function $(id)')), B = LINES.findIndex(l => l.startsWith('window.PF={'));
if (A < 0 || B < A) throw new Error('simulation section not found');
const OUTSIDE = (LINES.slice(0, A).join('\n') + '\n' + LINES.slice(B + 1).join('\n')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
for (const w of ['Achievement', 'Dial room', 'Free play', 'Leaderboard', 'Lesson:', 'Professor', 'Chill mode', 'Falls roll', 'A fall here rolls', 'Watch bots', 'Play seed', 'New run', 'Tuning knobs', 'Epilogue', 'Challenge a friend', 'Segment '])
  if (OUTSIDE.toLowerCase().includes(w.toLowerCase())) fail('page still refers to: ' + w);
for (const w of ['not evidence', 'prediction', 'github.com/uncomposed/the-last-race', 'ai-2027.com', 'ai-2040.com', '80000hours.org'])
  if (!OUTSIDE.includes(w)) fail('page lost: ' + w);

// b. the maps
const W = new Function('window', 'document', LINES.slice(A, B + 1).join('\n') + '\nreturn window;')({}, null), PF = W.PF;
const K0 = JSON.parse(JSON.stringify(PF.K));
const camp = PF.SEGS.filter(m => m.act), daily = PF.SEGS.filter(m => m.daily);
if (camp.length !== 9 || new Set(camp.map(m => m.act + ':' + m.slot)).size !== 9 || camp.some(m => m.act < 1 || m.act > 3 || m.slot < 1 || m.slot > 3)) fail('expected 3 acts of 3 maps, got ' + camp.map(m => m.act + ':' + m.slot));
if (daily.length !== 3 || new Set(daily.map(m => m.daily)).size !== 3) fail('expected 3 dailies');
if (new Set(PF.SEGS.map(m => m.key)).size !== PF.SEGS.length) fail('map keys repeat');
for (const m of PF.SEGS) if (!m.title || !m.q) fail(m.key + ': needs a title and a question');
for (const m of PF.SEGS) if (/\d\s*%|\bodds\b/i.test(m.q)) fail(m.key + ': the question gives fall odds');
if (!PF.SHIP_ACTS || PF.SHIP_ACTS.length !== 3 || PF.SHIP_ACTS.some(a => !a.line || /placeholder/i.test(a.line))) fail('needs three real act lines');
for (const m of PF.SEGS) if (/^ph-/.test(m.key)) fail(m.key + ': a placeholder map is still in the page');
const POSTURES = ['rush', 'build', 'wait'];
PF.SEGS.forEach((m, i) => {
  let finished = 0, n = 0; const out = {};
  for (const you of POSTURES) for (let seed = 1; seed <= 4; seed++) {
    for (const k in PF.K) delete PF.K[k]; Object.assign(PF.K, K0); PF.K.stepGaps = 1; PF.K.chill = 1;
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(i + 1, you); PF.newGame(seed, 'probe');
    const G = PF.G(); let g = 0;
    while (!G.over && g++ < 60000) PF.step(1 / 60);
    n++; const t = G.result ? G.result.type : 'none'; out[t] = (out[t] || 0) + 1;
    if (t === 'win' || t === 'all' || t === 'allout') finished++;
  }
  console.log((m.daily ? 'daily ' + m.daily : 'act ' + m.act + ' map ' + m.slot).padEnd(12) + m.key.padEnd(24) + JSON.stringify(out));
  if (!finished) fail(m.key + ': no bot race reached a finish in ' + n);
});

// c. the daily, using the page's own function
const fn = readFileSync(join(HERE, 'game.js'), 'utf8').match(/^function gmDailyOf\(date\)\{.*$/m)[0];
const of = new Function('gmDailyMaps', fn + '\nreturn gmDailyOf;')(() => daily);
const week = ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'].map(of);
if (new Set(week.slice(0, 3).map(d => d.map.key)).size !== 3) fail('the daily does not rotate through 3 maps');
if (week[0].map !== week[3].map) fail('the daily does not repeat after 3 days');
if (new Set(week.map(d => d.seed)).size !== 4 || of('2026-11-07').seed !== week[0].seed) fail('daily dice are not set by the date');
if (fails.length) { console.log(fails.length + ' failed'); process.exit(1); }
console.log('game page checks pass');
