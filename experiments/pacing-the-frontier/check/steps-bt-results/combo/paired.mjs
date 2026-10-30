// paired per-seed delta (B - A) of class win and box metrics, seed-clustered SE
import {readFileSync} from 'node:fs';
const CLS = {fast: ['rush', 'bold', 'drafter'], build: ['smart', 'crawl', 'runup', 'climber'], careful: ['scout', 'balanced', 'follower', 'twin'], gamble: ['gamble']};
const cls = p => Object.keys(CLS).find(k => CLS[k].includes(p));
const L = f => readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse), A = L(process.argv[2]), B = L(process.argv[3]);
const ps = (R, fn, flt) => { const o = {}; for (const r of R) if (flt(r)) { (o[r.seed] ||= []).push(fn(r)); } for (const k in o) o[k] = o[k].reduce((a, b) => a + b, 0) / o[k].length; return o; };
const d = (fn, flt = () => true) => { const a = ps(A, fn, flt), b = ps(B, fn, flt), x = Object.keys(a).filter(k => k in b).map(k => b[k] - a[k]), m = x.reduce((s, v) => s + v, 0) / x.length;
  const se = Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length * (x.length - 1))); return `${(100 * m).toFixed(1)}±${(100 * se).toFixed(1)}${Math.abs(m) < 3 * se ? '?' : ''}`; };
console.log(`delta ${process.argv[3]} - ${process.argv[2]}: ext ${d(r => r.ext)} dis ${d(r => r.dis)} ` + Object.keys(CLS).map(k => `${k} ${d(r => r.win, r => cls(r.p) === k)}`).join(' '));
