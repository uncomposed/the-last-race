import {readFileSync} from 'node:fs';
export const fl=f=>readFileSync(f,'utf8').trim().split('\n').map(l=>JSON.parse(l));
export function fs(r){const R=['ALL','SG','SP'];const n=r.n*3,t=k=>R.reduce((a,x)=>a+r.w[x][k],0);const F=t('follower'),T=t('twin'),ru=t('rush'),bo=t('bold');const fo=Math.max(ru,bo);
 return {n,F,T,ru,bo,diff:(F-fo)/n,dtw:(F-T)/n,rate:F/n,pass:(F-fo)/n>=0.15&&(F-T)/n>=0.10&&F/n>=0.2};}
