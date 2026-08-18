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

const COMPETITIONS = {
  GB1:['Premier League','England'],GB2:['EFL Championship','England'],GB3:['League One','England'],GB4:['League Two','England'],
  ES1:['LaLiga','Spain'],ES2:['Segunda División','Spain'],
  IT1:['Serie A','Italy'],IT2:['Serie B','Italy'],
  FR1:['Ligue 1','France'],FR2:['Ligue 2','France'],
  L1:['Bundesliga','Germany'],L2:['2. Bundesliga','Germany'],
  PO1:['Liga Portugal','Portugal'],NL1:['Eredivisie','Netherlands'],BE1:['Jupiler Pro League','Belgium'],
  BRA1:['Campeonato Brasileiro Série A','Brazil'],BRA2:['Campeonato Brasileiro Série B','Brazil'],
  ARG1:['Liga Profesional','Argentina'],
  SA1:['Saudi Pro League','Saudi Arabia'],
  MLS1:['Major League Soccer','United States'],US1:['Major League Soccer','United States'],
  TR1:['Süper Lig','Turkey'],RU1:['Premier Liga','Russia'],GR1:['Super League 1','Greece'],
  SC1:['Scottish Premiership','Scotland'],DK1:['Superliga','Denmark'],SE1:['Allsvenskan','Sweden'],NO1:['Eliteserien','Norway'],
  UKR1:['Premier Liga','Ukraine'],C1:['Super League','Switzerland'],A1:['Bundesliga','Austria']
};

async function localJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Falha ao carregar ${path}: ${response.status}`);
  return response.json();
}

async function localDataset(url) {
  const target = String(url || '');
  if (target.endsWith('/players.csv.gz')) {
    const data = await localJson('./data/players.json');
    return (data.players || []).map(p => ({
      player_id:p.id,
      name:p.name,
      first_name:p.firstName || '',
      last_name:p.lastName || '',
      current_club_id:p.clubId,
      current_club_name:p.club,
      current_club_domestic_competition_id:p.competitionId || '',
      country_of_citizenship:p.nationality || '',
      date_of_birth:p.birthDate || '',
      position:p.position || '',
      sub_position:p.subPosition || '',
      foot:p.foot || '',
      height_in_cm:p.height || 0,
      market_value_in_eur:p.value || 0,
      highest_market_value_in_eur:p.highestValue || 0,
      contract_expiration_date:p.contractUntil || '',
      image_url:p.imageUrl || '',
      last_season:2026
    }));
  }

  if (target.endsWith('/clubs.csv.gz')) {
    const data = await localJson('./data/clubs-world.json');
    return (data.clubs || []).map(c => {
      const meta = COMPETITIONS[c.competitionId] || [c.competitionId || 'Liga não informada',''];
      return {
        club_id:c.id,
        name:c.name,
        domestic_competition_id:c.competitionId || '',
        competition_name:meta[0],
        country_name:meta[1],
        squad_size:c.squadSize || 0,
        average_age:c.averageAge || '',
        stadium_name:c.stadium || '',
        stadium_seats:c.stadiumSeats || 0,
        coach_name:c.coach || '',
        total_market_value:c.totalMarketValue || 0,
        last_season:2026
      };
    });
  }

  if (target.endsWith('/competitions.csv.gz')) {
    let ids = Object.keys(COMPETITIONS);
    try {
      const data = await localJson('./data/clubs-world.json');
      ids = [...new Set([...ids, ...(data.clubs || []).map(c => c.competitionId).filter(Boolean)])];
    } catch {}
    return ids.map(id => {
      const meta = COMPETITIONS[id] || [id,''];
      return { competition_id:id, competition_code:id, name:meta[0], country_name:meta[1], type:'domestic_league', sub_type:'first_or_second_tier' };
    });
  }

  return null;
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
  try {
    const local = await localDataset(url);
    if (local) return local;
  } catch (error) {
    console.warn('Datapack local indisponível; tentando fonte externa.', error);
  }
  return parseCSV(await fetchText(url, options));
}
