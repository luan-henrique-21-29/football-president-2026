import {state,esc,ownedIds,soldIds,currentClub,gameDate,persist,addYears,squad,formatDate} from './state.js';
import {askingPrice,evaluateOffer,playerInterest} from './game-v3.js';
import {loadingPlayers,noPlayers,ratingClass} from './views.js';
import {playerPhoto} from './media.js';
import {formatCompactMoneyEUR} from './preferences.js';
import {contractMarketStatus,isFreeAgent} from './contract-status.js';
import {contractExpectation,evaluateContractTerms,currentPlayerWage} from './player-dynamics.js';
import {achievementChecks} from './career-systems.js';

const $=s=>document.querySelector(s);
const money=v=>formatCompactMoneyEUR(Math.max(0,Number(v)||0));
function filters(){state.marketProFilters??={search:'',position:'',minOvr:0,contract:'ALL'};return state.marketProFilters}
function pool(){return state.world.marketPlayers(state.save.clubId,ownedIds(),soldIds())}
function payroll(){return squad().reduce((sum,p)=>sum+Math.max(0,currentPlayerWage(state.save,p)),0)}
function roleLabel(r){return{KEY:'Jogador-chave',STARTER:'Titular',ROTATION:'Rotação',PROSPECT:'Projeto'}[r]||r||'Rotação'}
function matches(p,f){const q=String(f.search||'').trim().toLowerCase(),hay=`${p.name} ${p.currentClubName||''} ${p.nationality||''}`.toLowerCase(),status=contractMarketStatus(p,gameDate());if(q&&!hay.includes(q))return false;if(f.position&&p.position!==f.position)return false;if(Number(p.overall||0)<Number(f.minOvr||0))return false;if(f.contract==='FREE'&&!isFreeAgent(p))return false;if(f.contract==='SIX'&&(isFreeAgent(p)||status.months==null||status.months>6))return false;if(f.contract==='TWELVE'&&(isFreeAgent(p)||status.months==null||status.months>12))return false;return true}

export function marketPage(){
  if(state.playersLoading)return `<div class="hero"><div><h1>Mercado</h1></div></div>${loadingPlayers()}`;
  if(!state.playersReady||!state.world.players?.length)return `<div class="hero"><div><h1>Mercado</h1></div></div>${noPlayers()}`;
  const f=filters(),players=pool().filter(p=>matches(p,f)).sort((a,b)=>Number(b.overall||0)-Number(a.overall||0)||Number(b.marketValue||0)-Number(a.marketValue||0)),selected=pool().find(p=>String(p.id)===String(state.selectedMarketPlayerId));
  return `<section class="gcp-market-pro"><div class="hero"><div><span class="eyebrow">MERCADO</span><h1>Contratar jogador</h1><p>Busque, abra o jogador e negocie. Sem etapas desnecessárias.</p></div><div class="cd-budget-pill"><span>ORÇAMENTO</span><b>${money(state.save.transferBudget)}</b></div></div><div class="card gcp-market-toolbar"><input id="gcpMarketSearch" value="${esc(f.search)}" placeholder="Buscar jogador ou clube"><select id="gcpMarketPosition"><option value="">Todas posições</option><option value="Goalkeeper" ${f.position==='Goalkeeper'?'selected':''}>Goleiro</option><option value="Defence" ${f.position==='Defence'?'selected':''}>Defesa</option><option value="Midfield" ${f.position==='Midfield'?'selected':''}>Meio</option><option value="Attack" ${f.position==='Attack'?'selected':''}>Ataque</option></select><select id="gcpMarketOvr"><option value="0">Qualquer OVR</option>${[70,75,80,85,88].map(v=>`<option value="${v}" ${Number(f.minOvr)===v?'selected':''}>${v}+</option>`).join('')}</select><select id="gcpMarketContract"><option value="ALL" ${f.contract==='ALL'?'selected':''}>Todos</option><option value="FREE" ${f.contract==='FREE'?'selected':''}>Livres</option><option value="SIX" ${f.contract==='SIX'?'selected':''}>Até 6 meses</option><option value="TWELVE" ${f.contract==='TWELVE'?'selected':''}>Até 1 ano</option></select><button class="button" id="gcpMarketFilter">Filtrar</button></div><div id="p2MarketResults">${marketResults(players)}</div>${selected?`<div class="modal-backdrop" id="gcpMarketModal"><div class="transfer-modal card cd-negotiation-modal">${negotiationPanel(selected)}</div></div>`:''}</section>`;
}

