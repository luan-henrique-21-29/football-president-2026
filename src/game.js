import { playerOverall, monthsLeft } from './world.js';

const DAY = 86400000;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = str => [...String(str)].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 2166136261) >>> 0;
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(1664525, s) + 1013904223 >>> 0) / 4294967296); }
function dateAdd(date, days) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / DAY); }

export function leagueProfile(name = '') {
  const n = name.toLowerCase();
  if (n.includes('major league soccer') || n === 'mls') return { games: 34, format: 'Conferências + temporada regular + playoffs + MLS Cup', promotion: 'Sem promoção/rebaixamento com a USL', playoffs: true, relegation: 0, label: 'MLS' };
  if (n.includes('championship') && !n.includes('usl')) return { games: 46, format: 'Pontos corridos + playoffs de acesso', promotion: '2 acessos diretos + playoffs', playoffs: true, relegation: 3, label: 'EFL Championship' };
  if (n.includes('segunda') || n.includes('serie b') || n.includes('ligue 2') || n.includes('first division')) return { games: 38, format: 'Liga de segunda divisão com acesso e rebaixamento conforme a competição', promotion: 'Acesso disponível', playoffs: n.includes('segunda'), relegation: 3, label: name };
  if (n.includes('premier league')) return { games: 38, format: 'Pontos corridos, ida e volta', promotion: 'Não se aplica na primeira divisão', playoffs: false, relegation: 3, label: 'Premier League' };
  if (n.includes('laliga') || n.includes('primera')) return { games: 38, format: 'Pontos corridos, ida e volta', promotion: 'Não se aplica na primeira divisão', playoffs: false, relegation: 3, label: 'LaLiga' };
  if (n.includes('ligue 1')) return { games: 34, format: 'Pontos corridos, ida e volta', promotion: 'Não se aplica na primeira divisão', playoffs: false, relegation: 2, label: 'Ligue 1' };
  if (n.includes('serie a')) return { games: 38, format: 'Pontos corridos, ida e volta', promotion: 'Não se aplica na primeira divisão', playoffs: false, relegation: 3, label: 'Serie A' };
  if (n.includes('brasile') || n.includes('brazil')) return { games: 38, format: 'Pontos corridos em turno e returno, com calendário nacional paralelo', promotion: 'Primeira divisão', playoffs: false, relegation: 4, label: 'Brasileirão' };
  if (n.includes('saudi') || n.includes('rosnh') || n.includes('professional league')) return { games: 34, format: 'Pontos corridos, ida e volta', promotion: 'Sistema nacional saudita', playoffs: false, relegation: 3, label: 'Saudi Pro League' };
  if (n.includes('usl')) return { games: 34, format: 'Conferências + playoffs; sem acesso automático à MLS', promotion: 'Sem promoção automática à MLS', playoffs: true, relegation: 0, label: 'USL Championship' };
  return { games: 38, format: 'Liga nacional', promotion: 'Regras da competição', playoffs: false, relegation: 3, label: name || 'Liga' };
}

export function buildCalendar(club, competitionClubs, seasonStart = '2026-08-15') {
  const opponents = competitionClubs.filter(c => String(c.id) !== String(club.id));
  const profile = leagueProfile(club.league);
  if (!opponents.length) return [];
  const random = rng(hash(`${club.id}-2026`));
  const pool = [];
  while (pool.length < profile.games) {
    const shuffled = [...opponents].sort(() => random() - .5);
    pool.push(...shuffled);
  }
  let date = seasonStart;
  const fixtures = [];
  for (let i = 0; i < profile.games; i++) {
    if (i > 0) date = dateAdd(date, i % 5 === 3 ? 4 : 7);
    const opponent = pool[i];
    fixtures.push({
      id: `L${i + 1}`,
      type: 'LEAGUE',
      competition: club.league,
      round: `Rodada ${i + 1}`,
      date,
      opponentId: opponent.id,
      opponentName: opponent.name,
      opponentOverall: opponent.teamOverall || 72,
      home: i % 2 === 0,
      importance: 1 + Math.max(0, ((opponent.teamOverall || 72) - 75) / 30),
      played: false,
    });
    if (i > 1 && i < profile.games - 2 && i % 7 === 4) {
      const cupOpp = opponents[Math.floor(random() * opponents.length)];
      const cupDate = dateAdd(date, 3);
      fixtures.push({
        id: `C${i + 1}`,
        type: 'CUP',
        competition: nationalCupFor(club.country, club.league),
        round: i < 12 ? 'Fase inicial' : 'Mata-mata',
        date: cupDate,
        opponentId: cupOpp.id,
        opponentName: cupOpp.name,
        opponentOverall: cupOpp.teamOverall || 72,
        home: random() > .5,
        importance: 1.35 + (i / profile.games) * .35,
        played: false,
      });
    }
  }
  return fixtures.sort((a, b) => a.date.localeCompare(b.date));
}

