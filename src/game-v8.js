import * as core from './game-v7.js';
import {enrichPossessionDetails} from './match-possession.js';
import {applyPresidentLineup,FORMATION_NAMES} from './lineup-state.js';
export * from './game-v7.js';
export function simulateFixture(args){
 let result=core.simulateFixture(args),override=args?.save?.presidentLineup;
 if(override?.enabled&&FORMATION_NAMES.includes(override.formation)){
   const selected=override.formation;
   if(result.plan?.preferredFormation!==selected||!result.plan?.presidentOverride){const manual=applyPresidentLineup(result.plan,args?.squad||[],override);if(manual){result.plan=manual;result.manualLineupApplied=true}}
   result.selectedFormation=selected;if(result.plan)result.plan.preferredFormation=selected;
 }else result.selectedFormation=result.plan?.preferredFormation||'4-3-3';
 return enrichPossessionDetails(result,args)
}
