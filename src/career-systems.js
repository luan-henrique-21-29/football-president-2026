import { buildCalendar,leagueProfile } from './game.js';
import { formatCurrency } from './world.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DAY=86400000;
const addDays=(date,days)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const addYears=(date,years)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCFullYear(d.getUTCFullYear()+years);return d.toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.floor((new Date(`${b}T12:00:00Z`)-new Date(`${a}T12:00:00Z`))/DAY);

export const ACHIEVEMENTS=[
'Primeiro Jogo','Primeira Vitória','Primeiro Empate','Primeira Contratação','Primeira Venda','Primeiro Técnico','Primeira Demissão','Primeira Renovação','Primeiro Empréstimo','Primeiro Projeto',
'Primeiro Jovem','Primeiro Gol de Jovem','Confiança 80','Confiança 90','Relação Excelente','Relação Insustentável','Caixa Positivo','Sem Dívidas','Bilionário','Orçamento Gigante',
'Compra Milionária','Compra de €50M','Compra de €100M','Venda Milionária','Venda de €50M','Venda de €100M','Janela Positiva','Janela Agressiva','Negociador','Gastador',
'Formador','Ambicioso','Conservador','Temporada Positiva','Top 10','Top 6','Top 4','Vice-campeão','Campeão Nacional','Bicampeão',
'Tricampeão','Cinco Títulos','Dez Títulos','Campeão Continental','Tríplice Coroa','Promovido','Da Segunda ao Topo','Sobreviveu ao Rebaixamento','Reconstrução','Gigante Recuperado',
'Invicto por 5','Invicto por 10','Cinco Vitórias Seguidas','Dez Vitórias Seguidas','100 Gols','500 Gols','1000 Gols','Saldo Positivo','Defesa de Ferro','Ataque Implacável',
'Base Nível 6','Base Nível 8','Base Nível 10','Scouting Nível 8','Estádio Ampliado','Novo Estádio','Fábrica de Talentos','Ídolo Mantido','Técnico Premiado','Presidente do Ano',
'Reputação 60','Reputação 70','Reputação 80','Reputação 90','Presidente Lendário','10 Anos no Clube','20 Anos no Clube','30 Anos no Clube','50 Anos no Clube','Dinastia'
];

