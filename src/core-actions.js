import {
  state,currentClub,nextFixture,squad,gameDate,persist,storePlayerState,ensurePlayers,
  formatCurrency,formatDate,clubBudgetBase,addYears
} from './state.js';
import {simulateFixture,applyMatchFitness} from './game-v2.js';
import {showMatchViewer} from './match-viewer.js';
import {availableForFixture} from './player-career.js';
import {recordLeagueMatch} from './league-engine.js';
import {runPostMatchExtra} from './post-match-extra.js';
import {afterMatchCareer,processMonthlyFinance,achievementChecks,unlock} from './career-systems.js';
import {processDuePayments,processLoans} from './transfer-engine.js';
import {finishSeasonAdvanced} from './season-engine.js';
import {resolvePlayerDemand} from './player-dynamics.js';
import {coachResults} from './coach-v2.js';

const $=s=>document.querySelector(s);
const safe=(label,fn)=>{try{return fn()}catch(error){console.warn(`[Golaço Clash/${label}]`,error);return null}};
const addMonths=(date,months)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+Number(months||0));return d.toISOString().slice(0,10)};

function ensureCoreSave(){
  if(!state.save)return;
  state.save.matches??=[];state.save.news??=[];state.save.transactions??=[];
  state.save.acquiredPlayerIds??=[];state.save.soldPlayerIds??=[];state.save.playerContracts??={};
  state.save.transferListed??=[];state.save.loanListed??=[];state.save.loans??=[];state.save.transferInbox??=[];
  state.save.presidentStats??={bought:0,sold:0,moneySpent:0,moneyReceived:0,coachesHired:0,coachesFired:0,reputation:50};
  state.save.records??={biggestBuy:0,biggestSale:0};
  state.save.table??={played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0};
}

export function bindCoreActions(render){
  if(!state.save)return;
  ensureCoreSave();
  bindNavigation(render);
  bindMatch(render);
  bindSquad(render);
  bindCoach(render);
  bindInbox(render);
  bindSettings(render);
}

function bindNavigation(render){
  document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>{
    state.page=button.dataset.page||'dashboard';
    state.selectedMarketPlayerId=null;
    state.selectedSquadPlayerId=null;
    state.marketPageIndex=0;
    render();
    if(['dashboard','squad','market','contracts','calendar'].includes(state.page))ensurePlayers(render);
  });
  $('#goCover')?.addEventListener('click',()=>{state.screen='cover';render()});
  $('#fullscreen')?.addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen?.();else await document.documentElement.requestFullscreen?.()}catch{}
  });
}

function bindMatch(render){
  $('#playNext')?.addEventListener('click',()=>playNext(render));
  $('#finishSeason')?.addEventListener('click',()=>{
    const result=safe('finish-season',()=>finishSeasonAdvanced(state.save,currentClub(),state.world));
    if(result){persist();alert(result.champion?'Temporada encerrada: campeão!':'Temporada encerrada.');render()}
  });
  $('#retryPlayers')?.addEventListener('click',()=>{state.world.players=null;state.playersReady=false;ensurePlayers(render)});
}

async function playNext(render){
  if(!state.playersReady)await ensurePlayers(render);
  const fixture=nextFixture(),fullSquad=squad();
  if(!fixture)return;
  const players=availableForFixture(fullSquad,state.save,fixture.date);
  if(players.length<11){alert('O clube não tem 11 jogadores disponíveis.');return}
  let result;
  try{
    result=simulateFixture({save:state.save,fixture,nextFixture:nextFixture(1),squad:players,opponentClub:state.world.findClub(fixture.opponentId)});
  }catch(error){console.error(error);alert('Não foi possível iniciar a partida. Tente novamente.');return}
  try{
    showMatchViewer({app:$('#app'),club:currentClub(),fixture,result,coachName:state.save.coach?.name||'Técnico',onFinish:()=>completeMatch(fixture,result,players,fullSquad,render)});
  }catch(error){console.error(error);completeMatch(fixture,result,players,fullSquad,render)}
}

