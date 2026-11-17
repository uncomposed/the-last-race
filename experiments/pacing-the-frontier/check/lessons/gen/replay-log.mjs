// [[ai gen]] Races an exported playtest log again under plain Node and says, run by run, whether each race ends exactly as it did in the browser.
//   node gen/replay-log.mjs <full-log.json> [--page ../game/game.html]
// The log is what "Copy full log" gives on the playtest page (game/game.js, ptFull), or the raw localStorage value of pf-playtest-v1: both carry `runs`.
// It loads the built page's own simulation the way game/ghost-check.mjs does, adds the generator exactly where the page has it (after the window.PF line),
// registers each drawn map with the page's own gmGenMap, and replays the recorded controls with ghost.js's ghReplay in a fresh simulation per run.
// "Identical" is ghSame: the same number of steps, the same ending, the same time, and the same fingerprint of every lab. The dice are part of that:
// a wrong seed gives a different road. A quit run has no end to compare and is reported as skipped; where it stood when it was left is still compared.
// Exit 1 if a finished run does not replay, or if a quit run's last recorded state differs.
// This shows the browser that made the log and this Node agree on those races. It says nothing about any other browser, or about whether a map is fun.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), GAME = join(HERE, '..', '..', 'game'), argv = process.argv.slice(2), A = {}, files = [];
for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) A[argv[i].slice(2)] = argv[++i]; else files.push(argv[i]); }
if (files.length !== 1) { console.log('usage: node gen/replay-log.mjs <full-log.json> [--page ../game/game.html]'); process.exit(2); }

const L = readFileSync(resolve(A.page || join(GAME, 'game.html')), 'utf8').split('\n');
const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
if (a < 0 || b < a) throw new Error('simulation section not found');
const SIM = L.slice(a, b + 1).join('\n'), ID = createHash('sha256').update(SIM).digest('hex').slice(0, 16);
const stamp = L.join('\n').match(/var SIM_ID='([0-9a-f]*)'/);
if (!stamp || stamp[1] !== ID) throw new Error('the page stamp ' + (stamp && stamp[1]) + ' is not the hash of its simulation ' + ID);
// the generator as the page carries it, and the page's own one-line function that registers a drawn map
const GEN = 'var GN_NOREG=1;\n' + readFileSync(join(HERE, 'maps.js'), 'utf8') + '\n';
if (!L.slice(b + 1).join('\n').startsWith(GEN)) throw new Error('the page does not carry this gen/maps.js after its window.PF line: rebuild it with node ../game/build.mjs');
const REG = L.find(l => l.startsWith('function gmGenMap(seed){'));
if (!REG) throw new Error('the page has no gmGenMap');
const GH = new Function(readFileSync(join(GAME, 'ghost.js'), 'utf8') + '\nreturn {ghRefuse,ghReplay,ghSame};')();
const make = new Function('window', 'document', SIM + '\n' + GEN + REG + '\nwindow.PF.gmGenMap=gmGenMap;\nreturn window.PF;');
const fresh = () => { const PF = make({}, null); return {K: PF.K, KSNAP: {...PF.K, stepGaps: 1, chill: 1}, SEGS: PF.SEGS, segUse: PF.segUse, newGame: PF.newGame, step: PF.step, G: PF.G, gmGenMap: PF.gmGenMap}; };

const J = JSON.parse(readFileSync(resolve(files[0]), 'utf8')), runs = Array.isArray(J) ? J : J && J.runs;
if (!Array.isArray(runs)) throw new Error('no runs in ' + files[0]);
console.log('page build ' + ID + ', log build ' + (J.sim || '(not given)') + ', ' + runs.length + ' runs' + (J.browser ? ', recorded in ' + J.browser : ''));
const how = r => { const e = r.end; return !e ? 'quit' : e.won ? 'won' : e.type === 'all' ? 'world ended' : r.dissolved ? 'dissolved' : r.out ? 'fell' : e.type === 'win' ? 'rival won' : e.type; };
let same = 0, failed = 0, skipped = 0;
runs.forEach((r0, i) => {
  const r = {...r0, map: r0.map || r0.key}, e = r.end, q = r.quit, t = e ? e.t : q ? q.t : null;
  const head = `run ${String(i + 1).padStart(2)}  drawn map ${String(r.draw).padEnd(4)} try ${String(r.try).padEnd(3)} dice ${String(r.seed).padEnd(11)} ${how(r).padEnd(12)} ${(t === null ? '?' : t.toFixed(3)).padStart(8)} s  ${String(r.n).padStart(6)} steps ${String(r.inp ? r.inp.length : 0).padStart(5)} changes  `;
  if (!r.inp) { skipped++; console.log(head + 'skipped: its controls were cut when storage filled'); return; }
  if (r.sim !== ID) { if (e) failed++; else skipped++; console.log(head + (e ? 'FAIL' : 'skipped') + ': recorded on build ' + r.sim + ', not this page'); return; }
  const api = fresh(), m = api.gmGenMap(r.draw);
  if (m.key !== r.map) { failed++; console.log(head + 'FAIL: the run names map ' + r.map + ', drawn map ' + r.draw + ' is ' + m.key); return; }
  if (!e) {  // a quit run: no end. Its steps are raced again and where it stood is compared
    const o = GH.ghReplay(api, r), ok = !!q && !o.over && o.n === r.n && o.t === q.t && o.print === q.print;
    skipped++; if (!ok) failed++;
    console.log(head + 'skipped: quit, no end to compare' + (ok ? ' (it stood where the replay stands at that step)' : '. FAIL: where it stood DIFFERS from the replay ' + JSON.stringify(o)));
    return;
  }
  const why = GH.ghRefuse(r, ID, api.SEGS);
  if (why) { failed++; console.log(head + 'FAIL: refused, ' + why); return; }
  const o = GH.ghReplay(api, r);
  if (GH.ghSame(o, r)) { same++; console.log(head + 'replays identically'); }
  else { failed++; console.log(head + 'FAIL: replay ended ' + JSON.stringify(o) + ', run ended ' + JSON.stringify(e)); }
});
console.log(same + ' finished runs replay identically, ' + failed + ' failed, ' + skipped + ' skipped');
process.exit(failed ? 1 : 0);
