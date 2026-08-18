import {WorldDatabase} from './world.js';
const FLAG=Symbol.for('club-dynasty-player-extra-v2');
if(!WorldDatabase.prototype[FLAG]){
  WorldDatabase.prototype[FLAG]=true;
  const original=WorldDatabase.prototype.ensurePlayers;
  WorldDatabase.prototype.ensurePlayers=async function(...args){
    const players=await original.apply(this,args);
    try{
      const response=await fetch('./data/players.json',{cache:'no-store'});if(!response.ok)return players;
      const payload=await response.json(),rows=payload.players||[],map=new Map(rows.map(r=>[String(r.id),r]));
      for(const p of players||[]){const row=map.get(String(p.id));if(!row)continue;
        p.agentName=row.agentName||p.agentName||'';p.joinedOn=row.joinedOn||p.joinedOn||'';p.signedFrom=row.signedFrom||p.signedFrom||'';p.lastTransferFee=Number(row.lastTransferFee)||0;p.lastTransferDate=row.lastTransferDate||'';p.lastTransferFromId=row.lastTransferFromId||'';p.lastTransferFrom=row.lastTransferFrom||'';p.lastTransferToId=row.lastTransferToId||'';p.lastTransferTo=row.lastTransferTo||'';p.liveSquadCheckedAt=row.liveSquadCheckedAt||'';
        if(Number.isFinite(Number(row.age))&&Number(row.age)>0)p.age=Number(row.age);if(row.birthDate)p.dateOfBirth=row.birthDate;
        if(Number(row.value)>0)p.marketValue=Number(row.value);if(row.contractUntil)p.contractExpiration=row.contractUntil;if(row.agentName)p.agentName=row.agentName;
        if(row.clubId){p.currentClubId=String(row.clubId);p.currentClubName=row.club||p.currentClubName}
        if(Number(row.overall)>0)p.overall=Number(row.overall);if(Number(row.potential)>0)p.potential=Number(row.potential);
      }
      this.dataMeta=payload.meta||this.dataMeta||{};
    }catch(error){console.warn('Player metadata enrichment unavailable',error)}
    return players;
  }
}
