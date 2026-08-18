let installed=false;
export function installButtonUX(){if(installed)return;installed=true;
 const pulse=button=>{button.classList.add('cd-button-pressed');setTimeout(()=>button.classList.remove('cd-button-pressed'),140)};
 document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.disabled)return;pulse(button)},true);
 document.addEventListener('click',async e=>{const button=e.target.closest('#fullscreen');if(!button)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();try{if(document.fullscreenElement)await document.exitFullscreen?.();else await document.documentElement.requestFullscreen?.()}catch{}},true);
 document.addEventListener('fullscreenchange',()=>{const b=document.querySelector('#fullscreen');if(b)b.textContent=document.fullscreenElement?'Sair da tela cheia':'Tela cheia'});
}
