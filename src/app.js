import {state,initState,ensurePlayers,createCareerFromForm} from './state.js';
import {calendarPage} from './views.js';
import {cover} from './brand-ui.js';
import {setup,frame} from './shell-v2.js';
import {squadPage} from './squad-v5.js';
import {coachPage} from './coach-v4.js';
import {marketPage,bindMarketV4} from './market-v4.js';
import {dashboardPage} from './dashboard-v8.js';
import {transferInboxPage} from './transfer-inbox-page.js';
import {notificationsPage,bindNotifications} from './notifications-page.js';
import {contractsPage,bindContractsPage} from './contracts-page.js';
import {settingsPage} from './settings-v2.js';
import {bindCoreActions} from './core-actions.js';
import {processPlayerDynamics} from './player-dynamics.js';
import {hydrateCoachData} from './coach-data.js';
import {bindPreferenceUI} from './preferences-ui.js';
import {applyUILanguage} from './ui-i18n.js';
import {installGameSound} from './sound-engine.js';
import {bindMobileShell} from './mobile-shell.js';
import {bindMatchAudioSettings} from './match-audio.js';
import {bindCareerToolbar} from './career-toolbar.js';

const app=document.querySelector('#app');
installGameSound(app);

const pages={
  dashboard:dashboardPage,
  squad:squadPage,
  coach:coachPage,
  calendar:calendarPage,
  market:marketPage,
  contracts:contractsPage,
  inbox:transferInboxPage,
  notifications:notificationsPage,
  settings:settingsPage
};

function normalizePage(){if(state.save&&!pages[state.page])state.page='dashboard'}
function errorText(error){return String(error?.message||error||'Erro inesperado').replace(/[<>&]/g,'')}
function safeBind(label,fn){try{fn()}catch(error){console.warn(`[Golaço Clash/${label}]`,error)}}
function safePage(){normalizePage();const page=pages[state.page]||dashboardPage;try{return page()}catch(error){console.error(error);state.page='dashboard';return `<section class="hero"><div><span class="eyebrow">RECUPERAÇÃO</span><h1>O jogo voltou ao Painel</h1><p>Uma tela falhou, mas sua carreira continua salva.</p></div></section><div class="card"><b>${errorText(error)}</b><button class="button" data-page="dashboard">Voltar ao Painel</button></div>`}}
function finishUI(){app.dataset.page=state.screen==='cover'?'cover':state.page||'setup';safeBind('idioma',()=>applyUILanguage(app))}

export function render(){
  try{
    normalizePage();
    if(state.screen==='cover'){
      app.innerHTML=cover();
      bindCover();
      safeBind('preferências',()=>bindPreferenceUI(render));
      safeBind('áudio',()=>bindMatchAudioSettings(render));
      finishUI();return;
    }
    if(!state.save){
      app.innerHTML=setup();
      bindSetup();
      safeBind('preferências',()=>bindPreferenceUI(render));
      safeBind('áudio',()=>bindMatchAudioSettings(render));
      finishUI();return;
    }
    if(state.world?.players?.length)safeBind('dinâmica-jogadores',()=>processPlayerDynamics(state.save,state.world,state.save.date));
    app.innerHTML=frame(safePage());
    safeBind('ações',()=>bindCoreActions(render));
    safeBind('mercado',()=>bindMarketV4(render));
    safeBind('contratos',()=>bindContractsPage(render));
    safeBind('notificações',()=>bindNotifications(render));
    safeBind('preferências',()=>bindPreferenceUI(render));
    safeBind('áudio',()=>bindMatchAudioSettings(render));
    safeBind('salvar',()=>bindCareerToolbar());
    safeBind('mobile',()=>bindMobileShell());
    finishUI();
  }catch(error){
    console.error(error);
    app.innerHTML=`<div class="fatal card"><h1>Erro recuperado</h1><p>${errorText(error)}</p><button class="button" id="recoverApp">Voltar ao Painel</button></div>`;
    document.querySelector('#recoverApp')?.addEventListener('click',()=>{state.screen=state.save?'game':'cover';state.page='dashboard';render()});
  }
}
window.__cdRender=render;

function syncCareerCoach(){
  const club=state.world?.findClub(state.save?.clubId);if(!state.save||!club)return;
  state.save.coach??={name:club.coachName||'Técnico interino',status:'EMPLOYED'};
  if(club.coachName&&(!state.save.coach.name||state.save.coach.name==='Técnico não informado'||state.save.coach.name==='Sem técnico'))state.save.coach.name=club.coachName;
  if(club.coachContractUntil&&!state.save.coach.contractUntil)state.save.coach.contractUntil=club.coachContractUntil;
  if(club.coachImage&&!state.save.coach.image)state.save.coach.image=club.coachImage;
}
function bindCover(){
  document.querySelector('#continueCareer')?.addEventListener('click',()=>{state.screen='game';state.page='dashboard';syncCareerCoach();render();ensurePlayers(render)});
  document.querySelector('#newCareer')?.addEventListener('click',()=>{state.save=null;state.screen='setup';render()});
}
function bindSetup(){
  document.querySelector('#backCover')?.addEventListener('click',()=>{state.screen='cover';render()});
  document.querySelector('#setupCountrySelect')?.addEventListener('change',e=>{state.setupFilters.country=e.target.value;state.setupFilters.league='';state.selectedClubId=null;render()});
  document.querySelector('#setupLeagueSelect')?.addEventListener('change',e=>{state.setupFilters.league=e.target.value;state.selectedClubId=null;render()});
  document.querySelectorAll('[data-country]').forEach(el=>el.onclick=()=>{state.setupFilters.country=el.dataset.country;state.setupFilters.league='';state.selectedClubId=null;render()});
  document.querySelectorAll('[data-league]').forEach(el=>el.onclick=()=>{state.setupFilters.league=el.dataset.league;state.selectedClubId=null;render()});
  document.querySelectorAll('[data-club-id]').forEach(el=>el.onclick=()=>{state.selectedClubId=el.dataset.clubId;render()});
  document.querySelector('#startCareer')?.addEventListener('click',()=>{if(createCareerFromForm()){syncCareerCoach();state.screen='game';state.page='dashboard';render();ensurePlayers(render)}});
}

initState(render).then(async()=>{
  try{await hydrateCoachData(state.world)}catch(error){console.warn('[Golaço Clash/técnicos]',error)}
  if(state.save)syncCareerCoach();
  normalizePage();render();
  if(!state.playersReady)ensurePlayers(render);
}).catch(error=>{
  console.error(error);
  app.innerHTML=`<div class="fatal card"><h1>Erro ao iniciar</h1><p>${errorText(error)}</p><button class="button" onclick="location.reload()">Recarregar</button></div>`;
});
