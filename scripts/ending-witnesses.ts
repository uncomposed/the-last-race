import type { Strategy } from './campaign-witnesses.js';
export const endingWitnesses: Array<{ending:string; seed:string; strategy:Strategy}> = [
 {ending:'left-behind',seed:'campaign:0',strategy:'overbuild'},
 {ending:'coordinated-slowdown',seed:'campaign:0',strategy:'idle'},
 {ending:'multipolar-balance',seed:'campaign:0',strategy:'balance'},
 {ending:'loss-of-control',seed:'campaign:0',strategy:'race'},
 {ending:'failed-slowdown',seed:'campaign:0',strategy:'defect'},
 {ending:'safe-lead',seed:'campaign:3',strategy:'safe'},
 {ending:'verification-broken',seed:'campaign:3',strategy:'paradigm'},
 {ending:'winner-takes-all',seed:'campaign:41',strategy:'race'},
];
