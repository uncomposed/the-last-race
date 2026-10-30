// Multiplayer for Pacing the Frontier: rooms of up to four players (and up to eight watchers), each with a short code.
// Plain Node, no dependencies. Usage:
//   node experiments/pacing-the-frontier/multiplayer/server.mjs            this computer only (http://localhost:8080)
//   node experiments/pacing-the-frontier/multiplayer/server.mjs --tunnel   also open a public link with cloudflared
//   node experiments/pacing-the-frontier/multiplayer/server.mjs --lan      also listen on the local network
//   --port N picks the port (default 8080), --afk S the seconds before an away player loses a lobby seat (default 60),
//   --allow-origin URL lets pages from one more address connect (repeatable).
// The server runs each room's race itself with the simulation section of prototype.html, the same code sim-check.mjs loads, one
// copy per room, so every player is a browser that sends its controls and draws the state the server sends back. A hidden or
// minimised tab cannot stall a race. Empty seats can be filled with the usual bots. See MULTIPLAYER-PLAN.md.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createHash, randomBytes, randomInt} from 'node:crypto';
import {spawn} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pagePath = join(here, '..', 'prototype.html');
const arg = (name) => process.argv.includes(name);
const val = (name, d) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +val('--port', 8080);
const HOST = arg('--lan') ? '0.0.0.0' : '127.0.0.1';
const AFK_MS = +val('--afk', 60) * 1000;
const SEATS = 4, COUNTDOWN = 3000, DT = 1 / 60, SNAP_EVERY = 2;  /* 60 steps a second, a snapshot every 2 steps (30 a second) */
const MAX_ROOMS = 300, MAX_CONNS = 600, MAX_MEMBERS = 12, HOST_MS = 10000, EMPTY_MS = 10 * 60000;
const ORIGINS = new Set(['https://the-last-race.com', 'https://www.the-last-race.com', 'https://uncomposed.github.io']);
process.argv.forEach((a, i) => { if (a === '--allow-origin' && process.argv[i + 1]) ORIGINS.add(process.argv[i + 1].replace(/\/$/, '')); });

/* ---------- the simulation, loaded from the page: one independent copy per room ---------- */
const simSource = (() => {
  const lines = readFileSync(pagePath, 'utf8').split('\n');
  const a = lines.findIndex(l => l.startsWith('function $(id)'));
  const b = lines.findIndex(l => l.startsWith('window.PF={'));
  if (a < 0 || b < a) throw new Error('Could not find the simulation section in prototype.html');
  return lines.slice(a, b + 1).join('\n') + '\nreturn window.PF;';
})();
function loadSim() { const PF = new Function('window', 'document', simSource)({}, null); return {PF, K0: {...PF.K}}; }

/* ---------- a minimal WebSocket server (RFC 6455): text frames, ping and close; no extensions or fragmentation ---------- */
function wsFrame(op, payload) {
  const n = payload.length;
  let h;
  if (n < 126) { h = Buffer.from([0x80 | op, n]); }
  else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([h, payload]);
}
/* numbers go out with two decimals at most, which is plenty for drawing and keeps snapshots near 2 KB */
const r2 = (k, v) => (typeof v === 'number' && !Number.isInteger(v)) ? Math.round(v * 100) / 100 : v;
const textFrame = obj => wsFrame(1, Buffer.from(JSON.stringify(obj, r2)));
function wsAccept(req, socket, onOpen) {
  const key = req.headers['sec-websocket-key'];
  if (!key || String(req.headers.upgrade).toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  let buf = Buffer.alloc(0), closed = false;
  const conn = {
    send(obj) { conn.raw(textFrame(obj)); },
    raw(frame) { if (!closed) socket.write(frame); },
    busy() { return socket.writableLength > 256 * 1024; },  /* a slow link skips snapshots rather than queueing them */
    ping() { if (!closed) socket.write(wsFrame(9, Buffer.alloc(0))); },
    close() { if (!closed) { closed = true; socket.end(wsFrame(8, Buffer.alloc(0))); } },
    onmessage: null, onclose: null,
  };
  const done = () => { closed = true; const f = conn.onclose; conn.onclose = null; if (f) f(); };
  socket.on('data', d => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      if (buf.length < 2) return;
      const fin = buf[0] & 0x80, op = buf[0] & 15, masked = buf[1] & 0x80;
      let len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127 || !masked || !fin || len > 8192) { socket.destroy(); return; }
      if (buf.length < off + 4 + len) return;
      const mask = buf.subarray(off, off + 4), data = Buffer.from(buf.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
      buf = buf.subarray(off + 4 + len);
      if (op === 8) { conn.close(); socket.destroy(); return; }
      if (op === 9) { socket.write(wsFrame(10, data)); continue; }
      if (op !== 1) continue;
      let msg = null;
      try { msg = JSON.parse(data.toString('utf8')); } catch { /* ignore a bad message */ }
      if (msg && typeof msg === 'object' && conn.onmessage) conn.onmessage(msg);
    }
  });
  socket.on('close', done);
  socket.on('error', done);
  onOpen(conn);
}


