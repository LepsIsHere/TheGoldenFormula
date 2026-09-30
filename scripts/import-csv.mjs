#!/usr/bin/env node
/**
 * Import a CSV of real player stats into a dataset JSON.
 *
 * Usage:
 *   node scripts/import-csv.mjs data/men-2026-real.csv data/men-2026.json
 *
 * CSV format:
 *   - UTF-8, comma-separated, one header row, one row per player.
 *   - Columns (order flexible, names case-insensitive, extra columns ignored):
 *       id, name, country, flag, club, league, role, minutes,
 *       trophies (semicolon-separated tiers: ucl;top-league;domestic-cup),
 *       yellowCards, redCards, secondYellows, suspensionsServed, teamGoalShare,
 *       avgOpponentRating,
 *       then one column per stat key of the player's role catalog
 *       (see scripts/generate-datasets.mjs or docs/data-refresh.md).
 *   - Missing optional columns / empty cells are allowed; the importer
 *     reports every gap so nothing silently degrades to 0.
 *
 * After import, review the report, then run scripts/check-calibration.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

const STAT_KEYS_BY_ROLE = {
  GK: ['psxgMinusGa','savePct','cleanSheets','penaltySaves','crossesStoppedPct','defActionsOutsideBox','passCompletion','launches'],
  CB: ['tacklesPer90','interceptionsPer90','blocksPer90','clearancesPer90','aerialsWonPct','progressivePasses','passCompletion','passesFinalThird','goals'],
  FB: ['tacklesPer90','interceptionsPer90','aerialsWonPct','progressiveCarries','progressivePasses','assists','xA','keyPasses','passCompletion','goals'],
  MID: ['progressivePasses','passesIntoPA','throughBalls','xA','keyPasses','passesAttempted','duelsWonPct','tacklesPlusIntPer90','goals'],
  ATT: ['goals','xG','assists','xA','shotsOnTarget','dribblesCompleted','touchesInBox'],
};
const DISCIPLINE_KEYS = ['yellowCards','redCards','secondYellows','suspensionsServed','teamGoalShare'];
const TROPHY_TIERS = new Set(['world-cup','ucl','wccl','top-league','other-league','domestic-cup','international','other']);
const ROLES = new Set(Object.keys(STAT_KEYS_BY_ROLE));

const [csvPath, jsonPath] = process.argv.slice(2);
if (!csvPath || !jsonPath) {
  console.error('Usage: node scripts/import-csv.mjs <input.csv> <output.json>');
  process.exit(1);
}

const rows = parseCsv(readFileSync(csvPath, 'utf8'));
const header = rows[0].map(h => h.trim());
const idx = Object.fromEntries(header.map((h, i) => [h.toLowerCase(), i]));
const col = (r, name) => {
  const i = idx[name.toLowerCase()];
  return i === undefined ? undefined : (r[i] ?? '').trim();
};

const dataset = JSON.parse(readFileSync(jsonPath, 'utf8'));
const existing = new Map(dataset.players.map(p => [p.id, p]));
const players = [];
const warnings = [];
let rowIndex = 0;

for (const r of rows.slice(1)) {
  rowIndex++;
  const name = col(r, 'name');
  if (!name) { warnings.push(`row ${rowIndex}: no name, skipped`); continue; }
  const id = col(r, 'id') || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').trim().replace(/ /g, '-');
  const role = (col(r, 'role') || '').toUpperCase();
  if (!ROLES.has(role)) { warnings.push(`${name}: invalid role "${role}", skipped`); continue; }
  const minutes = Number(col(r, 'minutes'));
  if (!Number.isFinite(minutes) || minutes <= 0) warnings.push(`${name}: missing/invalid minutes (${col(r, 'minutes')})`);

  const stats = {};
  for (const key of [...STAT_KEYS_BY_ROLE[role], ...DISCIPLINE_KEYS]) {
    const raw = col(r, key);
    if (raw === undefined || raw === '') { warnings.push(`${name}: missing stat ${key}`); continue; }
    const v = Number(raw);
    if (!Number.isFinite(v)) { warnings.push(`${name}: non-numeric ${key}="${raw}"`); continue; }
    stats[key] = v;
  }

  const trophies = (col(r, 'trophies') || '').split(';').map(t => t.trim()).filter(Boolean);
  for (const t of trophies) if (!TROPHY_TIERS.has(t)) warnings.push(`${name}: unknown trophy tier "${t}"`);

  const prev = existing.get(id);
  players.push({
    id,
    name,
    country: col(r, 'country') || prev?.country || '',
    flag: col(r, 'flag') || prev?.flag || '',
    club: col(r, 'club') || prev?.club || '',
    league: col(r, 'league') || prev?.league || '',
    role,
    minutes: Number.isFinite(minutes) ? minutes : prev?.minutes ?? 0,
    stats,
    trophies: trophies.map(t => ({ title: t, tier: t })),
    conductEventIds: [],
    avgOpponentRating: (() => { const v = Number(col(r, 'avgOpponentRating')); return Number.isFinite(v) ? v : prev?.avgOpponentRating ?? 50; })(),
    dataConfidence: 'full',
    dataNotes: `Imported from ${csvPath.split('/').pop()}`,
  });
}

dataset.players = players;
dataset.status = 'real';
dataset.note = 'Real stats compiled from FBref/Transfermarkt for the Aug 3, 2025 - Jul 19, 2026 reference period. See docs/data-refresh.md for the collection protocol.';
delete dataset.draft;

if (players.length === 0) {
  console.error('No players imported — refusing to overwrite the dataset with an empty import.');
  process.exit(2);
}
if (existing.size > 0 && players.length < existing.size) {
  console.error(`Refusing to write: CSV has ${players.length} players but dataset already has ${existing.size}. ` +
    `If this is intentional (e.g. partial update), clear the dataset first or edit the JSON directly.`);
  process.exit(2);
}

console.log(`Imported ${players.length} players.`);
const roleCount = {};
players.forEach(p => roleCount[p.role] = (roleCount[p.role] || 0) + 1);
console.log('Roles:', JSON.stringify(roleCount));
if (warnings.length) {
  console.log(`\n${warnings.length} warnings:`);
  warnings.forEach(w => console.log('  -', w));
  console.log('\nFix the warnings and re-run before committing.');
  process.exit(2);
}
writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
console.log(`\nWrote ${jsonPath}. Run scripts/check-calibration.mjs next.`);
