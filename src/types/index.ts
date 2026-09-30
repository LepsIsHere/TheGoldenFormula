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
