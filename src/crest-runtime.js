import {clubCrestUrl} from './club-assets.js';
const sporting=clubCrestUrl({id:'336',name:'Sporting CP',country:'Portugal'});
function isSporting(img){const src=String(img?.getAttribute?.('src')||''),alt=String(img?.getAttribute?.('alt')||'').toLowerCase();return /\/336\.(png|webp|jpg|jpeg)(\?|$)/i.test(src)||alt.includes('sporting cp')||alt.includes('sporting clube de portugal')}
function scan(root){for(const img of root?.querySelectorAll?.('img')||[]){if(isSporting(img)&&img.src!==sporting){img.src=sporting;img.referrerPolicy='no-referrer';img.dataset.crestVersion='2026'}}}
export function installCrestRuntime(root=document){scan(root);if(typeof MutationObserver==='undefined')return;new MutationObserver(()=>scan(root)).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['src','alt']})}
