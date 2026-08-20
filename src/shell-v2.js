import {setup as modernSetup} from './setup-v4.js';
import {state,currentClub,nextFixture,teamOverall,formatDate,esc} from './state.js';
import {notificationCount} from './notifications-page.js';
import {mobileDock} from './mobile-shell.js';

export const setup=modernSetup;

const NAV=[
  ['dashboard','⌂','Painel'],
  ['squad','◎','Plantel'],
  ['coach','◇','Técnico'],
  ['calendar','▦','Jogos'],
  ['market','⇄','Mercado'],
  ['contracts','✎','Contratos'],
  ['inbox','⇩','Propostas'],
  ['notifications','♢','Notificações'],
  ['settings','⚙','Configurações']
];

export function frame(body){
  const club=currentClub(),count=notificationCount(state.save),date=nextFixture()?.date||state.save?.date;
  const nav=NAV.map(([id,icon,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}" ${state.page===id?'aria-current="page"':''}><i>${icon}</i><span>${label}</span></button>`).join('');
  return `<div class="gcp-game-shell">
    <header class="topbar" role="banner">
      <div class="brand">
        <button class="brand-mark gcp-brand-button" id="goCover" aria-label="Voltar à capa"><span class="gcp-mini-mark">G</span></button>
        <div class="brand-copy gcp-brand-copy"><strong>GOLAÇO <em>CLASH</em></strong><span>${esc(club?.name||state.save?.clubName||'Clube')}</span></div>
      </div>
      <div class="top-meta">
        <span>${date?formatDate(date):''}</span>
        <span class="badge">OVR ${teamOverall()}</span>
        <button class="gcp-notification-bell ${count?'has-alerts':''}" data-page="notifications" aria-label="Notificações">♢${count?`<b>${count>99?'99+':count}</b>`:''}</button>
        <button class="gcp-career-tool" id="quickSave" aria-label="Salvar carreira">▣ <span>Salvar</span></button>
        <button class="gcp-career-tool" data-page="settings" aria-label="Configurações">⚙ <span>Config.</span></button>
        <button class="button ghost compact" id="fullscreen" aria-label="Alternar tela cheia">Tela cheia</button>
      </div>
    </header>
    <div class="layout">
      <aside class="sidebar" aria-label="Menu principal">
        <div class="side-club"><div class="club-monogram mini">${esc((club?.name||'GC').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div><div><b>${esc(club?.name||state.save?.clubName||'Clube')}</b><span>${esc(state.save?.coach?.name||'Técnico')}</span></div></div>
        ${nav}
      </aside>
      <main class="content" id="gameContent" tabindex="-1">${body}</main>
    </div>
    ${mobileDock()}
  </div>`;
}
