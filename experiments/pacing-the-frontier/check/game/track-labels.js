/* phones: labels on the track are held to the end of the frame, then placed so none sits on another or runs off the screen. Your lab's name goes first and does not move.
   Page code only: it runs in draw, outside the simulation. Desktop never comes here. */
var lblQ=null,lblLab=0;
function lblBegin(){ if(!CM){ return; } lblQ=[]; ctx.fillText=function(s,x,y){ lblQ.push({s:s,x:x,y:y,lab:lblLab,fill:ctx.fillStyle,font:ctx.font,al:ctx.globalAlpha,ta:ctx.textAlign}); }; }
function lblEnd(VW,U){
  if(!lblQ){ return; }
  delete ctx.fillText;
  var q=lblQ,done=[],LH=12*U,top=(HUDH-GY*(1-Z))/Z+LH,bot=(H-GY*(1-Z))/Z-U*2,i,j,k,a,w,x,y,t;
  lblQ=null;
  function free(x,y,w){ for(var n=0;n<done.length;n++){ var d=done[n]; if(x<d.x+d.w&&x+w>d.x&&y-LH<d.y&&y>d.y-LH){ return false; } } return true; }
  q.sort(function(p,r){ return r.lab-p.lab; });  /* stable: your name 2, rivals' names 1, the rest in drawn order */
  ctx.save(); ctx.textAlign='left'; ctx.lineJoin='round'; ctx.lineWidth=3*U; ctx.strokeStyle=COL.surface;
  for(i=0;i<q.length;i++){
    a=q[i]; ctx.font=a.font; w=ctx.measureText(a.s).width;
    if(w>VW-4*U&&a.s.lastIndexOf(' \u00b7 ')>0){ a.s=a.s.slice(0,a.s.lastIndexOf(' \u00b7 ')); w=ctx.measureText(a.s).width; }  /* too wide for the screen: drop the last part, which the box's own label repeats */
    x=a.ta==='right'?a.x-w:a.ta==='center'?a.x-w/2:a.x;
    if(x>VW||x+w<0){ continue; }  /* off screen: nothing to draw */
    if(a.s.length>1){ x=Math.max(2*U,Math.min(x,VW-w-2*U)); }
    y=a.y;
    if(a.s.length>1&&a.lab!==2){ for(j=0;j<14;j++){ k=(j%2?1:-1)*Math.ceil(j/2); t=a.y+k*LH; if(t>=top&&t<=bot&&free(x,t,w)){ y=t; break; } } }
    done.push({x:x,y:y,w:w});
    ctx.globalAlpha=a.al; ctx.strokeText(a.s,x,y); ctx.fillStyle=a.fill; ctx.fillText(a.s,x,y);
  }
  ctx.restore();
}
