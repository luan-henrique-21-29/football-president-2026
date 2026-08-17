import {dashboardPage as baseDashboard} from './dashboard-v3.js';
import {jobsMini} from './jobs-page.js';
export function dashboardPage(){return `${baseDashboard()}<h2 class="section-title">Carreira do presidente</h2>${jobsMini()}`;}
