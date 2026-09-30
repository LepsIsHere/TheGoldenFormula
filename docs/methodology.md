# Methodology

## The official criteria

The Ballon d'Or is awarded on three criteria in strict order of importance ([official 2026 regulations](https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy)):

1. Individual performances, decisive and impressive character
2. Collective performances and titles won
3. Class and fair play

Reference period for 2026: **August 3, 2025 – July 19, 2026**, including international competitions. The UI's three blocks mirror this order exactly; the default block weights (5 / 3 / 1) encode the ranking, and you are free to disagree.

## Scoring pipeline

1. **Role assignment.** Each player carries a role tag: GK / CB / FB / MID / ATT. Roles are per-player tags because modern roles blur (e.g. an attacking full-back).
2. **Role-relative normalization.** For each stat in the player's role catalog, compute the percentile within the role group (n≈2–13 per edition). A goalkeeper's PSxG save performance competes only with other keepers; a midfielder's goals are judged against other midfielders, where their rarity is already rewarded.
3. **Stat weighting.** Your per-stat sliders, normalized within each role catalog, combine the percentiles into an individual score.
4. **Team score.** Trophies, weighted by your competition multipliers (World Cup > UCL/WCCL > top leagues > other), scaled by a team-centrality factor (`teamGoalShare`).
5. **Fair play.** Hybrid: quantitative card baseline (yellows −0.5, second yellows −2, reds −3, suspensions served −1.5) plus the sourced conduct event log (severity −3…+3 per event), scaled by your severity-sensitivity slider, converted to points around a 50-point neutral baseline.
6. **Blocks — additive points, no artificial cap.** Each block produces raw additive points, and the calibration constants (`INDIVIDUAL_SCALE`, `TEAM_SCALE`, `FAIR_PLAY_SCALE` in `src/engine/scoring.ts`) are tuned so a median shortlisted player earns ≈50 points from each block — all three blocks contribute comparably at equal block weights by default. The final score is `w_ind·IND + w_team·TEAM + w_ffp·FFP`. Nothing is clamped to 100: a monster season with multiple trophies can reach 700+; a clean trophyless season sits near 150. Fair play centers on a 50-point neutral baseline (the median player is well-behaved) and moves down with cards/conduct events and up with positive events. Ballot-points mode maps ranks to the real 15-12-10-7-5-4-3-2-1-1 system.

## Why role-relative normalization

Raw stats embed role bias: attackers accumulate goals, defenders accumulate tackles, and neither tells you who was better *at their job*. Percentiles within role groups put every role on the same 0–100 scale, so your philosophy about which roles matter is expressed in the role stat sliders — not hidden in the stat selection.

## Known limitations (deliberately not hidden)

- **Public defensive metrics are imperfect.** Event data captures on-ball actions, not positioning and covering — the analytics community openly notes that public defensive metrics are partially antithetical to good defending ([Cafe Tactiques](https://cafetactiques.com/2023/01/16/we-need-to-talk-about-defensive-metrics/)). Per-90 and possession adjustments mitigate but do not fix this.
- **Small role groups make percentiles noisy.** With ~30 players per edition, splitting into 5 role groups means some groups have n<5. Percentiles there are coarse; that is an honest trade-off for role fairness.
- **The conduct log is editorial.** Every event is a judgment. Mitigations: one reputable source per event, full transparency in the UI (click the flag, read the description, follow the link), and the severity-sensitivity slider so users discount the log entirely if they want. Community corrections via PR are welcome.
- **Women's data depth varies by league.** FBref coverage is strongest for WSL and top European leagues; NWSL and Liga MX Femenil coverage is thinner. Per-player data gaps are documented in the dataset (`dataConfidence`, `dataNotes`).
- **Draft data.** Shipped stat lines are generated placeholders pending the FBref export pass. See [data-refresh.md](data-refresh.md).

## Fair-play layers

1. **Quantitative baseline:** yellow −0.5, second yellow −2, red −3, suspension served −1.5.
2. **Conduct event log:** severity −3…+3 per event, scaled by your sensitivity slider (0 disables the log entirely; cards still count).
3. **Your weight:** the Block 3 slider, defaulting to tiebreaker level per the official ranking.

## Sources

- [Ballon d'Or official regulations 2026](https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy)
- [FBref advanced goalkeeping stats](https://fbref.com/en/comps/9/keepersadv/Premier-League-Stats) (PSxG), [FBref WSL](https://fbref.com/en/comps/189/stats/Womens-Super-League-Stats), [FBref Première Ligue](https://fbref.com/en/comps/193/Division-1-Feminine-Stats)
- [worldfootballR](https://jaseziv.github.io/worldfootballR/articles/extract-fbref-data.html) for documented FBref/Transfermarkt extraction
- [The Sporting Blog — PSxG explainer](https://thesporting.blog/blog/post-shot-expected-goals-what-is-it-and-why-does-it-matter)
- [Santolini — defensive stats methodology](https://medium.com/@nicola.santolini.94/what-are-we-doing-with-defensive-stats-29fabb130c87)
