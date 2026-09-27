# Snack Crackle Pop

Daily flavor-matching game with adaptive difficulty. Static page (`index.html`) plus four small Vercel functions and Upstash Redis. No dependencies, no build step.

## Endpoints
| Endpoint | What it does |
|---|---|
| `POST /api/log` | Anonymous gameplay events: puzzle, items, countries, categories, official shared flavors, canonical guess (after synonym/typo normalization), right / wrong / partial, guess number, time to first guess and to solve, hint visibility, skips (Endless), round and game results, the puzzle's hidden difficulty profile, and a random player ID made in the browser. No names, emails, IPs or free text. |
| `GET /api/config?no=N` | Today's difficulty target, hint timing, learned pair/flavor difficulty and pairs to avoid. Fixed once per puzzle number so everyone gets the same Daily. |
| `GET /api/report?days=7` | The analysis cycle: performance, difficulty, flavor trends, puzzle trends, common wrong answers (with entropy), flagged puzzles and the next adjustment with its reasons. |
| `GET /api/stats?days=7` | Per-puzzle, per-round Daily/Challenge detail. |

## Security
- **`/api/log`** only accepts posts from this site, bodies under 8 KB, and values the game itself can produce (known modes, flavor names, categories and pair IDs). Anything else is rejected or dropped.
- **Rate limits** (in `lib/guard.js`): 40 log events and 30 config requests per minute per visitor, and at most 25 player IDs per visitor per day. Extra events are ignored, so nobody can flood fake players to skew difficulty. Limits use a salted hash of the IP that expires within a day; no IP address is stored.
- **`/api/report` and `/api/stats` are private** because they show today's answers. Add an environment variable `STATS_KEY` in Vercel (at least 12 characters) and open `/api/report?key=YOUR_KEY`. Without it, both return 404.
- **Security headers** in `vercel.json`: Content-Security-Policy (scripts only from this site, fonts only from Google Fonts, no calls to other servers), no framing by other sites, HTTPS only.
- Optional: set `RATE_LIMIT_SALT` to any random text.

## How difficulty works
- **Hidden profile (1–10) for every pair/trio**, from flavor specificity, flavor prominence, product familiarity, distractor flavors, category distance and country distance. Starting values are editorial estimates; observed pair and flavor difficulty is blended in as data arrives (weight grows with sample size).
- **Daily** deals 3 rounds around the day's target: round 1 about 1.2 easier, round 2 on target, round 3 about 1 harder. **Challenge** is target + 0.5.
- **Controller** (once per day, last 7 Daily puzzles, target band 55–70% solved): needs 50 finished rounds before any change; ±0.5 per day, ±1 with 100+ rounds. It looks at misses and hint use too (e.g. 74% solved but many misses and heavy hint use → no change). One lever at a time: puzzle target first (range 2–8), hint timing only at the ends of that range.
- **Endless** adapts per player from their last 20 rounds (kept in their browser): ±0.5 at most every 5 rounds.
- **Ambiguity**: a pair where one wrong answer dominates (≥40% of players who missed, at least twice the next answer) is flagged in the report and skipped when dealing until reviewed.

Without Redis the game still works (target 5, standard hints, nothing logged).

## Languages
- English, French, Spanish, Simplified Chinese and Japanese. The page picks the browser's language when it's one of these, otherwise English; the language menu switches and remembers the choice. `?lang=en|fr|es|zh|ja` in the URL forces a language (handy for sharing).
- Spanish: neutral Latin American (tú) with Spain's words accepted too (cacahuete, gamba, nata…); plain "limón" asks whether you mean lemon or lime.
- Japanese: names as sold in Japan where one exists (`JA_NAMES`), packaging-style flavor names (うすしお, のりしお, コンソメ…) in `JA_FLAVORS`; hiragana, katakana, half-width and 〜味 all work; hint 2 gives the first kana of the reading.
- Chinese: official mainland brand names where one exists (`ZH_NAMES`, original name shown underneath), Chinese flavor names with pinyin (`ZH_FLAVORS`) so "caomei" and "草莓味" both work; hint 2 gives the pinyin initial. Uses the phone's built-in Chinese font (PingFang / YaHei / Noto), no extra download.
- All text lives in the `I18N` table in index.html; French flavor names and spellings are in `FR_FLAVORS`, plus `FR_TYPES`, `FR_COUNTRIES` and `FR_FAMS`. Adding a language = one more entry in each.
- Guesses in either language are accepted in both versions. Saved games and analytics always use the English flavor names, so stats stay combined; round starts are also counted per language (`lang|en|fr|es|zh|ja` in the daily hash).
