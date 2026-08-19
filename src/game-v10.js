import * as core from './game-v9.js';
import {prepareAutonomousSquad} from './coach-autonomy.js';
export * from './game-v9.js';
export function simulateFixture(args){const prepared=prepareAutonomousSquad(args?.save,args?.squad||[],args?.fixture,args?.nextFixture);const result=core.simulateFixture({...args,squad:prepared.players});result.coachAutonomyPolicy=prepared.policy;if(prepared.policy&&result.plan){result.plan.autonomyPolicy=prepared.policy;if(prepared.policy.protectedCount>0)result.plan.reason=`${result.plan.reason} ${prepared.policy.message}`}return result}
