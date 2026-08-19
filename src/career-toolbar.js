import {persist} from './state.js';
import {playUISound} from './preferences.js';
export function bindCareerToolbar(){const b=document.querySelector('#quickSave');b?.addEventListener('click',()=>{persist();playUISound('confirm');const old=b.innerHTML;b.disabled=true;b.innerHTML='✓ <span>Salvo</span>';setTimeout(()=>{if(b.isConnected){b.innerHTML=old;b.disabled=false}},900)})}
