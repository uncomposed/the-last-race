// Builds page copies with the proposed CAMPAIGN table (../campaign-proposed.js) spliced in. Pages: page-combined-propcamp.html, page-current-propcamp.html
import {readFileSync, writeFileSync} from 'node:fs';
const prop = readFileSync('../campaign-proposed.js', 'utf8'), pm = /^var CAMPAIGN=\[[\s\S]*?^\];/m.exec(prop)[0];
for (const [src, dst] of [['page-combined.html', 'page-combined-propcamp.html'], ['../../../prototype.html', 'page-current-propcamp.html']]) {
  const s = readFileSync(src, 'utf8'), m = /^var CAMPAIGN=\[[\s\S]*?^\];/m.exec(s);
  if (!m) throw new Error('no CAMPAIGN in ' + src);
  writeFileSync(dst, s.slice(0, m.index) + pm + s.slice(m.index + m[0].length));
  console.log(dst, 'replaced', m[0].length, 'chars with', pm.length);
}
