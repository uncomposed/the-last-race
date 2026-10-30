// Crawl-to-the-box foil (tuning/boxprobe.mjs, mode crawl, base gamble) on the picks, held-out noise 0 and 100-199.
//   node crawlfoil.mjs > heldout/crawl.txt ; writes heldout/crawl.json (rows like camp-eval, player 'crawl:gamble')
import {readFileSync, writeFileSync} from 'node:fs';
import {runBoxRace} from '../tuning/boxprobe.mjs';
import {GAME} from '../../steps-bt.mjs';
const P = JSON.parse(readFileSync('picks.json', 'utf8')), D = {easy: 0, medium: 1, hard: 2};
const nz = [0]; for (let z = 100; z < 200; z++) nz.push(z);
const rows = [];
for (const p of P) for (let t = 0; t < p.tiers.length; t++) for (const [diff, delta, zs] of [['medium', 0, nz], ['easy', 1, nz.slice(0, 51)], ['medium', 1, nz.slice(0, 51)], ['hard', 1, nz.slice(0, 51)]]) for (const z of zs) {
  const r = runBoxRace({seed: p.seed, roster: p.tiers[t].slice(), knobs: {}, consts: {}, strikesYou: GAME.CAMP_DIFF[D[diff]].strikes + delta, boxes: p.boxes || null, nz: z, chill: 0, steps: 1}, {mode: 'crawl', base: 'gamble'});
  rows.push(['m' + p.slot + ':' + p.seed, t + 1, diff, z, 'crawl:gamble', r.win, delta, r.dis, r.scr, r.fall]);
}
writeFileSync('heldout/crawl.json', JSON.stringify({rows}) + '\n');
const load = f => JSON.parse(readFileSync('heldout/' + f + '.json', 'utf8')).rows;
const main = load('main'), plus1 = load('plus1');
const r2 = x => Math.round(x * 100) / 100;
function cmp(L, C) { const idx = r => r[1] + '|' + r[3], m = new Map(L.map(r => [idx(r), r[5]]));
  const d = C.filter(r => m.has(idx(r))).map(r => m.get(idx(r)) - r[5]), mu = d.reduce((a, x) => a + x, 0) / d.length, sd = Math.sqrt(d.reduce((a, x) => a + (x - mu) ** 2, 0) / (d.length - 1)), se = sd / Math.sqrt(d.length);
  const w = a => a.reduce((s, r) => s + r[5], 0) / a.length; return `lesson ${r2(w(L))} crawl ${r2(w(C))} d ${r2(mu)}±${r2(se)} z ${r2(mu / se)} (n ${d.length})`; }
for (const p of P) { const key = 'm' + p.slot + ':' + p.seed;
  const Lm = main.filter(r => r[0] === key && r[2] === 'medium' && r[4] === p.lesson && r[3] !== 0), Cm = rows.filter(r => r[0] === key && r[2] === 'medium' && r[6] === 0 && r[3] !== 0);
  const C0 = rows.filter(r => r[0] === key && r[2] === 'medium' && r[6] === 0 && r[3] === 0);
  let s = `map ${p.slot} ${p.lesson}: Medium held-out ${cmp(Lm, Cm)}; crawl noise0 ${C0.map(r => r[5]).join('')}; crawl diss ${r2(Cm.reduce((a, r) => a + r[7], 0) / Cm.length)} scr ${r2(Cm.reduce((a, r) => a + r[8], 0) / Cm.length)}`;
  for (const d of ['easy', 'medium', 'hard']) { const L = plus1.filter(r => r[0] === key && r[2] === d && r[4] === p.lesson), C = rows.filter(r => r[0] === key && r[2] === d && r[6] === 1); s += `\n   5/4/3 ${d}: ${cmp(L, C)}`; }
  console.log(s); }
