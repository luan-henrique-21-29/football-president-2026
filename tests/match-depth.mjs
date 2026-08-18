import assert from 'node:assert/strict';
import {enrichMatchResult} from '../src/match-model.js';
import {simulateFixture} from '../src/game-v7.js';

function p(id,position,overall=80){return{id:String(id),name:`Jogador ${id}`,position,subPosition:position,overall,potential:overall+2,energy:91,form:72,age:26}}
function plan(prefix,ovr=80){const starters=[p(`${prefix}g`,'Goalkeeper',ovr),p(`${prefix}d1`,'Defence',ovr),p(`${prefix}d2`,'Defence',ovr),p(`${prefix}d3`,'Defence',ovr),p(`${prefix}d4`,'Defence',ovr),p(`${prefix}m1`,'Midfield',ovr),p(`${prefix}m2`,'Midfield',ovr),p(`${prefix}m3`,'Midfield',ovr),p(`${prefix}a1`,'Attack',ovr),p(`${prefix}a2`,'Attack',ovr),p(`${prefix}a3`,'Attack',ovr)],bench=[p(`${prefix}b1`,'Midfield',ovr-2),p(`${prefix}b2`,'Attack',ovr-2),p(`${prefix}b3`,'Defence',ovr-2)];bench[0].subMinute=64;starters[5].replacedAt=64;return{starters,bench,lineupOverall:ovr,preferredFormation:'4-3-3',style:'Equilibrado',coachProfile:{pressing:64,tempo:61,directness:55,possessionBias:58,width:60,defensiveLine:57}}}

const user=plan('u',82),opp=plan('o',78),fixture={id:'depth-1',date:'2026-08-18',type:'LEAGUE',competition:'Liga',round:'1',home:true,opponentName:'Rival',opponentOverall:78},base={gf:2,ga:1,xg:1.74,xga:.91,possession:56,shots:13,shotsAgainst:8,matchSeed:778899,plan:user,opponentPlan:opp,playerGoalEvents:[{scorerId:user.starters[8].id,scorer:user.starters[8].name,assistId:user.starters[6].id,assist:user.starters[6].name},{scorerId:user.starters[9].id,scorer:user.starters[9].name,assistId:null,assist:null}],substitutions:[{minute:64,outId:user.starters[5].id,outName:user.starters[5].name,inId:user.bench[0].id,inName:user.bench[0].name,reason:'Gestão de energia'}],opponentSubstitutions:[]};
const args={fixture,save:{clubName:'Meu Clube'}};
const a=enrichMatchResult(structuredClone(base),args),b=enrichMatchResult(structuredClone(base),args);
assert.equal(a.matchModelVersion,7,'new match model should be active');
assert.deepEqual(a.timeline,b.timeline,'timeline must be deterministic for the same match seed');
assert.equal(a.timeline.filter(e=>e.team==='USER'&&['GOAL','SHOT_ON','SHOT_OFF'].includes(e.type)).length,13,'user shot timeline must match final shots');
assert.equal(a.timeline.filter(e=>e.team==='OPPONENT'&&['GOAL','SHOT_ON','SHOT_OFF'].includes(e.type)).length,8,'opponent shot timeline must match final shots');
assert.equal(a.timeline.filter(e=>e.team==='USER'&&e.type==='GOAL').length,2,'user goal events must match score');
assert.equal(a.timeline.filter(e=>e.team==='OPPONENT'&&e.type==='GOAL').length,1,'opponent goal events must match score');
assert.ok(a.detailedStats.user.onTarget>=a.gf&&a.detailedStats.user.onTarget<=a.shots,'shots on target must be coherent');
assert.ok(a.detailedStats.opponent.onTarget>=a.ga&&a.detailedStats.opponent.onTarget<=a.shotsAgainst,'opponent shots on target must be coherent');
const uxg=a.timeline.filter(e=>e.team==='USER'&&['GOAL','SHOT_ON','SHOT_OFF'].includes(e.type)).reduce((s,e)=>s+Number(e.xg||0),0);
const oxg=a.timeline.filter(e=>e.team==='OPPONENT'&&['GOAL','SHOT_ON','SHOT_OFF'].includes(e.type)).reduce((s,e)=>s+Number(e.xg||0),0);
assert.ok(Math.abs(uxg-a.xg)<=.04,'user event xG should sum to match xG');
assert.ok(Math.abs(oxg-a.xga)<=.04,'opponent event xG should sum to match xGA');
assert.ok(a.playerRatings.length>=11,'player ratings must cover the XI');
assert.ok(a.playerRatings.every(r=>r.rating>=4.8&&r.rating<=10),'ratings must remain in sane bounds');
assert.ok(a.playerRatings.some(r=>r.minutes<90),'substitution minutes must affect ratings');
assert.equal(a.momentum.length,18,'momentum should cover the match in five-minute segments');
assert.ok(a.bestPlayer?.name,'match must expose a best player');

const squad=[...plan('s',84).starters,...plan('x',79).bench,p('extra1','Midfield',78),p('extra2','Attack',77)],save={clubId:'club',clubName:'Meu Clube',season:'2026/27',matches:[],coach:{name:'Treinador Teste',reputation:82}},simFixture={...fixture,id:'depth-live',opponentId:'opp'};
const sim=simulateFixture({save,fixture:simFixture,nextFixture:null,squad,opponentClub:{id:'opp',name:'Rival',teamOverall:78,coachName:'Treinador Rival'}});
assert.equal(sim.matchModelVersion,7,'game-v7 simulation must enrich every played fixture');
assert.ok(sim.timeline.some(e=>e.type==='FULL'),'full-time event must exist');
assert.equal(sim.timeline.filter(e=>e.team==='USER'&&e.type==='GOAL').length,sim.gf,'live user goals must equal result');
assert.equal(sim.timeline.filter(e=>e.team==='OPPONENT'&&e.type==='GOAL').length,sim.ga,'live opponent goals must equal result');
assert.equal(sim.detailedStats.user.shots,sim.shots,'detailed user shots must equal core result');
assert.equal(sim.detailedStats.opponent.shots,sim.shotsAgainst,'detailed opponent shots must equal core result');
console.log('Match depth tests passed');
