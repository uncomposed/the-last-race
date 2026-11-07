/* PLACEHOLDERS for any place ship/maps.js has not filled yet: existing maps stand in so the shell can be walked end to end. Does nothing once all 12 are in. */
(function(){
  var base=LESSONS.filter(function(m){ return !m.act&&!m.daily; }),te=base.filter(function(m){ return m.key==='two-endings'; })[0],pool=[te].concat(base.filter(function(m){ return m!==te; })),n=0;
  function has(i){ return LESSONS.some(function(m){ return i<9?(m.act===Math.floor(i/3)+1&&m.slot===i%3+1):m.daily===i-8; }); }
  for(var i=0;i<12;i++){ if(has(i)){ continue; } var p=pool[n++%pool.length],m=Object.create(p); m.key='ph-'+i; m.title=p.title; m.q=p.q||'What does this map want?'; m.debrief=undefined;
    if(i<9){ m.act=Math.floor(i/3)+1; m.slot=i%3+1; } else { m.daily=i-8; } LESSONS.push(m); }
})();
if(typeof SHIP_ACTS==='undefined'){ var SHIP_ACTS=[{line:'Each road wanted a different build, and none told you which.'},{line:'The other labs and a road that changed set your pace more than you did.'},{line:'You spent what you could afford, and you could not know which ending you were in.'}]; }
