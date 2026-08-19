import {showMatchViewer as baseViewer} from './match-viewer-v6.js';
export function showMatchViewer(args={}){const src=args.result||{},timeline=(src.timeline||[]).map(e=>e.type==='TACTIC'?{...e,type:'SUB',tacticalOnly:true,outId:'',inId:'',outName:'',inName:''}:e),result={...src,timeline};return baseViewer({...args,result})}
