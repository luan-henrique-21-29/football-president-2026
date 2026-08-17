import {bind as careerBind} from './actions-career.js';
import {state,currentClub,persist,gameDate} from './state.js';
import {ensureBoardState,signSponsor,requestOwnerFunds,refreshSponsorOffers} from './board-engine.js';

export function bind(render){
 careerBind(render);
 const board=ensureBoardState(state.save,currentClub());
 document.querySelectorAll('[data-sponsor]').forEach(el=>el.onclick=()=>{
   const result=signSponsor(state.save,el.dataset.sponsor,gameDate());
   if(result.ok){persist();alert(`Patrocínio de ${result.offer.name} assinado.`);render();}
 });
 document.querySelector('#requestFunds')?.addEventListener('click',()=>{
   const r=requestOwnerFunds(state.save,gameDate());persist();alert(r.message);render();
 });
 document.querySelector('#refreshSponsors')?.addEventListener('click',()=>{
   refreshSponsorOffers(state.save,currentClub(),gameDate());persist();render();
 });
 if(board.sponsorOffers?.length&&board.sponsorOffers.every(o=>o.expires<gameDate())){refreshSponsorOffers(state.save,currentClub(),gameDate());persist();}
}