function completeMatch(fixture,result,players,fullSquad,render){
  ensureCoreSave();
  const plan=result?.plan||{starters:[],bench:[],lineupOverall:0,rotation:0,preferredFormation:'—',reason:''};
  const recovery=nextFixture(1)?Math.max(2,Math.round((new Date(`${nextFixture(1).date}T12:00:00Z`)-new Date(`${fixture.date}T12:00:00Z`))/86400000)):7;
  safe('fitness',()=>applyMatchFitness(players,plan.starters||[],plan.bench||[],recovery));
  safe('player-state',()=>storePlayerState(players));
  fixture.played=true;fixture.result=`${result.gf}-${result.ga}`;
  state.save.matches.push({
    date:fixture.date,competition:fixture.competition,opponentName:fixture.opponentName,home:fixture.home,
    gf:result.gf,ga:result.ga,xg:result.xg,xga:result.xga,possession:result.possession,
    shots:result.shots,shotsAgainst:result.shotsAgainst,lineupOverall:plan.lineupOverall||0,rotation:plan.rotation||0,
    lineup:(plan.starters||[]).map(p=>({id:p.id,name:p.name,overall:p.overall}))
  });
  state.save.table.played++;state.save.table.gf+=Number(result.gf||0);state.save.table.ga+=Number(result.ga||0);
  if(result.gf>result.ga){state.save.table.wins++;state.save.table.points+=3;state.save.boardTrust=(state.save.boardTrust||60)+.7}
  else if(result.gf===result.ga){state.save.table.draws++;state.save.table.points++}
  else{state.save.table.losses++;state.save.boardTrust=(state.save.boardTrust||60)-.7}
  safe('league',()=>recordLeagueMatch(state.save,currentClub(),fixture,result.gf,result.ga,state.world));
  state.save.nextFixtureIndex=Math.min((state.save.nextFixtureIndex||0)+1,state.save.calendar?.length||9999);
  state.save.date=fixture.date;
  state.save.news.unshift({date:fixture.date,title:`${result.gf>result.ga?'Vitória':result.gf<result.ga?'Derrota':'Empate'}: ${result.gf}–${result.ga} contra ${fixture.opponentName}`,body:`${state.save.coach?.name||'O técnico'} usou ${plan.preferredFormation||'formação variável'}.`});
  const extra=safe('post-match',()=>runPostMatchExtra(state.save,state.world,currentClub(),fixture,result,players,fullSquad))||{};
  safe('career',()=>afterMatchCareer(state.save,result,fixture));
  safe('finance-auto',()=>processMonthlyFinance(state.save,fixture.date,state.save.matches.filter(m=>m.home&&String(m.date).slice(0,7)===String(fixture.date).slice(0,7)).length));
  safe('payments',()=>processDuePayments(state.save,fixture.date));
  safe('loans',()=>processLoans(state.save,fixture.date));
  persist();
  showReport(fixture,result,extra.playerEvents,render);
}

function showReport(fixture,result,events,render){
  const club=currentClub(),best=result?.bestPlayer;
  $('#app').innerHTML=`<section class="report-screen"><div class="report-card card"><span class="eyebrow">${fixture.competition||'PARTIDA'} • ${formatDate(fixture.date)}</span><div class="report-score"><div><b>${club?.name||state.save.clubName}</b></div><strong>${result.gf}<i>–</i>${result.ga}</strong><div><b>${fixture.opponentName}</b></div></div>${events?.goals?.length?`<div class="scorers"><b>Gols: </b>${events.goals.join(', ')}</div>`:''}<div class="match-stats"><div><span>Posse</span><b>${result.possession}%</b></div><div><span>Finalizações</span><b>${result.shots}–${result.shotsAgainst}</b></div><div><span>xG</span><b>${result.xg}–${result.xga}</b></div></div>${best?`<div class="card inner"><span class="eyebrow">DESTAQUE</span><b>${best.name}</b> • ${Number(best.rating||0).toFixed(1)}</div>`:''}<button class="button big full" id="afterMatch">Voltar ao Painel</button></div></section>`;
  $('#afterMatch')?.addEventListener('click',()=>{state.screen='game';state.page='dashboard';render()});
}

