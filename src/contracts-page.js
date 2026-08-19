import {state,squad,esc,gameDate,formatDate,persist,addYears} from './state.js';
import {playerPhoto} from './media.js';
import {formatCompactMoneyEUR} from './preferences.js';
import {
  contractExpectation,
  evaluateContractTerms,
  negotiationAvailability,
  registerNegotiationRound,
  currentPlayerWage,
  markPlayerRenewed,
  resolvePlayerDemand
} from './player-dynamics.js';
import {squadContractView,renewalDisposition} from './contract-status.js';
import {unlock} from './career-systems.js';

const $ = selector => document.querySelector(selector);
const money = value => formatCompactMoneyEUR(Math.max(0, Number(value) || 0));

function ensureCollections() {
  state.save.playerContracts ??= {};
  state.save.transactions ??= [];
  state.save.news ??= [];
  state.save.transferListed ??= [];
  state.save.loanListed ??= [];
}

function filters() {
  state.contractCenterFilters ??= {search: '', status: 'ALL'};
  return state.contractCenterFilters;
}

function roleLabel(role) {
  return {
    KEY: 'Jogador-chave',
    STARTER: 'Titular',
    ROTATION: 'Rotação',
    PROSPECT: 'Projeto'
  }[role] || role || 'Rotação';
}

function monthsLabel(value) {
  if (value == null) return 'Prazo não informado';
  if (value <= 0) return 'Contrato encerrado';
  return value === 1 ? '1 mês restante' : `${value} meses restantes`;
}

function statusLabel(view) {
  if (view.intent === 'WANTS_OUT') return {tone: 'negative', label: 'QUER SAIR'};
  if (view.renewal === 'HESITANT') return {tone: 'warning', label: 'EM DÚVIDA'};
  if (view.intent === 'RENEWAL' || view.intent === 'WAGE') return {tone: 'info', label: 'QUER CONVERSAR'};
  return {tone: 'positive', label: 'QUER FICAR'};
}

