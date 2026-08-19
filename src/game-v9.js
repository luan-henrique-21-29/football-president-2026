import * as core from './game-v8.js';
import {buildMatchInjuryEvents} from './injury-engine.js';
export * from './game-v8.js';
export function simulateFixture(args){const result=core.simulateFixture(args),injuries=buildMatchInjuryEvents({save:args?.save,fixture:args?.fixture,result});result.injuryEvents=injuries;if(injuries.length){result.timeline=[...(result.timeline||[]),...injuries].sort((a,b)=>Number(a.minute||0)-Number(b.minute||0)||((a.type==='FULL'?1:0)-(b.type==='FULL'?1:0)))}return result}
