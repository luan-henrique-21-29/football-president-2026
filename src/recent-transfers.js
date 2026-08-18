const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export const RECENT_CONFIRMED_TRANSFERS=[
 {id:'real-2026-08-18-rodri-barca',date:'2026-08-18',playerId:'357565',playerName:'Rodri',fromClubId:'281',fromClub:'Manchester City',toClubId:'131',toClub:'FC Barcelona',type:'PERMANENT',contractUntil:'2030-06-30',feeEurApprox:75600000,reportedFeeLabel:'£65,4 mi (reportado)',status:'CONFIRMED',source:'Reuters / FC Barcelona'},
 {id:'real-2026-08-18-dedic-newcastle',date:'2026-08-18',playerId:'519184',playerName:'Amar Dedić',fromClubId:'294',fromClub:'SL Benfica',toClubId:'762',toClub:'Newcastle United',type:'PERMANENT',contractUntil:'2031-06-30',feeEurApprox:34100000,reportedFeeLabel:'£29,5 mi (reportado)',status:'CONFIRMED',source:'Reuters / Newcastle United'},
 {id:'real-2026-08-17-batshuayi-abha',date:'2026-08-17',playerId:'179184',playerName:'Michy Batshuayi',fromClubId:'24',fromClub:'Eintracht Frankfurt',toClubId:'',toClub:'Abha Club',type:'FREE',contractUntil:'',feeEurApprox:0,reportedFeeLabel:'Livre',status:'CONFIRMED',source:'Reuters / Abha'},
 {id:'real-2026-08-15-ferran-psg',date:'2026-08-15',playerId:'398184',playerName:'Ferran Torres',fromClubId:'131',fromClub:'FC Barcelona',toClubId:'583',toClub:'Paris Saint-Germain',type:'PERMANENT',contractUntil:'2031-06-30',feeEurApprox:50000000,reportedFeeLabel:'€50 mi (reportado)',status:'CONFIRMED',source:'Reuters / PSG'}
];

function findPlayer(players,t){return players.find(p=>String(p.id)===String(t.playerId))||players.find(p=>norm(p.name)===norm(t.playerName)&&(String(p.currentClubId)===String(t.fromClubId)||norm(p.currentClubName).includes(norm(t.fromClub))))||players.find(p=>norm(p.name)===norm(t.playerName));}

export function applyRecentTransfers(players){
 const applied=[];
 for(const t of RECENT_CONFIRMED_TRANSFERS){const p=findPlayer(players||[],t);if(!p)continue;p.currentClubId=String(t.toClubId||p.currentClubId);p.currentClubName=t.toClub||p.currentClubName;p.lastTransferDate=t.date;p.lastTransferFromId=t.fromClubId;p.lastTransferFrom=t.fromClub;p.lastTransferToId=t.toClubId;p.lastTransferTo=t.toClub;p.lastTransferFee=Number(t.feeEurApprox)||0;p.realTransferSource=t.source;p.realTransferConfirmed=true;if(t.contractUntil)p.contractExpiration=t.contractUntil;applied.push(t.id)}
 return applied;
}

export function seedRecentTransfers(save){
 save.worldTransferMarket??={negotiations:[],completed:[],failed:[]};save.worldTransferMarket.negotiations??=[];save.worldTransferMarket.completed??=[];save.worldTransferMarket.failed??=[];
 const seen=new Set(save.worldTransferMarket.completed.map(x=>x.id));
 for(const t of RECENT_CONFIRMED_TRANSFERS){if(seen.has(t.id))continue;save.worldTransferMarket.completed.push({...t,realWorld:true,fee:Number(t.feeEurApprox)||0});}
 save.worldTransferMarket.completed.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 return save.worldTransferMarket;
}
