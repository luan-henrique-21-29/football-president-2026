let lastActionTarget = null;
let approvedTarget = null;
let activeDialog = null;

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

function dialogMeta(message) {
  const text = String(message || '');
  if (/^Contratar\b/i.test(text)) return { eyebrow:'COMANDO TÉCNICO', title:'Contratar treinador', tone:'positive', confirm:'Confirmar contratação' };
  if (/^Demitir\b/i.test(text)) return { eyebrow:'COMANDO TÉCNICO', title:'Demitir treinador', tone:'danger', confirm:'Confirmar demissão' };
  if (/^Proposta de\b/i.test(text)) return { eyebrow:'MERCADO', title:'Proposta recebida', tone:'positive', confirm:'Aceitar proposta' };
  if (/^Emprestar\b/i.test(text)) return { eyebrow:'MERCADO', title:'Empréstimo', tone:'neutral', confirm:'Confirmar empréstimo' };
  if (/^Fechar\b/i.test(text)) return { eyebrow:'MERCADO', title:'Fechar contratação', tone:'positive', confirm:'Fechar negócio' };
  if (/^Apagar\b/i.test(text)) return { eyebrow:'CARREIRA', title:'Confirmar exclusão', tone:'danger', confirm:'Apagar' };
  if (/^Conversar\b/i.test(text)) return { eyebrow:'CARREIRA', title:'Abrir conversa', tone:'neutral', confirm:'Conversar' };
  return { eyebrow:'DECISÃO DO PRESIDENTE', title:'Confirmar decisão', tone:'neutral', confirm:'Confirmar' };
}

function ensureToastStack() {
  let stack = document.querySelector('.fp-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'fp-toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

export function showNotice(message, { title = 'Football President', tone = 'info', duration = 3200 } = {}) {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `fp-toast fp-toast-${tone}`;
  toast.innerHTML = `<div class="fp-toast-mark">FP</div><div><b>${esc(title)}</b><span>${esc(message)}</span></div>`;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 220);
  }, duration);
}

export function showDecision(message) {
  if (activeDialog) activeDialog(false);
  const meta = dialogMeta(message);
  return new Promise(resolve => {
    const layer = document.createElement('div');
    layer.className = 'fp-decision-layer';
    layer.innerHTML = `
      <div class="fp-decision-card ${meta.tone === 'danger' ? 'is-danger' : ''}" role="dialog" aria-modal="true" aria-labelledby="fpDecisionTitle">
        <div class="fp-decision-accent"></div>
        <div class="fp-decision-head">
          <div class="fp-decision-badge">FP</div>
          <div>
            <span class="fp-decision-eyebrow">${esc(meta.eyebrow)}</span>
            <h2 id="fpDecisionTitle">${esc(meta.title)}</h2>
          </div>
        </div>
        <div class="fp-decision-body">
          <p>${esc(message)}</p>
          <span>Esta decisão será registrada na sua carreira.</span>
        </div>
        <div class="fp-decision-actions">
          <button type="button" class="fp-decision-cancel">Voltar</button>
          <button type="button" class="fp-decision-confirm ${meta.tone === 'danger' ? 'danger' : ''}">${esc(meta.confirm)}</button>
        </div>
      </div>`;
    document.body.appendChild(layer);
    const finish = value => {
      if (!layer.isConnected) return;
      layer.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      activeDialog = null;
      window.setTimeout(() => layer.remove(), 160);
      resolve(value);
    };
    activeDialog = finish;
    const onKey = event => { if (event.key === 'Escape') finish(false); };
    document.addEventListener('keydown', onKey);
    layer.querySelector('.fp-decision-cancel').onclick = () => finish(false);
    layer.querySelector('.fp-decision-confirm').onclick = () => finish(true);
    layer.addEventListener('click', event => { if (event.target === layer) finish(false); });
    requestAnimationFrame(() => {
      layer.classList.add('open');
      layer.querySelector('.fp-decision-confirm')?.focus({ preventScroll:true });
    });
  });
}

export function installDecisionUI() {
  if (window.__footballPresidentDecisionUI) return;
  window.__footballPresidentDecisionUI = true;

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('button,a,[role="button"],input[type="button"],input[type="submit"],[data-hire-coach],[data-job-club],[data-delete-slot]');
    if (target && !target.closest('.fp-decision-layer') && !target.closest('.fp-toast-stack')) lastActionTarget = target;
  }, true);

  window.alert = message => showNotice(String(message || ''));

  window.confirm = message => {
    const target = lastActionTarget;
    if (approvedTarget && target === approvedTarget) {
      approvedTarget = null;
      return true;
    }

    showDecision(String(message || 'Confirmar decisão?')).then(ok => {
      if (!ok || !target?.isConnected) return;
      approvedTarget = target;
      target.click();
    });
    return false;
  };
}
