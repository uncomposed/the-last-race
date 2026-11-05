/* ---- SEGMENTS (check/segments): twelve hand-built segments, one race dynamic each. segUse(id[,you]) picks one (0: off).
   Each segment sets its own track, where every lab starts and with what, each rival's posture, and the extinction odds of each box.
   The variant (a box's width, which road you get) is drawn from the seed, so New run gives a new variant of the same segment.
   Postures, used once a box is the lab's next obstacle and it has seen the face (before that, the page's own bot plan cruises):
     rush   floor it, whatever the width.
     read   (a check row for Warning Signs) build if a barrier it passed was taller than 60, else rush.
     build  stop short, build height, creep until the far edge is in view, then take the run-up a clean cross needs.
     wait   stop short and build speed; go once the width is known (a rival crossed or fell, or it sees the edge); after pat s, build.
     late   like build at the box, but cruises at full pace when blind.
     tail   (cruise only) keep 30 behind the lab in front and never pass it; at the box it behaves like build.
   Build and wait also slow down when a rival's sight shadow hides the road (sgBlind); rush and tail do not.
   Injected into the sim section by build.mjs, so check.mjs runs the same code in Node. ---- */
var SEG=null,SEGYOU='build';
/* box widths are given as f x the widest box a lab at the level's ceiling clears clean at full speed (at the ceiling of 70: about 83 wide).
   Rough guide at that ceiling: f 0.85 anyone clears; 1.0 a cruiser scrapes, a lab that stops and builds clears; 1.18 a cruiser falls, a builder
   scrapes; 1.3 nobody crosses. segSay states the real outcome for a cruiser and for a full lab, from the same flight rules the sim uses */
