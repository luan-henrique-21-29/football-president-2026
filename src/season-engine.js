import {movementFor,applyMovement,startNewLeagueSeason,userPosition,ensureLeagueState} from './league-engine.js';
import {unlock,achievementChecks} from './career-systems.js';
import {continentalFor,injectContinentalFixtures,maybeClubWorldCup} from './competition-engine.js';
import {ensureBoardState,reviewBoard,refreshSponsorOffers} from './board-engine.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function finishSeasonAdvanced(save,club,world){
 if(save.nextFixtureIndex<save.calendar.length)return null;
 ensureLeagueState(save,club,world);ensureBoardState(save,club);
 const position=userPosition(save,club.id)||Math.max(1,Math.round((1-(save.table.points/Math.max(1,save.table.played*3)))*18+1));
 const move=movementFor(save,club),champion=position===1,oldSeason=save.season;
 const cupTitles=(save.competitionState?.titles||[]).filter(t=>t.season===oldSeason),wonNationalCup=cupTitles.some(t=>/FA Cup|Copa del Rey|Coupe de France|Coppa Italia|Copa do Brasil|King's Cup|Open Cup/.test(t.competition));
 const continental=continentalFor(club,position,wonNationalCup),boardReview=reviewBoard(save,club,position,save.date);
 save.seasonHistory??=[];save.presidentStats??={seasons:0,titles:0,reputation:50};save.trophies??=[];
 save.seasonHistory.push({season:oldSeason,club:club.name,league:club.league,position,played:save.table.played,wins:save.table.wins,draws:save.table.draws,losses:save.table.losses,gf:save.table.gf,ga:save.table.ga,points:save.table.points,coach:save.coach.name,cash:save.cash,movement:move.type,continentalQualification:continental?.name||null,boardScore:boardReview.score});
 save.presidentStats.seasons++;
 if(champion){save.presidentStats.titles++;save.trophies.push({season:oldSeason,name:club.league});save.presidentStats.reputation=clamp((save.presidentStats.reputation||50)+6,0,100);unlock(save,'Campeão Nacional');if(save.presidentStats.titles===2)unlock(save,'Bicampeão');if(save.presidentStats.titles===3)unlock(save,'Tricampeão')}
 if((champion||cupTitles.length)&&save.board?.sponsor?.titleBonus){const bonus=save.board.sponsor.titleBonus;save.cash+=bonus;save.transactions.push({date:save.date,type:'Bônus de patrocinador',description:save.board.sponsor.name,amount:bonus});save.news.unshift({date:save.date,title:'Bônus de patrocinador recebido',body:`O título ativa um bônus contratual de €${Math.round(bonus/1e6*10)/10}M.`})}
 if(move.type.startsWith('PROMOTED')){unlock(save,'Promovido');unlock(save,'Da Segunda ao Topo');save.fanTrust=clamp((save.fanTrust||60)+10,0,100)}
 if(move.type==='RELEGATED'){save.fanTrust=clamp((save.fanTrust||60)-16,0,100);save.boardTrust=clamp((save.boardTrust||60)-14,0,100);save.presidentStats.reputation=clamp((save.presidentStats.reputation||50)-7,0,100)}
 if(boardReview.score>=80)save.presidentStats.reputation=clamp((save.presidentStats.reputation||50)+2,0,100);else if(boardReview.score<35)save.presidentStats.reputation=clamp((save.presidentStats.reputation||50)-3,0,100);
 const nextClub=applyMovement(save,club,world,move),oldYear=Number(String(oldSeason).slice(0,4))||2026,newYear=oldYear+1,startDate=`${newYear}-08-15`;
 save.season=`${newYear}/${String(newYear+1).slice(-2)}`;save.seasonNo=(save.seasonNo||1)+1;save.date=`${newYear}-08-14`;save.competitionState={eliminated:[],titles:[],continental:null,nationalCup:null};
 startNewLeagueSeason(save,nextClub,world,startDate);
 if(continental)injectContinentalFixtures(save,nextClub,world,continental,startDate);
 maybeClubWorldCup(save,nextClub,world,startDate);
 save.board.objectives=[];ensureBoardState(save,nextClub);if(save.board.sponsor&&save.seasonNo>save.board.sponsor.endSeasonNo)save.board.sponsor=null;if(!save.board.sponsor)refreshSponsorOffers(save,nextClub,save.date);
 save.news.unshift({date:save.date,title:'Nova temporada',body:`${save.season} começa após o ${position}º lugar. Avaliação do conselho: ${boardReview.score}/100.${move.type==='STAY'?'':` Movimento: ${move.type}.`}${continental?` Classificado para ${continental.name}.`:''}`});
 achievementChecks(save);return{position,champion,movement:move.type,newLeague:nextClub.league,continental:continental?.name||null,boardReview};
}
