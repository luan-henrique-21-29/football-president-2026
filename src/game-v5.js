import * as core from './game-v4.js';
export * from './game-v4.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=str=>[...String(str)].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,2166136261)>>>0;
function rng(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}
export function knockoutShootout(result,fixture){
 if(!['CUP','CONTINENTAL','WORLD_CLUB'].includes(fixture.type)||result.gf!==result.ga)return null;
 const random=rng((result.matchSeed||hash(fixture.id))^0x85ebca6b),userSet=Number(result.coachProfile?.setPieceFocus||55),oppSet=Number(result.opponentCoachProfile?.setPieceFocus||55),ovrDiff=(Number(result.plan?.lineupOverall||70)-Number(result.opponentPlan?.lineupOverall||70)),userEdge=clamp((userSet-oppSet)*.0015+ovrDiff*.006,-.12,.12),userKicks=[],opponentKicks=[];let user=0,opponent=0;
 for(let i=0;i<5;i++){
   const userScored=random()<clamp(.73+userEdge,.57,.88),opponentScored=random()<clamp(.73-userEdge,.57,.88);userKicks.push(userScored);opponentKicks.push(opponentScored);if(userScored)user++;if(opponentScored)opponent++;
   const left=4-i;if(user>opponent+left||opponent>user+left)break;
 }
 let sudden=0;while(user===opponent&&sudden<6){const userScored=random()<clamp(.73+userEdge,.57,.88),opponentScored=random()<clamp(.73-userEdge,.57,.88);userKicks.push(userScored);opponentKicks.push(opponentScored);if(userScored)user++;if(opponentScored)opponent++;sudden++}
 if(user===opponent){const userWins=random()<.5;if(userWins){user++;userKicks.push(true);opponentKicks.push(false)}else{opponent++;userKicks.push(false);opponentKicks.push(true)}}
 return{user,opponent,winner:user>opponent?'USER':'OPPONENT',userKicks,opponentKicks};
}
export function simulateFixture(args){const result=core.simulateFixture(args);result.shootout=knockoutShootout(result,args.fixture);return result}
