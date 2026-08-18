import {showMatchViewer as baseViewer} from './match-viewer-v2.js';

function renderShootout(result){
 const root=document.querySelector('.cd-match-finished-card');
 if(!root||!result?.shootout||root.querySelector('.cd-shootout-result'))return false;
 const s=result.shootout,box=document.createElement('div');
 box.className='cd-shootout-result';
 box.innerHTML=`<span>PÊNALTIS</span><strong>${s.user}–${s.opponent}</strong><small>${s.winner==='USER'?'Seu clube venceu a disputa':'O adversário venceu a disputa'}</small>`;
 const tactics=root.querySelector('.cd-finish-tactics');
 root.insertBefore(box,tactics||root.querySelector('button'));
 return true;
}

export function showMatchViewer(args){
 baseViewer(args);
 if(!args?.result?.shootout)return;
 const observer=new MutationObserver(()=>{if(renderShootout(args.result))observer.disconnect()});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 renderShootout(args.result);
 setTimeout(()=>observer.disconnect(),180000);
}
