import {processPlayerMatch,recoverAndDevelop} from './player-career.js';
import {simulateWorldTick} from './world-sim.js';
import {processKnockoutResult,nationalTeamWorldNews} from './competition-engine.js';

export function runPostMatchExtra(save,world,club,fixture,result,matchSquad,fullSquad){
 const playerEvents=processPlayerMatch(save,result,fixture,matchSquad);
 recoverAndDevelop(save,fullSquad,fixture.date,save.facilities?.training||5,result.coachProfile?.youthDevelopment||60);
 const competitionEvent=processKnockoutResult(save,fixture,result,club);
 const worldEvents=simulateWorldTick(save,world,fixture.date,club.id);
 nationalTeamWorldNews(save,fixture.date);
 result.playerEvents=playerEvents;
 result.worldEvents=worldEvents;
 result.competitionEvent=competitionEvent;
 return{playerEvents,worldEvents,competitionEvent};
}
