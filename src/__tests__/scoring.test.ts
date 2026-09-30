import { describe, it, expect } from 'vitest';
import {
  conductSummary,
  individualPoints,
  teamPoints,
  scorePlayers,
  ballotPoints,
  formatPoints,
  TROPHY_BASE_POINTS,
  CONDUCT_BASE_POINTS,
} from '../engine/scoring';
import { defaultWeights } from '../engine/presets';
import type { ConductEvent, Player } from '../types';

function makePlayer(overrides: Partial<Player> & { id: string }): Player {
  return {
    name: overrides.id,
    country: 'X',
    flag: '🏳️',
    club: 'C',
    league: 'L',
    role: 'ATT',
    minutes: 3000,
    stats: {},
    trophies: [],
    conductEventIds: [],
    dataConfidence: 'partial',
    ...overrides,
  };
}

describe('individualPoints (direct points model)', () => {
  it('a goal is worth 25 pts at multiplier 1', () => {
    const p = makePlayer({ id: 'a', stats: { goals: 10 } });
    const { perStat } = individualPoints(p, { goals: 1 });
    expect(perStat.goals).toBe(250);
  });

  it('multiplier scales points linearly, 0 kills the stat', () => {
    const p = makePlayer({ id: 'a', stats: { goals: 10 } });
    expect(individualPoints(p, { goals: 3 }).perStat.goals).toBe(750);
    expect(individualPoints(p, { goals: 0 }).perStat.goals).toBe(0);
    expect(individualPoints(p, { goals: 0.5 }).perStat.goals).toBe(125);
  });

  it('per-90 stats are converted to season totals via minutes', () => {
    const p = makePlayer({ id: 'a', minutes: 2700, stats: { dribblesCompleted: 2 } });
    expect(individualPoints(p, { dribblesCompleted: 1 }).perStat.dribblesCompleted).toBe(2 * 30 * 1);
  });

  it('percentage stats are converted to percentage points', () => {
    const p = makePlayer({ id: 'a', role: 'CB', stats: { aerialsWonPct: 0.65 } });
    expect(individualPoints(p, { aerialsWonPct: 1 }).perStat.aerialsWonPct).toBeCloseTo(65 * 1.5, 5);
  });

  it('points resolve to one decimal', () => {
    expect(formatPoints(25 * 0.53)).toBe('13.3');
    expect(formatPoints(12.5 * 3)).toBe('37.5');
  });
});

describe('teamPoints', () => {
  it('a UCL title is worth 200 base pts at multiplier 1 and centrality 1', () => {
    const p = makePlayer({
      id: 'a',
      stats: { teamGoalShare: 0.125 },
      trophies: [{ title: 'UCL', tier: 'ucl' }],
    });
    const mults = { ...defaultWeights().competitionMultipliers, ucl: 1 };
    expect(teamPoints(p, mults)).toBeCloseTo(TROPHY_BASE_POINTS.ucl, 5);
  });

  it('competition multipliers scale trophy points', () => {
    const p = makePlayer({
      id: 'a',
      stats: { teamGoalShare: 0.125 },
      trophies: [{ title: 'UCL', tier: 'ucl' }],
    });
    expect(teamPoints(p, defaultWeights().competitionMultipliers)).toBeCloseTo(
      TROPHY_BASE_POINTS.ucl * 1.3, 5
    );
  });

  it('zero trophies earn zero team points', () => {
    const p = makePlayer({ id: 'a', stats: { teamGoalShare: 0.2 } });
    expect(teamPoints(p, defaultWeights().competitionMultipliers)).toBe(0);
  });
});

