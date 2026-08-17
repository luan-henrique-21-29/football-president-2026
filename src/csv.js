export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map((h, i) => (i === 0 ? h.replace(/^\uFEFF/, '') : h));
  return rows.filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

export async function fetchText(url, { gzip = false } = {}) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Falha ao carregar ${url}: ${response.status}`);
  if (!gzip) return response.text();

  const contentEncoding = response.headers.get('content-encoding') || '';
  if (contentEncoding.toLowerCase().includes('gzip')) return response.text();

  if ('DecompressionStream' in window && response.body) {
    const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  throw new Error('Seu navegador não oferece descompactação gzip. Use uma versão recente do Chrome.');
}

export async function fetchCSV(url, options) {
  return parseCSV(await fetchText(url, options));
}
