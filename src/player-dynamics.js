const DAY=86400000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const addDays=(date,days)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const monthsBetween=(a,b)=>{if(!a||!b)return 999;return Math.round((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/2629800000)};
const daysBetween=(a,b)=>{if(!a||!b)return 999;return Math.floor((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/DAY)};
const hash=s=>[...String(s)].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261)>>>0;
const seeded=(seed,n=0)=>(((Math.imul(seed^(n*2654435761),1664525)+1013904223)>>>0)/4294967296);
const median=a=>{const x=a.filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return 0;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
const roleWeight={KEY:1,STARTER:.82,ROTATION:.58,PROSPECT:.36};
const roleStarts={KEY:.76,STARTER:.58,ROTATION:.28,PROSPECT:.12};

export function ensurePlayerDynamics(save){
 if(!save)return save;
 save.playerDynamics??={};
 save.playerDemands??=[];
 save.playerPromises??=[];
 save.agentNegotiations??={};
 return save;
}

export function playerPersonality(player){
 const seed=hash(`${player?.id||player?.name||'player'}|${player?.dateOfBirth||player?.age||''}`);
 const ambition=Math.round(42+seeded(seed,1)*53),loyalty=Math.round(35+seeded(seed,2)*60),moneyFocus=Math.round(34+seeded(seed,3)*62),roleFocus=Math.round(38+seeded(seed,4)*58),patience=Math.round(32+seeded(seed,5)*64),adaptability=Math.round(38+seeded(seed,6)*57);
 const archetype=moneyFocus>=76?'Financeiro':ambition>=78?'Ambicioso':loyalty>=78?'Leal':roleFocus>=78?'Competitivo':adaptability>=76?'Adaptável':'Equilibrado';
 return{seed,ambition,loyalty,moneyFocus,roleFocus,patience,adaptability,archetype};
}

export function agentProfile(player){
 const p=playerPersonality(player),seed=p.seed;
 const strictness=Math.round(40+p.moneyFocus*.36+(100-p.patience)*.22+seeded(seed,9)*12);
 const patienceRounds=clamp(Math.round(5-strictness/28),2,4);
 const style=strictness>=76?'Rígido':p.moneyFocus>=72?'Financeiro':p.roleFocus>=72?'Foco esportivo':p.loyalty>=72?'Conciliador':'Equilibrado';
 return{style,strictness:clamp(strictness,35,95),patienceRounds,playerArchetype:p.archetype};
}

export function currentPlayerWage(save,player){return Number(save?.playerContracts?.[player?.id]?.salary||player?.estimatedWage||0)}
export function squadWageContext(save,players=[]){const wages=players.map(p=>currentPlayerWage(save,p)).filter(x=>x>0),sorted=[...wages].sort((a,b)=>b-a);return{median:median(wages),average:wages.length?wages.reduce((a,b)=>a+b,0)/wages.length:0,top:sorted[0]||0,top5:median(sorted.slice(0,5))||sorted[0]||0}}
export function recentStartRate(save,playerId,count=8){const games=(save?.matches||[]).slice(-count);if(!games.length)return 1;const starts=games.filter(m=>(m.lineup||[]).some(p=>String(p.id)===String(playerId))).length;return starts/games.length}

export function playerDynamicsSummary(save,player,players=[]){
 ensurePlayerDynamics(save);const id=String(player.id),dyn=save.playerDynamics[id]??={happiness:72,lastDemandDate:null,lastConversation:null},personality=playerPersonality(player),wage=currentPlayerWage(save,player),wages=squadWageContext(save,players),contract=save.playerContracts?.[player.id]||{},role=contract.role||((player.overall||0)>=85?'KEY':(player.overall||0)>=78?'STARTER':(player.age||99)<=21?'PROSPECT':'ROTATION'),startRate=recentStartRate(save,id),expectedStarts=roleStarts[role]??.35,pending=save.playerDemands.find(d=>d.status==='PENDING'&&String(d.playerId)===id)||null;
 return{...dyn,personality,wage,wageContext:wages,role,startRate,expectedStarts,pending};
}

export function contractExpectation(save,player,players=[]){
 ensurePlayerDynamics(save);const person=playerPersonality(player),agent=agentProfile(player),wages=squadWageContext(save,players),base=Math.max(1000,currentPlayerWage(save,player),Math.max(1500,(player.marketValue||1e6)*.00013)),ovr=player.overall||70;
 const role=ovr>=86?'KEY':ovr>=79?'STARTER':(player.age||99)<=21?'PROSPECT':'ROTATION',hierarchyTarget=Math.max(wages.median*(roleWeight[role]||.6),wages.top5*(role==='KEY'?.88:role==='STARTER'?.68:.42));
 const marketTarget=base*(1+Math.max(0,ovr-76)*.018)*(0.9+person.moneyFocus/500),wage=Math.round(Math.max(base,hierarchyTarget,marketTarget)/100)*100;
 const bonus=Math.max(50000,Math.round((player.marketValue||1e6)*(.014+person.moneyFocus/5000+Math.max(0,ovr-80)*.0012)/10000)*10000),years=(player.age||25)>=32?2:(player.age||25)<=22?4:3,releasePreference=person.ambition>=78&&person.loyalty<65,releaseClause=releasePreference?Math.round(Math.max(player.marketValue||1e6,(player.marketValue||1e6)*(1.35+person.ambition/180))/100000)*100000:0;
 return{wage,bonus,years,role,releasePreference,releaseClause,agent,personality:person,wageContext:wages};
}

export function negotiationAvailability(save,player,date){ensurePlayerDynamics(save);const s=save.agentNegotiations[String(player.id)]||{rounds:0,blockedUntil:null};return{...s,available:!s.blockedUntil||s.blockedUntil<=date}}
export function registerNegotiationRound(save,player,date,accepted=false){ensurePlayerDynamics(save);const id=String(player.id),agent=agentProfile(player),s=save.agentNegotiations[id]??={rounds:0,blockedUntil:null};if(accepted){delete save.agentNegotiations[id];return{closed:false,rounds:0}}s.rounds=(s.rounds||0)+1;if(s.rounds>=agent.patienceRounds){s.blockedUntil=addDays(date,7+Math.round(agent.strictness/18));s.rounds=0;return{closed:true,blockedUntil:s.blockedUntil}}return{closed:false,rounds:s.rounds,remaining:agent.patienceRounds-s.rounds}}

export function evaluateContractTerms(save,player,players,offer){
 const want=contractExpectation(save,player,players),person=want.personality,roleNeed=want.role;
 let score=(offer.wage/Math.max(1,want.wage))*.66+(offer.bonus/Math.max(1,want.bonus))*.13+(offer.years>=want.years?.06:.015);
 if(offer.role===roleNeed)score+=.105;else if(offer.role==='KEY')score+=.075;else if(roleNeed==='KEY'&&offer.role==='ROTATION')score-=.16;else if(roleNeed==='STARTER'&&offer.role==='PROSPECT')score-=.13;
 if(want.releasePreference){if(offer.releaseClause>=want.releaseClause*.85)score+=.085;else if(!offer.releaseClause)score-=.075}
 score+=((100-want.agent.strictness)/100)*.035+(person.loyalty/100)*.025;
 const accepted=score>=.91,counter={wage:Math.round(want.wage*(.98+Math.random()*.07)/100)*100,bonus:Math.round(want.bonus*(.9+Math.random()*.18)/10000)*10000,years:want.years,role:roleNeed,releaseClause:want.releaseClause};
 return{accepted,score,want,counter};
}

function ownPlayers(save,world){if(!world?.players)return[];const acquired=new Set((save.acquiredPlayerIds||[]).map(String)),sold=new Set((save.soldPlayerIds||[]).map(String)),out=new Set((save.loans||[]).filter(l=>l.active&&l.direction==='OUT').map(l=>String(l.playerId)));return world.players.filter(p=>(String(p.currentClubId)===String(save.clubId)||acquired.has(String(p.id)))&&!sold.has(String(p.id))&&!out.has(String(p.id)))}
function demandExists(save,id,type){return save.playerDemands.some(d=>String(d.playerId)===String(id)&&d.type===type&&['PENDING','ACKNOWLEDGED'].includes(d.status))}
function createDemand(save,p,type,date,message,priority='NORMAL'){const d={id:`demand-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,playerId:String(p.id),playerName:p.name,type,date,expires:addDays(date,30),status:'PENDING',priority,message};save.playerDemands.unshift(d);save.news?.unshift({date,title:`${p.name}: ${type==='RENEWAL'?'pedido de renovação':type==='ROLE'?'conversa sobre espaço':type==='WAGE'?'insatisfação salarial':'pedido de saída'}`,body:message});return d}

export function processPlayerDynamics(save,world,date){
 ensurePlayerDynamics(save);if(save.playerDynamicsLastTick&&daysBetween(save.playerDynamicsLastTick,date)<7)return[];save.playerDynamicsLastTick=date;const players=ownPlayers(save,world),wages=squadWageContext(save,players),created=[];
 save.playerDemands.forEach(d=>{if(d.status==='PENDING'&&d.expires<date)d.status='EXPIRED'});
 for(const p of players){const id=String(p.id),dyn=save.playerDynamics[id]??={happiness:72,lastDemandDate:null,lastConversation:null},person=playerPersonality(p),wage=currentPlayerWage(save,p),role=save.playerContracts?.[p.id]?.role||((p.overall||0)>=85?'KEY':(p.overall||0)>=78?'STARTER':'ROTATION'),startRate=recentStartRate(save,id),expected=roleStarts[role]??.35,months=monthsBetween(date,p.contractExpiration),cooldown=!dyn.lastDemandDate||daysBetween(dyn.lastDemandDate,date)>=28;
 let delta=.4;if(startRate+0.13<expected)delta-=2.6*(person.roleFocus/70);else if(startRate>=expected)delta+=.7;if(months<=8)delta-=.8;if(wages.median&&wage<wages.median*.65&&(p.overall||0)>=78)delta-=1.2*(person.moneyFocus/70);dyn.happiness=clamp((dyn.happiness??72)+delta,0,100);
 if(cooldown&&!demandExists(save,id,'RENEWAL')&&months<=9&&months>=0){created.push(createDemand(save,p,'RENEWAL',date,`O estafe quer discutir um novo contrato antes que o vínculo entre na reta final.`,months<=5?'HIGH':'NORMAL'));dyn.lastDemandDate=date;continue}
 if(cooldown&&!demandExists(save,id,'ROLE')&&startRate+0.18<expected&&person.roleFocus>=58&&(p.overall||0)>=76){created.push(createDemand(save,p,'ROLE',date,`O jogador esperava mais minutos pelo papel prometido (${role}). Ele quer uma conversa sobre utilização.`,person.roleFocus>=78?'HIGH':'NORMAL'));dyn.lastDemandDate=date;continue}
 if(cooldown&&!demandExists(save,id,'WAGE')&&wages.median&&wage<wages.median*.62&&(p.overall||0)>=80&&person.moneyFocus>=58){created.push(createDemand(save,p,'WAGE',date,`O estafe considera o salário de ${p.name} abaixo da hierarquia atual do elenco e quer renegociar.`,person.moneyFocus>=78?'HIGH':'NORMAL'));dyn.lastDemandDate=date;continue}
 if(cooldown&&!demandExists(save,id,'TRANSFER')&&dyn.happiness<32&&person.loyalty<72){created.push(createDemand(save,p,'TRANSFER',date,`A insatisfação chegou a um ponto crítico e o jogador pediu para ouvir propostas de outros clubes.`,'HIGH'));dyn.lastDemandDate=date}
 }
 save.playerDemands=save.playerDemands.slice(0,120);return created;
}

export function resolvePlayerDemand(save,playerId,action,date){
 ensurePlayerDynamics(save);const id=String(playerId),d=save.playerDemands.find(x=>x.status==='PENDING'&&String(x.playerId)===id);if(!d)return{ok:false};const dyn=save.playerDynamics[id]??={happiness:72};dyn.lastConversation=date;
 if(action==='PROMISE'){d.status='RESOLVED';save.playerPromises.push({id:`promise-${Date.now()}`,playerId:id,type:'MINUTES',date,until:addDays(date,70),targetStartRate:.55,status:'ACTIVE'});dyn.happiness=clamp((dyn.happiness||72)+8,0,100);return{ok:true,message:'Você prometeu mais oportunidades. O jogador espera ver isso nas próximas partidas.'}}
 if(action==='LIST'){d.status='RESOLVED';if(!save.transferListed.includes(id))save.transferListed.push(id);save.loanListed=save.loanListed.filter(x=>String(x)!==id);dyn.happiness=clamp((dyn.happiness||72)-2,0,100);return{ok:true,message:'O clube aceitou ouvir propostas pelo jogador.'}}
 if(action==='ACKNOWLEDGE'){d.status='ACKNOWLEDGED';dyn.happiness=clamp((dyn.happiness||72)+2,0,100);return{ok:true,message:'O estafe aceitou abrir negociação.'}}
 d.status='REFUSED';dyn.happiness=clamp((dyn.happiness||72)-12,0,100);return{ok:true,message:'O pedido foi recusado. A relação com o jogador piorou.'};
}

export function markPlayerRenewed(save,playerId){ensurePlayerDynamics(save);const id=String(playerId);save.playerDemands.filter(d=>String(d.playerId)===id&&['RENEWAL','WAGE'].includes(d.type)&&['PENDING','ACKNOWLEDGED'].includes(d.status)).forEach(d=>d.status='RESOLVED');const dyn=save.playerDynamics[id]??={happiness:72};dyn.happiness=clamp((dyn.happiness||72)+10,0,100)}
