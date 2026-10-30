// Collect candidates by id from spec files into one calibration spec: node pick.mjs start count "slot=id|id;slot=id" > spec.json
import {readFileSync} from 'node:fs';
const [start, count, sel] = process.argv.slice(2), cands = [];
const find = (slot, id) => { for (const f of [`screen/spec${slot}.json`, `screen/mix${slot}.json`]) { try { const c = JSON.parse(readFileSync(f, 'utf8')).cands.find(x => x.id === id); if (c) return c; } catch (e) {} } throw new Error('no ' + slot + ' ' + id); };
for (const part of sel.split(';')) { const k = part.indexOf('='), slot = part.slice(0, k), ids = part.slice(k + 1); for (const id of ids.split('|')) { const c = find(slot, id); cands.push(Object.assign({}, c, {id: 'm' + slot + '/' + id})); } }
console.log(JSON.stringify({cands, start: +start, count: +count, diff: 'medium', players: ['runup', 'climber', 'gamble', 'scout', 'balanced', 'bold', 'rush', 'drafter', 'follower', 'twin', 'climb0', 'rush1']}));
