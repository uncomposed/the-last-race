// Measures the "you raced like" table (RACED in prototype.html) and validates it on held-out seeds. Plain Node, no dependencies.
// Usage (about 10 s with the defaults):
//   node experiments/pacing-the-frontier/check/raced-like.mjs [calStart calN holdStart holdN]
// Each rival kind drives lab 0 against all three rivals, free play, default knobs, stepped at 1/60 s as the page does. The habits come
// from the page's own rlNew / rlTick / rlFeat, so this measures exactly what the page measures. It prints each kind's mean and spread
// on the calibration block (paste into RACED by hand), then, using those, the confusion matrix on the held-out block with chill on and off,
// how many runs read as a mix, and the same matrix from the behaviour habits alone (run, floor, knock; no split). Bot play only.
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'prototype.html'), 'utf8');
const lines = src.split('\n');
function table(name) {
  const m = new RegExp('^var ' + name + '=[\\[{][\\s\\S]*?\\n[\\]}];', 'm').exec(src);
  if (!m) throw new Error('table ' + name + ' not found');
  return m[0];
}
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
const a = lines.findIndex(l => l.startsWith('function $(id)')), b = lines.findIndex(l => l.startsWith('window.PF={'));
const X = new Function('window', 'document', [lines.slice(a, b + 1).join('\n'), table('RACED'), lines.find(l => l.startsWith('var RL_F=')),
  ...['rlNew', 'rlTick', 'rlFeat', 'rlClassify'].map(fn)].join('\n') +
  '\nreturn {PF:window.PF,RACED,RL_SMIN,rlNew,rlTick,rlFeat,rlClassify};')({}, null);

const [c0, cn, h0, hn] = process.argv.length > 2 ? process.argv.slice(2, 6).map(Number) : [1, 300, 10001, 300];
const PF = X.PF, K = PF.K, KS = ['sprinter', 'steward', 'gambler'], dt = 1 / 60;
function habits(seed, kind) {
  PF.newGame(seed, kind);
  const G = PF.G(), l = G.labs[0], A = X.rlNew();
  for (let g = 0; !G.over && !l.out && !l.done && g < 40000; g++) { PF.step(dt); X.rlTick(A, l, dt); }
  return X.rlFeat(A, l);
}
function block(s0, n) { const R = {}; for (const k of KS) { R[k] = []; for (let s = s0; s < s0 + n; s++) { const f = habits(s, k); if (f) R[k].push(f); } } return R; }
const r3 = v => Math.round(v * 1000) / 1000;

K.chill = 1;
const cal = block(c0, cn);
console.log('Calibration, seeds ' + c0 + ' to ' + (c0 + cn - 1) + ', chill on. Habits: run, sight, speed, floor, knock');
for (const k of KS) {
  const F = cal[k], m = F[0].map((_, j) => F.reduce((p, r) => p + r[j], 0) / F.length);
  const s = F[0].map((_, j) => Math.sqrt(F.reduce((p, r) => p + (r[j] - m[j]) ** 2, 0) / (F.length - 1)));
  X.RACED[k].m = m.map(r3); X.RACED[k].s = s.map(r3);
  console.log('  ' + k + ':{m:' + JSON.stringify(X.RACED[k].m) + ',s:' + JSON.stringify(X.RACED[k].s) + '},  n = ' + F.length);
}
for (const chill of [1, 0]) {
  K.chill = chill;
  const R = block(h0, hn);
  console.log('Held out, seeds ' + h0 + ' to ' + (h0 + hn - 1) + ', chill ' + (chill ? 'on' : 'off') + '. Rows true kind; columns named kind (Sprinter, Steward, Gambler)');
  for (const k of KS) {
    const row = {sprinter: 0, steward: 0, gambler: 0}, beh = {sprinter: 0, steward: 0, gambler: 0};
    let mix = 0;
    for (const f of R[k]) {
      const r = X.rlClassify(f); row[r.k]++; if (r.k2) mix++;
      let best = null, bd = Infinity;
      for (const q of KS) { const c = X.RACED[q]; let s2 = 0; for (const j of [0, 3, 4]) { const z = (f[j] - c.m[j]) / Math.max(c.s[j], X.RL_SMIN); s2 += z * z; } if (s2 < bd) { bd = s2; best = q; } }
      beh[best]++;
    }
    console.log('  ' + k.padEnd(9) + KS.map(q => String(row[q]).padStart(5)).join('') + '   of ' + R[k].length + ', mixes ' + mix +
      '   behaviour only:' + KS.map(q => String(beh[q]).padStart(5)).join(''));
  }
}
K.chill = 1;
