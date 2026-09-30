import type {
  CompetitionTier,
  ConductEvent,
  Player,
  ScoredPlayer,
  Weights,
} from '../types';
import { ROLE_CATALOGS } from './roleCatalogs';

export const BLOCK_KEYS = ['individual', 'team', 'fairPlay'] as const;

export function percentileWithinGroup(values: number[], index: number): number {
  const v = values[index];
  let below = 0;
  let equal = 0;
  for (const other of values) {
    if (other < v) below++;
    else if (other === v) equal++;
  }
  if (values.length <= 1) return 50;
  return (100 * (below + 0.5 * equal)) / values.length;
}

export function normalizeBlock(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const uniform = 1 / Math.max(1, Object.keys(weights).length);
    return Object.fromEntries(Object.keys(weights).map((k) => [k, uniform]));
  }
  return Object.fromEntries(Object.entries(weights).map(([k, w]) => [k, w / total]));
}

export function competitionMultiplierFor(
  tiers: CompetitionTier[],
  multipliers: Record<CompetitionTier, number>
): number {
  if (tiers.length === 0) return 1;
  const best = tiers.reduce((maxTier, tier) =>
    multipliers[tier] > multipliers[maxTier] ? tier : maxTier
  );
  return multipliers[best];
}

export interface ConductSummary {
  cardsPenalty: number;
  eventsPenalty: number;
  positiveBonus: number;
  rawConduct: number;
}

export function conductSummary(
  player: Player,
  events: ConductEvent[],
  sensitivity: number
): ConductSummary {
  const y = player.stats.yellowCards ?? 0;
  const r = player.stats.redCards ?? 0;
  const y2 = player.stats.secondYellows ?? 0;
  const susp = player.stats.suspensionsServed ?? 0;
  const cardsPenalty = -(0.5 * y + 3 * r + 2 * y2 + 1.5 * susp);

  let eventsPenalty = 0;
  let positiveBonus = 0;
  for (const ev of events) {
    if (ev.severity < 0) eventsPenalty += ev.severity;
    else positiveBonus += ev.severity;
  }
  const rawConduct = cardsPenalty + (eventsPenalty + positiveBonus) * sensitivity;
  return { cardsPenalty, eventsPenalty, positiveBonus, rawConduct };
}

export function scorePlayers(
  players: Player[],
  conductEvents: Record<string, ConductEvent[]>,
  weights: Weights
): ScoredPlayer[] {
  const roleGroups = new Map<string, Player[]>();
  for (const p of players) {
    const list = roleGroups.get(p.role) ?? [];
    list.push(p);
    roleGroups.set(p.role, list);
  }

  const statPercentiles = new Map<string, Record<string, number>>();
  for (const [role, group] of roleGroups) {
    const catalog = ROLE_CATALOGS[role as keyof typeof ROLE_CATALOGS];
    const pct: Record<string, number> = {};
    for (const stat of catalog.stats) {
      const values = group.map((p) => p.stats[stat.key] ?? 0);
      const pcts = group.map((_, i) => percentileWithinGroup(values, i));
      group.forEach((p, i) => {
        pct[`${p.id}:${stat.key}`] = pcts[i];
      });
    }
    for (const p of group) statPercentiles.set(p.id, pct);
  }

  const blockNorm = normalizeBlock({
    individual: weights.blockWeights.individual,
    team: weights.blockWeights.team,
    fairPlay: weights.blockWeights.fairPlay,
  });
  const blockSum = weights.blockWeights.individual + weights.blockWeights.team + weights.blockWeights.fairPlay;

  const results: ScoredPlayer[] = players.map((player) => {
    const catalog = ROLE_CATALOGS[player.role];
    const statW = normalizeBlock(weights.statWeights[player.role] ?? {});

    let individual = 0;
    const myPct = statPercentiles.get(player.id) ?? {};
    for (const stat of catalog.stats) {
      const p = myPct[`${player.id}:${stat.key}`] ?? 50;
      const w = statW[stat.key] ?? 0;
      individual += (p / 100) * w;
    }

    let team = 0;
    for (const trophy of player.trophies) {
      team += competitionMultiplierFor([trophy.tier], weights.competitionMultipliers);
    }
    const teamShare = player.stats.teamGoalShare ?? 0.1;
    team *= 0.7 + 0.6 * Math.min(1.5, Math.max(0, teamShare / 0.25));

    const events = conductEvents[player.id] ?? [];
    const conduct = conductSummary(player, events, weights.conductSensitivity);
    const fairPlay = Math.max(-6, Math.min(6, conduct.rawConduct));

    const pct = (x: number) => 100 * Math.max(0, Math.min(1, x));

    const individualScore = pct(individual * blockNorm.individual * 3);
    const teamScore = pct(team * 0.12 * blockNorm.team * 3);
    const fairPlayScore = pct((0.5 + fairPlay / 12) * blockNorm.fairPlay * 3);

    const score =
      blockSum > 0
        ? (weights.blockWeights.individual * individualScore +
            weights.blockWeights.team * teamScore +
            weights.blockWeights.fairPlay * fairPlayScore) /
          blockSum
        : 0;

    return {
      player,
      score,
      individualScore,
      teamScore,
      fairPlayScore,
      statPercentiles: myPct,
      conductEvents: events,
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

export const BALLOT_POINTS = [15, 12, 10, 7, 5, 4, 3, 2, 1, 1] as const;

export function ballotPoints(rankIndex: number): number {
  return BALLOT_POINTS[rankIndex] ?? (rankIndex >= 10 ? 1 : 0);
}
