// Starts multiplayer/server.mjs on a spare port and drives it with test clients: rooms and codes, two races at once, controls
// reaching the lab, host Free seat and Remove, the away timeout, reconnecting by token, host hand-over and the Origin check.
// Needs Node 22 or later (the built-in WebSocket). Usage: node experiments/pacing-the-frontier/check/mp-check.mjs
import {spawn} from 'node:child_process';
import {createServer, request} from 'node:http';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = join(here, '..', 'multiplayer', 'server.mjs');
if (typeof WebSocket !== 'function') { console.log('mp-check needs Node 22 or later (built-in WebSocket).'); process.exit(1); }

const port = await new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const srv = spawn(process.execPath, [serverPath, '--port', String(port), '--afk', '2'], {stdio: ['ignore', 'pipe', 'inherit']});
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('server did not start')), 10000);
  srv.stdout.on('data', d => { if (String(d).includes('http://localhost')) { clearTimeout(t); res(); } });
});
const t0 = Date.now();
let failed = 0;
function ok(cond, what) { console.log((cond ? 'ok    ' : 'FAIL  ') + what); if (!cond) failed++; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* a test client keeps every message and its latest lobby; until(pred) waits for a message after the last mark() */
class Client {
  constructor() { this.msgs = []; this.from = 0; this.lobby = null; }
  open() {
    this.ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    this.ws.onmessage = e => { const m = JSON.parse(e.data); this.msgs.push(m); if (m.t === 'lobby') this.lobby = m; };
    return new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
  }
  send(o) { this.ws.send(JSON.stringify(o)); }
  mark() { this.from = this.msgs.length; }
  async until(pred, ms = 3000) {
    const end = Date.now() + ms;
    for (;;) {
      for (let i = this.from; i < this.msgs.length; i++) if (pred(this.msgs[i])) { this.from = i + 1; return this.msgs[i]; }
      if (Date.now() > end) return null;
      await sleep(10);
    }
  }
  lobbyWhere(pred, ms) { return this.until(m => m.t === 'lobby' && pred(m), ms); }
  close() { this.ws.close(); }
}
async function client() { const c = new Client(); await c.open(); return c; }
async function health() { return (await fetch(`http://127.0.0.1:${port}/health`)).json(); }
const isCode = s => /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/.test(s);

try {
  /* rooms and codes */
  const a = await client(), b = await client();
  a.send({t: 'create', name: 'Ada'});
  const la = await a.lobbyWhere(() => true);
  ok(la && isCode(la.room) && la.you.host && la.you.token.length === 32, 'create gives a four-consonant code, a token, and host');
  const room1 = la.room;
  b.send({t: 'join', room: room1.toLowerCase(), name: 'Ada'});
  const lb = await b.lobbyWhere(m => m.room === room1);
  ok(lb && !lb.you.host && lb.you.name === 'Ada2', 'join by code (any case); a taken name gets a number');
  b.send({t: 'name', name: 'Bo'});
  ok(await a.lobbyWhere(m => m.watching.some(p => p.name === 'Bo')), 'rename shows to the others');
  const x = await client();
  x.send({t: 'join', room: 'ZZZZ', name: 'Lost'});
  ok((await x.until(m => m.t === 'error'))?.code === 'noroom', 'a bad code gets "noroom"');

  /* a race: controls reach the lab */
  a.send({t: 'seat', seat: 0}); b.send({t: 'seat', seat: 1}); a.send({t: 'opts', bots: false});
  ok(await b.lobbyWhere(m => m.seats[0]?.name === 'Ada' && m.seats[1]?.name === 'Bo' && !m.opts.bots), 'two players sit; bots off');
  a.mark(); b.mark();
  b.send({t: 'start'});
  const st = await a.until(m => m.t === 'start');
  ok(st && st.wait > 2 && st.snap.labs.length === 2 && st.snap.labs.every(l => l.human), 'start reaches both, with only the two player labs');
  a.send({t: 'in', pace: 1, w: [25, 50, 25], rev: false, fwd: true});
  b.send({t: 'in', pace: 0.2, w: [25, 50, 25], rev: true, fwd: false});
  const s1 = await a.until(m => m.t === 's' && m.time > 0.5, 6000);
  const s2 = await a.until(m => m.t === 's' && m.time > 3.5, 6000);
  if (s1 && s2) {
    const dx = id => s2.labs.find(l => l.id === id).x - s1.labs.find(l => l.id === id).x;
    ok(dx(0) > dx(1) + 5, `controls reach the labs (Floor it moved ${dx(0).toFixed(1)}, Back up ${dx(1).toFixed(1)})`);
    ok(!('hs' in s2.labs[0]) && !('ibuf' in s2.labs[0]), 'snapshots leave out private input state');
  } else ok(false, 'snapshots arrive');

  /* a second room races at the same time */
  const c = await client();
  c.send({t: 'create', name: 'Cy'});
  const lc = await c.lobbyWhere(() => true);
  ok(lc && lc.room !== room1, 'a second room gets its own code');
  c.send({t: 'seat', seat: 2}); c.mark(); c.send({t: 'start'});
  const st2 = await c.until(m => m.t === 'start');
  ok(st2 && st2.snap.labs.length === 4, 'the second room races with bots in the empty seats');
  ok(!a.msgs.slice(-40).some(m => m.t === 's' && m.labs.length === 4), 'room one sees none of room two');
  const h = await health();
  ok(h.rooms >= 2 && h.races === 2, `/health counts rooms and races (${JSON.stringify(h)})`);

  /* host controls between races, in a third room */
  const host = await client(), p = await client(), q = await client();
  host.send({t: 'create', name: 'Host'});
  const room3 = (await host.lobbyWhere(() => true)).room;
  p.send({t: 'join', room: room3, name: 'Pat'}); q.send({t: 'join', room: room3, name: 'Quinn'});
  const lp = await p.lobbyWhere(m => m.room === room3);
  const lq = await q.lobbyWhere(m => m.room === room3);
  p.send({t: 'seat', seat: 1}); q.send({t: 'seat', seat: 2});
  await host.lobbyWhere(m => m.seats[1]?.name === 'Pat' && m.seats[2]?.name === 'Quinn');
  p.send({t: 'free', id: lq.you.id}); p.send({t: 'remove', id: lq.you.id});
  await sleep(300);
  ok(q.lobby.you.seat === 2 && q.msgs.every(m => m.t !== 'error'), 'a player who is not host cannot free or remove');
  host.send({t: 'free', id: lp.you.id});
  ok(await p.lobbyWhere(m => m.you.seat === null && !m.seats[1]), 'host frees a seat: the player moves to watching');
  q.mark(); host.send({t: 'remove', id: lq.you.id});
  ok((await q.until(m => m.t === 'error'))?.code === 'removed', 'host removes a player');
  ok(await host.lobbyWhere(m => !m.watching.some(w => w.name === 'Quinn')), 'the removed player leaves the room list');
  q.mark(); q.send({t: 'join', room: room3, name: 'Quinn', token: lq.you.token});
  ok((await q.until(m => m.t === 'error'))?.code === 'removed', 'a removed player cannot come back with their token');

  /* away: a hidden tab loses its lobby seat after --afk seconds (2 here); during a race it keeps it */
  p.send({t: 'seat', seat: 1});
  await host.lobbyWhere(m => m.seats[1]?.name === 'Pat');
  p.send({t: 'vis', hidden: true});
  ok(await host.lobbyWhere(m => m.seats[1]?.away), 'a hidden tab shows as away');
  ok(await host.lobbyWhere(m => !m.seats[1] && m.watching.some(w => w.name === 'Pat'), 5000), 'an away player loses the seat after the timeout');
  p.send({t: 'vis', hidden: false});
  ok(await host.lobbyWhere(m => m.watching.some(w => w.name === 'Pat' && !w.away)), 'coming back clears away');

  /* reconnect by token: same member, same seat */
  p.send({t: 'seat', seat: 3});
  await host.lobbyWhere(m => m.seats[3]?.name === 'Pat');
  const tok = p.lobby.you.token, pid = p.lobby.you.id;
  p.close();
  ok(await host.lobbyWhere(m => m.seats[3]?.away), 'a closed tab keeps its seat for now, marked away');
  const p2 = await client();
  p2.send({t: 'join', room: room3, name: '', token: tok});
  const lp2 = await p2.lobbyWhere(m => m.room === room3);
  ok(lp2 && lp2.you.id === pid && lp2.you.seat === 3 && lp2.you.name === 'Pat', 'the token takes back the same seat and name');
  const p3 = await client();
  p3.send({t: 'join', room: room3, name: 'Pat'});
  const lp3 = await p3.lobbyWhere(m => m.room === room3);
  ok(lp3 && lp3.you.id !== pid && lp3.you.seat === null, 'typing the same name without the token does not take the seat');
  p3.close();

  /* a second tab with the same token takes over, and the first is told */
  const p4 = await client();
  p2.mark();
  p4.send({t: 'join', room: room3, token: tok});
  ok((await p2.until(m => m.t === 'error'))?.code === 'elsewhere', 'opening the room in a second tab tells the first one');
  ok((await p4.lobbyWhere(m => m.you.id === pid))?.you.seat === 3, 'the second tab has the seat');

  /* the host role: a reload keeps it; leaving hands it to a present player */
  const htok = host.lobby.you.token;
  host.close();
  await p4.lobbyWhere(m => m.watching.some(w => w.name === 'Host' && w.away));
  const host2 = await client();
  host2.send({t: 'join', room: room3, token: htok});
  ok((await host2.lobbyWhere(m => m.room === room3))?.you.host, 'a host who reloads is still host');
  host2.send({t: 'leave'});
  ok(await p4.lobbyWhere(m => m.you.host), 'when the host leaves, the next player becomes host');

  /* leave */
  p4.mark(); p4.send({t: 'leave'});
  ok(await p4.until(m => m.t === 'left'), 'leave confirms');

  /* the Origin check: only listed sites may open a socket */
  const tryOrigin = origin => new Promise(res => {
    const r = request({host: '127.0.0.1', port, path: '/ws', headers: {Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', Origin: origin}});
    r.on('upgrade', (res2, sock) => { sock.destroy(); res(true); });
    r.on('error', () => res(false));
    r.on('response', () => res(false));
    r.end();
  });
  ok(await tryOrigin('https://the-last-race.com'), 'the site may connect');
  ok(!(await tryOrigin('https://evil.example')), 'another site may not');

  /* the page itself is served, marked as a multiplayer page */
  const page = await (await fetch(`http://127.0.0.1:${port}/`)).text();
  ok(page.includes('window.PF_MP=1'), 'the server serves the page marked for multiplayer');

  for (const k of [a, b, c, x, q, p2, p4]) try { k.close(); } catch {}
} catch (e) {
  console.log('FAIL  ' + (e && e.stack || e)); failed++;
} finally {
  srv.kill();
}
console.log(failed ? `${failed} multiplayer check(s) failed.` : `All multiplayer checks passed (${((Date.now() - t0) / 1000).toFixed(1)} s).`);
process.exit(failed ? 1 : 0);
