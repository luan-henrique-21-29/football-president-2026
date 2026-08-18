import {state,esc,formatDate,contractLabel,normalizedName,currentClub} from './state.js';
import {coachPhoto} from './media.js';
import {coachGameplayProfile} from './coach-profile.js';

function enrich(c){const p=coachGameplayProfile(c);return{...c,formation:p.preferredFormation,style:p.style,press:p.pressLabel,line:p.lineLabel,buildUp:p.buildUp,rotation:p.rotation,tacticalProfile:p}}
function pool(){
  const employed=state.world.clubs.filter(x=>x.coachName).map(x=>enrich({id:String(x.id),name:x.coachName,club:x.name,country:x.country,reputation:x.teamOverall||72,status:'EMPLOYED',image:x.coachImage||'',contractUntil:x.coachContractUntil||''}));
  const history=(state.save.coachHistory||[]).filter(h=>h.name).map((h,i)=>enrich({id:`free-${i}`,name:h.name,club:'Sem clube',country:'',reputation:h.reputation||72,status:'UNEMPLOYED',image:h.image||''}));
  const worldFree=(state.save.worldFreeCoaches||[]).filter(h=>h.name).map((h,i)=>enrich({id:`worldfree-${i}`,name:h.name,club:'Sem clube',country:'',reputation:h.reputation||72,status:'UNEMPLOYED',image:h.image||''}));
  return[...new Map([...employed,...history,...worldFree].map(c=>[c.name,c])).values()].filter(c=>c.name!==state.save.coach?.name);
}

export function coachPage(){
  const c=state.save.coach,club=currentClub(),current={...c,image:c?.image||club?.coachImage||'',contractUntil:c?.contractUntil||club?.coachContractUntil||''},identity=coachGameplayProfile(current),all=pool();
  return `<div class="hero"><div><span class="eyebrow">COMANDO TÉCNICO</span><h1>Treinadores</h1><p>O técnico decide formação, titulares, rodízio e substituições. Você decide quem ocupa o cargo.</p></div><span class="badge">Relação ${state.save.relation}/100</span></div><div class="coach-profile card">${coachPhoto(current,{size:'lg'})}<div><span class="eyebrow">TÉCNICO ATUAL • ${esc(c?.status||'EMPLOYED')}</span><h2>${esc(c?.name||club?.coachName||'Em atualização')}</h2><p>${esc(identity.preferredFormation)} • ${esc(identity.style)} • ${esc(identity.pressLabel)}</p></div><div class="coach-contract"><span>CONTRATO RESTANTE</span><b>${current.contractUntil?contractLabel(current.contractUntil):'Não confirmado'}</b><small>${current.contractUntil?`até ${formatDate(current.contractUntil)}`:'A base não inventa uma data de vínculo.'}</small></div><button class="button danger" id="fireCoach">Demitir treinador</button></div><div class="market-toolbar card coach-filters"><input id="coachSearch" placeholder="Nome ou clube"><select id="coachStatus"><option value="">Todos</option><option value="EMPLOYED">Empregado</option><option value="UNEMPLOYED">Desempregado</option></select><select id="coachRep"><option value="0">Qualquer reputação</option><option value="85">85+</option><option value="80">80+</option><option value="75">75+</option></select><button class="button secondary" id="coachFilter">Filtrar</button></div><div id="coachResults">${coachResults(all,'','',0)}</div>`;
}

export function coachResults(all,search,status,minRep){
  const enriched=all.map(c=>c.tacticalProfile?c:enrich(c)),q=normalizedName(search),filtered=enriched.filter(c=>(!q||normalizedName(`${c.name} ${c.club}`).includes(q))&&(!status||c.status===status)&&c.reputation>=minRep).sort((a,b)=>b.reputation-a.reputation);
  return `<div class="coach-market">${filtered.slice(0,120).map(c=>`<div class="coach-card card cd-coach-candidate"><div class="coach-card-head">${coachPhoto(c,{size:'md'})}<div><span>${esc(c.status)} • REP ${c.reputation}</span><h3>${esc(c.name)}</h3></div></div><p>${esc(c.club)}${c.country?` • ${esc(c.country)}`:''}</p><div class="cd-coach-candidate-tactics"><b>${esc(c.formation)}</b><span>${esc(c.style)}</span><small>${esc(c.press)} • ${esc(c.line)}</small><small>${esc(c.buildUp)} • rodízio ${c.rotation}/100</small></div>${c.contractUntil?`<small class="cd-contract-line">Contrato atual: ${contractLabel(c.contractUntil)}</small>`:''}<button class="button secondary full" data-hire-coach="${esc(c.id)}" data-free-coach="${c.status==='UNEMPLOYED'?'true':'false'}" data-coach-name="${esc(c.name)}">Abordar treinador</button></div>`).join('')||'<div class="card subtle">Nenhum treinador encontrado.</div>'}</div>`;
}