describe('conductSummary (fair play points)', () => {
  it('cards deduct direct points', () => {
    const p = makePlayer({ id: 'x', stats: { yellowCards: 4, redCards: 1 } });
    const s = conductSummary(p, [], 1);
    expect(s.cardsPenalty).toBe(
      CONDUCT_BASE_POINTS.yellowCard * 4 + CONDUCT_BASE_POINTS.redCard
    );
  });

  it('conduct events scale by sensitivity, positives stay signed', () => {
    const p = makePlayer({ id: 'x', stats: {} });
    const events: ConductEvent[] = [
      { id: 'a', playerId: 'x', date: '2026-01-01', kind: 'simulation', severity: -2, description: '', source: '' },
      { id: 'b', playerId: 'x', date: '2026-02-01', kind: 'sportsmanship', severity: 1, description: '', source: '' },
    ];
    const s0 = conductSummary(p, events, 0);
    const s2 = conductSummary(p, events, 2);
    expect(s0.eventsPenalty + s0.positiveBonus).toBe(-5);
    expect(s0.rawConduct + 0).toBe(0);
    expect(s2.rawConduct).toBe(-10);
  });
});

describe('scorePlayers', () => {
  const players: Player[] = [
    makePlayer({ id: 'prolific', stats: { goals: 40, xG: 32 } }),
    makePlayer({ id: 'modest', stats: { goals: 10, xG: 12 } }),
    makePlayer({ id: 'mid', stats: { goals: 20, xG: 18 } }),
  ];

  it('ranks the statistically dominant attacker first under defaults', () => {
    const scored = scorePlayers(players, {}, defaultWeights());
    expect(scored[0].player.id).toBe('prolific');
    expect(scored).toHaveLength(3);
  });

  it('fair play weight can reorder players with conduct events', () => {
    const events: Record<string, ConductEvent[]> = {
      prolific: [{ id: 'e1', playerId: 'prolific', date: '2026-01-01', kind: 'violent-conduct', severity: -3, description: '', source: '' }],
    };
    const before = scorePlayers(players, events, defaultWeights());
    const harsh = defaultWeights();
    harsh.blockWeights = { individual: 1, team: 0, fairPlay: 20 };
    harsh.conductSensitivity = 3;
    const after = scorePlayers(players, events, harsh);
    expect(before[0].player.id).toBe('prolific');
    expect(after[0].player.id).not.toBe('prolific');
  });

  it('all-zero block weights fall back to individual order, not dataset order', () => {
    const reversed = [...players].reverse();
    const w = defaultWeights();
    w.blockWeights = { individual: 0, team: 0, fairPlay: 0 };
    const s = scorePlayers(reversed, {}, w);
    expect(s[0].player.id).toBe('prolific');
  });

  it('identical stat lines score equal when opposition sensitivity is 0', () => {
    const pair: Player[] = [
      makePlayer({ id: 'strong-opp', avgOpponentRating: 90, stats: { goals: 30 } }),
      makePlayer({ id: 'weak-opp', avgOpponentRating: 20, stats: { goals: 30 } }),
    ];
    const w = defaultWeights();
    w.oppositionStrengthSensitivity = 0;
    const s = scorePlayers(pair, {}, w);
    expect(Math.abs(s[0].score - s[1].score)).toBeLessThan(0.001);
  });

  it('a goal vs strong opponents outweighs the same vs weak opponents', () => {
    const pair: Player[] = [
      makePlayer({ id: 'strong-opp', avgOpponentRating: 90, stats: { goals: 30 } }),
      makePlayer({ id: 'weak-opp', avgOpponentRating: 20, stats: { goals: 30 } }),
    ];
    const w = defaultWeights();
    w.oppositionStrengthSensitivity = 1;
    const s = scorePlayers(pair, {}, w);
    expect(s[0].player.id).toBe('strong-opp');
  });
});

describe('ballotPoints', () => {
  it('assigns 15, 12, 10 to the podium and 1 beyond tenth', () => {
    expect(ballotPoints(0)).toBe(15);
    expect(ballotPoints(1)).toBe(12);
    expect(ballotPoints(2)).toBe(10);
    expect(ballotPoints(9)).toBe(1);
    expect(ballotPoints(10)).toBe(1);
  });
});
