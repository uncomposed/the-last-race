// The ten round 2 lesson maps (check/lessons/*/maps.js) as plain numbers for segmath.mjs. Transcribed by hand, 2026-11-02.
// pts are [sight, height, speed], as in the sim. Each map is reduced to the box its lesson is about (`box`), with the width
// variants its track() draws; `after` is how far past the box's far edge the segment ends (finish or next obstacle) (f is the share of a full lab's clean reach, as segBox uses; a range is given by its two ends).
// Rival postures are reduced to three (segmath.mjs, rival()): go, dash, stop. What a reduction leaves out is in `left`.
const v2 = (p, a, b, f0, f1) => [{p: [p / 2, a], f: f0}, {p: [p / 2, b], f: f1}];  // a variant drawn from a range, as its two ends

export const MAPS = [
  {key: 'close-footsteps', after: 100, title: 'Footsteps', you: {pts: [50, 50, 40]},
    boxes: [{x: 520, R: 49, variants: [...v2(0.25, 'close, normal', 'close, normal', 0.97, 1.10), ...v2(0.25, 'close, wide', 'close, wide', 1.19, 1.24),
      ...v2(0.25, 'far, normal', 'far, normal', 0.97, 1.10), ...v2(0.25, 'far, wide', 'far, wide', 1.19, 1.24)].map(v => v.p[1].startsWith('far') ? {...v, rx: {Racer: -900}} : v)}],
    rivals: [{name: 'Racer', x: -60, pts: [50, 70, 70], pace: 0.55, w: [20, 50, 30], post: 'dash'}],
    left: 'Racer pounces (floors it at once) the moment you slow in its sight; here it floors from 250 out.'},
  {key: 'close-wall', after: 200, title: 'The Leader’s Wall', you: {pts: [70, 45, 25]},
    boxes: [{x: 450, R: 56, variants: v2(1, 'narrow end', 'wide end', 0.92, 1.05)}],
    rivals: [-260, -275, -290].map((x, i) => ({name: 'Racer ' + (i + 1), x, pts: [20, 5, 50], pace: 0.9, w: [10, 5, 85], post: 'dash'})),
    left: 'The wall a stopped leader leaves at the edge, which is the lesson.'},
  {key: 'close-spend', after: 150, title: 'Spend It Once', you: {pts: [30, 50, 40]}, box: 1,
    boxes: [{x: 450, R: 49, variants: v2(1, 'box 1', 'box 1', 0.66, 0.74)},
      {x: 1095, R: 56, cap: 90, variants: v2(1, 'box 2, narrow end', 'box 2, wide end', 1.18, 1.26)}],
    rivals: [-1050, -1065].map((x, i) => ({name: 'Racer ' + (i + 1), x, pts: [30, 50, 50], pace: 0.8, w: [0, 50, 50], post: 'stop', s: 275})),
    left: 'Box 1 (cheap, everyone races it) is treated as free road; caps are taken as 90 at box 2.'},
  {key: 'see-early-brake', after: 120, title: 'Too Late to Brake', you: {pts: [25, 30, 40]},
    boxes: [{x: 600, R: 30, variants: [{p: [0.5, 'narrow'], f: 0.7}, ...v2(0.5, 'wide', 'wide', 1.07, 1.12)]}],
    rivals: [{name: 'Looker', x: -200, pts: [25, 30, 40], pace: 0.6, w: [0, 100, 0], post: 'stop', s: 162},
      {name: 'Rush', x: -300, pts: [25, 30, 40], pace: 0.6, w: [0, 0, 100], post: 'go'}],
    left: 'The painted line 150 before the box (no backing up past it).'},
  {key: 'see-early-bravo', after: 200, title: 'The Box Behind the Box', you: {pts: [20, 50, 40]}, box: 1,
    boxes: [{x: 500, R: 30, variants: [{p: [1, 'box 1'], f: 0.55}]},
      {x: 618, R: 30, variants: [{p: [0.5, 'narrow second box'], f: 0.7}, ...v2(0.5, 'wide second box', 'wide second box', 1.04, 1.10)]}],
    rivals: [{name: 'Build', x: -150, post: 'stop', s: 298}, {name: 'Wait', x: -170, post: 'stop', s: 298}, {name: 'Rush', x: -250, post: 'go'}]
      .map(r => ({pts: [20, 50, 40], pace: 0.7, w: [0, 100, 0], ...r})),
    left: 'Box 1 (48 wide, 70 before box 2) is treated as road; stopping rivals stand 180 before box 1. You cannot stop between the boxes.'},
  {key: 'see-early-pack', after: 200, title: 'The Pack Dives Together', you: {pts: [5, 50, 40]},
    boxes: [{x: 1400, R: 30, variants: [{p: [0.5, 'narrow'], f: 0.7}, ...v2(0.5, 'wide', 'wide', 1.04, 1.10)]}],
    rivals: [{name: 'Lead', x: 40}, {name: 'Tail 1', x: -30}, {name: 'Tail 2', x: -60}].map(r => ({pts: [5, 50, 40], pace: 0.8, w: [0, 100, 0], post: 'stop', ...r})),
    left: 'Sight shadows: the Lead hides the box from everyone behind it, which is the lesson.'},
  {key: 'sr-landing', after: 300, title: 'Still in the Air', you: {pts: [20, 70, 60]},
    boxes: [{x: 342, R: 58, variants: [{p: [0.5, 'box 1, 15 wide'], W: 15}, {p: [0.5, 'box 1, 30 wide'], W: 30}]}],
    rivals: [{name: 'Rush', x: -12, pace: 1, post: 'go'}, {name: 'Steady', x: -24, pace: 0.85, post: 'go'}].map(r => ({pts: [20, 70, 60], w: [20, 50, 30], ...r})),
    left: 'A barrier 38 to 46 before each box: landing from the barrier jump inside the box, which is the lesson. Four pairs; box 1 shown.'},
  {key: 'sr-odds', after: 420, title: 'Six Unknown Boxes', you: {pts: [30, 40, 50]},
    boxes: [{x: 330, R: 45, variants: [...v2(0.8, 'narrow', 'narrow', 0.70, 0.78), ...v2(0.2, 'wide', 'wide', 0.95, 0.98)]}],
    rivals: [{name: 'Careful', x: -60, pts: [10, 50, 70], s: 15}, {name: 'Build', x: -90, pts: [10, 50, 70]}].map(r => ({pace: 0.7, w: [40, 60, 0], post: 'stop', ...r})),
    left: 'Six boxes in a row, each wide with chance 0.2; box 1 shown. The lesson is the sum of six small risks.'},
  {key: 'sr-lastbox', after: 300, title: 'The Last Box', you: {pts: [20, 70, 60]},
    boxes: [{x: 342, R: 58, variants: [{p: [0.5, 'box 1, 15 wide'], W: 15}, {p: [0.5, 'box 1, 30 wide'], W: 30}]}],
    rivals: [{name: 'Careful', x: 40, pts: [20, 70, 70], pace: 1, post: 'go'}, {name: 'Rush', x: -12, pts: [20, 70, 60], pace: 1, post: 'go'}].map(r => ({w: [20, 50, 30], ...r})),
    left: 'The last wide box after four barrier and box pairs, where the lesson is whether a scrape is worth a strike. Box 1 shown.'},
  {key: 'steward-minefield', after: 520, title: 'The Minefield', you: {pts: [20, 50, 30]},
    boxes: [{x: 420, R: 42, variants: [...v2(0.4, 'narrow', 'narrow', 0.6, 0.8), ...v2(0.6, 'wide', 'wide', 1.02, 1.10)]}],
    rivals: [{name: 'Rush A', x: 40, pts: [15, 35, 45], pace: 0.85, w: [10, 20, 70], post: 'go'}, {name: 'Rush B', x: 20, pts: [15, 35, 45], pace: 0.85, w: [10, 20, 70], post: 'go'},
      {name: 'Eager', x: -60, pts: [20, 50, 30], pace: 0.7, w: [20, 50, 30], post: 'stop'}],
    left: 'Three boxes with a barrier 220 before each; box 1 shown. The rushers ahead hide the road.'}
];
