import type { RoleCatalog, Role } from '../types';

const gk: RoleCatalog = {
  role: 'GK',
  label: 'Goalkeepers',
  stats: [
    { key: 'psxgMinusGa', label: 'Goals saved above expectation (PSxG−GA)', higherIsBetter: true, basis: 'count', basePoints: 15, description: '15 pts per goal saved above expectation — the keeper-quality metric that is most solo.' },
    { key: 'savePct', label: 'Save %', higherIsBetter: true, basis: 'pct', basePoints: 0.75, description: '0.75 pts per percentage point of save rate.' },
    { key: 'cleanSheets', label: 'Clean sheets', higherIsBetter: true, basis: 'count', basePoints: 4, description: '4 pts per shutout — shared with the defense, priced accordingly.' },
    { key: 'penaltySaves', label: 'Penalty saves', higherIsBetter: true, basis: 'count', basePoints: 20, description: '20 pts per penalty stopped — the "amazing goal save".' },
    { key: 'crossesStoppedPct', label: 'Crosses stopped %', higherIsBetter: true, basis: 'pct', basePoints: 0.75, description: '0.75 pts per percentage point of crosses claimed.' },
    { key: 'defActionsOutsideBox', label: 'Sweeper actions outside box', higherIsBetter: true, basis: 'per90', basePoints: 1, description: '1 pt per defensive action outside the penalty area.' },
    { key: 'passCompletion', label: 'Pass completion %', higherIsBetter: true, basis: 'pct', basePoints: 0.25, description: '0.25 pts per percentage point — ball-playing reliability.' },
    { key: 'launches', label: 'Launches completed', higherIsBetter: true, basis: 'per90', basePoints: 0.1, description: '0.1 pts per long pass completed beyond 40 yards.' },
  ],
};

const cb: RoleCatalog = {
  role: 'CB',
  label: 'Centre-backs',
  stats: [
    { key: 'tacklesPer90', label: 'Tackles', higherIsBetter: true, basis: 'per90', basePoints: 1.5, description: '1.5 pts per tackle over the season.' },
    { key: 'interceptionsPer90', label: 'Interceptions', higherIsBetter: true, basis: 'per90', basePoints: 1.5, description: '1.5 pts per interception.' },
    { key: 'blocksPer90', label: 'Blocks', higherIsBetter: true, basis: 'per90', basePoints: 1.5, description: '1.5 pts per block.' },
    { key: 'clearancesPer90', label: 'Clearances', higherIsBetter: true, basis: 'per90', basePoints: 0.5, description: '0.5 pts per clearance.' },
    { key: 'aerialsWonPct', label: 'Aerials won %', higherIsBetter: true, basis: 'pct', basePoints: 1.5, description: '1.5 pts per percentage point of aerial duels won.' },
    { key: 'progressivePasses', label: 'Progressive passes', higherIsBetter: true, basis: 'per90', basePoints: 0.5, description: '0.5 pts per progressive pass — ball-playing value.' },
    { key: 'passCompletion', label: 'Pass completion %', higherIsBetter: true, basis: 'pct', basePoints: 0.5, description: '0.5 pts per percentage point.' },
    { key: 'passesFinalThird', label: 'Passes into final third', higherIsBetter: true, basis: 'per90', basePoints: 0.75, description: '0.75 pts per pass into the final third.' },
    { key: 'goals', label: 'Goals', higherIsBetter: true, basis: 'count', basePoints: 25, description: '25 pts per goal — a centre-back scoring is gold.' },
  ],
};

