import {dashboardPage as baseDashboard} from './dashboard-v3.js';
import {jobsMini} from './jobs-page.js';
export function dashboardPage(){
  const base=baseDashboard().replace('<button class="button big" id="playNext">Jogar próxima partida</button>','<div class="match-entry-actions"><button class="button big" id="playNext">▶ Assistir partida</button><span class="subtle">Acompanhe minuto a minuto e acelere quando quiser.</span></div>');
  return `${base}<h2 class="section-title">Carreira do presidente</h2>${jobsMini()}`;
}
