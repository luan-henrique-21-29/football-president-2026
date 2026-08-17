import {setup as baseSetup,frame as baseFrame} from './shell.js';
import {state} from './state.js';
export const setup=baseSetup;
export function frame(body){const extra=[['standings','≡','Classificação'],['statistics','Σ','Estatísticas'],['competitions','♜','Competições'],['world','◎','Mundo'],['jobs','↗','Empregos']].map(([id,icon,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}"><i>${icon}</i>${label}</button>`).join('');return baseFrame(body).replace('</aside>',`${extra}</aside>`)}