export function marketResults(players=pool().filter(p=>matches(p,filters()))){
  const size=30,pages=Math.max(1,Math.ceil(players.length/size));state.marketPageIndex=Math.max(0,Math.min(Number(state.marketPageIndex||0),pages-1));const list=players.slice(state.marketPageIndex*size,(state.marketPageIndex+1)*size);
  return `<div class="cd-player-market-grid">${list.map(p=>{const free=isFreeAgent(p),status=contractMarketStatus(p,gameDate());return `<article class="card cd-market-player">${playerPhoto(p,{size:'md'})}<div class="cd-market-player-main"><span>${free?'LIVRE':esc(p.currentClubName||'—')}</span><h3>${esc(p.name)}</h3><small>${esc(p.subPosition||p.position||'')} • ${p.age??'—'} anos</small><div><b class="rating ${ratingClass(p.overall)}">${p.overall}</b><em>POT ${p.potential||p.overall}</em></div></div><div class="cd-market-price"><span>${free?'Sem taxa':'Valor de mercado'}</span><b>${free?'LIVRE':money(p.marketValue)}</b><small>${free?'Negociação direta':status.label}</small></div><button class="button secondary compact" data-market-open="${p.id}">Negociar</button></article>`}).join('')||'<div class="card subtle">Nenhum jogador encontrado.</div>'}</div><div class="pagination"><button class="button ghost compact" id="gcpPrevMarket" ${state.marketPageIndex<=0?'disabled':''}>←</button><span>${state.marketPageIndex+1}/${pages} • ${players.length} jogadores</span><button class="button ghost compact" id="gcpNextMarket" ${state.marketPageIndex>=pages-1?'disabled':''}>→</button></div>`;
}

function negotiationPanel(p){
  const free=isFreeAgent(p),ask=free?0:askingPrice(p),request=contractExpectation(state.save,p,squad()),years=p.age>=31?2:request.years||3,fee=free?0:ask;
  return `<button class="modal-close" id="gcpCloseMarket" aria-label="Fechar">×</button><div class="cd-neg-player">${playerPhoto(p,{size:'xl'})}<div><span class="eyebrow">${free?'JOGADOR LIVRE':'NEGOCIAÇÃO'}</span><h2>${esc(p.name)}</h2><p>${esc(p.currentClubName||'Sem clube')} • ${esc(p.subPosition||p.position||'')} • OVR ${p.overall}</p></div><div class="cd-ask"><span>${free?'Taxa':'Pedido estimado'}</span><b>${free?'€ 0':money(ask)}</b></div></div><div class="gcp-simple-contract-form">${free?'':`<label><span>Oferta ao clube</span><input id="gcpTransferFee" type="number" min="0" step="10000" value="${Math.round(fee)}"></label>`}<label><span>Salário semanal</span><input id="gcpTransferWage" type="number" min="500" step="100" value="${Math.round(request.wage)}"></label><label><span>Luvas</span><input id="gcpTransferBonus" type="number" min="0" step="10000" value="${Math.round(request.bonus)}"></label><label><span>Duração</span><select id="gcpTransferYears">${[1,2,3,4,5].map(y=>`<option value="${y}" ${years===y?'selected':''}>${y} ano${y>1?'s':''}</option>`).join('')}</select></label><label><span>Papel</span><select id="gcpTransferRole">${['KEY','STARTER','ROTATION','PROSPECT'].map(r=>`<option value="${r}" ${request.role===r?'selected':''}>${roleLabel(r)}</option>`).join('')}</select></label></div><div id="gcpMarketFeedback" class="cd-contract-feedback"><span>${free?'O agente responde à proposta.':'O clube e o agente respondem juntos.'}</span></div><button class="button big full" id="gcpSubmitMarket">Enviar proposta</button>`;
}

function completeSigning(p,fee,offer){
  const club=currentClub(),date=gameDate(),until=addYears(date,offer.years),fromClub=p.currentClubName||'Livre',fromClubId=p.currentClubId||'FREE';
  state.save.acquiredPlayerIds??=[];state.save.playerContracts??={};state.save.transactions??=[];state.save.news??=[];state.save.worldPlayerMoves??={};state.save.presidentStats??={};state.save.records??={};
  if(!state.save.acquiredPlayerIds.includes(String(p.id)))state.save.acquiredPlayerIds.push(String(p.id));
  state.save.cash=Math.max(0,Number(state.save.cash)||0)-fee-offer.bonus;state.save.transferBudget=Math.max(0,Number(state.save.transferBudget)||0)-fee;
  state.save.playerContracts[p.id]={until,salary:offer.wage,signingBonus:offer.bonus,role:offer.role};
  state.save.worldPlayerMoves[p.id]={clubId:String(club.id),clubName:club.name,date,fee,fromClub,fromClubId,reason:fee?'USER_TRANSFER':'USER_FREE_AGENT',playerName:p.name};
  p.currentClubId=String(club.id);p.currentClubName=club.name;p.contractExpiration=until;
  state.save.presidentStats.bought=(state.save.presidentStats.bought||0)+1;state.save.presidentStats.moneySpent=(state.save.presidentStats.moneySpent||0)+fee;state.save.records.biggestBuy=Math.max(state.save.records.biggestBuy||0,fee);
  if(fee)state.save.transactions.push({date,type:'Compra',description:p.name,amount:-fee});if(offer.bonus)state.save.transactions.push({date,type:'Luvas',description:p.name,amount:-offer.bonus});
  state.save.news.unshift({date,title:`${p.name} contratado`,body:`${fee?`Transferência de ${money(fee)}. `:'Sem taxa. '}Contrato até ${formatDate(until)}.`});
  achievementChecks(state.save);state.selectedMarketPlayerId=null;persist();
}

