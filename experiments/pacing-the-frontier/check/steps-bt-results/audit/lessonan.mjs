// Lesson coverage per briefing kind, strict vs relaxed filter, from raw/<prefix>-<kind>.json (../boxes/lesson.mjs search output). node lessonan.mjs lesson|lessontim
import {readFileSync, existsSync} from 'node:fs';
const pre = process.argv[2] || 'lesson';
for (const k of ['barrier', 'strike', 'race', 'gap', 'shadow', 'singularity']) {
  const f = 'raw/' + pre + '-' + k + '.json'; if (!existsSync(f)) { console.log(k, 'missing'); continue; }
  const {rows} = JSON.parse(readFileSync(f, 'utf8')), n = rows.length;
  const base = r => r.feas.infeasible === 0 && r.feas.nearMaxShare <= 0.2 && r.feas.nowarn <= 1 && r.feas.stopBoxes <= 3;
  const st = r => base(r) && r.feas.scrapeOnly === 0, rl = r => base(r) && r.feas.scrapeOnly <= 1, p = fn => (100 * rows.filter(fn).length / n).toFixed(1);
  const se = fn => { const x = rows.filter(fn).length / n; return (100 * Math.sqrt(x * (1 - x) / n)).toFixed(1); };
  console.log(k.padEnd(12), 'n', n, '| lesson alone', p(r => r.lesson), '| filter strict', p(st), 'relaxed', p(rl), '| coverage strict', p(r => r.lesson && st(r)), '±', se(r => r.lesson && st(r)), 'relaxed', p(r => r.lesson && rl(r)), '±', se(r => r.lesson && rl(r)), '| scrape-only per map', (rows.reduce((a, r) => a + r.feas.scrapeOnly, 0) / n).toFixed(2));
}
