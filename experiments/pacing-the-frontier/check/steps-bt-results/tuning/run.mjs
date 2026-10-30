// Runner: node run.mjs plan.json  -> runs each named config in chunks over 8 worker processes and writes raw/<name>.json (merged rows)
// plan: {configs: {name: {mode, start, count, ...}}, chunk?: 50}
import {readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), RAW = join(HERE, 'raw'), TMP = join(RAW, 'tmp');
mkdirSync(TMP, {recursive: true});
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8')), force = process.argv.includes('--force');
const jobs = [];
for (const [name, c] of Object.entries(plan.configs)) {
  if (!force && (existsSync(join(RAW, name + '.json')) || existsSync(join(RAW, name + '.json.gz')))) continue;
  const ch = c.chunk || plan.chunk || (c.mode === 'campaign' ? 5 : 50), parts = [];
  for (let s = c.start; s < c.start + c.count; s += ch) { const f = join(TMP, name + '.' + s + '.json'); parts.push(f); jobs.push({cfg: Object.assign({}, c, {start: s, count: Math.min(ch, c.start + c.count - s)}), f}); }
  c._parts = parts; c._name = name;
}
let i = 0, live = 0; const P = 8;
await new Promise(res => {
  const next = () => {
    if (i >= jobs.length && live === 0) return res();
    while (live < P && i < jobs.length) {
      const j = jobs[i++]; live++;
      const p = spawn('node', [join(HERE, j.cfg.worker === 'bp' ? 'bpsweep.mjs' : 'sweep.mjs'), JSON.stringify(j.cfg), j.f], {stdio: ['ignore', 'ignore', 'inherit']});
      p.on('exit', code => { if (code) console.error('fail', j.f); live--; next(); });
    }
  };
  next();
});
for (const c of Object.values(plan.configs)) {
  if (!c._parts) continue;
  const rows = c._parts.flatMap(f => { const r = JSON.parse(readFileSync(f, 'utf8')).rows; unlinkSync(f); return r; });
  const cfg = Object.assign({}, c); delete cfg._parts; delete cfg._name;
  writeFileSync(join(RAW, c._name + '.json'), JSON.stringify({cfg, rows}) + '\n');
  console.log(c._name, rows.length);
}
