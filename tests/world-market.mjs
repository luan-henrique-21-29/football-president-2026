import assert from 'node:assert/strict';
import {applyRecentTransfers,RECENT_CONFIRMED_TRANSFERS} from '../src/recent-transfers.js';
import {applyRosterIntegrity} from '../src/roster-integrity.js';
import {ensureWorldTransferMarket,advanceWorldTransferMarket} from '../src/world-transfer-market.js';

const rodri={id:'357565',name:'Rodri',currentClubId:'131',currentClubName:'FC Barcelona',contractExpiration:'2027-06-30',marketValue:50_000_000,overall:88,age:30,position:'Midfield'};
const ferran={id:'398184',name:'Ferran Torres',currentClubId:'583',currentClubName:'Paris Saint-Germain',contractExpiration:'2031-06-30',marketValue:50_000_000,overall:84,age:26,position:'Attack'};
const lewa={id:'38253',name:'Robert Lewandowski',currentClubId:'131',currentClubName:'FC Barcelona',contractExpiration:'2026-06-30',marketValue:10_000_000,overall:83,age:37,position:'Attack'};
assert.deepEqual(applyRecentTransfers([rodri,ferran]),[],'speculative manual transfers must stay disabled');
assert.equal(RECENT_CONFIRMED_TRANSFERS.length,0,'manual transfer seed must not contain unverified moves');
const corrected=applyRosterIntegrity([rodri,ferran,lewa]);
assert.ok(corrected.includes('Rodri')&&corrected.includes('Ferran Torres')&&corrected.includes('Robert Lewandowski'));
assert.equal(rodri.currentClubId,'281','Rodri must remain at Manchester City in the verified correction layer');
assert.equal(ferran.currentClubId,'131','Ferran must remain at Barcelona in the verified correction layer');
assert.equal(lewa.currentClubId,'FREE','Lewandowski must no longer appear in Barcelona current squad');

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
const save={date:'2026-08-19',matches:[],aiClubs:{},worldPlayerMoves:{},worldContractOverrides:{},worldCoachOverrides:{},worldFreeCoaches:[],worldNews:[],news:[]};
const market=ensureWorldTransferMarket(save);
assert.equal(market.completed.filter(x=>x.realWorld).length,0,'career market must not be seeded with false real-world transfers');
for(const date of ['2026-08-19','2026-08-22','2026-08-26','2026-08-30']){save.date=date;advanceWorldTransferMarket(save,world,date,'u')}
assert.ok(market.negotiations.length+market.completed.filter(x=>x.careerWorld).length+market.failed.length>0,'AI market must create negotiation activity');
assert.ok(market.negotiations.every(x=>x.toClubId!=='u'&&x.fromClubId!=='u'),'world AI market must not bypass the user-club offer system');
assert.ok(market.completed.filter(x=>x.careerWorld).every(x=>x.status==='CONFIRMED'));
console.log('World transfer market tests passed');
