/* Deterministic maths (2026-11-17). iPhone Safari (JavaScriptCore) and Node (V8) round Math.sin, Math.pow and Math.exp differently in the
   last bit, and a race makes thousands of those calls, so a run replayed on the leaderboard server could end in a different state from the
   phone that ran it. These versions use only + - * /, Math.round, Math.floor and Math.sqrt, which IEEE 754 makes identical on every engine.
   build.mjs points the simulation's sin, cos, pow, exp, log and asin here, and fails if any other inexact Math function is left in it.
   Accuracy is a few units in the last place for the arguments the game uses; what matters is that every engine gets the same bits. */
var DM=(function(){
  function pow2(k){ var r=1,b=k<0?0.5:2,n=k<0?-k:k; while(n>0){ if(n&1){ r*=b; } b*=b; n=Math.floor(n/2); } return r; }
  var LN2HI=6.93147180369123816490e-01,LN2LO=1.90821492927058770002e-10,INVLN2=1.44269504088896338700e+00;
  var PIO2_1=1.57079632673412561417e+00,PIO2_2=6.07710050630396597660e-11,PIO2_3=2.02226624879595063154e-21,TWOOPI=6.36619772367581382433e-01;
  var PIO2=1.57079632679489661923,SQRT2=1.4142135623730951,T64=pow2(64),I64=pow2(-64);
  function exp(x){
    if(x!==x){ return x; } if(x>709.8){ return Infinity; } if(x<-745.2){ return 0; } if(x===0){ return 1; }
    var k=Math.round(x*INVLN2),r=(x-k*LN2HI)-k*LN2LO;  /* |r| <= ln2/2 */
    var p=1+r/13; p=1+r/12*p; p=1+r/11*p; p=1+r/10*p; p=1+r/9*p; p=1+r/8*p; p=1+r/7*p; p=1+r/6*p; p=1+r/5*p; p=1+r/4*p; p=1+r/3*p; p=1+r/2*p; p=1+r*p;
    var h=k<0?-Math.floor(-k/2):Math.floor(k/2);
    return p*pow2(h)*pow2(k-h);
  }
  function log(x){
    if(x!==x||x<0){ return NaN; } if(x===0){ return -Infinity; } if(x===Infinity){ return x; }
    var e=0,m=x;
    while(m>=T64){ m*=I64; e+=64; } while(m<I64){ m*=T64; e-=64; }
    while(m>=2){ m*=0.5; e++; } while(m<1){ m*=2; e--; }
    if(m>SQRT2){ m*=0.5; e++; }
    var s=(m-1)/(m+1),z=s*s,q=1/25;  /* ln m = 2 atanh s, |s| <= 0.172 */
    for(var n=11;n>=0;n--){ q=1/(2*n+1)+z*q; }
    return e*LN2HI+(e*LN2LO+2*s*q);
  }
  function pow(a,b){
    if(b===0||a===1){ return 1; } if(b===1){ return a; } if(a!==a||b!==b){ return NaN; }
    if(a===0){ return b>0?0:Infinity; } if(a===Infinity){ return b>0?Infinity:0; }
    if(a<0){ if(Math.floor(b)!==b){ return NaN; } var r=exp(b*log(-a)); return b%2!==0?-r:r; }
    return exp(b*log(a));
  }
  function ksin(r){ var z=r*r; return r*(1-z/6*(1-z/20*(1-z/42*(1-z/72*(1-z/110*(1-z/156*(1-z/210*(1-z/272)))))))); }
  function kcos(r){ var z=r*r; return 1-z/2*(1-z/12*(1-z/30*(1-z/56*(1-z/90*(1-z/132*(1-z/182*(1-z/240*(1-z/306)))))))); }
  function trig(x,c){  /* x reduced by pi/2 to |r| <= pi/4; c=1 for cos */
    if(x!==x||x===Infinity||x===-Infinity){ return NaN; }
    var k=Math.round(x*TWOOPI),r=((x-k*PIO2_1)-k*PIO2_2)-k*PIO2_3,n=((k+c)%4+4)%4;
    return n===0?ksin(r):n===1?kcos(r):n===2?-ksin(r):-kcos(r);
  }
  function sin(x){ return x===0?x:trig(x,0); }
  function cos(x){ return trig(x,1); }
  function asinS(x){ var z=x*x,c=1,t=x,s=x; for(var n=0;n<30;n++){ c=c*(2*n+1)*(2*n+1)/((2*n+2)*(2*n+3)); t*=z; s+=c*t; } return s; }  /* |x| <= 1/2 */
  function asin(x){
    if(!(x>=-1&&x<=1)){ return NaN; }
    var a=x<0?-x:x,r=a<=0.5?asinS(a):PIO2-2*asinS(Math.sqrt((1-a)/2));
    return x<0?-r:r;
  }
  return {exp:exp,log:log,pow:pow,sin:sin,cos:cos,asin:asin};
})();
