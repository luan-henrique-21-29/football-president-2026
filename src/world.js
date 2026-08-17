import { fetchCSV } from './csv.js';

export const SNAPSHOT = '2026-08-14';
const DATA_ROOT = 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data';
const URLS = {
  clubs: `${DATA_ROOT}/clubs.csv.gz`,
  players: `${DATA_ROOT}/players.csv.gz`,
  competitions: `${DATA_ROOT}/competitions.csv.gz`,
};

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/\b(fc|cf|afc|sc|ac|calcio|club|de|do|da)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const num = value => Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;

export function ageOn(date, at = SNAPSHOT) {
  if (!date) return null;
  const born = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  const now = new Date(`${at}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < born.getUTCMonth() || (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

export function monthsLeft(contractDate, currentDate = SNAPSHOT) {
  if (!contractDate) return null;
  const end = new Date(`${String(contractDate).slice(0, 10)}T00:00:00Z`);
  const now = new Date(`${currentDate}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.round((end - now) / 2629800000));
}

export function contractLabel(contractDate) {
  const months = monthsLeft(contractDate);
  if (months == null) return 'Não informado';
  if (months <= 0) return 'Fim de contrato';
  if (months < 12) return `${months} meses`;
  const y = Math.floor(months / 12), m = months % 12;
  return `${y} ano${y === 1 ? '' : 's'}${m ? ` e ${m}m` : ''}`;
}

export function playerOverall(player) {
  const value = Math.max(10000, num(player.marketValue));
  let rating = 47 + Math.log10(value) * 5.2;
  const age = player.age ?? ageOn(player.dateOfBirth);
  if (age != null && age >= 30) rating += Math.min(3.2, (age - 29) * 0.55);
  if (age != null && age <= 20) rating -= Math.max(0, (21 - age) * 0.65);
  if (player.position === 'Goalkeeper' && age != null && age >= 29) rating += 0.8;
  return Math.max(55, Math.min(93, Math.round(rating)));
}

export function playerPotential(player) {
  const ovr = player.overall ?? playerOverall(player);
  const age = player.age ?? ageOn(player.dateOfBirth) ?? 25;
  const growth = age <= 18 ? 8 : age <= 20 ? 6 : age <= 22 ? 4 : age <= 24 ? 2 : 0;
  return Math.min(94, ovr + growth);
}

export function estimatedWage(player) {
  const value = Math.max(100000, num(player.marketValue));
  const annual = Math.max(120000, Math.min(30000000, value * 0.075));
  return Math.round(annual / 52 / 100) * 100;
}

