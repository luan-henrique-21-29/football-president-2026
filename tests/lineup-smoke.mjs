import assert from 'node:assert/strict';
import {coachSelection,simulateFixture,calculateTeamOverall} from '../src/game-v3.js';
import {createPresidentLineup,remapPresidentLineup,formationSlots,lineupSignature} from '../src/lineup-state.js';

function p(id,position,overall){return{id:String(id),name:`Jogador ${id}`,position,subPosition:position,overall,potential:Math.min(95,overall+4),energy:94,form:72,age:25}}
function squad(prefix='p'){const out=[p(`${prefix}-gk`,'Goalkeeper',82)];for(let i=0;i<7;i++)out.push(p(`${prefix}-d${i}`,'Defence',80-i%3));for(let i=0;i<8;i++)out.push(p(`${prefix}-m${i}`,'Midfield',82-i%3));for(let i=0;i<6;i++)out.push(p(`${prefix}-a${i}`,'Attack',83-i%3));return out}
const players=squad(),fixture={id:'FORM-1',date:'2026-08-22',competition:'League',round:'1',type:'LEAGUE',home:true,opponentId:'opp',opponentName:'Opponent',opponentOverall:80,importance:1},save={clubId:'club',clubName:'Club',season:'2026/27',matches:[],coach:{name:'Formation Coach',reputation:82}},team=calculateTeamOverall(players),auto=coachSelection(players,fixture,null,team,save.coach);
const first=createPresidentLineup(auto,players,'4-3-3');
assert.equal(first.formation,'4-3-3');assert.equal(first.slots.length,11);assert.equal(new Set(first.slots.map(s=>s.playerId)).size,11);assert.deepEqual(first.slots.map(s=>s.key),formationSlots('4-3-3').map(s=>s[0]));
const changed=remapPresidentLineup(first,players,'3-5-2');
assert.equal(changed.formation,'3-5-2');assert.equal(changed.slots.length,11);assert.equal(new Set(changed.slots.map(s=>s.playerId)).size,11);assert.deepEqual(changed.slots.map(s=>s.key),formationSlots('3-5-2').map(s=>s[0]));assert.notEqual(lineupSignature(first),lineupSignature(changed));
const result433=simulateFixture({save:{...save,presidentLineup:first},fixture,nextFixture:null,squad:players,opponentClub:{id:'opp',name:'Opponent',teamOverall:80,coachName:'Opponent Coach'}});
assert.equal(result433.manualLineupApplied,true);assert.equal(result433.plan.preferredFormation,'4-3-3');assert.equal(result433.selectedFormation,'4-3-3');assert.equal(result433.plan.starters.length,11);assert.ok(Array.isArray(result433.possessionScript),'production match must contain pass/recovery script');
const result352=simulateFixture({save:{...save,presidentLineup:changed},fixture,nextFixture:null,squad:players,opponentClub:{id:'opp',name:'Opponent',teamOverall:80,coachName:'Opponent Coach'}});
assert.equal(result352.manualLineupApplied,true);assert.equal(result352.plan.preferredFormation,'3-5-2');assert.equal(result352.selectedFormation,'3-5-2');assert.equal(result352.plan.starters.length,11);assert.notEqual(result433.matchSeed,result352.matchSeed);assert.notDeepEqual(formationSlots(result433.selectedFormation),formationSlots(result352.selectedFormation),'live tactical shapes must differ after formation change');
console.log('Lineup smoke tests passed');
