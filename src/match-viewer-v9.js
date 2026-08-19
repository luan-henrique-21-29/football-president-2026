import {showMatchViewer as baseViewer} from './match-viewer-v8.js';
import {formationSlots,assignPlayersToFormation} from './lineup-state.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lastName=name=>String(name||'?').trim().split(/\s+/).at(-1)||'?';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

const knownKits=[
  ['corinthians',{primary:'#f4f4f1',secondary:'#171717',trim:'#171717'}],
  ['flamengo',{primary:'#c9162e',secondary:'#111111',trim:'#111111'}],
  ['palmeiras',{primary:'#1b6d3b',secondary:'#f3f1df',trim:'#f3f1df'}],
  ['sao paulo',{primary:'#f5f3ef',secondary:'#c3192d',trim:'#111111'}],
  ['santos',{primary:'#f5f5ef',secondary:'#111111',trim:'#111111'}],
  ['gremio',{primary:'#56a9db',secondary:'#111111',trim:'#f5f5ef'}],
  ['internacional',{primary:'#d62432',secondary:'#f5f5ef',trim:'#f5f5ef'}],
  ['arsenal',{primary:'#cf1f3a',secondary:'#f4f4f2',trim:'#f4f4f2'}],
  ['chelsea',{primary:'#1646b8',secondary:'#f2f2ef',trim:'#f2f2ef'}],
  ['liverpool',{primary:'#b91734',secondary:'#f4eee0',trim:'#f4eee0'}],
  ['manchester city',{primary:'#78b7dd',secondary:'#f2f2ee',trim:'#f2f2ee'}],
  ['manchester united',{primary:'#c91f2d',secondary:'#111111',trim:'#111111'}],
  ['real madrid',{primary:'#f1f1ed',secondary:'#c9a74b',trim:'#c9a74b'}],
  ['barcelona',{primary:'#304a9f',secondary:'#9d1737',trim:'#f2b63d'}],
  ['juventus',{primary:'#f2f2ed',secondary:'#111111',trim:'#111111'}],
  ['inter',{primary:'#173f99',secondary:'#111111',trim:'#111111'}],
  ['milan',{primary:'#b91f2b',secondary:'#111111',trim:'#111111'}],
  ['psg',{primary:'#183f78',secondary:'#d51f35',trim:'#f3f3ef'}]
];
const palettes=[
  {primary:'#d63b47',secondary:'#f5efe5',trim:'#f5efe5'},
  {primary:'#2770c7',secondary:'#f5f4ec',trim:'#f5f4ec'},
  {primary:'#7b3fb2',secondary:'#f2e9ff',trim:'#f2e9ff'},
  {primary:'#d78620',secondary:'#1e2430',trim:'#1e2430'},
  {primary:'#2c8f73',secondary:'#f3efe0',trim:'#f3efe0'},
  {primary:'#202733',secondary:'#f0f1ed',trim:'#f0f1ed'}
];
function hashName(name){let h=0;for(const c of String(name||''))h=(h*31+c.charCodeAt(0))>>>0;return h}
function kitFor(name,away=false){const n=normalize(name);const known=knownKits.find(([key])=>n.includes(key));if(known)return known[1];return palettes[(hashName(name)+(away?2:0))%palettes.length]}
function luminance(hex){const v=String(hex||'#000').replace('#','');if(v.length!==6)return 0;const [r,g,b]=[0,2,4].map(i=>parseInt(v.slice(i,i+2),16));return .2126*r+.7152*g+.0722*b}
function contrastingText(hex){return luminance(hex)>150?'#14202a':'#f7f8f4'}

function buildTeam(team,plan){
  const formation=plan?.preferredFormation||plan?.manualFormation||'4-3-3';
  const starters=plan?.starters||[];
  const slots=formationSlots(formation);
  const assigned=assignPlayersToFormation(starters,formation,starters.map(p=>String(p.id)));
  const byId=new Map(starters.map(p=>[String(p.id),p]));
  return slots.map(([key,slot,sx,sy],i)=>{
    const map=assigned.find(a=>a.key===key);
    const p=byId.get(String(map?.playerId||''))||starters[i]||{};
    const ax=team===0?100-sy:sy;
    return {team,id:String(p.id||`${team}-${key}`),name:p.name||slot,overall:Number(p.originalOverall||p.overall||plan?.lineupOverall||70),slot,ax,ay:sx,x:ax,y:sx,tx:ax,ty:sx};
  });
}
function move(o,x,y,amount){const dx=x-o.x,dy=y-o.y,d=Math.hypot(dx,dy);if(d<.01)return;const k=Math.min(1,amount/d);o.x+=dx*k;o.y+=dy*k}
function findPlayer(players,team,id,name){return players.find(p=>p.team===team&&String(p.id)===String(id))||players.find(p=>p.team===team&&p.name===name)||null}

