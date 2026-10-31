/* ---- see-early: See before you need to. ---- */
/* The lesson posture, seeearly: put everything into sight while cruising (SGC). Once a box is next and its face is seen (SGP):
   - if another box lies so close behind it that crossing this one commits the lab to that one (seChain), it first looks until it knows
     that one's width too, then takes this box at the speed the next one will need;
   - if it does not yet know this box's width, it slows to a speed it can still stop from and keeps investing in sight and height;
   - once it knows, a box it cannot clear clean at full speed gets full height first, then the run-up. */
function seTop(l){ return Math.max((C.TOP0+0.85*l.cap)*(inSing(l)?K.singSpeed:1),1); }
/* the speed a box needs from a lab at its present height: clean if it can, else a scrape at full speed, else Infinity */
function seNeed(l,g){ var TM=seTop(l),v=sgCleanSpeed(l,g,TM); return v<=TM*1.04?Math.min(v,TM):(sgClearAt(l,g,TM)===1?TM:Infinity); }
function seChain(l){ var g=G.gaps[l.gi],n=G.gaps[l.gi+1]; return (g&&n&&n.x-(g.x+g.W)<250)?n:null; }
/* run-up to reach speed target at the face of g (as sgPlanKnown, with the target given) */
function seRun(l,g,st,target){
  var d=g.x-l.x,T=Math.max(topSpeed(l),1),acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  if(st.go){ return sgInp(1,[20,50,30],{fwd:true}); }
  if(target>T+0.5){ return sgInp(0,[0,0,100]); }
  if(reach>=target){ st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  if(d<target*target/(2*acc)+15&&l.x>backLimit(l)+2){ return sgInp(0,[0,0,100],{rev:true}); }
  st.go=true; return sgInp(1,[20,50,30],{fwd:true});
}
function seHold(l,g,w){ var d=g.x-l.x; if(d<=8){ return sgInp(0,w); } var vmax=Math.sqrt(2*C.DEC*Math.max(d-10,1)); return sgInp(Math.min(l.basePace,vmax/Math.max(topSpeed(l),1)),w); }
function seKnown(l,g,st){
  var d=g.x-l.x; if(!st.go&&l.v*l.v/(2*C.DEC)>d-6){ st.go=true; }  /* too close to stop: commit at full speed */
  if(!st.go&&l.pts[1]<l.cap-0.01&&sgClearAt(l,g,seTop(l))!==0){ return sgInp(0,[0,100,0]); }
  return sgPlanKnown(l,g,st);
}
SGP.seeearly=function(l,g,st){
  var n=seChain(l);
  if(n&&!st.go){
    if(!knowsWidth(l,l.gi+1)){
      return seHold(l,g,[60,40,0]);
    }
    var v2=seNeed(l,n);
    if(v2===Infinity||v2>seNeed(l,g)&&sgClearAt(l,n,seTop(l))!==0){ if(l.pts[1]<l.cap-0.01){ return sgInp(0,[0,100,0]); } }
    v2=seNeed(l,n); if(v2===Infinity){ st.refused=true; return sgInp(0,[0,0,100]); }
    var gap=n.x-(g.x+g.W),v1=Math.sqrt(Math.max(0,v2*v2-2*accOf(l)*0.9*gap)),v0=seNeed(l,g);
    if(v0===Infinity){ return seKnown(l,g,st); }
    return seRun(l,g,st,Math.min(seTop(l),Math.max(v0,v1*1.02)));
  }
  if(st.go||knowsWidth(l,l.gi)){ return seKnown(l,g,st); }
  return seHold(l,g,[50,50,0]);
};
SGC.seeearly=function(l){ return sgInp(l.basePace,[100,0,0]); };
NOPEEK.seeearly=1;
/* seemax: a foil for The Box Behind the Box. Braces for the worst without looking: at every box it fills height and speed to the ceiling,
   then takes the longest run-up it can and crosses at full speed */
SGP.seemax=function(l,g,st){
  if(!st.go&&(l.pts[1]<l.cap-0.01||l.pts[2]<l.cap-0.01)){ return sgHold(l,g,l.pts[1]<l.cap-0.01?[0,100,0]:[0,0,100]); }
  return seRun(l,g,st,Math.max(topSpeed(l)-1,1));
};
/* seecreep: a foil for Too Late to Brake. Careful from the start, but blind: it drives slowly enough to stop for anything it sees, puts
   nothing into sight, and at the box plays build */
SGC.seecreep=function(l){ return sgInp(0.5,[0,100,0]); };
SGP.seecreep=SGP.build;

LESSONS.push({key:'see-early-brake',lesson:'See before you need to',title:'Too Late to Brake',
  q:'The road is fast and you see only a short way ahead. By the time a box comes into view, can you still stop?',
  meta:'Evidence about a risk arrives late. If you only start looking when it is in front of you, you are already committed.',
  look:'Everyone runs fast here. A lab that stops investing in sight until the box is in view finds it cannot brake in time.',
  labs:[{x:0,pts:[5,50,40],pace:0.8,w:[0,100,0]},RIV('build','Build',-200,[5,50,40],{pace:0.8,w:[0,100,0]}),RIV('wait','Wait',-220,[5,50,40],{pace:0.8,w:[0,100,0]}),RIV('rush','Rush',-300,[5,50,40],{pace:0.8,w:[0,100,0]})],
  track:function(r){ var wide=r()<0.5,g=segBox(900,30,wide?1.04+0.06*r():0.7,{odds:5}); return {bars:[],gaps:[g],finish:g.x+g.W+200,note:(wide?'A wide box. ':'A narrow box. ')+'The box: '+segSay(g,70)+' Falls roll 5%.'}; },
  postures:['seeearly','rush','build','seecreep'],
  claim:{text:'Seeing early wins more than rushing, late care, or slowing down blind', score:function(t){ return t.seeearly.win-Math.max(t.rush.win,t.build.win,t.seecreep.win); }, need:15}});

LESSONS.push({key:'see-early-bravo',lesson:'See before you need to',title:'The Box Behind the Box',
  q:'A small box you can see clearly. Is that all there is?',
  meta:'Once you take a step, you are committed to whatever comes right after it. The estimate that matters is of the thing you cannot see yet.',
  look:'There is a second box just past the first, with no room to stop between them. A wide second box needs you to hit the first one at full speed and height, so the choice is made before the first box. From there, only a lab that has invested in sight can see how wide the second one is.',
  labs:[{x:0,pts:[20,50,40],pace:0.7,w:[0,100,0]},RIV('build','Build',-150,[20,50,40],{pace:0.7,w:[0,100,0]}),RIV('wait','Wait',-170,[20,50,40],{pace:0.7,w:[0,100,0]}),RIV('rush','Rush',-250,[20,50,40],{pace:0.7,w:[0,100,0]})],
  track:function(r){ var wide=r()<0.5,g1=segBox(1000,30,0.55,{odds:5}),g2=segBox(g1.x+g1.W+70,30,wide?1.04+0.06*r():0.7,{odds:5});
    return {bars:[],gaps:[g1,g2],finish:g2.x+g2.W+200,note:(wide?'A wide second box. ':'A narrow second box. ')+'Box 1: '+segSay(g1,70)+' Box 2: '+segSay(g2,70)+' Falls roll 5%.'}; },
  postures:['seeearly','rush','build','seemax'],
  claim:{text:'Looking past the first box wins more than rushing, careful box-by-box play, or bracing for the worst at every box', score:function(t){ return t.seeearly.win-Math.max(t.rush.win,t.build.win,t.seemax.win); }, need:15}});

/* seebreak: Cole's line from his hidden-width play. While any lab is close ahead (its sight shadow is on the road), floor it to get out in
   front of the pack; once clear of it, cruise and put everything into sight; at the box, as seeearly */
function seAheadGap(l){ var a=Infinity,i,m; for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done){continue;} if(m.x>l.x-60&&m.x-l.x<a){a=m.x-l.x;} } return a; }
SGC.seebreak=function(l){ return seAheadGap(l)<Infinity?sgInp(1,[0,0,0],{fwd:true}):sgInp(l.basePace,[100,0,0]); };
SGP.seebreak=SGP.seeearly; NOPEEK.seebreak=1;
/* seeblind: a foil for The Pack. Breaks out of the pack the same way, then cruises like everyone else (nothing into sight); at the box, build */
SGC.seeblind=function(l){ return seAheadGap(l)<Infinity?sgInp(1,[0,0,0],{fwd:true}):sgInp(l.basePace,[0,100,0]); };
SGP.seeblind=SGP.build;

