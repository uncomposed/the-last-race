// Proposed CAMPAIGN for step gaps (CAMP_STEPS=true). Bot-play backtest only; see campaign.md. Status: implemented + verified in the
// harness, NOT validated in the page or by Cole. Not applied to prototype.html.
// boxes: per-gap {t,w} overrides (index = gap index, inner gaps included; null = keep the generated box). An override also clears nowarn.
// Tier order was changed on maps 1, 3, 6 and 8 to follow held-out difficulty (probe mean per tier); that reassigns existing stars on those maps.
// Track labels ("wide, low boxes" etc.) are computed before overrides and are stale on maps 1, 4, 7 and 9; the page should label from the final boxes.
var CAMPAIGN=[
  {seed:1823,was:[114],name:'Build First',theme:'climber',steps:1,
   boxes:[{t:0.83,w:0.02},{t:0.96,w:0.02},{t:0.85,w:0},{t:0.97,w:0.01},{t:0.92,w:0},{t:0.85,w:0.06},null],
   hint:'Six narrow boxes, each taller than the last. Building height before you reach them works well here.',
   tiers:[['steward','gambler'],['sprinter','steward'],['steward']]},
  {seed:1784,name:'The Long Climb',theme:'climber',steps:1,
   boxes:[null,{t:0.5,w:0.4},null],
   hint:'A row of tall walls waits just past the singularity. Building height early works well here.',
   tiers:[['steward'],['steward','gambler'],['sprinter','steward','gambler']]},
  {seed:676,was:[1167],name:'Coin Toss',theme:'gamble',steps:1,
   boxes:[{t:1,w:0},{t:1,w:0},null],
   hint:'Two tall, narrow boxes, then six tall walls past the singularity. Careful costs more than it saves.',
   tiers:[['steward'],['steward','gambler'],['sprinter','steward','gambler']]},
  {seed:717,name:'Fog Line',theme:'scout',steps:1,
   boxes:[{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.85,w:0.75},{t:0.2,w:0}],
   hint:'A tall wall late, and a wide gap hidden behind it. Sight pays off here.',
   tiers:[['steward'],['sprinter','steward','gambler'],['steward','gambler']]},
  {seed:2972,name:'Even Keel',theme:'balanced',steps:1,
   boxes:[{t:0.15,w:0.8},{t:0.9,w:0.05},null,null],
   hint:'Short and steady, with a wide gap right after the singularity. A balanced split works well, and so can a bolder one.',
   tiers:[['steward'],['steward','gambler'],['sprinter','steward']]},
  {seed:625,was:[1548,698],name:'Nerve',theme:'bold',steps:1,
   hint:'Two narrow boxes and an early singularity. Taking the lead and keeping it works well here.',
   tiers:[['steward'],['sprinter','steward'],['steward','gambler']]},
  {seed:2565,was:[1115,1531],name:'Dive',theme:'rush',steps:1,
   boxes:[{t:1,w:0},{t:1,w:0},null],
   hint:'Two tall, narrow boxes before the singularity. Diving through at full speed works well here.',
   tiers:[['steward'],['sprinter','steward'],['sprinter','steward','gambler']]},
  {seed:23,was:[322],name:'Slipstream',theme:'follower',steps:1,
   hint:'Two narrow boxes, a wide singularity, then two more boxes past it. Following the pack, then passing, works well here.',
   tiers:[['sprinter','steward','gambler'],['sprinter','steward'],['steward','gambler']]},
  {seed:2785,was:[199],name:'Sheer Face',theme:'climber (harder)',steps:1,
   boxes:[{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.2,w:0},{t:0.85,w:0.75}],
   hint:'A long staircase of walls and low boxes, the tallest walls last, and a wide singularity late. Height matters here, and so does sight.',
   tiers:[['steward'],['sprinter','steward'],['sprinter','steward','gambler']]}
];
