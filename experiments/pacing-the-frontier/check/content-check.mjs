// Checks the game's content tables and the logic around them in prototype.html. Plain Node, no dependencies. Usage:
//   node experiments/pacing-the-frontier/check/content-check.mjs
// It pulls pieces out of the page as source text (the simulation section, as sim-check does, plus named tables and functions) and
// runs them with no DOM. It checks:
//   (a) campaign progress survives a seed change (CAMPAIGN[i].was);
//   (b) each daily twist lowers the custom bot's wins on all three daily tiers, chill off and on, on a fixed block of daily seeds;
//   (c) appending a briefing does not change any earlier date's briefing;
//   (d) every BRIEFINGS, TWISTS and ACH_LIST entry is well formed;
//   (e) "you raced like" still names each rival kind as itself when that kind drives lab 0, on held-out seeds;
//   (f) the leaderboard screens' position maths on fixed boards, and a published run becoming a ghost (bad ones refused).
// Bot play only: (b) is a regression check on one small block, not a balance claim (see DESIGN-NOTES.md, "Daily twists").
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const t0 = Date.now();
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'prototype.html'), 'utf8');
const lines = src.split('\n');
let fails = 0;
function check(ok, msg) { if (!ok) { fails++; console.log('FAIL ' + msg); } }

// a `var NAME=...;` table that ends at a line starting with `];` or `};`
function table(name) {
  const m = new RegExp('^var ' + name + '=[\\[{][\\s\\S]*?\\n[\\]}];', 'm').exec(src);
  if (!m) throw new Error('table ' + name + ' not found');
  return m[0];
}
// a top-level `function name(...){...}`, cut at its matching brace (strings and comments skipped)
function fn(name) {
  const i = src.search(new RegExp('^function ' + name + '\\(', 'm'));
  if (i < 0) throw new Error('function ' + name + ' not found');
  let d = 0, j = src.indexOf('{', i), q = null;
  for (; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === '\\') { j++; } else if (c === q) { q = null; } continue; }
    if (c === "'" || c === '"') { q = c; continue; }
    if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (c === '{') d++;
    if (c === '}' && --d === 0) return src.slice(i, j + 1);
  }
  throw new Error('function ' + name + ' has no end');
}
function line(prefix) { const l = lines.find(x => x.startsWith(prefix)); if (!l) throw new Error(prefix + ' not found'); return l; }

// the simulation, as in sim-check, plus what the checks need
const a = lines.findIndex(l => l.startsWith('function $(id)')), b = lines.findIndex(l => l.startsWith('window.PF={'));
const sim = lines.slice(a, b + 1).join('\n');
const parts = [sim, table('KNOBS'), table('CAMPAIGN'), line('var MEDALS='), table('CAMP_DIFF'), table('BRIEFINGS'), table('TWISTS'), table('KIND_WORDS'),
  'var CS=null;', 'function utm(url,camp){ return url; }', table('ACH_LIST'),
  ...['campBlank', 'campMap', 'campStar', 'campStarred', 'campStars', 'campFormer', 'campCredit', 'campIsNew', 'campOpen', 'campTierOpen', 'campAllStarred',
    'dailySeed', 'dailyDayNum', 'dailyPool', 'dailyBrief'].map(fn),
  table('RACED'), line('var RL_F='), table('RL_WORDS'), table('RL_WHY'), ...['rlNew', 'rlTick', 'rlFeat', 'rlClassify'].map(fn)];
const X = new Function('window', 'document', parts.join('\n') + `
return {PF:window.PF,KNOBS,CAMPAIGN,BRIEFINGS,TWISTS,KIND_WORDS,ACH_LIST,dailySeed,dailyBrief,
  setCS:function(o){CS=o;},CS:function(){return CS;},campStars,campFormer,campCredit,campIsNew,campOpen,campAllStarred,
  RACED,RL_F,RL_WORDS,RL_WHY,rlNew,rlTick,rlFeat,rlClassify};`)({}, null);