function filteredRows() {
  const players = squad();
  const date = gameDate();
  const f = filters();
  const query = String(f.search || '').trim().toLowerCase();

  return players
    .map(player => ({player, view: squadContractView(state.save, player, players, date)}))
    .filter(({player, view}) => {
      const haystack = `${player.name} ${player.position || ''} ${player.subPosition || ''}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (f.status === 'SIX') return view.months != null && view.months <= 6;
      if (f.status === 'TWELVE') return view.months != null && view.months <= 12;
      if (f.status === 'WANTS_OUT') return view.intent === 'WANTS_OUT';
      if (f.status === 'RENEWAL') return ['RENEWAL', 'WAGE'].includes(view.intent) || (view.months != null && view.months <= 9);
      return true;
    })
    .sort((a, b) => {
      const aPriority = a.view.intent === 'WANTS_OUT' ? -100 : (a.view.months ?? 99);
      const bPriority = b.view.intent === 'WANTS_OUT' ? -100 : (b.view.months ?? 99);
      return aPriority - bPriority || Number(b.player.overall || 0) - Number(a.player.overall || 0);
    });
}

function contractCard(player, view) {
  const status = statusLabel(view);
  const exitButton = view.intent === 'WANTS_OUT'
    ? `<button class="button danger compact" data-contract-list="${player.id}">Ouvir propostas</button>`
    : '';

  return `<article class="card gcp-contract-row">
    ${playerPhoto(player, {size: 'sm'})}
    <div class="gcp-contract-main">
      <span>${esc(player.subPosition || player.position || 'Jogador')} • OVR ${player.overall || '—'}</span>
      <h3>${esc(player.name)}</h3>
      <div class="gcp-contract-tags">
        <b class="${status.tone}">${status.label}</b>
        <span>Felicidade ${view.happiness}/100</span>
        <span>${roleLabel(view.role)}</span>
      </div>
      <small>${esc(view.reason)}</small>
    </div>
    <div class="gcp-contract-money">
      <span>Vínculo</span>
      <b>${player.contractExpiration ? formatDate(player.contractExpiration) : '—'}</b>
      <small>${monthsLabel(view.months)}</small>
      <span>Salário</span>
      <strong>${money(view.wage)}/sem</strong>
    </div>
    <div class="gcp-contract-actions">
      <button class="button compact" data-renew-contract="${player.id}">${view.intent === 'WANTS_OUT' ? 'Tentar conversar' : 'Negociar'}</button>
      ${exitButton}
      <button class="button ghost compact" data-open-contract-player="${player.id}">Jogador</button>
    </div>
  </article>`;
}

export function contractsPage() {
  const players = squad();
  const date = gameDate();
  const views = players.map(player => squadContractView(state.save, player, players, date));
  const f = filters();
  const rows = filteredRows();
  const urgent = views.filter(view => view.months != null && view.months <= 6).length;
  const attention = views.filter(view => view.months != null && view.months <= 12).length;
  const wantsOut = views.filter(view => view.intent === 'WANTS_OUT').length;

  return `<section class="gcp-contract-center">
    <div class="hero">
      <div>
        <span class="eyebrow">CONTRATOS</span>
        <h1>Decisões rápidas do elenco</h1>
        <p>Quem quer ficar, quem está em dúvida e quem quer sair. Sem planilha gigante.</p>
      </div>
      <span class="badge">${players.length} jogadores</span>
    </div>
    <div class="gcp-contract-kpis">
      <button data-contract-filter="SIX"><span>URGENTE</span><b>${urgent}</b><small>até 6 meses</small></button>
      <button data-contract-filter="TWELVE"><span>ATENÇÃO</span><b>${attention}</b><small>até 1 ano</small></button>
      <button data-contract-filter="WANTS_OUT"><span>SAÍDA</span><b>${wantsOut}</b><small>querem sair</small></button>
      <button data-contract-filter="ALL"><span>ELENCO</span><b>${players.length}</b><small>todos</small></button>
    </div>
    <div class="card gcp-contract-toolbar">
      <input id="gcpContractSearch" value="${esc(f.search)}" placeholder="Buscar jogador">
      <select id="gcpContractStatus">
        <option value="ALL" ${f.status === 'ALL' ? 'selected' : ''}>Todos</option>
        <option value="SIX" ${f.status === 'SIX' ? 'selected' : ''}>Até 6 meses</option>
        <option value="TWELVE" ${f.status === 'TWELVE' ? 'selected' : ''}>Até 1 ano</option>
        <option value="WANTS_OUT" ${f.status === 'WANTS_OUT' ? 'selected' : ''}>Quer sair</option>
        <option value="RENEWAL" ${f.status === 'RENEWAL' ? 'selected' : ''}>Precisa negociar</option>
      </select>
      <button class="button secondary" id="gcpApplyContractFilter">Filtrar</button>
    </div>
    <div class="gcp-contract-list">
      ${rows.length ? rows.map(({player, view}) => contractCard(player, view)).join('') : '<div class="card subtle">Nenhum jogador encontrado.</div>'}
    </div>
  </section>`;
}

function createModal(html) {
  document.querySelector('.gcp-renew-layer')?.remove();
  const root = document.createElement('div');
  root.className = 'cd-contract-layer gcp-renew-layer';
  root.innerHTML = `<article class="cd-contract-sheet card">${html}</article>`;
  document.body.appendChild(root);
  requestAnimationFrame(() => root.classList.add('open'));
  const close = () => {
    root.classList.remove('open');
    setTimeout(() => root.remove(), 120);
  };
  root.addEventListener('click', event => {
    if (event.target === root || event.target.closest('[data-close-gcp-renew]')) close();
  });
  return {root, close};
}

function numberInput(id, label, value, step = 100, min = 0) {
  return `<label><span>${label}</span><input id="${id}" type="number" inputmode="numeric" min="${min}" step="${step}" value="${Math.round(Number(value) || 0)}"></label>`;
}

function completeRenewal(player, offer, modal, render) {
  ensureCollections();
  const date = gameDate();
  const until = addYears(date, offer.years);
  state.save.cash = Math.max(0, Number(state.save.cash) || 0) - offer.bonus;
  state.save.playerContracts[player.id] = {
    ...(state.save.playerContracts[player.id] || {}),
    until,
    salary: offer.wage,
    signingBonus: offer.bonus,
    role: offer.role
  };
  player.contractExpiration = until;
  if (offer.bonus) {
    state.save.transactions.push({date, type: 'Luvas', description: `Renovação de ${player.name}`, amount: -offer.bonus});
  }
  state.save.news.unshift({
    date,
    title: `${player.name} renovou`,
    body: `Contrato até ${formatDate(until)} • ${money(offer.wage)}/sem • ${roleLabel(offer.role)}.`
  });
  markPlayerRenewed(state.save, player.id);
  registerNegotiationRound(state.save, player, date, true);
  unlock(state.save, 'Primeira Renovação');
  persist();
  modal.close();
  render();
}

function openRenewal(player, render) {
  ensureCollections();
  const players = squad();
  const date = gameDate();
  const disposition = renewalDisposition(state.save, player, players, date);
  const availability = negotiationAvailability(state.save, player, date);
  const request = contractExpectation(state.save, player, players);
  const currentWage = currentPlayerWage(state.save, player);

  if (!availability.available) {
    createModal(`<button class="modal-close" data-close-gcp-renew>×</button><span class="eyebrow">AGENTE</span><h2>${esc(player.name)}</h2><p>As conversas estão pausadas até <b>${formatDate(availability.blockedUntil)}</b>.</p><button class="button full" data-close-gcp-renew>Fechar</button>`);
    return;
  }

  const disabled = !disposition.willing;
  const modal = createModal(`<button class="modal-close" data-close-gcp-renew>×</button>
    <div class="gcp-renew-head">
      ${playerPhoto(player, {size: 'md'})}
      <div>
        <span class="eyebrow">NEGOCIAÇÃO DE CONTRATO</span>
        <h2>${esc(player.name)}</h2>
        <b class="gcp-renew-disposition ${disposition.level.toLowerCase()}">${disposition.label}</b>
        <p>${esc(disposition.reason)}</p>
      </div>
    </div>
    <div class="gcp-renew-summary">
      <span>Atual <b>${money(currentWage)}/sem</b></span>
      <span>Agente pede <b>${money(request.wage)}/sem</b></span>
      <span>Luvas <b>${money(request.bonus)}</b></span>
      <span>Papel <b>${roleLabel(request.role)}</b></span>
    </div>
    <div class="gcp-simple-contract-form">
      ${numberInput('gcpRenewWage', 'Salário semanal', request.wage, 100, 500)}
      ${numberInput('gcpRenewBonus', 'Luvas', request.bonus, 10000, 0)}
      <label><span>Duração</span><select id="gcpRenewYears"><option value="1">1 ano</option><option value="2" ${request.years === 2 ? 'selected' : ''}>2 anos</option><option value="3" ${request.years === 3 ? 'selected' : ''}>3 anos</option><option value="4" ${request.years === 4 ? 'selected' : ''}>4 anos</option><option value="5">5 anos</option></select></label>
      <label><span>Papel</span><select id="gcpRenewRole"><option value="KEY" ${request.role === 'KEY' ? 'selected' : ''}>Jogador-chave</option><option value="STARTER" ${request.role === 'STARTER' ? 'selected' : ''}>Titular</option><option value="ROTATION" ${request.role === 'ROTATION' ? 'selected' : ''}>Rotação</option><option value="PROSPECT" ${request.role === 'PROSPECT' ? 'selected' : ''}>Projeto</option></select></label>
    </div>
    <div id="gcpRenewFeedback" class="cd-contract-feedback">
      ${disabled ? '<div class="warn"><b>O jogador não quer renovar agora.</b><p>Resolva o pedido de saída ou melhore a relação.</p></div>' : `<span>Rodadas com o agente: ${availability.rounds || 0}. A resposta vem na hora.</span>`}
    </div>
    <div class="gcp-renew-actions">
      <button class="button secondary" id="gcpUseAgentAsk" ${disabled ? 'disabled' : ''}>Usar pedido do agente</button>
      <button class="button big" id="gcpSubmitRenew" ${disabled ? 'disabled' : ''}>Enviar proposta</button>
    </div>`);

  if (disabled) return;

  const fillRequest = () => {
    modal.root.querySelector('#gcpRenewWage').value = Math.round(request.wage);
    modal.root.querySelector('#gcpRenewBonus').value = Math.round(request.bonus);
    modal.root.querySelector('#gcpRenewYears').value = String(request.years);
    modal.root.querySelector('#gcpRenewRole').value = request.role;
  };
  modal.root.querySelector('#gcpUseAgentAsk')?.addEventListener('click', fillRequest);

  modal.root.querySelector('#gcpSubmitRenew')?.addEventListener('click', () => {
    const offer = {
      wage: Math.max(500, Number(modal.root.querySelector('#gcpRenewWage')?.value) || 0),
      bonus: Math.max(0, Number(modal.root.querySelector('#gcpRenewBonus')?.value) || 0),
      years: Math.max(1, Number(modal.root.querySelector('#gcpRenewYears')?.value) || 1),
      role: modal.root.querySelector('#gcpRenewRole')?.value || 'ROTATION',
      releaseClause: request.releaseClause || 0
    };
    const feedback = modal.root.querySelector('#gcpRenewFeedback');

    if ((Number(state.save.cash) || 0) < offer.bonus) {
      feedback.innerHTML = '<div class="warn"><b>Caixa insuficiente para as luvas.</b></div>';
      return;
    }

    const result = evaluateContractTerms(state.save, player, players, offer);
    if (result.accepted) {
      completeRenewal(player, offer, modal, render);
      return;
    }

    const round = registerNegotiationRound(state.save, player, date, false);
    persist();
    if (round.closed) {
      feedback.innerHTML = `<div class="warn"><b>O agente encerrou a conversa.</b><p>Nova tentativa em ${formatDate(round.blockedUntil)}.</p></div>`;
      modal.root.querySelector('#gcpSubmitRenew').disabled = true;
      return;
    }

    feedback.innerHTML = `<div class="warn"><b>Contraproposta</b><p>${money(result.counter.wage)}/sem • luvas ${money(result.counter.bonus)} • ${roleLabel(result.counter.role)}.</p><button class="button compact" id="gcpAcceptCounter">Preencher contraproposta</button></div>`;
    modal.root.querySelector('#gcpAcceptCounter')?.addEventListener('click', () => {
      modal.root.querySelector('#gcpRenewWage').value = result.counter.wage;
      modal.root.querySelector('#gcpRenewBonus').value = result.counter.bonus;
      modal.root.querySelector('#gcpRenewYears').value = String(result.counter.years || offer.years);
      modal.root.querySelector('#gcpRenewRole').value = result.counter.role || offer.role;
    });
  });
}

export function bindContractsPage(render) {
  if (state.page !== 'contracts') return;

  $('#gcpApplyContractFilter')?.addEventListener('click', () => {
    state.contractCenterFilters = {
      search: $('#gcpContractSearch')?.value || '',
      status: $('#gcpContractStatus')?.value || 'ALL'
    };
    render();
  });

  $('#gcpContractSearch')?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    state.contractCenterFilters = {
      search: event.target.value,
      status: $('#gcpContractStatus')?.value || 'ALL'
    };
    render();
  });

  document.querySelectorAll('[data-contract-filter]').forEach(button => {
    button.addEventListener('click', () => {
      state.contractCenterFilters = {search: '', status: button.dataset.contractFilter || 'ALL'};
      render();
    });
  });

  document.querySelectorAll('[data-renew-contract]').forEach(button => {
    button.addEventListener('click', () => {
      const player = squad().find(item => String(item.id) === String(button.dataset.renewContract));
      if (player) openRenewal(player, render);
    });
  });

  document.querySelectorAll('[data-open-contract-player]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedSquadPlayerId = button.dataset.openContractPlayer;
      state.page = 'squad';
      render();
    });
  });

  document.querySelectorAll('[data-contract-list]').forEach(button => {
    button.addEventListener('click', () => {
      ensureCollections();
      const id = String(button.dataset.contractList || '');
      const player = squad().find(item => String(item.id) === id);
      if (!player) return;
      const pending = state.save.playerDemands?.find(demand => demand.status === 'PENDING' && demand.type === 'TRANSFER' && String(demand.playerId) === id);
      if (pending) resolvePlayerDemand(state.save, id, 'LIST', gameDate());
      else if (!state.save.transferListed.includes(id)) state.save.transferListed.push(id);
      persist();
      render();
    });
  });
}