export function ensureCareerSystems(save,club){
  save.seasonNo??=1;save.relation??=72;save.projects??=[];save.youth??=[];save.achievements??=[];save.coachRequests??=[];save.pressHistory??=[];save.clubHistory??=[];save.seasonHistory??=[];save.trophies??=[];save.records??={biggestBuy:0,biggestSale:0,biggestWin:null,winStreak:0,unbeaten:0,goals:0};
  save.presidentStats??={seasons:0,titles:0,coachesHired:0,coachesFired:0,bought:0,sold:0,moneySpent:0,moneyReceived:0,clubs:[save.clubId],reputation:save.president?.reputation??50};
  save.fans??={trust:save.fanTrust??68,loyalty:70,expectation:Math.max(45,club?.reputation||70),satisfaction:save.fanTrust??68,estimatedSupporters:Math.round(Math.pow(Math.max(50,club?.reputation||70),3)*18)};
  save.facilities??={academy:club?.academyQuality||5,scouting:club?.scoutingQuality||5,training:club?.facilitiesQuality||5,stadium:5,capacity:club?.stadiumSeats||30000,boxes:4,pitch:6};
  const base=Math.max(8_000_000,save.transferBudget||20_000_000);
  save.financialModel??={debt:0,monthlyRevenue:Math.round(base*.11),monthlyExpenses:Math.round(base*.085),sponsorRevenue:Math.round(base*.28),commercialRevenue:Math.round(base*.18),ticketPrice:42,history:[{date:save.date||'2026-08-14',cash:save.cash||0,revenue:0,expenses:0}]};
  save.staff??={sportingDirector:null,directorAutonomy:'LOW',transferAuthority:'PRESIDENT',scouts:[],medicalLevel:5};
  save.nextYouthDate??=addYears(save.date||'2026-08-14',1);save.lastFinanceMonth??=(save.date||'2026-08-14').slice(0,7);save.settings??={matchSpeed:1,animations:true,currency:'EUR',language:'pt-BR',crowdVolume:.7,effectsVolume:.8,theme:'dark',americanPyramid:false};
  save.unlockedModes??={};save.pendingDecisions??=[];
  return save;
}
export function relationState(v){return v>=85?'Excelente':v>=70?'Boa':v>=55?'Normal':v>=40?'Tensa':v>=25?'Ruim':'Insustentável';}
export function unlock(save,name){if(!ACHIEVEMENTS.includes(name)||save.achievements.includes(name))return false;save.achievements.push(name);save.news?.unshift({date:save.date,title:`Conquista: ${name}`,body:'Nova conquista desbloqueada na carreira presidencial.'});return true;}
export function achievementChecks(save){
  const p=save.presidentStats,r=save.records,f=save.facilities;
  if(save.matches?.length)unlock(save,'Primeiro Jogo');if(save.table?.wins>=1)unlock(save,'Primeira Vitória');if(save.table?.draws>=1)unlock(save,'Primeiro Empate');if(p.bought>=1)unlock(save,'Primeira Contratação');if(p.sold>=1)unlock(save,'Primeira Venda');if(p.coachesHired>=1)unlock(save,'Primeiro Técnico');if(p.coachesFired>=1)unlock(save,'Primeira Demissão');
  if(save.fans.trust>=80)unlock(save,'Confiança 80');if(save.fans.trust>=90)unlock(save,'Confiança 90');if(save.relation>=85)unlock(save,'Relação Excelente');if(save.relation<25)unlock(save,'Relação Insustentável');if(save.cash>=1e9)unlock(save,'Bilionário');if(save.financialModel.debt<=0)unlock(save,'Sem Dívidas');
  if(f.academy>=6)unlock(save,'Base Nível 6');if(f.academy>=8)unlock(save,'Base Nível 8');if(f.academy>=10)unlock(save,'Base Nível 10');if(f.scouting>=8)unlock(save,'Scouting Nível 8');if(save.youth.length)unlock(save,'Primeiro Jovem');
  if(r.unbeaten>=5)unlock(save,'Invicto por 5');if(r.unbeaten>=10)unlock(save,'Invicto por 10');if(r.winStreak>=5)unlock(save,'Cinco Vitórias Seguidas');if(r.winStreak>=10)unlock(save,'Dez Vitórias Seguidas');if(r.goals>=100)unlock(save,'100 Gols');if(r.goals>=500)unlock(save,'500 Gols');if(r.goals>=1000)unlock(save,'1000 Gols');
  if(p.reputation>=60)unlock(save,'Reputação 60');if(p.reputation>=70)unlock(save,'Reputação 70');if(p.reputation>=80)unlock(save,'Reputação 80');if(p.reputation>=90)unlock(save,'Reputação 90');if(p.reputation>=95)unlock(save,'Presidente Lendário');
  if(save.seasonNo>=11)unlock(save,'10 Anos no Clube');if(save.seasonNo>=21)unlock(save,'20 Anos no Clube');if(save.seasonNo>=31)unlock(save,'30 Anos no Clube');if(save.seasonNo>=51)unlock(save,'50 Anos no Clube');if(p.titles>=5)unlock(save,'Cinco Títulos');if(p.titles>=10){unlock(save,'Dez Títulos');unlock(save,'Dinastia');}
}

