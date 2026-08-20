import {state,initState,ensurePlayers,createCareerFromForm,currentClub,teamOverall,formatDate,persist} from './state.js';

const app=document.querySelector('#app');
const BUILD='20260820-51';
const CORE_PAGES=new Set(['dashboard','squad','coach','calendar','market','contracts','inbox','notifications','settings']);
const cache=new Map();
let rendering=false;

const esc=v=>String(v??'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
function errorText(e){return String(e?.message||e||'Erro inesperado').replace(/[<>&]/g,'')}
function normalizePage(){if(state.save&&!CORE_PAGES.has(state.page))state.page='dashboard'}
function club(){try{return currentClub()}catch{return state.save?.clubSnapshot||null}}
function overall(){try{return teamOverall()}catch{return club()?.teamOverall||72}}

async function load(key,path){
  if(cache.has(key))return cache.get(key);
  const promise=import(`${path}?v=${BUILD}`).catch(error=>{cache.delete(key);throw error});
  cache.set(key,promise);return promise;
}

function shell(body){
  const c=club(),name=c?.name||state.save?.clubName||'Clube',nav=[
    ['dashboard','⌂','Painel'],['squad','◎','Plantel'],['coach','◇','Técnico'],['calendar','▦','Jogos'],
    ['market','⇄','Mercado'],['contracts','✎','Contratos'],['inbox','⇩','Propostas'],['notifications','♢','Alertas'],['settings','⚙','Config.']
  ];
  return `<div class="gcp-game-shell gcp-stable-shell" data-build="${BUILD}">
    <header class="topbar"><div class="brand"><button class="brand-mark" id="goCover">G</button><div class="brand-copy"><strong>GOLAÇO CLASH</strong><span>${esc(name)}</span></div></div>
    <div class="top-meta"><span>OVR ${overall()}</span><button class="gcp-career-tool" id="quickSave">▣ <span>Salvar</span></button><button class="gcp-career-tool" data-page="settings">⚙ <span>Config.</span></button></div></header>
    <div class="layout"><aside class="sidebar">${nav.map(([id,icon,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}"><i>${icon}</i><span>${label}</span></button>`).join('')}</aside><main class="content" id="gameContent">${body}</main></div>
    <nav class="gcp-mobile-dock">${nav.slice(0,5).map(([id,icon,label])=>`<button class="${state.page===id?'active':''}" data-page="${id}"><i>${icon}</i><span>${label}</span></button>`).join('')}<button data-page="settings"><i>⚙</i><span>Mais</span></button></nav>
  </div>`;
}

function loading(label='Carregando'){return `<section class="card gcp-stable-loading"><h2>${label}</h2><p>Aguarde um instante.</p></section>`}
function failedPage(page,error){return `<section class="hero"><div><span class="eyebrow">RECUPERAÇÃO AUTOMÁTICA</span><h1>Essa área foi isolada</h1><p>O restante da carreira continua funcionando.</p></div></section><div class="card"><b>${esc(errorText(error))}</b><div class="actions"><button class="button" data-retry-page="${esc(page)}">Tentar novamente</button><button class="button secondary" data-page="dashboard">Voltar ao Painel</button></div></div>`}

const routes={
  dashboard:async()=>({...(await load('dashboard','./dashboard-v8.js')),pageFn:'dashboardPage'}),
  squad:async()=>({...(await load('squad','./squad-v5.js')),pageFn:'squadPage'}),
  coach:async()=>({...(await load('coach','./coach-v4.js')),pageFn:'coachPage'}),
  calendar:async()=>({...(await load('views','./views.js')),pageFn:'calendarPage'}),
  market:async()=>({...(await load('market','./market-v4.js')),pageFn:'marketPage',bindFn:'bindMarketV4'}),
  contracts:async()=>({...(await load('contracts','./contracts-page.js')),pageFn:'contractsPage',bindFn:'bindContractsPage'}),
  inbox:async()=>({...(await load('inbox','./transfer-inbox-page.js')),pageFn:'transferInboxPage'}),
  notifications:async()=>({...(await load('notifications','./notifications-page.js')),pageFn:'notificationsPage',bindFn:'bindNotifications'}),
  settings:async()=>({...(await load('settings','./settings-v2.js')),pageFn:'settingsPage'})
};

async function pageHtml(page){
  try{
    const mod=await routes[page]();
    const fn=mod[mod.pageFn];
    if(typeof fn!=='function')throw new Error(`Tela ${page} indisponível`);
    return {html:fn(),mod};
  }catch(error){console.error(`[Golaço Clash/${page}]`,error);return {html:failedPage(page,error),mod:null,error}}
}

function bindBase(){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page||'dashboard';state.selectedMarketPlayerId=null;state.selectedSquadPlayerId=null;render();if(['dashboard','squad','market','contracts'].includes(state.page))ensurePlayers(render)});
  document.querySelector('#goCover')?.addEventListener('click',()=>{state.screen='cover';render()});
  document.querySelector('#quickSave')?.addEventListener('click',e=>{persist();const b=e.currentTarget,old=b.innerHTML;b.innerHTML='✓ <span>Salvo</span>';b.disabled=true;setTimeout(()=>{if(b.isConnected){b.innerHTML=old;b.disabled=false}},700)});
  document.querySelectorAll('[data-retry-page]').forEach(b=>b.onclick=()=>{cache.delete(b.dataset.retryPage);render()});
}

async function bindPage(page,mod){
  try{
    const core=await load('core-actions','./core-actions.js');
    core.bindCoreActions?.(render);
  }catch(error){console.warn('[Golaço Clash/core-actions]',error)}
  if(mod?.bindFn&&typeof mod[mod.bindFn]==='function'){
    try{mod[mod.bindFn](render)}catch(error){console.warn(`[Golaço Clash/bind:${page}]`,error)}
  }
  if(page==='settings'){
    try{const pref=await load('preferences-ui','./preferences-ui.js');pref.bindPreferenceUI?.(render)}catch(error){console.warn('[Golaço Clash/preferences]',error)}
    try{const audio=await load('match-audio','./match-audio.js');audio.bindMatchAudioSettings?.(render)}catch(error){console.warn('[Golaço Clash/audio]',error)}
  }
}

async function coverHtml(){
  try{const mod=await load('brand','./brand-ui.js');return mod.cover()}catch{return `<section class="gcp-fallback-cover"><h1>GOLAÇO CLASH</h1>${state.save?'<button class="button big" id="continueCareer">Continuar carreira</button>':''}<button class="button secondary" id="newCareer">Nova carreira</button></section>`}
}
async function setupHtml(){
  try{const mod=await load('setup','./setup-v4.js');return mod.setup()}catch(error){return `<section class="card"><h1>Escolher clube</h1><p>${esc(errorText(error))}</p><button class="button" id="backCover">Voltar</button></section>`}
}
function syncCoach(){const c=club();if(!state.save||!c)return;state.save.coach??={name:c.coachName||`Comissão interina — ${c.name}`,status:'INTERIM'};if(!state.save.coach.name||['Sem técnico','Técnico não informado'].includes(state.save.coach.name))state.save.coach.name=c.coachName||`Comissão interina — ${c.name}`}
function bindCover(){document.querySelector('#continueCareer')?.addEventListener('click',()=>{state.screen='game';state.page='dashboard';syncCoach();render();ensurePlayers(render)});document.querySelector('#newCareer')?.addEventListener('click',()=>{state.save=null;state.screen='setup';render()})}
function bindSetup(){document.querySelector('#backCover')?.addEventListener('click',()=>{state.screen='cover';render()});document.querySelector('#setupCountrySelect')?.addEventListener('change',e=>{state.setupFilters.country=e.target.value;state.setupFilters.league='';state.selectedClubId=null;render()});document.querySelector('#setupLeagueSelect')?.addEventListener('change',e=>{state.setupFilters.league=e.target.value;state.selectedClubId=null;render()});document.querySelectorAll('[data-country]').forEach(el=>el.onclick=()=>{state.setupFilters.country=el.dataset.country;state.setupFilters.league='';state.selectedClubId=null;render()});document.querySelectorAll('[data-league]').forEach(el=>el.onclick=()=>{state.setupFilters.league=el.dataset.league;state.selectedClubId=null;render()});document.querySelectorAll('[data-club-id]').forEach(el=>el.onclick=()=>{state.selectedClubId=el.dataset.clubId;render()});document.querySelector('#startCareer')?.addEventListener('click',()=>{if(createCareerFromForm()){syncCoach();state.screen='game';state.page='dashboard';render();ensurePlayers(render)}})}

export async function render(){
  if(rendering)return;rendering=true;
  try{
    normalizePage();
    if(state.screen==='cover'){app.innerHTML=await coverHtml();bindCover();return}
    if(!state.save){app.innerHTML=await setupHtml();bindSetup();return}
    const page=state.page||'dashboard';
    app.innerHTML=shell(loading());bindBase();
    const result=await pageHtml(page);
    const root=document.querySelector('#gameContent');if(root)root.innerHTML=result.html;
    bindBase();await bindPage(page,result.mod);
  }catch(error){console.error('[Golaço Clash/bootstrap]',error);app.innerHTML=`<div class="fatal card"><h1>Recuperando o jogo</h1><p>${esc(errorText(error))}</p><button class="button" id="hardRecover">Abrir Painel</button></div>`;document.querySelector('#hardRecover')?.addEventListener('click',()=>{state.screen=state.save?'game':'cover';state.page='dashboard';render()})}
  finally{rendering=false}
}
window.__cdRender=render;
window.__gcpBuild=BUILD;

initState(render).then(()=>{if(state.save)syncCoach();normalizePage();render();if(!state.playersReady)ensurePlayers(render)}).catch(error=>{console.error('[Golaço Clash/startup]',error);app.innerHTML=`<div class="fatal card"><h1>Erro de inicialização</h1><p>${esc(errorText(error))}</p><button class="button" onclick="location.reload()">Recarregar</button></div>`});
