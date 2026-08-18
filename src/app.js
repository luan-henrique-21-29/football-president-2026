import { state,initState,ensurePlayers,createCareerFromForm } from './state.js';
import { clubPage,calendarPage,newsPage,databasePage } from './views.js';
import { cover } from './brand-ui.js';
import { setup,frame } from './shell-v2.js';
import { squadPage } from './squad-v3.js';
import { coachPage } from './coach-v4.js';
import { marketPage } from './market-v3.js';
import { dashboardPage } from './dashboard-v6.js';
import { scoutingPage } from './scouting-page.js';
import { transferInboxPage } from './transfer-inbox-page.js';
import { standingsPage } from './standings-page.js';
import { statisticsPage } from './statistics-page.js';
import { jobsPage } from './jobs-page.js';
import { competitionsPage } from './competitions-page.js';
import { worldPage } from './world-page.js';
import { boardPage } from './board-page.js';
import { financesPage,facilitiesPage,staffPage,careerPage,achievementsPage } from './management-pages.js';
import { settingsPage } from './settings-v2.js';
import { bind } from './actions-board.js';
import { bindPlan2 } from './plan2-actions.js';
import { bindContractNegotiation } from './contract-negotiation.js';
import { installDecisionUI } from './decision-ui.js';
import { hydrateCoachData } from './coach-data.js';
import {bindPreferenceUI} from './preferences-ui.js';
const app=document.querySelector('#app');
installDecisionUI();
let navMemory={top:0,left:0};
const pages={dashboard:dashboardPage,scouting:scoutingPage,inbox:transferInboxPage,standings:standingsPage,statistics:statisticsPage,jobs:jobsPage,competitions:competitionsPage,board:boardPage,world:worldPage,club:clubPage,squad:squadPage,coach:coachPage,calendar:calendarPage,market:marketPage,staff:staffPage,finances:financesPage,facilities:facilitiesPage,career:careerPage,achievements:achievementsPage,news:newsPage,database:databasePage,settings:settingsPage};
function rememberNavigation(){const n=document.querySelector('.sidebar');if(n)navMemory={top:n.scrollTop,left:n.scrollLeft};}
function restoreNavigation(){requestAnimationFrame(()=>{const n=document.querySelector('.sidebar');if(n){n.scrollTop=navMemory.top;n.scrollLeft=navMemory.left}})}
export function render(){rememberNavigation();if(state.screen==='cover'){app.innerHTML=cover();bindCover();bindPreferenceUI(render);return;}if(!state.save){app.innerHTML=setup();bindSetup();bindPreferenceUI(render);return;}app.innerHTML=frame((pages[state.page]||dashboardPage)());bind(render);bindPlan2(render);bindContractNegotiation(render);bindPreferenceUI(render);restoreNavigation();}
function syncCareerCoach(){const club=state.world?.findClub(state.save?.clubId);if(!state.save?.coach||!club)return;if(club.coachName&&(!state.save.coach.name||state.save.coach.name==='Técnico não informado'))state.save.coach.name=club.coachName;if(club.coachContractUntil&&!state.save.coach.contractUntil)state.save.coach.contractUntil=club.coachContractUntil;if(club.coachImage&&!state.save.coach.image)state.save.coach.image=club.coachImage;}
function bindCover(){document.querySelector('#continueCareer')?.addEventListener('click',()=>{state.screen='game';state.page='dashboard';syncCareerCoach();render();ensurePlayers(render);});document.querySelector('#newCareer')?.addEventListener('click',()=>{state.save=null;state.screen='setup';render();});}
function bindSetup(){document.querySelector('#backCover')?.addEventListener('click',()=>{state.screen='cover';render();});document.querySelectorAll('[data-country]').forEach(el=>el.onclick=()=>{state.setupFilters.country=el.dataset.country;state.setupFilters.league='';state.selectedClubId=null;render();});document.querySelectorAll('[data-league]').forEach(el=>el.onclick=()=>{state.setupFilters.league=el.dataset.league;state.selectedClubId=null;render();});document.querySelectorAll('[data-club-id]').forEach(el=>el.onclick=()=>{state.selectedClubId=el.dataset.clubId;render();});document.querySelector('#startCareer')?.addEventListener('click',()=>{if(createCareerFromForm()){syncCareerCoach();state.screen='game';state.page='dashboard';render();ensurePlayers(render);}});}
initState(render).then(async()=>{await hydrateCoachData(state.world);if(state.save)syncCareerCoach();render();}).catch(error=>{console.error(error);app.innerHTML=`<div class="fatal card"><h1>Erro ao iniciar</h1><p>${error.message}</p><button class="button" onclick="location.reload()">Recarregar</button></div>`;});
