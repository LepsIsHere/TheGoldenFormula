# Methodology

## The official criteria

The Ballon d'Or is awarded on three criteria in strict order of importance ([official 2026 regulations](https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy)):

1. Individual performances, decisive and impressive character
2. Collective performances and titles won
3. Class and fair play

Reference period for 2026: **August 3, 2025 – July 19, 2026**, including international competitions. The UI's three blocks mirror this order exactly; the default block weights (5 / 3 / 1) encode the ranking, and you are free to disagree.

## Scoring pipeline

1. **Role assignment.** Each player carries a role tag: GK / CB / FB / MID / ATT. Roles are per-player tags because modern roles blur (e.g. an attacking full-back). Each role has its own stat catalog with **direct points per stat event** — the reference values users see and adjust.
2. **Individual block — direct points.** Each stat event earns its base points: a goal = 25 pts, an assist = 12.5 pts, a goal saved above expectation (PSxG−GA) = 15 pts, a penalty save = 20 pts, a clean sheet = 15 pts, a through ball = 10 pts, etc. Per-90 rates are converted to season totals via minutes; percentages are converted to percentage points. Your sliders are multipliers on the base points (0–3×, one-decimal resolution). Points are additive and uncapped — a 40-goal season earns 1000 pts on goals alone at ×1.
3. **Team block.** Each trophy earns tier base points (World Cup 300, UCL/WCCL 200, international 150, top league 120, other league 60, domestic cup 50, other 30), scaled by your competition multipliers and a team-centrality factor (`teamGoalShare` — how central the player was to the trophy).
4. **Fair play block.** Direct points: yellow −2.5, second yellow −10, red −15, suspension served −7.5, plus conduct events at ±5 pts per severity unit (−3…+3), scaled by your severity-sensitivity slider (0 disables the event log; cards always count).
5. **Opposition strength (advanced).** Optionally scales individual points by the player's `avgOpponentRating` (UEFA club coefficients / FIFA national rankings, minutes-weighted, edition-median-centered). A goal vs PSG counts more than a goal vs Leipzig. 0 = off.
6. **Final score.** `w_ind·IND + w_team·TEAM + w_ffp·FFP` — uncapped, additive, one-decimal resolution. If all block weights are zero, the ranking falls back to individual order. Ballot-points mode maps ranks to the real 15-12-10-7-5-4-3-2-1-1 system.

## Why direct points instead of normalized coefficients

Percentile/coeffient models hide the physics of the game behind a normalization layer; users can't answer "what is a goal worth to me?" Direct points make every value legible and adjustable: 25 pts per goal, ×2 if you think goals decide everything, ×0 if you don't. The trade-off is that raw stat volume differs by role and team style — which is honest, and is exactly the debate the tool is designed to surface (role catalogs give each position its own priced stat set, and the advanced opposition-strength mode adjusts for quality of opposition).

## Known limitations (deliberately not hidden)

- **Public defensive metrics are imperfect.** Event data captures on-ball actions, not positioning and covering — the analytics community openly notes that public defensive metrics are partially antithetical to good defending ([Cafe Tactiques](https://cafetactiques.com/2023/01/16/we-need-to-talk-about-defensive-metrics/)). Per-90 and possession adjustments mitigate but do not fix this.
- **Small role groups make percentiles noisy.** With ~30 players per edition, splitting into 5 role groups means some groups have n<5. Percentiles there are coarse; that is an honest trade-off for role fairness.
- **The conduct log is editorial.** Every event is a judgment. Mitigations: one reputable source per event, full transparency in the UI (click the flag, read the description, follow the link), and the severity-sensitivity slider so users discount the log entirely if they want. Community corrections via PR are welcome.
- **Women's data depth varies by league.** FBref coverage is strongest for WSL and top European leagues; NWSL and Liga MX Femenil coverage is thinner. Per-player data gaps are documented in the dataset (`dataConfidence`, `dataNotes`).
- **Draft data.** Shipped stat lines are generated placeholders pending the FBref export pass. See [data-refresh.md](data-refresh.md).

## Fair-play layers

1. **Quantitative baseline:** yellow −2.5 pts, second yellow −10 pts, red −15 pts, suspension served −7.5 pts.
2. **Conduct event log:** ±5 pts per severity unit (−3…+3 per event), scaled by your sensitivity slider (0 disables the log entirely; cards still count).
3. **Your weight:** the Block 3 slider, defaulting to tiebreaker level per the official ranking.

## Sources

- [Ballon d'Or official regulations 2026](https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy)
- [FBref advanced goalkeeping stats](https://fbref.com/en/comps/9/keepersadv/Premier-League-Stats) (PSxG), [FBref WSL](https://fbref.com/en/comps/189/stats/Womens-Super-League-Stats), [FBref Première Ligue](https://fbref.com/en/comps/193/Division-1-Feminine-Stats)
- [worldfootballR](https://jaseziv.github.io/worldfootballR/articles/extract-fbref-data.html) for documented FBref/Transfermarkt extraction
- [The Sporting Blog — PSxG explainer](https://thesporting.blog/blog/post-shot-expected-goals-what-is-it-and-why-does-it-matter)
- [Santolini — defensive stats methodology](https://medium.com/@nicola.santolini.94/what-are-we-doing-with-defensive-stats-29fabb130c87)