const fb: RoleCatalog = {
  role: 'FB',
  label: 'Full-backs / wing-backs',
  stats: [
    { key: 'tacklesPer90', label: 'Tackles', higherIsBetter: true, basis: 'per90', basePoints: 1.5, description: '1.5 pts per tackle over the season.' },
    { key: 'interceptionsPer90', label: 'Interceptions', higherIsBetter: true, basis: 'per90', basePoints: 1.5, description: '1.5 pts per interception.' },
    { key: 'aerialsWonPct', label: 'Aerials won %', higherIsBetter: true, basis: 'pct', basePoints: 1, description: '1 pt per percentage point.' },
    { key: 'progressiveCarries', label: 'Progressive carries', higherIsBetter: true, basis: 'per90', basePoints: 0.75, description: '0.75 pts per progressive carry.' },
    { key: 'progressivePasses', label: 'Progressive passes', higherIsBetter: true, basis: 'per90', basePoints: 0.5, description: '0.5 pts per progressive pass.' },
    { key: 'assists', label: 'Assists', higherIsBetter: true, basis: 'count', basePoints: 12.5, description: '12.5 pts per assist.' },
    { key: 'xA', label: 'Expected assists (xA)', higherIsBetter: true, basis: 'count', basePoints: 15, description: '15 pts per expected assist.' },
    { key: 'keyPasses', label: 'Key passes', higherIsBetter: true, basis: 'per90', basePoints: 2.5, description: '2.5 pts per key pass.' },
    { key: 'passCompletion', label: 'Pass completion %', higherIsBetter: true, basis: 'pct', basePoints: 0.5, description: '0.5 pts per percentage point.' },
    { key: 'goals', label: 'Goals', higherIsBetter: true, basis: 'count', basePoints: 25, description: '25 pts per goal.' },
  ],
};

const mid: RoleCatalog = {
  role: 'MID',
  label: 'Midfielders',
  stats: [
    { key: 'progressivePasses', label: 'Progressive passes', higherIsBetter: true, basis: 'per90', basePoints: 0.5, description: '0.5 pts per progressive pass.' },
    { key: 'passesIntoPA', label: 'Passes into penalty area', higherIsBetter: true, basis: 'per90', basePoints: 2, description: '2 pts per pass into the box.' },
    { key: 'throughBalls', label: 'Through balls', higherIsBetter: true, basis: 'per90', basePoints: 5, description: '5 pts per through ball — the rare line-breaker.' },
    { key: 'xA', label: 'Expected assists (xA)', higherIsBetter: true, basis: 'count', basePoints: 15, description: '15 pts per expected assist.' },
    { key: 'keyPasses', label: 'Key passes', higherIsBetter: true, basis: 'per90', basePoints: 2.5, description: '2.5 pts per key pass.' },
    { key: 'passesAttempted', label: 'Passes attempted', higherIsBetter: true, basis: 'per90', basePoints: 0.1, description: '0.1 pts per pass — volume for deep-lying playmakers.' },
    { key: 'duelsWonPct', label: 'Duels won %', higherIsBetter: true, basis: 'pct', basePoints: 2.5, description: '2.5 pts per percentage point.' },
    { key: 'tacklesPlusIntPer90', label: 'Tackles + interceptions', higherIsBetter: true, basis: 'per90', basePoints: 2, description: '2 pts per defensive action.' },
    { key: 'goals', label: 'Goals', higherIsBetter: true, basis: 'count', basePoints: 25, description: '25 pts per goal.' },
  ],
};

const att: RoleCatalog = {
  role: 'ATT',
  label: 'Attackers',
  stats: [
    { key: 'goals', label: 'Goals', higherIsBetter: true, basis: 'count', basePoints: 25, description: '25 pts per goal.' },
    { key: 'xG', label: 'Expected goals (xG)', higherIsBetter: true, basis: 'count', basePoints: 10, description: '10 pts per expected goal.' },
    { key: 'assists', label: 'Assists', higherIsBetter: true, basis: 'count', basePoints: 12.5, description: '12.5 pts per assist.' },
    { key: 'xA', label: 'Expected assists (xA)', higherIsBetter: true, basis: 'count', basePoints: 15, description: '15 pts per expected assist.' },
    { key: 'shotsOnTarget', label: 'Shots on target', higherIsBetter: true, basis: 'per90', basePoints: 1, description: '1 pt per shot on target.' },
    { key: 'dribblesCompleted', label: 'Dribbles completed', higherIsBetter: true, basis: 'per90', basePoints: 1, description: '1 pt per dribble completed.' },
    { key: 'touchesInBox', label: 'Touches in box', higherIsBetter: true, basis: 'per90', basePoints: 0.25, description: '0.25 pts per touch in the opposition box.' },
  ],
};

export const ROLE_CATALOGS: Record<Role, RoleCatalog> = { GK: gk, CB: cb, FB: fb, MID: mid, ATT: att };

export const ROLE_ORDER: Role[] = ['GK', 'CB', 'FB', 'MID', 'ATT'];
