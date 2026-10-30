// timing-only page must generate the same tracks as the current page (BOXFIT 0, stepFit 103 is today's generator)
import {trackStats} from './bt.mjs';
const out = []; for (let s = 5000; s < 5100; s++) out.push(trackStats({seed: s, steps: 1}).boxes.map(b => [b.W, b.rise]));
console.log(JSON.stringify(out).length, require_hash(JSON.stringify(out)));
function require_hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h; }
