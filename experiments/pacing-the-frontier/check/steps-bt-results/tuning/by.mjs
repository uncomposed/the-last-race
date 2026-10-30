// node by.mjs field metric name1 name2 ...  -> mean of metric by group field (pl, m, tier) for each config
import {load} from './an.mjs';
const [field, metric, ...names] = process.argv.slice(2);
const data = names.map(n => load(n)), groups = [...new Set(data[0].map(r => r[field]))];
console.log(['group', ...names].join('\t'));
for (const g of groups) console.log([g, ...data.map(R => { const S = R.filter(r => r[field] === g); return (S.reduce((a, r) => a + r[metric], 0) / S.length).toFixed(3); })].join('\t'));
