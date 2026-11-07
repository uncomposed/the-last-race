// What the daily board's server has to do, in the fewest lines, with nothing private in it. It is a test double and a statement of the contract, not the real server.
// Run: node lb-reference-server.mjs [port]  (default 8787), then open the game with ?lb=local. It holds boards in memory and forgets them on exit.
//   GET  /v1/sim/{id}          200 {ok:true,sim:id} only if this server runs that exact simulation. The client hides the whole board on anything else.
//   GET  /v1/daily/{date}/{map} 200 {times:[...],any:[rows],first:[rows]}. rows are {name,t,attempts,chill}, fastest first. times are every entry's seconds.
//   POST /v1/daily/{date}/{map} {run,name,tries,token}. Races the run again. 200 {ok:true,place,entries} or 422 {ok:false,why}. Nothing is stored unless the replay matches.
// The rules a real server also needs (name filter, rate limits, size caps, today's and yesterday's dates only) are in LEADERBOARD-PLAN.md and are not here.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), L = readFileSync(join(HERE, 'game.html'), 'utf8').split('\n');
const a = L.findIndex(l => l.startsWith('function $(id)')), b = L.findIndex(l => l.startsWith('window.PF={'));
const SIM = L.slice(a, b + 1).join('\n'), SIM_ID = createHash('sha256').update(SIM).digest('hex').slice(0, 16);
const GH = new Function(readFileSync(join(HERE, 'ghost.js'), 'utf8') + '\nreturn {ghRefuse,ghReplay,ghSame};')();
const fresh = () => { const PF = new Function('window', 'document', SIM + '\nreturn window.PF;')({}, null); return {K: PF.K, KSNAP: {...PF.K, stepGaps: 1, chill: 1}, SEGS: PF.SEGS, segUse: PF.segUse, newGame: PF.newGame, step: PF.step, G: PF.G}; };
const dailySeed = date => { let h = 2166136261; for (let i = 0; i < date.length; i++) h = Math.imul(h ^ date.charCodeAt(i), 16777619); return h >>> 0; };
// a run is good only if it is for this build and this map and this date's dice, won, and replays to exactly what it says
export function verify(run, date, map) {
  const api = fresh(), why = GH.ghRefuse(run, SIM_ID, api.SEGS);
  if (why) return why;
  if (run.map !== map) return 'wrong map';
  if (run.seed !== dailySeed(date)) return 'wrong dice for this date';
  if (!run.end.won) return 'not a win';
  return GH.ghSame(GH.ghReplay(api, run), run) ? '' : 'replay did not match';
}
const boards = new Map(), order = (x, y) => x.t - y.t;
const rows = l => l.map(({name, t, attempts, chill}) => ({name, t, attempts, chill}));
function serve(port) {
  createServer((q, s) => {
    const send = (st, j) => { s.writeHead(st, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type'}); s.end(JSON.stringify(j)); };
    if (q.method === 'OPTIONS') return send(204, {});
    let m = /^\/v1\/sim\/([0-9a-f]+)$/.exec(q.url);
    if (m) return m[1] === SIM_ID ? send(200, {ok: true, sim: SIM_ID}) : send(404, {ok: false});
    m = /^\/v1\/daily\/(\d{4}-\d\d-\d\d)\/([\w-]+)$/.exec(q.url);
    if (!m) return send(404, {ok: false});
    const k = m[1] + '/' + m[2], B = boards.get(k) || []; 
    if (q.method === 'GET') { const any = [...B].sort(order); return send(200, {times: any.map(r => r.t), any: rows(any), first: rows(any.filter(r => r.attempts === 1))}); }
    let body = ''; q.on('data', d => { body += d; if (body.length > 400000) q.destroy(); });
    q.on('end', () => {
      let p; try { p = JSON.parse(body); } catch { return send(400, {ok: false, why: 'not JSON'}); }
      const why = verify(p.run, m[1], m[2]); if (why) return send(422, {ok: false, why});
      B.push({name: String(p.name).slice(0, 16), t: p.run.end.t, attempts: p.tries, chill: !!p.run.chill, token: p.token}); boards.set(k, B);
      send(200, {ok: true, place: B.filter(r => r.t < p.run.end.t).length + 1, entries: B.length});
    });
  }).listen(port, '127.0.0.1', () => console.log('board test double on http://127.0.0.1:' + port + ', simulation ' + SIM_ID));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) serve(+process.argv[2] || 8787);
