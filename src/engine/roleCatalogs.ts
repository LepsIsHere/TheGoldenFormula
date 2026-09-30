import type { RoleCatalog, Role } from '../types';

const gk: RoleCatalog = {
  role: 'GK',
  label: 'Goalkeepers',
  stats: [
    { key: 'psxgMinusGa', label: 'Goals saved above expectation (PSxG−GA)', higherIsBetter: true, per90: false, description: 'Post-shot xG minus goals allowed. The standard shot-stopping quality metric: judges keepers on shot quality faced, not volume of routine saves.' },
    { key: 'savePct', label: 'Save %', higherIsBetter: true, per90: false, description: 'Saves / shots on target faced.' },
    { key: 'cleanSheets', label: 'Clean sheets', higherIsBetter: true, per90: false, description: 'Matches with no goals allowed.' },
    { key: 'penaltySaves', label: 'Penalty saves', higherIsBetter: true, per90: false, description: 'Penalties saved (FBref logs PSvA).' },
    { key: 'crossesStoppedPct', label: 'Crosses stopped %', higherIsBetter: true, per90: false, description: 'Share of crosses claimed.' },
    { key: 'defActionsOutsideBox', label: 'Sweeper actions outside box (per 90)', higherIsBetter: true, per90: true, description: 'Defensive actions outside the penalty area — modern sweeping.' },
    { key: 'passCompletion', label: 'Pass completion %', higherIsBetter: true, per90: false, description: 'Ball-playing reliability under pressure.' },
    { key: 'launches', label: 'Launches completed (per 90)', higherIsBetter: true, per90: true, description: 'Long passes attempted beyond 40 yards.' },
  ],
};

const cb: RoleCatalog = {
  role: 'CB',
  label: 'Centre-backs',
  stats: [
    { key: 'tacklesPer90', label: 'Tackles (per 90)', higherIsBetter: true, per90: true, description: 'Possession- and per-90 adjusted: raw defensive counts inflate for players on teams that defend more.' },
    { key: 'interceptionsPer90', label: 'Interceptions (per 90)', higherIsBetter: true, per90: true, description: 'Reading of play, normalized per 90.' },
    { key: 'blocksPer90', label: 'Blocks (per 90)', higherIsBetter: true, per90: true, description: 'Shot and pass blocks combined.' },
    { key: 'clearancesPer90', label: 'Clearances (per 90)', higherIsBetter: true, per90: true, description: 'Volume of area-clearing actions.' },
    { key: 'aerialsWonPct', label: 'Aerials won %', higherIsBetter: true, per90: false, description: 'Duels won in the air.' },
    { key: 'progressivePasses', label: 'Progressive passes (per 90)', higherIsBetter: true, per90: true, description: 'Ball-playing value — modern centre-backs are primary progressors.' },
    { key: 'passCompletion', label: 'Pass completion %', higherIsBetter: true, per90: false, description: 'Distribution reliability.' },
    { key: 'passesFinalThird', label: 'Passes into final third (per 90)', higherIsBetter: true, per90: true, description: 'Line-breaking distribution.' },
  ],
};

const fb: RoleCatalog = {
  role: 'FB',
  label: 'Full-backs / wing-backs',
  stats: [
    { key: 'tacklesPer90', label: 'Tackles (per 90)', higherIsBetter: true, per90: true, description: 'Defensive volume, possession- and per-90 adjusted.' },
    { key: 'interceptionsPer90', label: 'Interceptions (per 90)', higherIsBetter: true, per90: true, description: 'Reading of play.' },
    { key: 'aerialsWonPct', label: 'Aerials won %', higherIsBetter: true, per90: false, description: 'Aerial duels won.' },
    { key: 'progressiveCarries', label: 'Progressive carries (per 90)', higherIsBetter: true, per90: true, description: 'Advancing the ball by foot.' },
    { key: 'progressivePasses', label: 'Progressive passes (per 90)', higherIsBetter: true, per90: true, description: 'Advancing the ball by pass.' },
    { key: 'assists', label: 'Assists', higherIsBetter: true, per90: false, description: 'Attacking output from wide areas.' },
    { key: 'xA', label: 'Expected assists (xA)', higherIsBetter: true, per90: false, description: 'Chance creation quality.' },
    { key: 'keyPasses', label: 'Key passes (per 90)', higherIsBetter: true, per90: true, description: 'Passes leading to a shot.' },
    { key: 'passCompletion', label: 'Pass completion %', higherIsBetter: true, per90: false, description: 'Distribution reliability.' },
  ],
};

const mid: RoleCatalog = {
  role: 'MID',
  label: 'Midfielders',
  stats: [
    { key: 'progressivePasses', label: 'Progressive passes (per 90)', higherIsBetter: true, per90: true, description: 'Territorial advancement by pass.' },
    { key: 'passesIntoPA', label: 'Passes into penalty area (per 90)', higherIsBetter: true, per90: true, description: 'Penetrating distribution.' },
    { key: 'throughBalls', label: 'Through balls (per 90)', higherIsBetter: true, per90: true, description: 'Line-breaking final passes.' },
    { key: 'xA', label: 'Expected assists (xA)', higherIsBetter: true, per90: false, description: 'Chance creation quality.' },
    { key: 'keyPasses', label: 'Key passes (per 90)', higherIsBetter: true, per90: true, description: 'Passes leading to a shot.' },
    { key: 'passesAttempted', label: 'Passes attempted (per 90)', higherIsBetter: true, per90: true, description: 'Volume — deep-lying playmakers dominate the ball.' },
    { key: 'duelsWonPct', label: 'Duels won %', higherIsBetter: true, per90: false, description: 'Ground and aerial duel efficiency.' },
    { key: 'tacklesPlusIntPer90', label: 'Tackles + interceptions (per 90)', higherIsBetter: true, per90: true, description: 'Defensive contribution.' },
    { key: 'goals', label: 'Goals (per 90)', higherIsBetter: true, per90: true, description: 'Rare for the role — within-group percentile already handles the rarity.' },
  ],
};

const att: RoleCatalog = {
  role: 'ATT',
  label: 'Attackers',
  stats: [
    { key: 'goalsPer90', label: 'Goals (per 90)', higherIsBetter: true, per90: true, description: 'Scoring rate normalized for minutes.' },
    { key: 'goals', label: 'Goals', higherIsBetter: true, per90: false, description: 'Raw scoring volume.' },
    { key: 'xG', label: 'Expected goals (xG)', higherIsBetter: true, per90: false, description: 'Chance quality generated.' },
    { key: 'assists', label: 'Assists', higherIsBetter: true, per90: false, description: 'Creation volume.' },
    { key: 'xA', label: 'Expected assists (xA)', higherIsBetter: true, per90: false, description: 'Creation quality.' },
    { key: 'shotsOnTarget', label: 'Shots on target (per 90)', higherIsBetter: true, per90: true, description: 'Volume and accuracy of shooting.' },
    { key: 'dribblesCompleted', label: 'Dribbles completed (per 90)', higherIsBetter: true, per90: true, description: 'One-v-one output.' },
    { key: 'touchesInBox', label: 'Touches in box (per 90)', higherIsBetter: true, per90: true, description: 'Presence where goals happen.' },
  ],
};

export const ROLE_CATALOGS: Record<Role, RoleCatalog> = { GK: gk, CB: cb, FB: fb, MID: mid, ATT: att };

export const ROLE_ORDER: Role[] = ['GK', 'CB', 'FB', 'MID', 'ATT'];
