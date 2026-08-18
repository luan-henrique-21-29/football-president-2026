export function applyRuntimeClubMetrics(world){
  if(!world?.clubs?.length||typeof window==='undefined')return false;
  const metrics=window.__cdClubMetrics||{};
  let changed=false;
  for(const club of world.clubs){
    const m=metrics[String(club.id)];
    if(!m)continue;
    const overall=Number(m.overall)||0,totalValue=Number(m.totalValue)||0,budgetBase=Number(m.budgetBase)||0;
    if(overall&&club.teamOverall!==overall){club.teamOverall=overall;club.reputation=Math.min(99,overall+5);changed=true;}
    if(totalValue&&club.marketValue!==totalValue){club.marketValue=totalValue;changed=true;}
    if(budgetBase&&club.budgetBase!==budgetBase){club.budgetBase=budgetBase;changed=true;}
  }
  return changed;
}

export function runtimeClubOverall(club){
  if(!club)return 72;
  const m=typeof window!=='undefined'?window.__cdClubMetrics?.[String(club.id)]:null;
  return Number(m?.overall)||Number(club.teamOverall)||72;
}

export function runtimeClubBudget(club){
  if(!club)return 8_000_000;
  const m=typeof window!=='undefined'?window.__cdClubMetrics?.[String(club.id)]:null;
  if(Number(m?.budgetBase)>0)return Number(m.budgetBase);
  if(Number(club.budgetBase)>0)return Number(club.budgetBase);
  const mv=Number(club.marketValue)||0;
  return Math.max(8_000_000,Math.round((mv>0?mv*.18:8_000_000)/100000)*100000);
}
