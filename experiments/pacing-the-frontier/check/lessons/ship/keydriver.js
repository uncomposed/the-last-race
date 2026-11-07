/* [[ai gen]] Scripted player for the built game page: real KeyboardEvents only, with human reaction lag. Not a person, and not evidence of fun.
   A strategy bot is asked what to do every 250-400 ms of game time; its answer reaches the keys 250-400 ms later. Pace moves by Arrow Up/Down at 20 presses a second,
   floor and brake are held Arrow Right/Left, the split is the nearest of the seven number-key presets. Nothing writes the game's input directly unless HD.exactW is set (diagnostic).
   Knobs a careful person has and a bot does not: HD.ant (read the road this many seconds ahead of where you are), HD.mg (treat box widths as this much wider),
   HD.brake (hold Back when more than this over the speed you want), HD.commit (only commit to a jump from your true position), HD.ease [x,pace] (past x, hold this pace until the next box is in sight), HD.kick (flat out once the last wall and box are behind you).
   To run: copy ../../game/game.html to a page under this folder, add before `function gmRestart(){`:
     window.__h={top:function(l){return topSpeed(l);},sync:function(){syncInput();},gmRace:gmRace,K:function(){return K;},G:function(){return G;},SEGS:function(){return SEGS;},ui:function(){return ui;},ctrl:function(l,p){var o=l.post;l.post=p;var r=segCtrl(l,1);l.post=o;return r;}};
   and load this file after it. Then HD.batch(key,HD.use(key),firstSeed,n) in the console. Time is stepped at 1/60 s, syncInput each step as the frame loop does. */