export function afterMatchCareer(save,result,fixture){
  ensureCareerSystems(save,save.clubSnapshot);save.records.goals+=result.gf;
  if(result.gf>result.ga){save.records.winStreak++;save.records.unbeaten++;}else if(result.gf===result.ga){save.records.winStreak=0;save.records.unbeaten++;}else{save.records.winStreak=0;save.records.unbeaten=0;}
  const margin=result.gf-result.ga;if(!save.records.biggestWin||margin>save.records.biggestWin.margin)save.records.biggestWin={margin,score:`${result.gf}-${result.ga}`,opponent:fixture.opponentName,date:fixture.date};
  save.fans.trust=clamp((save.fanTrust??save.fans.trust)+(result.gf>result.ga?1.2:result.gf<result.ga?-1.1:.1),0,100);save.fanTrust=save.fans.trust;save.fans.satisfaction=clamp(save.fans.satisfaction+(result.gf>result.ga?1:-.35),0,100);
  if(fixture.importance>=1.35&&result.gf>result.ga)save.fans.trust=clamp(save.fans.trust+1,0,100);
  achievementChecks(save);
}

export function processMonthlyFinance(save,date,homeMatches=0){
  ensureCareerSystems(save,save.clubSnapshot);const month=date.slice(0,7);if(month===save.lastFinanceMonth)return null;
  const f=save.financialModel,gate=Math.round(homeMatches*Math.max(0,save.facilities.capacity)*f.ticketPrice*.72),academyCost=save.facilities.academy*110000,scoutingCost=save.facilities.scouting*85000,staffCost=save.staff.scouts.length*65000+(save.staff.sportingDirector?180000:0),revenue=f.monthlyRevenue+Math.round(f.sponsorRevenue/12)+Math.round(f.commercialRevenue/12)+gate,expenses=f.monthlyExpenses+academyCost+scoutingCost+staffCost;
  save.cash+=revenue-expenses;save.transactions.push({date,type:'Fechamento mensal',description:`Receitas ${formatCurrency(revenue)} • Despesas ${formatCurrency(expenses)}`,amount:revenue-expenses});f.history.push({date,cash:save.cash,revenue,expenses});if(f.history.length>180)f.history.shift();save.lastFinanceMonth=month;
  if(save.cash<0){f.debt+=Math.abs(save.cash);save.cash=0;save.boardTrust=clamp(save.boardTrust-3,0,100);save.news.unshift({date,title:'Pressão financeira aumenta',body:`O clube precisou absorver ${formatCurrency(f.debt)} em dívida acumulada.`});}
  achievementChecks(save);return{revenue,expenses,gate};
}

export const PROJECTS={
  stadium:{name:'Ampliação do estádio',cost:18_000_000,days:180,apply:s=>{s.facilities.stadium=clamp(s.facilities.stadium+1,1,10);s.facilities.capacity+=5000;unlock(s,'Estádio Ampliado')}},
  academy:{name:'Centro de formação',cost:9_000_000,days:120,apply:s=>s.facilities.academy=clamp(s.facilities.academy+1,1,10)},
  scouting:{name:'Rede internacional de scouting',cost:6_500_000,days:90,apply:s=>s.facilities.scouting=clamp(s.facilities.scouting+1,1,10)},
  training:{name:'Centro de treinamento',cost:12_000_000,days:150,apply:s=>s.facilities.training=clamp(s.facilities.training+1,1,10)},
  pitch:{name:'Gramado e tecnologia',cost:3_000_000,days:60,apply:s=>s.facilities.pitch=clamp(s.facilities.pitch+1,1,10)},
  boxes:{name:'Camarotes premium',cost:7_000_000,days:120,apply:s=>s.facilities.boxes=clamp(s.facilities.boxes+1,1,10)}
};
export function startProject(save,type,date){const p=PROJECTS[type];if(!p)return{ok:false,message:'Projeto inválido.'};if(save.projects.some(x=>x.type===type))return{ok:false,message:'Já existe um projeto desse tipo.'};if(save.cash<p.cost)return{ok:false,message:'Caixa insuficiente.'};save.cash-=p.cost;save.projects.push({id:`${type}-${Date.now()}`,type,name:p.name,cost:p.cost,start:date,finish:addDays(date,p.days)});save.transactions.push({date,type:'Infraestrutura',description:p.name,amount:-p.cost});unlock(save,'Primeiro Projeto');return{ok:true,message:`${p.name} aprovado.`};}
export function processProjects(save,date){const done=save.projects.filter(p=>p.finish<=date);for(const item of done){PROJECTS[item.type]?.apply(save);save.news.unshift({date,title:'Obra concluída',body:`${item.name} foi concluído.`});}save.projects=save.projects.filter(p=>p.finish>date);achievementChecks(save);return done;}

