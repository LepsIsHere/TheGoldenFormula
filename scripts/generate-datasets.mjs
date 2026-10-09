import { writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';

mkdirSync(new URL('../data', import.meta.url), { recursive: true });

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GK_STATS = {
  psxgMinusGa: [1, 7],
  savePct: [0.68, 0.8],
  cleanSheets: [8, 20],
  penaltySaves: [0, 3],
  crossesStoppedPct: [4, 11],
  defActionsOutsideBox: [0.5, 2.2],
  passCompletion: [0.62, 0.84],
  launches: [4, 11],
  yellowCards: [0, 2],
  redCards: [0, 0.3],
  secondYellows: [0, 0.2],
  suspensionsServed: [0, 0.5],
  teamGoalShare: [0.05, 0.2],
};

const CB_STATS = {
  tacklesPer90: [1.2, 2.6],
  interceptionsPer90: [0.8, 2.2],
  blocksPer90: [0.8, 2.0],
  clearancesPer90: [1.5, 4.0],
  aerialsWonPct: [0.55, 0.75],
  progressivePasses: [3, 9],
  passCompletion: [0.84, 0.94],
  passesFinalThird: [2, 7],
  goals: [1, 5],
  yellowCards: [2, 7],
  redCards: [0, 0.4],
  secondYellows: [0, 0.3],
  suspensionsServed: [0, 1.2],
  teamGoalShare: [0.03, 0.12],
};

const FB_STATS = {
  tacklesPer90: [1.5, 3.2],
  interceptionsPer90: [0.9, 2.4],
  aerialsWonPct: [0.45, 0.68],
  progressiveCarries: [1.5, 5],
  progressivePasses: [3, 8],
  assists: [2, 12],
  xA: [0.1, 0.5],
  keyPasses: [0.8, 2.4],
  passCompletion: [0.78, 0.9],
  goals: [2, 9],
  yellowCards: [2, 8],
  redCards: [0, 0.4],
  secondYellows: [0, 0.3],
  suspensionsServed: [0, 1],
  teamGoalShare: [0.06, 0.25],
};

const MID_STATS = {
  progressivePasses: [4, 11],
  passesIntoPA: [1.5, 5],
  throughBalls: [0.1, 0.6],
  xA: [0.1, 0.6],
  keyPasses: [1, 3],
  passesAttempted: [45, 85],
  duelsWonPct: [0.48, 0.65],
  tacklesPlusIntPer90: [1.5, 3.5],
  goals: [3, 14],
  yellowCards: [2, 8],
  redCards: [0, 0.4],
  secondYellows: [0, 0.3],
  suspensionsServed: [0, 1],
  teamGoalShare: [0.08, 0.3],
};

const ATT_STATS = {
  goalsPer90: [0.4, 1.1],
  goals: [12, 45],
  xG: [10, 40],
  assists: [3, 16],
  xA: [0.15, 0.7],
  shotsOnTarget: [1.2, 2.8],
  dribblesCompleted: [1, 3.5],
  touchesInBox: [5, 11],
  yellowCards: [1, 6],
  redCards: [0, 0.3],
  secondYellows: [0, 0.2],
  suspensionsServed: [0, 0.8],
  teamGoalShare: [0.15, 0.5],
};

const ROLE_STATS = { GK: GK_STATS, CB: CB_STATS, FB: FB_STATS, MID: MID_STATS, ATT: ATT_STATS };

function slug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').trim().replace(/ /g, '-');
}

const TROPHY_POOL = {
  ucl: { title: 'UEFA Champions League', tier: 'ucl' },
  wccl: { title: "Women's Champions League", tier: 'wccl' },
  'top-league': { title: 'League title', tier: 'top-league' },
  'other-league': { title: 'League title (other)', tier: 'other-league' },
  'domestic-cup': { title: 'Domestic cup', tier: 'domestic-cup' },
  international: { title: 'International trophy', tier: 'international' },
  'world-cup': { title: 'World Cup', tier: 'world-cup' },
};