/* ---------- rooms ----------
   A member is a person in a room: {id, token, name, seat, conn, hidden, awaySince, room}. The token is private to that browser and
   takes the member back after a reload; the id is public, for the host's buttons. A member is away while their tab is hidden or
   closed. During a race a seat stays held through anything; in the lobby an away member loses their seat after AFK_MS. */
const rooms = new Map();
const conns = new Set();
const CODE_ABC = 'BCDFGHJKLMNPQRSTVWXZ';  /* consonants only: easy to read aloud, and no words */
let nextId = 1;

function newCode() {
  for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_ABC[randomInt(0, CODE_ABC.length)]; if (!rooms.has(c)) return c; }
}
function newRoom() {
  const room = {code: newCode(), members: [], seats: Array(SEATS).fill(null), opts: {chill: 1, bots: 1, seed: ''}, race: null, host: null,
    sim: null, banned: new Set(), emptySince: Date.now()};
  rooms.set(room.code, room);
  return room;
}
const isAway = m => !m.conn || m.hidden;
function cleanName(v) {
  const s = String(v || '').replace(/[^\p{L}\p{N} _.'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  return s || 'Player';
}
function uniqueName(room, want, me) {
  const taken = new Set(room.members.filter(m => m !== me).map(m => m.name.toLowerCase()));
  let n = want, i = 2;
  while (taken.has(n.toLowerCase())) n = want.slice(0, 12) + i++;
  return n;
}
const pub = m => ({id: m.id, name: m.name, away: isAway(m)});
function lobbyMsg(room, m) {
  return {t: 'lobby', room: room.code, you: {id: m.id, name: m.name, seat: m.seat, token: m.token, host: room.host === m},
    host: room.host ? room.host.id : null, opts: room.opts, racing: !!room.race,
    seats: room.seats.map(s => s ? pub(s) : null), watching: room.members.filter(q => q.seat === null).map(pub)};
}
function sendLobby(room) { for (const m of room.members) if (m.conn) m.conn.send(lobbyMsg(room, m)); }
/* the host is the longest-standing member who is here, seated players first */
function pickHost(room) {
  const here = room.members.filter(m => !isAway(m));
  room.host = here.find(m => m.seat !== null) || here[0] || room.members[0] || null;
}
function dropMember(room, m) {
  if (m.seat !== null && !room.race) room.seats[m.seat] = null;
  if (m.seat !== null && room.race) return;  /* a held race seat: the member goes when the race ends */
  room.members = room.members.filter(q => q !== m);
  if (room.host === m) pickHost(room);
}

/* ---------- the race ---------- */
const NOSEND = new Set(['ibuf', 'hs', 'lastInp', 'lock', 'jkey', 'jerr', 'jn', 'crashedOn', 'jbuf', 'coyGi', 'coyT', 'basePace']);
function labOut(l) { const o = {}; for (const k in l) if (!NOSEND.has(k)) o[k] = l[k]; return o; }
function resultOut(r) { return r ? {...r, winner: r.winner ? r.winner.id : undefined} : null; }
function snap(race, full) {
  const G = race.G;
  const s = {t: 's', time: G.t, labs: G.labs.map(labOut), bars: G.barriers.map(b => b.pub ? 1 : 0),
    gaps: G.gaps.map(g => [g.pub ? 1 : 0, g.crossedBy, g.stepH]), level: G.level, fallN: G.fallN, over: G.over, result: resultOut(G.result)};
  const from = full ? 0 : race.evSent;
  s.evFrom = from; s.ev = G.ev.slice(from);
  if (full || G.log[0] !== race.logTop) s.log = G.log;
  return s;
}
function startMsg(room) {
  const race = room.race, G = race.G;
  return {t: 'start', seed: G.seed, K: room.sim.PF.K, wait: Math.max(0, race.goAt - performance.now()) / 1000,
    track: {barriers: G.barriers, gaps: G.gaps, finish: G.finish, world: G.world, sing: G.sing, maxcap: G.maxcap},
    snap: snap(race, true)};
}
/* a snapshot is skipped for a member whose link is backed up; start and end messages always go */
function broadcast(room, s, always) {
  const f = textFrame(s);
  for (const m of room.members) if (m.conn && (always || !m.conn.busy())) m.conn.raw(f);
}

function startRace(room) {
  if (room.race || !room.seats.some(Boolean)) return;
  if (!room.sim) room.sim = loadSim();
  const {PF, K0} = room.sim, opts = room.opts;
  Object.assign(PF.K, K0); PF.K.chill = opts.chill ? 1 : 0;
  PF.setRoster(null); PF.setPlayerStrikes(null);
  const n = /^\d{1,10}$/.test(opts.seed) && +opts.seed <= 4294967295 ? +opts.seed : randomInt(0, 2 ** 32 - 1);
  PF.newGame(n, 'custom');
  const G = PF.G();
  /* fair starts: the starting order is drawn each race, so no seat is always in front */
  const offs = [0, -12, -24, -36];
  for (let i = offs.length - 1; i > 0; i--) { const j = randomInt(0, i + 1); [offs[i], offs[j]] = [offs[j], offs[i]]; }
  G.labs.forEach((l, i) => { l.x = offs[i]; });
  for (const l of G.labs) {
    const m = room.seats[l.id];
    if (!m) continue;
    l.human = true; l.name = m.name;
    l.hs = {input: {pace: 0.7, w: [25, 50, 25], jump: false, auto: !!opts.chill, rev: false, fwd: false}, ibuf: [], eff: null};
  }
  if (!opts.bots) G.labs = G.labs.filter(l => l.human);
  room.race = {G, goAt: performance.now() + COUNTDOWN, last: 0, acc: 0, steps: 0, evSent: 0, logTop: null};
  const s = startMsg(room);
  room.race.evSent = G.ev.length; room.race.logTop = G.log[0];
  broadcast(room, s, true);
  sendLobby(room);
}
function endRace(room) {
  const s = snap(room.race, true);
  room.race = null;
  broadcast(room, s, true);
  /* members who left mid-race were kept only for their seat */
  for (const m of room.members.slice()) if (!m.conn && m.seat !== null && m.left) { room.seats[m.seat] = null; m.seat = null; dropMember(room, m); }
  sendLobby(room);
}
function stepRace(room, now) {
  const race = room.race, G = race.G;
  if (now < race.goAt) return;
  if (!race.last) race.last = now;
  /* once every human lab is out or home the bots finish at 4x, as in one-player races */
  const live = G.labs.some(l => l.human && !l.out && !l.done);
  race.acc += Math.min(0.1, (now - race.last) / 1000) * (live ? 1 : 4); race.last = now;
  let stepped = 0;
  while (race.acc >= DT && !G.over && stepped < 40) { room.sim.PF.step(DT); race.acc -= DT; race.steps++; stepped++; }
  if (G.over) { endRace(room); return; }
  if (stepped && race.steps % SNAP_EVERY < stepped) {
    const s = snap(race, false);
    race.evSent = G.ev.length; race.logTop = G.log[0];
    broadcast(room, s);
  }
}
setInterval(() => { const now = performance.now(); for (const room of rooms.values()) if (room.race) stepRace(room, now); }, 5);

/* once a second: away players lose lobby seats, an away host hands over, and empty rooms close */
setInterval(() => {
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    let changed = false;
    for (const m of room.members.slice()) {
      if (!isAway(m)) { m.awaySince = 0; continue; }
      if (!m.awaySince) m.awaySince = now;
      const gone = now - m.awaySince;
      if (!room.race && m.seat !== null && gone >= AFK_MS) { room.seats[m.seat] = null; m.seat = null; changed = true; }
      if (!room.race && !m.conn && gone >= EMPTY_MS) { dropMember(room, m); changed = true; }
      if (room.host === m && gone >= HOST_MS) { const old = room.host; pickHost(room); if (room.host !== old) changed = true; }
    }
    if (room.members.some(m => m.conn)) room.emptySince = now;
    else if (!room.race && now - room.emptySince >= EMPTY_MS) { rooms.delete(room.code); continue; }
    if (changed) sendLobby(room);
  }
}, 1000);

/* ---------- messages ---------- */
const num = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v)) ? Math.min(b, Math.max(a, v)) : d;
function labOf(room, m) { return room.race && m.seat !== null ? room.race.G.labs.find(l => l.id === m.seat && l.hs) : null; }
function fail(c, code, msg) { c.conn.send({t: 'error', code, msg}); }
/* leave the current room, if any: the seat stays held during a race and frees after it */
function detach(c, left) {
  const m = c.member;
  if (!m) return;
  c.member = null; m.conn = null; m.left = m.left || left;
  const room = m.room;
  if (left) dropMember(room, m);  /* a closed tab keeps the host role for HOST_MS, so a reload does not hand it over */
  sendLobby(room);
}
function attach(c, room, m) {
  if (m.conn && m.conn !== c.conn) { m.conn.send({t: 'error', code: 'elsewhere', msg: 'You opened this room in another tab.'}); const o = [...conns].find(q => q.member === m); if (o) o.member = null; }
  m.conn = c.conn; m.hidden = false; m.left = false; m.awaySince = 0; c.member = m;
  if (!room.host || isAway(room.host)) pickHost(room);
  sendLobby(room);  /* the lobby first, so the page knows its seat before it lays out the race */
  if (room.race) c.conn.send(startMsg(room));
}
function newMember(room, name) {
  const m = {id: nextId++, token: randomBytes(16).toString('hex'), name: '', seat: null, conn: null, hidden: false, awaySince: 0, left: false, room};
  m.name = uniqueName(room, cleanName(name), m);
  room.members.push(m);
  if (!room.host) room.host = m;
  return m;
}
function onMessage(c, msg) {
  if (msg.t === 'create') {
    if (rooms.size >= MAX_ROOMS) return fail(c, 'busy', 'The server is full right now. Try again in a few minutes.');
    detach(c, true);
    const room = newRoom(), m = newMember(room, msg.name);
    room.host = m;
    attach(c, room, m);
    return;
  }
  if (msg.t === 'join') {
    const room = rooms.get(String(msg.room || '').toUpperCase());
    if (!room) return fail(c, 'noroom', 'There is no room ' + String(msg.room || '').toUpperCase().slice(0, 8) + '. Check the code, or create a room.');
    const tok = typeof msg.token === 'string' ? msg.token : '';
    if (tok && room.banned.has(tok)) return fail(c, 'removed', 'The host removed you from this room.');
    let m = tok && room.members.find(q => q.token === tok);
    if (c.member && c.member !== m) detach(c, true);
    if (!m) {
      if (room.members.length >= MAX_MEMBERS) return fail(c, 'full', 'This room is full.');
      m = newMember(room, msg.name);
    } else if (msg.name && cleanName(msg.name) !== m.name) {
      m.name = uniqueName(room, cleanName(msg.name), m);
    }
    attach(c, room, m);
    return;
  }
  const m = c.member;
  if (!m) return;
  const room = m.room;
  if (msg.t === 'leave') {
    detach(c, true);
    c.conn.send({t: 'left'});
  } else if (msg.t === 'name') {
    if (room.race && m.seat !== null) return;  /* a racing lab keeps its name until the race ends */
    m.name = uniqueName(room, cleanName(msg.name), m);
    sendLobby(room);
  } else if (msg.t === 'vis') {
    m.hidden = !!msg.hidden;
    if (!m.hidden) m.awaySince = 0;
    sendLobby(room);
  } else if (msg.t === 'seat') {
    if (room.race) return;
    const s = msg.seat;
    if (s === null) { if (m.seat !== null) { room.seats[m.seat] = null; m.seat = null; } }
    else if (Number.isInteger(s) && s >= 0 && s < SEATS && !room.seats[s]) {
      if (m.seat !== null) room.seats[m.seat] = null;
      room.seats[s] = m; m.seat = s;
    }
    sendLobby(room);
  } else if (msg.t === 'free' || msg.t === 'remove') {
    /* host only, between races: Free seat moves a player to watching; Remove takes them out of the room for good */
    if (room.host !== m || room.race) return;
    const q = room.members.find(x => x.id === msg.id);
    if (!q || q === m) return;
    if (q.seat !== null) { room.seats[q.seat] = null; q.seat = null; }
    if (msg.t === 'remove') {
      room.banned.add(q.token);
      room.members = room.members.filter(x => x !== q);
      const qc = [...conns].find(x => x.member === q);
      if (qc) { qc.member = null; fail(qc, 'removed', 'The host removed you from this room.'); }
    }
    sendLobby(room);
  } else if (msg.t === 'opts') {
    if (room.race || m.seat === null) return;
    if ('chill' in msg) room.opts.chill = msg.chill ? 1 : 0;
    if ('bots' in msg) room.opts.bots = msg.bots ? 1 : 0;
    if ('seed' in msg) room.opts.seed = String(msg.seed || '').replace(/\D/g, '').slice(0, 10);
    sendLobby(room);
  } else if (msg.t === 'start') {
    if (m.seat !== null) startRace(room);
  } else if (msg.t === 'in') {
    const l = labOf(room, m);
    if (!l) return;
    const i = l.hs.input, w = Array.isArray(msg.w) ? msg.w : [];
    i.pace = num(msg.pace, 0, 1, i.pace);
    if (w.length === 3) i.w = w.map((v, k) => num(v, 0, 100, i.w[k]));
    i.rev = !!msg.rev; i.fwd = !!msg.fwd;
  } else if (msg.t === 'jump') {
    const l = labOf(room, m);
    if (l) l.hs.input.jump = true;
  }
}

