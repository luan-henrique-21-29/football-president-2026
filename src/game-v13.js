import * as core from './game-v12.js';
import {exactCoachSelection,overrideFromExactPlan} from './exact-lineup.js';
export * from './game-v12.js';

export function coachSelection(squad,fixture,nextFixture,teamOverall,coach={}){
 const base=core.coachSelection(squad,fixture,nextFixture,teamOverall,coach);
 return exactCoachSelection(base,squad,{fixture});
}

export function simulateFixture(args={}){
 const actualManual=!!args?.save?.presidentLineup?.enabled;
 if(actualManual)return core.simulateFixture(args);
 const squad=args?.squad||[];
 if(squad.length<11)return core.simulateFixture(args);
 const overall=core.calculateTeamOverall(squad),base=core.coachSelection(squad,args.fixture,args.nextFixture,overall,args?.save?.coach||{}),exact=exactCoachSelection(base,squad,{save:args.save,fixture:args.fixture}),override=overrideFromExactPlan(exact);
 if((override.slots||[]).length<11)return core.simulateFixture(args);
 const tempSave={...(args.save||{}),presidentLineup:override,coachAutonomy:{...(args?.save?.coachAutonomy||{}),oneMatchPresidentOverride:false}};
 const result=core.simulateFixture({...args,save:tempSave});
 if(result?.plan){result.plan.presidentOverride=false;result.plan.manualFormation=null;result.plan.selectionSource='EXACT_NATURAL_POSITION';result.plan.reason=exact.reason;result.plan.fitAverage=exact.fitAverage;result.plan.preferredFormation=exact.preferredFormation}
 result.manualLineupApplied=false;result.selectedFormation=exact.preferredFormation;result.exactPositionSelection=true;return result;
}
