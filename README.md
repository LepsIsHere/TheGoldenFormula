# The Golden Formula — Ballon d'Or Lab

**Build your own Ballon d'Or.** A public web app where you set quantitative weights on player statistics — adjusted by role, league, and competition context — and watch a live top-30 Ballon d'Or leaderboard re-rank in real time. Both the **men's** and **women's** 2026 editions are in scope; you choose at the start.

## How it works

The app mirrors the three official Ballon d'Or criteria, in their strict order of importance ([official regulations](https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy)):

1. **Individual performances** — decisive and impressive character
2. **Collective performances & titles won**
3. **Class & fair play**

Each is a weighted block in the UI. Inside Block 1, the stats you can weight depend on the player's role — five role groups, each with its own stat catalog, weights, and normalization group:

| Role | Exclusive headline stats |
|---|---|
| **GK** | Goals saved above expectation (PSxG − GA), save %, penalty saves, sweeper actions |
| **CB** | Possession- and per-90-adjusted defensive actions + progression (ball-playing value) |
| **FB** | Defensive actions + an attacking sub-catalog (assists, xA, key passes, carries) |
| **MID** | Progression, chance creation (xA, key passes), duel %, defensive contribution |
| **ATT** | Goals, xG, xA, shots on target, dribbles, touches in box |

The quant core is **role-relative normalization**: each stat is converted to a percentile *within the role group*, so a keeper's shot-stopping never competes with a striker's goals. Competition multipliers (World Cup > UCL/WCCL > top leagues > other) handle context; per-90 normalization handles minutes.

**Fair play uses a hybrid model.** Cards and suspensions are the quantitative floor. Beyond that, no stat feed captures "class and drama" — so each player can carry a sourced [conduct event log](data/conduct-log.json): on-pitch controversies, dives, referee abuse, off-pitch incidents (negative) and acts of sportsmanship or fair-play recognition (positive), each with a linked source so *you* judge credibility. A severity-sensitivity slider scales the events; clicking a player's ⚑ shows the evidence.

## Features

- Men's / Women's edition selector — same engine, both shortlists
- Three criteria blocks in the official order, with role-tabbed stat sliders
- Live re-ranking: every slider tick recomputes all 60 scores instantly, with movement arrows
- Presets: *Official Order*, *Goalscorer Logic*, *Keeper Believer*, *Trophy First*, *xG Purist*, *Class Above All*
- Ballot-points mode (15-12-10-7-5-4-3-2-1-1) matching the real voting system
- Shareable URL hash (edition + weights), text & JSON export
- Clickable fair-play flags with sourced events

## ⚠️ Data status: PARTIAL REAL

The rosters match the **official 2026 shortlists** (announced 8 Sep 2026), with verified clubs, leagues, roles and 2025–26 trophies. Real all-competition **appearances and goals for the 2025–26 season** are now in the datasets — scraped from each player's Wikipedia career-statistics table (cross-checked against published league statistics), plus published tallies where the Wikipedia table is stale. Minutes are estimated from appearances (~72 min/app). What is still placeholder: per-90 rates, xG/xA, discipline counts and the conduct log — FBref/Understat/FotMob block automated export, so those need a manual CSV pass per [docs/data-refresh.md](docs/data-refresh.md). Every player carries a `dataNotes` line saying exactly which fields are real and which are placeholder.

Being honest about this is deliberate — see [docs/methodology.md](docs/methodology.md) for the full methodology and known limitations.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # vitest (engine unit tests + app smoke tests)
npm run typecheck
npm run build      # static build for GitHub Pages
node scripts/generate-datasets.mjs   # regenerate draft datasets (deterministic seeds)
```

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and deploys this repo's GitHub Pages project site at `LepsIsHere.github.io/TheGoldenFormula/`. Your root `LepsIsHere.github.io` site remains the portfolio hub and simply links to each project site. Enable Pages in repo settings with **Source: GitHub Actions**.

## Roadmap

- [ ] Week 1 data pass: real FBref stats + Transfermarkt trophies for all 60 players
- [ ] Week 1 editorial pass: sourced conduct events (Aug 2025 – Jul 2026)
- [ ] Ship before the ceremony (winner revealed October 26, 2026, London)
- [ ] After Oct 26: "your ranking vs. the journalists" comparison once official points drop

## License

MIT — see [LICENSE](LICENSE).