const firstNames={Brazil:['Caio','Rafael','Gabriel','João','Matheus','Lucas','Pedro','Gustavo'],England:['Jack','Lewis','Oliver','Harry','George','Charlie','Alfie'],Spain:['Álvaro','Iker','Pablo','Hugo','Alejandro','Sergio'],France:['Lucas','Hugo','Enzo','Mathis','Noah','Théo'],Italy:['Luca','Marco','Matteo','Alessandro','Davide'],Germany:['Lukas','Jonas','Leon','Felix','Noah'],Argentina:['Tomás','Santiago','Facundo','Mateo','Julián'],Portugal:['João','Diogo','Tiago','Gonçalo','Rafael'],USA:['Ethan','Liam','Noah','Mason','Logan'],SaudiArabia:['Fahad','Saud','Abdullah','Nawaf','Khalid']};
const lastNames={Brazil:['Silva','Santos','Oliveira','Costa','Souza','Lima','Almeida'],England:['Smith','Brown','Taylor','Wilson','Walker','Clark'],Spain:['García','Martínez','López','Sánchez','Ruiz'],France:['Martin','Bernard','Dubois','Thomas','Robert'],Italy:['Rossi','Romano','Ricci','Conti','Esposito'],Germany:['Müller','Schmidt','Fischer','Weber','Wagner'],Argentina:['Gómez','Fernández','Romero','Álvarez','Acosta'],Portugal:['Ferreira','Costa','Pereira','Martins','Mendes'],USA:['Johnson','Williams','Miller','Davis','Anderson'],SaudiArabia:['Al-Qahtani','Al-Harbi','Al-Dawsari','Al-Shammari','Al-Ghamdi']};
function countryKey(country=''){const n=country.toLowerCase();if(n.includes('brazil')||n.includes('brasil'))return'Brazil';if(n.includes('eng'))return'England';if(n.includes('span')||n.includes('espan'))return'Spain';if(n.includes('fran'))return'France';if(n.includes('ital'))return'Italy';if(n.includes('germ'))return'Germany';if(n.includes('arg'))return'Argentina';if(n.includes('port'))return'Portugal';if(n.includes('saudi')||n.includes('aráb'))return'SaudiArabia';return'USA';}
export function maybeGenerateYouth(save,club,date){ensureCareerSystems(save,club);if(date<save.nextYouthDate)return[];const key=countryKey(club?.country),count=Math.max(1,Math.min(4,Math.floor(save.facilities.academy/3))),generated=[];for(let i=0;i<count;i++){const fn=firstNames[key][Math.floor(Math.random()*firstNames[key].length)],ln=lastNames[key][Math.floor(Math.random()*lastNames[key].length)],age=16+Math.floor(Math.random()*3),ovr=52+Math.floor(Math.random()*10)+save.facilities.academy,pot=clamp(ovr+8+Math.floor(Math.random()*15)+Math.floor(save.facilities.scouting/2),68,94);generated.push({id:`youth-${Date.now()}-${i}`,name:`${fn} ${ln}`,age,nationality:key,position:['Goalkeeper','Defence','Midfield','Attack'][Math.floor(Math.random()*4)],subPosition:'Jovem da base',overall:ovr,potential:pot,marketValue:Math.round(Math.pow(ovr-45,2)*15000),estimatedWage:Math.round((500+ovr*25)/100)*100,contractExpiration:addYears(date,3),energy:100,form:65,morale:72,youth:true,history:[]});}
  save.youth.push(...generated);save.nextYouthDate=addYears(date,1);save.news.unshift({date,title:'Nova geração da base',body:`${generated.length} jovem(ns) chegaram ao centro de formação.`});unlock(save,'Primeiro Jovem');if(save.facilities.academy>=8)unlock(save,'Fábrica de Talentos');return generated;}

