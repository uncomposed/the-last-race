// [[ai gen]] Daily generator, step 1 (issue 36). For each date: the date's seed picks one of the three approved maps and draws its numbers from ranges.js.
// Guard rails then race the candidate headless with the scripted key player (hdnode.mjs: human lag, real key semantics) on the built page's simulation:
//   1. the map's own sentence strategy wins at least 60% of 40 races (seeds 1001-1040), and wins today's own race in at least 2 of 3 lag draws;
//   2. max-out with eyes (sp-hs-eyes) wins no more than half of those 40;
//   3. with --cole=<strategy>, a candidate that strategy wins 40 of 40 is rejected (for coleFollow, once it lands).
// A rejected candidate is redrawn from the same seed, up to 12 times; if none passes, the next map in the list gets 12 draws, and so on. Nothing skips the rails.
// Accepted candidates are then raced on held-out seeds 9501-9540, which played no part in accepting them, and written to gen-days.js for the page to bake in.
// Usage: node gen.mjs [first date] [days] [--cole=strategy]. Not evidence of fun: only Cole playing them is.
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {load, run, knobs} from './hdnode.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const RANGES = new Function(readFileSync(join(HERE, 'ranges.js'), 'utf8') + '\nreturn SHIP_RANGES;')();
const MAPS = ['ladder', 'two-endings', 'elbows'];
const args = process.argv.slice(2), flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('='))), pos = args.filter(a => !a.startsWith('--'));
const FIRST = pos[0] || '2026-11-07', DAYS = +(pos[1] || 60), COLE = flags.cole || null, TRIES = 12;
const RAIL = [1001, 40], HELD = [9501, 40];

const api = load();
if (COLE && !api.PF.SGP[COLE] && !api.PF.SGC[COLE]) throw new Error('no strategy ' + COLE + ' in this build');
const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const rng = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const base = key => api.PF.SEGS.find(m => m.key === key).P;
// the page applies the same function (game.js gmGenP), so the numbers it races are exactly the ones accepted here
export function applySet(P, set) { const Q = JSON.parse(JSON.stringify(P)); for (const path in set) { const k = path.split('.'), last = k.pop(); let o = Q; for (const p of k) o = o[p]; o[last] = set[path]; } return Q; }
function draw(key, r) { const set = {}; for (const [path, [lo, hi, int]] of Object.entries(RANGES[key])) { const v = lo + r() * (hi - lo); set[path] = int ? Math.round(v) : Math.round(v * 1000) / 1000; } return set; }
function wins(key, P, post, [a, n]) { const HD = knobs(key, post); let w = 0; for (let i = 0; i < n; i++) if (run(api, key, P, HD, a + i).won) w++; return w; }
function rails(key, P, dseed) {
  const HD = knobs(key), today = [1, 2, 3].filter(j => run(api, key, P, HD, dseed, dseed * 7 + j).won).length;
  const s = wins(key, P, null, RAIL), e = wins(key, P, 'sp-hs-eyes', RAIL), c = COLE ? wins(key, P, COLE, RAIL) : null;
  const why = today < 2 ? 'today ' + today + '/3' : s < RAIL[1] * 0.6 ? 'sentence ' + s : e * 2 > RAIL[1] ? 'eyes ' + e : c === RAIL[1] ? COLE + ' always wins' : '';
  return {today, s, e, c, why};
}
// how far a candidate moved: each number's distance from the shipped value as a share of its range, averaged
function moved(key, set) { const P = base(key); let t = 0, n = 0; for (const path in set) { const [lo, hi] = RANGES[key][path], v0 = path.split('.').reduce((o, p) => o[p], P); t += Math.abs(set[path] - v0) / (hi - lo); n++; } return n ? Math.round(t / n * 100) / 100 : 0; }

