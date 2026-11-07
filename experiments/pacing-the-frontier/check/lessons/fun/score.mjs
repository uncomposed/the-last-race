// [[ai gen]] Back-test for fun/tests.mjs: which quick tests separate the maps Cole called fun from the ones he called boring.
//   node fun/score.mjs --tune a.json,b.json --hold c.json,d.json
// Labels (sources in fun/NOTES.md): FUN = the 10 shipped maps Cole played (issue 34) and two round 1 lesson maps he enjoyed;
// BORING = two round 1 maps he called boring, the 18 maps of the 2026-11-05 lessons page (inferred from one remark about the whole page),
// and PR 38's 60 generated days (issue 36: variants too similar, too little micro). only-box and second-order are unlabeled (not played).
// Each test: the threshold and direction that best separate the tune block (balanced accuracy), then the same rule on the held-out block.
import {readFileSync} from 'node:fs';
const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[i + 1];
const FUN = new Set(['picket', 'long-sight', 'elbows', 'steward', 'takeoff', 'red-box', 'trailbreaker', 'three-strikes', 'ladder', 'two-endings', 'sr-lastbox@r1', 'steward-minefield@r1']);
const BOR1 = new Set(['see-early-brake@r1', 'see-early-pack@r1']);
const BOR2 = new Set(['close-footsteps', 'close-wall', 'close-spend', 'see-early-brake', 'see-early-bravo', 'see-early-pack', 'sr-landing', 'sr-odds', 'sr-lastbox', 'steward-minefield', 'cp-look', 'cp-signs', 'cp-break', 'pace-open', 'pace-limit', 'slower-care', 'unknown-world', 'look-pays']);
const grp = k => FUN.has(k) ? 'fun' : BOR1.has(k) ? 'r1-boring' : BOR2.has(k) ? 'r2-boring' : k.startsWith('gen:') ? 'gen-boring' : null;
const BOTS = ['coleFollow', 'sp-hs-eyes', 'sp-hs-slow', 'sp-hs-tail', 'sp-even-slow', 'sp-s-bold', 'sp-h-eyes'];  /* maxout never changes a control */
const rows = f => f.split(',').flatMap(p => JSON.parse(readFileSync(p, 'utf8'))).map(r => ({...r, g: grp(r.key), ...Object.fromEntries(BOTS.map(b => ['dpm:' + b, r.dpmBy ? r.dpmBy[b] : null])), adaptAny: r.wins ? +(r.dom - r.wins[r.halfBest]).toFixed(2) : null})).filter(r => r.g);
const T = rows(A.tune), H = rows(A.hold);
const TESTS = {gapMax: 'a. longest stretch without a decision (s)', dpm: 'a. decisions per minute', gapWin: 'a2. same, over races won (any bot)', dpmWin: 'a2. decisions/min, races won (any bot)', dom: 'b. best single generic bot win share', intr: 'c. half-leader fails to win', adapt: 'c. lesson bot beats half-leader by', adaptAny: 'c (no lesson bot). best generic bot beats it by', voi: 'd. decisions right after a reveal', riv: 'e. a rival survives',
  ...Object.fromEntries(BOTS.map(b => ['dpm:' + b, 'a2 control: decisions/min, ' + b + ' (all races)']))};
