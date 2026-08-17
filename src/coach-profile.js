const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=str=>[...String(str||'coach')].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
function unit(seed,shift){let x=(seed+shift*2654435761)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967295}
export function coachGameplayProfile(coach={}){
 const name=coach.name||'Técnico';const seed=hash(name);const reputation=clamp(Number(coach.reputation||coach.rating||72),45,96);
 const profile={
  name,
  source:'GAMEPLAY_DERIVED',
  reputation,
  rotation:Math.round(35+unit(seed,1)*55),
  youthDevelopment:Math.round(35+unit(seed,2)*60),
  pressing:Math.round(35+unit(seed,3)*60),
  attackingRisk:Math.round(30+unit(seed,4)*65),
  pragmatism:Math.round(30+unit(seed,5)*65),
  adaptability:Math.round(35+unit(seed,6)*60),
  squadTrust:Math.round(40+unit(seed,7)*55)
 };
 profile.preferredFormation=formationFor(profile);
 profile.style=styleFor(profile);
 return profile;
}
function formationFor(p){if(p.attackingRisk>=75&&p.pressing>=65)return'4-3-3';if(p.pragmatism>=75)return'3-5-2';if(p.attackingRisk>=65)return'4-2-3-1';if(p.adaptability>=75)return'4-4-2';return'4-3-3'}
function styleFor(p){if(p.pressing>=78)return'Pressão intensa';if(p.attackingRisk>=78)return'Ofensivo';if(p.pragmatism>=78)return'Pragmático';if(p.youthDevelopment>=78)return'Desenvolvedor';if(p.rotation>=78)return'Gestor de elenco';return'Equilibrado'}
export function coachMatchModifiers(coach){const p=coachGameplayProfile(coach);return{rotationBias:(p.rotation-60)/100,attackBias:(p.attackingRisk-60)/80,pressBias:(p.pressing-60)/100,youthBias:(p.youthDevelopment-60)/100,adaptability:(p.adaptability-50)/100,profile:p}}
