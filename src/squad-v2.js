import {state,esc,nextFixture,squad,formatCurrency,formatDate,contractLabel} from './state.js';
import {coachSelection,calculateTeamOverall} from './game.js';
import {loadingPlayers,noPlayers,ratingClass} from './views.js';
import {playerPhoto} from './media.js';

export function squadPage(){
  if(state.playersLoading)return `<div class="hero"><div><span class="eyebrow">ELENCO PROFISSIONAL</span><h1>Elenco</h1><p>Carregando jogadores e fotos…</p></div></div>${loadingPlayers()}`;
  if(!state.playersReady||!state.world.players?.length)return `<div class="hero"><div><h1>Elenco</h1></div></div>${noPlayers()}`;
  const players=squad().sort((a,b)=>(b.overall||0)-(a.overall||0));
  const fx=nextFixture();
  const plan=fx&&players.length>=11?coachSelection(players,fx,nextFixture(1),calculateTeamOverall(players)):null;
  const xi=new Set(plan?.starters.map(p=>String(p.id))||[]);
  const selected=players.find(p=>String(p.id)===String(state.selectedSquadPlayerId));
  const avg=players.length?Math.round(players.reduce((s,p)=>s+(p.overall||0),0)/players.length):0;
  return `<div class="hero"><div><span class="eyebrow">ELENCO PROFISSIONAL</span><h1>${players.length} jogadores</h1><p>Você controla contratos e mercado. O treinador controla a escalação de cada partida.</p></div><div class="grid grid-2"><div class="ovr-block"><span>OVR TITULARES</span><b>${calculateTeamOverall(players)}</b></div><div class="ovr-block"><span>MÉDIA ELENCO</span><b>${avg}</b></div></div></div>
  ${plan?`<div class="coach-plan card"><div><span class="eyebrow">PRÓXIMA ESCALAÇÃO PROVÁVEL</span><h2>${plan.rotation>=.4?'Time misto':plan.rotation>=.15?'Rodízio leve':'Força máxima'} • OVR ${plan.lineupOverall}</h2><p>${esc(plan.reason)}</p></div><div class="lineup-chips">${plan.starters.map(p=>`<span>${esc(p.name)} <b>${p.overall}</b></span>`).join('')}</div></div>`:''}
  <div class="split-view"><div class="table-wrap"><table><thead><tr><th>Status</th><th>Jogador</th><th>Posição</th><th>OVR</th><th>POT</th><th>Energia</th><th>Contrato</th><th>Valor</th></tr></thead><tbody>${players.map(p=>row(p,xi)).join('')}</tbody></table></div>${selected?playerPanel(selected):emptyPanel()}</div>`;
}

function row(p,xi){
  return `<tr class="clickable ${String(p.id)===String(state.selectedSquadPlayerId)?'selected':''}" data-squad-player="${esc(p.id)}"><td>${xi.has(String(p.id))?'<span class="pill ok">XI</span>':'<span class="pill">Banco</span>'}</td><td><div class="fp-player-cell">${playerPhoto(p,{size:'sm'})}<div><b>${esc(p.name)}</b><small>${esc(p.nationality||'')}</small></div></div></td><td>${esc(p.subPosition||p.position)}</td><td><b class="rating ${ratingClass(p.overall)}">${p.overall}</b></td><td>${p.potential}</td><td>${Math.round(p.energy??100)}%</td><td>${contractLabel(p.contractExpiration)}<small>${p.contractExpiration?`até ${formatDate(p.contractExpiration)}`:''}</small></td><td>${p.marketValue?formatCurrency(p.marketValue):'—'}</td></tr>`;
}

function playerPanel(p){
  return `<aside class="detail-panel card"><span class="eyebrow">JOGADOR DO CLUBE</span><div class="player-head">${playerPhoto(p,{size:'lg'})}<div><h2>${esc(p.name)}</h2><p>${esc(p.subPosition||p.position)} • ${p.age??'—'} anos</p><small class="subtle">${esc(p.nationality||'')}</small></div><b class="rating huge ${ratingClass(p.overall)}">${p.overall}</b></div><div class="fact-list compact"><div><span>Contrato restante</span><b>${contractLabel(p.contractExpiration)}</b></div><div><span>Fim do contrato</span><b>${formatDate(p.contractExpiration)}</b></div><div><span>Valor de mercado</span><b>${p.marketValue?formatCurrency(p.marketValue):'—'}</b></div><div><span>Salário semanal estimado</span><b>${formatCurrency(p.estimatedWage)}</b></div><div><span>Energia</span><b>${Math.round(p.energy??100)}%</b></div><div><span>Forma</span><b>${Math.round(p.form??70)}/100</b></div><div><span>Potencial</span><b>${p.potential}</b></div><div><span>Pé</span><b>${esc(p.foot||'Não informado')}</b></div></div><div class="detail-actions"><button class="button secondary" id="renewPlayer">Renovar 3 anos</button><button class="button ghost" id="loanOutPlayer">Emprestar</button><button class="button danger" id="sellPlayer">Ouvir proposta</button></div></aside>`;
}

function emptyPanel(){return `<aside class="detail-panel card"><span class="eyebrow">DETALHES</span><h2>Selecione um jogador</h2><p class="subtle">Você verá foto, contrato, energia, valor, forma e potencial.</p></aside>`;}
