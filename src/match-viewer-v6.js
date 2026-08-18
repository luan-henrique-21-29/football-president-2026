import {showMatchViewer as baseViewer} from './match-viewer-v5.js';
export function showMatchViewer(args){
 const original=args?.result||{},script=(original.possessionScript||[]).map(e=>e.outcome==='COMPLETE'?e:{...e,team:e.team==='USER'?'OPPONENT':'USER'}),result={...original,possessionScript:script};
 return baseViewer({...args,result});
}
