// Checks the shipped game page (game.html, built by build.mjs) under plain Node, no install:
//   a. it is one static file, and no part of the page outside the simulation refers to a removed feature
//   b. three acts of three maps and three dailies, and each of the 12 loads and runs bot races to a finish
//   c. the daily rotates through its three maps by UTC date, with dice set by the date
//   d. the recap and award cards: outside the simulation, told from every map's events in box words, and each award earned exactly when its events happen
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
for (const w of ['Dial room', 'Free play', 'Leaderboard', 'Lesson:', 'Chill mode', 'Falls roll', 'A fall here rolls', 'Watch bots', 'Play seed', 'New run', 'Tuning knobs', 'Epilogue', 'Challenge a friend', 'Segment '])
  if (OUTSIDE.toLowerCase().includes(w.toLowerCase())) fail('page still refers to: ' + w);
for (const w of ['not evidence', 'prediction', 'github.com/uncomposed/the-last-race', 'ai-2027.com', 'ai-2040.com', '80000hours.org'])
  if (!OUTSIDE.includes(w)) fail('page lost: ' + w);

// b. the maps
const W = new Function('window', 'document', LINES.slice(A, B + 1).join('\n') + '\nreturn window;')({}, null), PF = W.PF;
const K0 = JSON.parse(JSON.stringify(PF.K));
const camp = PF.SEGS.filter(m => m.act && m.act !== 9), daily  /* act 9: research maps (lessons/reader/), listed only with ?maps=reader */ = PF.SEGS.filter(m => m.daily);
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

