import {formationSlots,assignPlayersToFormation,positionFit,effectiveOverall,fitLabel} from './lineup-state.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function available(players,save,fixture){const date=fixture?.date||save?.date||'2026-08-19',inj=save?.playerCareer||{};return (players||[]).filter(p=>{const s=inj?.[p.id];return !(s?.injuryUntil&&String(s.injuryUntil)>String(date))})}
function benchScore(p){return Number(p?.overall||0)*5+Number(p?.starterPriority||0)+(p?.realLifeStarter?10:0)+Number(p?.form??70)*.08+Number(p?.energy??100)*.03}
export function exactCoachSelection(basePlan,players,{save=null,fixture=null}={}){
 const pool=available(players,save,fixture),formation=basePlan?.preferredFormation||'4-3-3',slots=formationSlots(formation),preferred=(basePlan?.starters||[]).map(p=>String(p.id)),assignments=assignPlayersToFormation(pool,formation,preferred,{rotation:Number(basePlan?.rotation||0)}),byId=new Map(pool.map(p=>[String(p.id),p])),used=new Set(),starters=[];
 for(let i=0;i<slots.length;i++){
  const [key,slot]=slots[i],id=assignments.find(a=>a.key===key)?.playerId,p=id?byId.get(String(id)):null;if(!p)continue;used.add(String(p.id));const fit=positionFit(p,slot),effective=effectiveOverall(p,slot);starters.push({...p,originalOverall:Number(p.overall||65),overall:effective,assignedSlot:slot,slotKey:key,positionFit:fit,positionFitLabel:fitLabel(fit)});
 }
 if(starters.length<11)return basePlan;
 const bench=pool.filter(p=>!used.has(String(p.id))).sort((a,b)=>benchScore(b)-benchScore(a)).slice(0,12).map(p=>({...p})),lineupOverall=Math.round(starters.reduce((s,p)=>s+Number(p.overall||65),0)/11),fitAverage=starters.reduce((s,p)=>s+Number(p.positionFit||1),0)/11;
 return{...(basePlan||{}),starters,bench,lineupOverall,fitAverage:clamp(fitAverage,0,1),preferredFormation:formation,selectionSource:'EXACT_NATURAL_POSITION',reason:`${basePlan?.reason||'Escalação do treinador.'} Prioridade por posição natural e OVR dentro de cada função.`};
}
export function overrideFromExactPlan(plan){return{enabled:true,formation:plan?.preferredFormation||'4-3-3',source:'COACH_EXACT_POSITION',updatedAt:new Date().toISOString(),slots:(plan?.starters||[]).map(p=>({key:p.slotKey,slot:p.assignedSlot,playerId:String(p.id)})).filter(x=>x.key&&x.playerId)}}