const days = {}, log = [], t0 = Date.now(); let drawn = 0, accepted = 0;
const per = Object.fromEntries(MAPS.map(k => [k, {drawn: 0, accepted: 0, heldS: 0, heldE: 0, heldN: 0, moved: 0}]));
for (let d = 0; d < DAYS; d++) {
  const date = new Date(Date.parse(FIRST + 'T00:00:00Z') + d * 864e5).toISOString().slice(0, 10), dseed = fnv(date), r = rng(dseed);
  const pick = Math.floor(r() * MAPS.length);
  let got = null, tries = 0, reasons = [], key, m;
  for (let j = 0; j < MAPS.length && !got; j++) {  // a map with no passing draw hands the day to the next map, which redraws from the same seed
    key = MAPS[(pick + j) % MAPS.length]; m = per[key]; tries = 0; if (j) reasons.push('-> ' + key);
    while (!got && tries < TRIES) {
      tries++; drawn++; m.drawn++;
      const set = draw(key, r), R = rails(key, applySet(base(key), set), dseed);
      if (R.why) reasons.push(R.why); else { got = {set, R}; accepted++; m.accepted++; }
    }
    if (!got) m.gaveUp = (m.gaveUp || 0) + 1;
  }
  if (!got) throw new Error(date + ': no map passed the rails in ' + TRIES + ' draws each');
  const P = applySet(base(key), got.set), hs = wins(key, P, null, HELD), he = wins(key, P, 'sp-hs-eyes', HELD);
  m.heldS += hs; m.heldE += he; m.heldN += HELD[1]; m.moved += moved(key, got.set);
  days[date] = {map: key, set: got.set, tries, rail: {today: got.R.today, s: got.R.s, e: got.R.e, c: got.R.c}, held: {s: hs, e: he}};
  log.push(date + ' ' + key.padEnd(12) + ' tries ' + tries + (Object.keys(got.set).length ? '' : ' (shipped numbers)') + '  rail ' + got.R.s + '/' + got.R.e + '  held ' + hs + '/' + he + '  moved ' + moved(key, got.set) + (reasons.length ? '  rejected: ' + reasons.join(', ') : ''));
  console.log(log[log.length - 1]);
}
const head = '/* [[ai gen]] Generated dailies, baked by gen.mjs on ' + new Date().toISOString().slice(0, 10) + ' from ranges.js against simulation ' + api.id + '. Do not edit by hand: rerun gen.mjs.\n' +
  '   Each date: the map, the numbers that differ from maps.js (set), how many draws it took, the rails it passed on seeds ' + RAIL[0] + '-' + (RAIL[0] + RAIL[1] - 1) + ' (s: sentence wins, e: eyes wins, of ' + RAIL[1] + '; today: sentence wins of 3 lag draws on the day\'s own race),\n' +
  '   and the same two lines on held-out seeds ' + HELD[0] + '-' + (HELD[0] + HELD[1] - 1) + '. Only used with ?gen=1. */\n';
// GEN_SIM: the page uses these only if its own stamp matches, since a changed simulation could move every rail
writeFileSync(join(HERE, 'gen-days.js'), head + 'var GEN_SIM=\'' + api.id + '\',GEN_DAYS={\n' + Object.entries(days).map(([d, e]) => JSON.stringify(d) + ':' + JSON.stringify(e)).join(',\n') + '};\n');
console.log('\naccepted ' + accepted + ' of ' + drawn + ' draws in ' + DAYS + ' days, ' + ((Date.now() - t0) / 1000 | 0) + ' s');
for (const k of MAPS) { const m = per[k], days_ = m.accepted; if (!days_) continue; console.log(k.padEnd(12) + ' days ' + days_ + ', accepted ' + m.accepted + ' of ' + m.drawn + ' draws, gave up on ' + (m.gaveUp || 0) + ' days, held-out sentence ' + Math.round(m.heldS / m.heldN * 100) + '%, eyes ' + Math.round(m.heldE / m.heldN * 100) + '%, mean moved ' + (m.moved / days_).toFixed(2)); }
