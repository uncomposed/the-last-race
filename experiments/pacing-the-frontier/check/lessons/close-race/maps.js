/* ---- close-race: A close race leaves no slack. ---- */
/* crRacer (a rival): cruises until it is 250 from the box face, then decides once: a box whose width it does not know, it floors (the gamble);
   one whose width it knows, it plans the run-up like Build */
SGP.crRacer=function(l,g,st){
  if(st.go===undefined&&g.x-l.x>250){ return sgInp(l.basePace,POL[l.kind].w); }
  if(st.go===undefined&&!knowsWidth(l,l.gi)){ st.go=true; }
  var late=sgLate(l,g,st); if(late){ return late; }  /* round 2: a racer that learns the width too late to stop goes, as the page's bots do */
  return st.go?sgInp(1,[20,50,30],{fwd:true}):sgPlanKnown(l,g,st);
};
NOPEEK.crRacer=1;
/* crRival (Footsteps' rival): a crRacer that pounces. When a lab ahead of it, in its sight, brakes hard or stands (under 35), it floors it at
   once, at the box or before it. A rival on your tail takes the moment you hesitate */
function crSlowAhead(l){ var i,o,sr=sightRange(l); for(i=0;i<G.labs.length;i++){ o=G.labs[i]; if(o!==l&&!o.out&&!o.done&&o.x>l.x&&o.x-l.x<sr&&o.x>60&&o.v<35){ return true; } } return false; }
SGC.crRival=function(l){ return crSlowAhead(l)?sgInp(1,[0,0,100],{fwd:true}):null; };
SGP.crRival=function(l,g,st){ if(crSlowAhead(l)){ st.go=true; } return SGP.crRacer(l,g,st); };
NOPEEK.crRival=1;
/* nearest rival behind l, as a distance */
function crBehind(l){ var m=Infinity,i,o; for(i=0;i<G.labs.length;i++){ o=G.labs[i]; if(o!==l&&!o.out&&!o.done&&o.x<l.x){ m=Math.min(m,l.x-o.x); } } return m; }
/* crLook (you): the careful lab, as quick as care gets. Width unknown: brake to stop about 180 short of the face (room for most of a run-up),
   fill height (the eye must clear the box top to see its far edge) and speed, then creep in until the far edge shows. Width known: plan the
   run-up as Build does (sgPlanKnown: fill speed, back up if short of room, go) */
SGP.crLook=function(l,g,st){
  if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown(l,g,st); }
  var d=g.x-l.x,full=l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01;
  if(!full){ var vs=Math.sqrt(2*C.DEC*Math.max(d-180,0)); return sgInp(Math.min(l.basePace,vs/Math.max(topSpeed(l),1)),[0,50,50]); }
  if(d<=8){ return sgInp(0,[0,0,100]); }
  var vmax=Math.sqrt(2*C.DEC*Math.max(d-8,1)); return sgInp(Math.min(0.3,vmax/Math.max(topSpeed(l),1)),[0,0,100]);
};
/* crPrep (you): stop and build, then go. Brake to stop about 180 short of the face while filling height and speed, stand until both are at
   the ceiling, back up if it stopped short of the run-up top speed needs, then floor it. It never needs to see the far edge: a full lab
   clears or scrapes every box Footsteps draws */
