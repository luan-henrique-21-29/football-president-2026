const INDEX='football-president-2026-save-index';
const SLOT_PREFIX='football-president-2026-slot-';
const LEGACY='football-president-2026-save-v2';
const maxSlots=10;
const loadIndex=()=>{try{return JSON.parse(localStorage.getItem(INDEX))||[]}catch{return[]}};
const writeIndex=x=>localStorage.setItem(INDEX,JSON.stringify(x));
export function slots(){const idx=loadIndex();return Array.from({length:maxSlots},(_,i)=>{const id=i+1,meta=idx.find(x=>x.id===id);return meta||{id,empty:true};});}
export function saveToSlot(save,slot=1){if(slot<1||slot>maxSlots)throw new Error('Slot inválido');localStorage.setItem(`${SLOT_PREFIX}${slot}`,JSON.stringify(save));const idx=loadIndex().filter(x=>x.id!==slot);idx.push({id:slot,empty:false,club:save.clubName||save.clubSnapshot?.name||'Clube',president:save.president?.name||'Presidente',season:save.season||'',date:save.date||'',updatedAt:new Date().toISOString()});writeIndex(idx);localStorage.setItem(LEGACY,JSON.stringify(save));localStorage.setItem('football-president-2026-active-slot',String(slot));return slot;}
export function activeSlot(){const n=Number(localStorage.getItem('football-president-2026-active-slot')||1);return n>=1&&n<=maxSlots?n:1;}
export function loadSlot(slot=activeSlot()){try{return JSON.parse(localStorage.getItem(`${SLOT_PREFIX}${slot}`))}catch{return null}}
export function deleteSlot(slot){localStorage.removeItem(`${SLOT_PREFIX}${slot}`);writeIndex(loadIndex().filter(x=>x.id!==slot));if(activeSlot()===slot)localStorage.removeItem('football-president-2026-active-slot');}
export function switchSlot(slot){const save=loadSlot(slot);if(save)localStorage.setItem('football-president-2026-active-slot',String(slot));return save;}
export function importSaveObject(obj,slot=activeSlot()){if(!obj||typeof obj!=='object'||!obj.president||!obj.clubId)throw new Error('Arquivo de save inválido');saveToSlot(obj,slot);return obj;}
export function migrateLegacy(){if(loadSlot(activeSlot()))return loadSlot(activeSlot());try{const legacy=JSON.parse(localStorage.getItem(LEGACY));if(legacy?.clubId){saveToSlot(legacy,1);return legacy}}catch{}return null;}
