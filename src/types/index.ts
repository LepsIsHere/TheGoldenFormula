export type Role = 'GK' | 'CB' | 'FB' | 'MID' | 'ATT';
export type Edition = 'men' | 'women';
export type CompetitionTier =
  | 'world-cup'
  | 'ucl'
  | 'wccl'
  | 'top-league'
  | 'other-league'
  | 'domestic-cup'
  | 'international'
  | 'other';

export interface Trophy {
  title: string;
  tier: CompetitionTier;
}

export interface Player {
  id: string;
  name: string;
  country: string;
  flag: string;
  club: string;
  league: string;
  role: Role;
  minutes: number;
  stats: Record<string, number>;
  trophies: Trophy[];
  conductEventIds: string[];
  dataConfidence: 'full' | 'partial';
  dataNotes?: string;
  /**
   * Average opposition strength over the reference period, 0-100.
   * Compiled at data time from UEFA club coefficients and FIFA-SEP-style
   * national rankings: each opponent match is scored (e.g. UEFA coefficient
   * percentile for clubs, FIFA ranking-derived strength for national teams),
   * then averaged per player weighted by minutes. 50 ≈ edition median.
   */
  avgOpponentRating?: number;
}

export interface Dataset {
  edition: Edition;
  season: string;
  referencePeriod: string;
  players: Player[];
}

export type ConductKind =
  | 'simulation'
  | 'dissent'
  | 'violent-conduct'
  | 'off-pitch-controversy'
  | 'sportsmanship'
  | 'community-work'
  | 'fair-play-recognition';

export interface ConductEvent {
  id: string;
  playerId: string;
  date: string;
  kind: ConductKind;
  severity: number;
  description: string;
  source: string;
}

export interface Weights {
  blockWeights: { individual: number; team: number; fairPlay: number };
  statWeights: Record<Role, Record<string, number>>;
  competitionMultipliers: Record<CompetitionTier, number>;
  conductSensitivity: number;
  /** 0 = off (opposition strength ignored); 1 = full effect. */
  oppositionStrengthSensitivity: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  weights: Weights;
}

export interface ScoredPlayer {
  player: Player;
  score: number;
  individualScore: number;
  teamScore: number;
  fairPlayScore: number;
  statPercentiles: Record<string, number>;
  conductEvents: ConductEvent[];
}

export interface StatDefinition {
  key: string;
  label: string;
  higherIsBetter: boolean;
  per90: boolean;
  description: string;
}

export interface RoleCatalog {
  role: Role;
  label: string;
  stats: StatDefinition[];
}