function submitOffer(render){
  const p=pool().find(x=>String(x.id)===String(state.selectedMarketPlayerId));if(!p)return;const free=isFreeAgent(p),seller=free?null:state.world.findClub(p.currentClubId),feedback=$('#gcpMarketFeedback'),request=contractExpectation(state.save,p,squad()),fee=free?0:Math.max(0,Number($('#gcpTransferFee')?.value)||0),offer={wage:Math.max(500,Number($('#gcpTransferWage')?.value)||0),bonus:Math.max(0,Number($('#gcpTransferBonus')?.value)||0),years:Math.max(1,Number($('#gcpTransferYears')?.value)||1),role:$('#gcpTransferRole')?.value||'ROTATION',releaseClause:request.releaseClause||0};
  if(!free){const clubDecision=evaluateOffer(p,fee,currentClub(),seller);if(!clubDecision.accepted){$('#gcpTransferFee').value=clubDecision.counter;feedback.innerHTML=`<div class="warn"><b>Clube pediu mais.</b><p>${money(clubDecision.counter)}. O valor já foi colocado no campo.</p></div>`;return}}
  const interest=playerInterest(p,currentClub(),seller);if(!interest.interested){feedback.innerHTML=`<div class="warn"><b>Jogador não quer negociar agora.</b><p>${esc(interest.reason||'Pouco interesse no projeto.')}</p></div>`;return}
  const contract=evaluateContractTerms(state.save,p,squad(),offer);if(!contract.accepted){$('#gcpTransferWage').value=contract.counter.wage;$('#gcpTransferBonus').value=contract.counter.bonus;$('#gcpTransferRole').value=contract.counter.role;feedback.innerHTML=`<div class="warn"><b>Agente fez contraproposta.</b><p>${money(contract.counter.wage)}/sem • luvas ${money(contract.counter.bonus)}.</p></div>`;return}
  const wageLimit=Number(state.save.wageBudgetWeekly||0);if(wageLimit>0&&payroll()+offer.wage>wageLimit){feedback.innerHTML='<div class="warn"><b>Folha salarial excedida.</b></div>';return}
  if(Number(state.save.transferBudget||0)<fee){feedback.innerHTML='<div class="warn"><b>Orçamento de transferências insuficiente.</b></div>';return}
  if(Number(state.save.cash||0)<fee+offer.bonus){feedback.innerHTML='<div class="warn"><b>Caixa insuficiente.</b></div>';return}
  completeSigning(p,fee,offer);render();
}

export function bindMarketV4(render){
  if(state.page!=='market')return;
  const apply=()=>{state.marketProFilters={search:$('#gcpMarketSearch')?.value||'',position:$('#gcpMarketPosition')?.value||'',minOvr:Number($('#gcpMarketOvr')?.value||0),contract:$('#gcpMarketContract')?.value||'ALL'};state.marketPageIndex=0;render()};
  $('#gcpMarketFilter')?.addEventListener('click',apply);$('#gcpMarketSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')apply()});
  document.querySelectorAll('[data-market-open]').forEach(b=>b.onclick=()=>{state.selectedMarketPlayerId=b.dataset.marketOpen;render()});
  $('#gcpCloseMarket')?.addEventListener('click',()=>{state.selectedMarketPlayerId=null;render()});$('#gcpMarketModal')?.addEventListener('click',e=>{if(e.target.id==='gcpMarketModal'){state.selectedMarketPlayerId=null;render()}});
  $('#gcpPrevMarket')?.addEventListener('click',()=>{state.marketPageIndex=Math.max(0,state.marketPageIndex-1);render()});$('#gcpNextMarket')?.addEventListener('click',()=>{state.marketPageIndex++;render()});
  $('#gcpSubmitMarket')?.addEventListener('click',()=>submitOffer(render));
}
