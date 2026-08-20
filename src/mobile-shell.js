import {state} from './state.js';

const MAIN=[
  ['dashboard','⌂','Início'],
  ['squad','◎','Plantel'],
  ['calendar','▶','Jogos'],
  ['market','⇄','Mercado'],
  ['contracts','✎','Contratos']
];
const MORE=[
  ['coach','◇','Técnico'],
  ['inbox','⇩','Propostas'],
  ['notifications','♢','Notificações'],
  ['settings','⚙','Configurações']
];
const button=([id,icon,label])=>`<button class="${state.page===id?'active':''}" data-page="${id}" ${state.page===id?'aria-current="page"':''}><i>${icon}</i><span>${label}</span></button>`;

export function mobileDock(){
  return `<nav class="gcp-mobile-dock" aria-label="Navegação principal">${MAIN.map(button).join('')}<button data-mobile-more class="${MORE.some(x=>x[0]===state.page)?'active':''}"><i>•••</i><span>Mais</span></button></nav><div class="gcp-mobile-more" hidden><button class="gcp-more-close" data-mobile-close aria-label="Fechar">×</button><div class="gcp-more-grid">${MORE.map(button).join('')}</div></div>`;
}
export function bindMobileShell(){
  const layer=document.querySelector('.gcp-mobile-more');
  document.querySelector('[data-mobile-more]')?.addEventListener('click',()=>{if(layer)layer.hidden=false});
  document.querySelector('[data-mobile-close]')?.addEventListener('click',()=>{if(layer)layer.hidden=true});
  layer?.addEventListener('click',event=>{if(event.target===layer)layer.hidden=true});
}
