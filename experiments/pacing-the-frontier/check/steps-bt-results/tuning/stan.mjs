// node stan.mjs NAME  -> sight-trap tables from raw/st-NAME.json
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const _f = new URL('raw/st-' + process.argv[2] + '.json.gz', import.meta.url);
const {enc, races} = JSON.parse(gunzipSync(readFileSync(_f)).toString());
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '-';
const R = enc.filter(e => e.out !== 'none');  // reached the box
const outs = ['clean', 'scrape', 'fall', 'ext'];
console.log('encounters', enc.length, 'reached', R.length);
console.log('class\tn\tshare\t' + outs.join('\t') + '\tsideEntry');
for (const c of ['free', 'committed', 'forced']) { const S = R.filter(e => e.cls === c); console.log([c, S.length, pct(S.length, R.length), ...outs.map(o => pct(S.filter(e => e.out === o).length, S.length)), pct(S.filter(e => e.side).length, S.length)].join('\t')); }
const F = R.filter(e => e.out === 'fall' || e.out === 'ext'), X = R.filter(e => e.out === 'ext');
console.log('\nfalls', F.length, 'extinctions', X.length, 'races', races.length);
const src = e => e.cls === 'forced' ? 'forced' : (e.side ? 'chosen side entry (' + e.cls + ')' : 'other (' + e.cls + ')');
const by = (S, f) => { const m = {}; for (const e of S) { const k = f(e); m[k] = (m[k] || 0) + 1; } return m; };
console.log('falls by source', JSON.stringify(by(F, src)), '\nextinctions by source', JSON.stringify(by(X, src)));
console.log('falls by box type', JSON.stringify(by(F, e => e.sing ? 'singularity' : (e.nowarn ? 'no-warning' : 'floored'))), ' all reached by type', JSON.stringify(by(R, e => e.sing ? 'singularity' : (e.nowarn ? 'no-warning' : 'floored'))));
console.log('falls: too slow (below 95% top speed) vs full speed; short = below rise at the face', JSON.stringify(by(F, e => (e.full ? 'full speed' : 'too slow') + (e.short ? ', short' : ', high enough'))));
console.log('falls by gap index', JSON.stringify(by(F, e => e.gap)));
const Fo = R.filter(e => e.cls === 'forced');
console.log('\nforced occluded', pct(Fo.filter(e => e.occ).length, Fo.length), 'occluded-in-time (would have braked)', pct(Fo.filter(e => e.inTime).length, Fo.length), 'by lab 0', pct(Fo.filter(e => e.inTime && e.occ0).length, Fo.length));
for (const [nm, S] of [['falls', F], ['extinctions', X]]) console.log(nm, 'from forced+occluded-in-time', pct(S.filter(e => e.cls === 'forced' && e.inTime).length, S.length), 'of which lab 0 shadow', pct(S.filter(e => e.cls === 'forced' && e.inTime && e.occ0).length, S.length));
console.log('\nby sight at encounter (all labs)');
console.log('sight\tn\tforced\tfall+ext');
for (const [a, b] of [[0, 150], [150, 250], [250, 350], [350, 450], [450, 2000]]) { const S = R.filter(e => e.sight >= a && e.sight < b); console.log([a + '-' + b, S.length, pct(S.filter(e => e.cls === 'forced').length, S.length), pct(S.filter(e => e.out === 'fall' || e.out === 'ext').length, S.length)].join('\t')); }
console.log('\nby player (lab 0 only)');
console.log('player\tn\tsight\tforced\tcommitted\tfall+ext');
for (const p of [...new Set(R.map(e => e.pl))]) { const S = R.filter(e => e.lab === 0 && e.pl === p); console.log([p, S.length, (S.reduce((a, e) => a + e.sight, 0) / S.length).toFixed(0), pct(S.filter(e => e.cls === 'forced').length, S.length), pct(S.filter(e => e.cls === 'committed').length, S.length), pct(S.filter(e => e.out === 'fall' || e.out === 'ext').length, S.length)].join('\t')); }
console.log('\nby rival kind (labs 1-3)');
for (const k of ['sprinter', 'steward', 'gambler']) { const S = R.filter(e => e.lab > 0 && e.kind === k); console.log([k, S.length, pct(S.filter(e => e.cls === 'forced').length, S.length), pct(S.filter(e => e.out === 'fall' || e.out === 'ext').length, S.length)].join('\t')); }
const n = races.length, m = f => (races.reduce((a, r) => a + f(r), 0) / n);
console.log('\nraces', n, 'p0 win', m(r => r.win).toFixed(3), 'ext', m(r => r.ext).toFixed(3), 'ext by rival', m(r => r.ext && r.extBy > 0 ? 1 : 0).toFixed(3), 'p0 killed by rival roll', m(r => r.p0killedByRival).toFixed(3),
  'rival falls', m(r => r.rivalFalls).toFixed(3), 'rival strikes', m(r => r.rivalStrikes).toFixed(3), 'rival dis', m(r => r.rivalDis).toFixed(3), 'rival bar crashes', m(r => r.rivalBarCrash).toFixed(3), 'p0 strikes', m(r => r.p0str).toFixed(3), 'p0 dis', m(r => r.p0dis).toFixed(3), 'crawl s', m(r => r.crawlSteps / 30).toFixed(2));
