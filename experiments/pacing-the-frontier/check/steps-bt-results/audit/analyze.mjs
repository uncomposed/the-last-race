// Auditor's analysis of raw/*.jsonl (rows from race.mjs). node analyze.mjs > analysis.txt
// SEs are clustered by unit: free = seed, campaign = map/tier/noise id, daily = date/tier. Paired deltas match (unit, player) across two runs.
import {readFileSync, existsSync} from 'node:fs';
const PROBES = ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin'];
const cache = {};
function load(n) { if (cache[n]) return cache[n]; const f = 'raw/' + n + '.jsonl'; if (!existsSync(f)) return null;
  return cache[n] = readFileSync(f, 'utf8').trim().split('\n').map(l => JSON.parse(l)).map(r => Object.assign(r, {u: r.map ? r.map + '/' + r.tier + '/' + r.nz : (r.date ? r.date + '/' + r.tier : '' + r.seed)})); }
const pct = x => (100 * x).toFixed(1);
function cl(rows, f) {  // clustered mean and SE of f over rows
  const by = new Map(); for (const r of rows) { const a = by.get(r.u) || [0, 0]; a[0] += f(r); a[1]++; by.set(r.u, a); }
  const m = [...by.values()].map(a => a[0] / a[1]), n = m.length, mu = m.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(m.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(n - 1, 1));
  return {m: mu, se: sd / Math.sqrt(n), n};
}
const fmt = (o, k = 100) => (k * o.m).toFixed(1) + ' ± ' + (k * o.se).toFixed(1);
function q(a, f) { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(f * a.length))] : null; }
export function summary(n, filt = () => true) {
  const R = load(n); if (!R) return null; const rows = R.filter(filt), L = rows.filter(r => PROBES.includes(r.p));
  const sum = (a, f) => a.reduce((s, r) => s + f(r), 0);
  const per = Object.fromEntries(PROBES.map(p => [p, cl(rows.filter(r => r.p === p), r => r.win)]));
  const best = Object.entries(per).sort((a, b) => b[1].m - a[1].m)[0];
  return {n, races: rows.length, lesson: cl(L, r => r.win), crawl: cl(rows.filter(r => r.p === 'crawl'), r => r.win), smart: cl(rows.filter(r => r.p === 'smart'), r => r.win),
    best: best[0] + ' ' + pct(best[1].m), dis: cl(L, r => r.dis), crawlDis: cl(rows.filter(r => r.p === 'crawl'), r => r.dis), scr: sum(L, r => r.scr) / L.length, fall: sum(L, r => r.fall) / L.length,
    extRace: sum(L, r => r.ext) / L.length, extFall: sum(L, r => r.ext) / Math.max(1, sum(L, r => r.allFalls)), falls: sum(L, r => r.allFalls),
    sr: [q(L.map(r => r.sr0), 0.5), q(L.map(r => r.sr0), 0.75), Math.max(...L.map(r => r.sr0))], srBot: [q(L.map(r => r.srBotMax), 0.75), Math.max(...L.map(r => r.srBotMax))],
    srOver3: sum(L, r => r.sr0 > 3 ? 1 : 0) / L.length, botOver3: sum(L, r => r.srBotMax > 3 ? 1 : 0) / L.length,
    snap: sum(rows, r => r.forced) / Math.max(1, sum(rows, r => r.enc)), snap0: sum(L, r => r.forced0) / Math.max(1, sum(L, r => r.enc0)), per};
}
export function paired(a, b, players, filt = () => true) {  // b minus a, per unit mean over players, clustered SE
  const A = load(a), B = load(b); if (!A || !B) return null;
  const key = r => r.u + '|' + r.p, ma = new Map(A.filter(filt).filter(r => players.includes(r.p)).map(r => [key(r), r.win]));
  const by = new Map(); for (const r of B.filter(filt)) { if (!players.includes(r.p)) continue; const k = key(r); if (!ma.has(k)) continue; const x = by.get(r.u) || [0, 0]; x[0] += r.win - ma.get(k); x[1]++; by.set(r.u, x); }
  const m = [...by.values()].map(x => x[0] / x[1]), n = m.length, mu = m.reduce((s, y) => s + y, 0) / n, sd = Math.sqrt(m.reduce((s, y) => s + (y - mu) ** 2, 0) / (n - 1));
  return {m: mu, se: sd / Math.sqrt(n), n, z: mu / (sd / Math.sqrt(n))};
}
const pd = o => o ? ((o.m >= 0 ? '+' : '') + (100 * o.m).toFixed(1) + ' ± ' + (100 * o.se).toFixed(1) + (Math.abs(o.z) < 3 ? ' ?' : '')) : 'n/a';
function line(label, s) {
  if (!s) return label + ': missing';
  return label.padEnd(16) + ' lesson ' + fmt(s.lesson) + ' | best ' + s.best + ' | crawl ' + fmt(s.crawl) + ' (dis ' + pct(s.crawlDis.m) + ') | smart ' + fmt(s.smart) +
    ' | dis ' + pct(s.dis.m) + ' | scr ' + s.scr.toFixed(2) + ' | fall ' + s.fall.toFixed(3) + ' | ext/race ' + pct(s.extRace) + ' | ext/fall ' + pct(s.extFall) + ' (' + s.falls + ')' +
    ' | stopRev p50/p75/max ' + s.sr.join('/') + ' (>3: ' + pct(s.srOver3) + '%) | rival max p75/max ' + s.srBot.join('/') + ' (>3: ' + pct(s.botOver3) + '%) | snap ' + pct(s.snap) + '% (player ' + pct(s.snap0) + '%)';
}
// campaign picks: [map, lesson probe, named worst foil] from campaign.md
const PICKS = [[1, 'climber', 'runup'], [2, 'climber', 'gamble'], [3, 'gamble', 'balanced'], [4, 'scout', 'climber'], [5, 'balanced', 'climber'], [6, 'bold', 'balanced'], [7, 'rush', 'balanced'], [8, 'follower', 'bold'], [9, 'climber', 'balanced']];
function pickTable(n) {
  const R = load(n); if (!R) return n + ': missing';
  const out = [n];
  for (const [m, L, F] of PICKS) {
    const rows = R.filter(r => r.map === m), w = p => cl(rows.filter(r => r.p === p), r => r.win);
    const by = new Map(); for (const r of rows) { if (r.p !== L && r.p !== F) continue; const x = by.get(r.u) || {}; x[r.p] = r.win; by.set(r.u, x); }
    const d = [...by.values()].filter(x => L in x && F in x).map(x => x[L] - x[F]), mu = d.reduce((a, b) => a + b, 0) / d.length, se = Math.sqrt(d.reduce((a, b) => a + (b - mu) ** 2, 0) / (d.length - 1)) / Math.sqrt(d.length);
    const ranks = PROBES.map(p => [p, w(p).m]).sort((a, b) => b[1] - a[1]), rank = ranks.findIndex(x => x[0] === L) + 1;
    const cw = w('crawl').m, lw = w(L).m;
    out.push('  map ' + m + ' ' + L.padEnd(8) + ' win ' + pct(lw) + ' vs ' + F.padEnd(8) + pct(w(F).m) + ' margin ' + (100 * mu).toFixed(1) + ' (z ' + (mu / se).toFixed(1) + ') rank ' + rank + ' (top ' + ranks[0][0] + ' ' + pct(ranks[0][1]) + ') crawl ' + pct(cw) + ' smart ' + pct(w('smart').m) +
      ' | stopRev lesson p75/max ' + q(rows.filter(r => r.p === L).map(r => r.sr0), 0.75) + '/' + Math.max(...rows.filter(r => r.p === L).map(r => r.sr0)) + ' dis ' + pct(cl(rows.filter(r => r.p === L), r => r.dis).m) + (mu > 0 && mu / se >= 3 ? '  HOLDS' : '  FAILS'));
  }
  return out.join('\n');
}
if (process.argv[1].endsWith('analyze.mjs')) {
  const sec = (t) => console.log('\n## ' + t);
  sec('Free play (seeds 5000-5999, chill on unless c0)');
  for (const n of ['F-ref', 'F-cur3', 'F-cur4', 'F-comb3', 'F-comb4', 'F-refc0', 'F-cur3c0', 'F-comb3c0', 'F-comb4c0', 'F-tim3c0']) console.log(line(n, summary(n)));
  sec('Campaign Medium (noise 300-399), current table');
  for (const n of ['C-ref', 'C-cur3', 'C-cur4', 'C-tim3', 'C-tim4', 'C-comb3', 'C-comb4']) console.log(line(n, summary(n)));
  sec('Campaign Medium, proposed table');
  for (const n of ['C-propref', 'C-propcur3', 'C-proptim3', 'C-proptim4', 'C-propcomb3', 'C-propcomb4']) console.log(line(n, summary(n)));
  sec('Daily (offsets 900-1199, chill off)');
  for (const n of ['D-ref', 'D-cur3', 'D-prop3unf', 'D-comb3', 'D-comb4', 'D-comb3r', 'D-comb4r', 'D-tim3', 'D-tim3r', 'D-tim4r']) console.log(line(n, summary(n)));
  for (const n of ['D-ref', 'D-cur3', 'D-prop3unf', 'D-comb3', 'D-comb4', 'D-tim3r', 'D-tim4r']) { const s = [1, 2, 3].map(t => summary(n, r => r.tier === t)); if (s[0]) console.log('  ' + n + ' by tier lesson ' + s.map(x => pct(x.lesson.m)).join(' / ') + ' | follower ' + s.map(x => pct(x.per.follower.m)).join(' / ') + ' | crawl ' + s.map(x => pct(x.crawl.m)).join(' / ')); }
  sec('Paired deltas (lesson-probe mean win, b minus a)');
  const P = [['F-cur3', 'F-cur4', 'free: +1 strike, current page'], ['F-ref', 'F-cur3', 'free: steps on vs off, current'], ['F-ref', 'F-comb3', 'free: combined 3 vs steps off'], ['F-ref', 'F-comb4', 'free: combined 4 vs steps off'], ['F-cur3', 'F-comb3', 'free: combined vs current, 3'], ['F-comb3', 'F-comb4', 'free: +1 strike, combined'],
    ['F-refc0', 'F-cur3c0', 'free chill off: current 3 vs off'], ['F-refc0', 'F-comb3c0', 'free chill off: combined 3 vs off'], ['F-refc0', 'F-comb4c0', 'free chill off: combined 4 vs off'],
    ['C-cur3', 'C-cur4', 'campaign: +1 strike, current page'], ['C-ref', 'C-cur3', 'campaign: steps on vs off, current'], ['C-ref', 'C-comb3', 'campaign: combined 3 vs off'], ['C-ref', 'C-comb4', 'campaign: combined 4 vs off'], ['C-comb3', 'C-comb4', 'campaign: +1, combined'],
    ['C-propref', 'C-propcomb3', 'campaign prop: combined 3 vs off'], ['C-propref', 'C-propcomb4', 'campaign prop: combined 4 vs off'], ['C-propcur3', 'C-propcomb3', 'campaign prop: combined vs current gen'],
    ['D-ref', 'D-cur3', 'daily: steps on vs off, current'], ['D-ref', 'D-comb3', 'daily: combined 3 (filter) vs off'], ['D-ref', 'D-comb4', 'daily: combined 4 (filter) vs off'], ['D-comb3', 'D-comb4', 'daily: +1, combined'], ['D-prop3unf', 'D-comb3', 'daily: strict filter vs none'], ['D-comb3', 'D-comb3r', 'daily: relaxed vs strict filter'], ['F-refc0', 'F-tim3c0', 'free chill off: timing-only 3 vs off'], ['C-ref', 'C-tim3', 'campaign: timing-only 3 vs off'], ['C-ref', 'C-tim4', 'campaign: timing-only 4 vs off'], ['C-tim3', 'C-comb3', 'campaign: combined vs timing-only, 3'], ['C-propref', 'C-proptim3', 'campaign prop: timing-only 3 vs off'], ['C-propref', 'C-proptim4', 'campaign prop: timing-only 4 vs off'], ['D-ref', 'D-tim3r', 'daily: timing-only 3 (relaxed) vs off'], ['D-ref', 'D-tim4r', 'daily: timing-only 4 (relaxed) vs off'], ['D-tim3', 'D-tim3r', 'daily timing: relaxed vs strict']];
  for (const [a, b, t] of P) console.log('  ' + t.padEnd(40) + pd(paired(a, b, PROBES)) + '   crawl ' + pd(paired(a, b, ['crawl'])) + '   smart ' + pd(paired(a, b, ['smart'])));
  console.log('  daily follower, current -> proposed unfiltered: ' + pd(paired('D-cur3', 'D-prop3unf', ['follower'])) + ' ; runup ' + pd(paired('D-cur3', 'D-prop3unf', ['runup'])));
  sec('Crawl vs best lesson probe (crawl minus each run\'s top probe, paired)');
  for (const n of ['C-cur3', 'C-cur4', 'C-comb3', 'C-comb4', 'C-propcomb3', 'C-propcomb4', 'F-cur3', 'F-comb3', 'F-comb4', 'D-comb3', 'D-comb4', 'C-tim3', 'C-tim4', 'D-tim3r', 'D-tim4r']) { const s = summary(n); if (!s) continue; const bp = s.best.split(' ')[0];
    const R = load(n), by = new Map(); for (const r of R) { if (r.p !== bp && r.p !== 'crawl') continue; const x = by.get(r.u) || {}; x[r.p] = r.win; by.set(r.u, x); }
    const d = [...by.values()].filter(x => bp in x && 'crawl' in x).map(x => x.crawl - x[bp]), mu = d.reduce((a, b) => a + b, 0) / d.length, se = Math.sqrt(d.reduce((a, b) => a + (b - mu) ** 2, 0) / (d.length - 1)) / Math.sqrt(d.length);
    console.log('  ' + n.padEnd(12) + ' crawl ' + pct(s.crawl.m) + ' vs ' + s.best + ': ' + (100 * mu).toFixed(1) + ' ± ' + (100 * se).toFixed(1) + ' (best probe picked on this block: biased toward the probe)'); }
  sec('Campaign picks');
  for (const n of ['C-propcur3', 'C-proptim3', 'C-proptim4', 'C-propcomb3', 'C-propcomb4']) console.log(pickTable(n));
}