// (a) campaign progress across a seed change
{
  const C = X.CAMPAIGN, star = {chill: [true, false, false], medal: [0, 0, 0], best: [50, null, null], noDeaths: false};
  const changed = C.map((c, i) => c.was && c.was.length ? i : -1).filter(i => i >= 0);
  check(changed.length >= 1, '(a) no CAMPAIGN entry has a was list');
  for (const i of changed) {
    const s = {v: 2, maps: {}, stats: {}, epilogue: false, diff: 1};
    s.maps[String(C[i].was[0])] = JSON.parse(JSON.stringify(star));
    X.setCS(s);
    check(X.campFormer(i) === 1, '(a) map ' + (i + 1) + ': a star on former seed ' + C[i].was[0] + ' is not counted');
    check(X.campStars(i) === 0 && X.campIsNew(i), '(a) map ' + (i + 1) + ' should read "New map" (former-seed star, none on ' + C[i].seed + ')');
    check(i + 1 >= C.length || X.campOpen(i + 1), '(a) map ' + (i + 2) + ' should stay open after map ' + (i + 1) + "'s seed changed");
    s.maps[String(C[i].seed)] = {chill: [false, false, false], medal: [2, 0, 0], best: [null, null, null], noDeaths: false};
    check(!X.campIsNew(i), '(a) map ' + (i + 1) + ' still says "New map" with a star on its new seed');
  }
  // the epilogue: every slot starred, on its current seed or a former one
  const all = {v: 2, maps: {}, stats: {}, epilogue: false, diff: 1};
  C.forEach(c => { all.maps[String(c.was && c.was.length ? c.was[0] : c.seed)] = JSON.parse(JSON.stringify(star)); });
  X.setCS(all);
  check(X.campAllStarred(), '(a) the epilogue check ignores stars on former seeds');
  check(C.every((c, i) => X.campOpen(i)), '(a) a map is locked though every earlier slot has a (former-seed) star');
  delete all.maps[String(C[C.length - 1].was && C[C.length - 1].was.length ? C[C.length - 1].was[0] : C[C.length - 1].seed)];
  check(!X.campAllStarred(), '(a) the epilogue check passes with the last map unstarred');
  const none = {v: 2, maps: {}, stats: {}, epilogue: false, diff: 1};
  X.setCS(none); C.forEach((c, i) => X.campFormer(i));
  check(Object.keys(none.maps).length === 0, '(a) reading former seeds wrote entries into progress');
  check(!X.campOpen(1), '(a) map 2 opens with no stars at all');
}

// (b) every twist lowers wins on all three tiers, chill off and on, on a fixed block
const N = 100, START = '2029-01-01';
{
  const PF = X.PF, K = PF.K, DEF = {...K}, TIERS = [[], ['steward'], ['sprinter', 'steward']];
  const seeds = Array.from({length: N}, (_, i) => X.dailySeed(new Date(Date.parse(START + 'T00:00:00Z') + i * 864e5).toISOString().slice(0, 10)));
  function wins(o, c) {
    for (const k in DEF) K[k] = DEF[k];
    for (const k in o) K[k] = o[k];
    K.chill = c; PF.setPlayerStrikes(null);
    const w = TIERS.map(ro => seeds.reduce((n, s) => { const r = PF.run(s, 'custom', ro); return n + (r.type === 'win' && r.wid === 0 ? 1 : 0); }, 0));
    for (const k in DEF) K[k] = DEF[k];
    return w;
  }
  const base = [wins({}, 0), wins({}, 1)];
  console.log('(b) ' + N + ' daily seeds from ' + START + ', custom bot, wins per tier (solo / Steward / Sprinter and Steward); bot play only');
  console.log('    no twist: chill off ' + base[0].join(' / ') + ', chill on ' + base[1].join(' / '));
  for (const [name, o] of Object.entries(X.TWISTS)) {
    const w = [wins(o, 0), wins(o, 1)];
    const ok = [0, 1].every(c => [0, 1, 2].every(t => w[c][t] < base[c][t]));
    console.log('    ' + name + ': chill off ' + w[0].join(' / ') + ', chill on ' + w[1].join(' / ') + (ok ? '' : '  <- not lower in every cell'));
    check(ok, '(b) twist "' + name + '" does not lower wins in every tier and chill setting');
  }
}

