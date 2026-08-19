const FORMATIONS=new Set(['4-3-3','4-2-3-1','4-4-2','4-1-4-1','3-4-2-1','3-5-2','4-3-1-2','5-3-2']);
const arrays=['calendar','matches','news','transactions','acquiredPlayerIds','soldPlayerIds','loans','achievements','youth','playerDemands','transferInbox','transferListed','loanListed','coachHistory','worldFreeCoaches','worldNews','pendingDecisions'];
const objects=['playerContracts','playerState','playerCareer','worldPlayerMoves','worldContractOverrides','worldCoachOverrides','aiClubs'];
const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
export function repairCareerSave(save){
 if(!save||typeof save!=='object')return{changed:false,issues:[]};
 let changed=false;const issues=[];const fix=(msg)=>{changed=true;issues.push(msg)};
 for(const key of arrays)if(!Array.isArray(save[key])){save[key]=[];fix(key)}
 for(const key of objects)if(!save[key]||typeof save[key]!=='object'||Array.isArray(save[key])){save[key]={};fix(key)}
 if(!save.table||typeof save.table!=='object'){save.table={played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0};fix('table')}
 for(const key of ['played','wins','draws','losses','gf','ga','points'])if(!Number.isFinite(Number(save.table[key]))){save.table[key]=0;fix(`table.${key}`)}
 if(!save.settings||typeof save.settings!=='object'){save.settings={currency:'EUR',language:'pt-BR',sound:true,volume:.7,matchSpeed:1,americanPyramid:false};fix('settings')}
 if(!save.president||typeof save.president!=='object'){save.president={name:'Presidente',nationality:'Brasil',style:'Personalizado',reputation:50};fix('president')}
 if(!save.coach||typeof save.coach!=='object'){save.coach={name:'Comissão técnica interina',original:true,status:'INTERIM',reputation:70};fix('coach')}
 if(!String(save.coach.name||'').trim()){save.coach.name='Comissão técnica interina';save.coach.status='INTERIM';fix('coach.name')}
 if(!save.worldTransferMarket||typeof save.worldTransferMarket!=='object'){save.worldTransferMarket={negotiations:[],completed:[],failed:[]};fix('worldTransferMarket')}
 for(const key of ['negotiations','completed','failed'])if(!Array.isArray(save.worldTransferMarket[key])){save.worldTransferMarket[key]=[];fix(`worldTransferMarket.${key}`)}
 save.clubId=String(save.clubId||save.clubSnapshot?.id||'');
 save.clubName=String(save.clubName||save.clubSnapshot?.name||'Clube');
 save.nextFixtureIndex=Math.max(0,Math.min(save.calendar.length,Math.floor(finite(save.nextFixtureIndex,0))));
 save.cash=finite(save.cash,0);save.transferBudget=Math.max(0,finite(save.transferBudget,0));save.wageBudgetWeekly=Math.max(0,finite(save.wageBudgetWeekly,0));
 save.boardTrust=Math.max(0,Math.min(100,finite(save.boardTrust,70)));save.fanTrust=Math.max(0,Math.min(100,finite(save.fanTrust,70)));
 save.acquiredPlayerIds=[...new Set(save.acquiredPlayerIds.map(String).filter(Boolean))];save.soldPlayerIds=[...new Set(save.soldPlayerIds.map(String).filter(Boolean))];
 if(save.presidentLineup){
   const o=save.presidentLineup;
   if(!FORMATIONS.has(o.formation)||!Array.isArray(o.slots)){save.presidentLineup={enabled:false,formation:'4-3-3',slots:[],source:'REPAIRED'};fix('presidentLineup')}
   else{
     const seen=new Set();o.slots=o.slots.filter(s=>s&&s.key).map(s=>({...s,playerId:s.playerId==null?null:String(s.playerId)})).filter(s=>{if(!s.playerId)return true;if(seen.has(s.playerId))return false;seen.add(s.playerId);return true});
     if(o.enabled&&o.slots.filter(s=>s.playerId).length<11){o.enabled=false;fix('presidentLineup.enabled')}
   }
 }
 if(!/^20\d{2}-\d{2}-\d{2}$/.test(String(save.date||''))){save.date=String(save.databaseSnapshot||'2026-08-19');fix('date')}
 save.version=Math.max(6,finite(save.version,0));
 return{changed,issues};
}
