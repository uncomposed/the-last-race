// Code-path check for crashTower: when a lab leaves a barrier before a box, knock every non-careful lab still behind it down to zero height,
// then see whether the tower branch (prototype.html stepLab, `l.st.tc++`) fires. Proves the counter is live, not that the situation is natural.
import {PF, PFX, K, C} from '../../steps-bt.mjs';
const K0 = JSON.parse(JSON.stringify(K)); let forced = 0, crashes = 0, events = 0;
for (let s = 0; s < 300; s++) {
  Object.assign(K, K0, {stepGaps: 1, chill: 1}); PF.newGame(s, 'custom', null); const G = PF.G(); let guard = 0;
  while (!G.over && guard++ < 20000) {
    const before = G.gaps.map(g => g.stepH || 0); PF.step(1 / 30);
    G.gaps.forEach((g, k) => { if ((g.stepH || 0) > before[k]) for (const m of G.labs) if (!m.out && m.x < PFX.stepX(g) && !m.stepDone[k] && m.gi === k) { m.pts[1] = 0; forced++; } });
  }
  crashes += G.labs.reduce((a, l) => a + l.st.tc, 0); events += G.ev.filter(e => e.type === 'crash' && e.what === 'tower').length;
}
Object.assign(K, K0);
console.log(JSON.stringify({forcedLabs: forced, towerCrashes: crashes, towerCrashEvents: events}));
