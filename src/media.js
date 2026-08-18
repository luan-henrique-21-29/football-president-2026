const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

export function initials(name='?'){
  const parts=String(name).trim().split(/\s+/).filter(Boolean);
  return (parts.length>1?`${parts[0][0]}${parts.at(-1)[0]}`:parts[0]?.slice(0,2)||'?').toUpperCase();
}

export function playerPhoto(player,{size='md',className=''}={}){
  const src=player?.image||player?.imageUrl||player?.playerImage||'';
  const label=initials(player?.name);
  if(!src)return `<div class="fp-photo fp-photo-${size} ${className}" aria-label="${esc(player?.name||'Jogador')}"><span>${esc(label)}</span></div>`;
  return `<div class="fp-photo fp-photo-${size} ${className}"><img src="${esc(src)}" alt="${esc(player?.name||'Jogador')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('is-fallback');this.remove()"><span>${esc(label)}</span></div>`;
}

export function coachPhoto(coach,{size='lg'}={}){
  const src=coach?.image||coach?.imageUrl||'';
  const label=initials(coach?.name);
  if(!src)return `<div class="fp-photo fp-photo-${size} fp-coach-photo"><span>${esc(label)}</span></div>`;
  return `<div class="fp-photo fp-photo-${size} fp-coach-photo"><img src="${esc(src)}" alt="${esc(coach?.name||'Treinador')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('is-fallback');this.remove()"><span>${esc(label)}</span></div>`;
}
