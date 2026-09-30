import type { CompetitionTier, Role, Weights } from '../types';
import { ROLE_CATALOGS } from './roleCatalogs';

export const DEFAULT_COMPETITION_MULTIPLIERS: Record<CompetitionTier, number> = {
  'world-cup': 1.5,
  ucl: 1.3,
  wccl: 1.3,
  'top-league': 1.0,
  'other-league': 0.85,
  'domestic-cup': 0.8,
  international: 1.1,
  other: 0.7,
};

function uniformStatWeights(keys: string[], boosts: Record<string, number> = {}): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k, 1 + (boosts[k] ?? 0)]));
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  weights: Weights;
}

export function defaultWeights(): Weights {
  const statWeights = {} as Record<Role, Record<string, number>>;
  for (const role of Object.keys(ROLE_CATALOGS) as Role[]) {
    statWeights[role] = uniformStatWeights(
      ROLE_CATALOGS[role].stats.map((s) => s.key)
    );
  }
  return {
    blockWeights: { individual: 5, team: 3, fairPlay: 1 },
    statWeights,
    competitionMultipliers: { ...DEFAULT_COMPETITION_MULTIPLIERS },
    conductSensitivity: 1,
    oppositionStrengthSensitivity: 0,
  };
}

export const PRESETS: Preset[] = [
  {
    id: 'balanced',
    name: 'Official Order',
    description: "Mirrors the strict Ballon d'Or criteria ranking: individual first, team second, fair play as tiebreaker.",
    weights: defaultWeights(),
  },
  {
    id: 'goalscorer',
    name: 'Goalscorer Logic',
    description: 'Attacking output rules everything. Team success matters, but goals are the currency.',
    weights: (() => {
      const w = defaultWeights();
      w.blockWeights = { individual: 7, team: 2, fairPlay: 1 };
      w.statWeights.ATT = uniformStatWeights(Object.keys(w.statWeights.ATT), { goalsPer90: 2, goals: 2, xG: 1 });
      w.statWeights.MID = uniformStatWeights(Object.keys(w.statWeights.MID), { goals: 2 });
      return w;
    })(),
  },
  {
    id: 'keeper',
    name: 'Keeper Believer',
    description: 'Shot-stoppers get their due: goalkeeping stats boosted, plus a big say for run-to-form campaigns.',
    weights: (() => {
      const w = defaultWeights();
      w.statWeights.GK = uniformStatWeights(Object.keys(w.statWeights.GK), { psxgMinusGa: 2, savePct: 1 });
      w.blockWeights = { individual: 6, team: 3, fairPlay: 1 };
      return w;
    })(),
  },
  {
    id: 'trophy',
    name: 'Trophy First',
    description: 'Collective performances and titles won dominate — the "no trophy, no party" school.',
    weights: (() => {
      const w = defaultWeights();
      w.blockWeights = { individual: 3, team: 7, fairPlay: 1 };
      return w;
    })(),
  },
  {
    id: 'xg-purist',
    name: 'xG Purist',
    description: 'Underlying numbers over narratives: xG/xA and progression metrics lead, raw goals discounted.',
    weights: (() => {
      const w = defaultWeights();
      w.blockWeights = { individual: 8, team: 1, fairPlay: 1 };
      w.statWeights.ATT = uniformStatWeights(Object.keys(w.statWeights.ATT), { xG: 2, xA: 1, goals: -0.5 });
      w.statWeights.MID = uniformStatWeights(Object.keys(w.statWeights.MID), { xA: 2, keyPasses: 1 });
      return w;
    })(),
  },
  {
    id: 'class',
    name: 'Class Above All',
    description: 'Fair play is not a tiebreaker here — conduct and class decide the ranking.',
    weights: (() => {
      const w = defaultWeights();
      w.blockWeights = { individual: 4, team: 2, fairPlay: 5 };
      w.conductSensitivity = 2;
      return w;
    })(),
  },
];
