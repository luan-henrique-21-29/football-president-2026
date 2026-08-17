import {state,esc,formatDate} from './state.js';
export function competitionsPage(){
 const map=new Map();
 for(const f of state.save.calendar||[]){if(!map.has(f.competition))map.set(f.competition,[]);map.get(f.competition).push(f)}
 const titles=state.save.trophies||[];
 const eliminated=state.save.competitionState?.eliminated||[];
 const cards=[];
 for(const [name,list] of map.entries()){
  const next=list.find(f=>!f.played);
  const out=eliminated.some(e=>e.season===state.save.season&&e.competition===name);
  const champion=titles.some(t=>t.season===state.save.season&&t.name===name);
  cards.push(`<div class="card competition-card"><span class="eyebrow">${champion?'CAMPEÃO':out?'ELIMINADO':'ATIVO'}</span><h2>${esc(name)}</h2><p>${list.filter(f=>f.played).length}/${list.length} jogos</p>${next?`<b>${formatDate(next.date)}</b><small>${esc(next.round||'')} • ${esc(next.opponentName)}</small>`:''}</div>`);
 }
 return `<div class="hero"><div><span class="eyebrow">TEMPORADA ${esc(state.save.season)}</span><h1>Competições</h1><p>Liga, copas nacionais e torneios continentais.</p></div><span class="badge">${titles.length} troféu(s)</span></div><div class="competition-grid">${cards.join('')}</div><h2 class="section-title">Sala de troféus</h2><div class="trophy-grid">${titles.slice().reverse().map(t=>`<div class="trophy card"><span>★</span><div><b>${esc(t.name)}</b><small>${esc(t.season)}</small></div></div>`).join('')||'<div class="card subtle">Nenhum título conquistado ainda.</div>'}</div>`;
}
