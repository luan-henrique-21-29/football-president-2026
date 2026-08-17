import {state,esc,currentClub} from './state.js';
import {ensureLeagueState,standings,ruleForCompetition} from './league-engine.js';

function tag(row,total,rule){
 if(!rule)return '';
 if(rule.noMovement)return '';
 if(rule.tier===1&&rule.down&&row.pos>total-rule.down)return 'Zona de queda';
 if(rule.tier===2&&rule.up&&row.pos<=rule.up)return 'Acesso';
 if(rule.tier===2&&rule.playoff&&rule.playoff.includes(row.pos))return 'Playoff';
 return '';
}
export function standingsPage(){
 const club=currentClub();
 const ls=ensureLeagueState(state.save,club,state.world);
 const rows=standings(state.save);
 const rule=ruleForCompetition(ls.competitionId);
 const me=rows.find(r=>String(r.clubId)===String(club.id));
 return `<div class="hero"><div><span class="eyebrow">LIGA</span><h1>Classificação</h1><p>${esc(ls.leagueName)} • rodada ${ls.round}</p></div><div class="ovr-block"><span>POSIÇÃO</span><b>${me?.pos||'—'}</b></div></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th><th>Situação</th></tr></thead><tbody>${rows.map(r=>`<tr class="${String(r.clubId)===String(club.id)?'selected':''}"><td>${r.pos}</td><td><b>${esc(r.name)}</b></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd>0?'+':''}${r.gd}</td><td><b>${r.pts}</b></td><td>${esc(tag(r,rows.length,rule))}</td></tr>`).join('')}</tbody></table></div><div class="card standings-legend"><b>Formato</b><p>${rule?.noMovement?'Sem acesso/rebaixamento automático entre MLS e USL no modo padrão.':rule?.tier===1?`${rule.down||0} clubes na zona de rebaixamento.`:`${rule?.up||0} acessos diretos${rule?.playoff?' + playoffs de acesso':''}.`}</p></div>`;
}
export function standingsMini(){
 const club=currentClub();
 const ls=ensureLeagueState(state.save,club,state.world);
 const rows=standings(state.save);
 const me=rows.find(r=>String(r.clubId)===String(club.id));
 const visible=rows.slice(0,7);
 if(me&&!visible.some(r=>r.clubId===me.clubId))visible.push(me);
 return `<div class="card standings-card"><div class="standings-title"><div><span class="eyebrow">CLASSIFICAÇÃO</span><h2>${esc(ls.leagueName)}</h2></div><button class="button ghost compact" data-page="standings">Ver tabela</button></div><div class="mini-table">${visible.map(r=>`<div class="mini-row ${String(r.clubId)===String(club.id)?'me':''}"><span>${r.pos}</span><b>${esc(r.name)}</b><em>${r.p}J</em><strong>${r.pts} pts</strong></div>`).join('')}</div></div>`;
}
