import {movementFor,applyMovement,startNewLeagueSeason,userPosition,ensureLeagueState} from './league-engine.js';
import {unlock,achievementChecks} from './career-systems.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function finishSeasonAdvanced(save,club,world){
 if(save.nextFixtureIndex<save.calendar.length)return null;
 ensureLeagueState(save,club,world);
 const position=userPosition(save,club.id)||Math.max(1,Math.round((1-(save.table.points/Math.max(1,save.table.played*3)))*18+1));
 const move=movementFor(save,club),champion=position===1;
 save.seasonHistory??=[];save.presidentStats??={seasons:0,titles:0,reputation:50};save.trophies??=[];
 save.seasonHistory.push({season:save.season,club:club.name,league:club.league,position,played:save.table.played,wins:save.table.wins,draws:save.table.draws,losses:save.table.losses,gf:save.table.gf,ga:save.table.ga,points:save.table.points,coach:save.coach.name,cash:save.cash,movement:move.type});
 save.presidentStats.seasons++;
 if(champion){save.presidentStats.titles++;save.trophies.push({season:save.season,name:club.league});save.presidentStats.reputation=clamp((save.presidentStats.reputation||50)+6,0,100);unlock(save,'Campeão Nacional');if(save.presidentStats.titles===2)unlock(save,'Bicampeão');if(save.presidentStats.titles===3)unlock(save,'Tricampeão')}
 if(move.type.startsWith('PROMOTED')){unlock(save,'Promovido');if(save.seasonHistory.some(x=>x.movement?.startsWith('PROMOTED')))unlock(save,'Da Segunda ao Topo');save.fanTrust=clamp((save.fanTrust||60)+10,0,100)}
 if(move.type==='RELEGATED'){save.fanTrust=clamp((save.fanTrust||60)-16,0,100);save.boardTrust=clamp((save.boardTrust||60)-14,0,100);save.presidentStats.reputation=clamp((save.presidentStats.reputation||50)-7,0,100)}
 let nextClub=applyMovement(save,club,world,move);
 const oldYear=Number(String(save.season).slice(0,4))||2026,newYear=oldYear+1;
 save.season=`${newYear}/${String(newYear+1).slice(-2)}`;save.seasonNo=(save.seasonNo||1)+1;save.date=`${newYear}-08-14`;
 startNewLeagueSeason(save,nextClub,world,`${newYear}-08-15`);
 save.news.unshift({date:save.date,title:'Nova temporada',body:`${save.season} começa após o ${position}º lugar na temporada anterior.${move.type==='STAY'?'':` Movimento de divisão: ${move.type}.`}`});
 achievementChecks(save);return{position,champion,movement:move.type,newLeague:nextClub.league};
}
