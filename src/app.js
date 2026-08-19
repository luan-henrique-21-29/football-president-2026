import { state,initState,ensurePlayers,createCareerFromForm,persist } from './state.js';
import { clubPage,calendarPage,newsPage,databasePage } from './views.js';
import { cover } from './brand-ui.js';
import { setup,frame } from './shell-v2.js';
import { squadPage } from './squad-v5.js';
import { coachPage } from './coach-v4.js';
import { marketPage } from './market-v3.js';
import { dashboardPage } from './dashboard-v8.js';
import { scoutingPage } from './scouting-page.js';
import { transferInboxPage } from './transfer-inbox-page.js';
import { standingsPage } from './standings-page.js';
import { statisticsPage } from './statistics-page.js';
import { jobsPage } from './jobs-page.js';
import { competitionsPage } from './competitions-page.js';
import { worldPage } from './world-page.js';
import { boardPage } from './board-page.js';
import {notificationsPage,bindNotifications} from './notifications-page.js';
import { financesPage,facilitiesPage,staffPage,careerPage,achievementsPage } from './management-pages.js';
import { settingsPage } from './settings-v2.js';
import { bind } from './actions-board.js';
import { bindPlan2 } from './plan2-actions.js';
import { bindContractNegotiation } from './contract-negotiation.js';
import { bindRenewalNegotiation } from './renewal-negotiation.js';
import { bindPlan2Extras } from './plan2-extra-actions.js';
import { processPlayerPromises } from './player-promises.js';
import { processPlayerDynamics } from './player-dynamics.js';
import { installDecisionUI } from './decision-ui.js';
import { hydrateCoachData } from './coach-data.js';
import {bindPreferenceUI} from './preferences-ui.js';
import {applyRuntimeClubMetrics,syncCareerClubMetrics} from './club-metrics.js';
import {installCustomSelectUI,enhanceCustomSelects} from './custom-select.js';
import {readUISession,applyUISession,writeUISession} from './ui-session.js';
import {applyUILanguage} from './ui-i18n.js';
import {installGameSound} from './sound-engine.js';
import {bindMobileShell} from './mobile-shell.js';
import {bindAccessibility,enhanceAccessibility,applyAccessibilityPrefs} from './accessibility-layer.js';
import {bindQuickCenter} from './quick-center.js';

