import './player-extra-data.js';
import './roster-integrity.js';
import {installButtonUX} from './button-ux.js';
import {state,persist} from './state.js';
installButtonUX();
async function loadJson(path){try{const r=await fetch(path,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}}
function fallbackCoach(club){const named=(club?.coach||club?.coachName||'').trim();if(named)return{name:named,source:'club-datapack-fallback'};return{name:`Comissão técnica interina — ${club?.name||'clube'}`,source:'interim-fallback'}}
function syncOriginalCareerCoach(world){const save=state.save,club=world?.findClub?.(save?.clubId);if(!save?.coach||!club?.coachName||save.coach.original===false)return false;let changed=false;if(save.coach.name!==club.coachName){save.coach.name=club.coachName;changed=true}if(club.coachContractUntil&&save.coach.contractUntil!==club.coachContractUntil){save.coach.contractUntil=club.coachContractUntil;changed=true}if(club.coachImage&&save.coach.image!==club.coachImage){save.coach.image=club.coachImage;changed=true}if(save.coach.status!==club.coachStatus){save.coach.status=club.coachStatus||'EMPLOYED';changed=true}if(changed){save.coach.original=true;save.coach.dataSource=club.coachSource||'current-coach-datapack';persist()}return changed}
export async function hydrateCoachData(world){
 if(!world?.clubs?.length)return[];
 try{
  const [basePayload,overridePayload]=await Promise.all([loadJson('./data/coaches.json'),loadJson('./data/coach-overrides.json')]);
  const base=Array.isArray(basePayload)?basePayload:(basePayload?.records||[]),overrides=Array.isArray(overridePayload)?overridePayload:(overridePayload?.records||[]),map=new Map(base.map(r=>[String(r.clubId||r.club_id||''),r]));
  for(const row of overrides)if(row?.clubId)map.set(String(row.clubId),{...(map.get(String(row.clubId))||{}),...row});
  const records=[];
  for(const club of world.clubs){const row=map.get(String(club.id)),resolved=row?.name?row:fallbackCoach(club);club.coachName=resolved.name;club.coachImage=resolved.image||resolved.imageUrl||club.coachImage||'';club.coachContractUntil=resolved.contractUntil||resolved.contract_expiration_date||club.coachContractUntil||'';club.coachStatus=resolved.status||(/interim|caretaker|interino/i.test(resolved.role||resolved.name||'')?'INTERIM':'EMPLOYED');club.coachSource=resolved.source||'current-coach-datapack';records.push({clubId:String(club.id),club:club.name,name:club.coachName,status:club.coachStatus,source:club.coachSource})}
  world.coaches=records;syncOriginalCareerCoach(world);return records;
 }catch(error){console.warn('Coach datapack unavailable',error);for(const club of world.clubs){const r=fallbackCoach(club);club.coachName=r.name;club.coachStatus=r.source==='interim-fallback'?'INTERIM':'EMPLOYED';club.coachSource=r.source}syncOriginalCareerCoach(world);return world.clubs.map(c=>({clubId:String(c.id),club:c.name,name:c.coachName,status:c.coachStatus,source:c.coachSource}))}
}
