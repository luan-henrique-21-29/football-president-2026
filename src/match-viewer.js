const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function makePlayers(team){
  const shape=[[8,50],[20,15],[20,38],[20,62],[20,85],[42,18],[42,42],[42,68],[66,18],[66,50],[66,82]];
  return shape.map(([x,y],i)=>({team,i,x:team?100-x:x,y,tx:team?100-x:x,ty:y,speed:.42+Math.random()*.28}));
}
function buildEvents(result,homeName,awayName){
  const events=[];const used=[];const minute=()=>{let m;do{m=Math.floor(4+Math.random()*85)}while(used.includes(m));used.push(m);return m};
  const addGoal=(team,count)=>{for(let i=0;i<count;i++)events.push({m:minute(),type:'goal',team,text:`GOOOOOL do ${team===0?homeName:awayName}!`})};
  addGoal(0,result.gf);addGoal(1,result.ga);
  const total=Math.max(10,result.shots+result.shotsAgainst);
  for(let i=0;i<Math.min(18,total);i++){
    const m=minute(),r=Math.random(),team=Math.random()<result.possession/100?0:1;
    if(r<.14)events.push({m,type:'card',team,text:`Cartão amarelo para o ${team===0?homeName:awayName}.`});
    else if(r<.28)events.push({m,type:'corner',team,text:`Escanteio perigoso para o ${team===0?homeName:awayName}.`});
    else if(r<.4)events.push({m,type:'save',team,text:'Grande defesa do goleiro!'});
    else if(r<.52)events.push({m,type:'offside',team,text:'Impedimento marcado.'});
    else if(r<.62)events.push({m,type:'foul',team,text:'Falta em zona perigosa.'});
    else events.push({m,type:'chance',team,text:`Boa chegada do ${team===0?homeName:awayName}.`});
  }
  [58,66,74].forEach((m,i)=>events.push({m,type:'sub',team:i%2,text:`Substituição feita pelo técnico do ${i%2===0?homeName:awayName}.`}));
  return events.sort((a,b)=>a.m-b.m);
}