export function maybeCoachRequest(save,date,squad=[]){if(save.pendingDecisions.length||Math.random()>.13)return null;const needs=['Goalkeeper','Defence','Midfield','Attack'].map(pos=>({pos,count:squad.filter(p=>p.position===pos).length})).sort((a,b)=>a.count-b.count)[0];const requests=[{type:'REINFORCEMENT',title:`O técnico pede reforço para ${needs?.pos||'o elenco'}`,body:'Prioridade esportiva alta. Aprovar mais orçamento melhora a relação; recusar pode desgastar.'},{type:'ACADEMY',title:'O técnico pede investimento na base',body:'A comissão acredita que o clube precisa melhorar a formação de jovens.'},{type:'RENEW',title:'O técnico quer discutir renovação',body:'A comissão procura estabilidade para continuar o projeto.'}];const r=requests[Math.floor(Math.random()*requests.length)];const decision={id:`decision-${Date.now()}`,date,...r};save.pendingDecisions.push(decision);save.news.unshift({date,title:'Reunião com o treinador',body:r.title});return decision;}
export function resolveCoachDecision(save,id,choice){const d=save.pendingDecisions.find(x=>x.id===id);if(!d)return;let delta=0;if(d.type==='REINFORCEMENT'){if(choice==='approve'){save.transferBudget+=Math.round(Math.max(1_000_000,save.cash*.06));delta=7}else if(choice==='reject')delta=-8;else delta=-2;}if(d.type==='ACADEMY'){if(choice==='approve'&&save.cash>=2_000_000){save.cash-=2_000_000;save.facilities.academy=clamp(save.facilities.academy+1,1,10);delta=8}else delta=-5;}if(d.type==='RENEW'){if(choice==='approve'){save.coach.contractUntil=addYears(save.date,2);delta=10}else delta=-8;}save.relation=clamp(save.relation+delta,0,100);save.pendingDecisions=save.pendingDecisions.filter(x=>x.id!==id);save.news.unshift({date:save.date,title:'Decisão presidencial',body:`Resposta à reunião com o técnico: ${choice}. Relação agora ${relationState(save.relation)} (${save.relation}/100).`});achievementChecks(save);}

export function finishSeason(save,club,world){if(save.nextFixtureIndex<save.calendar.length)return null;ensureCareerSystems(save,club);const t=save.table,played=Math.max(1,t.played),performance=t.points/(played*3),estimatedPosition=Math.max(1,Math.round((1-performance)*18+1));const champion=estimatedPosition===1;save.seasonHistory.push({season:save.season,club:club.name,position:estimatedPosition,played:t.played,wins:t.wins,draws:t.draws,losses:t.losses,gf:t.gf,ga:t.ga,points:t.points,coach:save.coach.name,cash:save.cash});save.presidentStats.seasons++;if(champion){save.presidentStats.titles++;save.trophies.push({season:save.season,name:club.league});save.presidentStats.reputation=clamp(save.presidentStats.reputation+6,0,100);unlock(save,'Campeão Nacional');if(save.presidentStats.titles===2)unlock(save,'Bicampeão');if(save.presidentStats.titles===3)unlock(save,'Tricampeão');}
  const oldYear=Number(save.season.slice(0,4))||2026,newYear=oldYear+1;save.season=`${newYear}/${String(newYear+1).slice(-2)}`;save.seasonNo++;save.table={played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0};save.matches=[];save.nextFixtureIndex=0;const clubs=world.clubsInCompetition(club.competitionId).length>2?world.clubsInCompetition(club.competitionId):world.clubs.filter(c=>c.league===club.league);save.calendar=buildCalendar(club,clubs,`${newYear}-08-15`);save.date=`${newYear}-08-14`;save.news.unshift({date:save.date,title:'Nova temporada',body:`A temporada ${save.season} começa. Na anterior, o clube terminou em ${estimatedPosition}º.`});achievementChecks(save);return{position:estimatedPosition,champion};}
