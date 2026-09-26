# Snack Crackle Pop

Daily flavor-matching game with adaptive difficulty. Static page (`index.html`) plus four small Vercel functions and Upstash Redis. No dependencies, no build step.

## Endpoints
| Endpoint | What it does |
|---|---|
| `POST /api/log` | Anonymous gameplay events: puzzle, items, countries, categories, official shared flavors, canonical guess (after synonym/typo normalization), right / wrong / partial, guess number, time to first guess and to solve, hint visibility, skips (Endless), round and game results, the puzzle's hidden difficulty profile, and a random player ID made in the browser. No names, emails, IPs or free text. |
| `GET /api/config?no=N` | Today's difficulty target, hint timing, learned pair/flavor difficulty and pairs to avoid. Fixed once per puzzle number so everyone gets the same Daily. |
| `GET /api/report?days=7` | The analysis cycle: performance, difficulty, flavor trends, puzzle trends, common wrong answers (with entropy), flagged puzzles and the next adjustment with its reasons. |
| `GET /api/stats?days=7` | Per-puzzle, per-round Daily/Challenge detail. |

## How difficulty works
- **Hidden profile (1–10) for every pair/trio**, from flavor specificity, flavor prominence, product familiarity, distractor flavors, category distance and country distance. Starting values are editorial estimates; observed pair and flavor difficulty is blended in as data arrives (weight grows with sample size).
- **Daily** deals 3 rounds around the day's target: round 1 about 1.2 easier, round 2 on target, round 3 about 1 harder. **Challenge** is target + 0.5.
- **Controller** (once per day, last 7 Daily puzzles, target band 55–70% solved): needs 50 finished rounds before any change; ±0.5 per day, ±1 with 100+ rounds. It looks at misses and hint use too (e.g. 74% solved but many misses and heavy hint use → no change). One lever at a time: puzzle target first (range 2–8), hint timing only at the ends of that range.
- **Endless** adapts per player from their last 20 rounds (kept in their browser): ±0.5 at most every 5 rounds.
- **Ambiguity**: a pair where one wrong answer dominates (≥40% of players who missed, at least twice the next answer) is flagged in the report and skipped when dealing until reviewed.

Manual hint override: set the Vercel env var `SNACKDLE_DIFFICULTY` to `easier`, `easy`, `normal` or `hard`.

## Setup
1. Put this folder in a GitHub repository and import it in Vercel (Add New → Project). No build settings.
2. Vercel project → Storage → Marketplace → **Upstash for Redis** (free) → connect to this project (adds `KV_REST_API_URL`, `KV_REST_API_TOKEN`).
3. Redeploy. Check `https://<site>/api/config` shows `"analytics": true`.

Without Redis the game still works (target 5, standard hints, nothing logged).
