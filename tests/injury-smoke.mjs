import assert from 'node:assert/strict';
import {INJURY_CATALOG,buildMatchInjuryEvents,injuryStage,daysUntil} from '../src/injury-engine.js';
assert.ok(INJURY_CATALOG.length>=7,'injury catalog should have varied diagnoses');
assert.ok(INJURY_CATALOG.some(x=>x.severity==='GRAVE'),'catalog must include rare severe injuries');
assert.equal(injuryStage({until:'2026-08-28',days:20},'2026-08-10'),'TRATAMENTO');
assert.equal(injuryStage({until:'2026-08-20',days:20},'2026-08-18'),'RECONDICIONAMENTO');
assert.equal(daysUntil('2026-08-18','2026-08-25'),7);
const players=Array.from({length:18},(_,i)=>({id:`p${i}`,name:`Player ${i}`,age:31+(i%5),energy:38,overall:75,subMinute:i>=11?60:0,replacedAt:i<11?90:0}));
const save={clubId:'1',playerCareer:Object.fromEntries(players.map(p=>[p.id,{injuries:5,energy:38}])),staff:{medicalLevel:2},facilities:{training:2,pitch:2}};
let found=[];
for(let d=1;d<=80&&!found.length;d++){const date=`2026-09-${String((d%28)+1).padStart(2,'0')}`,fixture={date,opponentId:`o${d}`,opponentName:'Opponent'},result={plan:{starters:players.slice(0,11),bench:players.slice(11),coachProfile:{pressing:92,tempo:92}}};found=buildMatchInjuryEvents({save,fixture,result})}
assert.ok(found.length>=1,'high-risk repeated match sample should produce a deterministic injury');
assert.ok(found[0].until&&found[0].days>=2&&found[0].injuryName,'injury event needs diagnosis and recovery estimate');
console.log('Injury system tests passed');