// (c) appending a briefing leaves every earlier date alone
{
  const B = X.BRIEFINGS, ids = [], dates = [];
  const last = B.reduce((m, x) => x.added > m ? x.added : m, B[0].added);
  const next = new Date(Date.parse(last + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10);
  for (let t = Date.parse(B[0].added + 'T00:00:00Z') - 60 * 864e5; t < Date.parse(next + 'T00:00:00Z') + 400 * 864e5; t += 864e5) dates.push(new Date(t).toISOString().slice(0, 10));
  dates.forEach(d => ids.push(X.dailyBrief(d).id));
  for (let k = 1; k <= 3; k++) {
    const add = new Date(Date.parse(next + 'T00:00:00Z') + (k - 1) * 30 * 864e5).toISOString().slice(0, 10);
    B.push({...B[0], id: 'test-' + k, added: add});
    dates.forEach((d, i) => { if (d < add && X.dailyBrief(d).id !== ids[i]) check(false, '(c) appending a briefing added ' + add + ' changed ' + d); });
    dates.forEach((d, i) => { ids[i] = X.dailyBrief(d).id; });
  }
  B.splice(B.length - 3, 3);
  for (let i = 1; i < B.length; i++) check(B[i].added >= B[i - 1].added, '(c) BRIEFINGS ' + B[i].id + ' has an added date earlier than the item before it');
}

// (d) the tables are well formed
{
  const B = X.BRIEFINGS, T = X.TWISTS, KN = {}, seen = {};
  X.KNOBS.forEach(k => { KN[k[0]] = k; });
  const https = u => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);
  const text = s => typeof s === 'string' && s.trim().length > 0;
  const date = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
  B.forEach((x, i) => {
    const w = 'BRIEFINGS[' + i + '] ' + x.id;
    check(text(x.id) && !seen[x.id], w + ': missing or repeated id'); seen[x.id] = 1;
    check(!!X.KIND_WORDS[x.kind], w + ': unknown kind ' + x.kind);
    check(date(x.added), w + ': added is not a YYYY-MM-DD date');
    for (const k of ['title', 'body', 'question', 'explain']) check(text(x[k]), w + ': empty ' + k);
    check(Array.isArray(x.answers) && x.answers.length === 3 && x.answers.every(text), w + ': needs 3 answers');
    check(Number.isInteger(x.correct) && x.correct >= 0 && x.correct < 3, w + ': correct is not 0, 1 or 2');
    check(!!x.twist && !!T[x.twist.name], w + ': twist ' + (x.twist && x.twist.name) + ' is not in TWISTS');
    check(!!x.twist && text(x.twist.why), w + ': twist has no reason');
    check(!!x.deeper && text(x.deeper.label) && https(x.deeper.url) && /[?&]utm_medium=game\b/.test(x.deeper.url), w + ': deeper link needs a label and an https URL with the utm tags');
    check(Array.isArray(x.sources) && x.sources.length > 0 && x.sources.every(https), w + ': sources must be https URLs');
    check(!/—/.test(JSON.stringify(x)), w + ': has an em dash');
  });
  for (const [name, o] of Object.entries(T)) {
    check(B.some(x => x.twist.name === name), 'TWISTS "' + name + '" is used by no briefing');
    for (const [k, v] of Object.entries(o)) {
      const kb = KN[k];
      check(!!kb, 'TWISTS "' + name + '": ' + k + ' is not a tuning knob, so a ghost link would drop it');
      check(!!kb && typeof v === 'number' && v >= kb[2] && v <= kb[3], 'TWISTS "' + name + '": ' + k + ' ' + v + ' is outside the knob range, so a ghost link would clamp it');
      check(v !== X.PF.K[k], 'TWISTS "' + name + '": ' + k + ' equals the default');
    }
  }
  const A = X.ACH_LIST, aseen = {};
  A.forEach((x, i) => {
    const w = 'ACH_LIST[' + i + '] ' + x.id;
    check(text(x.id) && !aseen[x.id], w + ': missing or repeated id'); aseen[x.id] = 1;
    for (const k of ['name', 'hint', 'tidbit']) check(text(x[k]), w + ': empty ' + k);
    check(text(x.kind), w + ': empty kind');
    check(Number.isInteger(x.rank), w + ': rank is not a whole number');
    check(!!x.real && text(x.real.label) && https(x.real.url), w + ': real link needs a label and an https URL');
    check(Array.isArray(x.sources) && x.sources.every(https), w + ': sources must be https URLs');
  });
}

