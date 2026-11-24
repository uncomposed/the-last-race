// The daily gate: a day's dice count only if the map's own lesson strategy (m.strategy) wins on them, so the lesson is the winning line that day.
// [[ai gen]] Each date's dice start as FNV-1a of the date (the old rule). Where the lesson strategy loses, it tries FNV-1a of 'date#1', 'date#2', ...
// and keeps the first that passes. Those replacements are the only entries in daily-dice.js, which the page and the board's server both read.
// Dates before today (UTC) are never rewritten: a published day keeps its dice and its board.
// Bots only. A pass shows one scripted line wins on those dice. It does not show a person can find it, or that it is fun.
//   node daily-dice.mjs --to 2027-12-31        search from today to that date and rewrite daily-dice.js (build game.html first)
//   node daily-dice.mjs --check [days]          exit 1 unless every date from today for that many days (default 14) passes, and the table reaches 60 days ahead
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), FILE = join(HERE, 'daily-dice.js');

export const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
export const dayAdd = (date, n) => new Date(Date.parse(date + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
export const today = () => new Date().toISOString().slice(0, 10);

// the table as the page holds it: one line `var DAILY_DICE_TO='...',DAILY_DICE={...};`
export function readTable() {
  const line = readFileSync(FILE, 'utf8').split('\n').find(l => l.startsWith('var DAILY_DICE_TO='));
  if (!line) throw new Error('daily-dice.js has no DAILY_DICE line');
  return new Function(line + '\nreturn {to: DAILY_DICE_TO, dice: DAILY_DICE};')();
}

// the shipped page's simulation, and the page's own daily rule (gmDailyOf) fed the table
export function loadGame(table = readTable()) {
  const L = readFileSync(join(HERE, 'game.html'), 'utf8').split('\n');
  const A = L.findIndex(l => l.startsWith('function $(id)')), B = L.findIndex(l => l.startsWith('window.PF={'));
  if (A < 0 || B < A) throw new Error('simulation section not found in game.html');
  const PF = new Function('window', 'document', L.slice(A, B + 1).join('\n') + '\nreturn window;')({}, null).PF;
  const fn = readFileSync(join(HERE, 'game.js'), 'utf8').match(/^function gmDailyOf\(date\)\{.*$/m)[0];
  const daily = PF.SEGS.filter(m => m.daily), K0 = JSON.parse(JSON.stringify(PF.K));
  const dailyOf = new Function('gmDailyMaps', 'DAILY_DICE', fn + '\nreturn gmDailyOf;')(() => daily, table.dice);
  // the map's lesson strategy drives lab 0 on these dice. Track, dice and rivals do not depend on lab 0 being a bot (newGame), so this is the player's race
  function lessonWins(map, seed) {
    for (const k in PF.K) delete PF.K[k]; Object.assign(PF.K, K0); PF.K.stepGaps = 1; PF.K.chill = 1;
    PF.KINDS.probe = {name: 'You', col: 'a', w: [0.2, 0.5, 0.3]}; PF.SKILL.probe = 100;
    PF.segUse(PF.SEGS.indexOf(map) + 1, map.strategy); PF.newGame(seed, 'probe');
    const G = PF.G(), me = G.labs.find(l => l.id === 0); let g = 0;
    while (!G.over && g++ < 60000) PF.step(1 / 60);
    return G.result?.type === 'win' && G.result.winner === me;
  }
  return {PF, daily, dailyOf, lessonWins};
}

function write(to, dice) {
  const keys = Object.keys(dice).sort(), obj = '{' + keys.map(k => JSON.stringify(k) + ':' + dice[k]).join(',') + '}';
  writeFileSync(FILE, '/* ---------- daily dice: dates whose date-made dice the map\'s lesson strategy loses on, and the dice used instead (daily-dice.mjs writes this; do not edit by hand).\n' +
    '   Any date not listed uses FNV-1a of the date. The board\'s server reads the same line. Searched up to DAILY_DICE_TO. ---------- */\n' +
    'var DAILY_DICE_TO=' + JSON.stringify(to) + ',DAILY_DICE=' + obj + ';\n');
}

const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i < 0 ? null : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : ''); };
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (arg('--to') !== null) {
    const to = arg('--to'), from = today(), old = readTable(), dice = {};
    for (const d in old.dice) if (d < from) dice[d] = old.dice[d];  // the past stays as published
    const {dailyOf, lessonWins} = loadGame({to, dice: {}});
    let n = 0, moved = 0;
    for (let date = from; date <= to; date = dayAdd(date, 1), n++) {
      const D = dailyOf(date);
      if (lessonWins(D.map, D.seed)) continue;
      let k = 1; while (k <= 50 && !lessonWins(D.map, fnv(date + '#' + k))) k++;
      if (k > 50) { console.error(date + ' ' + D.map.key + ': no dice in 50 tries let the lesson strategy win'); process.exit(1); }
      dice[date] = fnv(date + '#' + k); moved++;
      console.log(date + ' ' + D.map.key.padEnd(13) + ' date dice lose; dice #' + k + ' pass');
    }
    write(to, dice);
    console.log(n + ' dates searched, ' + moved + ' given new dice, table to ' + to);
  } else if (arg('--check') !== null) {
    const days = +(arg('--check') || 14), table = readTable(), t0 = today(), fails = [];
    if (table.to < dayAdd(t0, 60)) fails.push('the table only reaches ' + table.to + ': run node daily-dice.mjs --to <a later date>');
    const {dailyOf, lessonWins} = loadGame(table);
    for (let i = 0; i < days; i++) { const date = dayAdd(t0, i), D = dailyOf(date); if (!lessonWins(D.map, D.seed)) fails.push(date + ' ' + D.map.key + ': the lesson strategy loses on that day\'s dice'); }
    fails.forEach(f => console.log('FAIL ' + f));
    if (fails.length) process.exit(1);
    console.log('ok: the lesson strategy wins every daily from ' + t0 + ' for ' + days + ' days; table to ' + table.to);
  } else { console.error('usage: node daily-dice.mjs --to YYYY-MM-DD | --check [days]'); process.exit(1); }
}