function bindSquad(render){
  document.querySelectorAll('[data-p2-squad-player],[data-squad-player]').forEach(el=>el.onclick=()=>{state.selectedSquadPlayerId=el.dataset.p2SquadPlayer||el.dataset.squadPlayer;render()});
  $('#p2ToggleSale')?.addEventListener('click',()=>togglePlayerList('BUY',render));
  $('#p2ToggleLoan')?.addEventListener('click',()=>togglePlayerList('LOAN',render));
  $('#p2RenewPlayer')?.addEventListener('click',()=>{
    const player=squad().find(p=>String(p.id)===String(state.selectedSquadPlayerId));if(!player)return;
    state.contractCenterFilters={search:player.name,status:'ALL'};state.page='contracts';render();
  });
  document.querySelectorAll('[data-player-demand]').forEach(button=>button.onclick=()=>{
    const player=squad().find(p=>String(p.id)===String(state.selectedSquadPlayerId));if(!player)return;
    const action=button.dataset.playerDemand;
    safe('player-demand',()=>resolvePlayerDemand(state.save,player.id,action,gameDate()));
    persist();
    if(action==='ACKNOWLEDGE'){state.contractCenterFilters={search:player.name,status:'ALL'};state.page='contracts'}
    render();
  });
}

function togglePlayerList(type,render){
  const id=String(state.selectedSquadPlayerId||'');if(!id)return;
  const primary=type==='BUY'?state.save.transferListed:state.save.loanListed,other=type==='BUY'?state.save.loanListed:state.save.transferListed;
  const found=primary.indexOf(id);if(found>=0)primary.splice(found,1);else{primary.push(id);const j=other.indexOf(id);if(j>=0)other.splice(j,1)}
  persist();render();
}

function coachPool(){
  const employed=(state.world?.clubs||[]).filter(c=>c.coachName).map(c=>({id:String(c.id),name:c.coachName,club:c.name,country:c.country,reputation:c.teamOverall||72,status:'EMPLOYED',contractUntil:c.coachContractUntil||''}));
  const free=[...(state.save.coachHistory||[]).map((c,i)=>({id:`free-${i}`,name:c.name,club:'Sem clube',country:'',reputation:c.reputation||72,status:'UNEMPLOYED'})),...(state.save.worldFreeCoaches||[]).map((c,i)=>({id:`worldfree-${i}`,name:c.name,club:'Sem clube',country:'',reputation:c.reputation||72,status:'UNEMPLOYED'}))];
  return [...new Map([...employed,...free].filter(c=>c.name).map(c=>[c.name,c])).values()].filter(c=>c.name!==state.save.coach?.name);
}

function bindCoach(render){
  $('#fireCoach')?.addEventListener('click',()=>fireCoach(render));
  const wire=()=>document.querySelectorAll('[data-hire-coach]').forEach(el=>el.onclick=()=>hireCoach(el.dataset.hireCoach,el.dataset.freeCoach==='true',el.dataset.coachName,render));
  wire();
  $('#coachFilter')?.addEventListener('click',()=>{const root=$('#coachResults');if(!root)return;root.innerHTML=coachResults(coachPool(),$('#coachSearch')?.value||'',$('#coachStatus')?.value||'',Number($('#coachRep')?.value||0));wire()});
}

function fireCoach(render){
  const old=state.save.coach?.name||'Técnico',cost=Math.max(0,Math.round(clubBudgetBase(currentClub())*.012));
  if(!confirm(`Demitir ${old}? Custo aproximado ${formatCurrency(cost)}.`))return;
  if((state.save.cash||0)<cost){alert('Caixa insuficiente.');return}
  state.save.cash-=cost;state.save.coachHistory??=[];state.save.coachHistory.push({name:old,from:state.save.coach?.hiredDate,to:gameDate(),reason:'Demitido'});
  state.save.coach={name:'Técnico interino',original:false,hiredDate:gameDate(),contractUntil:addYears(gameDate(),1),status:'INTERIM',reputation:65};
  state.save.presidentStats.coachesFired=(state.save.presidentStats.coachesFired||0)+1;state.save.relation=55;
  state.save.transactions.push({date:gameDate(),type:'Rescisão',description:old,amount:-cost});unlock(state.save,'Primeira Demissão');persist();render();
}

function hireCoach(id,isFree,name,render){
  const source=isFree?null:state.world?.findClub(id),coachName=isFree?name:source?.coachName;if(!coachName)return;
  const cost=isFree?0:Math.max(0,Math.round(clubBudgetBase(source)*.025/100000)*100000);
  if((state.save.cash||0)<cost){alert('Caixa insuficiente.');return}
  if(!confirm(`Contratar ${coachName}? ${cost?`Compensação ${formatCurrency(cost)}.`:'Sem compensação.'}`))return;
  state.save.cash-=cost;state.save.coach={name:coachName,original:false,hiredDate:gameDate(),contractUntil:addYears(gameDate(),2),status:'EMPLOYED',reputation:source?.teamOverall||72,image:source?.coachImage||''};
  state.save.presidentStats.coachesHired=(state.save.presidentStats.coachesHired||0)+1;state.save.relation=72;
  state.save.transactions.push({date:gameDate(),type:'Treinador',description:coachName,amount:-cost});unlock(state.save,'Primeiro Técnico');persist();render();
}

