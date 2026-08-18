const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function weightedPick(list){
  if(!list?.length)return null;
  const weights=list.map(p=>Math.max(1,(p.overall||70)-55)),total=weights.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<list.length;i++){r-=weights[i];if(r<=0)return list[i]}
  return list.at(-1);
}

function makePlayers(team,names=[]){
  const shape=[[7,50],[20,14],[20,38],[20,62],[20,86],[42,18],[42,42],[42,68],[66,18],[66,50],[66,82]];
  return shape.map(([x,y],i)=>({team,i,x:team?100-x:x,y,tx:team?100-x:x,ty:y,speed:.42+Math.random()*.25,label:names[i]||String(i+1)}));
}

function minutePool(count){
  const used=new Set(),out=[];
  while(out.length<count){const m=Math.floor(3+Math.random()*87);if(!used.has(m)){used.add(m);out.push(m)}}
  return out.sort((a,b)=>a-b);
}

function buildEvents({result,homeName,awayName,userTeam,starters}){
  const events=[],homeGoals=userTeam===0?result.gf:result.ga,awayGoals=userTeam===0?result.ga:result.gf;
  const totalGoals=homeGoals+awayGoals,totalExtras=Math.min(26,Math.max(12,Math.round((result.shots+result.shotsAgainst)*.72)));
  const minutes=minutePool(totalGoals+totalExtras+6),goalMinutes=minutes.splice(0,totalGoals);
  const userAttackers=(starters||[]).filter(p=>/attack|forward|winger|striker|midfield/i.test(`${p.position||''} ${p.subPosition||''}`));
  const userCandidates=userAttackers.length?userAttackers:starters||[];
  let gi=0;
  const addGoals=(team,count)=>{for(let i=0;i<count;i++){
    const m=goalMinutes[gi++]||Math.floor(10+Math.random()*75);
    const scorer=team===userTeam?weightedPick(userCandidates):null;
    events.push({m,type:'goal',team,text:scorer?`GOOOL! ${scorer.name} marca para o ${team===0?homeName:awayName}.`:`GOOOL do ${team===0?homeName:awayName}!`,player:scorer?.name||''});
  }};
  addGoals(0,homeGoals);addGoals(1,awayGoals);
  for(let i=0;i<totalExtras;i++){
    const m=minutes[i]||Math.floor(4+Math.random()*84),team=Math.random()<(result.possession/100)?userTeam:1-userTeam,r=Math.random();
    const teamName=team===0?homeName:awayName;
    if(r<.10)events.push({m,type:'card',team,text:`Cartão amarelo para o ${teamName}.`});
    else if(r<.23)events.push({m,type:'corner',team,text:`Escanteio para o ${teamName}.`});
    else if(r<.38)events.push({m,type:'save',team,text:`Finalização do ${teamName} e grande defesa do goleiro!`});
    else if(r<.51)events.push({m,type:'shot',team,text:`${teamName} finaliza com perigo.`});
    else if(r<.63)events.push({m,type:'foul',team,text:`Falta marcada a favor do ${teamName}.`});
    else if(r<.72)events.push({m,type:'offside',team,text:`Impedimento do ${teamName}.`});
    else events.push({m,type:'chance',team,text:`Boa construção do ${teamName} no campo de ataque.`});
  }
  [58,66,74,81].forEach((m,i)=>events.push({m,type:'sub',team:i%2,text:`Substituição no ${i%2===0?homeName:awayName}. O treinador mexe pensando também no calendário.`}));
  events.push({m:45,type:'half',team:null,text:'Intervalo.'});
  return events.sort((a,b)=>a.m-b.m||((a.type==='goal')?-1:1));
}

