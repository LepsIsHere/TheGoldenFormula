#!/usr/bin/env node
/**
 * Calibration report: run after any data import to verify the base-point
 * prices still produce a realistic leaderboard. Pure Node (no build step):
 * mirrors the engine's scoring so it can run standalone.
 *
 * Usage: node scripts/check-calibration.mjs data/men-2026.json
 */
import { readFileSync } from 'node:fs';

const BASE = {
  GK: { psxgMinusGa: ['count',15], savePct: ['pct',0.75], cleanSheets: ['count',4], penaltySaves: ['count',20], crossesStoppedPct: ['pct',0.75], defActionsOutsideBox: ['per90',1], passCompletion: ['pct',0.25], launches: ['per90',0.1] },
  CB: { tacklesPer90: ['per90',1.5], interceptionsPer90: ['per90',1.5], blocksPer90: ['per90',1.5], clearancesPer90: ['per90',0.5], aerialsWonPct: ['pct',1.5], progressivePasses: ['per90',0.5], passCompletion: ['pct',0.5], passesFinalThird: ['per90',0.75], goals: ['count',25] },
  FB: { tacklesPer90: ['per90',1.5], interceptionsPer90: ['per90',1.5], aerialsWonPct: ['pct',1], progressiveCarries: ['per90',0.75], progressivePasses: ['per90',0.5], assists: ['count',12.5], xA: ['count',15], keyPasses: ['per90',1.5], passCompletion: ['pct',0.5], goals: ['count',25] },
  MID: { progressivePasses: ['per90',0.5], passesIntoPA: ['per90',2], throughBalls: ['per90',5], xA: ['count',15], keyPasses: ['per90',2.5], passesAttempted: ['per90',0.1], duelsWonPct: ['pct',2.5], tacklesPlusIntPer90: ['per90',2], goals: ['count',25] },
  ATT: { goals: ['count',25], xG: ['count',10], assists: ['count',12.5], xA: ['count',15], shotsOnTarget: ['per90',1], dribblesCompleted: ['per90',1], touchesInBox: ['per90',0.25] },
};
const TROPHY_POINTS = { 'world-cup': 300, ucl: 200, wccl: 200, 'top-league': 120, 'other-league': 60, 'domestic-cup': 50, international: 150, other: 30 };

const [jsonPath] = process.argv.slice(2);
if (!jsonPath) { console.error('Usage: node scripts/check-calibration.mjs <dataset.json>'); process.exit(1); }

const dataset = JSON.parse(readFileSync(jsonPath, 'utf8'));
const rows = dataset.players.map(p => {
  let ind = 0;
  for (const [key, [basis, pts]] of Object.entries(BASE[p.role])) {
    const v = p.stats[key] ?? 0;
    const total = basis === 'count' ? v : basis === 'per90' ? v * (p.minutes / 90) : v * 100;
    ind += total * pts;
  }
  let team = 0;
  for (const t of p.trophies) team += TROPHY_POINTS[t.tier] ?? 0;
  const share = p.stats.teamGoalShare ?? 0.1;
  team *= 0.7 + 0.6 * Math.min(1.5, Math.max(0, share / 0.25));
  return { name: p.name, role: p.role, ind, team, score: 5 * ind + 3 * team };
});
rows.sort((a, b) => b.score - a.score);

const med = arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const byRole = {};
rows.forEach(r => (byRole[r.role] ??= []).push(r.ind));

console.log(`=== ${dataset.edition} — calibration report (weights 5/3/1, multipliers ×1) ===\n`);
console.log('TOP 10:');
rows.slice(0, 10).forEach((r, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${r.name.padEnd(26)} IND ${r.ind.toFixed(0).padStart(6)}  TEAM ${r.team.toFixed(0).padStart(5)}  => ${r.score.toFixed(0)}`));
console.log(`  ...`);
console.log(`  30. ${rows[rows.length - 1].name.padEnd(26)} ${rows[rows.length - 1].score.toFixed(0)}`);
console.log('\nIND points by role (min / median / max):');
for (const [role, arr] of Object.entries(byRole))
  console.log(`  ${role.padEnd(4)} ${Math.min(...arr).toFixed(0).padStart(6)} / ${med(arr).toFixed(0).padStart(6)} / ${Math.max(...arr).toFixed(0).padStart(6)}`);

console.log('\nHeuristics:');
const attMed = med(byRole.ATT || [0]);
const gkMed = med(byRole.GK || [0]);
const midMed = med(byRole.MID || [0]);
console.log(`  GK median vs ATT median: ${(gkMed / attMed).toFixed(2)} (healthy: 0.4-0.9)`);
console.log(`  MID median vs ATT median: ${(midMed / attMed).toFixed(2)} (healthy: 0.6-1.0)`);
const spread = rows[0].score / rows[rows.length - 1].score;
console.log(`  Winner / last-place ratio: ${spread.toFixed(1)} (healthy: 2.0-4.0)`);
const gkTop = rows.slice(0, 5).filter(r => r.role === 'GK').length;
console.log(`  GKs in top 5: ${gkTop} (healthy: 0-1)`);
