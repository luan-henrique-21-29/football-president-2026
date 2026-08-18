import assert from 'node:assert/strict';
import {coachSelection,simulateFixture,calculateTeamOverall} from '../src/game-v6.js';
import {createPresidentLineup,remapPresidentLineup,formationSlots,lineupSignature} from '../src/lineup-state.js';

function p(id,position,overall){return{id:String(id),name:`Jogador ${id}`,position,subPosition:position,overall,potential:Math.min(95,overall+4),energy:94,form:72,age:25}}
function squad(prefix='p'){
 const out=[p(`${prefix}-gk`,'Goalkeeper',82)];
 for(let i=0;i<7;i++)out.push(p(`${prefix}-d${i}`,'Defence',80-i%3));
 for(let i=0;i<8;i++)out.push(p(`${prefix}-m${i}`,'Midfield',82-i%3));
 for(let i=0;i<6;i++)out.push(p(`${prefix}-a${i}`,'Attack',83-i%3));
 return out;
}
const players=squad(),fixture={id:'FORM-1',date:'2026-08-22',competition:'League',round:'1',type:'LEAGUE',home:true,opponentId:'opp',opponentName:'Opponent',opponentOverall:80,importance:1},save={clubId:'club',season:'2026/27',matches:[],coach:{name:'Formation Coach',reputation:82}},team=calculateTeamOverall(players),auto=coachSelection(players,fixture,null,team,save.coach);

const first=createPresidentLineup(auto,players,'4-3-3');
assert.equal(first.formation,'4-3-3');
assert.equal(first.slots.length,11);
assert.equal(new Set(first.slots.map(s=>s.playerId)).size,11,'manual 4-3-3 must contain 11 unique players');
assert.deepEqual(first.slots.map(s=>s.key),formationSlots('4-3-3').map(s=>s[0]),'4-3-3 slot map must match the formation');

const changed=remapPresidentLineup(first,players,'3-5-2');
assert.equal(changed.formation,'3-5-2');
assert.equal(changed.slots.length,11);
assert.equal(new Set(changed.slots.map(s=>s.playerId)).size,11,'manual 3-5-2 must contain 11 unique players');
assert.deepEqual(changed.slots.map(s=>s.key),formationSlots('3-5-2').map(s=>s[0]),'changing formation must rebuild the tactical slots');
assert.notEqual(lineupSignature(first),lineupSignature(changed),'formation change must alter the saved lineup signature');

const save433={...save,presidentLineup:first};
const result433=simulateFixture({save:save433,fixture,nextFixture:null,squad:players,opponentClub:{id:'opp',name:'Opponent',teamOverall:80,coachName:'Opponent Coach'}});
assert.equal(result433.manualLineupApplied,true,'president lineup must reach the match engine');
assert.equal(result433.plan.preferredFormation,'4-3-3');
assert.equal(result433.plan.starters.length,11);

const save352={...save,presidentLineup:changed};
const result352=simulateFixture({save:save352,fixture,nextFixture:null,squad:players,opponentClub:{id:'opp',name:'Opponent',teamOverall:80,coachName:'Opponent Coach'}});
assert.equal(result352.manualLineupApplied,true);
assert.equal(result352.plan.preferredFormation,'3-5-2','changed formation must be the one used in the match');
assert.equal(result352.plan.starters.length,11);
assert.notEqual(result433.matchSeed,result352.matchSeed,'different manual formations must create a different deterministic match state');
console.log('Lineup smoke tests passed');
