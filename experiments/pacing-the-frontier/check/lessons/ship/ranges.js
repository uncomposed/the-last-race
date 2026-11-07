/* [[ai gen]] Daily generator, step 1 (issue 36): the numbers a generated daily may change on the three maps Cole played and approved, as narrow ranges
   around the shipped values in maps.js. A path names a number inside the map's P ('gap.0' is P.gap[0]); [lo, hi] is drawn evenly, [lo, hi, 1] as a whole number.
   Anything not listed keeps its shipped value. The shipped value sits inside every range. Pairs that must stay ordered (gap.0 < gap.1, fence h1 < h2) are kept
   apart by the ranges themselves. Used only by gen.mjs, which bakes accepted candidates into gen-days.js; the page never draws from these.
   Not changed on purpose: the rivals' meters and strategies, which carry each map's character, and the box counts named in a map's debrief line. */
var SHIP_RANGES = {
  /* Elbows: tiny boxes, three labs at your elbow, one pothole somewhere. Shipped: n 11, gap 130-250, W 26-44, pot 72-84, odds 10, rival pace .85/.85/.88 */
  'elbows': {
    'n': [10, 12, 1],
    'gap.0': [120, 140], 'gap.1': [230, 265],
    'W.0': [24, 28], 'W.1': [40, 46],
    'pot.0': [68, 76], 'pot.1': [80, 88],
    'odds': [8, 12, 1],
    'rivals.0.pace': [0.82, 0.88], 'rivals.1.pace': [0.82, 0.88], 'rivals.2.pace': [0.85, 0.91]
  },
  /* The Ladder: six steps up, each ceiling higher for whoever gets there first. Shipped: rise0 18, step 16-24, gap 340-420, W 50-70, capStep 32, odds 20,
     Climber 50 ahead. n stays 6: the debrief says "Six steps". Cole liked that it has no barriers, so none are added. */
  'ladder': {
    'rise0': [14, 22],
    'step.0': [14, 18], 'step.1': [22, 26],
    'gap.0': [320, 360], 'gap.1': [400, 440],
    'W.0': [46, 54], 'W.1': [66, 74],
    'capStep': [28, 36],
    'odds': [16, 24, 1],
    'rivals.0.x': [30, 70, 1]
  },
  /* Two Endings: you lead into a tall box nobody can see past; behind it the cellar holds or breaks, a coin each race (pBad stays 0.5).
     Shipped: a.rise 30, a.gap 380, a.f .55, fence 100 then 114 with 240 between, ex.rise 70, ex.f1 .85, ex.f2 .7, tower 160 rise 56 wide,
     strip 340, cellar ok 40/60, bad 200/170, Follower 640 back, after 320 */
  'two-endings': {
    'a.rise': [26, 34], 'a.gap': [350, 410], 'a.f': [0.5, 0.6],
    'fence.h1': [95, 104, 1], 'fence.h2': [110, 118, 1], 'fence.gap': [220, 260],
    'ex.rise': [64, 76], 'ex.f1': [0.8, 0.9], 'ex.f2': [0.65, 0.75],
    'tower.rise': [150, 170], 'tower.W': [52, 60],
    'strip': [310, 370],
    'cellar.ok.W': [54, 66], 'cellar.bad.rise': [185, 215], 'cellar.bad.W': [160, 180],
    'rivals.0.x': [-680, -600, 1],
    'after': [300, 340]
  }
};
