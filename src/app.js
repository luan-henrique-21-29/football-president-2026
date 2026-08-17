import { state,initState,ensurePlayers,createCareerFromForm } from './state.js';
import { cover,clubPage,calendarPage,newsPage,databasePage } from './views.js';
import { setup,frame } from './shell.js';
import { squadPage } from './football-pages.js';
import { coachPage } from './coach-v2.js';
import { marketPage } from './market-v2.js';
import { dashboardPage,financesPage,facilitiesPage,staffPage,careerPage,achievementsPage,settingsPage } from './management-pages.js';
import { bind } from './actions.js';
const app=document.querySelector('#app');
const pages={dashboard:dashboardPage,club:clubPage,squad:squadPage,coach:coachPage,calendar:calendarPage,market:marketPage,staff:staffPage,finances:financesPage,facilities:facilitiesPage,career:careerPage,achievements:achievementsPage,news:newsPage,database:databasePage,settings:settingsPage};
export function render(){if(state.screen==='cover'){app.innerHTML=cover();bindCover();return;}if(!state.save){app.innerHTML=setup();bindSetup();return;}app.innerHTML=frame((pages[state.page]||dashboardPage)());bind(render);}
function bindCover(){document.querySelector('#continueCareer')?.addEventListener('click',()=>{state.screen='game';state.page='dashboard';render();ensurePlayers(render);});document.querySelector('#newCareer')?.addEventListener('click',()=>{state.save=null;state.screen='setup';render();});}
function bindSetup(){document.querySelector('#backCover')?.addEventListener('click',()=>{state.screen='cover';render();});const refresh=()=>{state.setupFilters.country=document.querySelector('#countryFilter')?.value||'';state.setupFilters.league=document.querySelector('#leagueFilter')?.value||'';state.setupFilters.search=document.querySelector('#clubSearch')?.value||'';render();};document.querySelector('#countryFilter')?.addEventListener('change',refresh);document.querySelector('#leagueFilter')?.addEventListener('change',refresh);document.querySelector('#clubSearch')?.addEventListener('change',refresh);document.querySelectorAll('[data-club-id]').forEach(el=>el.onclick=()=>{state.selectedClubId=el.dataset.clubId;render();});document.querySelector('#startCareer')?.addEventListener('click',()=>{if(createCareerFromForm()){state.screen='game';state.page='dashboard';render();ensurePlayers(render);}});}
initState(render).catch(error=>{console.error(error);app.innerHTML=`<div class="fatal card"><h1>Erro ao iniciar</h1><p>${error.message}</p><button class="button" onclick="location.reload()">Recarregar</button></div>`;});
