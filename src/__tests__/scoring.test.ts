import { describe, it, expect } from 'vitest';
import {
  percentileWithinGroup,
  normalizeBlock,
  competitionMultiplierFor,
  conductSummary,
  scorePlayers,
  ballotPoints,
} from '../engine/scoring';
import { defaultWeights } from '../engine/presets';
import type { ConductEvent, Player, Weights } from '../types';

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

describe('percentileWithinGroup', () => {
  it('gives the lowest value a low nonzero percentile', () => {
    const values = [1, 2, 3, 4, 5];
    expect(percentileWithinGroup(values, 0)).toBe(10);
  });

  it('gives the top value a high percentile', () => {
    const values = [1, 2, 3, 4, 5];
    expect(percentileWithinGroup(values, 4)).toBe(90);
  });

  it('handles ties at the midpoint', () => {
    const values = [2, 2, 2];
    expect(percentileWithinGroup(values, 0)).toBe(50);
  });

  it('returns 50 for a singleton group', () => {
    expect(percentileWithinGroup([7], 0)).toBe(50);
  });
});

describe('normalizeBlock', () => {
  it('normalizes weights to sum to 1', () => {
    const n = normalizeBlock({ a: 2, b: 2 });
    expect(n.a).toBeCloseTo(0.5);
    expect(n.b).toBeCloseTo(0.5);
  });

  it('falls back to uniform when all zero', () => {
    const n = normalizeBlock({ a: 0, b: 0 });
    expect(n.a).toBeCloseTo(0.5);
  });
});

describe('competitionMultiplierFor', () => {
  it('uses the highest-tier multiplier among trophies', () => {
    const m = competitionMultiplierFor(['ucl', 'top-league', 'domestic-cup'], {
      ucl: 1.3, 'top-league': 1, 'domestic-cup': 0.8,
    } as Weights['competitionMultipliers']);
    expect(m).toBe(1.3);
  });

  it('defaults to 1 with no trophies', () => {
    expect(competitionMultiplierFor([], {} as Weights['competitionMultipliers'])).toBe(1);
  });
});

describe('conductSummary', () => {
  it('penalizes cards quantitatively', () => {
    const p = makePlayer({ id: 'x', stats: { yellowCards: 4, redCards: 1 } });
    const s = conductSummary(p, [], 1);
    expect(s.cardsPenalty).toBe(-(0.5 * 4 + 3 * 1));
  });

  it('scales event penalties by sensitivity and keeps positives signed', () => {
    const p = makePlayer({ id: 'x', stats: {} });
    const events: ConductEvent[] = [
      { id: 'a', playerId: 'x', date: '2026-01-01', kind: 'simulation', severity: -2, description: '', source: '' },
      { id: 'b', playerId: 'x', date: '2026-02-01', kind: 'sportsmanship', severity: 1, description: '', source: '' },
    ];
    const s0 = conductSummary(p, events, 0);
    const s2 = conductSummary(p, events, 2);
    expect(s0.eventsPenalty + s0.positiveBonus).toBe(-1);
    expect(s0.rawConduct).toBe(-0);
    expect(s2.rawConduct).toBe(-2);
  });
});

describe('scorePlayers', () => {
  const players: Player[] = [
    makePlayer({ id: 'a', role: 'ATT', stats: { goals: 40, goalsPer90: 1.0, xG: 35, assists: 10, xA: 0.5, shotsOnTarget: 2.5, dribblesCompleted: 2, touchesInBox: 9 } }),
    makePlayer({ id: 'b', role: 'ATT', stats: { goals: 10, goalsPer90: 0.4, xG: 12, assists: 4, xA: 0.2, shotsOnTarget: 1.2, dribblesCompleted: 1, touchesInBox: 5 } }),
    makePlayer({ id: 'c', role: 'ATT', stats: { goals: 20, goalsPer90: 0.7, xG: 18, assists: 8, xA: 0.4, shotsOnTarget: 1.8, dribblesCompleted: 1.5, touchesInBox: 7 } }),
  ];

  it('ranks the statistically dominant attacker first under defaults', () => {
    const scored = scorePlayers(players, {}, defaultWeights());
    expect(scored[0].player.id).toBe('a');
    expect(scored).toHaveLength(3);
  });

  it('scores are finite and non-negative', () => {
    const scored = scorePlayers(players, {}, defaultWeights());
    for (const s of scored) {
      expect(Number.isFinite(s.score)).toBe(true);
      expect(s.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('fair play weight can reorder players with conduct events', () => {
    const withEvent = players.map((p) =>
      p.id === 'a'
        ? { ...p, stats: { ...p.stats, yellowCards: 0, redCards: 0, suspensionsServed: 0 } }
        : p
    );
    const events: Record<string, ConductEvent[]> = {
      a: [{ id: 'e1', playerId: 'a', date: '2026-01-01', kind: 'violent-conduct', severity: -3, description: '', source: '' }],
    };
    const neutral = defaultWeights();
    const harsh = defaultWeights();
    harsh.blockWeights = { individual: 4, team: 2, fairPlay: 8 };
    harsh.conductSensitivity = 3;

    const before = scorePlayers(withEvent, events, neutral);
    const after = scorePlayers(withEvent, events, harsh);
    expect(before[0].player.id).toBe('a');
    expect(after[0].player.id).not.toBe('a');
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
