/* How much of a hidden-width box's top the page draws as seen (Cole, 2026-11-17: the tick leaked the true width). seenW() stops at the
   box's real width, so when a rival's shadow hid the far edge the tick and the 'at least' label landed exactly on the true width. This is
   what the eye reaches with the same standing eye knowsWidth() uses, cut where the first shadow over the top begins. Page code: it only
   reads the simulation, so the stamp does not move. While the width is unknown it stays short of the far edge (check.mjs, part e). */
function seenShown(l,g){
  var d=g.x-l.x,eye=heightOf(l)+C.RW,sr=sightRange(l),sh,r,i;
  if(d<=0){ return 0; }
  if(d>sr||eye<=g.rise){ return 0; }
  r=Math.min((eye-g.rise)/C.SEEANG-d,sr-d); sh=shadows(l,1);
  for(i=0;i<sh.length;i++){ if(sh[i].b>d&&sh[i].a-d<r){ r=sh[i].a-d; } }
  return clamp(r,0,g.W);
}
