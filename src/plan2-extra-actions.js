import {state,persist,gameDate} from './state.js';
import {resolvePlayerDemand} from './player-dynamics.js';
import {toggleShortlist} from './plan2-engine.js';

let renderRef=null,installed=false;
function toast(message){const old=document.querySelector('.cd-toast.extra');old?.remove();const el=document.createElement('div');el.className='cd-toast extra';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}
function selectedPlayerId(){return String(state.selectedSquadPlayerId||'')}
function handleDemand(button){const id=selectedPlayerId();if(!id)return;const action=button.dataset.playerDemand;if(action==='ACKNOWLEDGE'){const r=resolvePlayerDemand(state.save,id,'ACKNOWLEDGE',gameDate());persist();if(r.ok){toast(r.message);document.querySelector('#p2RenewPlayer')?.click()}return}const r=resolvePlayerDemand(state.save,id,action,gameDate());if(r.ok){persist();toast(r.message);renderRef?.()}}
function handleShortlist(button){const id=button.dataset.toggleShortlist;if(!id)return;const added=toggleShortlist(state.save,id);persist();toast(added?'Jogador adicionado à lista curta.':'Jogador removido da lista curta.');renderRef?.()}
export function bindPlan2Extras(render){renderRef=render;if(installed)return;installed=true;document.addEventListener('click',e=>{const demand=e.target.closest('[data-player-demand]');if(demand){e.preventDefault();handleDemand(demand);return}const shortlist=e.target.closest('[data-toggle-shortlist]');if(shortlist){e.preventDefault();handleShortlist(shortlist)}},true)}