function teamHistory(name, country, competition) {
  const key = normalize(name);
  const stories = [
    [/real madrid/, 'Um dos clubes mais vitoriosos do futebol mundial, construído sobre gerações de estrelas e uma cultura em que competir por grandes títulos é obrigação.'],
    [/barcelona/, 'Clube catalão de enorme identidade esportiva, conhecido pela formação de jogadores, pelo futebol de posse e por eras históricas de domínio doméstico e europeu.'],
    [/manchester united/, 'Gigante inglês de alcance mundial, marcado por reconstruções históricas, gerações formadas em casa e uma cobrança permanente por voltar ao topo.'],
    [/manchester city/, 'Potência moderna do futebol inglês, transformada em referência de estrutura, profundidade de elenco e ambição por títulos nacionais e continentais.'],
    [/liverpool/, 'Clube de Anfield com uma das torcidas mais reconhecidas do mundo, tradição europeia forte e uma identidade competitiva construída ao longo de várias eras.'],
    [/arsenal/, 'Tradicional clube do norte de Londres, conhecido por períodos de futebol técnico, grandes equipes e uma busca constante por combinar títulos com identidade.'],
    [/chelsea/, 'Clube londrino que se consolidou entre a elite europeia com elencos fortes, grandes investimentos e uma cultura de cobrança imediata por resultados.'],
    [/tottenham/, 'Clube histórico do norte de Londres, com grande torcida, estádio moderno e o desafio permanente de transformar força comercial em conquistas esportivas.'],
    [/atletico/, 'Clube madrilenho de identidade intensa e competitiva, tradicionalmente associado a equipes resistentes, grandes noites europeias e rivalidade com Real Madrid.'],
    [/juventus/, 'Gigante de Turim com forte tradição de títulos domésticos e pressão constante para manter protagonismo na Itália e competir no cenário europeu.'],
    [/inter/, 'Clube de Milão com história de grandes equipes, conquistas nacionais e europeias e uma rivalidade central na identidade do futebol italiano.'],
    [/milan/, 'Um dos nomes históricos do futebol europeu, com tradição internacional enorme e expectativa permanente de montar equipes capazes de disputar os maiores títulos.'],
    [/paris saint germain|psg/, 'Clube da capital francesa que se tornou potência esportiva e comercial, com ambição global e forte pressão por domínio doméstico e sucesso europeu.'],
    [/marseille/, 'Clube de enorme paixão popular no sul da França, com identidade intensa, ambiente de pressão e uma das histórias mais marcantes do futebol francês.'],
    [/corinthians/, 'Clube paulista de massa, conhecido pela força de sua torcida, por títulos nacionais e continentais e por um ambiente em que cada grande decisão da diretoria repercute imediatamente.'],
    [/palmeiras/, 'Clube paulista de tradição centenária, forte histórico nacional e continental e cultura recente de estrutura, competitividade e formação de elencos vencedores.'],
    [/flamengo/, 'Clube de uma das maiores torcidas do mundo, com enorme pressão por títulos, poder comercial elevado e tradição de grandes jogadores e conquistas.'],
    [/sao paulo/, 'Clube brasileiro com forte tradição internacional, história de grandes equipes e uma cultura ligada a conquistas continentais e mundiais.'],
    [/santos/, 'Clube histórico do litoral paulista, eternamente associado à formação de craques e a equipes que ajudaram a projetar o futebol brasileiro no mundo.'],
    [/gremio/, 'Clube gaúcho de forte identidade copeira, torcida exigente e tradição em competições nacionais e sul-americanas.'],
    [/internacional/, 'Clube de Porto Alegre com tradição nacional e continental, forte rivalidade local e uma torcida que cobra protagonismo em todas as temporadas.'],
    [/al hilal/, 'Um dos clubes mais vitoriosos e populares da Arábia Saudita, com ambição continental, grande capacidade de investimento e expectativa constante por estrelas.'],
    [/al nassr/, 'Clube saudita de enorme visibilidade internacional, marcado por investimento em grandes nomes e pressão por transformar força financeira em títulos.'],
  ];
  const match = stories.find(([re]) => re.test(key));
  return match ? match[1] : `${name} disputa ${competition || 'uma competição nacional'} em ${country || 'seu país'}. Como presidente, seu desafio é equilibrar tradição, torcida, orçamento e ambição esportiva enquanto constrói a próxima era do clube.`;
}

export function normalizeClub(row, competitionMap = new Map()) {
  const name = row.name || row.club_name || row.club || '';
  const id = String(row.club_id || row.id || normalize(name));
  const competitionId = row.domestic_competition_id || row.competition_id || row.leagueId || '';
  const competition = competitionMap.get(competitionId)?.name || row.competition_name || row.league || competitionId || 'Liga não informada';
  const country = competitionMap.get(competitionId)?.country || row.country_name || row.country || '';
  const marketValue = num(row.total_market_value);
  const strength = marketValue > 0 ? Math.max(64, Math.min(92, Math.round(62 + Math.log10(Math.max(1, marketValue * (marketValue < 10000 ? 1e6 : 1))) * 3.55))) : null;
  return {
    id,
    name,
    shortName: name,
    country,
    competitionId,
    league: competition,
    stadium: row.stadium_name || row.stadium || 'Estádio não informado',
    stadiumSeats: num(row.stadium_seats || row.capacity),
    coachName: row.coach_name || row.coach || '',
    squadSize: num(row.squad_size),
    averageAge: Number(row.average_age) || null,
    marketValue,
    reputation: strength ? Math.min(99, strength + 5) : 72,
    teamOverall: strength || 72,
    history: row.history || teamHistory(name, country, competition),
    source: row.club_id ? 'live-world' : 'starter',
  };
}

