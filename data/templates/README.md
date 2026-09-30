# Data templates

Fill one row per shortlisted player, then run:

    node scripts/import-csv.mjs data/templates/men-2026.csv data/men-2026.json
    node scripts/import-csv.mjs data/templates/women-2026.csv data/women-2026.json

Only fill the stat columns relevant to the player's role (see docs/collecting-real-data.md for the FBref source of each column). The importer validates and reports every gap. The header lists every stat column for convenience; leave non-role cells empty.
