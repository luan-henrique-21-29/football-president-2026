import assert from 'node:assert/strict';
import {contractMarketStatus,isFreeAgent,squadContractView,renewalDisposition} from '../src/contract-status.js';
import {runFreeAgencyTick} from '../src/free-agent-system.js';
await import('../src/market-v4.js');
await import('../src/contracts-page.js');

const free={id:'f1',name:'Livre',currentClubId:'FREE',currentClubName:'Livre',overall:78,marketValue:4_000_000,age:27,position:'Midfield'};
assert.equal(isFreeAgent(free),true);
assert.equal(contractMarketStatus(free,'2026-08-19').code,'FREE');
const short={id:'s1',name:'Curto',currentClubId:'2',currentClubName:'Clube',contractExpiration:'2027-01-10',overall:79,marketValue:8_000_000,age:26,position:'Defence'};
assert.ok(contractMarketStatus(short,'2026-08-19').months<=6);

const save={databaseSnapshot:'2026-08-18',clubId:'1',date:'2026-09-01',worldPlayerMoves:{},worldContractOverrides:{},acquiredPlayerIds:[],soldPlayerIds:[],playerContracts:{},playerDynamics:{u1:{happiness:24}},playerDemands:[{id:'d1',playerId:'u1',playerName:'Sai',type:'TRANSFER',date:'2026-08-20',expires:'2026-10-01',status:'PENDING',message:'Quero sair'}],playerPromises:[],agentNegotiations:{},matches:[],aiClubs:{'2':{ambition:60,patience:55,transferActivity:60}},worldTransferMarket:{negotiations:[],completed:[],failed:[]}};
const user={id:'u1',name:'Sai',currentClubId:'1',currentClubName:'Meu Clube',contractExpiration:'2026-08-25',overall:81,marketValue:12_000_000,age:28,position:'Attack',estimatedWage:25000};
const stale={id:'old',name:'Stale',currentClubId:'2',currentClubName:'Outro',contractExpiration:'2026-06-30',overall:72,marketValue:2_000_000,age:30,position:'Defence'};
const clubs=[{id:'1',name:'Meu Clube',teamOverall:80},{id:'2',name:'Outro',teamOverall:76}];
const world={players:[user,stale],clubs,findClub(id){return clubs.find(c=>String(c.id)===String(id))}};
const view=squadContractView(save,user,[user],'2026-08-24');
assert.equal(view.intent,'WANTS_OUT');
assert.equal(renewalDisposition(save,user,[user],'2026-08-24').willing,false);
const events=runFreeAgencyTick(save,world,'2026-09-01','1');
assert.equal(user.currentClubId,'FREE','expired user contract must create a free agent');
assert.ok(events.some(e=>e.type==='FREE_AGENT'));
assert.equal(stale.currentClubId,'2','stale pre-snapshot contract must not eject player');
console.log('contract-market ok');