// (e) "you raced like": each rival kind drives lab 0 on a held-out block (RACED was measured on seeds 1 to 300, and validated on
// 10001 to 10300, where the lowest was the Gambler, chill off, named as itself in 288 of 300 runs). Here 40 seeds a kind, chill on, default knobs, stepped at
// 1/60 s as the page does. The bar is 32 of 40 (80%): at the measured 96% a kind falls below it by chance about 2 in 100,000 runs of
// this check (binomial, n = 40, p = 0.96). Below the bar, that kind's habits have moved toward another kind's: re-measure RACED. Bot play only.
{
  const PF = X.PF, K = PF.K, DEF = {...K}, KS = ['sprinter', 'steward', 'gambler'], S0 = 20001, NS = 40, MIN = 32, dt = 1 / 60;
  for (const k in DEF) K[k] = DEF[k];
  K.chill = 1; PF.setPlayerStrikes(null); PF.setRoster(null);
  console.log('(e) you raced like: ' + NS + ' held-out seeds a kind from ' + S0 + ', rows true kind, columns named kind (Sprinter / Steward / Gambler), mixes; bot play only');
  for (const kind of KS) {
    const row = {sprinter: 0, steward: 0, gambler: 0};
    let mix = 0, none = 0;
    for (let s = S0; s < S0 + NS; s++) {
      PF.newGame(s, kind); const G = PF.G(), l = G.labs[0], A = X.rlNew();
      for (let g = 0; !G.over && !l.out && !l.done && g < 40000; g++) { PF.step(dt); X.rlTick(A, l, dt); }
      const r = X.rlClassify(X.rlFeat(A, l));
      if (!r) { none++; continue; }
      row[r.k]++; if (r.k2) mix++;
    }
    console.log('    ' + kind.padEnd(9) + KS.map(q => String(row[q]).padStart(4)).join('') + '   mixes ' + mix + (none ? ', no result ' + none : ''));
    check(row[kind] >= MIN, '(e) ' + kind + ' named as itself in ' + row[kind] + ' of ' + NS + ' runs (needs ' + MIN + ')');
  }
  for (const k in DEF) K[k] = DEF[k];
  check(X.RL_WHY.length === X.RL_F.length, '(e) RL_WHY needs one pair of words per habit in RL_F');
  for (const k of KS) {
    check(X.RACED[k] && X.RACED[k].m.length === X.RL_F.length && X.RACED[k].s.length === X.RL_F.length, '(e) RACED.' + k + ' needs a mean and spread per habit');
    check(Array.isArray(X.RL_WORDS[k]) && X.RL_WORDS[k].length >= 3, '(e) RL_WORDS.' + k + ' needs at least 3 lines');
  }
  check(!/—/.test(JSON.stringify([X.RL_WORDS, X.RL_WHY])), '(e) RL_WORDS or RL_WHY has an em dash');
}

