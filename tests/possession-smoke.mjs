import assert from 'node:assert/strict';
import {passSuccessChance,recoverySuccessChance,enrichPossessionDetails,playerPassSkill,playerRecoverySkill} from '../src/match-possession.js';
import {simulateFixture} from '../src/game-v8.js';

const p=(id,position,overall,extra={})=>({id:String(id),name:`P${id}`,position,subPosition:position,overall,energy:92,form:72,age:25,...extra});
const strongPasser=p('sp','Midfield',88,{passing:91}),weakPasser=p('wp','Midfield',68,{passing:63}),receiver=p('r','Attack',82),strongDef=p('sd','Defence',87,{tackling:91}),weakDef=p('wd','Attack',69,{tackling:48});
assert.ok(playerPassSkill(strongPasser)>playerPassSkill(weakPasser),'passing skill must respect player quality/attributes');
assert.ok(playerRecoverySkill(strongDef)>playerRecoverySkill(weakDef),'recovery skill must respect defensive quality/attributes');
const easy=passSuccessChance({passer:strongPasser,receiver,defenders:[weakDef],profile:{possessionBias:72,directness:45,tempo:55},distance:16,pressure:.08});
const hard=passSuccessChance({passer:weakPasser,receiver,defenders:[strongDef],profile:{possessionBias:42,directness:78,tempo:76},distance:39,pressure:.85});
assert.ok(easy>hard+.15,'good short pass under low pressure must be clearly safer than a hard pressured pass');
const strongRecovery=recoverySuccessChance({defender:strongDef,carrier:weakPasser,profile:{pressing:80,defensiveLine:72},pressure:.75});
const weakRecovery=recoverySuccessChance({defender:weakDef,carrier:strongPasser,profile:{pressing:38,defensiveLine:40},pressure:.1});
assert.ok(strongRecovery>weakRecovery+.2,'strong pressing defender must recover more often');

function plan(prefix,ovr,press=60,poss=55,direct=52){const starters=[p(`${prefix}g`,'Goalkeeper',ovr),p(`${prefix}d1`,'Defence',ovr),p(`${prefix}d2`,'Defence',ovr),p(`${prefix}d3`,'Defence',ovr),p(`${prefix}d4`,'Defence',ovr),p(`${prefix}m1`,'Midfield',ovr),p(`${prefix}m2`,'Midfield',ovr),p(`${prefix}m3`,'Midfield',ovr),p(`${prefix}a1`,'Attack',ovr),p(`${prefix}a2`,'Attack',ovr),p(`${prefix}a3`,'Attack',ovr)],bench=[p(`${prefix}b1`,'Midfield',ovr-2),p(`${prefix}b2`,'Attack',ovr-2),p(`${prefix}b3`,'Defence',ovr-2)];return{starters,bench,lineupOverall:ovr,preferredFormation:'4-3-3',coachProfile:{pressing:press,possessionBias:poss,directness:direct,tempo:60,width:58,defensiveLine:55}}}
const userPlan=plan('u',82,76,68,45),oppPlan=plan('o',79,52,48,64),base={gf:1,ga:1,xg:1.2,xga:1.1,possession:57,shots:11,shotsAgainst:9,matchSeed:998877,plan:userPlan,opponentPlan:oppPlan,detailedStats:{user:{shots:11,possession:57},opponent:{shots:9,possession:43}}};
const a=enrichPossessionDetails(structuredClone(base),{fixture:{id:'p1',date:'2026-08-18'}}),b=enrichPossessionDetails(structuredClone(base),{fixture:{id:'p1',date:'2026-08-18'}});
assert.equal(a.possessionModelVersion,2,'possession model must be active');
assert.deepEqual(a.possessionScript,b.possessionScript,'same match seed must produce the same visible pass/recovery script');
assert.ok(a.possessionScript.length>=60,'match must contain enough visible passing actions');
assert.ok(a.possessionScript.some(e=>e.outcome==='RECOVERED'||e.outcome==='LOOSE'),'script must include contested possession changes');
for(const side of ['user','opponent']){const s=a.detailedStats[side];assert.ok(s.completed<=s.passes,'completed passes cannot exceed attempts');assert.ok(s.passPct>=64&&s.passPct<=95,'passing accuracy must stay sane');assert.ok(s.recoveries>=25,'ball recoveries must be tracked');assert.ok(s.interceptions>=5,'interceptions must be tracked')}

const full=[...plan('s',83).starters,...plan('s2',79).bench,p('e1','Midfield',78),p('e2','Attack',77)],fixture={id:'live-possession',date:'2026-08-20',type:'LEAGUE',competition:'Liga',round:'1',home:true,opponentId:'opp',opponentName:'Rival',opponentOverall:79,importance:1},save={clubId:'club',clubName:'Meu Clube',season:'2026/27',matches:[],coach:{name:'Coach',reputation:82}};
const sim=simulateFixture({save,fixture,nextFixture:null,squad:full,opponentClub:{id:'opp',name:'Rival',teamOverall:79,coachName:'Rival Coach'}});
assert.equal(sim.matchModelVersion,7,'detailed match model must remain active');
assert.equal(sim.possessionModelVersion,2,'live simulation must include possession model');
assert.ok(sim.possessionScript.length>0,'live match must expose pass script');
assert.ok(Number.isFinite(sim.detailedStats.user.recoveries),'live match must expose recovery stats');
console.log('Possession gameplay tests passed');