function nationalCupFor(country = '', league = '') {
  const c = `${country} ${league}`.toLowerCase();
  if (c.includes('england') || c.includes('inglaterra') || c.includes('premier') || c.includes('championship')) return 'FA Cup';
  if (c.includes('spain') || c.includes('espanha') || c.includes('laliga')) return 'Copa del Rey';
  if (c.includes('france') || c.includes('frança') || c.includes('ligue')) return 'Coupe de France';
  if (c.includes('ital')) return 'Coppa Italia';
  if (c.includes('brazil') || c.includes('brasil')) return 'Copa do Brasil';
  if (c.includes('saudi') || c.includes('arab')) return "King's Cup";
  if (c.includes('usa') || c.includes('united states') || c.includes('mls') || c.includes('usl')) return 'US Open Cup';
  return 'Copa Nacional';
}

function posGroup(player) {
  const p = `${player.position} ${player.subPosition}`.toLowerCase();
  if (/goal|gole|keeper/.test(p)) return 'GK';
  if (/back|defen|centre-back|center-back|full-back|left-back|right-back/.test(p)) return 'DEF';
  if (/midfield|meia|medio|pivot|winger/.test(p)) return 'MID';
  return 'ATT';
}

function scorePlayer(p, conserve = 0) {
  const overall = p.overall ?? playerOverall(p);
  const energy = p.energy ?? 100;
  const form = p.form ?? 70;
  return overall * 1.25 + energy * (.12 + conserve * .12) + form * .06;
}

function selectByGroup(players, group, count, used, conserve) {
  const candidates = players.filter(p => posGroup(p) === group && !used.has(String(p.id))).sort((a, b) => scorePlayer(b, conserve) - scorePlayer(a, conserve));
  const picked = candidates.slice(0, count);
  picked.forEach(p => used.add(String(p.id)));
  return picked;
}

export function calculateTeamOverall(players) {
  if (!players?.length) return 70;
  const used = new Set();
  let xi = [
    ...selectByGroup(players, 'GK', 1, used, 0),
    ...selectByGroup(players, 'DEF', 4, used, 0),
    ...selectByGroup(players, 'MID', 3, used, 0),
    ...selectByGroup(players, 'ATT', 3, used, 0),
  ];
  if (xi.length < 11) xi = xi.concat(players.filter(p => !used.has(String(p.id))).sort((a,b)=>(b.overall||0)-(a.overall||0)).slice(0, 11-xi.length));
  return Math.round(xi.reduce((s, p) => s + (p.overall || 65), 0) / Math.max(1, xi.length));
}

export function coachSelection(squad, fixture, nextFixture, teamOverall) {
  const daysToNext = nextFixture ? daysBetween(fixture.date, nextFixture.date) : 8;
  const opponent = fixture.opponentOverall || 72;
  const nextOpponent = nextFixture?.opponentOverall || 0;
  const currentBig = fixture.importance >= 1.4 || opponent >= teamOverall - 1;
  const nextBig = nextFixture && (nextFixture.importance > fixture.importance + .12 || nextOpponent >= opponent + 5);
  const tight = daysToNext <= 4;
  let rotation = 0;
  let reason = 'Força máxima: o treinador considera este jogo prioridade.';

  if (!currentBig && tight && nextBig) { rotation = .48; reason = `Rodízio forte: próximo jogo em ${daysToNext} dias contra adversário mais exigente.`; }
  else if (!currentBig && opponent <= teamOverall - 7) { rotation = tight ? .42 : .27; reason = `Time misto: adversário tem OVR ${opponent} e o treinador quer preservar energia.`; }
  else if (tight) { rotation = .18; reason = `Rodízio leve por calendário apertado: apenas ${daysToNext} dias até o próximo jogo.`; }
  if (fixture.type === 'CUP' && fixture.importance >= 1.5) { rotation = Math.min(rotation, .12); reason = 'Mata-mata importante: escalação próxima da força máxima.'; }

  const players = squad.map(p => ({ ...p }));
  const used = new Set();
  let starters = [
    ...selectByGroup(players, 'GK', 1, used, rotation),
    ...selectByGroup(players, 'DEF', 4, used, rotation),
    ...selectByGroup(players, 'MID', 3, used, rotation),
    ...selectByGroup(players, 'ATT', 3, used, rotation),
  ];
  if (starters.length < 11) starters = starters.concat(players.filter(p => !used.has(String(p.id))).sort((a,b)=>scorePlayer(b,rotation)-scorePlayer(a,rotation)).slice(0,11-starters.length));

  if (rotation > .2 && squad.length > 15) {
    const strongest = [...starters].sort((a,b)=>(b.overall||0)-(a.overall||0));
    const benchPool = players.filter(p => !starters.some(s => String(s.id) === String(p.id))).sort((a,b)=>scorePlayer(b,rotation)-scorePlayer(a,rotation));
    const swaps = Math.min(Math.round(rotation * 7), benchPool.length, 4);
    for (let i = 0; i < swaps; i++) {
      const protectedStar = strongest[i];
      const replacementIndex = benchPool.findIndex(p => posGroup(p) === posGroup(protectedStar) && (p.overall || 0) >= (protectedStar.overall || 0) - 12);
      if (replacementIndex >= 0) {
        const replacement = benchPool.splice(replacementIndex, 1)[0];
        starters = starters.map(p => String(p.id) === String(protectedStar.id) ? replacement : p);
        benchPool.push(protectedStar);
      }
    }
  }

  const starterIds = new Set(starters.map(p => String(p.id)));
  const bench = players.filter(p => !starterIds.has(String(p.id))).sort((a,b)=>scorePlayer(b,.3)-scorePlayer(a,.3)).slice(0,9);
  const lineupOverall = Math.round(starters.reduce((s,p)=>s+(p.overall||65),0)/Math.max(1,starters.length));
  return { starters, bench, lineupOverall, rotation, reason, daysToNext };
}

