async function loadJson(path){try{const r=await fetch(path,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}}
export async function hydrateCoachData(world){
  if(!world?.clubs?.length)return[];
  try{
    const [basePayload,overridePayload]=await Promise.all([loadJson('./data/coaches.json'),loadJson('./data/coach-overrides.json')]);
    const base=Array.isArray(basePayload)?basePayload:(basePayload?.records||[]),overrides=Array.isArray(overridePayload)?overridePayload:(overridePayload?.records||[]);
    const map=new Map(base.map(r=>[String(r.clubId||r.club_id||''),r]));
    for(const row of overrides)if(row?.clubId)map.set(String(row.clubId),{...(map.get(String(row.clubId))||{}),...row});
    const records=[...map.values()];
    for(const club of world.clubs){
      const row=map.get(String(club.id));if(!row?.name)continue;
      club.coachName=row.name;club.coachImage=row.image||row.imageUrl||club.coachImage||'';club.coachContractUntil=row.contractUntil||row.contract_expiration_date||club.coachContractUntil||'';club.coachSource=row.source||'coach-datapack';
    }
    world.coaches=records;return records;
  }catch(error){console.warn('Coach datapack unavailable',error);return[]}
}
