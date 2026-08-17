import {setup as baseSetup,frame as baseFrame} from './shell-v2.js';
import {state} from './state.js';
export const setup=baseSetup;
export function frame(body){const media=`<button class="nav-btn ${state.page==='media'?'active':''}" data-page="media"><i>◉</i>Imprensa</button>`;return baseFrame(body).replace('</aside>',`${media}</aside>`)}
