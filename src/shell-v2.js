import {setup as baseSetup,frame as baseFrame} from './shell.js';
import {state} from './state.js';

export function setup(){
  return baseSetup().replace(
    '<section class="setup-screen"><div class="setup-top">',
    '<section class="setup-screen"><div class="cd-setup-art"><img src="./assets/brand/club-dynasty-26-club-select.webp" alt="Visual Club Dynasty 26 para escolha de país, liga e clube"></div><div class="setup-top">'
  );
}

export function frame(body){
  const extra=[['standings','≡','Classificação'],['statistics','Σ','Estatísticas'],['competitions','♜','Competições'],['board','▣','Conselho'],['world','◎','Mundo'],['jobs','↗','Empregos']].map(([id,icon,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}"><i>${icon}</i>${label}</button>`).join('');
  return baseFrame(body)
    .replace('<button class="brand-mark" id="goCover">FP</button>','<button class="brand-mark cd-brand-mark" id="goCover"><img src="./assets/brand/club-dynasty-26-logo.webp" alt="CD26"></button>')
    .replace('<div class="brand-copy"><strong>FOOTBALL PRESIDENT</strong>','<div class="brand-copy cd-brand-copy"><strong>CLUB <em>DYNASTY 26</em></strong>')
    .replace('</aside>',`${extra}</aside>`);
}
