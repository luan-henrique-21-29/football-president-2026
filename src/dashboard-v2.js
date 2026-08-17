import {dashboardPage as managementDashboard} from './management-pages.js';
import {standingsMini} from './standings-page.js';
export function dashboardPage(){return `${managementDashboard()}<h2 class="section-title">Classificação</h2>${standingsMini()}`;}
