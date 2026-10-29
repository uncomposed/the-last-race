// Checks the game's content tables and the logic around them in prototype.html. Plain Node, no dependencies. Usage:
//   node experiments/pacing-the-frontier/check/content-check.mjs
// It pulls pieces out of the page as source text (the simulation section, as sim-check does, plus named tables and functions) and
// runs them with no DOM. It checks:
//   (a) campaign progress survives a seed change (CAMPAIGN[i].was);
//   (b) each daily twist lowers the custom bot's wins on all three daily tiers, chill off and on, on a fixed block of daily seeds;
//   (c) appending a briefing does not change any earlier date's briefing;
//   (d) every BRIEFINGS, TWISTS and ACH_LIST entry is well formed.
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
    'dailySeed', 'dailyDayNum', 'dailyPool', 'dailyBrief'].map(fn)];
const X = new Function('window', 'document', parts.join('\n') + `
return {PF:window.PF,KNOBS,CAMPAIGN,BRIEFINGS,TWISTS,KIND_WORDS,ACH_LIST,dailySeed,dailyBrief,
  setCS:function(o){CS=o;},CS:function(){return CS;},campStars,campFormer,campCredit,campIsNew,campOpen,campAllStarred};`)({}, null);

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

const s = ((Date.now() - t0) / 1000).toFixed(1);
if (fails) { console.error(fails + ' content check(s) failed (' + s + ' s).'); process.exit(1); }
console.log('All content checks passed (' + s + ' s).');
