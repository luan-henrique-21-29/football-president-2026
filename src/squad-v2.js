import {squadPage as baseSquadPage} from './football-pages.js';
export function squadPage(){
 const html=baseSquadPage();
 return html.replace('<button class="button danger" id="sellPlayer">Ouvir proposta</button>','<button class="button ghost" id="loanOutPlayer">Emprestar</button><button class="button danger" id="sellPlayer">Ouvir proposta</button>');
}
