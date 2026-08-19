import * as core from './game-v5.js';
import {applyPresidentLineup,lineupSignature} from './lineup-state.js';
import {exactCoachSelection} from './exact-lineup.js';

export * from './game-v5.js';
export function coachSelection(squad,fixture,nextFixture,teamOverall,coach={}){return exactCoachSelection(core.coachSelection(squad,fixture,nextFixture,teamOverall,coach),squad,{fixture})}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=str=>[...String(str)].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,2166136261)>>>0;
function rng(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}
function goals(lambda,random){const L=Math.exp(-clamp(lambda,.15,3.9));let k=0,p=1;do{k++;p*=random()}while(p>L&&k<9);return k-1}
function group(p){const x=`${p?.position||''} ${p?.subPosition||''}`.toLowerCase();if(/goal|keeper|gole/.test(x))return'GK';if(/defen|back|zague|lateral/.test(x))return'DEF';if(/mid|meia|medio|volante|wing/.test(x))return'MID';return'ATT'}
function weightedPick(list,weight,random){if(!list?.length)return null;const weights=list.map(x=>Math.max(.01,weight(x))),sum=weights.reduce((a,b)=>a+b,0);let r=random()*sum;for(let i=0;i<list.length;i++){r-=weights[i];if(r<=0)return list[i]}return list.at(-1)}
function contributors(plan,gf,random){const starters=plan.starters||[],out=[],weight=p=>group(p)==='ATT'?5.8:group(p)==='MID'?2.8:group(p)==='DEF'?.65:.08;for(let i=0;i<gf;i++){const scorer=weightedPick(starters,weight,random);if(!scorer)continue;const pool=starters.filter(p=>String(p.id)!==String(scorer.id)),assist=random()<.72?weightedPick(pool,p=>group(p)==='MID'?4.2:group(p)==='ATT'?2.6:1,random):null;out.push({scorerId:String(scorer.id),scorer:scorer.name,assistId:assist?String(assist.id):null,assist:assist?.name||null})}return out}
function substitutions(plan,profile,random,scoreDiff){if(!plan?.bench?.length)return[];const desired=clamp(2+(profile?.pressing>=68?1:0)+(profile?.tempo>=72?1:0)+(scoreDiff<0&&profile?.attackingRisk>=62?1:0),2,5),minutes=[56,63,70,77,83],usedOut=new Set(),usedIn=new Set(),events=[];for(let i=0;i<Math.min(desired,plan.bench.length);i++){let available=plan.starters.filter(p=>group(p)!=='GK'&&!usedOut.has(String(p.id)));if(!available.length)break;available=available.sort((a,b)=>((a.energy??90)+(a.overall||70)*.16)-((b.energy??90)+(b.overall||70)*.16));const out=available[Math.min(i,available.length-1)];let candidates=plan.bench.filter(p=>!usedIn.has(String(p.id))&&group(p)===group(out));if(!candidates.length&&scoreDiff<0&&i>=2)candidates=plan.bench.filter(p=>!usedIn.has(String(p.id))&&group(p)==='ATT');if(!candidates.length)candidates=plan.bench.filter(p=>!usedIn.has(String(p.id))&&group(p)!=='GK');const incoming=candidates[0];if(!incoming)break;const minute=clamp(minutes[i]+Math.round((random()-.5)*4),52,86);out.replacedAt=minute;incoming.subMinute=minute;usedOut.add(String(out.id));usedIn.add(String(incoming.id));events.push({minute,outId:String(out.id),outName:out.name,inId:String(incoming.id),inName:incoming.name,reason:scoreDiff<0&&i>=2?'Busca mais força ofensiva':(out.energy??90)<76?'Gestão de energia':'Ajuste tático'})}return events}

export function simulateFixture(args){
 const result=core.simulateFixture(args),override=args?.save?.presidentLineup,manual=applyPresidentLineup(result.plan,args?.squad||[],override);
 if(!manual)return result;
 manual.coachProfile=result.plan?.coachProfile||result.coachProfile;
 manual.style=result.plan?.style||manual.coachProfile?.style||'Equilibrado';
 manual.setPieces=core.setPieceTakers(manual.starters,manual.coachProfile||result.coachProfile||{});
 const oldOvr=Number(result.plan?.lineupOverall||manual.lineupOverall),delta=(manual.lineupOverall-oldOvr)/10,fitLoss=Math.max(0,1-(manual.fitAverage||1)),seed=hash(`${result.matchSeed}|${lineupSignature(override)}`),random=rng(seed),xg=clamp(Number(result.xg||1.2)+delta*.28-fitLoss*.95+(random()-.5)*.08,.2,4),xga=clamp(Number(result.xga||1.2)-delta*.2+fitLoss*.62+(random()-.5)*.08,.2,4),gf=goals(xg,random),ga=goals(xga,random),poss=clamp(Math.round(Number(result.possession||50)+delta*3.5-fitLoss*15+(random()-.5)*3),24,76),shots=Math.max(gf+2,Math.round(6+xg*4.6+random()*4)),shotsAgainst=Math.max(ga+2,Math.round(6+xga*4.6+random()*4));
 result.plan=manual;result.gf=gf;result.ga=ga;result.xg=Math.round(xg*100)/100;result.xga=Math.round(xga*100)/100;result.possession=poss;result.shots=shots;result.shotsAgainst=shotsAgainst;result.matchSeed=seed;result.playerGoalEvents=contributors(manual,gf,random);result.substitutions=substitutions(manual,manual.coachProfile||{},random,gf-ga);result.shootout=core.knockoutShootout(result,args.fixture);result.manualLineupApplied=true;return result;
}
