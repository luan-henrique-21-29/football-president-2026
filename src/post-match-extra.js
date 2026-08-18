import {processPlayerMatch,recoverAndDevelop} from './player-career.js';
import {simulateWorldTick} from './world-sim.js';
import {processKnockoutResult,nationalTeamWorldNews} from './competition-engine.js';
import {ensureBoardState,sponsorMonthlyPayment,financialCompliance} from './board-engine.js';

function repairNonLeagueSummary(save,fixture,result){
 if(fixture.type==='LEAGUE'||!save.table)return false;
 const t=save.table;
 t.played=Math.max(0,(t.played||0)-1);
 t.gf=Math.max(0,(t.gf||0)-(result.gf||0));
 t.ga=Math.max(0,(t.ga||0)-(result.ga||0));
 if(result.gf>result.ga)t.wins=Math.max(0,(t.wins||0)-1);
 else if(result.gf===result.ga){t.draws=Math.max(0,(t.draws||0)-1);t.points=Math.max(0,(t.points||0)-1)}
 else t.losses=Math.max(0,(t.losses||0)-1);
 if(result.gf>result.ga)t.points=Math.max(0,(t.points||0)-3);
 return true;
}

export function runPostMatchExtra(save,world,club,fixture,result,matchSquad,fullSquad){
 ensureBoardState(save,club);
 repairNonLeagueSummary(save,fixture,result);
 const playerEvents=processPlayerMatch(save,result,fixture,matchSquad);
 recoverAndDevelop(save,fullSquad,fixture.date,save.facilities?.training||5,result.coachProfile?.youthDevelopment||60);
 const competitionEvent=processKnockoutResult(save,fixture,result,club);
 const worldEvents=save.plan2LastWorldTick===fixture.date?[]:simulateWorldTick(save,world,fixture.date,club.id);
 save.plan2LastWorldTick=fixture.date;
 const sponsorPayment=sponsorMonthlyPayment(save,fixture.date);
 const financial=financialCompliance(save);
 if(financial.status==='BREACH_RISK'&&!save.board.lastFinancialWarningMonth?.startsWith(fixture.date.slice(0,7))){
   save.board.lastFinancialWarningMonth=fixture.date.slice(0,7);
   save.boardTrust=Math.max(0,(save.boardTrust||60)-3);
   save.news.unshift({date:fixture.date,title:'Alerta de sustentabilidade financeira',body:'O conselho exige redução de perdas, dívida ou gastos para evitar uma crise financeira.'});
 }
 nationalTeamWorldNews(save,fixture.date);
 result.playerEvents=playerEvents;result.worldEvents=worldEvents;result.competitionEvent=competitionEvent;
 return{playerEvents,worldEvents,competitionEvent,sponsorPayment,financial};
}
