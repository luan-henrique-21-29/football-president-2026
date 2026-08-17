import {dashboardPage as baseDashboard} from './dashboard-v2.js';
import {statisticsMini} from './statistics-page.js';
export function dashboardPage(){return `${baseDashboard()}<h2 class="section-title">Elenco em números</h2>${statisticsMini()}`;}
