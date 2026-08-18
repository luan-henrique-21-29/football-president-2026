import assert from 'node:assert/strict';
import {calculateTeamOverall,coachSelection,simulateFixture,applyMatchFitness,knockoutShootout} from '../src/game-v6.js';
import {createPresidentLineup} from '../src/lineup-state.js';
import {availableForFixture,processPlayerMatch} from '../src/player-career.js';

function player(id,position,overall,extra={}){
  return {id:String(id),name:`Player ${id}`,position,subPosition:position,overall,potential:Math.min(94,overall+3),energy:92,form:72,age:25,...extra};
}
function squad(prefix,overall){
  const out=[player(`${prefix}-gk`,'Goalkeeper',overall)];
  for(let i=0;i<6;i++)out.push(player(`${prefix}-d${i}`,'Defence',overall-(i>3?2:0)));
  for(let i=0;i<7;i++)out.push(player(`${prefix}-m${i}`,'Midfield',overall-(i>4?2:0)));
  for(let i=0;i<6;i++)out.push(player(`${prefix}-a${i}`,'Attack',overall-(i>3?2:0)));
  return out;
}
function careerStat(suspension=0){return{apps:0,starts:0,minutes:0,goals:0,assists:0,yellow:0,red:0,cleanSheets:0,injuries:0,injuryUntil:null,suspension,morale:70,form:72,energy:92,seasonHistory:[],careerGoals:0,careerAssists:0}}
const user=squad('u',83),weakOpp={id:'weak',name:'Weak FC',teamOverall:69,coachName:'Coach Weak'},strongOpp={id:'strong',name:'Strong FC',teamOverall:87,coachName:'Coach Strong'};
const fixture={id:'L1',date:'2026-08-20',competition:'League',round:'1',type:'LEAGUE',home:true,opponentId:'weak',opponentName:'Weak FC',opponentOverall:69,importance:1};
const next={id:'L2',date:'2026-08-23',competition:'League',round:'2',type:'LEAGUE',home:false,opponentId:'strong',opponentName:'Strong FC',opponentOverall:87,importance:1.45};
const save={clubId:'user',season:'2026/27',matches:[],coach:{name:'Rotation Test Coach',reputation:82}};

assert.equal(calculateTeamOverall(user)>=80,true,'team overall should reflect squad quality');
const plan=coachSelection(user,fixture,next,83,save.coach);
assert.equal(plan.starters.length,11,'coach must pick exactly 11 starters');
assert.equal(new Set(plan.starters.map(p=>String(p.id))).size,11,'starters must be unique');
assert.ok(plan.rotation>0.2,'coach should rotate for a weak opponent before a strong fixture');
assert.ok(plan.preferredFormation,'coach must expose a preferred formation');
assert.ok(plan.setPieces?.captain,'coach must assign set-piece leadership');

const a=simulateFixture({save,fixture,nextFixture:next,squad:user,opponentClub:weakOpp});
const b=simulateFixture({save,fixture,nextFixture:next,squad:user,opponentClub:weakOpp});
assert.deepEqual({gf:a.gf,ga:a.ga,xg:a.xg,xga:a.xga,seed:a.matchSeed},{gf:b.gf,ga:b.ga,xg:b.xg,xga:b.xga,seed:b.matchSeed},'same save and fixture should not reroll on refresh');
assert.equal(a.playerGoalEvents.length,a.gf,'live scorers must match the number of user goals');
assert.ok(a.shots>=a.gf+2,'shots should be coherent with goals');
assert.ok(a.shotsAgainst>=a.ga+2,'opponent shots should be coherent with goals');
assert.ok(a.possession>=27&&a.possession<=73,'possession should remain in a sane range');
assert.ok(Number.isFinite(a.xg)&&Number.isFinite(a.xga),'xG values must be finite');
assert.ok(a.opponentPlan?.starters?.length===11,'opponent must have a tactical XI in the simulation');
assert.ok(a.substitutions.length>=2&&a.substitutions.length<=5,'coach should make a realistic number of substitutions');
assert.equal(a.substitutions.length,a.plan.bench.filter(p=>p.subMinute).length,'planned substitutions must be stored on bench players');
assert.equal(new Set(a.substitutions.map(s=>s.inId)).size,a.substitutions.length,'the same substitute cannot enter twice');
const fitnessSquad=user.map(p=>({...p}));
applyMatchFitness(fitnessSquad,a.plan.starters,a.plan.bench,3);
assert.ok(fitnessSquad.every(p=>p.energy>=35&&p.energy<=100),'post-match energy must stay in valid range');

