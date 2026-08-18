export async function hydrateCoachData(world){
  if(!world?.clubs?.length)return [];
  try{
    const response=await fetch('./data/coaches.json',{cache:'no-store'});
    if(!response.ok)return [];
    const payload=await response.json();
    const records=Array.isArray(payload)?payload:(payload.records||[]);
    const map=new Map(records.map(r=>[String(r.clubId||r.club_id||''),r]));
    for(const club of world.clubs){
      const row=map.get(String(club.id));
      if(!row?.name)continue;
      club.coachName=row.name;
      club.coachImage=row.image||row.imageUrl||'';
      club.coachContractUntil=row.contractUntil||row.contract_expiration_date||'';
      club.coachSource=row.source||'coach-datapack';
    }
    world.coaches=records;
    return records;
  }catch(error){
    console.warn('Coach datapack unavailable',error);
    return [];
  }
}