const app=document.querySelector('#app');
installDecisionUI();installCustomSelectUI();installGameSound(app);applyAccessibilityPrefs();
const pendingUI=readUISession();
let uiRestored=false;
let navMemory={top:Number(pendingUI?.nav?.top)||0,left:Number(pendingUI?.nav?.left)||0};
const runtimeErrors=[];
const pages={dashboard:dashboardPage,notifications:notificationsPage,scouting:scoutingPage,inbox:transferInboxPage,standings:standingsPage,statistics:statisticsPage,jobs:jobsPage,competitions:competitionsPage,board:boardPage,world:worldPage,club:clubPage,squad:squadPage,coach:coachPage,calendar:calendarPage,market:marketPage,staff:staffPage,finances:financesPage,facilities:facilitiesPage,career:careerPage,achievements:achievementsPage,news:newsPage,database:databasePage,settings:settingsPage};
function recordRuntimeError(scope,error){const item={scope,message:String(error?.message||error||'Erro desconhecido'),stack:String(error?.stack||''),at:new Date().toISOString()};runtimeErrors.unshift(item);runtimeErrors.length=Math.min(runtimeErrors.length,30);window.__gcpRuntimeErrors=runtimeErrors;console.error(`[Golaço Clash/${scope}]`,error)}
window.addEventListener('error',e=>recordRuntimeError('window',e.error||e.message));window.addEventListener('unhandledrejection',e=>recordRuntimeError('promise',e.reason));
function rememberNavigation(){const n=document.querySelector('.sidebar');if(n)navMemory={top:n.scrollTop,left:n.scrollLeft};}
function saveUI(){if(uiRestored)writeUISession(state,navMemory)}
function restoreNavigation(){requestAnimationFrame(()=>{const n=document.querySelector('.sidebar');if(n){n.scrollTop=navMemory.top;n.scrollLeft=navMemory.left;const active=n.querySelector('.nav-btn.active');if(active){const r=active.getBoundingClientRect(),nr=n.getBoundingClientRect();if(r.right>nr.right||r.left<nr.left)active.scrollIntoView({block:'nearest',inline:'center'})}}})}
function finishUI(){app.dataset.page=state.screen==='cover'?'cover':state.page||'setup';try{enhanceCustomSelects(app)}catch(e){recordRuntimeError('custom-select',e)}try{applyUILanguage(app)}catch(e){recordRuntimeError('i18n',e)}try{enhanceAccessibility(app,state.page)}catch(e){recordRuntimeError('accessibility',e)}restoreNavigation();saveUI();}
function safeBind(scope,fn){try{fn()}catch(e){recordRuntimeError(scope,e)}}
function safePage(){const page=pages[state.page]||dashboardPage;try{return page()}catch(e){recordRuntimeError(`page:${state.page}`,e);return `<section class="hero"><div><span class="eyebrow">RECUPERAÇÃO AUTOMÁTICA</span><h1>Esta tela encontrou um erro</h1><p>O restante da carreira continua salvo. Volte ao Painel e tente a função novamente.</p></div></section><div class="card"><b>${String(e?.message||'Erro inesperado').replace(/[<>&]/g,'')}</b><p class="subtle">O erro foi registrado no diagnóstico interno do jogo.</p><button class="button" data-page="dashboard">Voltar ao Painel</button></div>`}}
export function render(){rememberNavigation();try{const metricsChanged=applyRuntimeClubMetrics(state.world),careerMetricsChanged=syncCareerClubMetrics(state.save,state.world);if((metricsChanged||careerMetricsChanged)&&state.save)persist();if(state.screen==='cover'){app.innerHTML=cover();safeBind('cover-actions',()=>bindCover());safeBind('preferences',()=>bindPreferenceUI(render));finishUI();return;}if(!state.save){app.innerHTML=setup();safeBind('setup-actions',()=>bindSetup());safeBind('preferences',()=>bindPreferenceUI(render));finishUI();return;}let changed=false;const resolvedPromises=processPlayerPromises(state.save,state.save.date);if(resolvedPromises.length)changed=true;if(state.world?.players?.length){const beforeTick=state.save.playerDynamicsLastTick,demands=processPlayerDynamics(state.save,state.world,state.save.date);if(demands.length||beforeTick!==state.save.playerDynamicsLastTick)changed=true}if(changed)persist();app.innerHTML=frame(safePage());safeBind('actions',()=>bind(render));safeBind('plan2',()=>bindPlan2(render));safeBind('contracts',()=>bindContractNegotiation(render));safeBind('renewals',()=>bindRenewalNegotiation(render));safeBind('plan2-extra',()=>bindPlan2Extras(render));safeBind('notifications',()=>bindNotifications(render));safeBind('preferences',()=>bindPreferenceUI(render));safeBind('mobile-shell',()=>bindMobileShell());safeBind('quick-center',()=>bindQuickCenter());safeBind('accessibility',()=>bindAccessibility(render));finishUI();}catch(e){recordRuntimeError('render',e);app.innerHTML=`<div class="fatal card"><h1>O jogo se recuperou de um erro</h1><p>${String(e?.message||'Erro inesperado').replace(/[<>&]/g,'')}</p><button class="button" id="recoverApp">Voltar ao Painel</button></div>`;document.querySelector('#recoverApp')?.addEventListener('click',()=>{state.screen=state.save?'game':'cover';state.page='dashboard';render()})}}
window.__cdRender=render;
window.addEventListener('pagehide',()=>{rememberNavigation();saveUI()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){rememberNavigation();saveUI()}});
function syncCareerCoach(){const club=state.world?.findClub(state.save?.clubId);if(!state.save?.coach||!club)return;if(club.coachName&&(!state.save.coach.name||state.save.coach.name==='Técnico não informado'))state.save.coach.name=club.coachName;if(club.coachContractUntil&&!state.save.coach.contractUntil)state.save.coach.contractUntil=club.coachContractUntil;if(club.coachImage&&!state.save.coach.image)state.save.coach.image=club.coachImage;}
function bindCover(){document.querySelector('#continueCareer')?.addEventListener('click',()=>{state.screen='game';state.page='dashboard';syncCareerCoach();render();ensurePlayers(render);});document.querySelector('#newCareer')?.addEventListener('click',()=>{state.save=null;state.screen='setup';render();});}
function bindSetup(){document.querySelector('#backCover')?.addEventListener('click',()=>{state.screen='cover';render();});document.querySelectorAll('[data-country]').forEach(el=>el.onclick=()=>{state.setupFilters.country=el.dataset.country;state.setupFilters.league='';state.selectedClubId=null;render();});document.querySelectorAll('[data-league]').forEach(el=>el.onclick=()=>{state.setupFilters.league=el.dataset.league;state.selectedClubId=null;render();});document.querySelectorAll('[data-club-id]').forEach(el=>el.onclick=()=>{state.selectedClubId=el.dataset.clubId;render();});document.querySelector('#startCareer')?.addEventListener('click',()=>{if(createCareerFromForm()){syncCareerCoach();state.screen='game';state.page='dashboard';render();ensurePlayers(render);}});}
initState(render).then(async()=>{await hydrateCoachData(state.world);applyRuntimeClubMetrics(state.world);if(state.save){syncCareerClubMetrics(state.save,state.world);syncCareerCoach();}applyUISession(state,pendingUI,!!state.save);if(state.save&&!pages[state.page])state.page='dashboard';uiRestored=true;render();if(!state.playersReady)ensurePlayers(render);}).catch(error=>{recordRuntimeError('startup',error);app.innerHTML=`<div class="fatal card"><h1>Erro ao iniciar</h1><p>${String(error?.message||error).replace(/[<>&]/g,'')}</p><button class="button" onclick="location.reload()">Recarregar</button></div>`;});
