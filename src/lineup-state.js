const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const FORMATIONS={
 '4-3-3':[
  ['GK','GK',50,90],['LB','LB',16,72],['LCB','CB',38,74],['RCB','CB',62,74],['RB','RB',84,72],
  ['LCM','CM',28,49],['CM','CM',50,53],['RCM','CM',72,49],
  ['LW','LW',20,21],['ST','ST',50,15],['RW','RW',80,21]
 ],
 '4-2-3-1':[
  ['GK','GK',50,90],['LB','LB',16,72],['LCB','CB',38,74],['RCB','CB',62,74],['RB','RB',84,72],
  ['LDM','DM',38,53],['RDM','DM',62,53],['LW','LW',20,31],['CAM','AM',50,34],['RW','RW',80,31],['ST','ST',50,14]
 ],
 '4-4-2':[
  ['GK','GK',50,90],['LB','LB',16,72],['LCB','CB',38,74],['RCB','CB',62,74],['RB','RB',84,72],
  ['LM','LM',16,46],['LCM','CM',39,50],['RCM','CM',61,50],['RM','RM',84,46],['LST','ST',38,19],['RST','ST',62,19]
 ],
 '4-1-4-1':[
  ['GK','GK',50,90],['LB','LB',16,72],['LCB','CB',38,74],['RCB','CB',62,74],['RB','RB',84,72],
  ['DM','DM',50,58],['LM','LM',16,41],['LCM','CM',39,43],['RCM','CM',61,43],['RM','RM',84,41],['ST','ST',50,15]
 ],
 '3-4-2-1':[
  ['GK','GK',50,90],['LCB','CB',25,72],['CB','CB',50,76],['RCB','CB',75,72],
  ['LWB','LWB',12,49],['LCM','CM',38,52],['RCM','CM',62,52],['RWB','RWB',88,49],
  ['LAM','AM',36,30],['RAM','AM',64,30],['ST','ST',50,14]
 ],
 '3-5-2':[
  ['GK','GK',50,90],['LCB','CB',25,72],['CB','CB',50,76],['RCB','CB',75,72],
  ['LWB','LWB',11,48],['LCM','CM',32,51],['DM','DM',50,57],['RCM','CM',68,51],['RWB','RWB',89,48],
  ['LST','ST',38,19],['RST','ST',62,19]
 ],
 '4-3-1-2':[
  ['GK','GK',50,90],['LB','LB',16,72],['LCB','CB',38,74],['RCB','CB',62,74],['RB','RB',84,72],
  ['LCM','CM',28,52],['DM','DM',50,57],['RCM','CM',72,52],['CAM','AM',50,34],['LST','ST',38,18],['RST','ST',62,18]
 ],
 '5-3-2':[
  ['GK','GK',50,90],['LWB','LWB',10,62],['LCB','CB',29,73],['CB','CB',50,77],['RCB','CB',71,73],['RWB','RWB',90,62],
  ['LCM','CM',31,48],['DM','DM',50,54],['RCM','CM',69,48],['LST','ST',38,18],['RST','ST',62,18]
 ]
};

export const FORMATION_NAMES=Object.keys(FORMATIONS);
export function formationSlots(name='4-3-3'){return FORMATIONS[name]||FORMATIONS['4-3-3']}
export function slotGroup(slot='CM'){if(slot==='GK')return'GK';if(['LB','RB','CB','LWB','RWB'].includes(slot))return'DEF';if(['DM','CM','AM','LM','RM'].includes(slot))return'MID';return'ATT'}

function text(p){return `${p?.position||''} ${p?.subPosition||''} ${(p?.secondaryPositions||[]).join?.(' ')||''}`.toLowerCase()}
const hasLeft=s=>/left[- ]back|left wing[- ]back|left[- ]mid|left winger|left forward|lateral esquerdo|ponta esquerda/.test(s);
const hasRight=s=>/right[- ]back|right wing[- ]back|right[- ]mid|right winger|right forward|lateral direito|ponta direita/.test(s);
export function playerRole(player){const s=text(player);if(/goal|keeper|goleiro/.test(s))return'GK';if(/centre[- ]back|center[- ]back|central defender|defen|left[- ]back|right[- ]back|full[- ]back|wing[- ]back|zague|lateral/.test(s))return'DEF';if(/midfield|meia|volante|medio/.test(s))return'MID';return'ATT'}

