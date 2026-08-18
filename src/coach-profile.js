const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=str=>[...String(str||'coach')].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
function unit(seed,shift){let x=(seed+shift*2654435761)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967295}
const pick=(arr,n)=>arr[Math.min(arr.length-1,Math.max(0,Math.floor(n*arr.length)))];
const formations=['4-3-3','4-2-3-1','4-4-2','4-1-4-1','3-4-2-1','3-5-2','4-3-1-2','5-3-2'];
const formationShape={
 '4-3-3':{GK:1,DEF:4,MID:3,ATT:3},'4-2-3-1':{GK:1,DEF:4,MID:5,ATT:1},'4-4-2':{GK:1,DEF:4,MID:4,ATT:2},'4-1-4-1':{GK:1,DEF:4,MID:5,ATT:1},
 '3-4-2-1':{GK:1,DEF:3,MID:6,ATT:1},'3-5-2':{GK:1,DEF:3,MID:5,ATT:2},'4-3-1-2':{GK:1,DEF:4,MID:4,ATT:2},'5-3-2':{GK:1,DEF:5,MID:3,ATT:2}
};
export function coachGameplayProfile(coach={}){
 const name=coach.name||'Técnico';const seed=hash(name);const reputation=clamp(Number(coach.reputation||coach.rating||72),45,96);
 const profile={
  name,source:'GAMEPLAY_DERIVED',reputation,
  rotation:Math.round(32+unit(seed,1)*63),youthDevelopment:Math.round(32+unit(seed,2)*63),pressing:Math.round(30+unit(seed,3)*68),attackingRisk:Math.round(28+unit(seed,4)*68),pragmatism:Math.round(28+unit(seed,5)*68),adaptability:Math.round(35+unit(seed,6)*60),squadTrust:Math.round(38+unit(seed,7)*57),
  tempo:Math.round(35+unit(seed,8)*60),directness:Math.round(28+unit(seed,9)*68),width:Math.round(32+unit(seed,10)*64),defensiveLine:Math.round(30+unit(seed,11)*68),possessionBias:Math.round(30+unit(seed,12)*67),counterAttack:Math.round(30+unit(seed,13)*67),setPieceFocus:Math.round(35+unit(seed,14)*60),markingAggression:Math.round(30+unit(seed,15)*67)
 };
 profile.preferredFormation=formationFor(profile,seed);
 profile.shape=formationShape[profile.preferredFormation]||formationShape['4-3-3'];
 profile.style=styleFor(profile);
 profile.buildUp=profile.possessionBias>=70?'Saída curta':profile.directness>=72?'Construção direta':'Construção mista';
 profile.pressLabel=profile.pressing>=78?'Pressão muito alta':profile.pressing>=64?'Pressão alta':profile.pressing>=48?'Pressão média':'Bloco baixo';
 profile.lineLabel=profile.defensiveLine>=78?'Linha muito alta':profile.defensiveLine>=63?'Linha alta':profile.defensiveLine>=46?'Linha média':'Linha baixa';
 profile.widthLabel=profile.width>=70?'Campo largo':profile.width<=44?'Jogo estreito':'Largura equilibrada';
 profile.tempoLabel=profile.tempo>=72?'Ritmo alto':profile.tempo<=45?'Ritmo paciente':'Ritmo equilibrado';
 profile.transitionLabel=profile.counterAttack>=72?'Contra-ataque vertical':profile.possessionBias>=70?'Reorganizar e manter posse':'Transição equilibrada';
 profile.offsideTrap=profile.defensiveLine>=70&&profile.pressing>=62;
 profile.notes=tacticalNotes(profile);
 return profile;
}
function formationFor(p,seed){
 if(p.pragmatism>=82)return p.defensiveLine<50?'5-3-2':'3-5-2';
 if(p.attackingRisk>=80&&p.width>=60)return'4-3-3';
 if(p.possessionBias>=76&&p.pressing>=62)return'4-1-4-1';
 if(p.counterAttack>=76&&p.directness>=65)return'4-2-3-1';
 if(p.attackingRisk>=70&&p.width<50)return'4-3-1-2';
 if(p.adaptability>=78)return pick(formations,unit(seed,20));
 return unit(seed,21)>.52?'4-2-3-1':'4-3-3';
}
function styleFor(p){if(p.pressing>=80&&p.attackingRisk>=68)return'Pressão e agressividade';if(p.possessionBias>=78)return'Posse e controle';if(p.counterAttack>=78)return'Transição rápida';if(p.pragmatism>=80)return'Pragmático';if(p.youthDevelopment>=80)return'Desenvolvedor';if(p.rotation>=82)return'Gestor de elenco';if(p.attackingRisk>=80)return'Ofensivo';return'Equilibrado'}
function tacticalNotes(p){const out=[];if(p.pressing>=72)out.push('quer recuperar a bola cedo');if(p.possessionBias>=72)out.push('prefere controlar o jogo com posse');if(p.directness>=72)out.push('aceita acelerar com passes verticais');if(p.rotation>=75)out.push('faz rodízio com frequência');if(p.youthDevelopment>=75)out.push('confia em jovens de alto potencial');if(p.pragmatism>=75)out.push('protege vantagem e contexto do calendário');return out.slice(0,3)}
export function coachMatchModifiers(coach){const p=coachGameplayProfile(coach);return{rotationBias:(p.rotation-60)/100,attackBias:(p.attackingRisk-60)/80,pressBias:(p.pressing-60)/100,youthBias:(p.youthDevelopment-60)/100,adaptability:(p.adaptability-50)/100,tempoBias:(p.tempo-55)/100,possessionBias:(p.possessionBias-55)/100,directBias:(p.directness-55)/100,lineRisk:(p.defensiveLine-55)/100,profile:p}}
export function coachShape(coach){return coachGameplayProfile(coach).shape}