const manualSave={...save,coach:{...save.coach},presidentLineup:createPresidentLineup(plan,user,'4-4-2')};
const manualA=simulateFixture({save:manualSave,fixture:{...fixture,id:'MANUAL1'},nextFixture:next,squad:user,opponentClub:weakOpp});
const manualB=simulateFixture({save:manualSave,fixture:{...fixture,id:'MANUAL1'},nextFixture:next,squad:user,opponentClub:weakOpp});
assert.equal(manualA.manualLineupApplied,true,'president lineup must be applied to the match');
assert.equal(manualA.plan.preferredFormation,'4-4-2','manual formation must reach the match engine');
assert.equal(manualA.plan.starters.length,11,'manual lineup must keep exactly 11 starters');
assert.equal(new Set(manualA.plan.starters.map(p=>String(p.id))).size,11,'manual starters must be unique');
assert.deepEqual({gf:manualA.gf,ga:manualA.ga,seed:manualA.matchSeed},{gf:manualB.gf,ga:manualB.ga,seed:manualB.matchSeed},'manual lineup result must remain deterministic on refresh');

const suspensionSquad=squad('ban',81),banned=suspensionSquad[3],disciplineSave={clubId:'discipline',season:'2026/27',matches:[],coach:{name:'Discipline Coach',reputation:80},playerCareer:{[banned.id]:careerStat(1)},news:[]};
const available=availableForFixture(suspensionSquad,disciplineSave,fixture.date);
assert.ok(!available.some(p=>String(p.id)===String(banned.id)),'suspended player must be unavailable');
const disciplineResult=simulateFixture({save:disciplineSave,fixture:{...fixture,id:'BAN1'},nextFixture:null,squad:available,opponentClub:weakOpp});
processPlayerMatch(disciplineSave,disciplineResult,fixture,available,suspensionSquad);
assert.equal(disciplineSave.playerCareer[banned.id].suspension,0,'a suspended player must serve one match and become available again');

const drawnCupFixture={...fixture,id:'CUP-DIRECT',type:'CUP',competition:'National Cup',round:'Quartas',importance:1.7};
const drawnResult={gf:1,ga:1,matchSeed:123456,coachProfile:{setPieceFocus:70},opponentCoachProfile:{setPieceFocus:58},plan:{lineupOverall:83},opponentPlan:{lineupOverall:82}};
const shootA=knockoutShootout(drawnResult,drawnCupFixture),shootB=knockoutShootout(drawnResult,drawnCupFixture);
assert.ok(shootA,'a drawn knockout match must have a shootout');
assert.deepEqual(shootA,shootB,'shootout result must not reroll on refresh');
assert.notEqual(shootA.user,shootA.opponent,'shootout must produce a winner');
assert.equal(knockoutShootout({...drawnResult,gf:2,ga:1},drawnCupFixture),null,'a knockout win in regulation must not create a shootout');

let strongXg=0,strongXga=0,weakXg=0,weakXga=0;
for(let i=0;i<30;i++){
  const f={...fixture,id:`S${i}`,opponentId:'weak',opponentName:'Weak FC',opponentOverall:69};
  const r=simulateFixture({save,fixture:f,nextFixture:null,squad:squad(`s${i}`,86),opponentClub:weakOpp});
  strongXg+=r.xg;strongXga+=r.xga;
  const fw={...fixture,id:`W${i}`,opponentId:'strong',opponentName:'Strong FC',opponentOverall:87};
  const rw=simulateFixture({save,fixture:fw,nextFixture:null,squad:squad(`w${i}`,70),opponentClub:strongOpp});
  weakXg+=rw.xg;weakXga+=rw.xga;
}
assert.ok(strongXg>strongXga,'a clearly stronger team should create more xG over a sample');
assert.ok(weakXg<weakXga,'a clearly weaker team should concede more xG over a sample');
console.log('Gameplay smoke tests passed');
