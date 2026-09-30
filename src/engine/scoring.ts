import type {
  CompetitionTier,
  ConductEvent,
  Player,
  ScoredPlayer,
  Weights,
} from '../types';
import { ROLE_CATALOGS } from './roleCatalogs';

export const BLOCK_KEYS = ['individual', 'team', 'fairPlay'] as const;

export const INDIVIDUAL_SCALE = 1;
export const TEAM_SCALE = 24;
export const FAIR_PLAY_SCALE = 5;

export const TROPHY_BASE_POINTS: Record<CompetitionTier, number> = {
  'world-cup': 300,
  ucl: 200,
  wccl: 200,
  'top-league': 120,
  'other-league': 60,
  'domestic-cup': 50,
  international: 150,
  other: 30,
};

export const CONDUCT_BASE_POINTS = {
  yellowCard: -2.5,
  secondYellow: -10,
  redCard: -15,
  suspensionServed: -7.5,
  eventUnit: 5,
};

function median(values: number[]): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function conductSummary(
  player: Player,
  events: ConductEvent[],
  sensitivity: number
): { cardsPenalty: number; eventsPenalty: number; positiveBonus: number; rawConduct: number } {
  const y = player.stats.yellowCards ?? 0;
  const r = player.stats.redCards ?? 0;
  const y2 = player.stats.secondYellows ?? 0;
  const susp = player.stats.suspensionsServed ?? 0;
  const cardsPenalty =
    CONDUCT_BASE_POINTS.yellowCard * y +
    CONDUCT_BASE_POINTS.redCard * r +
    CONDUCT_BASE_POINTS.secondYellow * y2 +
    CONDUCT_BASE_POINTS.suspensionServed * susp;

  let eventsPenalty = 0;
  let positiveBonus = 0;
  for (const ev of events) {
    const pts = ev.severity * CONDUCT_BASE_POINTS.eventUnit;
    if (ev.severity < 0) eventsPenalty += pts;
    else positiveBonus += pts;
  }
  const rawConduct = cardsPenalty + (eventsPenalty + positiveBonus) * sensitivity;
  return { cardsPenalty, eventsPenalty, positiveBonus, rawConduct };
}

export function statSeasonTotal(player: Player, key: string, basis: 'count' | 'per90' | 'pct'): number {
  const v = player.stats[key] ?? 0;
  if (basis === 'count') return v;
  if (basis === 'per90') return v * (player.minutes / 90);
  return v * 100;
}

export function individualPoints(
  player: Player,
  statMultipliers: Record<string, number>
): { total: number; perStat: Record<string, number> } {
  const catalog = ROLE_CATALOGS[player.role];
  const perStat: Record<string, number> = {};
  let total = 0;
  for (const stat of catalog.stats) {
    const seasonTotal = statSeasonTotal(player, stat.key, stat.basis);
    const mult = statMultipliers[stat.key] ?? 1;
    const pts = seasonTotal * stat.basePoints * mult;
    perStat[stat.key] = pts;
    total += pts;
  }
  return { total, perStat };
}

export function teamPoints(
  player: Player,
  competitionMultipliers: Record<CompetitionTier, number>
): number {
  let total = 0;
  for (const trophy of player.trophies) {
    total += (TROPHY_BASE_POINTS[trophy.tier] ?? 0) * (competitionMultipliers[trophy.tier] ?? 1);
  }
  const teamShare = player.stats.teamGoalShare ?? 0.1;
  return total * (0.7 + 0.6 * Math.min(1.5, Math.max(0, teamShare / 0.25)));
}

export function scorePlayers(
  players: Player[],
  conductEvents: Record<string, ConductEvent[]>,
  weights: Weights
): ScoredPlayer[] {
  const medianOpp = median(players.map((p) => p.avgOpponentRating ?? 50));

  const results: ScoredPlayer[] = players.map((player) => {
    const statMult = weights.statWeights[player.role] ?? {};
    const ind = individualPoints(player, statMult);

    const oppRating = player.avgOpponentRating ?? 50;
    const oppFactor =
      1 + weights.oppositionStrengthSensitivity * ((oppRating - medianOpp) / 100);
    const individualScore = Math.max(0, ind.total * INDIVIDUAL_SCALE * oppFactor);

    const teamScore = teamPoints(player, weights.competitionMultipliers);

    const events = conductEvents[player.id] ?? [];
    const conduct = conductSummary(player, events, weights.conductSensitivity);
    const fairPlayScore = conduct.rawConduct;

    const score =
      weights.blockWeights.individual * individualScore +
      weights.blockWeights.team * teamScore +
      weights.blockWeights.fairPlay * fairPlayScore;

    return {
      player,
      score,
      individualScore,
      teamScore,
      fairPlayScore,
      statPercentiles: ind.perStat,
      conductEvents: events,
    };
  });

  const blockSum =
    weights.blockWeights.individual + weights.blockWeights.team + weights.blockWeights.fairPlay;
  if (blockSum === 0) {
    results.sort((a, b) => b.individualScore - a.individualScore);
  } else {
    results.sort((a, b) => b.score - a.score);
  }
  return results;
}

export const BALLOT_POINTS = [15, 12, 10, 7, 5, 4, 3, 2, 1, 1] as const;

export function ballotPoints(rankIndex: number): number {
  return BALLOT_POINTS[rankIndex] ?? (rankIndex >= 10 ? 1 : 0);
}

export function formatPoints(x: number): string {
  return (Math.round(x * 10) / 10).toFixed(1);
}