export function positionFit(player,slot){
 const s=text(player),g=slotGroup(slot),pg=playerRole(player);
 if(slot==='GK')return pg==='GK'?1:.35;
 if(pg==='GK')return .35;
 const tests={
  CB:/centre[- ]back|center[- ]back|central defender|zague/,
  LB:/left[- ]back|full[- ]back left|lateral esquerdo/,
  RB:/right[- ]back|full[- ]back right|lateral direito/,
  LWB:/left wing[- ]back|left[- ]back|lateral esquerdo/,
  RWB:/right wing[- ]back|right[- ]back|lateral direito/,
  DM:/defensive midfield|holding midfield|volante|defensive midfielder/,
  CM:/central midfield|central midfielder|midfield|meia central|medio centro/,
  AM:/attacking midfield|attacking midfielder|meia ofensivo|number 10|trequartista/,
  LM:/left midfield|left midfielder|left winger|ponta esquerda/,
  RM:/right midfield|right midfielder|right winger|ponta direita/,
  LW:/left winger|left forward|ponta esquerda/,
  RW:/right winger|right forward|ponta direita/,
  ST:/centre[- ]forward|center[- ]forward|striker|second striker|atacante central|centroavante/
 };
 if(tests[slot]?.test(s)){
  if(['LB','LWB','LM','LW'].includes(slot)&&hasRight(s)&&!hasLeft(s))return .72;
  if(['RB','RWB','RM','RW'].includes(slot)&&hasLeft(s)&&!hasRight(s))return .72;
  return 1;
 }
 if(['LB','LWB','LM','LW'].includes(slot)&&hasRight(s)&&!hasLeft(s))return .68;
 if(['RB','RWB','RM','RW'].includes(slot)&&hasLeft(s)&&!hasRight(s))return .68;
 if((slot==='LWB'&&tests.LB.test(s))||(slot==='RWB'&&tests.RB.test(s)))return .97;
 if((slot==='LW'||slot==='LM')&&/left[- ]back|left wing[- ]back/.test(s))return .86;
 if((slot==='RW'||slot==='RM')&&/right[- ]back|right wing[- ]back/.test(s))return .86;
 if(slot==='CB'&&pg==='DEF')return .88;
 if((slot==='LB'||slot==='RB')&&pg==='DEF')return .86;
 if((slot==='AM'||slot==='CM'||slot==='DM')&&pg==='MID')return .93;
 if((slot==='LW'||slot==='RW')&&pg==='ATT')return .89;
 if(slot==='ST'&&pg==='ATT')return .90;
 if(g===pg)return .84;
 if((g==='ATT'&&pg==='MID')||(g==='MID'&&pg==='ATT')||(g==='MID'&&pg==='DEF'))return .76;
 return .62;
}

export function fitLabel(fit){return fit>=.98?'Natural':fit>=.92?'Compatível':fit>=.82?'Adaptado':'Fora de posição'}
export function effectiveOverall(player,slot){const base=Number(player?.overall||65),fit=positionFit(player,slot),penalty=Math.round((1-fit)*42);return clamp(base-penalty,35,99)}