function buildPlayer(row, rand, edition) {
  const ranges = ROLE_STATS[row.role];
  const stats = {};
  for (const [key, [lo, hi]] of Object.entries(ranges)) {
    const base = lo + rand() * (hi - lo);
    const tierBonus = row.stars ? 0.5 + rand() * 0.5 : 0;
    stats[key] = Math.round(base * (1 + tierBonus) * 1000) / 1000;
  }
  if (row.role === 'ATT') {
    stats.goalsPer90 = Math.round((stats.goals / (row.minutes / 90)) * 1000) / 1000;
    stats.goals = Math.round(stats.goals);
    stats.xG = Math.round(stats.xG);
    stats.assists = Math.round(stats.assists);
  }
  stats.yellowCards = Math.round(stats.yellowCards);
  stats.redCards = Math.round(stats.redCards);
  stats.secondYellows = Math.round(stats.secondYellows);
  stats.suspensionsServed = Math.round(stats.suspensionsServed);

  if (row.realGoals !== undefined) {
    stats.goals = row.realGoals;
    if (stats.goalsPer90 !== undefined && row.minutes > 0) {
      stats.goalsPer90 = Math.round((row.realGoals / (row.minutes / 90)) * 1000) / 1000;
    }
  }

  const trophies = [];
  for (const t of row.trophies ?? []) trophies.push(TROPHY_POOL[t]);
  return {
    id: slug(row.name),
    name: row.name,
    country: row.country,
    flag: row.flag,
    club: row.club,
    league: row.league,
    role: row.role,
    minutes: row.minutes,
    stats,
    trophies,
    conductEventIds: [],
    dataConfidence: 'partial',
    dataNotes: [
      'PARTIAL REAL DATA: roster, club, league, role and trophies verified for the 2025-26 season.',
      row.realGoals !== undefined
        ? `Goals (${row.realGoals}) verified from published season tallies${row.goalsNote ? ' — ' + row.goalsNote : ''}.`
        : '',
      'Minutes and remaining stat fields are placeholders pending the FBref/Transfermarkt pass (docs/data-refresh.md).',
    ].filter(Boolean).join(' '),
  };
}

