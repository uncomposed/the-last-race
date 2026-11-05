// Ghost-link replay: turns a played run's share link into a full account of the race, rivals included.
// A ghost link (#g=...) holds only lab 0's path: x, stand height and jump offset every 6 ticks, plus the race header (seed, chill, knobs,
// outcome, end tick). This drives lab 0 along that path in the Node sim (hidden-width/bt.mjs) and lets the rivals, walls and rolls run as the
// game does, then prints the track, a timeline, every event, and whether the replay ends on the ghost's own last tick.
// What the replay cannot know: lab 0's sight and speed meters and its inputs (only its path and height are recorded). Lab 0's height is set
// from the ghost each tick; its speed is the ghost's slope. So a replay is exact only where the rivals depend on lab 0 through its position,
// speed, height and walls, which is all they read today. The end check says whether it held: MATCH or DRIFT.
//
//   node ghost-replay.mjs '<link>'                       a full link (?map=<key> names the map; links made after 1d7838f carry it)
//   node ghost-replay.mjs '<link or #g=... or code>' --map two-endings      for an older link with no map, or a bare code
//   options: --page <html>   the page whose sim and maps to use (default lessons.html; a lesson author's <lesson>/page.html works too)
//            --every <s>     timeline step in seconds (default 1); --from <s> --to <s> limit the timeline
//            --track         print the track and stop
//            --json <file>   also write {header, track, timeline, events, check} as JSON
// Run from anywhere. Uses Node's zlib for the deflate-raw links the browser makes. Exit code 0 on MATCH, 2 on DRIFT, 1 on a bad link.
import zlib from 'node:zlib';
import {writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
function opt(name, dflt) { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : dflt; }
const flag = name => argv.includes('--' + name);
const VALUED = new Set(['--map', '--page', '--every', '--from', '--to', '--json']);
const arg = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && VALUED.has(argv[i - 1])));
if (!arg) { console.error('usage: node ghost-replay.mjs <link> [--map key] [--page html] [--every s] [--from s] [--to s] [--track] [--json file]'); process.exit(1); }