function bindInbox(render){
  document.querySelectorAll('[data-reject-incoming]').forEach(button=>button.onclick=()=>{const offer=findOffer(button.dataset.rejectIncoming);if(offer){offer.status='REJECTED';persist();render()}});
  document.querySelectorAll('[data-accept-incoming]').forEach(button=>button.onclick=()=>acceptIncoming(findOffer(button.dataset.acceptIncoming),render));
  document.querySelectorAll('[data-counter-incoming]').forEach(button=>button.onclick=()=>counterIncoming(findOffer(button.dataset.counterIncoming),render));
}
function findOffer(id){return state.save.transferInbox.find(o=>String(o.id)===String(id))}
function playerById(id){return state.world?.players?.find(p=>String(p.id)===String(id))||state.save.youth?.find(p=>String(p.id)===String(id))}
function acceptIncoming(offer,render){
  if(!offer||offer.status!=='PENDING')return;const player=playerById(offer.playerId);if(!player)return;
  offer.status='ACCEPTED';
  if(offer.type==='BUY'){
    const total=Number(offer.amount||0)+Number(offer.addOns||0);
    if(player.youth)state.save.youth=state.save.youth.filter(p=>String(p.id)!==String(player.id));else{if(!state.save.soldPlayerIds.includes(String(player.id)))state.save.soldPlayerIds.push(String(player.id));state.save.acquiredPlayerIds=state.save.acquiredPlayerIds.filter(id=>String(id)!==String(player.id))}
    state.save.cash=(state.save.cash||0)+total;state.save.transferBudget=(state.save.transferBudget||0)+total;state.save.presidentStats.sold=(state.save.presidentStats.sold||0)+1;state.save.presidentStats.moneyReceived=(state.save.presidentStats.moneyReceived||0)+total;state.save.records.biggestSale=Math.max(state.save.records.biggestSale||0,total);
    state.save.transactions.push({date:gameDate(),type:'Venda',description:player.name,amount:total});state.save.news.unshift({date:gameDate(),title:`${player.name} vendido`,body:`Acordo com ${offer.buyerName} por ${formatCurrency(total)}.`});
  }else{
    state.save.loans.push({playerId:String(player.id),playerName:player.name,start:gameDate(),end:addMonths(gameDate(),offer.months||12),active:true,direction:'OUT',loanFee:Number(offer.loanFee||0),wageShare:Number(offer.wageShare||0),buyerId:offer.buyerId,buyerName:offer.buyerName});
    state.save.cash=(state.save.cash||0)+Number(offer.loanFee||0);state.save.transactions.push({date:gameDate(),type:'Empréstimo',description:player.name,amount:Number(offer.loanFee||0)});
  }
  safe('achievements',()=>achievementChecks(state.save));persist();render();
}
function counterIncoming(offer,render){
  if(!offer||offer.status!=='PENDING')return;const current=offer.type==='BUY'?Number(offer.amount||0):Number(offer.loanFee||0);const raw=prompt('Digite o valor da contraproposta:',String(Math.round(current*1.08)));if(raw==null)return;const desired=Math.max(0,Number(String(raw).replace(/[^0-9.,]/g,'').replace(',','.'))||0);if(!desired)return;
  if(desired<=current*1.12){if(offer.type==='BUY')offer.amount=desired;else offer.loanFee=desired;acceptIncoming(offer,render);return}
  offer.status='REJECTED';state.save.news.unshift({date:gameDate(),title:`${offer.buyerName} recua`,body:`A contraproposta por ${offer.playerName} não foi aceita.`});persist();render();
}

function bindSettings(render){
  $('#savePreferences')?.addEventListener('click',()=>{
    state.save.settings??={};const speed=Number($('#defaultMatchSpeed')?.value||state.save.settings.matchSpeed||1);state.save.settings.matchSpeed=[1,2,4,8].includes(speed)?speed:1;persist();render();
  });
}
