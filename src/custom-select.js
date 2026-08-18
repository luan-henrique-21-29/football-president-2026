let activeLayer=null;
const instances=new WeakMap();

function closeActive(){if(activeLayer){activeLayer.remove();activeLayer=null;}}
function selectedText(select){return select.selectedOptions?.[0]?.textContent?.trim()||select.options?.[select.selectedIndex]?.textContent?.trim()||'Selecionar';}
function sync(select){const ui=instances.get(select);if(!ui)return;ui.button.querySelector('span').textContent=selectedText(select);ui.button.classList.toggle('disabled',!!select.disabled);ui.button.disabled=!!select.disabled;}
function openMenu(select,button){
  if(select.disabled)return;
  closeActive();
  const layer=document.createElement('div');layer.className='cd-select-layer';
  const menu=document.createElement('div');menu.className='cd-select-menu';menu.setAttribute('role','listbox');
  [...select.options].forEach((option,index)=>{
    const item=document.createElement('button');item.type='button';item.className=`cd-select-option${index===select.selectedIndex?' selected':''}`;item.disabled=option.disabled;item.dataset.value=option.value;item.innerHTML=`<span>${option.textContent}</span>${index===select.selectedIndex?'<b>✓</b>':'<b></b>'}`;
    item.onclick=e=>{e.preventDefault();select.selectedIndex=index;sync(select);closeActive();select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));};
    menu.appendChild(item);
  });
  layer.appendChild(menu);document.body.appendChild(layer);activeLayer=layer;
  const rect=button.getBoundingClientRect(),margin=8,maxW=Math.min(420,window.innerWidth-24),width=Math.max(Math.min(rect.width,maxW),Math.min(210,maxW));
  menu.style.width=`${width}px`;menu.style.left=`${Math.max(12,Math.min(window.innerWidth-width-12,rect.left))}px`;
  const availableBelow=window.innerHeight-rect.bottom-14,availableAbove=rect.top-14,desired=Math.min(330,Math.max(150,menu.scrollHeight));
  if(availableBelow>=Math.min(desired,210)||availableBelow>=availableAbove){menu.style.top=`${Math.min(window.innerHeight-80,rect.bottom+margin)}px`;menu.style.maxHeight=`${Math.max(120,availableBelow)}px`;}else{menu.style.bottom=`${Math.max(12,window.innerHeight-rect.top+margin)}px`;menu.style.maxHeight=`${Math.max(120,availableAbove)}px`;}
  layer.onclick=e=>{if(e.target===layer)closeActive();};
  const chosen=menu.querySelector('.selected');chosen?.scrollIntoView({block:'nearest'});
}
function enhanceSelect(select){
  if(!select||select.multiple||instances.has(select))return;
  const host=document.createElement('div');host.className='cd-custom-select';
  const button=document.createElement('button');button.type='button';button.className='cd-select-trigger';button.setAttribute('aria-haspopup','listbox');button.innerHTML=`<span>${selectedText(select)}</span><i>⌄</i>`;
  select.insertAdjacentElement('afterend',host);host.appendChild(button);select.hidden=true;select.dataset.cdNativeHidden='true';
  instances.set(select,{host,button});sync(select);
  button.onclick=e=>{e.preventDefault();e.stopPropagation();openMenu(select,button)};
  select.addEventListener('change',()=>sync(select));
}
export function enhanceCustomSelects(root=document){
  if(root?.matches?.('select'))enhanceSelect(root);
  root?.querySelectorAll?.('select').forEach(enhanceSelect);
}
export function installCustomSelectUI(){
  if(window.__cdCustomSelectUI)return;window.__cdCustomSelectUI=true;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeActive()});
  window.addEventListener('resize',closeActive,{passive:true});
  window.addEventListener('scroll',e=>{if(activeLayer&&!e.target?.closest?.('.cd-select-menu'))closeActive()},{passive:true,capture:true});
  const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)enhanceCustomSelects(node)});observer.observe(document.body,{childList:true,subtree:true});
  enhanceCustomSelects(document);
}
