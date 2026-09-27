// POST /api/log — anonymous gameplay events. Stores only puzzle and guess data plus a random
// browser-generated player ID. No names, emails, IP addresses or free text (guesses are canonical flavor names).
const { pipeline, K, TTL } = require("../lib/redis");
const { rateLimit, playerAllowed, sameOrigin, bodyTooLarge } = require("../lib/guard");

const MODES = new Set(["daily", "challenge", "endless"]);
const FLAVOR_RE = /^[\p{L}0-9 &'!.\-]{1,32}$/u;
const ID_RE = /^[a-z0-9]{8,24}$/;
const PAIR_RE = /^\d{1,4}(-\d{1,4}){1,2}$/;
const LONG = 60 * 60 * 24 * 400;
const num = (v, lo, hi, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const clean = (a, n = 3, len = 40) => (Array.isArray(a) ? a.slice(0, n).map((x) => String(x).slice(0, len)) : []);
// Only values the game itself can produce are stored; anything else is dropped.
const TEXT_RE = /^[\p{L}\p{N} &'!.,\-·()+/]{1,40}$/u;
const CATEGORIES = new Set(["Milk drink", "Soda", "Candy", "Savory snack", "Chocolate", "Cookie & cake"]);
const PAIR_TYPES = new Set(["drink+drink", "drink+snack", "snack+snack", "drink+drink+drink", "drink+drink+snack", "drink+snack+snack", "snack+snack+snack"]);
const safeList = (a, n) => clean(a, n).filter((x) => TEXT_RE.test(x));

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (bodyTooLarge(req)) return res.status(413).json({ error: "too large" });
  if (!(await rateLimit(req, res, "log"))) return;
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== "object") return res.status(400).json({ error: "bad body" });
  const { t, mode, player } = b;
  const no = Number(b.no), r = Number(b.r ?? 0), pair = String(b.pair || "");
  if (!MODES.has(mode) || !Number.isInteger(no) || no < 1 || no > 100000 || !Number.isInteger(r) || r < 0 || r > 5 || !ID_RE.test(player || ""))
    return res.status(400).json({ error: "bad fields" });
  if (t !== "game" && !PAIR_RE.test(pair)) return res.status(400).json({ error: "bad pair" });
  if (!(await playerAllowed(req, no, player))) return res.status(204).end();
  const daily = mode !== "endless";
  const day = `sd:day:${no}`;

  try {
    if (t === "guess") {
      const guess = String(b.guess || "");
      if (!FLAVOR_RE.test(guess)) return res.status(400).json({ error: "bad guess" });
      const startKey = daily ? K.started(mode, no, r) : `sd:es:${no}`, startVal = daily ? player : `${player}|${pair}`;
      const seenKey = daily ? K.seen(mode, no, r) : `sd:eg:${no}`, seenVal = daily ? `${player}|${guess}` : `${player}|${pair}|${guess}`;
      const [first, fresh] = await pipeline([["SADD", startKey, startVal], ["SADD", seenKey, seenVal]]);
      const c = [];
      if (first === 1) {
        c.push(["HINCRBY", day, `start|${mode}`, 1], ["PFADD", `sd:pl:day:${no}`, player], ["SADD", "sd:alldays", String(no)]);
        const lang = ["fr", "es", "zh", "ja"].includes(b.lang) ? b.lang : "en";   // players starting a round, per language
        c.push(["HINCRBY", day, `lang|${lang}`, 1]);
        if (daily) c.push(["HINCRBY", K.round(mode, no, r), "players", 1], ["SADD", K.days, `${mode}:${no}`], ["PFADD", K.players(mode, no), player]);
      }
      if (fresh === 1) {
        c.push(["HINCRBY", day, "guesses", 1]);
        if (b.fuzzy) c.push(["HINCRBY", day, "fuzzy", 1]);
        if (b.correct) { if (daily) c.push(["ZINCRBY", K.right(mode, no, r), 1, guess]); }
        else {
          c.push(["ZINCRBY", `sd:pw:${pair}`, 1, guess], ["ZINCRBY", `sd:wrongday:${no}`, 1, guess], ["EXPIRE", `sd:pw:${pair}`, LONG]);
          if (daily) c.push(["ZINCRBY", K.wrong(mode, no, r), 1, guess]);
          if (b.partial) c.push(["HINCRBY", day, "partial", 1], ["ZINCRBY", `sd:pq:${pair}`, 1, guess], ["EXPIRE", `sd:pq:${pair}`, LONG]);
        }
      }
      for (const k of [startKey, seenKey, day, `sd:pl:day:${no}`, `sd:wrongday:${no}`]) c.push(["EXPIRE", k, TTL]);
      if (daily) for (const k of [K.round(mode, no, r), K.wrong(mode, no, r), K.right(mode, no, r), K.players(mode, no)]) c.push(["EXPIRE", k, TTL]);
      await pipeline(c);
    } else if (t === "round" || t === "skip") {
      const finKey = daily ? K.finished(mode, no, r) : `sd:ef:${no}`, finVal = daily ? player : `${player}|${pair}`;
      const [firstFinish] = await pipeline([["SADD", finKey, finVal], ["EXPIRE", finKey, TTL]]);
      if (firstFinish !== 1) return res.status(204).end();
      const skip = t === "skip";
      const won = !skip && !!b.won, misses = num(b.misses, 0, 30), guesses = num(b.total_guesses, 0, 60);
      const firstOk = !skip && !!b.first_guess_correct, hint = !!b.hint_used, partial = num(b.partial_guesses, 0, 30);
      const tSolve = won ? num(b.ms_to_solve, 0, 3600000) : 0;
      const p = b.profile || {};
      const diff = num(p.difficulty, 1, 10, 5), prior = num(p.prior, 1, 10, 5), fam = num(p.product_familiarity, 1, 10, 6);
      const cats = clean(b.categories).filter((x) => CATEGORIES.has(x)).sort().join(" + ") || "unknown";
      const answers = clean(b.answers, 12, 32).filter((x) => FLAVOR_RE.test(x));
      const pairType = PAIR_TYPES.has(p.pair_type) ? p.pair_type : "unknown";
      const dims = [["all", "all"], ["mode", mode], ["pairType", pairType], ["catPair", cats], ["country", p.cross_country ? "cross" : "same"],
        ["band", String(Math.round(diff))], ["famBand", fam >= 8 ? "high" : fam >= 5 ? "mid" : "low"], ...answers.map((f) => ["flavor", f])];
      const c = [];
      const dk = `sd:dim:${no}`;
      for (const [d, v] of dims) {
        const f = `${d}|${v}|`;
        c.push(["HINCRBY", dk, f + "fin", 1]);
        if (won) c.push(["HINCRBY", dk, f + "won", 1], ["HINCRBY", dk, f + "gsolve", guesses], ["HINCRBY", dk, f + "tsolve", Math.round(tSolve / 1000)]);
        if (skip) c.push(["HINCRBY", dk, f + "skip", 1]);
        if (misses) c.push(["HINCRBY", dk, f + "miss", misses]);
        if (firstOk) c.push(["HINCRBY", dk, f + "first", 1]);
        if (hint) c.push(["HINCRBY", dk, f + "hint", 1]);
        if (partial) c.push(["HINCRBY", dk, f + "partial", partial]);
        c.push(["HINCRBY", dk, f + "dsum", Math.round(prior * 10)]);
      }
      c.push(["EXPIRE", dk, TTL]);
      if (won) c.push(["HINCRBY", `sd:hist:${no}`, `g|${guesses}`, 1], ["HINCRBY", `sd:hist:${no}`, `t|${Math.min(30, Math.floor(tSolve / 10000))}`, 1], ["EXPIRE", `sd:hist:${no}`, TTL]);
      // all-time pair and flavor learning
      const pk = `sd:pair:${pair}`;
      c.push(["HINCRBY", pk, "fin", 1], ["HSETNX", pk, "prior", String(prior)], ["HSETNX", pk, "items", JSON.stringify(safeList(b.items, 3))],
        ["HSETNX", pk, "answers", JSON.stringify(answers)], ["SADD", "sd:pairs", pair], ["EXPIRE", pk, LONG], ["SADD", `sd:daypairs:${no}`, pair], ["EXPIRE", `sd:daypairs:${no}`, TTL]);
      if (won) c.push(["HINCRBY", pk, "won", 1]);
      if (skip) c.push(["HINCRBY", pk, "skip", 1]);
      if (misses) c.push(["HINCRBY", pk, "miss", misses]);
      if (firstOk) c.push(["HINCRBY", pk, "first", 1]);
      if (hint) c.push(["HINCRBY", pk, "hint", 1]);
      if (partial) c.push(["HINCRBY", pk, "partial", partial]);
      for (const f of answers) {
        c.push(["HINCRBY", "sd:flav", `${f}|fin`, 1]);
        if (won) c.push(["HINCRBY", "sd:flav", `${f}|won`, 1]);
        if (misses) c.push(["HINCRBY", "sd:flav", `${f}|miss`, misses]);
        if (firstOk) c.push(["HINCRBY", "sd:flav", `${f}|first`, 1]);
      }
      if (daily && !skip) {
        const rk = K.round(mode, no, r);
        c.push(["HINCRBY", rk, won ? "won" : "lost", 1], ["HINCRBY", rk, "misses", misses], ["HINCRBY", rk, "score", num(b.score, 0, 1000)],
          ["HSETNX", rk, "items", JSON.stringify(safeList(b.items, 3))], ["HSETNX", rk, "pair", pair], ["HSETNX", rk, "difficulty", String(diff)]);
        if (firstOk) c.push(["HINCRBY", rk, "first", 1]);
        if (hint) c.push(["HINCRBY", rk, "hint", 1]);
        if (won) c.push(["HINCRBY", rk, "tsolve", Math.round(tSolve / 1000)], ["HINCRBY", rk, "gsolve", guesses]);
      }
      await pipeline(c);
    } else if (t === "game" && daily) {
      const total = num(b.total, 0, 3000), max = num(b.max, 1000, 3000, 1000);
      const [first] = await pipeline([["SADD", K.gameDone(mode, no), player]]);
      if (first === 1) await pipeline([["HINCRBY", K.game(mode, no), "finished", 1], ["HINCRBY", K.game(mode, no), "total", total],
        ["HINCRBY", K.game(mode, no), "perfect", total >= max ? 1 : 0], ["EXPIRE", K.game(mode, no), TTL], ["EXPIRE", K.gameDone(mode, no), TTL]]);
    } else {
      return res.status(400).json({ error: "bad type" });
    }
    return res.status(204).end();
  } catch (e) {
    console.error("log failed:", e);
    return res.status(503).json({ error: "unavailable" });
  }
};