window.HD=(function(){
 var PRE={Digit1:[100,0,0],Digit2:[0,100,0],Digit3:[0,0,100],Digit4:[33,33,33],Digit5:[50,50,0],Digit6:[0,50,50],Digit7:[50,0,50]};
 function key(t,c){ document.dispatchEvent(new KeyboardEvent(t,{code:c,bubbles:true,cancelable:true})); }
 function near(w){ var b=null,bs=-1,c,n=Math.hypot(w[0],w[1],w[2])||1; for(c in PRE){ var p=PRE[c],s=(p[0]*w[0]+p[1]*w[1]+p[2]*w[2])/(n*Math.hypot(p[0],p[1],p[2])); if(s>bs){bs=s;b=c;} } return b; }
 function rng(s){ return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
 function begin(key_,seed){ var h=window.__h,m=h.SEGS().filter(function(s){return s.key===key_;})[0]; h.K().chill=1; h.gmRace({mode:'camp',map:m,counts:false,seed:seed}); h.K().chill=1; var b=document.querySelector('#ready .primary')||document.getElementById('ready-go'); if(b){b.click();} if(h.G().labs[0].human!==true){ throw new Error('not a human lab'); } }
 function run(key_,post,seed,stopAt){ var h=window.__h; begin(key_,seed); var G=h.G(),me=G.labs[0],r=rng(seed*7+1),nextD=0.3,Q=[],pace=null,held={},cur=null,ui=0.7,nextP=0,split=null,g=0,presses=0;
  var hold=function(c,on){ if(!!held[c]!==on){ held[c]=on; key(on?'keydown':'keyup',c); presses++; } };
  while(!G.over&&g++<40000&&(!stopAt||G.t<stopAt)){
   if(G.t>=nextD){ var ox=me.x,gg=G.gaps[me.gi],ow=gg&&gg.W; if(gg&&HD.mg){ gg.W=ow*HD.mg; } var c=h.ctrl(me,post),sst=function(){ return me.sst&&me.sst.s&&me.sst.s[me.gi]; },st0=sst(); if(HD.commit&&!(st0&&st0.go)&&HD.ant){ me.x=Math.min(me.x+me.v*HD.ant,Math.max(me.x,Math.min(G.barriers[me.bi]?G.barriers[me.bi].x-2:1e9,gg?gg.x-2:1e9))); c=h.ctrl(me,post); me.x=ox; var st1=sst(); if(st1&&st1.go){ st1.go=false; c={pace:0,w:c.w}; } } else if(!HD.commit&&HD.ant){ me.x=Math.min(me.x+me.v*HD.ant,Math.max(me.x,Math.min(G.barriers[me.bi]?G.barriers[me.bi].x-2:1e9,gg?gg.x-2:1e9))); c=h.ctrl(me,post); me.x=ox; } me.x=ox; if(gg&&HD.mg){ gg.W=ow; } if(c&&HD.ease&&me.x>HD.ease[0]&&gg&&!(me.seenG&&me.seenG[me.gi])&&(c.pace>HD.ease[1]||c.fwd)){ c={pace:HD.ease[1],w:c.w}; } if(c&&HD.kick&&!c.rev&&G.barriers.length&&me.x>G.barriers[G.barriers.length-1].x&&G.gaps.every(function(q){ return q.x<me.x; })){ c={pace:1,w:c.w,fwd:true}; } if(c){ Q.push({t:G.t+(HD.lag!==undefined?HD.lag:0.25+r()*0.15),c:{pace:c.pace,w:c.w,fwd:!!c.fwd,rev:!!c.rev,jump:!!c.jump}}); } nextD=G.t+(HD.samp!==undefined?HD.samp:0.25+r()*0.15); }
   while(Q.length&&Q[0].t<=G.t){ cur=Q.shift().c; if(cur.jump){ key('keydown','Space'); presses++; } }
   if(cur){ var fl=cur.fwd||cur.pace>=0.95; hold('ArrowRight',fl); var br=HD.brake&&!cur.rev&&!fl&&me.v>3&&cur.pace*Math.max(h.top(me),1)<me.v-HD.brake; hold('ArrowLeft',cur.rev||br);
     if(cur.w&&HD.exactW){ G.input.w=cur.w; h.ui().w=cur.w; } else if(cur.w){ var d=near(cur.w); if(d!==split){ split=d; key('keydown',d); presses++; } }
     if(G.t>=nextP&&!fl&&!cur.rev){ var tgt=Math.round(cur.pace*20)*5,now=h.ui().pace; if(tgt>now+2){ key('keydown','ArrowUp'); presses++; nextP=G.t+1/(HD.rate||20); } else if(tgt<now-2){ key('keydown','ArrowDown'); presses++; nextP=G.t+1/(HD.rate||20); } }
   }
   h.sync(); PF.step(1/60);
  }
  hold('ArrowRight',false); hold('ArrowLeft',false);
  return {seed:seed,type:G.over&&G.result?G.result.type:'running',won:!!(G.over&&G.result&&G.result.type==='win'&&G.result.winner===me),t:+G.t.toFixed(1),str:me.strikes,dis:!!me.dissolved,fell:me.fellAt!==undefined,presses:presses}; }
 function batch(key_,post,a,n){ var o=[],i; for(i=0;i<n;i++){ o.push(run(key_,post,a+i)); } var w=o.filter(function(x){return x.won;}); return {map:key_,post:post,won:w.length,n:n,fell:o.filter(function(x){return x.fell;}).length,dis:o.filter(function(x){return x.dis;}).length,world:o.filter(function(x){return x.type==='all';}).length,firstWin:w[0]?w[0].seed:null,tWin:w[0]?w[0].t:null,t:w.length?+(w.reduce(function(s,x){return s+x.t;},0)/w.length).toFixed(1):null,keys:o[0].presses}; }
 var CFG={'three-strikes':['spLate',1,1.1,1],'elbows':['sp-s-bold',1,1.35,0],'steward':['sp-even-slow',1,1.35,0],'takeoff':['maxout',1,1.2,0],'red-box':['spBait',1,1.2,0],'trailbreaker':['sp-hs-tail',1.5,1.2,1],'only-box':['spFirst',1,1,1,[1650,0.85]],'ladder':['sp-hs-bold',1,1.35,0],'second-order':['spLook',1,1.2,1],'picket':['sp-hs-tail',1,1,0,null,1]};
 function use(k){ var c=CFG[k]; HD.ant=c[1]; HD.mg=c[2]; HD.commit=c[3]; HD.ease=c[4]||null; HD.kick=c[5]||0; HD.brake=8; return c[0]; }
 function frame(k){ var p=use(k),s,r; for(s=1;s<60;s++){ r=run(k,p,s); if(r.won){ run(k,p,s,r.t-1.2); return {k:k,seed:s,t:r.t,x:Math.round(window.__h.G().labs[0].x),fin:Math.round(window.__h.G().finish||0)}; } } return {k:k,none:true}; }
 return {run:run,batch:batch,ant:0,CFG:CFG,use:use,frame:frame};
})();
