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
    dataNotes: 'DRAFT: stat line generated for engine development. Replace with FBref export during the Week 1 data pass.',
  };
}

const MEN_ROSTER = [
  ['Harry Kane', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Bayern Munich', 'Bundesliga', 'ATT', 4200, ['top-league', 'domestic-cup', 'ucl'], true],
  ['Kylian Mbappé', 'France', '🇫🇷', 'Real Madrid', 'La Liga', 'ATT', 3800, ['top-league'], true],
  ['Lamine Yamal', 'Spain', '🇪🇸', 'Barcelona', 'La Liga', 'ATT', 3600, ['top-league', 'domestic-cup'], true],
  ['Lionel Messi', 'Argentina', '🇦🇷', 'Inter Miami', 'MLS', 'ATT', 3000, ['other-league'], true],
  ['Erling Haaland', 'Norway', '🇳🇴', 'Manchester City', 'Premier League', 'ATT', 3400, [], true],
  ['Jude Bellingham', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Real Madrid', 'La Liga', 'MID', 3500, ['top-league'], true],
  ['Vinícius Júnior', 'Brazil', '🇧🇷', 'Real Madrid', 'La Liga', 'ATT', 3200, ['top-league'], true],
  ['Ousmane Dembélé', 'France', '🇫🇷', 'Paris Saint-Germain', 'Ligue 1', 'ATT', 3300, ['ucl', 'top-league'], true],
  ['Achraf Hakimi', 'Morocco', '🇲🇦', 'Paris Saint-Germain', 'Ligue 1', 'FB', 3600, ['ucl', 'top-league'], true],
  ['Khvicha Kvaratskhelia', 'Georgia', '🇬🇪', 'Paris Saint-Germain', 'Ligue 1', 'ATT', 3100, ['ucl', 'top-league'], true],
  ['Marquinhos', 'Brazil', '🇧🇷', 'Paris Saint-Germain', 'Ligue 1', 'CB', 3400, ['ucl', 'top-league'], true],
  ['Nuno Mendes', 'Portugal', '🇵🇹', 'Paris Saint-Germain', 'Ligue 1', 'FB', 3300, ['ucl', 'top-league'], true],
  ['João Neves', 'Portugal', '🇵🇹', 'Paris Saint-Germain', 'Ligue 1', 'MID', 3800, ['ucl', 'top-league'], true],
  ['Willian Pacho', 'Ecuador', '🇪🇨', 'Paris Saint-Germain', 'Ligue 1', 'CB', 3500, ['ucl', 'top-league'], true],
  ['Ferran Torres', 'Spain', '🇪🇸', 'Barcelona', 'La Liga', 'ATT', 2800, ['top-league', 'domestic-cup'], false],
  ['Fabián Ruiz', 'Spain', '🇪🇸', 'Paris Saint-Germain', 'Ligue 1', 'MID', 3500, ['ucl', 'top-league'], false],
  ['Vitinha', 'Portugal', '🇵🇹', 'Paris Saint-Germain', 'Ligue 1', 'MID', 3900, ['ucl', 'top-league'], true],
  ['Mohamed Salah', 'Egypt', '🇪🇬', 'Liverpool', 'Premier League', 'ATT', 3600, ['top-league'], true],
  ['Raphinha', 'Brazil', '🇧🇷', 'Barcelona', 'La Liga', 'ATT', 3500, ['top-league', 'domestic-cup'], true],
  ['Pedri', 'Spain', '🇪🇸', 'Barcelona', 'La Liga', 'MID', 3700, ['top-league', 'domestic-cup'], true],
  ['Rodri', 'Spain', '🇪🇸', 'Manchester City', 'Premier League', 'MID', 2600, [], false],
  ['Thibaut Courtois', 'Belgium', '🇧🇪', 'Real Madrid', 'La Liga', 'GK', 3300, ['top-league'], true],
  ['Gianluigi Donnarumma', 'Italy', '🇮🇹', 'Manchester City', 'Premier League', 'GK', 3400, [], true],
  ['Vozinha', 'Cape Verde', '🇨🇻', 'Avaí', 'Brasileirão', 'GK', 2800, ['world-cup'], true],
  ['Alessandro Bastoni', 'Italy', '🇮🇹', 'Inter Milan', 'Serie A', 'CB', 3500, [], false],
  ['Declan Rice', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Arsenal', 'Premier League', 'MID', 3700, [], false],
  ['Bruno Fernandes', 'Portugal', '🇵🇹', 'Manchester United', 'Premier League', 'MID', 3800, [], false],
  ['Lautaro Martínez', 'Argentina', '🇦🇷', 'Inter Milan', 'Serie A', 'ATT', 3200, [], false],
  ['Rúben Dias', 'Portugal', '🇵🇹', 'Manchester City', 'Premier League', 'CB', 3600, [], false],
  ['Michael Olise', 'France', '🇫🇷', 'Bayern Munich', 'Bundesliga', 'ATT', 3400, ['top-league', 'domestic-cup', 'ucl'], false],
].map(([name, country, flag, club, league, role, minutes, trophies, stars]) => ({ name, country, flag, club, league, role, minutes, trophies, stars }));

const WOMEN_ROSTER = [
  ['Alexia Putellas', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'MID', 2800, ['wccl', 'top-league'], true],
  ['Khadija Bunny Shaw', 'Jamaica', '🇯🇲', 'Manchester City', 'WSL', 'ATT', 2200, [], true],
  ['Alessia Russo', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Arsenal', 'WSL', 'ATT', 2600, ['wccl'], true],
  ['Selma Bacha', 'France', '🇫🇷', 'Lyon', 'Première Ligue', 'FB', 2700, ['top-league'], true],
  ['Barbra Banda', 'Zambia', '🇿🇲', 'Orlando Pride', 'NWSL', 'ATT', 2500, [], true],
  ['Klara Buhl', 'Germany', '🇩🇪', 'Bayern Munich', 'Frauen-Bundesliga', 'ATT', 2400, ['top-league'], false],
  ['Esmee Brugts', 'Netherlands', '🇳🇱', 'Barcelona', 'Liga F', 'MID', 2300, ['wccl', 'top-league'], false],
  ['Mariona Caldentey', 'Spain', '🇪🇸', 'Arsenal', 'WSL', 'MID', 2500, ['wccl'], false],
  ['Kiana Correa Camberos', 'Mexico', '🇲🇽', 'Rayadas', 'Liga MX Femenil', 'ATT', 2400, [], false],
  ['Caitlin Casparij', 'Netherlands', '🇳🇱', 'Manchester City', 'WSL', 'FB', 2600, [], false],
  ['Tabitha Chawinga', 'Malawi', '🇲🇼', 'Lyon', 'Première Ligue', 'ATT', 2400, ['top-league'], false],
  ['Sandra Paños Coll', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'GK', 2000, ['wccl', 'top-league'], false],
  ['Melchie Dumornay', 'Haiti', '🇭🇹', 'Lyon', 'Première Ligue', 'MID', 2400, ['top-league'], false],
  ['Caroline Graham Hansen', 'Norway', '🇳🇴', 'Barcelona', 'Liga F', 'ATT', 2600, ['wccl', 'top-league'], true],
  ['Alex Greenwood', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Manchester City', 'WSL', 'CB', 2700, [], true],
  ['Maya Le Tissier Guilbert', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Manchester City', 'WSL', 'CB', 2800, [], true],
  ['Christian Press', 'United States', '🇺🇸', 'Angel City', 'NWSL', 'ATT', 1800, [], false],
  ['Trinity Rodman', 'United States', '🇺🇸', 'Washington Spirit', 'NWSL', 'ATT', 2000, [], false],
  ['Keira Walsh', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Chelsea', 'WSL', 'MID', 2600, ['top-league', 'domestic-cup'], false],
  ['Lauren James', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Chelsea', 'WSL', 'ATT', 2000, ['top-league', 'domestic-cup'], true],
  ['Beth Mead', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Arsenal', 'WSL', 'ATT', 2300, ['wccl'], false],
  ['Lucy Bronze', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Chelsea', 'WSL', 'FB', 2300, ['top-league', 'domestic-cup'], false],
  ['Irene Paredes', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'CB', 2400, ['wccl', 'top-league'], false],
  ['Patri Guijarro', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'MID', 2600, ['wccl', 'top-league'], false],
  ['Clàudia Pina', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'ATT', 2400, ['wccl', 'top-league'], true],
  ['Salma Paralluelo', 'Spain', '🇪🇸', 'Barcelona', 'Liga F', 'ATT', 1900, ['wccl', 'top-league'], false],
  ['Mary Earps', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Paris FC', 'Première Ligue', 'GK', 2200, [], false],
  ['Naomi Girma', 'United States', '🇺🇸', 'Chelsea', 'WSL', 'CB', 2400, ['top-league', 'domestic-cup'], false],
  ['Sakina Karchaoui', 'France', '🇫🇷', 'Lyon', 'Première Ligue', 'FB', 2600, ['top-league'], false],
  ['Lena Oberdorf', 'Germany', '🇩🇪', 'Bayern Munich', 'Frauen-Bundesliga', 'MID', 2200, ['top-league'], false],
].map(([name, country, flag, club, league, role, minutes, trophies, stars]) => ({ name, country, flag, club, league, role, minutes, trophies, stars }));

function buildDataset(edition, roster, seed) {
  const rand = mulberry32(seed);
  return {
    edition,
    season: '2025-26',
    referencePeriod: '2025-08-03 to 2026-07-19',
    status: 'draft',
    note: 'DRAFT dataset: roster names follow the reported 2026 shortlists; stat lines are generated placeholders for engine development. Run the Week 1 FBref/Transfermarkt data pass and replace stats before public launch. See docs/data-refresh.md.',
    players: roster.map((row) => buildPlayer(row, rand, edition)),
  };
}

const men = buildDataset('men', MEN_ROSTER, 42);
const women = buildDataset('women', WOMEN_ROSTER, 1337);

writeFileSync(new URL('../data/men-2026.json', import.meta.url), JSON.stringify(men, null, 2));
writeFileSync(new URL('../data/women-2026.json', import.meta.url), JSON.stringify(women, null, 2));
console.log(`men: ${men.players.length} players, women: ${women.players.length} players`);
