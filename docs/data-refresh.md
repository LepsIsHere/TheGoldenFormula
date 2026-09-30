# Data refresh workflow

The app bundles all data as static JSON — no runtime scraping, no backend. Refresh once per season, commit versioned files.

## Files

| File | Contents |
|---|---|
| `data/men-2026.json` | 30-player men's shortlist: identity, role tag, minutes, stat lines, trophies, data confidence |
| `data/women-2026.json` | Same for the women's shortlist |
| `data/conduct-log.json` | Per-player conduct events with severity and source URL |

## Step 1 — Roster

Verify the 30-name shortlists against the **official announcement** (press lists differ slightly in completeness between outlets). Each player needs: name, country, flag emoji, club, league, role tag (GK/CB/FB/MID/ATT), minutes played over the reference period.

## Step 2 — Stat lines (FBref + Transfermarkt)

Export once, clean in a notebook, commit the JSON. Per role:

- **GK:** FBref *Advanced Goalkeeping Stats* — PSxG, PSxG−GA (goals saved above expectation), save %, clean sheets, penalty saves, crosses stopped %, defensive actions outside the box, pass completion, launches.
- **CB / FB:** FBref *Defensive Actions* (tackles, interceptions, blocks, clearances — per 90, possession-adjusted where possible) + *Passing/Progression* (progressive passes/carries, passes into final third, pass %).
- **MID:** FBref *Passing* (progressive passes, passes into penalty area, through balls, volume) + chance creation (xA, key passes) + duels + defensive contribution.
- **ATT:** FBref *Standard Shooting + Goal and Shot Creation* — goals, xG, assists, xA, shots on target, dribbles, touches in box.

Also record `teamGoalShare` (player's share of team goal contributions) for the team-centrality factor, and card/suspension counts for the fair-play baseline.

Women's edition: same tables for WSL / Première Ligue / Women's Champions League and any covered league; fall back to national-team stats where league coverage is thin, and set `dataConfidence: "partial"` with a `dataNotes` explanation.

Recommended tooling: [worldfootballR](https://jaseziv.github.io/worldfootballR/articles/extract-fbref-data.html) (R) or equivalent Python scrapers; or manual entry for 60 players — one focused day.

**Trophies** (Transfermarkt): title + competition tier (`world-cup`, `ucl`, `wccl`, `top-league`, `other-league`, `domestic-cup`, `international`, `other`).

## Step 3 — Conduct log (editorial pass)

News-search per shortlisted player: `"[name] controversy|dive|sportsmanship" Aug 2025..Jul 2026`. Encode as:

```json
{
  "id": "unique-id",
  "playerId": "kebab-case-player-id",
  "date": "YYYY-MM-DD",
  "kind": "simulation|dissent|violent-conduct|off-pitch-controversy|sportsmanship|community-work|fair-play-recognition",
  "severity": -3,
  "description": "One-line factual description.",
  "source": "https://reputable-outlet.example/article"
}
```

Rules: one reputable source per event; describe facts, not verdicts; severity in −3…+3; community edits via PR are welcome.

## Step 4 — Validate

```bash
npm test          # engine recomputes; smoke tests render both editions
npm run build
```

Then update the README data-status section and ship.
