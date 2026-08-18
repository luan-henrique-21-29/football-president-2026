import {state,SNAPSHOT} from './state.js';

export function cover(){
  const has=!!state.save;
  const status=state.loadingWorld
    ? 'Carregando base mundial…'
    : state.world?.status==='world'
      ? `${state.world.clubs.length} clubes disponíveis`
      : 'Base local ativa';
  return `<section class="cd-cover-screen">
    <img class="cd-cover-art" src="./assets/brand/club-dynasty-26-cover.webp" alt="Club Dynasty 26 com três estrelas do futebol em um estádio" />
    <div class="cd-cover-vignette"></div>
    <div class="cd-cover-ui">
      <div class="cd-cover-brand">
        <img src="./assets/brand/club-dynasty-26-logo.webp" alt="Club Dynasty 26" class="cd-main-logo" />
        <div class="cd-cover-copy">
          <span>DATABASE ${SNAPSHOT.split('-').reverse().join('/')}</span>
          <p>Construa a sua dinastia. O treinador controla o campo; você controla o clube.</p>
        </div>
      </div>
      <div class="cd-cover-actions">
        ${has?'<button class="cd-action primary" id="continueCareer"><strong>CONTINUAR</strong><span>Voltar à sua carreira</span><i>›</i></button>':''}
        <button class="cd-action ${has?'glass':'primary'}" id="newCareer"><strong>${has?'NOVA CARREIRA':'COMEÇAR CARREIRA'}</strong><span>${has?'Comece uma nova dinastia':'Assuma o controle de um clube'}</span><i>›</i></button>
      </div>
      <div class="cd-cover-status"><span class="status-dot ${state.loadingWorld?'loading':state.world?.status==='world'?'ok':'warn'}"></span>${status}</div>
    </div>
  </section>`;
}