// balanced accuracy of "fun if dir*(x - th) >= 0"; groups weigh equally inside the boring side
function bacc(R, k, th, dir) {
  const pass = r => dir * (r[k] - th) >= 0, f = R.filter(r => r.g === 'fun'), gs = ['r1-boring', 'r2-boring', 'gen-boring'].map(g => R.filter(r => r.g === g)).filter(x => x.length);
  const tp = f.filter(pass).length / f.length, tn = gs.map(b => b.filter(r => !pass(r)).length / b.length);
  return {tp, tn, byG: tn, ba: (tp + tn.reduce((a, b) => a + b, 0) / tn.length) / 2};
}
const pc = x => String(Math.round(100 * x)).padStart(3) + '%';
console.log(`tune rows: fun ${T.filter(r => r.g === 'fun').length}, boring ${T.filter(r => r.g !== 'fun').length}; held-out rows: fun ${H.filter(r => r.g === 'fun').length}, boring ${H.filter(r => r.g !== 'fun').length}`);
console.log('test'.padEnd(44) + 'rule        tune BA | held: BA   fun-pass  r1-bor-fail r2-bor-fail gen-bor-fail');
for (const [k, label] of Object.entries(TESTS)) {
  const vals = [...new Set(T.map(r => r[k]))].sort((a, b) => a - b); let best = null;
  for (const th of vals) for (const dir of [1, -1]) { const b = bacc(T, k, th, dir); if (!best || b.ba > best.ba) best = {th, dir, ...b}; }
  const h = bacc(H, k, best.th, best.dir);
  console.log(label.padEnd(44) + ((best.dir > 0 ? '>= ' : '<= ') + best.th).padEnd(12) + pc(best.ba) + '  |  ' + pc(h.ba) + '    ' + pc(h.tp) + '      ' + h.byG.map(pc).join('        '));
}
// f. variety: distinct best generic bot across a set
const best = R => new Set(R.map(r => r.best));
for (const [name, R] of [['tune', T], ['held', H]]) {
  const f = R.filter(r => r.g === 'fun'), byBase = {}; R.filter(r => r.g === 'gen-boring').forEach(r => { (byBase[r.map] = byBase[r.map] || []).push(r); });
  console.log(`f. variety (${name}): fun maps ${best(f).size} distinct best bots over ${f.length} maps [${[...best(f)].join(' ')}]; r2 page ${best(R.filter(r => r.g === 'r2-boring')).size} over ${R.filter(r => r.g === 'r2-boring').length}; PR 38 days per base: ` +
    Object.entries(byBase).map(([m, rs]) => `${m} ${best(rs).size} over ${rs.length}`).join(', '));
}
// leave one map out: fit each test's rule on the tune block without that map, then judge that map on the held-out block. Maps are what we
// generalize to, so this is the honest number; the table above holds out seeds only.
console.log('\nleave-one-map-out (rule fit without the map, map judged on held-out seeds): BA   fun-pass  r1  r2  gen');
for (const [k, label] of Object.entries(TESTS)) {
  const hit = {fun: [0, 0], 'r1-boring': [0, 0], 'r2-boring': [0, 0], 'gen-boring': [0, 0]};
  for (const h of H) { const Tm = T.filter(r => r.key !== h.key), vals = [...new Set(Tm.map(r => r[k]))].sort((a, b) => a - b); let best = null;
    for (const th of vals) for (const dir of [1, -1]) { const b = bacc(Tm, k, th, dir); if (!best || b.ba > best.ba) best = {th, dir, ba: b.ba}; }
    const pass = best.dir * (h[k] - best.th) >= 0; hit[h.g][1]++; if (pass === (h.g === 'fun')) hit[h.g][0]++; }
  const r = g => hit[g][1] ? hit[g][0] / hit[g][1] : 0, ba = (r('fun') + (r('r1-boring') + r('r2-boring') + r('gen-boring')) / 3) / 2;
  console.log(label.padEnd(44) + pc(ba) + '   ' + ['fun', 'r1-boring', 'r2-boring', 'gen-boring'].map(g => pc(r(g))).join('  '));
}

// a2 control, part 2: who wins. If fun maps are won mostly by twitchy bots and boring ones by calm bots, dpmWin measures the bot, not the map.
// Share of all won races per winner, pooled by group, on the held-out block; next to each bot, its median decisions/min over the same maps.
console.log('\nwho wins (held-out block): share of won races by bot, and that bot\'s median decisions/min on those maps');
const WHO = ['lesson', 'maxout', ...BOTS];
console.log('group'.padEnd(12) + WHO.map(w => w.slice(0, 11).padStart(13)).join(''));
for (const g of ['fun', 'r1-boring', 'r2-boring', 'gen-boring']) {
  const R = H.filter(r => r.g === g && r.winBy), tot = R.reduce((a, r) => a + Object.values(r.winBy).reduce((x, y) => x + y, 0), 0);
  const dp = w => { const v = R.map(r => w === 'lesson' ? r.dpm : w === 'maxout' ? 0 : r.dpmBy[w]).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : 0; };
  console.log(g.padEnd(12) + WHO.map(w => (pc(R.reduce((a, r) => a + (r.winBy[w] || 0), 0) / (tot || 1)) + ' ' + String(Math.round(dp(w))).padStart(3) + '/m').padStart(13)).join(''));
}
