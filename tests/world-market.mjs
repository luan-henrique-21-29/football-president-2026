import assert from 'node:assert/strict';
import {applyRecentTransfers,RECENT_CONFIRMED_TRANSFERS} from '../src/recent-transfers.js';
import {ensureWorldTransferMarket,advanceWorldTransferMarket} from '../src/world-transfer-market.js';

const rodri={id:'357565',name:'Rodri',currentClubId:'281',currentClubName:'Manchester City',contractExpiration:'2027-06-30',marketValue:50_000_000,overall:88,age:30,position:'Midfield'};
const ferran={id:'398184',name:'Ferran Torres',currentClubId:'131',currentClubName:'FC Barcelona',contractExpiration:'2027-06-30',marketValue:50_000_000,overall:84,age:26,position:'Attack'};
const applied=applyRecentTransfers([rodri,ferran]);
assert.ok(applied.includes('real-2026-08-18-rodri-barca'));
assert.equal(rodri.currentClubId,'131');
assert.equal(rodri.currentClubName,'FC Barcelona');
assert.equal(rodri.contractExpiration,'2030-06-30');
assert.equal(ferran.currentClubId,'583');
assert.equal(ferran.contractExpiration,'2031-06-30');
assert.ok(RECENT_CONFIRMED_TRANSFERS.some(x=>x.playerName==='Amar Dedić'));

const clubs=[
 {id:'u',name:'User FC',country:'Brazil',teamOverall:76,marketValue:80_000_000},
 {id:'a',name:'Alpha',country:'England',teamOverall:80,marketValue:220_000_000},
 {id:'b',name:'Beta',country:'England',teamOverall:79,marketValue:180_000_000},
 {id:'c',name:'Gamma',country:'Spain',teamOverall:81,marketValue:240_000_000},
 {id:'d',name:'Delta',country:'Italy',teamOverall:77,marketValue:150_000_000}
];
const positions=['Goalkeeper','Defence','Midfield','Attack'];
const players=[];let id=1;
for(const club of clubs.slice(1))for(let i=0;i<24;i++)players.push({id:String(id++),name:`P${id}`,currentClubId:club.id,currentClubName:club.name,position:positions[i%4],subPosition:'',overall:70+(i%10),age:19+(i%14),marketValue:1_000_000+(i%10)*1_200_000});
const world={clubs,players,findClub(id){return this.clubs.find(c=>String(c.id)===String(id))}};
const save={date:'2026-08-18',matches:[],aiClubs:{},worldPlayerMoves:{},worldContractOverrides:{},worldCoachOverrides:{},worldFreeCoaches:[],worldNews:[],news:[]};
const market=ensureWorldTransferMarket(save);
assert.ok(market.completed.some(x=>x.realWorld&&x.playerName==='Rodri'));
for(const date of ['2026-08-18','2026-08-22','2026-08-26','2026-08-30']){save.date=date;advanceWorldTransferMarket(save,world,date,'u')}
assert.ok(market.negotiations.length+market.completed.filter(x=>x.careerWorld).length+market.failed.length>0,'AI market must create negotiation activity');
assert.ok(market.negotiations.every(x=>x.toClubId!=='u'&&x.fromClubId!=='u'),'world AI market must not bypass the user-club offer system');
assert.ok(market.completed.filter(x=>x.careerWorld).every(x=>x.status==='CONFIRMED'));
console.log('World transfer market tests passed');
