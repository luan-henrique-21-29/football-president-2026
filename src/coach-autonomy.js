import {persist} from './state.js';

const DAY=86400000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const daysBetween=(a,b)=>!a||!b?8:Math.round((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/DAY);
const average=(list,key,fallback=100)=>list?.length?list.reduce((s,p)=>s+Number(p?.[key]??fallback),0)/list.length:fallback;

export function ensureCoachAutonomy(save){
 if(!save)return null;
 save.coachAutonomy??={level:'FULL',autoLineup:true,autoRotation:true,autoSubs:true,autoTraining:true,medicalPrecaution:true,oneMatchPresidentOverride:true,lastPlan:null};
 const a=save.coachAutonomy;
 a.level??='FULL';a.autoLineup??=true;a.autoRotation??=true;a.autoSubs??=true;a.autoTraining??=true;a.medicalPrecaution??=true;a.oneMatchPresidentOverride??=true;
 return a;
}

export function prepareAutonomousSquad(save,players=[],fixture,nextFixture){
 const a=ensureCoachAutonomy(save);if(!a||a.level==='NORMAL')return{players,policy:null};
 const avgEnergy=average(players,'energy',100),days=daysBetween(fixture?.date,nextFixture?.date),threshold=a.level==='FULL'?54:48;
 let eligible=players;
 if(a.medicalPrecaution){const protectedPlayers=players.filter(p=>Number(p.energy??100)>=threshold);if(protectedPlayers.length>=11)eligible=protectedPlayers}
 const trainingIntensity=!a.autoTraining?'MANUAL':days<=3||avgEnergy<72?'LOW':days<=5||avgEnergy<84?'NORMAL':'HIGH';
 const policy={level:a.level,avgEnergy:Math.round(avgEnergy),daysToNext:days,trainingIntensity,protectedCount:Math.max(0,players.length-eligible.length),message:eligible.length<players.length?`O técnico poupou ${players.length-eligible.length} atleta(s) por desgaste e risco físico.`:days<=3?'Calendário apertado: treino leve e maior rotação.':'O treinador controla escalação, rodízio, substituições e carga de treino.'};
 a.lastPlan={...policy,date:fixture?.date||save.date,opponent:fixture?.opponentName||''};
 return{players:eligible,policy};
}

export function afterAutonomousMatch(save,result,fixture){
 const a=ensureCoachAutonomy(save);if(!a)return;
 a.lastMatch={date:fixture?.date||save.date,formation:result?.plan?.preferredFormation||'',rotation:Number(result?.plan?.rotation||0),substitutions:(result?.substitutions||[]).length,medicalSubstitutions:(result?.medicalSubstitutions||[]).length};
 if(a.level==='FULL'&&a.autoLineup&&a.oneMatchPresidentOverride&&save.presidentLineup?.enabled){save.presidentLineup.enabled=false;save.presidentLineup.selectedPlayerId=null;save.presidentLineup.lastReleasedByCoach=fixture?.date||save.date}
}

export function setCoachAutonomy(save,level){const a=ensureCoachAutonomy(save);if(!['NORMAL','HIGH','FULL'].includes(level))return a;a.level=level;if(level==='NORMAL'){a.medicalPrecaution=false;a.oneMatchPresidentOverride=false}else if(level==='HIGH'){a.medicalPrecaution=true;a.oneMatchPresidentOverride=false}else{a.medicalPrecaution=true;a.oneMatchPresidentOverride=true}persist();return a}

export function bindCoachAutonomy(render,save){
 document.querySelectorAll('[data-coach-autonomy]').forEach(b=>b.onclick=()=>{setCoachAutonomy(save,b.dataset.coachAutonomy);render?.()});
 document.querySelector('#coachMedicalPrecaution')?.addEventListener('change',e=>{const a=ensureCoachAutonomy(save);a.medicalPrecaution=e.target.checked;persist();render?.()});
 document.querySelector('#coachOneMatchOverride')?.addEventListener('change',e=>{const a=ensureCoachAutonomy(save);a.oneMatchPresidentOverride=e.target.checked;persist();render?.()});
}
