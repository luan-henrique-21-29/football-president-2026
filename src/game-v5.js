import * as core from './game-v4.js';
export * from './game-v4.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=str=>[...String(str)].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,2166136261)>>>0;
function rng(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}
function shootout(result,fixture){
 if(!['CUP','CONTINENTAL','WORLD_CLUB'].includes(fixture.type)||result.gf!==result.ga)return null;
 const random=rng((result.matchSeed||hash(fixture.id))^0x85ebca6b),userSet=Number(result.coachProfile?.setPieceFocus||55),oppSet=Number(result.opponentCoachProfile?.setPieceFocus||55),ovrDiff=(Number(result.plan?.lineupOverall||70)-Number(result.opponentPlan?.lineupOverall||70)),userEdge=clamp((userSet-oppSet)*.0015+ovrDiff*.006,-.12,.12),userKicks=[],oppKicks=[];let u=0,o=0;
 for(let i=0;i<5;i++){
   const userScored=random()<clamp(.73+userEdge,.57,.88),oppScored=random()<clamp(.73-userEdge,.57,.88);userKicks.push(userScored);oppKicks.push(oppScored);if(userScored)u++;if(oppScored)o++;
   const left=4-i;if(u>o+left||o>u+left)break;
 }
 let sudden=0;while(u===o&&sudden<6){const userScored=random()<clamp(.73+userEdge,.57,.88),oppScored=random()<clamp(.73-userEdge,.57,.88);userKicks.push(userScored);oppKicks.push(oppScored);if(userScored)u++;if(oppScored)o++;sudden++}
 if(u===o){if(random()<.5)u++;else o++}
 return{user:u,opponent:o,winner:u>o?'USER':'OPPONENT',userKicks,opponentKicks};
}
export function simulateFixture(args){const result=core.simulateFixture(args);result.shootout=shootout(result,args.fixture);return result}
