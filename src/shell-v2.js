import {frame as baseFrame} from './shell.js';
import {setup as modernSetup} from './setup-v4.js';
import {state} from './state.js';
import {t} from './preferences.js';
import {notificationCount} from './notifications-page.js';
import {mobileDock} from './mobile-shell.js';
import {accessibilityButton,accessibilityLayer} from './accessibility-layer.js';
import {quickCenterButton,quickCenterLayer} from './quick-center.js';
export const setup=modernSetup;
function localizeShell(html){const map={Painel:t('dashboard'),Clube:t('club'),Plantel:t('squad'),Técnico:t('coach'),Jogos:t('calendar'),Mercado:t('market'),Carreira:t('career'),'Configurações':t('settings')};for(const [from,to] of Object.entries(map))html=html.replaceAll(`>${from}</button>`,`>${to}</button>`);return html}
export function frame(body){
 const extra=[
  ['contracts','✎','Contratos'],
  ['inbox','⇩','Propostas'],
  ['notifications','♢','Notificações'],
  ['world','⇄','Mercado Mundial'],
  ['scouting','⌕','Olheiros'],
  ['standings','≡',t('standings')]
 ].map(([id,icon,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}" ${state.page===id?'aria-current="page"':''}><i>${icon}</i>${label}</button>`).join(''),count=notificationCount(state.save),careerTools=`<button class="gcp-career-tool" id="quickSave" aria-label="Salvar carreira">▣ <span>Salvar</span></button><button class="gcp-career-tool" data-page="settings" aria-label="Abrir configurações">⚙ <span>Config.</span></button>`;
 let html=baseFrame(body).replace('<header class="topbar">','<a class="gcp-skip-link" href="#gameContent">Pular para o jogo</a><header class="topbar" role="banner">').replace('<button class="brand-mark" id="goCover">FP</button>',`<button class="brand-mark gcp-brand-button" id="goCover" aria-label="Golaço Clash"><span class="gcp-mini-mark">G</span></button>`).replace('<div class="brand-copy"><strong>FOOTBALL PRESIDENT</strong>','<div class="brand-copy gcp-brand-copy"><strong>GOLAÇO <em>CLASH</em></strong>').replace('<button class="button ghost compact" id="fullscreen">Tela cheia</button>',`${quickCenterButton()}${accessibilityButton()}<button class="gcp-notification-bell ${count?'has-alerts':''}" data-page="notifications" aria-label="Notificações">♢${count?`<b>${count>99?'99+':count}</b>`:''}</button>${careerTools}<button class="button ghost compact" id="fullscreen" aria-label="Alternar tela cheia">Tela cheia</button>`).replace('<main class="content">','<main class="content" id="gameContent" tabindex="-1">').replace('</aside>',`${extra}</aside>`);
 html+=mobileDock()+quickCenterLayer()+accessibilityLayer();return localizeShell(html)
}