export function normalizePlayer(row) {
  const currentClubId = String(row.current_club_id || row.club_id || row['Current club ID'] || '');
  const name = row.name || row.player_name || row['Player name'] || row['Full name'] || '';
  const dateOfBirth = row.date_of_birth || row['Date of birth'] || '';
  const position = row.position || row.player_main_position || row['Position'] || 'Unknown';
  const player = {
    id: String(row.player_id || row.id || normalize(`${name}-${dateOfBirth}`)),
    name,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    currentClubId,
    currentClubName: row.current_club_name || row['Current club'] || row.club_name || '',
    nationality: row.country_of_citizenship || row.citizenship || row['Citizenship'] || '',
    dateOfBirth,
    age: ageOn(dateOfBirth),
    position,
    subPosition: row.sub_position || row.player_sub_position || row['player_sub_position'] || '',
    foot: row.foot || row['Foot'] || '',
    height: num(row.height_in_cm || row.height || row['Height']),
    marketValue: num(row.market_value_in_eur || row.value || row.market_value),
    contractExpiration: row.contract_expiration_date || row.contract_expires || row['Contract expires'] || '',
    image: row.image_url || row.player_image_url || '',
  };
  player.overall = playerOverall(player);
  player.potential = playerPotential(player);
  player.estimatedWage = estimatedWage(player);
  player.energy = 100;
  player.form = 70;
  return player;
}

function parseCompetition(row) {
  const id = row.competition_id || row.id || row.code;
  return [String(id), {
    id: String(id),
    name: row.name || row.competition_name || row.competition_code || String(id),
    country: row.country_name || '',
    type: row.type || '',
    subType: row.sub_type || '',
  }];
}

function starterClub(row) {
  return normalizeClub({
    id: row.id, name: row.name, country: row.country, league: row.league,
    stadium: row.stadium, total_market_value: 0, coach_name: row.coachName || '',
    history: row.history,
  });
}

export class WorldDatabase {
  constructor(starter) {
    this.snapshot = SNAPSHOT;
    this.starter = starter;
    this.competitions = new Map();
    this.clubs = starter.clubs.map(starterClub);
    this.players = null;
    this.status = 'starter';
    this.error = null;
  }

  async hydrateClubs() {
    try {
      const [competitionRows, clubRows] = await Promise.all([
        fetchCSV(URLS.competitions, { gzip: true }),
        fetchCSV(URLS.clubs, { gzip: true }),
      ]);
      this.competitions = new Map(competitionRows.map(parseCompetition));
      const all = clubRows.map(row => normalizeClub(row, this.competitions)).filter(c => c.name && c.id);
      const recent = all.filter(c => {
        const row = clubRows.find(r => String(r.club_id) === c.id);
        const last = Number(row?.last_season || 0);
        return !last || last >= 2025;
      });
      this.clubs = recent.length > 100 ? recent : all;
      this.status = 'world';
      return this.clubs;
    } catch (error) {
      this.status = 'starter';
      this.error = error;
      return this.clubs;
    }
  }

  async ensurePlayers() {
    if (this.players) return this.players;
    try {
      const rows = await fetchCSV(URLS.players, { gzip: true });
      this.players = rows.map(normalizePlayer).filter(p => p.name && p.currentClubId);
      return this.players;
    } catch (error) {
      this.error = error;
      this.players = [];
      throw error;
    }
  }

  findClub(id) { return this.clubs.find(c => String(c.id) === String(id)); }
  clubsInCompetition(competitionId) { return this.clubs.filter(c => String(c.competitionId) === String(competitionId)); }
  playersForClub(clubId, acquiredIds = []) {
    if (!this.players) return [];
    const owned = new Set(acquiredIds.map(String));
    return this.players.filter(p => String(p.currentClubId) === String(clubId) || owned.has(String(p.id)));
  }
  marketPlayers(clubId, acquiredIds = [], soldIds = []) {
    if (!this.players) return [];
    const owned = new Set(acquiredIds.map(String));
    const sold = new Set(soldIds.map(String));
    return this.players.filter(p => String(p.currentClubId) !== String(clubId) && !owned.has(String(p.id)) && !sold.has(String(p.id)));
  }
}

export function formatCurrency(value, currency = 'EUR') {
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0); }
  catch { return `€ ${(Number(value) || 0).toLocaleString('pt-BR')}`; }
}

export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function normalizedName(value) { return normalize(value); }