const MEN_ROSTER = [
  ['Jude Bellingham', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Real Madrid', 'La Liga', 'MID', 3500, [], true],
  ['Pau Cubarsí', 'Spain', '🇪🇸', 'Barcelona', 'La Liga', 'CB', 3200, ['top-league', 'world-cup'], true],
  ['Marc Cucurella', 'Spain', '🇪🇸', 'Real Madrid', 'La Liga', 'FB', 3300, ['world-cup'], true],
  ['Ousmane Dembélé', 'France', '🇫🇷', 'Paris Saint-Germain', 'Ligue 1', 'ATT', 3300, ['ucl', 'top-league'], true],
  ['Luis Díaz', 'Colombia', '🇨🇴', 'Bayern Munich', 'Bundesliga', 'ATT', 3000, ['top-league', 'domestic-cup'], true],
  ['Bruno Fernandes', 'Portugal', '🇵🇹', 'Manchester United', 'Premier League', 'MID', 3600, [], false],
  ['Gabriel Magalhães', 'Brazil', '🇧🇷', 'Arsenal', 'Premier League', 'CB', 3200, ['top-league'], true],
  ['Erling Haaland', 'Norway', '🇳🇴', 'Manchester City', 'Premier League', 'ATT', 3000, ['domestic-cup'], true],
  ['Achraf Hakimi', 'Morocco', '🇲🇦', 'Paris Saint-Germain', 'Ligue 1', 'FB', 3300, ['ucl', 'top-league'], true],
  ['Harry Kane', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Bayern Munich', 'Bundesliga', 'ATT', 3400, ['top-league', 'domestic-cup'], true],
  ['Khvicha Kvaratskhelia', 'Georgia', '🇬🇪', 'Paris Saint-Germain', 'Ligue 1', 'ATT', 2900, ['ucl', 'top-league'], true],
  ['Sadio Mané', 'Senegal', '🇸🇳', 'Al Nassr', 'Saudi Pro League', 'ATT', 2900, [], false],
  ['Marquinhos', 'Brazil', '🇧🇷', 'Paris Saint-Germain', 'Ligue 1', 'CB', 3000, ['ucl', 'top-league'], false],
  ['Lautaro Martínez', 'Argentina', '🇦🇷', 'Inter Milan', 'Serie A', 'ATT', 3100, ['top-league'], true],
  ['Kylian Mbappé', 'France', '🇫🇷', 'Real Madrid', 'La Liga', 'ATT', 3200, [], true],
  ['Nuno Mendes', 'Portugal', '🇵🇹', 'Paris Saint-Germain', 'Ligue 1', 'FB', 3200, ['ucl', 'top-league'], true],
  ['Lionel Messi', 'Argentina', '🇦🇷', 'Inter Miami', 'MLS', 'ATT', 3000, ['other-league'], true],
  ['João Neves', 'Portugal', '🇵🇹', 'Paris Saint-Germain', 'Ligue 1', 'MID', 3300, ['ucl', 'top-league'], true],
  ['Michael Olise', 'France', '🇫🇷', 'Bayern Munich', 'Bundesliga', 'ATT', 3100, ['top-league', 'domestic-cup'], true],
  ['Willian Pacho', 'Ecuador', '🇪🇨', 'Paris Saint-Germain', 'Ligue 1', 'CB', 3300, ['ucl', 'top-league'], true],
  ['Julián Quiñones', 'Mexico', '🇲🇽', 'Al-Qadsiah', 'Saudi Pro League', 'ATT', 2600, [], false],
  ['Declan Rice', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Arsenal', 'Premier League', 'MID', 3400, ['top-league'], true],
  ['Rodri', 'Spain', '🇪🇸', 'Manchester City', 'Premier League', 'MID', 2600, ['domestic-cup', 'world-cup'], true],
  ['Fabián Ruiz', 'Spain', '🇪🇸', 'Paris Saint-Germain', 'Ligue 1', 'MID', 3200, ['ucl', 'top-league', 'world-cup'], false],
  ['William Saliba', 'France', '🇫🇷', 'Arsenal', 'Premier League', 'CB', 3300, ['top-league'], false],
  ['Ferran Torres', 'Spain', '🇪🇸', 'Barcelona', 'La Liga', 'ATT', 2600, ['top-league', 'world-cup'], false],
  ['Dayot Upamecano', 'France', '🇫🇷', 'Bayern Munich', 'Bundesliga', 'CB', 3100, ['top-league', 'domestic-cup'], false],
  ['Vinícius Júnior', 'Brazil', '🇧🇷', 'Real Madrid', 'La Liga', 'ATT', 2900, [], true],
  ['Vitinha', 'Portugal', '🇵🇹', 'Paris Saint-Germain', 'Ligue 1', 'MID', 3600, ['ucl', 'top-league'], true],
  ['Lamine Yamal', 'Spain', '🇪🇸', 'Barcelona', 'La Liga', 'ATT', 3300, ['top-league', 'world-cup'], true],
].map(([name, country, flag, club, league, role, minutes, trophies, stars]) => ({ name, country, flag, club, league, role, minutes, trophies, stars }));

const WOMEN_ROSTER = [
  ['Selma Bacha', 'France', '🇫🇷', 'OL Lyonnes', 'Première Ligue', 'FB', 2400, [], true],
  ['Barbra Banda', 'Zambia', '🇿🇲', 'Orlando Pride', 'NWSL', 'ATT', 2200, [], true],
  ['Klara Buhl', 'Germany', '🇩🇪', 'Bayern Munich', 'Frauen-Bundesliga', 'ATT', 2000, ['top-league'], false],
  ['Esmee Brugts', 'Netherlands', '🇳🇱', 'Barcelona', 'Liga F', 'MID', 1900, ['wccl', 'top-league'], false],
  ['Mariona Caldentey', 'Spain', '🇪🇸', 'Arsenal', 'WSL', 'MID', 2200, [], false],
  ['Scarlett Camberos', 'Mexico', '🇲🇽', 'Club América', 'Liga MX Femenil', 'ATT', 2200, [], false],
  ['Kerstin Casparij', 'Netherlands', '🇳🇱', 'Manchester City', 'WSL', 'FB', 2200, ['top-league'], false],
  ['Temwa Chawinga', 'Malawi', '🇲🇼', 'Kansas City Current', 'NWSL', 'ATT', 2200, [], true],
  ['Cata Coll', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'GK', 1900, ['wccl', 'top-league'], true],
  ['Melchie Dumornay', 'Haiti', '🇭🇹', 'OL Lyonnes', 'Première Ligue', 'MID', 2100, [], true],
  ['Caroline Graham Hansen', 'Norway', '🇳🇴', 'Barcelona', 'Liga F', 'ATT', 2300, ['wccl', 'top-league'], true],
  ['Alex Greenwood', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Manchester City', 'WSL', 'CB', 2200, ['top-league'], true],
  ['Patri Guijarro', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'MID', 2000, ['wccl', 'top-league'], false],
  ['Pernille Harder', 'Denmark', '🇩🇰', 'Bayern Munich', 'Frauen-Bundesliga', 'ATT', 2100, ['top-league'], true],
  ['Yui Hasegawa', 'Japan', '🇯🇵', 'Manchester City', 'WSL', 'MID', 2100, ['top-league'], false],
  ['Rose Lavelle', 'United States', '🇺🇸', 'Gotham FC', 'NWSL', 'MID', 1800, [], false],
  ['Mapi León', 'Spain', '🇪🇸', 'London City Lionesses', 'WSL', 'CB', 2000, [], false],
  ['Lorena', 'Brazil', '🇧🇷', 'Kansas City Current', 'NWSL', 'GK', 1900, [], false],
  ['Melvine Malard', 'France', '🇫🇷', 'Manchester United', 'WSL', 'ATT', 1800, [], false],
  ['Manaka Matsukubo', 'Japan', '🇯🇵', 'North Carolina Courage', 'NWSL', 'ATT', 1900, [], false],
  ['Vivianne Miedema', 'Netherlands', '🇳🇱', 'Manchester City', 'WSL', 'ATT', 1900, ['top-league'], false],
  ['Ewa Pajor', 'Poland', '🇵🇱', 'Barcelona', 'Liga F', 'ATT', 2200, ['wccl', 'top-league'], true],
  ['Clàudia Pina', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'ATT', 2100, ['wccl', 'top-league'], true],
  ['Alexia Putellas', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'MID', 2300, ['wccl', 'top-league'], true],
  ['Wendie Renard', 'France', '🇫🇷', 'OL Lyonnes', 'Première Ligue', 'CB', 2100, [], true],
  ['Alessia Russo', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Arsenal', 'WSL', 'ATT', 2200, [], true],
  ['Khadija Shaw', 'Jamaica', '🇯🇲', 'Manchester City', 'WSL', 'ATT', 1800, ['top-league'], true],
  ['Momoko Tanikawa', 'Japan', '🇯🇵', 'Bayern Munich', 'Frauen-Bundesliga', 'MID', 1800, ['top-league'], false],
  ['Caroline Weir', 'Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Real Madrid', 'Liga F', 'MID', 2200, [], false],
  ['Tessa Wullaert', 'Belgium', '🇧🇪', 'Inter Milan', 'Serie A', 'ATT', 2100, [], false],
].map(([name, country, flag, club, league, role, minutes, trophies, stars]) => ({ name, country, flag, club, league, role, minutes, trophies, stars }));

const VERIFIED_GOALS = {
  'harry-kane': { goals: 36, note: '36 Bundesliga goals (plus 10 in the DFB-Pokal)' },
  'erling-haaland': { goals: 27, note: '27 Premier League goals (Golden Boot)' },
  'kylian-mbappe': { goals: 25, note: '25 La Liga goals' },
  'lautaro-martinez': { goals: 17, note: '17 Serie A goals (capocannoniere)' },
  'luis-diaz': { goals: 15, note: '15 Bundesliga goals' },
  'michael-olise': { goals: 15, note: '15 Bundesliga goals' },
  'ferran-torres': { goals: 16, note: '16 La Liga goals; scored the winning goal in the World Cup final' },
  'vinicius-junior': { goals: 16, note: '16 La Liga goals' },
  'lamine-yamal': { goals: 16, note: '16 La Liga goals' },
  'lionel-messi': { goals: 8, note: '8 goals at the 2026 World Cup (Silver Boot)' },
  'claudia-pina': { goals: 21, note: '21 Liga F goals' },
  'ewa-pajor': { goals: 16, note: '16 Liga F goals plus 11 in the Women\u2019s Champions League (top scorer)' },
  'pernille-harder': { goals: 16, note: '16 Frauen-Bundesliga goals plus 8 in the Women\u2019s Champions League' },
  'khadija-shaw': { goals: 21, note: '21 WSL goals (Player of the Season)' },
  'alessia-russo': { goals: 13, note: '13 WSL goals plus 9 in the Women\u2019s Champions League' },
  'caroline-weir': { goals: 14, note: '14 Liga F goals' },
  'caroline-graham-hansen': { goals: 10, note: '10 Liga F goals; 10 Liga F assists (both league-leading)' },
  'alexia-putellas': { goals: 7, note: '7 Liga F goals; UWCL Player of the Season' },
};

for (const row of [...MEN_ROSTER, ...WOMEN_ROSTER]) {
  const v = VERIFIED_GOALS[slug(row.name)];
  if (v) { row.realGoals = v.goals; row.goalsNote = v.note; }
}

function buildDataset(edition, roster, seed) {
  const rand = mulberry32(seed);
  return {
    edition,
    season: '2025-26',
    referencePeriod: '2025-08-03 to 2026-07-19',
    status: 'partial-real',
    note: 'Rosters match the official 2026 Ballon d\u2019Or shortlists (announced 8 Sep 2026) with verified clubs and 2025\u201326 trophies and, where noted per player, verified goal tallies. Minutes and remaining stat fields are placeholders pending the FBref/Transfermarkt pass (docs/data-refresh.md).',
    players: roster.map((row) => buildPlayer(row, rand, edition)),
  };
}

const men = buildDataset('men', MEN_ROSTER, 42);
const women = buildDataset('women', WOMEN_ROSTER, 1337);

writeFileSync(new URL('../data/men-2026.json', import.meta.url), JSON.stringify(men, null, 2));
writeFileSync(new URL('../data/women-2026.json', import.meta.url), JSON.stringify(women, null, 2));
console.log(`men: ${men.players.length} players, women: ${women.players.length} players`);