// ---------- the link ----------
const mq = /[?&]map=([A-Za-z0-9_-]+)/.exec(arg), MAP = opt('map', mq ? mq[1] : null);
const code = (/#g=([A-Za-z0-9_-]+)/.exec(arg) || [null, /^[A-Za-z0-9_-]+$/.test(arg) ? arg : null])[1];
if (!code) { console.error('no #g= code in the link'); process.exit(1); }
if (!MAP) { console.error('the link names no map (links made before 1d7838f do not): pass --map <key>'); process.exit(1); }

// the page's ghPack / ghUnpack format: byte 0 is 1 (plain) or 2 (deflate-raw); varints, zigzag deltas, the header as UTF-8 JSON
export function decodeGhost(c) {
  const b = Buffer.from(c.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  if (b[0] !== 1 && b[0] !== 2) throw new Error('not a ghost code');
  const u = b[0] === 2 ? zlib.inflateRawSync(b.subarray(1)) : b.subarray(1);
  let p = 0;
  const rv = () => { let v = 0, m = 1, k = 0, x; do { if (p >= u.length || k > 5) throw new Error('truncated'); x = u[p++]; v += (x & 127) * m; m *= 128; k++; } while (x & 128); return v; };
  const rz = () => { const v = rv(); return v % 2 ? -(v + 1) / 2 : v / 2; };
  const hl = rv(), h = JSON.parse(u.subarray(p, p + hl).toString('utf8')); p += hl;
  const N = rv(), g = {h, x: [], hh: [], j: [], s: []};
  let v = 0; for (let i = 0; i < N; i++) { v += rz(); g.x.push(v); }
  v = 0; for (let i = 0; i < N; i++) { v += rz(); g.hh.push(v); }
  for (let i = 0; i < N; i++) g.j.push(rz());
  for (let i = 0; i < N; i++) g.s.push(u[p++]);
  return g;
}
// where the ghost is at tick n (the page's ghAt): samples at i*e, the last at tk; x and height interpolate
function ghostAt(g, n) {
  const e = g.h.e, N = g.x.length, last = N - 1;
  if (n >= g.h.tk || N === 1) return {x: g.x[last], h: g.hh[last]};
  const i = Math.max(0, Math.min(last - 1, Math.floor(n / e))), t0 = i * e, t1 = i + 1 === last ? g.h.tk : (i + 1) * e;
  const f = Math.min(1, Math.max(0, (n - t0) / Math.max(1e-6, t1 - t0)));
  return {x: g.x[i] + (g.x[i + 1] - g.x[i]) * f, h: g.hh[i] + (g.hh[i + 1] - g.hh[i]) * f};
}

let G0;
try { G0 = decodeGhost(code); } catch (e) { console.error('broken ghost code: ' + e.message); process.exit(1); }
const H = G0.h;

// ---------- the race ----------
process.env.PF_PAGE = resolve(opt('page', join(HERE, 'lessons.html')));
const {PF, configure} = await import(join(HERE, '..', 'hidden-width', 'bt.mjs'));
const idx = PF.SEGS.findIndex(s => s.key === MAP) + 1;
if (!idx) { console.error('no map ' + MAP + ' on ' + process.env.PF_PAGE + ' (maps: ' + PF.SEGS.map(s => s.key).join(', ') + ')'); process.exit(1); }
configure({seed: H.s, steps: H.k && H.k.stepGaps ? 1 : 0, roster: null, chill: H.c ? 1 : 0, player: 'balanced', strikesYou: null, knobs: {}, floor: H.fl || 0});
PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
PF.segUse(idx, 'build');
for (const k in (H.k || {})) if (k in PF.K && typeof H.k[k] === 'number') PF.K[k] = H.k[k];  // the run's own knobs, after the map's dial
PF.newGame(H.s, 'probe');
const G = PF.G(), me = G.labs[0], r0 = n => Math.round(n);

const track = {note: G.world && G.world.note, finish: r0(G.finish || 0),
  boxes: G.gaps.map((g, k) => ({n: k + 1, x: r0(g.x), W: r0(g.W), rise: g.rise, odds: g.odds, shade: !!g.shade, pub: !!g.pub, capTo: g.capTo})),
  bars: (G.barriers || []).slice(1).map((b, k) => ({n: k + 1, x: r0(b.x), h: r0(b.h), pub: !!b.pub}))};
const out = (s = '') => console.log(s);
out(`${PF.SEGS[idx - 1].title} (${MAP}), seed ${H.s}, chill ${H.c ? 'on' : 'off'}, ghost: ${H.o} at ${H.t} s, x ${H.x}${H.n ? ', by ' + H.n : ''}`);
out(`knobs ${JSON.stringify(H.k || {})}${H.fl ? ', floor ' + H.fl : ''}${H.lk ? ', raced like ' + H.lk.join('+') : ''}`);
out(`track: ${track.note || ''} finish ${track.finish}`);
for (const b of track.bars) out(`  bar ${b.n}: x ${b.x}, h ${b.h}${b.pub ? ', public' : ''}`);
for (const b of track.boxes) out(`  box ${b.n}: x ${b.x}, W ${b.W}, rise ${b.rise}, odds ${b.odds ?? '-'}${b.shade ? ', shade' : ''}${b.pub ? ', public' : ''}${b.capTo !== undefined ? ', capTo ' + b.capTo : ''}`);
if (flag('track')) process.exit(0);

const every = +opt('every', 1), from = +opt('from', 0), to = +opt('to', 1e9), timeline = [];
let n = 0, lastT = -1e9;
const labRow = l => ({name: l.name, x: r0(l.x), v: r0(l.v), h: r0(l.pts[1]), cap: r0(l.cap), sight: r0(l.pts[0]), speed: r0(l.pts[2]),
  air: l.jt >= 0, out: l.out ? (l.dissolved ? 'dissolved' : 'out') : null, strikes: l.strikes || 0});
out(`\ntimeline (lab 0 follows the ghost; h/cap = height / knee; s sight, p speed meter${me.pts[2] === undefined ? '' : ''}):`);
while (!G.over && n < 60 * 60 * 10) {
  const a = ghostAt(G0, n), b = ghostAt(G0, n + 1);
  me.x = a.x; me.v = (b.x - a.x) * 60; me.pts[1] = a.h; me.gx = null;
  PF.step(1 / 60); n++;
  if (me.out && !G.over) { out(`  ! lab 0 went out at ${G.t.toFixed(2)} s, which the ghost did not record: the replay has drifted`); me.out = false; }
  if (G.t >= from && G.t <= to && G.t - lastT >= every - 1e-9) {
    lastT = G.t; const row = {t: +G.t.toFixed(2), labs: G.labs.map(labRow)}; timeline.push(row);
    out(`${G.t.toFixed(1).padStart(5)}  ` + row.labs.map(l => `${l.name.slice(0, 9)} x${l.x} v${l.v} h${l.h}/${l.cap} s${l.sight} p${l.speed}${l.air ? ' air' : ''}${l.out ? ' ' + l.out.toUpperCase() : ''}`).join(' | '));
  }
}
const SKIP = new Set(['t', 'who', 'type', 'kind', 'human', 'id']);
const events = G.ev.map(e => ({t: e.t, who: e.who, type: e.type, ...Object.fromEntries(Object.entries(e).filter(([k]) => !SKIP.has(k)))}));
out('\nevents:');
for (const e of events) { const {t, who, type, ...rest} = e; out(`  ${String(t).padStart(5)} ${who} ${type} ${JSON.stringify(rest)}`); }

// ---------- the check ----------
const res = G.result || {type: 'none'};
const got = res.type === 'win' ? (res.winner === me ? 'win' : 'lost') : res.type === 'all' ? 'ext' : me.dissolved ? 'dis' : res.type;
// a world-ending fall marks every lab out, and the page's ghFinish then labels lab 0's ghost 'fell' or 'sing' (PLAYTEST.md, known issue 3)
const want = H.o === 'fell' || H.o === 'sing' ? (got === 'ext' ? 'ext' : H.o) : H.o;
const tickOk = Math.abs(n - H.tk) <= 1, outOk = got === want || (got === 'lost' && want === 'lost');
const check = {match: tickOk && outOk, replayTick: n, ghostTick: H.tk, replay: got, ghost: H.o,
  result: {type: res.type, winner: res.winner && res.winner.name, by: res.by, gap: res.gap, roll: res.roll}};
out(`\nresult: ${JSON.stringify(check.result)}`);
out(check.match ? `MATCH: the replay ends on tick ${n} (ghost ${H.tk}) with the ghost's outcome (${H.o}${want !== H.o ? ', which is the world ending' : ''})`
  : `DRIFT: replay ends on tick ${n} with ${got}; the ghost ends on tick ${H.tk} with ${H.o}. Check --page, --map and the run's settings`);
if (opt('json')) writeFileSync(opt('json'), JSON.stringify({header: H, map: MAP, track, timeline, events, check}, null, 1));
process.exit(check.match ? 0 : 2);