export function lineupSlotScore(player,slot,{rotation=0}={}){
 const fit=positionFit(player,slot),ovr=Number(player?.overall||65),form=Number(player?.form??70),energy=Number(player?.energy??100),rawPriority=Number(player?.starterPriority||0),starter=Math.min(8,rawPriority*.12+(player?.realLifeStarter?3:0)),natural=fit>=.98?300:fit>=.92?110:fit>=.84?-40:-280;
 return fit*200+natural+ovr*20+form*.025+energy*(.008+Math.max(0,rotation)*.012)+starter;
}
function scoreForSlot(player,slot){return lineupSlotScore(player,slot)}
export function assignPlayersToFormation(players,formation='4-3-3',preferredIds=[],options={}){
 const slots=formationSlots(formation),pool=(players||[]).filter(Boolean),preferred=new Map(preferredIds.map((id,i)=>[String(id),preferredIds.length-i])),used=new Set(),out=[];
 for(const [key,slot] of slots){
  const candidates=pool.filter(p=>!used.has(String(p.id))).sort((a,b)=>(lineupSlotScore(b,slot,options)+(preferred.get(String(b.id))||0)*.02)-(lineupSlotScore(a,slot,options)+(preferred.get(String(a.id))||0)*.02));
  const p=candidates[0]||null;if(p)used.add(String(p.id));out.push({key,slot,playerId:p?String(p.id):null});
 }
 return out;
}

export function createPresidentLineup(plan,players,formation){
 const chosen=FORMATION_NAMES.includes(formation)?formation:(FORMATION_NAMES.includes(plan?.preferredFormation)?plan.preferredFormation:'4-3-3'),preferred=(plan?.starters||[]).map(p=>String(p.id));
 return{enabled:true,formation:chosen,slots:assignPlayersToFormation(players,chosen,preferred),updatedAt:new Date().toISOString(),source:'PRESIDENT'};
}

export function remapPresidentLineup(override,players,formation){
 const currentIds=(override?.slots||[]).map(s=>s.playerId).filter(Boolean),slots=assignPlayersToFormation(players,formation,currentIds);
 return{...(override||{}),enabled:true,formation,slots,updatedAt:new Date().toISOString(),source:'PRESIDENT'};
}

export function lineupSignature(override){return `${override?.formation||''}|${(override?.slots||[]).map(s=>`${s.key}:${s.playerId||''}`).join('|')}`}

export function applyPresidentLineup(autoPlan,availablePlayers,override){
 if(!override?.enabled)return null;
 const formation=FORMATION_NAMES.includes(override.formation)?override.formation:'4-3-3',slots=formationSlots(formation),pool=(availablePlayers||[]).filter(Boolean),byId=new Map(pool.map(p=>[String(p.id),p])),stored=new Map((override.slots||[]).map(s=>[s.key,String(s.playerId||'')])),used=new Set(),starters=[],emergencyChanges=[];
 for(const [key,slot] of slots){
  const wanted=stored.get(key),requested=wanted?byId.get(wanted):null;let p=requested&&!used.has(String(requested.id))?requested:null;
  if(!p){const candidates=pool.filter(x=>!used.has(String(x.id))).sort((a,b)=>scoreForSlot(b,slot)-scoreForSlot(a,slot));p=candidates[0]||null;if(wanted&&p)emergencyChanges.push({slot,requestedId:wanted,replacementId:String(p.id),replacementName:p.name})}
  if(!p)continue;used.add(String(p.id));const fit=positionFit(p,slot),effective=effectiveOverall(p,slot);starters.push({...p,originalOverall:p.overall,overall:effective,assignedSlot:slot,slotKey:key,positionFit:fit,positionFitLabel:fitLabel(fit)});
 }
 if(starters.length<11)return null;
 const bench=pool.filter(p=>!used.has(String(p.id))).sort((a,b)=>(b.overall||0)-(a.overall||0)).slice(0,12).map(p=>({...p})),lineupOverall=Math.round(starters.reduce((s,p)=>s+(p.overall||65),0)/11),fitAverage=starters.reduce((s,p)=>s+(p.positionFit||1),0)/11;
 return{...(autoPlan||{}),starters,bench,lineupOverall,fitAverage,rotation:0,preferredFormation:formation,manualFormation:formation,presidentOverride:true,reason:emergencyChanges.length?`Intervenção da presidência em ${formation}. ${emergencyChanges.length} ajuste(s) automático(s) por indisponibilidade.`:`Intervenção da presidência: escalação manual em ${formation}.`,emergencyChanges};
}