/* ---------- HTTP: the page (marked as a multiplayer page), /health and the socket ---------- */
function originOK(req) {
  const o = req.headers.origin;
  if (!o) return true;  /* not a browser: test clients and tools */
  if (ORIGINS.has(o) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;
  if (arg('--tunnel') && /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(o)) return true;  /* the quick tunnel may not pass the Host header through */
  return o === 'http://' + req.headers.host || o === 'https://' + req.headers.host;  /* this server's own page, tunnel included */
}
const server = createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
    let html;
    try { html = readFileSync(pagePath, 'utf8'); } catch { res.writeHead(500); res.end('Could not read prototype.html'); return; }
    html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script>window.PF_MP=1;</script>');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(html);
    return;
  }
  if (req.method === 'GET' && path === '/health') {
    let races = 0; for (const r of rooms.values()) if (r.race) races++;
    res.writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'});
    res.end(JSON.stringify({ok: true, rooms: rooms.size, races, conns: conns.size}));
    return;
  }
  res.writeHead(404, {'Content-Type': 'text/plain'}); res.end('Not found');
});
server.on('upgrade', (req, socket) => {
  if ((req.url || '').split('?')[0] !== '/ws' || conns.size >= MAX_CONNS || !originOK(req)) { socket.destroy(); return; }
  wsAccept(req, socket, conn => {
    /* each connection may send about 60 messages a second, with bursts to 120; a flood closes it */
    const c = {conn, member: null, bucket: 120, at: Date.now(), dropped: 0};
    conns.add(c);
    conn.onmessage = msg => {
      const now = Date.now();
      c.bucket = Math.min(120, c.bucket + (now - c.at) * 0.06); c.at = now;
      if (c.bucket < 1) { if (++c.dropped > 600) conn.close(); return; }
      c.bucket--;
      onMessage(c, msg);
    };
    conn.onclose = () => { conns.delete(c); detach(c, false); };
    conn.send({t: 'hello'});
  });
});
/* Cloudflare closes idle sockets after about 100 s, so ping every 20 s */
setInterval(() => { for (const c of conns) c.conn.ping(); }, 20000);

server.listen(PORT, HOST, () => {
  console.log(`Pacing the Frontier multiplayer: http://localhost:${PORT}`);
  if (HOST === '0.0.0.0') console.log('Also listening on your local network (use this computer\'s IP address and the same port).');
  if (arg('--tunnel')) openTunnel();
  else console.log(`For friends elsewhere, restart with --tunnel (needs cloudflared), or run: cloudflared tunnel --url http://localhost:${PORT}`);
});

/* a Cloudflare quick tunnel: a temporary https link to this server that changes every time; no account needed */
function openTunnel() {
  let cf;
  try { cf = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], {stdio: ['ignore', 'pipe', 'pipe']}); }
  catch { console.log('Could not start cloudflared. Install it with: brew install cloudflared'); return; }
  let shown = false;
  const scan = d => {
    const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(d));
    if (m && !shown) { shown = true; console.log(`\nSend your friends this link: ${m[0]}\n`); }
  };
  cf.stdout.on('data', scan); cf.stderr.on('data', scan);
  cf.on('error', () => console.log('Could not start cloudflared. Install it with: brew install cloudflared'));
  cf.on('exit', c => { if (c) console.log('cloudflared stopped (exit ' + c + ').'); });
  const stop = () => { cf.kill(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