LESSONS.push({key:'see-early-pack',lesson:'See before you need to',title:'The Pack Dives Together',
  q:'You are in the middle of a pack, and the lab in front hides the road. Something is ahead. Do you stay in the pack?',
  meta:'Nobody in a pack sees further than the lab in front. If it cannot see the danger in time, neither can anyone following it.',
  look:'The Lead is careful but has little sight, and it hides the road from everyone behind it. The tailers keep close. To see the box in time you have to get out in front first, then look.',
  labs:[{x:0,pts:[5,50,40],pace:0.8,w:[0,100,0]},RIV('late','Lead',40,[5,50,40],{pace:0.8,w:[0,100,0]}),RIV('tail','Tail 1',-30,[5,50,40],{pace:0.8,w:[0,100,0]}),RIV('tail','Tail 2',-60,[5,50,40],{pace:0.8,w:[0,100,0]})],
  track:function(r){ var wide=r()<0.5,g=segBox(1400,30,wide?1.04+0.06*r():0.7,{odds:5}); return {bars:[],gaps:[g],finish:g.x+g.W+200,note:(wide?'A wide box. ':'A narrow box. ')+'The box: '+segSay(g,70)+' Falls roll 5%.'}; },
  postures:['seebreak','tail','build','rush','seeearly','seeblind'],
  claim:{text:'Breaking out of the pack and then looking wins more than staying in it, dropping back, rushing, looking from inside it, or breaking out without looking', score:function(t){ return t.seebreak.win-Math.max(t.tail.win,t.build.win,t.rush.win,t.seeearly.win,t.seeblind.win); }, need:15}});
