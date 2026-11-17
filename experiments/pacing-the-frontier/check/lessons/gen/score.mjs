// [[ai gen]] Scores the pattern generator's maps with the step 1 filters (fun/NOTES.md). Rules were fixed from the step 1 tune block before any drawn map
// was raced; drawn maps are filtered on one seed block and the survivors are re-judged on another.
//   node gen/score.mjs --blocks blk-1001.json,blk-9601.json,abl-1001.json,abl-9601.json --tune gnA-1001.json,gnB-1001.json --hold gnA-9601.json,gnB-9601.json [--ship ship-9601.json]
// Filters (a drawn map has no hand-tuned lesson bot, so test c uses its lesson-free form):
//   c'  adaptAny = best generic bot's win share minus the half-distance leader's   >= 0.23
//   a2' coleFollow's decisions per minute (one bot held fixed)                      >= 33.9
//   rail a rival is still racing at the end of at least 10% of races                riv >= 0.10
//   f   variety: distinct best generic bots across the kept set
// One-block proof (each pattern alone, against the same map without the pattern's key feature, gen/maps.js ablate): the generic bots' win shares
// move by at least 0.15 on average, and some bot wins at least 30% with the pattern, on both seed blocks. Fixed before the runs. Bots only: a pattern
// can be proven here and still be dull to a person.
import {readFileSync} from 'node:fs';
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1];
/* which patterns each drawn map uses, from the composer itself (gn-<seed>) */
const PL = readFileSync(A.page || 'gen/page.html', 'utf8').split('\n'), pa = PL.findIndex(l => l.startsWith('function $(id)')), pb = PL.findIndex(l => l.startsWith('window.PF={'));
const gnDraw = new Function('window', 'document', PL.slice(pa, pb).join('\n') + '\nreturn gnDraw;')({}, null);
const pats = k => k.startsWith('gn-') ? gnDraw(+k.slice(3)).spec.blocks.map(b => b[0]) : [];
const load = f => (f || '').split(',').filter(Boolean).flatMap(p => JSON.parse(readFileSync(p, 'utf8')));
const RULE = {adapt: 0.23, dpm: 33.9, riv: 0.10, effect: 0.15, passable: 0.30};
const adaptAny = r => +(r.dom - r.wins[r.halfBest]).toFixed(2), dpmCF = r => r.dpmBy.coleFollow;
const pass = r => ({c: adaptAny(r) >= RULE.adapt, a2: dpmCF(r) >= RULE.dpm, rail: r.riv >= RULE.riv});
const all = r => { const p = pass(r); return p.c && p.a2 && p.rail; };
const pc = x => String(Math.round(100 * x)).padStart(3) + '%';

if (A.blocks) {
  // proof by ablation: each pattern map (blk-<id>) against the same map without the pattern's key feature (abl-<id>), same seeds
  const B = load(A.blocks), by = (k, st) => B.find(r => r.key === k && r.start === st), starts = [...new Set(B.map(r => r.start))].sort();
  console.log('ONE-BLOCK PROOF: effect = mean over the 8 generic bots of |win share with the pattern - without it|; passable = some bot wins >= 30% with it');
  console.log('block'.padEnd(10) + starts.map(st => `seeds ${st}: effect best`).join(' | ') + '   proven   with it: best bot / without: best bot');
  for (const k of [...new Set(B.map(r => r.key))].filter(k => k.startsWith('blk-'))) {
    const id = k.slice(4), cells = starts.map(st => { const p = by(k, st), q = by('abl-' + id, st); if (!p || !q) return null;
      const bots = Object.keys(p.wins), eff = bots.reduce((a, b) => a + Math.abs(p.wins[b] - q.wins[b]), 0) / bots.length;
      return {eff, best: p.dom, ok: eff >= RULE.effect && p.dom >= RULE.passable, pb: p.best, qb: q.best}; });
    if (cells.some(c => !c)) { console.log(id.padEnd(10) + 'missing runs'); continue; }
    console.log(id.padEnd(10) + cells.map(c => `      ${c.eff.toFixed(2)}  ${c.best.toFixed(2)}`.padEnd(22)).join(' | ') + `   ${cells.every(c => c.ok) ? 'yes' : 'NO '}      ${cells[0].pb} / ${cells[0].qb}`);
  }
}
if (A.tune) {
  const T = load(A.tune), H = load(A.hold), byKey = Object.fromEntries(H.map(r => [r.key, r]));
  const line = r => `${r.key.padEnd(7)} c' ${adaptAny(r).toFixed(2).padStart(5)} a2' ${String(dpmCF(r)).padStart(5)} riv ${r.riv.toFixed(2)}  best ${r.best.padEnd(13)}`;
  const kept = T.filter(all);
  console.log(`\nDRAWN MAPS: ${T.length} raced on the tune block; pass each filter: c' ${T.filter(r => pass(r).c).length}, a2' ${T.filter(r => pass(r).a2).length}, rail ${T.filter(r => pass(r).rail).length}; all three: ${kept.length}`);
  for (const r of kept) { const h = byKey[r.key], ok = h && all(h); console.log(line(r) + ' | held: ' + (h ? line(h).slice(8) + (ok ? ' still passes' : ' FAILS on held-out') : 'not raced') + '   ' + pats(r.key).join('+')); }
  const still = kept.filter(r => byKey[r.key] && all(byKey[r.key]));
  console.log(`kept on tune: ${kept.length} of ${T.length}; still pass on held-out seeds: ${still.length} of ${kept.length}`);
  console.log(`f. variety: distinct best generic bots over the kept maps ${new Set(still.map(r => byKey[r.key].best)).size} over ${still.length} [${[...new Set(still.map(r => byKey[r.key].best))].join(' ')}]; over all ${H.length} drawn maps ${new Set(H.map(r => r.best)).size}`);
  const rej = T.filter(r => !all(r)), why = {c: 0, a2: 0, rail: 0}; rej.forEach(r => { const p = pass(r); for (const k in why) if (!p[k]) why[k]++; });
  console.log(`rejected ${rej.length}: failed c' ${why.c}, a2' ${why.a2}, rail ${why.rail} (a map can fail several)`);
  const inst = (k, rs) => rs.length ? pc(rs.filter(all).length / rs.length) : '  -';
  const ids = ['steward', 'pioneer', 'bait', 'clump', 'chicken', 'fence', 'tower', 'rhythm', 'gate', 'hidden', 'ceiling', 'signs', 'scrape', 'double', 'stakes', 'calm', 'break', 'finish'];
  console.log('pass rate on the tune block by pattern present (a pattern can share a map): ' + ids.map(id => { const rs = T.filter(r => pats(r.key).includes(id)); return id + ' ' + inst(id, rs).trim() + '/' + rs.length; }).join(', '));
}
if (A.ship) { const S = load(A.ship); console.log(`\nfor comparison, the shipped maps on the same filters (${S.length}): pass all three ${S.filter(all).length}: ${S.filter(all).map(r => r.key).join(' ')}`); }
