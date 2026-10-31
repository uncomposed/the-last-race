/* ---- close-race: A close race leaves no slack. ---- */
/* crRacer (a rival): cruises until it is 250 from the box face, then decides once: a box whose width it does not know, it floors (the gamble);
   one whose width it knows, it plans the run-up like Build */
SGP.crRacer=function(l,g,st){
  if(st.go===undefined&&g.x-l.x>250){ return sgInp(l.basePace,POL[l.kind].w); }
  if(st.go===undefined&&!knowsWidth(l,l.gi)){ st.go=true; }
  return st.go?sgInp(1,[20,50,30],{fwd:true}):sgPlanKnown(l,g,st);
};
NOPEEK.crRacer=1;
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
/* crMirror (you): look in the mirror once, when the box comes into view. A rival within 200 behind: rush. Otherwise: look */
SGP.crMirror=function(l,g,st){
  if(st.close===undefined){ st.close=crBehind(l)<200; }
  return st.close?SGP.rush(l,g,st):SGP.crLook(l,g,st);
};

LESSONS.push({key:'close-footsteps',lesson:'A close race leaves no slack',title:'Footsteps',
  q:'A rival races behind you. Sometimes it is right on your tail, sometimes far back. The box ahead could be any width. Do you stop to look?',
  meta:'A lead is time you can spend on safety. A rival on your tail takes that time away.',
  look:'Racer floors it at any box it cannot size. Stop with Racer far back and you can look and still cross first. Stop with Racer on your tail and it goes in ahead of you.',
  labs:[{x:0,pts:[30,50,40]},RIV('crRacer','Racer',-20,[30,50,40])],
  /* the variant moves Racer: track(r) runs before the labs are placed (segScen, then segPost), so it can set where Racer starts */
  track:function(r){ var close=r()<0.5,wide=r()<0.35,far=1000; this.labs[1].x=close?-20:-far;
    var g=segBox(520,49,wide?1.19+0.05*r():0.97+0.13*r(),{odds:40});
    return {bars:[],gaps:[g],finish:g.x+g.W+200,note:(close?'Racer starts on your tail (20 back). ':'Racer starts far back ('+far+'). ')+'The box: '+segSay(g,70)+' Falls roll 40%.'}; },
  postures:['rush','crLook','crMirror'],
  claim:{text:'Checking the mirror wins most: it looks when Racer is far and rushes when it is close', score:function(t){ return t.crMirror.win-Math.max(t.rush.win,t.crLook.win); }, need:10}});

/* crPlant (you): stop about 230 short of the face, stand a moment, then ease forward: the stop leaves a barrier of your height at the box
   edge (installBarrier), before you have looked. Then look and cross as crLook does */
SGP.crPlant=function(l,g,st){
  var d=g.x-l.x;
  if(!st.planted){
    if(g.stepH>0||l.stepDone[l.gi]){ st.planted=true; }
    else if(st.nudge||l.still>=0.4){ st.nudge=true; return sgInp(0.15,[0,50,50]); }
    else { var vs=Math.sqrt(2*C.DEC*Math.max(d-230,0)); return sgInp(Math.min(l.basePace,vs/Math.max(topSpeed(l),1)),[0,50,50]); }
  }
  return SGP.crLook(l,g,st);
};

LESSONS.push({key:'close-wall',lesson:'A close race leaves no slack',title:'The Leader’s Wall',
  q:'You spent on height and sight; the pack behind you spent on speed, and it is closing. A box is ahead, and it could be any width. Can you afford to stop?',
  meta:'Nobody can stop alone, unless they are far enough ahead. A tall leader that stops at the edge holds the others back while it looks.',
  look:'A lab that stops in front of a box leaves a barrier of its own height there. The pack cannot jump yours until it builds up. Rushers behind you cannot see past you.',
  labs:[{x:0,pts:[80,90,60],cap:90,pace:0.6},RIV('crRacer','Racer 1',-200,[20,25,60],{cap:90,w:[10,15,75]}),RIV('crRacer','Racer 2',-215,[20,25,60],{cap:90,w:[10,15,75]}),RIV('crRacer','Racer 3',-230,[20,25,60],{cap:90,w:[10,15,75]})],
  track:function(r){ var wide=r()<0.5,g=segBox(520,54,wide?1.17+0.08*r():0.95+0.15*r(),{odds:30,cap:90});
    return {bars:[],gaps:[g],finish:g.x+g.W+200,note:'The box: '+segSay(g,90)+' Falls roll 30%.'}; },
  postures:['rush','build','crPlant'],
  claim:{text:'Stopping at the edge wins more than rushing or stopping back', score:function(t){ return Math.min(t.crPlant.win-t.rush.win,t.crPlant.win-t.build.win); }, need:20}});

/* crSave (you): Aschenbrenner's plan with a lead in hand. Floor it at the first box (cheap if you fall: 5%) and keep the lead, then spend it at
   the second: look before crossing, as crLook does */
SGP.crSave=function(l,g,st){ return l.gi===0?SGP.rush(l,g,st):SGP.crLook(l,g,st); };

LESSONS.push({key:'close-spend',lesson:'A close race leaves no slack',title:'Spend It Once',
  q:'You start well ahead of two racers. Falling into the first box rolls 5% for everyone; falling into the second rolls 40%. Every careful stop lets them close in. Where do you spend your lead?',
  meta:'A lead is slack, and slack runs out. One argument says: race hard where it is cheap, and spend the lead where it counts. It only works if you know which box is which.',
  look:'Taking care at a box costs time: you slow, look, back up and take a run-up. Racer floors it at any box it cannot size, and closes on you every time you stop.',
  labs:[{x:0,pts:[30,50,40]},RIV('crRacer','Racer 1',-1400,[30,50,40]),RIV('crRacer','Racer 2',-1415,[30,50,40])],
  track:function(r){ var g1=segBox(450,49,0.8+0.4*r(),{odds:5}),wide=r()<0.5,x2=g1.x+g1.W+700,g2=segBox(x2,54,wide?1.17+0.08*r():0.95+0.15*r(),{odds:40,cap:90});
    return {bars:[],gaps:[g1,g2],finish:g2.x+g2.W+200,note:'Box 1: '+segSay(g1,70)+' Falls roll 5%. Box 2: '+segSay(g2,90)+' Falls roll 40%.'}; },
  postures:['rush','crLook','crSave'],
  claim:{text:'Rushing the cheap box and spending the lead on the dear one wins more than rushing both or taking care at both', score:function(t){ return t.crSave.win-Math.max(t.rush.win,t.crLook.win); }, need:15}});
