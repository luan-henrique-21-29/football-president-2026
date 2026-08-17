import {bind as coreBind} from './actions-master.js';
import {state,currentClub,persist} from './state.js';
import {canJoin,switchClub} from './job-engine.js';

export function bind(render){
 coreBind(render);
 document.querySelectorAll('[data-job-club]').forEach(el=>el.onclick=()=>applyForJob(el.dataset.jobClub,render));
}
function preserveOldClubTransfers(){
 const old=currentClub();if(!old||!state.world.players)return;
 state.save.worldPlayerMoves??={};
 for(const id of state.save.acquiredPlayerIds||[]){const p=state.world.players.find(x=>String(x.id)===String(id));if(!p)continue;p.currentClubId=String(old.id);p.currentClubName=old.name;state.save.worldPlayerMoves[id]={clubId:String(old.id),clubName:old.name,date:state.save.date,fee:0,fromClub:'user-transfer-history'}}
 const alternatives=state.world.clubs.filter(c=>String(c.id)!==String(old.id));
 for(const id of state.save.soldPlayerIds||[]){const p=state.world.players.find(x=>String(x.id)===String(id));if(!p||!alternatives.length)continue;const target=alternatives[Math.floor(Math.random()*alternatives.length)];p.currentClubId=String(target.id);p.currentClubName=target.name;state.save.worldPlayerMoves[id]={clubId:String(target.id),clubName:target.name,date:state.save.date,fee:0,fromClub:old.name}}
}
function applyForJob(clubId,render){
 const club=state.world.findClub(clubId);if(!club)return;
 const decision=canJoin(state.save,club);
 if(!confirm(`Conversar com o ${club.name}? O clube exige reputação aproximada ${decision.need}.`))return;
 if(!decision.accepted){state.save.news.unshift({date:state.save.date,title:`${club.name} encerra conversa`,body:'O conselho optou por outro perfil de presidente neste momento.'});state.save.presidentStats.reputation=Math.max(0,(state.save.presidentStats.reputation||50)-1);persist();render();return}
 preserveOldClubTransfers();
 switchClub(state.save,club,state.world,state.save.date);
 state.save.presidentStats.reputation=Math.min(100,(state.save.presidentStats.reputation||50)+1);
 persist();state.page='dashboard';state.selectedMarketPlayerId=null;state.selectedSquadPlayerId=null;render();
}
