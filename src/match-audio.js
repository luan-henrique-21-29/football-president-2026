import {getPreferences,playUISound} from './preferences.js';
const KEY='gcp-match-audio-v1';
function read(){try{return{enabled:true,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return{enabled:true}}}
let state=typeof localStorage==='undefined'?{enabled:true}:read();
export function getMatchAudio(){return{...state}}
export function matchEffectsEnabled(){return getPreferences().sound!==false&&state.enabled!==false&&Number(getPreferences().volume||0)>0}
export function setMatchAudio(enabled){state.enabled=enabled===true||enabled==='true'||enabled==='1'||enabled==='on';try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}return getMatchAudio()}
export function playMatchEffect(kind){if(!matchEffectsEnabled())return;playUISound(kind)}
export function bindMatchAudioSettings(render){document.querySelectorAll('[data-match-audio]').forEach(el=>el.addEventListener('change',()=>{setMatchAudio(el.value);if(el.id==='matchSound')playMatchEffect('goal');render?.()}));document.querySelector('#matchSoundTest')?.addEventListener('click',()=>playMatchEffect('goal'))}
