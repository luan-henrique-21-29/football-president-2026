import {dashboardPage as baseDashboard} from './dashboard-v4.js';
import {mediaMini} from './media-page.js';
export function dashboardPage(){return `${baseDashboard()}<h2 class="section-title">Imprensa</h2>${mediaMini()}`;}