// (f) the leaderboard screens' logic, on fixed boards: where a time ranks and how the line reads (Cole's rule: no entries "the first", under
// 100 entries the place only, from 100 entries the place and the total, ties share a place), and a published run from the server
// becoming a ghost (good ones convert; every malformed one is refused). No server and no DOM; the live path is tested by hand.
{
  const Y = new Function('KNOBS', [line('var GH_E='), 'function clamp(x,a,b){return Math.min(b,Math.max(a,x));}',
    ...['lbPlace', 'lbOrd', 'lbLine', 'lbT', 'lbArr', 'lbGhost', 'ghInt', 'ghName', 'ghCheck'].map(fn),
    'return {lbPlace,lbOrd,lbLine,lbT,lbGhost};'].join('\n'))(X.KNOBS);
  const eq = (got, want, msg) => check(got === want, '(f) ' + msg + ': got ' + JSON.stringify(got) + ', wanted ' + JSON.stringify(want));
  const board = [41.2, 42.5, 42.5, 43, 50];
  eq(Y.lbPlace(board, 40000), 1, 'faster than all');
  eq(Y.lbPlace(board, 41200), 1, 'equal to the fastest shares first place');
  eq(Y.lbPlace(board, 42500), 2, 'a tie shares the place of the first of the tied');
  eq(Y.lbPlace(board, 42501), 4, 'just behind a tie');
  eq(Y.lbPlace(board, 99000), 6, 'slower than all');
  eq(Y.lbPlace([], 41200), 1, 'empty board');
  eq(Y.lbPlace([0.1 + 0.2], 300), 1, 'float noise in a stored time does not push you down');
  [[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [101, '101st'], [111, '111th'], [112, '112th']]
    .forEach(([n, w]) => eq(Y.lbOrd(n), w, 'ordinal of ' + n));
  eq(Y.lbLine(1, 0, false, 'today\'s board'), 'You\'d be the first on today\'s board', 'no entries, before publishing');
  eq(Y.lbLine(1, 0, true, 'today\'s board'), 'Published: 1st', 'no other entries, after publishing');
  eq(Y.lbLine(2, 1, false, 'b'), 'You\'d be 2nd', 'one other entry shows the place only');
  eq(Y.lbLine(14, 99, false, 'b'), 'You\'d be 14th', '99 entries still show the place only');
  eq(Y.lbLine(14, 100, false, 'b'), 'You\'d be 14th of 101', '100 entries show the total, which counts you');
  eq(Y.lbLine(14, 229, true, 'b'), 'Published: 14th of 230', 'published on a big board');
  eq(Y.lbLine(1, 100, false, 'b'), 'You\'d be 1st of 101', 'first on a big board');
  eq(Y.lbT(41.2), '41.2 s', 'a time trims its zeros');
  eq(Y.lbT(41.235), '41.235 s', 'a time keeps three decimals');
  // a server run as the game receives it (header = the log's header, ghost = the replay's samples)
  const run = o => JSON.parse(JSON.stringify({date: '2026-10-28', kind: 'star', t: 41.2, name: 'Cole', header: {v: 1, mode: 'daily', date: '2026-10-28', seed: 123, tier: 1,
    roster: ['sprinter', 'steward', 'gambler'], knobs: {}, pstrikes: null}, ghost: {e: 6, tk: 24, x: [0, 10, 20, 30, 40], h: [0, 0, 5, 5, 0], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}, ...o}));
  const g = Y.lbGhost(run({}));
  check(g && g.x.length === 5 && g.hh.length === 5 && g.j.length === 5 && g.s.length === 5, '(f) a good run becomes a ghost with all four tracks');
  if (g) {
    eq(g.h.o, 'win', 'the ghost is a win'); eq(g.h.n, 'Cole', 'the ghost carries the name'); eq(g.h.d, '2026-10-28', 'the ghost carries the day'); eq(g.h.ti, 1, 'the ghost keeps the 0-based tier');
    eq(g.h.x, 40, 'the ghost finishes at its last x'); eq(g.h.c, 0, 'a star run is not a chair run'); eq(g.hh[2], 5, 'height samples keep their order');
  }
  eq(Y.lbGhost(run({kind: 'chair'})).h.c, 1, 'a lounge-chair run is marked');
  eq(Y.lbGhost(run({name: 'A\u0000B\n  C'})).h.n, 'AB C', 'control characters leave the name');
  eq(Y.lbGhost(run({ghost: {e: 6, tk: 24, x: [0, 1e9, 20, 30, 40], h: [0, 0, 5, 5, 99999], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}})).x[1], 40000, 'a huge x is clamped');
  const bad = {
    'not an object': null, 'no ghost': {ghost: undefined}, 'another day': {date: '2026-10-27'}, 'a free-play header': {header: {mode: 'free'}},
    'an unknown rival': {header: {roster: ['sprinter', 'robot']}}, 'a repeated rival': {header: {roster: ['sprinter', 'sprinter']}}, 'a missing seed': {header: {seed: 'x'}},
    'a short height track': {ghost: {e: 6, tk: 24, x: [0, 10, 20, 30, 40], h: [0, 0], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}},
    'a NaN in x': {ghost: {e: 6, tk: 24, x: [0, null, 20, 30, 40], h: [0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}},
    'a string in x': {ghost: {e: 6, tk: 24, x: [0, '10', 20, 30, 40], h: [0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}},
    'x not an array': {ghost: {e: 6, tk: 24, x: 'abc', h: [], j: [], s: []}}, 'no samples': {ghost: {e: 6, tk: 0, x: [], h: [], j: [], s: []}},
    'a tick count that does not fit': {ghost: {e: 6, tk: 9999, x: [0, 10, 20, 30, 40], h: [0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}},
    'a zero sample gap': {ghost: {e: 0, tk: 24, x: [0, 10, 20, 30, 40], h: [0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0]}},
  };
  for (const [what, o] of Object.entries(bad)) {
    const r = o === null ? null : run(o);
    if (what === 'no ghost') delete r.ghost;
    if (what === 'a free-play header') r.header = {...run({}).header, mode: 'free'};
    if (what === 'an unknown rival' || what === 'a repeated rival') r.header = {...run({}).header, roster: o.header.roster};
    if (what === 'a missing seed') r.header = {...run({}).header, seed: 'x'};
    let got; try { got = Y.lbGhost(r); } catch (e) { got = 'threw'; }
    check(got === null, '(f) ' + what + ' must be refused, not raced' + (got === 'threw' ? ' (it threw instead of returning null)' : ''));
  }
}

const s = ((Date.now() - t0) / 1000).toFixed(1);
if (fails) { console.error(fails + ' content check(s) failed (' + s + ' s).'); process.exit(1); }
console.log('All content checks passed (' + s + ' s).');
