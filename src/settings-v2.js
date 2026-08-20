import {state} from './state.js';
import {getPreferences,currencyOptions,languageOptions,exchangeMeta} from './preferences.js';
import {getMatchAudio} from './match-audio.js';

export function settingsPage(){
  const pref=getPreferences(),match=getMatchAudio(),fx=exchangeMeta(),speed=Number(state.save?.settings?.matchSpeed||1);
  return `<section class="gcp-simple-settings">
    <div class="hero"><div><span class="eyebrow">CONFIGURAÇÕES</span><h1>Preferências do jogo</h1><p>Só o que afeta a experiência. Sem configuração desnecessária.</p></div></div>
    <div class="card cd-game-settings">
      <div class="cd-setting-grid">
        <label><span>Idioma</span><select data-pref="language" id="gameLanguage">${languageOptions().map(x=>`<option value="${x.code}" ${x.code===pref.language?'selected':''}>${x.label}</option>`).join('')}</select></label>
        <label><span>Moeda</span><select data-pref="currency" id="gameCurrency">${currencyOptions().map(x=>`<option value="${x.code}" ${x.code===pref.currency?'selected':''}>${x.label}</option>`).join('')}</select></label>
        <label><span>Som da interface</span><select data-pref="sound" id="gameSound"><option value="true" ${pref.sound?'selected':''}>Ligado</option><option value="false" ${!pref.sound?'selected':''}>Desligado</option></select></label>
        <label><span>Efeitos da partida</span><select data-match-audio id="matchSound"><option value="true" ${match.enabled!==false?'selected':''}>Ligado</option><option value="false" ${match.enabled===false?'selected':''}>Desligado</option></select><button type="button" class="button ghost compact" id="matchSoundTest">Testar gol</button></label>
        <label><span>Volume</span><input data-pref="volume" id="gameVolume" type="range" min="0" max="1" step="0.05" value="${pref.volume}"><small>${Math.round(pref.volume*100)}%</small></label>
        <label><span>Velocidade padrão da partida</span><select id="defaultMatchSpeed">${[1,2,4,8].map(x=>`<option value="${x}" ${speed===x?'selected':''}>${x}x</option>`).join('')}</select></label>
      </div>
      <div class="cd-rate-note"><span>Câmbio: ${fx.date||'—'} • ${fx.source||'ECB'}</span></div>
      <button class="button big" id="savePreferences">Salvar configurações</button>
    </div>
  </section>`;
}