export function showMatchViewer({app,club,fixture,result,coachName,onFinish}){
  const homeName=fixture.home?club.name:fixture.opponentName,awayName=fixture.home?fixture.opponentName:club.name,userTeam=fixture.home?0:1;
  const displayResult={home:userTeam===0?result.gf:result.ga,away:userTeam===0?result.ga:result.gf};
  const starterNames=(result.plan?.starters||[]).map(p=>p.name?.split(/\s+/).at(-1)||p.name||'');
  const events=buildEvents({result,homeName,awayName,userTeam,starters:result.plan?.starters||[]});
  app.innerHTML=`<section class="live-match"><header class="live-head"><button class="button ghost compact" id="leaveMatch">PULAR AO FIM</button><div><span>${esc(fixture.competition)} • ${esc(fixture.round||'PARTIDA')}</span><strong><b id="homeScore">0</b> <em>–</em> <b id="awayScore">0</b></strong><small><i id="matchMinute">0</i>'</small></div><div class="speed-controls"><button id="pauseMatch" title="Pausar">Ⅱ</button><button data-speed="1" class="active">1x</button><button data-speed="2">2x</button><button data-speed="4">4x</button><button data-speed="8">8x</button></div></header><div class="live-body"><div class="pitch-shell"><canvas id="matchCanvas"></canvas><div class="score-names"><span>${esc(homeName)}</span><span>${esc(awayName)}</span></div><div id="goalOverlay" class="goal-overlay"><span>GOOOL!</span></div></div><aside class="live-panel"><div class="live-coach"><span>PLANO DE ${esc(coachName)}</span><b>${esc(result.plan?.rotation>=.4?'Time misto':result.plan?.rotation>=.15?'Rodízio leve':'Força máxima')}</b><small>${esc(result.plan?.reason||'O treinador definiu a equipe para este compromisso.')}</small></div><div class="live-stats"><div><span>Posse</span><b id="statPoss">50–50</b></div><div><span>Finalizações</span><b id="statShots">0–0</b></div><div><span>xG</span><b id="statXg">0.00–0.00</b></div><div><span>Cartões</span><b id="statCards">0–0</b></div><div><span>Substituições</span><b id="statSubs">0–0</b></div><div><span>OVR escalação</span><b>${result.plan?.lineupOverall||'—'}</b></div></div><h3>Minuto a minuto</h3><div id="commentary" class="commentary"><div><strong>0'</strong> — Bola rolando. Você está assistindo; as decisões em campo são do treinador.</div></div></aside></div></section>`;

  const canvas=document.querySelector('#matchCanvas'),ctx=canvas.getContext('2d');
  const homeLabels=userTeam===0?starterNames:[],awayLabels=userTeam===1?starterNames:[];
  const players=[...makePlayers(0,homeLabels),...makePlayers(1,awayLabels)],ball={x:50,y:50,tx:50,ty:50};
  let minuteNow=0,speed=1,paused=false,last=performance.now(),acc=0,eventIndex=0,ended=false,score=[0,0],cards=[0,0],subs=[0,0];
  const msPerMinute=120000/90;

  function resize(){const dpr=Math.min(2,devicePixelRatio||1),w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  resize();window.addEventListener('resize',resize);
  document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);paused=false;document.querySelector('#pauseMatch')?.classList.remove('active');document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelector('#pauseMatch').onclick=e=>{paused=!paused;e.currentTarget.classList.toggle('active',paused);e.currentTarget.textContent=paused?'▶':'Ⅱ';};
  document.querySelector('#leaveMatch').onclick=()=>finish(true);

  function commentary(ev){const d=document.createElement('div');d.className=ev.type;d.innerHTML=`<strong>${ev.m}'</strong> — ${esc(ev.text)}`;const root=document.querySelector('#commentary');root.prepend(d);while(root.children.length>14)root.lastElementChild.remove();}
  function processEvents(){while(eventIndex<events.length&&events[eventIndex].m<=minuteNow){const e=events[eventIndex++];if(e.type==='goal'){score[e.team]++;document.querySelector('#homeScore').textContent=score[0];document.querySelector('#awayScore').textContent=score[1];flashGoal(e.team);}if(e.type==='card')cards[e.team]++;if(e.type==='sub')subs[e.team]++;commentary(e);if(e.team!=null){ball.tx=e.team===0?82:18;ball.ty=12+Math.random()*76;}}}
  function flashGoal(team){const root=document.querySelector('.live-match'),ov=document.querySelector('#goalOverlay');root.classList.add('goal');ov.classList.add('show');ov.querySelector('span').textContent=`GOOOL ${team===0?homeName:awayName}!`;setTimeout(()=>{root?.classList.remove('goal');ov?.classList.remove('show')},900)}
  function updateStats(){const ratio=Math.min(1,minuteNow/90),targetPoss=userTeam===0?result.possession:100-result.possession,p=Math.round(50+(targetPoss-50)*ratio),hs=Math.round((userTeam===0?result.shots:result.shotsAgainst)*ratio),as=Math.round((userTeam===0?result.shotsAgainst:result.shots)*ratio),hx=(userTeam===0?result.xg:result.xga)*ratio,ax=(userTeam===0?result.xga:result.xg)*ratio;document.querySelector('#statPoss').textContent=`${p}–${100-p}`;document.querySelector('#statShots').textContent=`${hs}–${as}`;document.querySelector('#statXg').textContent=`${hx.toFixed(2)}–${ax.toFixed(2)}`;document.querySelector('#statCards').textContent=`${cards[0]}–${cards[1]}`;document.querySelector('#statSubs').textContent=`${subs[0]}–${subs[1]}`;}

  function move(dt){for(const p of players){if(Math.hypot(p.tx-p.x,p.ty-p.y)<3||Math.random()<.009){const attacking=p.team===0?1:-1,teamCenter=p.team===0?58:42;p.tx=clamp(p.x+attacking*(3+Math.random()*15)+(Math.random()-.5)*9,4,96);p.tx=clamp((p.tx+teamCenter*.08)/1.08,4,96);p.ty=clamp(p.y+(Math.random()-.5)*26,5,95)}const dx=p.tx-p.x,dy=p.ty-p.y,l=Math.hypot(dx,dy)||1;p.x+=dx/l*p.speed*dt*.05;p.y+=dy/l*p.speed*dt*.05}if(Math.hypot(ball.tx-ball.x,ball.ty-ball.y)<2){const carrier=players[Math.floor(Math.random()*players.length)];ball.tx=carrier.x+(carrier.team===0?7:-7);ball.ty=carrier.y+(Math.random()-.5)*8}const dx=ball.tx-ball.x,dy=ball.ty-ball.y,l=Math.hypot(dx,dy)||1;ball.x+=dx/l*dt*.11;ball.y+=dy/l*dt*.11;}

  function drawPitch(w,h){ctx.fillStyle='#17623d';ctx.fillRect(0,0,w,h);for(let i=0;i<10;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.018)':'rgba(0,0,0,.025)';ctx.fillRect(i*w/10,0,w/10,h)}ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=2;ctx.strokeRect(16,16,w-32,h-32);ctx.beginPath();ctx.moveTo(w/2,16);ctx.lineTo(w/2,h-16);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.13,0,Math.PI*2);ctx.stroke();ctx.strokeRect(16,h*.27,w*.13,h*.46);ctx.strokeRect(w-16-w*.13,h*.27,w*.13,h*.46);}
  function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);drawPitch(w,h);for(const p of players){const x=p.x/100*w,y=p.y/100*h;ctx.beginPath();ctx.fillStyle=p.team===0?'#f3f6f9':'#ff4356';ctx.arc(x,y,Math.max(4,Math.min(7,w/160)),0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.55)';ctx.stroke();if(w>600&&p.label){ctx.font='10px Inter, sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillText(String(p.label).slice(0,11),x,y-10)}}ctx.beginPath();ctx.fillStyle='#fff';ctx.arc(ball.x/100*w,ball.y/100*h,3.2,0,Math.PI*2);ctx.fill();}

  function loop(t){if(ended)return;const dt=Math.min(45,t-last);last=t;if(!paused){acc+=dt*speed;while(acc>=msPerMinute){acc-=msPerMinute;minuteNow++;document.querySelector('#matchMinute').textContent=Math.min(90,minuteNow);processEvents();updateStats();if(minuteNow>=90){finish(false);return}}move(dt*speed)}draw();requestAnimationFrame(loop)}
  function finish(skipped){if(ended)return;ended=true;window.removeEventListener('resize',resize);score=[displayResult.home,displayResult.away];document.querySelector('#homeScore').textContent=score[0];document.querySelector('#awayScore').textContent=score[1];document.querySelector('#matchMinute').textContent=90;minuteNow=90;updateStats();if(!skipped)commentary({m:90,type:'half',text:'Fim de jogo.'});setTimeout(()=>onFinish({skipped}),skipped?0:850)}
  requestAnimationFrame(loop);
}
