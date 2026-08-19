import assert from 'node:assert/strict';
import {simulateFixture} from '../src/game-v3.js';
const p=(id,pos,ovr)=>({id:String(id),name:`Player ${id}`,position:pos,subPosition:pos,overall:ovr,potential:ovr+2,age:25,energy:92,form:72});
function squad(prefix,ovr){const x=[p(`${prefix}g`,'Goalkeeper',ovr)];for(let i=0;i<7;i++)x.push(p(`${prefix}d${i}`,'Defence',ovr));for(let i=0;i<7;i++)x.push(p(`${prefix}m${i}`,'Midfield',ovr));for(let i=0;i<6;i++)x.push(p(`${prefix}a${i}`,'Attack',ovr));return x}
const user=squad('u',82),opp=squad('o',80),club={id:'uclub',name:'User FC',teamOverall:82,stadium:'Arena Teste',stadiumSeats:45000},opponent={id:'oclub',name:'Opponent FC',teamOverall:80,coachName:'Coach Opp',stadium:'Away Arena',stadiumSeats:38000},fixture={id:'PRES-1',date:'2026-08-20',competition:'League',round:'Rodada 1',type:'LEAGUE',home:true,opponentId:'oclub',opponentName:'Opponent FC',opponentOverall:80,importance:1.3},save={clubId:'uclub',season:'2026/27',matches:[],fanTrust:76,coach:{name:'Coach User',reputation:82},playerCareer:{},staff:{medicalLevel:6},facilities:{training:6,pitch:6}};
const result=simulateFixture({save,fixture,nextFixture:null,squad:user,opponentClub:opponent,opponentSquad:opp,club});
assert.ok(result.attendance?.count>0,'match must have attendance');
assert.ok(result.attendance.count<=45000,'attendance cannot exceed stadium capacity');
assert.equal(result.attendance.capacity,45000,'home capacity must be used');
assert.ok(Number.isFinite(Number(result.detailedStats?.user?.offsides)),'offside stats must exist');
const offsideEvents=(result.timeline||[]).filter(e=>e.type==='OFFSIDE'&&e.team==='USER').length;
assert.equal(offsideEvents,Number(result.detailedStats.user.offsides||0),'offside events must match user stat');
for(const goal of (result.timeline||[]).filter(e=>e.type==='GOAL')){assert.equal(String(goal.shooterId),String(goal.playerId),'goal shooter id must match scorer');assert.equal(goal.shooterName,goal.playerName,'goal shooter name must match scorer')}
console.log('Match presentation tests passed');