// losing never takes progress away (Cole, 2026-11-06): a dissolve or a world end retries just that map
const GAMEJS = readFileSync(join(HERE, 'game.js'), 'utf8');
if (/\.prog\[[^\]]*\]\s*=\s*0/.test(GAMEJS) || /Restart the act|Act '\+a\+' is lost|act starts over/.test(GAMEJS + OUTSIDE)) fail('a loss can still take act progress away');
const debrief = GAMEJS.match(/function gmDebrief\(\)\{[\s\S]*?\n\}/)[0];
if ((debrief.match(/GS\.prog\[/g) || []).length !== 1 || !/if\(won\)\{ GS\.prog\[a-1\]=m\.slot;/.test(debrief)) fail('only a win may change act progress');

// a player who is out never has to watch a stuck race to the time limit (designer's report, 2026-11-07)
if (!/if\(h\.out\|\|h\.dissolved\)\{[^\n]*GM_OUT_WATCH[^\n]*stepGame\(1\/60\)/.test(GAMEJS)) fail('a player who is out can be left watching a stuck race');

// c. the daily, using the page's own function
const fn = readFileSync(join(HERE, 'game.js'), 'utf8').match(/^function gmDailyOf\(date\)\{.*$/m)[0];
const of = new Function('gmDailyMaps', fn + '\nreturn gmDailyOf;')(() => daily);
const week = ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'].map(of);
if (new Set(week.slice(0, 3).map(d => d.map.key)).size !== 3) fail('the daily does not rotate through 3 maps');
if (week[0].map !== week[3].map) fail('the daily does not repeat after 3 days');
if (new Set(week.map(d => d.seed)).size !== 4 || of('2026-11-07').seed !== week[0].seed) fail('daily dice are not set by the date');
// d. the recap and the award cards (recap.js, story.js): page code only, fed by each race's events
const SIMTXT = LINES.slice(A, B + 1).join('\n');
for (const w of ['PFStory', 'tellStory', 'achEval', 'rcDraw']) if (SIMTXT.includes(w)) fail('recap code is inside the simulation section: ' + w);
const storySrc = SRC.match(/<script>\n(\/\* end-of-run story[\s\S]*?)<\/script>/);
if (!storySrc) fail('the recap commentary (story.js) is not in the page');
const story = storySrc ? new Function('window', storySrc[1] + '\nreturn window.PFStory;')({}) : null;
const RECAP = readFileSync(join(HERE, 'recap.js'), 'utf8');
const AW = new Function('window', 'document', RECAP + '\nreturn {achEval, ACH_LIST};')({PF: {}}, {addEventListener() {}});
const ids = AW.ACH_LIST.map(a => a.id);
if (ids.length !== 11 || ids.includes('sing')) fail('awards: expected the 11 old achievements that fit boxes, without sing, got ' + ids);
for (const a of AW.ACH_LIST) if (/\bgaps?\b|chill mode|singularity|barrier/i.test(a.hint + ' ' + a.tidbit)) fail('award ' + a.id + ' still uses the old words');
for (const a of AW.ACH_LIST) if (!/^https:\/\//.test(a.real.url) || !/utm_medium=game/.test(a.real.url)) fail('award ' + a.id + ' needs its real-world link');
for (const w of ['achEnd();', 'rcMarkup()', 'tellStory();']) if (!debrief.includes(w)) fail('the debrief does not call ' + w);
if (!/function gmRace\(R\)\{[\s\S]*?rcStop\(\);[\s\S]*?\n\}/.test(GAMEJS)) fail('a new race does not stop the recap');
if (!/achTick\(1\/60\); gmTick\(\);/.test(SRC)) fail('the frame loop does not tally awards');
if (!/achGo\(\);/.test(OUTSIDE)) fail('Go does not start the award tally');
for (const id of ['ov-story', 'rc-stage', 'rc-cv', 'rc-plaque', 'rc-line', 'rc-list', 'rc-bar', 'rc-replay', 'ach-open', 'ach-go', 'ach-real']) if (!RECAP.includes('id="' + id + '"')) fail('recap markup lost #' + id);
const OLDW = /chasm|abyss|ravine|singularity|precedent|floors|leapt/i, kinds = {}, earned = {};
let stories = 0, same = true;
PF.SEGS.forEach((m, i) => {
  for (let seed = 1; seed <= 4; seed++) for (const you of POSTURES) {
    for (const k in PF.K) delete PF.K[k]; Object.assign(PF.K, K0); PF.K.stepGaps = 1; PF.K.chill = 1;
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(i + 1, you); PF.newGame(seed, 'probe');
    const G = PF.G(); let g = 0;
    while (!G.over && g++ < 60000) PF.step(1 / 60);
    if (!G.over || !story) continue;
    const r = G.result, res = {type: r.type}; if (r.type === 'win') res.winner = r.winner.name; else if (r.type === 'all') { res.by = r.by; res.gap = r.gap; res.roll = r.roll; }
    const run = {seed: G.seed, t: Math.round(G.t * 10) / 10, result: res, events: G.ev.map(e => Object.assign({}, e, {human: e.who === G.labs[0].name})), gate: null,
      labs: G.labs.map((l, j) => ({name: l.name, kind: l.kind, human: j === 0, out: !!l.out, dissolved: !!l.dissolved, done: !!l.done}))};
    const st = story.tell(run), st2 = story.tell(run);
    stories++;
    if (JSON.stringify(st) !== JSON.stringify(st2)) same = false;
    if (!st.verdict || !st.verdict.title || !st.verdict.line) fail(m.key + ' seed ' + seed + ': no verdict');
    for (const s of st.stops) { kinds[s.kind] = (kinds[s.kind] || 0) + 1; if (!s.plaque || !s.line || !isFinite(s.x)) fail(m.key + ': a stop without a plaque, line or place'); }
    for (const t of [st.verdict.title, st.verdict.line, ...st.stops.flatMap(s => [s.plaque, s.line])]) if (OLDW.test(t) || /\{\w+\}/.test(t)) fail(m.key + ' seed ' + seed + ': recap says "' + t + '"');
    /* an award is earned exactly when lab 0's events say so */
    const got = new Set(AW.achEval(G, {chill: true, shadowT: 0})), mine = G.ev.filter(e => e.who === G.labs[0].name), has = t => mine.some(e => e.type === t);
    const want = {barrier: has('crash'), scrape: has('scrape') || has('drop'), dissolved: has('dissolved'), bio: has('first'), supply: mine.some(e => e.type === 'cross' && !e.inner),
      extinct: mine.some(e => e.type === 'fall' && e.ext), roll: G.ev.some(e => e.type === 'fall' && !e.ext), chill: r.type === 'win' && r.winner === G.labs[0]};
    for (const k in want) if (want[k] !== got.has(k)) fail(m.key + ' seed ' + seed + ': award ' + k + ' is ' + got.has(k) + ', events say ' + want[k]);
    got.forEach(k => { earned[k] = (earned[k] || 0) + 1; });
  }
});
if (!same) fail('the same race tells a different story');
for (const k of ['first', 'scrape', 'fall', 'wall', 'strike']) if (!kinds[k]) fail('no recap stop of kind ' + k + ' in ' + stories + ' races');
console.log('recap: ' + stories + ' races told, stops by kind ' + JSON.stringify(kinds) + '; awards earned by the probe ' + JSON.stringify(earned));

if (fails.length) { console.log(fails.length + ' failed'); process.exit(1); }
console.log('game page checks pass');
