import {WorldDatabase} from './world.js';
import {applyRecentTransfers} from './recent-transfers.js';
import {normalizePlayerRatings} from './player-rating.js';
const FLAG=Symbol.for('gcp-player-extra-v5');
function wage(value){return Math.round(Math.max(1200,Math.min(600000,(Number(value)||1000000)*.075/52))/100)*100}
function fromRow(row){const value=Number(row.value)||0;return{id:String(row.id),name:row.name||'',firstName:row.firstName||'',lastName:row.lastName||'',currentClubId:String(row.clubId||'FREE'),currentClubName:row.club||'Livre',nationality:row.nationality||'',dateOfBirth:row.birthDate||'',age:Number(row.age)||25,position:row.position||'Unknown',subPosition:row.subPosition||'',foot:row.foot||'',height:Number(row.height)||0,marketValue:value,highestValue:Number(row.highestValue)||value,contractExpiration:row.contractUntil||'',image:row.imageUrl||'',agentName:row.agentName||'',joinedOn:row.joinedOn||'',signedFrom:row.signedFrom||'',lastTransferFee:Number(row.lastTransferFee)||0,lastTransferDate:row.lastTransferDate||'',lastTransferFromId:row.lastTransferFromId||'',lastTransferFrom:row.lastTransferFrom||'',lastTransferToId:row.lastTransferToId||'',lastTransferTo:row.lastTransferTo||'',overall:Number(row.overall)||0,potential:Number(row.potential)||0,estimatedWage:wage(value),energy:100,form:70,dataStatus:row.dataStatus||''}}
if(!WorldDatabase.prototype[FLAG]){
  WorldDatabase.prototype[FLAG]=true;
  const original=WorldDatabase.prototype.ensurePlayers;
  WorldDatabase.prototype.ensurePlayers=async function(...args){
    const players=await original.apply(this,args);
    try{
      const response=await fetch('./data/players.json',{cache:'no-store'});
      if(response.ok){const payload=await response.json(),rows=payload.players||[],map=new Map(rows.map(r=>[String(r.id),r])),existing=new Set((players||[]).map(p=>String(p.id)));
        for(const p of players||[]){const row=map.get(String(p.id));if(!row)continue;
          p.agentName=row.agentName||p.agentName||'';p.joinedOn=row.joinedOn||p.joinedOn||'';p.signedFrom=row.signedFrom||p.signedFrom||'';p.lastTransferFee=Number(row.lastTransferFee)||0;p.lastTransferDate=row.lastTransferDate||'';p.lastTransferFromId=row.lastTransferFromId||'';p.lastTransferFrom=row.lastTransferFrom||'';p.lastTransferToId=row.lastTransferToId||'';p.lastTransferTo=row.lastTransferTo||'';p.liveSquadCheckedAt=row.liveSquadCheckedAt||'';p.highestValue=Number(row.highestValue)||Number(p.highestValue)||0;p.dataStatus=row.dataStatus||p.dataStatus||'';
          if(Number.isFinite(Number(row.age))&&Number(row.age)>0)p.age=Number(row.age);if(row.birthDate)p.dateOfBirth=row.birthDate;if(Number(row.value)>0)p.marketValue=Number(row.value);if(row.contractUntil)p.contractExpiration=row.contractUntil;if(row.agentName)p.agentName=row.agentName;if(row.clubId){p.currentClubId=String(row.clubId);p.currentClubName=row.club||p.currentClubName}if(Number(row.overall)>0)p.overall=Number(row.overall);if(Number(row.potential)>0)p.potential=Number(row.potential);
        }
        for(const row of rows){if(existing.has(String(row.id))||String(row.clubId)!=='FREE')continue;const p=fromRow(row);if(!p.name)continue;players.push(p);existing.add(String(row.id))}
        this.dataMeta=payload.meta||this.dataMeta||{};
      }
    }catch(error){console.warn('Player metadata enrichment unavailable',error)}
    const confirmed=applyRecentTransfers(players);const recalibrated=normalizePlayerRatings(players||[]);this.dataMeta={...(this.dataMeta||{}),confirmedTransferOverrides:confirmed.length,confirmedTransfersThrough:'2026-08-18',ratingModel:'GCP calibrated market-age-position v2',recalibratedPlayers:recalibrated,freeAgentsLoaded:(players||[]).filter(p=>String(p.currentClubId)==='FREE').length};
    return players;
  }
}