export function showMatchViewer({app,club,fixture,result,coachName,onFinish}){
  const homeName=fixture.home?club.name:fixture.opponentName,awayName=fixture.home?fixture.opponentName:club.name;
  const userHome=fixture.home;const displayResult={home:userHome?result.gf:result.ga,away:userHome?result.ga:result.gf};
  const events=buildEvents({ ...result,gf:displayResult.home,ga:displayResult.away },homeName,awayName);
  app.innerHTML=`<section class="live-match"><header class="live-head"><button class="button ghost compact" id="leaveMatch">SIMULAR</button><div><span>${esc(fixture.competition)} • ${esc(fixture.round||'')}</span><strong><b id="homeScore">0</b> <em>–</em> <b id="awayScore">0</b></strong><small><i id="matchMinute">0</i>'</small></div><div class="speed-controls"><button data-speed="1" class="active">1x</button><button data-speed="2">2x</button><button data-speed="4">4x</button></div></header><div class="live-body"><div class="pitch-shell"><canvas id="matchCanvas"></canvas><div class="score-names"><span>${esc(homeName)}</span><span>${esc(awayName)}</span></div></div><aside class="live-panel"><div class="live-coach"><span>TÉCNICO</span><b>${esc(coachName)}</b><small>${esc(result.plan.reason)}</small></div><div class="live-stats"><div><span>Posse</span><b id="statPoss">50–50</b></div><div><span>Finalizações</span><b id="statShots">0–0</b></div><div><span>xG</span><b id="statXg">0.00–0.00</b></div><div><span>Cartões</span><b id="statCards">0–0</b></div><div><span>Substituições</span><b id="statSubs">0–0</b></div></div><h3>Comentários</h3><div id="commentary" class="commentary"><div><strong>0'</strong> — Começa a partida.</div></div></aside></div></section>`;
  const canvas=document.querySelector('#matchCanvas'),ctx=canvas.getContext('2d'),players=[...makePlayers(0),...makePlayers(1)],ball={x:50,y:50,tx:50,ty:50};
  let minuteNow=0,speed=1,last=performance.now(),acc=0,eventIndex=0,ended=false,score=[0,0],cards=[0,0],subs=[0,0];
  // 90 minutes in 150 real seconds at 1x: 2m30s.
  const msPerMinute=150000/90;
  function resize(){const dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  resize();addEventListener('resize',resize,{once:true});
  document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelector('#leaveMatch').onclick=()=>finish(true);
  function commentary(ev){const d=document.createElement('div');d.className=ev.type;d.innerHTML=`<strong>${ev.m}'</strong> — ${esc(ev.text)}`;const root=document.querySelector('#commentary');root.prepend(d);while(root.children.length>10)root.lastElementChild.remove();}
  function processEvents(){while(eventIndex<events.length&&events[eventIndex].m<=minuteNow){const e=events[eventIndex++];if(e.type==='goal'){score[e.team]++;document.querySelector('#homeScore').textContent=score[0];document.querySelector('#awayScore').textContent=score[1];flash('goal');}if(e.type==='card')cards[e.team]++;if(e.type==='sub')subs[e.team]++;commentary(e);ball.tx=e.team===0?80:20;ball.ty=15+Math.random()*70;}}
  function flash(cls){document.querySelector('.live-match').classList.add(cls);setTimeout(()=>document.querySelector('.live-match')?.classList.remove(cls),600)}
  function updateStats(){const p=Math.round(50+(result.possession-50)*(minuteNow/90));const hs=Math.round((userHome?result.shots:result.shotsAgainst)*minuteNow/90),as=Math.round((userHome?result.shotsAgainst:result.shots)*minuteNow/90);const hx=(userHome?result.xg:result.xga)*minuteNow/90,ax=(userHome?result.xga:result.xg)*minuteNow/90;document.querySelector('#statPoss').textContent=`${p}–${100-p}`;document.querySelector('#statShots').textContent=`${hs}–${as}`;document.querySelector('#statXg').textContent=`${hx.toFixed(2)}–${ax.toFixed(2)}`;document.querySelector('#statCards').textContent=`${cards[0]}–${cards[1]}`;document.querySelector('#statSubs').textContent=`${subs[0]}–${subs[1]}`;}
  function move(dt){for(const p of players){if(Math.hypot(p.tx-p.x,p.ty-p.y)<3||Math.random()<.012){const attacking=p.team===0?1:-1;p.tx=clamp(p.x+attacking*(4+Math.random()*18)+(Math.random()-.5)*10,4,96);p.ty=clamp(p.y+(Math.random()-.5)*30,5,95)}const dx=p.tx-p.x,dy=p.ty-p.y,l=Math.hypot(dx,dy)||1;p.x+=dx/l*p.speed*dt*.055;p.y+=dy/l*p.speed*dt*.055}if(Math.hypot(ball.tx-ball.x,ball.ty-ball.y)<2){const carrier=players[Math.floor(Math.random()*players.length)];ball.tx=carrier.x+(carrier.team===0?8:-8);ball.ty=carrier.y+(Math.random()-.5)*8}const dx=ball.tx-ball.x,dy=ball.ty-ball.y,l=Math.hypot(dx,dy)||1;ball.x+=dx/l*dt*.12;ball.y+=dy/l*dt*.12;}
  function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#17623d';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=2;ctx.strokeRect(16,16,w-32,h-32);ctx.beginPath();ctx.moveTo(w/2,16);ctx.lineTo(w/2,h-16);ctx.stroke();ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.13,0,Math.PI*2);ctx.stroke();ctx.strokeRect(16,h*.27,w*.13,h*.46);ctx.strokeRect(w-16-w*.13,h*.27,w*.13,h*.46);for(const p of players){ctx.beginPath();ctx.fillStyle=p.team===0?'#f3f6f9':'#ff4356';ctx.arc(p.x/100*w,p.y/100*h,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.5)';ctx.stroke()}ctx.beginPath();ctx.fillStyle='#fff';ctx.arc(ball.x/100*w,ball.y/100*h,3.2,0,Math.PI*2);ctx.fill();}
  function loop(t){if(ended)return;const dt=Math.min(40,t-last);last=t;acc+=dt*speed;while(acc>=msPerMinute){acc-=msPerMinute;minuteNow++;document.querySelector('#matchMinute').textContent=Math.min(90,minuteNow);processEvents();updateStats();if(minuteNow>=90){finish(false);return}}move(dt*speed);draw();requestAnimationFrame(loop)}
  function finish(skipped){if(ended)return;ended=true;score=[displayResult.home,displayResult.away];document.querySelector('#homeScore').textContent=score[0];document.querySelector('#awayScore').textContent=score[1];document.querySelector('#matchMinute').textContent=90;updateStats();setTimeout(()=>onFinish({skipped}),skipped?0:700)}
  requestAnimationFrame(loop);
}
