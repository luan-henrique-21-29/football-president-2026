import * as base from './game.js';
import {coachMatchModifiers} from './coach-profile.js';

export const leagueProfile=base.leagueProfile;
export const buildCalendar=base.buildCalendar;
export const calculateTeamOverall=base.calculateTeamOverall;
export const applyMatchFitness=base.applyMatchFitness;
export const askingPrice=base.askingPrice;
export const evaluateOffer=base.evaluateOffer;
export const playerInterest=base.playerInterest;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=str=>[...String(str)].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,2166136261)>>>0;
function rng(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}
function goals(lambda,random){const L=Math.exp(-clamp(lambda,.15,3.8));let k=0,p=1;do{k++;p*=random()}while(p>L&&k<9);return k-1}

export function coachSelection(squad,fixture,nextFixture,teamOverall,coach={}){
 const m=coachMatchModifiers(coach),f={...fixture},n=nextFixture?{...nextFixture}:null;
 if(m.rotationBias>.12&&f.importance<1.4){f.importance=Math.max(.75,f.importance-m.rotationBias*.35);if(n)n.opponentOverall=(n.opponentOverall||70)+Math.round(m.rotationBias*7)}
 if(m.rotationBias<-.12){f.importance=Math.max(1.4,f.importance);if(n&&m.profile.pragmatism>70)n.opponentOverall=Math.max(60,(n.opponentOverall||70)-3)}
 let plan=base.coachSelection(squad,f,n,teamOverall);
 if(m.profile.youthDevelopment>=76&&f.importance<1.35){const youth=squad.filter(p=>p.youth||((p.age??99)<=21&&(p.potential||0)>(p.overall||0)+3)).sort((a,b)=>(b.potential||0)-(a.potential||0));if(youth.length){const candidate=youth[0],same=plan.starters.findIndex(p=>String(p.position)===String(candidate.position)&&(p.overall||0)>(candidate.overall||0));if(same>=0&&(plan.starters[same].overall-candidate.overall)<=10){plan.starters[same]=candidate;plan.lineupOverall=Math.round(plan.starters.reduce((s,p)=>s+(p.overall||65),0)/11);plan.reason+=` ${m.profile.name} também dá espaço a jovens de alto potencial.`}}}
 plan.coachProfile=m.profile;plan.preferredFormation=m.profile.preferredFormation;plan.style=m.profile.style;return plan;
}

export function simulateFixture({save,fixture,nextFixture,squad,opponentClub}){
 const teamOverall=base.calculateTeamOverall(squad),coach={...save.coach,reputation:save.coach?.reputation||Math.max(60,Math.min(92,teamOverall))},m=coachMatchModifiers(coach),plan=coachSelection(squad,fixture,nextFixture,teamOverall,coach),opp=fixture.opponentOverall||opponentClub?.teamOverall||72,home=fixture.home?.18:-.06,diff=(plan.lineupOverall-opp)/10;
 const attack=m.attackBias*.22+m.pressBias*.08,defensiveRisk=m.attackBias*.10-m.profile.pragmatism/700;
 const expectedFor=1.25+diff*.42+home+attack,expectedAgainst=1.18-diff*.36-home*.45+defensiveRisk;
 const random=rng(hash(`${save.clubId}-${fixture.id}-${save.season}-${save.matches?.length||0}-${coach.name}`)+Date.now()%9973),gf=goals(expectedFor,random),ga=goals(expectedAgainst,random),possession=clamp(Math.round(50+(plan.lineupOverall-opp)*1.2+m.pressBias*8+(random()-.5)*8),28,72),shots=Math.max(3,Math.round(8+expectedFor*4+random()*5)),shotsAgainst=Math.max(3,Math.round(8+expectedAgainst*4+random()*5)),xg=Math.max(.2,Math.round((expectedFor+(random()-.5)*.35)*100)/100),xga=Math.max(.2,Math.round((expectedAgainst+(random()-.5)*.35)*100)/100);
 return{gf,ga,possession,shots,shotsAgainst,xg,xga,teamOverall,plan,coachProfile:m.profile};
}
