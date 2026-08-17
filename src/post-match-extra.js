import {processPlayerMatch,recoverAndDevelop} from './player-career.js';
import {simulateWorldTick} from './world-sim.js';

export function runPostMatchExtra(save,world,club,fixture,result,matchSquad,fullSquad){
 const playerEvents=processPlayerMatch(save,result,fixture,matchSquad);
 recoverAndDevelop(save,fullSquad,fixture.date,save.facilities?.training||5,result.coachProfile?.youthDevelopment||60);
 const worldEvents=simulateWorldTick(save,world,fixture.date,club.id);
 result.playerEvents=playerEvents;
 result.worldEvents=worldEvents;
 return{playerEvents,worldEvents};
}
