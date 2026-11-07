/* PLACEHOLDERS until check/lessons/ship/maps.js arrives: existing maps stand in so the shell can be walked end to end. Removed by the build once ship exists. */
(function(){
  var base=LESSONS.slice(),te=base.filter(function(m){ return m.key==='two-endings'; })[0],pool=[te].concat(base.filter(function(m){ return m!==te; }));
  LESSONS.length=0;
  for(var i=0;i<12;i++){ var m=Object.create(pool[i%pool.length]); m.key='ph-'+i; m.title=pool[i%pool.length].title; m.q=pool[i%pool.length].q||'What does this map want?'; m.debrief=undefined;
    if(i<9){ m.act=Math.floor(i/3)+1; m.slot=i%3+1; } else { m.daily=i-8; } LESSONS.push(m); }
})();
var SHIP_ACTS=[{line:'Placeholder: what act 1 was.'},{line:'Placeholder: what act 2 was.'},{line:'Placeholder: what act 3 was.'}];
