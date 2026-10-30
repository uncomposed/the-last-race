// Hand-written scenario tracks. Feature box = gap index 2 (level 2, cap 115) unless noted. Base: 4 boxes, rise .55 cap, width .8 of the stop-and-build fit.
const base = () => ({segs: [{}, {}, {}, {rise: 0.9, wf: 0.9}]});
const f = (o, k = 2) => { const s = base(); Object.assign(s.segs[k], o); return s; };
export const SPECS = {
  base: base(),
  longLow: f({rise: 0.4, wf: 1.6}),
  longLowNoRun: f({rise: 0.4, W: 126, runup: 45, bars: [0.75, 0.85, 0.9]}),
  longMid: f({rise: 0.7, wf: 1.3}),
  tallNarrow: f({rise: 0.975, wf: 0.5}),
  tallWide: f({rise: 0.975, wf: 1.15}),
  pitNowarn: f({rise: 0.3, wf: 2.2, nowarn: true}),
  barBefore: f({rise: 0.55, W: 80, barAt: 30, barH: 1.25}),
  pairClose: (() => { const s = base(); s.segs.splice(3, 0, {L: 10, bars: [], runup: 50, rise: 0.95, wf: 1.0}); Object.assign(s.segs[2], {rise: 0.9}); return s; })(),
  longSing: (() => { const s = base(); s.segs[3] = {rise: 0.9, wf: 1.3}; return s; })(),
  singShortRun: (() => { const s = base(); s.segs[3] = {rise: 0.9, wf: 1.0, runup: 60}; return s; })(),
  mixed: {segs: [{rise: 0.95, wf: 0.4}, {rise: 0.4, wf: 1.6}, {rise: 0.975, wf: 1.1}, {rise: 0.9, wf: 0.9}]},
  speedBox: f({rise: 0.45, W: 150}),
  speedBoxRoom: f({rise: 0.45, W: 150, runup: 420}),
  barMild: f({barAt: 70, barH: 1.1}),
  longLowStrikeFree: f({rise: 0.4, wf: 1.6}),
};
export const OPTS = {longLowStrikeFree: {knobs: {strikeGap: 0}}};
for (const k of ['base', 'tallNarrow', 'tallWide', 'longMid', 'mixed']) { SPECS[k + 'Spill10'] = SPECS[k]; OPTS[k + 'Spill10'] = {knobs: {spill: 10}}; }