SGP.crPrep=function(l,g,st,stopAt){
  var sa=stopAt||180,d=g.x-l.x,full=l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01;
  if(st.go){ return sgInp(1,[20,50,30],{fwd:true}); }
  var late=sgLate(l,g,st); if(late){ return late; }
  if(full){ var tm=C.TOP0+0.85*l.cap; if(d<tm*tm/(2*accOf(l)*0.9)+15&&l.x>backLimit(l)+2){ return sgInp(0,[0,0,100],{rev:true}); } st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  var vs=Math.sqrt(2*C.DEC*Math.max(d-sa,0)); return sgInp(Math.min(l.basePace,vs/Math.max(topSpeed(l),1)),[0,50,50]);
};
/* crGo (you): go now. Keep running and put everything into speed, floor it once speed is at the ceiling (as adv-s-go does) */
SGP.crGo=function(l,g,st){ return sgInp(1,[0,0,100]); };  /* at the box: floor it, still putting what it can into speed */
SGC.crGo=function(l){ return advCruise(l,[0,0,100]); };
NOPEEK.crGo=1;
/* crMirror (you): check the mirror. While cruising, a rival within 200 behind means go: build speed as crGo does (otherwise the page's own
   cruise). When the box comes into view, decide once: a rival within 200 behind, go now (crGo); otherwise stop and build (crPrep) */
SGC.crMirror=function(l){ return crBehind(l)<200?advCruise(l,[0,0,100]):null; };
SGP.crMirror=function(l,g,st){
  if(st.close===undefined){ st.close=crBehind(l)<200; }
  return st.close?SGP.crGo(l,g,st):SGP.crPrep(l,g,st);
};

LESSONS.push({key:'close-footsteps',lesson:'A close race leaves no slack',title:'Footsteps',strategy:'crMirror',
  q:'A rival as strong as you can get is behind you: sometimes on your tail, sometimes far back. The box ahead could be any width, and the finish is just past it. Do you stop to look?',
  meta:'A lead is time you can spend on safety. A rival on your tail takes that time away, and the race makes the gamble the winning move.',
  look:'Racer is fully built and floors it at any box it cannot size, and it gets across. Stop with Racer far back and you can look and still cross first. Stop with Racer on your tail and it goes in ahead of you, and the finish is too close to catch it.',
  labs:[{x:0,pts:[50,50,40]},RIV('crRival','Racer',-60,[50,70,70],{pace:0.55})],
  /* the variant moves Racer: track(r) runs before the labs are placed (segScen, then segPost), so it can set where Racer starts */
  track:function(r){ var close=r()<0.5,wide=r()<0.5,far=900; this.labs[1].x=close?-60:-far;
    var g=segBox(520,49,wide?1.19+0.05*r():0.97+0.13*r(),{odds:40});
    return {bars:[],gaps:[g],finish:g.x+g.W+100,note:(close?'Racer starts on your tail (60 back). ':'Racer starts far back ('+far+'). ')+'The box: '+segSay(g,70)+' Falls roll 40%.'}; },
  postures:['crMirror','rush','crLook','adv-hs-wait','maxout'],
  claim:{text:'Checking the mirror wins at least 15 points more than the best of rushing, looking, waiting and max-out', score:function(t){ return t.crMirror.win-Math.max(t.rush.win,t.crLook.win,t['adv-hs-wait'].win,t.maxout.win); }, need:15}});

/* crDash (a pack rival): cruises until it is 250 from the box face, then floors it, whatever it knows. The racer that never stops */
SGP.crDash=function(l,g,st){ if(!st.go&&g.x-l.x>250){ return sgInp(l.basePace,POL[l.kind].w); } st.go=true; return sgInp(1,[0,0,100],{fwd:true}); };
NOPEEK.crDash=1;
/* crPlant (you), round 2: pull up inside the box's edge zone (the sim plants a stopped lab's wall only within 260 of the face) as soon as the
   box is seen, building height as you brake; stand a moment and roll forward a touch: that leaves a wall of your height at the edge
   (installBarrier: one wall per lab per box, at the height you have when you first move off). Then stand there and fill height and speed,
   and floor it from where you are: 230 is room enough to reach top speed */
SGP.crPlant=function(l,g,st){
  var d=g.x-l.x,top=Math.max(topSpeed(l),1),full=l.pts[1]>=l.cap-0.01&&l.pts[2]>=l.cap-0.01;
  if(!st.planted){
    if(l.stepDone[l.gi]){ st.planted=true; }
    else if(st.nudge||(l.still>=0.35&&d<=255)){ st.nudge=true; return sgInp(0.1,[0,100,0]); }
    else { var vs=Math.sqrt(2*C.DEC*Math.max(d-230,0)); return sgInp(Math.min(l.basePace,vs/top),[0,100,0]); }
  }
  if(st.go||full){ st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return sgInp(0,l.pts[1]<l.cap-0.01?[0,100,0]:[0,0,100]);
};

LESSONS.push({key:'close-wall',lesson:'A close race leaves no slack',title:'The Leader’s Wall',strategy:'crPlant',
  q:'Three racers are on your heels. They spent everything on speed and floor it at any box. A tall box is ahead, too wide to cross without building. Where do you stop?',
  meta:'Nobody can stop alone, unless they lead. A leader that pulls up at the very edge leaves a wall the pack cannot jump; one that stops back where the box first shows holds nobody.',
  look:'A lab that stops within 260 of a box face leaves a wall of its own height at the edge when it moves off again. The racers are short: they cannot jump a wall as tall as you. Stop back at 280 and they stream past you and gamble.',
  labs:[{x:0,pts:[70,45,25]},RIV('crDash','Racer 1',-260,[20,5,50],{pace:0.9,w:[10,5,85]}),RIV('crDash','Racer 2',-275,[20,5,50],{pace:0.9,w:[10,5,85]}),RIV('crDash','Racer 3',-290,[20,5,50],{pace:0.9,w:[10,5,85]})],
  track:function(r){ var g=segBox(450,56,0.92+0.13*r(),{odds:40});
    return {bars:[],gaps:[g],finish:g.x+g.W+200,note:'The box: '+segSay(g,70)+' Falls roll 40%.'}; },
  postures:['crPlant','build','adv-hs-wait','rush','maxout'],
  claim:{text:'Pulling up at the edge wins at least 15 points more than the best of stopping back, waiting, rushing and max-out', score:function(t){ return t.crPlant.win-Math.max(t.build.win,t['adv-hs-wait'].win,t.rush.win,t.maxout.win); }, need:15}});

/* crPacer (Spend It Once's racers): competent, not reckless. At a cheap box (falls roll 10% or less) it cruises to 250 from the face and
   floors it; at a dear box it stops and builds, as crPrep does. The same line the lesson asks of you */
SGP.crPacer=function(l,g,st){
  if(g.odds<=10){ if(!st.go&&g.x-l.x>250){ return sgInp(l.basePace,POL[l.kind].w); } st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  return SGP.crPrep(l,g,st,275);
};
NOPEEK.crPacer=1;
/* crSpend (you): spend the lead once. At a cheap box (falls roll 10% or less) floor it without looking; at the dear box stop, build, go (crPrep) */
SGP.crSpend=function(l,g,st){ return g.odds<=10?sgInp(1,[20,50,30],{fwd:true}):SGP.crPrep(l,g,st,275); };
NOPEEK.crSpend=1;

LESSONS.push({key:'close-spend',lesson:'A close race leaves no slack',title:'Spend It Once',strategy:'crSpend',
  q:'You start ahead of two racers who know their business: they race the cheap box and stop to build at the dear one. Falling into box 1 rolls 5%; falling into box 2 rolls 40%. Your lead buys one stop. Where do you spend it?',
  meta:'A lead is slack, and slack runs out. Spend it where a fall would cost the world, and race where it would not. Spend it twice and the pack is past you.',
  look:'Box 1 is narrow: a lab at cruising speed clears it without looking. Box 2 is wide and tall: only a lab that stops to fill height and speed gets across, and even it scrapes. The racers start 1050 back and catch up fast: labs far behind build up to three times quicker.',
  labs:[{x:0,pts:[30,50,40]},RIV('crPacer','Racer 1',-1050,[30,50,50],{pace:0.8,w:[0,50,50]}),RIV('crPacer','Racer 2',-1050-15,[30,50,50],{pace:0.8,w:[0,50,50]})],
  track:function(r){ var g1=segBox(450,49,0.66+0.08*r(),{odds:5}),x2=g1.x+g1.W+600,g2=segBox(x2,56,1.18+0.08*r(),{odds:40,cap:90}); g1.pub=true; g2.pub=true;
    return {bars:[],gaps:[g1,g2],finish:g2.x+g2.W+150,note:'Box 1: '+segSay(g1,70)+' Falls roll 5%. Box 2: '+segSay(g2,90)+' Falls roll 40%.'}; },
  postures:['crSpend','adv-hs-wait','build','rush','maxout'],
  claim:{text:'Racing the cheap box and stopping once at the dear one wins at least 15 points more than waiting, building at both, rushing both or max-out', score:function(t){ return t.crSpend.win-Math.max(t['adv-hs-wait'].win,t.build.win,t.rush.win,t.maxout.win); }, need:15}});
