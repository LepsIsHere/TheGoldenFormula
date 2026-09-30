# Collecting the real data (the Week 1 data pass)

The app reads everything from three static JSON files. This guide is the exact protocol for filling them with real numbers for the reference period **Aug 3, 2025 – Jul 19, 2026**.

## Where each number comes from

### Player stats → FBref (free, no key)

For each of the 30 shortlisted players per edition, open their FBref player page and read from these tables:

| App field | FBref table | FBref column |
|---|---|---|
| `minutes` | Standard Stats | 90s (×90) or Min |
| `goals` | Standard Stats | Gls |
| `xG` | Standard Stats | xG |
| `assists` | Standard Stats | Ast |
| `xA` | Goal and Shot Creation | xA |
| `shotsOnTarget` | Standard Stats | SoT (per 90: SoT/90) |
| `dribblesCompleted` | Standard Stats | Succ (Take-Ons, per 90) |
| `touchesInBox` | Standard Stats | Touches (Att Pen, per 90) |
| `progressivePasses` | Passing | Prog (per 90) |
| `passesIntoPA` | Passing | 1/3 → use PPatt or Passes into penalty area (per 90) |
| `throughBalls` | Passing | TB (per 90) |
| `keyPasses` | Passing | KP (per 90) |
| `passesAttempted` | Passing | Att (per 90) |
| `passCompletion` | Passing | Cmp% (as 0-1 fraction) |
| `tacklesPer90` | Defensive Actions | Tkl (per 90) |
| `interceptionsPer90` | Defensive Actions | Int (per 90) |
| `blocksPer90` | Defensive Actions | Blocks (per 90) |
| `clearancesPer90` | Defensive Actions | Clr (per 90) |
| `aerialsWonPct` | Defensive Actions | Won% (Aerial Duels, as 0-1) |
| `progressiveCarries` | Possession | CarriesProg (per 90) |
| `passesFinalThird` | Passing | 1/3 (per 90) |
| `duelsWonPct` | Defensive Actions / Possession | duel win % (as 0-1) |
| `tacklesPlusIntPer90` | Defensive Actions | Tkl+Int (per 90) |
| `psxgMinusGa` | **Advanced Goalkeeping** (Goalkeeper tab) | PSxG−GA |
| `savePct` | Advanced Goalkeeping | Save% (as 0-1) — **also on Standard GK stats as Ga/- or PSxG/SoT** |
| `cleanSheets` | Standard GK stats (Goalkeeper tab) | CS |
| `penaltySaves` | Advanced Goalkeeping | PKsvA (penalties saved) |
| `crossesStoppedPct` | Advanced Goalkeeping | Crosses Stopped % (as 0-1) |
| `defActionsOutsideBox` | Advanced Goalkeeping | Def. Actions Outside Box (per 90) |
| `launches` | Advanced Goalkeeping | Launches Completed (per 90) |
| `yellowCards`, `redCards`, `secondYellows` | Standard Stats | CrdY / CrdR / 2CrdY |
| `suspensionsServed` | league/UEFA disciplinary pages | matches served (count) |

**Important conventions** (the engine treats them differently):
- Fields named `*Per90` — enter the **per-90 rate** as shown on FBref; the engine multiplies by minutes.
- Fields named `*Pct` or `%` — enter the **0-1 fraction** (0.71, not 71); the engine ×100s it.
- Everything else is the **season count**.
- Stats must combine **all competitions over the reference period** (FBref shows per-competition rows; sum them, weighting per-90 fields by minutes per competition — or use the "All comps" row where available).

### Trophies → Transfermarkt / club season pages

List what the player actually won in the reference window, as semicolon-separated tiers in the CSV:
`world-cup;ucl;wccl;top-league;other-league;domestic-cup;international;other`
(If a trophy falls outside the tier list, use `other` and note it.)

Also compute `teamGoalShare` = (player's goals+assists) / (team's goals) — a rough centrality measure, 0-1.

### `avgOpponentRating` (for the Advanced mode) — compile or omit

Minutes-weighted average opposition strength, 0-100, where ~50 = edition median. Practical recipe:
1. For each club match, take the opponent's **UEFA club coefficient** (or league strength tier for domestic games: top-5 league opponent ≈ 60-75, mid-tier league ≈ 40-55, etc.).
2. For internationals, use the opponent's **FIFA ranking** mapped to 0-100 (top ≈ 90+).
3. Average weighted by minutes played in each match; include competitions in proportion to the player's participation.
If this is too heavy for v1 of the data pass, leave it at 50 (neutral) — the mode is opt-in and off by default, and you can fill it in later for a subset.

### Conduct log → news search (editorial pass)

Per player, search `"[name]" controversy|dive|simulation|sportsmanship|fair play` restricted to Aug 2025–Jul 2026. Add events to `data/conduct-log.json`:
`{id, playerId (kebab-case name), date, kind, severity (-3..+3), description, source URL}` — one reputable source per event, facts not verdicts.

## Workflow

1. **Fill the CSV** — templates: `data/templates/men-2026.csv`, `data/templates/women-2026.csv` (one row per player, only the columns for their role are needed; the importer ignores irrelevant stat columns).
2. **Import + validate:**
   ```bash
   node scripts/import-csv.mjs data/templates/men-2026.csv data/men-2026.json
   ```
   The importer reports every missing/invalid cell and refuses to write until warnings are resolved (exit code 2).
3. **Check calibration:**
   ```bash
   node scripts/check-calibration.mjs data/men-2026.json
   ```
   This prints the default top 10, per-role point bands, and healthy-range heuristics (GK vs ATT ratio, winner/last ratio, GKs in top 5). If a heuristic is off, adjust the base points in `src/engine/roleCatalogs.ts` — the script's constants are a mirror of the engine's, keep them in sync.
4. **Test + commit:**
   ```bash
   npm test && npm run build
   ```
5. Update the README data-status section and deploy.

## Verification checklist per edition

- [ ] 30 players, roles: GK ≥ 1, no role with < 2 players if avoidable
- [ ] Every role-catalog stat present (importer enforces)
- [ ] Reference period matches (Aug 3, 2025 – Jul 19, 2026)
- [ ] Women's edition: note leagues with thin coverage (`dataNotes` per player)
- [ ] Calibration heuristics all in healthy range
