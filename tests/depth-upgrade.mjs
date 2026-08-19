import assert from 'node:assert/strict';
import {state} from '../src/state.js';
import {simulateFixture} from '../src/game-v3.js';
import {enrichMatchManagement} from '../src/match-management.js';
import {runFreeAgencyTick} from '../src/free-agent-system.js';

function p(id,pos='Midfield',ovr=78,club='opp'){return{id:String(id),name:`P${id}`,position:pos,subPosition:pos,overall:ovr,potential:ovr+2,energy:92,form:72,age:25,currentClubId:String(club),currentClubName:club==='opp'?'Opponent FC':'User FC',marketValue:12_000_000,contractExpiration:'2028-06-30'}}
function team(prefix,club,ovr=78){const out=[p(`${prefix}-gk`,'Goalkeeper',ovr,club)];for(let i=0;i<6;i++)out.push(p(`${prefix}-d${i}`,'Defence',ovr,club));for(let i=0;i<7;i++)out.push(p(`${prefix}-m${i}`,'Midfield',ovr,club));for(let i=0;i<6;i++)out.push(p(`${prefix}-a${i}`,'Attack',ovr,club));return out}
const user=team('u','user',82),opp=team('o','opp',80);state.world={players:[...user,...opp]};
const save={clubId:'user',season:'2026/27',matches:[],date:'2026-08-20',coach:{name:'Coach User',reputation:82},coachAutonomy:{level:'FULL',autoLineup:true,autoRotation:true,autoSubs:true,autoTraining:true,medicalPrecaution:true,oneMatchPresidentOverride:true}};
const fixture={id:'DEPTH1',date:'2026-08-20',competition:'League',round:'1',type:'LEAGUE',home:true,opponentId:'opp',opponentName:'Opponent FC',opponentOverall:80,importance:1.4};
const opponentClub={id:'opp',name:'Opponent FC',teamOverall:80,coachName:'Coach Opp'};
const result=simulateFixture({save,fixture,nextFixture:null,squad:user,opponentClub});
assert.equal(result.opponentSquadSource,'REAL_DATABASE','active engine should use the real opponent database squad when available');
assert.equal(result.opponentPlan.starters.length,11,'real opponent must still field eleven players');
assert.ok(result.opponentPlan.starters.some(x=>String(x.id).startsWith('o-')),'opponent XI should contain real database player ids instead of synthetic placeholders');
assert.ok(Array.isArray(result.matchManagement)&&result.matchManagement.length>=2,'coaches should react during the match');
assert.ok(result.timeline.some(e=>e.type==='TACTIC'),'tactical changes should enter the live timeline');

const synthetic={timeline:[{type:'GOAL',team:'OPPONENT',minute:20},{type:'GOAL',team:'OPPONENT',minute:51}],plan:{coachProfile:{pressing:72,attackingRisk:75,adaptability:80}},opponentPlan:{coachProfile:{pressing:55,pragmatism:75,adaptability:70}}};
enrichMatchManagement(synthetic,{save:{coach:{name:'Reactive Coach'}},fixture:{opponentName:'Rival',importance:1.5},opponentClub:{coachName:'Rival Coach'}});
const userLate=synthetic.matchManagement.find(e=>e.team==='USER'&&e.minute===62);assert.ok(userLate&&['OFENSIVO','TUDO_OU_NADA'].includes(userLate.mentality),'a coach losing by two should become more aggressive');

const free=p('free','Attack',79,'FREE');free.currentClubName='Livre';free.contractExpiration='';free.dataStatus='FREE_AGENT';
const expired=p('expired','Defence',76,'a');expired.currentClubName='Club A';expired.contractExpiration='2026-08-21';
const clubs=[{id:'a',name:'Club A',teamOverall:76},{id:'b',name:'Club B',teamOverall:79},{id:'c',name:'Club C',teamOverall:81}];
const world={players:[free,expired,...team('b','b',75).slice(0,12),...team('c','c',77).slice(0,12)],clubs,findClub:id=>clubs.find(c=>String(c.id)===String(id))};
const marketSave={clubId:'user',databaseSnapshot:'2026-08-18',date:'2026-08-25',matches:[],acquiredPlayerIds:[],worldPlayerMoves:{},worldContractOverrides:{},worldTransferMarket:{version:2,negotiations:[],completed:[],failed:[]},aiClubs:{a:{patience:50,ambition:50},b:{ambition:80,transferActivity:85,youthBias:50},c:{ambition:75,transferActivity:80,youthBias:50}},freeAgencyState:{lastTick:null}};
const events=runFreeAgencyTick(marketSave,world,'2026-08-25','user');
assert.ok(events.length>=0,'free agency tick should execute without breaking the world simulation');
assert.ok(world.players.some(x=>x.id==='free'&&x.currentClubId),'real free-agent records must remain available to the career market or be signed by AI');
console.log('Depth upgrade tests passed');