function installStadiumPresentation({club,fixture,result}){
  const pitch=document.querySelector('.cd-v5-pitch');
  const baseCanvas=document.querySelector('#v5Canvas');
  const minuteEl=document.querySelector('#v5Minute');
  if(!pitch||!baseCanvas||!minuteEl||pitch.querySelector('#gcpStadiumCanvas'))return;

  baseCanvas.classList.add('gcp-base-canvas-hidden');
  pitch.classList.add('gcp-stadium-pitch');
  const canvas=document.createElement('canvas');
  canvas.id='gcpStadiumCanvas';
  canvas.className='gcp-stadium-canvas';
  pitch.appendChild(canvas);

  const hud=document.createElement('div');
  hud.className='gcp-ball-owner-hud';
  hud.innerHTML='<span>BOLA</span><b id="gcpBallOwner">—</b>';
  pitch.appendChild(hud);

  const caption=document.createElement('div');
  caption.className='gcp-stadium-caption';
  const stadium=fixture?.home?(club?.stadium||club?.stadiumName||'Estádio do clube'):(fixture?.stadium||fixture?.venue||'Estádio do adversário');
  caption.textContent=`${stadium} • ${fixture?.competition||'Partida'}`;
  pitch.appendChild(caption);

  const ctx=canvas.getContext('2d');
  const userTeam=fixture.home?0:1;
  const userPlan=result?.plan||{};
  const oppPlan=result?.opponentPlan||{};
  const homePlan=userTeam===0?userPlan:oppPlan;
  const awayPlan=userTeam===1?userPlan:oppPlan;
  const homeName=fixture.home?club.name:fixture.opponentName;
  const awayName=fixture.home?fixture.opponentName:club.name;
  let homeKit=kitFor(homeName,false),awayKit=kitFor(awayName,true);
  if(homeKit.primary===awayKit.primary)awayKit=palettes[(hashName(awayName)+3)%palettes.length];
  const players=[...buildTeam(0,homePlan),...buildTeam(1,awayPlan)];
  const scripts=[...(result?.possessionScript||[])].sort((a,b)=>Number(a.minute||0)-Number(b.minute||0));
  const timeline=[...(result?.timeline||[])].filter(e=>e.playerId||e.playerName).sort((a,b)=>Number(a.minute||0)-Number(b.minute||0));
  const crowd=Array.from({length:170},(_,i)=>({x:(hashName(`${homeName}-${i}`)%1000)/1000,y:(hashName(`${awayName}-${i*7}`)%1000)/1000,a:.34+((i*17)%60)/100}));
  let dpr=1,w=1,h=1,raf=0,lastFrame=performance.now(),lastOwnerKey='',transit=null;

  function resize(){dpr=Math.min(2,window.devicePixelRatio||1);w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  resize();
  const ro=new ResizeObserver(resize);ro.observe(pitch);
  function scriptSide(e){return e?.team==='USER'?userTeam:1-userTeam}
  function possessionForMinute(minute){
    let e=null;for(const item of scripts){if(Number(item.minute||0)<=minute)e=item;else break}
    if(!e){const p=players.find(x=>x.team===0&&x.slot!=='GK')||players[0];return p?{player:p,team:p.team}:null}
    const origin=scriptSide(e);let team=origin,id=e.passerId,name=e.passerName;
    if(e.outcome==='COMPLETE'){id=e.receiverId;name=e.receiverName}else if(e.outcome==='RECOVERED'){team=1-origin;id=e.winnerId;name=e.winnerName}
    let p=findPlayer(players,team,id,name);
    const recent=timeline.filter(t=>Number(t.minute||0)<=minute&&Number(t.minute||0)>=minute-.35).at(-1);
    if(recent?.team){const rt=scriptSide(recent),rp=findPlayer(players,rt,recent.playerId,recent.playerName);if(rp)p=rp}
    return p?{player:p,team:p.team}:null;
  }
  function stepPlayers(dt,owner){
    const poss=owner?.team??0;
    for(const p of players){const dir=p.team===0?1:-1,has=p.team===poss;let tx=p.ax,ty=p.ay;if(has)tx+=dir*(p.slot==='ST'||p.slot==='LW'||p.slot==='RW'?7:/M|DM|AM/.test(p.slot)?4:2);else tx-=dir*(/ST|LW|RW/.test(p.slot)?4:2.5);if(owner?.player){const d=Math.hypot(p.x-owner.player.x,p.y-owner.player.y);if(p.team!==poss&&d<24){tx+=(owner.player.x-p.x)*.16;ty+=(owner.player.y-p.y)*.14}}if(p===owner?.player){tx+=dir*4;ty+=Math.sin(performance.now()/480)*2.3}if(p.slot==='GK'){tx=p.ax;ty=clamp(50+(owner?.player?.y-50||0)*.08,40,60)}p.tx=clamp(tx,5,95);p.ty=clamp(ty,5,95);move(p,p.tx,p.ty,(7.4+p.overall/24)*dt)}
  }
  function pitchRect(){return {x:w*.065,y:h*.14,width:w*.87,height:h*.72}}
  function mapPoint(p){const r=pitchRect();return{x:r.x+p.x/100*r.width,y:r.y+p.y/100*r.height}}
  function drawStadium(){
    const r=pitchRect(),grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#071118');grad.addColorStop(.42,'#12242c');grad.addColorStop(1,'#061016');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#182b34';ctx.fillRect(r.x,7,r.width,r.y-13);ctx.fillRect(r.x,r.y+r.height+6,r.width,h-(r.y+r.height)-13);ctx.fillRect(7,r.y,Math.max(8,r.x-13),r.height);ctx.fillRect(r.x+r.width+6,r.y,Math.max(8,w-r.x-r.width-13),r.height);
    for(const c of crowd){const side=Math.floor(c.x*4),dot=1.15+(c.a*.9);ctx.globalAlpha=.34+c.a*.28;if(side===0){ctx.fillStyle=homeKit.primary;ctx.fillRect(r.x+c.x*r.width,12+c.y*(r.y-24),dot,dot)}else if(side===1){ctx.fillStyle=awayKit.primary;ctx.fillRect(r.x+c.x*r.width,r.y+r.height+11+c.y*Math.max(8,h-r.y-r.height-25),dot,dot)}else if(side===2){ctx.fillStyle='#dfe8ec';ctx.fillRect(12+c.x*Math.max(8,r.x-24),r.y+c.y*r.height,dot,dot)}else{ctx.fillStyle='#f0d27a';ctx.fillRect(r.x+r.width+11+c.x*Math.max(8,w-r.x-r.width-24),r.y+c.y*r.height,dot,dot)}}ctx.globalAlpha=1;
    const glow=ctx.createRadialGradient(w/2,h*.05,1,w/2,h*.05,w*.58);glow.addColorStop(0,'rgba(238,249,255,.28)');glow.addColorStop(1,'rgba(238,249,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h*.55);
  }
  function drawPitch(){
    const r=pitchRect();ctx.save();ctx.beginPath();ctx.roundRect(r.x,r.y,r.width,r.height,Math.min(16,r.width*.02));ctx.clip();ctx.fillStyle='#3d965a';ctx.fillRect(r.x,r.y,r.width,r.height);const stripe=r.width/10;for(let i=0;i<10;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.035)';ctx.fillRect(r.x+i*stripe,r.y,stripe,r.height)}const vignette=ctx.createRadialGradient(r.x+r.width/2,r.y+r.height/2,r.height*.08,r.x+r.width/2,r.y+r.height/2,r.width*.62);vignette.addColorStop(0,'rgba(255,255,255,.035)');vignette.addColorStop(1,'rgba(0,0,0,.14)');ctx.fillStyle=vignette;ctx.fillRect(r.x,r.y,r.width,r.height);ctx.strokeStyle='rgba(245,250,246,.92)';ctx.lineWidth=Math.max(1.2,w/620);ctx.strokeRect(r.x+6,r.y+6,r.width-12,r.height-12);ctx.beginPath();ctx.moveTo(r.x+r.width/2,r.y+6);ctx.lineTo(r.x+r.width/2,r.y+r.height-6);ctx.stroke();ctx.beginPath();ctx.arc(r.x+r.width/2,r.y+r.height/2,Math.min(r.width,r.height)*.115,0,Math.PI*2);ctx.stroke();const boxW=r.width*.16,boxH=r.height*.46,smallW=r.width*.065,smallH=r.height*.22;ctx.strokeRect(r.x+6,r.y+(r.height-boxH)/2,boxW,boxH);ctx.strokeRect(r.x+r.width-boxW-6,r.y+(r.height-boxH)/2,boxW,boxH);ctx.strokeRect(r.x+6,r.y+(r.height-smallH)/2,smallW,smallH);ctx.strokeRect(r.x+r.width-smallW-6,r.y+(r.height-smallH)/2,smallW,smallH);ctx.restore();ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=10;ctx.strokeRect(r.x-3,r.y-3,r.width+6,r.height+6);ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;ctx.strokeRect(r.x-1,r.y-1,r.width+2,r.height+2)
  }
  function shirtPath(x,y,s){ctx.beginPath();ctx.moveTo(x-s*.47,y-s*.42);ctx.lineTo(x-s*.9,y-s*.18);ctx.lineTo(x-s*.7,y+s*.18);ctx.lineTo(x-s*.46,y+s*.04);ctx.lineTo(x-s*.38,y+s*.62);ctx.lineTo(x+s*.38,y+s*.62);ctx.lineTo(x+s*.46,y+s*.04);ctx.lineTo(x+s*.7,y+s*.18);ctx.lineTo(x+s*.9,y-s*.18);ctx.lineTo(x+s*.47,y-s*.42);ctx.lineTo(x+s*.2,y-s*.55);ctx.lineTo(x-s*.2,y-s*.55);ctx.closePath()}
  function drawPlayer(p,kit,isOwner){
    const q=mapPoint(p),s=clamp(Math.min(w,h)*.018,9,15),primary=p.slot==='GK'?kit.secondary:kit.primary,trim=p.slot==='GK'?kit.primary:kit.trim;ctx.save();ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(q.x,q.y+s*.78,s*.78,s*.27,0,0,Math.PI*2);ctx.fill();if(isOwner){ctx.shadowColor='#ffe38a';ctx.shadowBlur=18;ctx.strokeStyle='rgba(255,228,133,.96)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(q.x,q.y,s*1.18,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0}shirtPath(q.x,q.y,s);ctx.fillStyle=primary;ctx.fill();ctx.strokeStyle=trim;ctx.lineWidth=1.6;ctx.stroke();ctx.fillStyle=contrastingText(primary);ctx.font=`800 ${Math.max(7,s*.55)}px Inter, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(Math.round(p.overall)),q.x,q.y+s*.08);ctx.font=`800 ${Math.max(8,s*.62)}px Inter, sans-serif`;ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.58)';ctx.fillStyle='#f7faf7';ctx.strokeText(lastName(p.name),q.x,q.y+s*1.55);ctx.fillText(lastName(p.name),q.x,q.y+s*1.55);if(isOwner){const label=String(p.name||'Com a bola');ctx.font=`800 ${Math.max(9,s*.7)}px Inter, sans-serif`;const tw=ctx.measureText(label).width+16,lh=Math.max(20,s*1.55),ly=q.y-s*2.1;ctx.fillStyle='rgba(8,18,24,.9)';ctx.strokeStyle='rgba(255,231,150,.65)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(q.x-tw/2,ly-lh/2,tw,lh,8);ctx.fill();ctx.stroke();ctx.fillStyle='#fff3bd';ctx.textBaseline='middle';ctx.fillText(label,q.x,ly)}ctx.restore()
  }
  function drawBall(owner,now){
    if(!owner?.player)return;const key=`${owner.player.team}-${owner.player.id}`;if(key!==lastOwnerKey){const previous=players.find(p=>`${p.team}-${p.id}`===lastOwnerKey);transit=previous?{from:{...mapPoint(previous)},start:now}:null;lastOwnerKey=key}const target=mapPoint(owner.player);let pos=target;if(transit){const t=clamp((now-transit.start)/320,0,1);pos={x:transit.from.x+(target.x-transit.from.x)*t,y:transit.from.y+(target.y-transit.from.y)*t};if(t>=1)transit=null}const rr=clamp(Math.min(w,h)*.006,3.6,5.5);ctx.save();ctx.shadowColor='rgba(255,255,255,.65)';ctx.shadowBlur=7;ctx.fillStyle='#f8f6ed';ctx.strokeStyle='#14232c';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(pos.x,pos.y+rr*.5,rr,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#202933';ctx.beginPath();ctx.arc(pos.x-rr*.2,pos.y,rr*.22,0,Math.PI*2);ctx.fill();ctx.restore()
  }
  function frame(now){const dt=Math.min(.045,(now-lastFrame)/1000||0);lastFrame=now;const minute=Number(minuteEl.textContent||0),owner=possessionForMinute(minute);stepPlayers(dt,owner);ctx.clearRect(0,0,w,h);drawStadium();drawPitch();for(const p of players.filter(p=>p.team===0))drawPlayer(p,homeKit,p===owner?.player);for(const p of players.filter(p=>p.team===1))drawPlayer(p,awayKit,p===owner?.player);drawBall(owner,now);const ownerEl=document.querySelector('#gcpBallOwner');if(ownerEl)ownerEl.textContent=owner?.player?.name||'Bola dividida';raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  const observer=new MutationObserver(()=>{if(!document.body.contains(pitch)){cancelAnimationFrame(raf);ro.disconnect();observer.disconnect()}});observer.observe(document.body,{childList:true,subtree:true});
}

export function showMatchViewer(args={}){const out=baseViewer(args);installStadiumPresentation(args);return out}
