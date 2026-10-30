// node rosters.mjs e.json [players]: win rate per case x diff x roster x probe (the 7 rosters)
import {readFileSync} from 'node:fs';
const {rows} = JSON.parse(readFileSync(process.argv[2], 'utf8')); const RN = ['S', 'G', 'P', 'SG', 'SP', 'PG', 'ALL'];
const players = (process.argv[3] || 'rush,gamble,bold,climber,balanced,follower,runup,scout,drafter,twin').split(',');
for (const key of [...new Set(rows.map(r => r[0]))]) for (const d of [...new Set(rows.map(r => r[2]))]) { console.log(key, d);
  for (const p of players) { const line = RN.map((n, t) => { const x = rows.filter(r => r[0] === key && r[2] === d && r[4] === p && r[1] === t + 1); return x.length ? n + ':' + (x.reduce((s, r) => s + r[5], 0) / x.length).toFixed(2) : ''; }); console.log('   ' + p.padEnd(9) + line.join(' ')); } }
