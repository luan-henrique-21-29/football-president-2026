import {state,esc,formatDate,contractLabel,normalizedName,currentClub} from './state.js';
import {coachPhoto} from './media.js';

function pool(){
  const employed=state.world.clubs.filter(x=>x.coachName).map(x=>({id:String(x.id),name:x.coachName,club:x.name,country:x.country,reputation:x.teamOverall||72,status:'EMPLOYED',formation:'Variável',style:(x.teamOverall||72)>=84?'Ambicioso':'Equilibrado',image:x.coachImage||'',contractUntil:x.coachContractUntil||''}));
  const free=(state.save.coachHistory||[]).filter(h=>h.name).map((h,i)=>({id:`free-${i}`,name:h.name,club:'Sem clube',country:'',reputation:72,status:'UNEMPLOYED',formation:'Variável',style:'Adaptável',image:''}));
  return[...new Map([...employed,...free].map(c=>[c.name,c])).values()].filter(c=>c.name!==state.save.coach?.name);
}

export function coachPage(){
  const c=state.save.coach,club=currentClub(),current={...c,image:c?.image||club?.coachImage||'',contractUntil:c?.contractUntil||club?.coachContractUntil||''},all=pool();
  return `<div class="hero"><div><span class="eyebrow">COMANDO TÉCNICO</span><h1>Treinadores</h1><p>O técnico decide formação, titulares, rodízio e substituições. Você decide quem ocupa o cargo.</p></div><span class="badge">Relação ${state.save.relation}/100</span></div><div class="coach-profile card">${coachPhoto(current,{size:'lg'})}<div><span class="eyebrow">TÉCNICO ATUAL • ${esc(c?.status||'EMPLOYED')}</span><h2>${esc(c?.name||club?.coachName||'Em atualização')}</h2><p>${c?.original?'Treinador do clube no início da carreira.':`Contratado em ${formatDate(c?.hiredDate)}.`}</p></div><div class="coach-contract"><span>CONTRATO RESTANTE</span><b>${current.contractUntil?contractLabel(current.contractUntil):'Não confirmado'}</b><small>${current.contractUntil?`até ${formatDate(current.contractUntil)}`:'A base não inventa uma data de vínculo.'}</small></div><button class="button danger" id="fireCoach">Demitir treinador</button></div><div class="market-toolbar card coach-filters"><input id="coachSearch" placeholder="Nome ou clube"><select id="coachStatus"><option value="">Todos</option><option value="EMPLOYED">Empregado</option><option value="UNEMPLOYED">Desempregado</option></select><select id="coachRep"><option value="0">Qualquer reputação</option><option value="85">85+</option><option value="80">80+</option><option value="75">75+</option></select><button class="button secondary" id="coachFilter">Filtrar</button></div><div id="coachResults">${coachResults(all,'','',0)}</div>`;
}

export function coachResults(all,search,status,minRep){
  const q=normalizedName(search),filtered=all.filter(c=>(!q||normalizedName(`${c.name} ${c.club}`).includes(q))&&(!status||c.status===status)&&c.reputation>=minRep).sort((a,b)=>b.reputation-a.reputation);
  return `<div class="coach-market">${filtered.slice(0,120).map(c=>`<div class="coach-card card"><div class="coach-card-head">${coachPhoto(c,{size:'md'})}<div><span>${esc(c.status)} • REP ${c.reputation}</span><h3>${esc(c.name)}</h3></div></div><p>${esc(c.club)}${c.country?` • ${esc(c.country)}`:''}</p>${c.contractUntil?`<small>Contrato: ${contractLabel(c.contractUntil)}</small>`:`<small>${esc(c.style)} • ${esc(c.formation)}</small>`}<button class="button secondary full" data-hire-coach="${esc(c.id)}" data-free-coach="${c.status==='UNEMPLOYED'?'true':'false'}" data-coach-name="${esc(c.name)}">Abordar treinador</button></div>`).join('')||'<div class="card subtle">Nenhum treinador encontrado.</div>'}</div>`;
}
