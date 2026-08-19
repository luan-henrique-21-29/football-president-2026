import {persist,state} from './state.js';

const DAY=86400000;
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

export function setCoachAutonomy(save,level){const a=ensureCoachAutonomy(save);if(!['NORMAL','HIGH','FULL'].includes(level))return a;a.level=level;if(level==='NORMAL'){a.medicalPrecaution=false;a.oneMatchPresidentOverride=false}else if(level==='HIGH'){a.medicalPrecaution=true;a.oneMatchPresidentOverride=false}else{a.medicalPrecaution=true;a.oneMatchPresidentOverride=true}persist();return a}

if(typeof document!=='undefined'&&!window.__gcpCoachAutonomyUI){window.__gcpCoachAutonomyUI=true;document.addEventListener('click',e=>{const b=e.target.closest('[data-coach-autonomy]');if(!b||!state.save)return;setCoachAutonomy(state.save,b.dataset.coachAutonomy);window.__cdRender?.()});document.addEventListener('change',e=>{if(!state.save)return;const a=ensureCoachAutonomy(state.save);if(e.target.id==='coachMedicalPrecaution'){a.medicalPrecaution=e.target.checked;persist();window.__cdRender?.()}if(e.target.id==='coachOneMatchOverride'){a.oneMatchPresidentOverride=e.target.checked;persist();window.__cdRender?.()}})}
