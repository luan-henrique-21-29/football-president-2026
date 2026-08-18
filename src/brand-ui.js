import './player-extra-data.js';
import {state,SNAPSHOT} from './state.js';
import {frontPreferences} from './preferences-ui.js';
import {t} from './preferences.js';

const ART='20260818-9';
export function cover(){
  const has=!!state.save;
  const status=state.loadingWorld
    ? 'Carregando base mundial…'
    : state.world?.status==='world'
      ? `${state.world.clubs.length} clubes disponíveis`
      : 'Base local ativa';
  return `<section class="cd-cover-screen light-identity">
    <img class="cd-cover-art" src="./assets/brand/club-dynasty-26-cover.webp?v=${ART}" alt="Capa de futebol do Golaço Clash President" />
    <div class="cd-cover-vignette"></div>
    <div class="cd-cover-ui">
      <div class="cd-cover-brand">
        <div class="gcp-cover-brandmark" aria-label="Golaço Clash President">
          <div class="gcp-emblem" aria-hidden="true"><span>G</span></div>
          <div class="gcp-wordmark"><strong>GOLAÇO <em>CLASH</em></strong><b>PRESIDENT</b></div>
        </div>
        <div class="cd-cover-copy">
          <span>DATABASE ${SNAPSHOT.split('-').reverse().join('/')}</span>
          <p>Você manda no clube. O treinador monta o time. O mercado, a torcida e os resultados respondem às suas decisões.</p>
        </div>
      </div>
      <div class="cd-cover-actions">
        ${has?`<button class="cd-action primary" id="continueCareer"><strong>${t('continue').toUpperCase()}</strong><span>Voltar à sua carreira</span><i>›</i></button>`:''}
        <button class="cd-action ${has?'glass':'primary'}" id="newCareer"><strong>${(has?t('newCareer'):t('startCareer')).toUpperCase()}</strong><span>${has?'Começar outra presidência':'Assumir o controle de um clube'}</span><i>›</i></button>
      </div>
      ${frontPreferences()}
      <div class="cd-cover-status"><span class="status-dot ${state.loadingWorld?'loading':state.world?.status==='world'?'ok':'warn'}"></span>${status}</div>
    </div>
  </section>`;
}