function segOut(v,h,w,rise){ var jd=jumpDur(v),u0=C.BOXU,a0=h+arcY(u0),alt=a0>=rise?flightAlt(v,h,w,u0):a0-sinkRate(jd)*w/v; return alt>=rise?0:(alt>0?1:2); }
function segReach(cap,rise){ var v=C.TOP0+0.85*cap,w=1; while(w<2000&&segOut(v,cap,w,rise)===0){w++;} return w-1; }
function segSay(g,cap){
  var nm=['clears it','scrapes','falls'],c=nm[segOut(C.TOP0+0.85*(cap-15),cap-8,g.W,g.rise)],f=nm[segOut(C.TOP0+0.85*cap,cap,g.W,g.rise)];
  return g.W+' wide ('+g.f+' x a full lab’s clean reach): a cruiser '+c+'; a lab at full height and speed '+f+'.';
}
function segBox(x,rise,f,o){
  o=o||{}; var cap=o.cap||C.CAPS[0],W=Math.max(30,Math.round(f*segReach(cap,rise)));
  return {x:Math.round(x),W:W,crossedBy:-1,stepH:0,pub:!!o.shown,wpub:!!o.shown,beacon:!!o.beacon,sing:!!o.sing,rise:Math.round(rise),t:0.7,wd:0.5,nowarn:false,
    odds:o.odds===undefined?10:o.odds,f:Math.round(f*100)/100,cap:cap};
}
function segBar(x,h){ return {x:Math.round(x),h:Math.round(h),pub:false,seg:0}; }
function segPick(r,a){ return a[Math.min(a.length-1,Math.floor(r()*a.length))]; }
var RIV=function(post,name,x,pts,o){ return Object.assign({post:post,name:name,x:x,pts:pts,pace:0.7,w:[20,50,30]},o||{}); };
var SEGS=[
  {key:'unknown',title:'The Unknown Box',
   q:'You cannot see how wide the box is until you are close or tall. Do you brake before you know?',
   meta:'A capability whose risk cannot be sized until you are already committed.',
   look:'Rush floors it, Build stops to look, and Wait lets someone else go first. Which one were you?',
   labs:[{x:0,pts:[20,45,30]},RIV('rush','Rush',-12,[20,45,30]),RIV('build','Build',-24,[20,45,30]),RIV('wait','Wait',-36,[20,45,30])],
   track:function(r){ var g=segBox(430,49,0.8+0.55*r(),{odds:10}); return {bars:[segBar(140,30),segBar(240,38)],gaps:[g],finish:g.x+g.W+160,note:'The box: '+segSay(g,70)+' Falls roll 10%.'}; }},
  {key:'rushing',title:'Everyone Else Is Rushing',
   q:'Three rivals sprint at every box. Your caution cannot protect you from their dice. Do you join them?',
   meta:'Going slow alone loses the race, and a rival’s fall can still end it for everyone.',
   look:'Watch the roll when a Rush falls: the odds are high here, and they are your odds too.',
   labs:[{x:-40,pts:[20,45,30]},RIV('rush','Rush 1',0,[15,40,45],{pace:0.85,w:[10,30,60]}),RIV('rush','Rush 2',-12,[15,40,45],{pace:0.85,w:[10,30,60]}),RIV('rush','Rush 3',-24,[15,40,45],{pace:0.85,w:[10,30,60]})],
   track:function(r){ var g1=segBox(400,42,segPick(r,[0.85,1.05,1.2]),{odds:20}),x2=g1.x+g1.W+380,g2=segBox(x2,46,segPick(r,[0.85,1.08,1.22]),{odds:35,cap:C.CAPS[1]});
     return {bars:[segBar(180,32),segBar(g1.x+g1.W+150,48)],gaps:[g1,g2],finish:g2.x+g2.W+160,note:'Box 1: '+segSay(g1,70)+' Box 2: '+segSay(g2,78)+' Falls roll 20%, then 35%.'}; }},
  {key:'tailgate',title:'Tailgating in Fog',
   q:'You are right behind Rush and exactly as tall. You cannot see past it. Something is ahead.',
   meta:'Following the leader is not the same as knowing what the leader knows.',
   look:'Rush floors it when it sees the box. You see Rush speed away and nothing else. Drop back past your sight range, or grow taller than Rush, and the box appears.',
   labs:[{x:-20,pts:[15,50,45]},RIV('rush','Rush',0,[15,50,45]),RIV('build','Build',-160,[30,45,30]),RIV('wait','Wait',-180,[30,45,30])],
   track:function(r){ var wide=r()<0.5,g=segBox(560,49,wide?1.22:0.85,{odds:25}); return {bars:[],gaps:[g],finish:g.x+g.W+160,note:(wide?'A wide box: whoever followed Rush in fell with it. ':'A narrow box: tailing Rush was safe this time. ')+segSay(g,70)}; }},
  {key:'first',title:'Who Goes First?',
   q:'Everyone has stopped in front of the same unknown box. The first across learns the width the hard way and gets the level-up. Everyone else learns it for free.',
   meta:'Someone has to be first. Their risk becomes everyone’s knowledge.',
   look:'The rivals lose patience at different times. If nobody moves for 12 seconds the run ends with no winner.',
   labs:[{x:0,pts:[50,50,40]},RIV('wait','Wait 6s',-10,[50,50,40],{pat:6}),RIV('wait','Wait 12s',-20,[50,50,40],{pat:12}),RIV('wait','Wait 20s',-30,[50,50,40],{pat:20})],
   track:function(r){ var g=segBox(285,45,0.85+0.45*r(),{odds:25}); return {bars:[],gaps:[g],finish:g.x+g.W+200,note:'The box: '+segSay(g,70)}; }},
  {key:'signs',title:'Warning Signs',extra:['read'],
   q:'Two barriers, then a box that looks the same every time. Were the barriers telling you something?',
   meta:'Small incidents are evidence about the big one.',
   look:'On the rough road the barriers are tall and the box is wide. On the quiet road both are small. The box gives no other clue.',
   labs:[{x:0,pts:[20,40,30]},RIV('rush','Rush',-12,[20,40,30]),RIV('build','Build',-24,[20,40,30]),RIV('wait','Wait',-36,[20,40,30])],
   track:function(r){ var rough=r()<0.5,g=segBox(560,45,rough?1.2:0.85,{odds:20});
     return {bars:rough?[segBar(160,78),segBar(300,92)]:[segBar(160,22),segBar(300,28)],gaps:[g],finish:g.x+g.W+160,note:(rough?'The rough road: tall barriers, wide box. ':'The quiet road: small barriers, narrow box. ')+segSay(g,70)}; }},
  {key:'beacon',title:'The Beacon and the Quiet One',
   q:'A tall box you can see from far off, then a low one you can barely see at all. Which one gets your attention?',
   meta:'The visible threat gets the attention. The boring-looking one can be the deadlier.',
   look:'Nobody can see over the tall box, so its width is learned only when someone crosses it. The low box is easy to see over, if you kept some sight and height.',
   labs:[{x:0,pts:[25,45,35]},RIV('rush','Rush',-12,[25,45,35]),RIV('build','Build',-24,[25,45,35]),RIV('wait','Wait',-36,[25,45,35])],
   track:function(r){ var b=segBox(380,C.CAPS[0]+0.6*C.JUMP,0.8,{beacon:true,odds:10}),q=segBox(b.x+b.W+320,30,0.85+0.45*r(),{odds:30,cap:78});
     return {bars:[segBar(170,30)],gaps:[b,q],finish:q.x+q.W+160,note:'The tall box: '+segSay(b,70)+' The quiet box: '+segSay(q,78)+' Falls there roll 30%.'}; }},
  {key:'stakes',title:'Rising Stakes',
   q:'Three unknown boxes. A fall at the first rolls 5% for everyone, at the second 25%, at the third 50%.',
   meta:'Each step up the frontier makes the same mistake more expensive.',
   look:'Does your care rise with the stakes? The widths are drawn separately, so the first box tells you nothing about the third.',
   labs:[{x:0,pts:[20,45,30]},RIV('rush','Rush',-12,[20,45,30]),RIV('build','Build',-24,[20,45,30]),RIV('wait','Wait',-36,[20,45,30])],
   track:function(r){ var gaps=[],bars=[],x=330,k,od=[5,25,50],says=[],cp=[70,78,86];
     for(k=0;k<3;k++){ var g=segBox(x,0.6*cp[k],0.85+0.3*r(),{odds:od[k],cap:cp[k]}); gaps.push(g); says.push('Box '+(k+1)+': '+segSay(g,cp[k])); bars.push(segBar(x-170,0.45*cp[k]+C.JUMP*0.4)); x=g.x+g.W+340; }
     return {bars:bars,gaps:gaps,finish:x-180,note:says.join(' ')}; }},
  {key:'record',title:'Clean Record',
   q:'Every rival is on its last strike. You have none. A scrape costs a strike, and you can afford two.',
   meta:'A lab with a clean record has risk budget the others do not. Spending it is a choice.',
   look:'The rivals stop and build at every box because one more scrape dissolves them. Do you take the near miss they cannot?',
   labs:[{x:0,pts:[20,45,35],strikes:0},RIV('build','Build',-12,[20,45,35],{strikes:2}),RIV('build','Build 2',-24,[20,45,35],{strikes:2}),RIV('wait','Wait',-36,[20,45,35],{strikes:2})],
   track:function(r){ var g1=segBox(470,42,0.97,{odds:15}),g2=segBox(g1.x+g1.W+400,46,0.95+0.25*r(),{odds:30,cap:78});
     return {bars:[segBar(110,30)],gaps:[g1,g2],finish:g2.x+g2.W+160,note:'Box 1: '+segSay(g1,70)+' Box 2: '+segSay(g2,78)}; }},
  {key:'wall',title:'The Breakthrough Wall',
   q:'A research wall nobody can jump without stopping to build height. Whoever clears it lifts everyone watching.',
   meta:'A breakthrough leaks to whoever is close enough to see it.',
   look:'Clearing a barrier in view of a rival gives it up to a third of the barrier’s height. Being near when someone else breaks through is free height. Crashing into the wall is a strike.',
   labs:[{x:0,pts:[25,20,40]},RIV('rush','Rush',-12,[25,20,40],{w:[10,30,60]}),RIV('build','Build',-24,[25,20,40]),RIV('wait','Wait',-36,[25,20,40])],
   track:function(r){ var g=segBox(560,55,0.9+0.3*r(),{odds:20}); return {bars:[segBar(200,C.CAPS[0]+C.JUMP-8)],gaps:[g],finish:g.x+g.W+160,note:'The box after the wall: '+segSay(g,70)}; }},
  {key:'follower',title:'The Fast Follower',
   q:'The Leader is a little ahead and will stop to build before the box. Follow it across a box that narrows behind it, or go first and take the risk?',
   meta:'Fast followers ride on what the leader paid for.',
   look:'A crossed box shrinks the further the leader gets past it, and you invest faster the further behind you are. But the first lab across sets the new ceiling. Which matters more on the long road home?',
   labs:[{x:0,pts:[20,45,40]},RIV('build','Leader',100,[20,45,40]),RIV('build','Build',-12,[20,45,40]),RIV('wait','Wait',-24,[20,45,40])],
   track:function(r){ var g=segBox(520,49,1.05,{odds:20,shown:true}),x=g.x+g.W; return {bars:[segBar(x+250,50),segBar(x+500,70),segBar(x+750,85),segBar(x+1000,95)],gaps:[g],finish:x+1250,note:'The box, before anyone crosses: '+segSay(g,70)}; }},
  {key:'pack',title:'The Pack Behind You',
   q:'You lead two rivals who tail you and cannot see past you. A latecomer is coming up fast. Do you cross first, or stop and look?',
   meta:'Going first is a risk to you and a gift to everyone behind. Stopping quietly in front of a hazard hides it from whoever comes next.',
   look:'Once you cross, the box is public and it shrinks for everyone behind you. If you stop, the tailers stop behind you, and the three of you hide the box from the latecomer. Its fall rolls 30% for everyone.',
   labs:[{x:60,pts:[30,55,55]},RIV('tail','Tail 1',30,[15,45,45]),RIV('tail','Tail 2',0,[15,45,45]),RIV('late','Latecomer',-220,[25,45,30])],
   track:function(r){ var g=segBox(700,49,1.0+0.35*r(),{odds:30}); return {bars:[],gaps:[g],finish:g.x+g.W+160,note:'The box: '+segSay(g,70)+' Falls roll 30%.'}; }},
  {key:'last',title:'The Last Gap',
   q:'You lead into the singularity. Past it you run three times faster and your controls lag. What you have built is what you keep.',
   meta:'After the transition there is no time to steer. Preparation happens before.',
   look:'Past the gap come three tall barriers. A crash is a strike, and three strikes dissolve you. Your lead is time to stop and build.',
   labs:[{x:0,pts:[25,45,55]},RIV('rush','Rush',-170,[25,45,55]),RIV('build','Build',-190,[25,45,55]),RIV('wait','Wait',-210,[25,45,55])],
   track:function(r){ var g=segBox(480,0.85*C.CAPS[0],0.95,{odds:45,shown:true,sing:true}),x=g.x+g.W,h0=55+12*r();
     return {bars:[segBar(x+260,h0+C.JUMP),segBar(x+520,h0+C.JUMP+10),segBar(x+760,h0+C.JUMP+20)],gaps:[g],finish:x+950,sing:0,note:'The gap: '+segSay(g,70)+' Past it the barriers need height '+Math.round(h0)+', '+Math.round(h0+10)+' and '+Math.round(h0+20)+'.'}; }}
];
function segUse(id,you){
  SEG=SEGS[id-1]||null; if(you){ SEGYOU=you; }
  globalThis.SCEN=SEG?segScen:null; globalThis.CTRL=SEG?segCtrl:null; globalThis.SEGPOST=SEG?segPost:null;
  return SEG;
}
function segScen(T,X){
  var r=rngMaker(((X.seed>>>0)^0x5E6A11CE)>>>0),t=SEG.track(r);
  T.gaps=t.gaps; T.bars=[{x:-600,h:0,pub:true,seg:0}].concat(t.bars);  /* a zero-height first barrier: the sim calls barrier 0 "the gate" */
   T.finish=t.finish; T.n=t.gaps.length; T.sing=t.sing===undefined?-1:t.sing;
  T.x0=t.sing===undefined?t.finish:t.gaps[t.sing].x+t.gaps[t.sing].W; T.ni=0; T.A=0.1; T.sig='segment'; T.label=SEG.title; T.lean=0; T.note=t.note;
}
function segPost(GG){
  var keep=[],i,l,s;
  for(i=0;i<GG.labs.length;i++){
    l=GG.labs[i]; s=SEG.labs[l.id]; if(!s){continue;}
    l.x=s.x; l.cap=s.cap||C.CAPS[0]; l.pts=s.pts.map(function(p){return Math.min(p,l.cap);}); l.strikes=s.strikes||0;
    if(!l.human){ l.post=l.id===0?SEGYOU:s.post; l.pat=s.pat||15; if(l.id>0){ l.name=s.name; } l.basePace=s.pace||0.7;
      POL[l.kind]={pace:s.pace||0.7,jit:0,pit:1,pitPub:1,bar:1,safe:false,w:(s.w||[20,50,30]).slice()}; }
    keep.push(l);
  }
  GG.labs=keep;
}
/* ---- postures (as the hidden-width page's, with patience and tailing added) ---- */
function sgInp(pace,w,x){ return Object.assign({pace:pace,w:w,jump:false,auto:true,rev:false,fwd:false},x||{}); }
function sgClearAt(l,g,v){ var h=heightOf(l),w=gapWidth(l,g),jd=jumpDur(v),u0=C.BOXU,a0=h+arcY(u0),alt=a0>=g.rise?flightAlt(v,h,w,u0):a0-sinkRate(jd)*w/v; return alt>=g.rise?0:(alt>0?1:2); }
function sgCleanSpeed(l,g,T0){ var T=Math.max(T0,1),lo=1,hi=T,i,m; if(sgClearAt(l,g,T)!==0){return Infinity;} for(i=0;i<20;i++){ m=(lo+hi)/2; if(sgClearAt(l,g,m)===0){hi=m;} else {lo=m;} } return hi*1.04; }
function sgStand(){ return C.STEPD+120; }
function sgBoxNext(l){ var g=G.gaps[l.gi]; if(!g||!stepOn(g)||l.gx||l.out||l.done){return null;} var b=G.barriers[l.bi]; if(b&&b.x<g.x){return null;} if(towerOf(l,g)&&heightOf(l)+C.JUMP<g.stepH+2){return null;} if(!(g.pub||l.seenG[l.gi])){return null;} return g; }
function sgPlanKnown(l,g,st){
  var d=g.x-l.x,T=Math.max(topSpeed(l),1),TM=Math.max((C.TOP0+0.85*l.cap)*(inSing(l)?K.singSpeed:1),1),atCap=l.pts[1]>=l.cap-0.01,acc=accOf(l)*0.9,reach=Math.sqrt(Math.max(l.v,0)*Math.max(l.v,0)+2*acc*Math.max(d-8,0));
  var vcl=sgCleanSpeed(l,g,TM),target=vcl<=TM*1.04?Math.min(vcl,TM):(sgClearAt(l,g,TM)===1?TM:Infinity);  /* the 4% margin never asks for more than top speed */
  if(target===Infinity){ if(!atCap){ return sgInp(0,[0,100,0]); } st.refused=true; return sgInp(0,[0,0,100]); }
  if(st.go){ return sgInp(1,[20,50,30],{fwd:true}); }
  if(target>T){ if(capped(l)){ var vmx=Math.sqrt(2*C.DEC*Math.max(d-6,1)); return sgInp(Math.min(0.3,vmx/T),[0,0,100]); } return sgInp(0,[0,0,100]); }
  if(reach>=target){ st.go=true; return sgInp(1,[20,50,30],{fwd:true}); }
  var need=target*target/(2*acc)+15;
  if(d<need&&l.x>backLimit(l)+2){ return sgInp(0,[0,0,100],{rev:true}); }
  if(d<need&&sgClearAt(l,g,Math.min(T,reach))===2){ st.refused=true; return sgInp(0,[0,0,100]); }
  st.go=true; return sgInp(1,[20,50,30],{fwd:true});
}
function sgHold(l,g,w){ var d=g.x-l.x,brake=l.v*l.v/(2*C.DEC); if(d-brake>sgStand()+10){ return sgInp(l.basePace,w); } return sgInp(0,w); }
var SGP={
  read:function(l,g,st){ var i,tall=false; for(i=1;i<l.bi;i++){ if(G.barriers[i].h>60){tall=true;} } return tall?SGP.build(l,g,st):SGP.rush(l,g,st); },
  rush:function(l,g,st){ return sgInp(1,[20,50,30],{fwd:true}); },
  build:function(l,g,st){
    var atCap=l.pts[1]>=l.cap-0.01,d=g.x-l.x;
    if(!atCap&&!st.go){ return sgHold(l,g,[0,100,0]); }
    if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown(l,g,st); }
    if(d<=8){ return sgInp(0,[0,100,0]); }
    var vmax=Math.sqrt(2*C.DEC*Math.max(d-6,1)); return sgInp(Math.min(0.25,vmax/Math.max(topSpeed(l),1)),[0,100,0]);
  },
  wait:function(l,g,st){
    if(st.go||knowsWidth(l,l.gi)){ return sgPlanKnown(l,g,st); }
    st.t=(st.t||0)+1/60; if(st.t>l.pat){ return SGP.build(l,g,st); }
    return sgHold(l,g,[0,0,100]);
  }
};
SGP.tail=SGP.build; SGP.late=SGP.build;
/* tail: with no box in view, keep 30 behind the nearest lab ahead (within 120) and never pass it */
function sgTail(l){
  var a=null,i,m,top=Math.max(topSpeed(l),1);
  for(i=0;i<G.labs.length;i++){ m=G.labs[i]; if(m===l||m.out||m.done||m.x<=l.x||m.x-l.x>120){continue;} if(!a||m.x<a.x){a=m;} }
  if(!a){ return null; }
  var v=Math.max(0,a.v+0.8*(a.x-l.x-30));
  return sgInp(clamp(v/top,0,1),POL[l.kind].w);
}
/* build and wait are careful when blind: with a rival's sight shadow ahead they keep to a speed they could stop from before the lab casting it,
   so they drop back until it is out of sight range (rush and tail do not) */
function sgBlind(l){
  var sh=shadows(l),a=Infinity,i; for(i=0;i<sh.length;i++){ a=Math.min(a,sh[i].a); }
  var inp=botInput(l); if(a===Infinity){ return inp; }
  var top=Math.max(topSpeed(l),1),vmx=Math.sqrt(2*C.DEC*Math.max(a-10,0));
  return (inp.fwd||inp.pace*top>vmx)?Object.assign({},inp,{pace:vmx/top,fwd:false}):inp;
}
function segCtrl(l,GG){
  var p=l.post; if(!p){ return null; }
  if(!l.sst||l.sst.g!==GG){ l.sst={g:GG,s:{}}; }
  var g=sgBoxNext(l);
  if(!g){
    if(p==='tail'){ return !(G.barriers[l.bi]&&G.gaps[l.gi]&&G.barriers[l.bi].x<G.gaps[l.gi].x)?sgTail(l):null; }
    if(p==='build'||p==='wait'){ return sgBlind(l); }
    return null;
  }
  var st=l.sst.s[l.gi]||(l.sst.s[l.gi]={}); return SGP[p](l,g,st);
}