function goalCount(expected, random) {
  const lambda = clamp(expected, .2, 3.4);
  const L = Math.exp(-lambda); let k = 0, p = 1;
  do { k++; p *= random(); } while (p > L && k < 9);
  return k - 1;
}

export function simulateFixture({ save, fixture, nextFixture, squad, opponentClub }) {
  const teamOverall = calculateTeamOverall(squad);
  const plan = coachSelection(squad, fixture, nextFixture, teamOverall);
  const seed = hash(`${save.clubId}-${fixture.id}-${save.season}-${save.matchesPlayed || 0}`);
  const random = rng(seed + Date.now() % 9973);
  const opp = fixture.opponentOverall || opponentClub?.teamOverall || 72;
  const home = fixture.home ? .18 : -.06;
  const diff = (plan.lineupOverall - opp) / 10;
  const expectedFor = 1.25 + diff * .42 + home;
  const expectedAgainst = 1.18 - diff * .36 - home * .45;
  const gf = goalCount(expectedFor, random);
  const ga = goalCount(expectedAgainst, random);
  const possession = clamp(Math.round(50 + (plan.lineupOverall - opp) * 1.25 + (random() - .5) * 8), 30, 70);
  const shots = Math.max(3, Math.round(8 + expectedFor * 4 + random() * 5));
  const shotsAgainst = Math.max(3, Math.round(8 + expectedAgainst * 4 + random() * 5));
  const xg = Math.max(.2, Math.round((expectedFor + (random() - .5) * .35) * 100) / 100);
  const xga = Math.max(.2, Math.round((expectedAgainst + (random() - .5) * .35) * 100) / 100);

  return { gf, ga, possession, shots, shotsAgainst, xg, xga, teamOverall, plan };
}

export function applyMatchFitness(players, starters, bench, recoveryDays = 6) {
  const starterIds = new Set(starters.map(p => String(p.id)));
  const benchIds = new Set(bench.map(p => String(p.id)));
  players.forEach(p => {
    const base = p.energy ?? 100;
    const spent = starterIds.has(String(p.id)) ? 22 + Math.round(Math.random() * 7) : benchIds.has(String(p.id)) ? 4 : 0;
    const recovered = Math.min(100, base - spent + Math.max(4, recoveryDays * 5));
    p.energy = clamp(recovered, 35, 100);
    if (starterIds.has(String(p.id))) p.form = clamp((p.form ?? 70) + (Math.random() - .46) * 5, 45, 95);
  });
}

export function askingPrice(player) {
  const value = Math.max(250000, Number(player.marketValue) || 250000);
  const months = monthsLeft(player.contractExpiration);
  let multiplier = 1.18;
  if (months != null && months <= 12) multiplier = .92;
  else if (months != null && months >= 36) multiplier = 1.32;
  if ((player.age ?? 25) <= 21 && (player.potential || 0) >= (player.overall || 0) + 4) multiplier += .16;
  return Math.round(value * multiplier / 10000) * 10000;
}

export function evaluateOffer(player, offer, buyerClub, sellerClub) {
  const ask = askingPrice(player);
  const ratio = offer / ask;
  const prestige = (buyerClub?.teamOverall || 72) - (sellerClub?.teamOverall || 72);
  if (ratio >= 1.04) return { accepted: true, counter: offer, reason: 'O clube aceitou a proposta.' };
  if (ratio >= .9 || (ratio >= .84 && prestige > 8)) return { accepted: false, counter: Math.round(ask * .98 / 10000) * 10000, reason: 'O clube negocia, mas pede um valor maior.' };
  return { accepted: false, counter: ask, reason: 'Proposta recusada por ser baixa.' };
}

export function playerInterest(player, buyerClub, sellerClub) {
  const buyer = buyerClub?.teamOverall || 72, seller = sellerClub?.teamOverall || 72;
  if (buyer >= seller - 4) return { interested: true, reason: 'O jogador aceita discutir o projeto.' };
  if ((player.overall || 70) >= 87 && buyer < 78) return { interested: false, reason: 'O jogador considera o nível esportivo do projeto insuficiente.' };
  return { interested: Math.random() > .35, reason: 'A decisão depende de salário e projeto esportivo.' };
}
