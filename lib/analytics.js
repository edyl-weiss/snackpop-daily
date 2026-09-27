// Rolling analytics, adaptive difficulty controller, learned difficulty and the weekly analysis report.
const { pipeline } = require("./redis");

const EPOCH_UTC = Date.UTC(2026, 8, 25, 7); // Puzzle No. 1 = Sep 25 2026 (midnight Pacific ≈ 07:00 UTC)
const todayNo = () => Math.floor((Date.now() - EPOCH_UTC) / 864e5) + 1;
const H = (a) => { const o = {}; for (let i = 0; a && i < a.length; i += 2) o[a[i]] = a[i + 1]; return o; };
const Z = (a) => { const o = []; for (let i = 0; a && i < a.length; i += 2) o.push({ flavor: a[i], count: Number(a[i + 1]) }); return o; };
const pct = (x) => (x == null ? null : Math.round(x * 1000) / 10);
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const range = (a, b) => { const o = []; for (let i = Math.max(1, a); i <= b; i++) o.push(i); return o; };

// Observed difficulty on the 1–10 scale from solve rate and average misses (spec examples: 72% & ~1.5 misses ≈ 4; 38% & ~2 misses ≈ 7)
const observed = (s, m) => (s == null ? null : r2(Math.max(1, Math.min(10, 1 + 10 * (1 - s) * 0.75 + Math.min(4, m || 0) * 0.8))));
// Normalized Shannon entropy of a wrong-answer distribution (0 = everyone gives the same wrong answer, 1 = evenly spread)
function entropy(list) {
  const tot = list.reduce((t, x) => t + x.count, 0); if (tot === 0 || list.length < 2) return list.length ? 0 : null;
  let e = 0; for (const x of list) { const p = x.count / tot; e -= p * Math.log2(p); }
  return r2(e / Math.log2(list.length));
}
function rates(m) {
  const fin = +m.fin || 0; if (!fin) return { finished: 0 };
  const won = +m.won || 0;
  return { finished: fin, solveRate: r2(won / fin), firstGuessRate: r2((+m.first || 0) / fin), avgMisses: r2((+m.miss || 0) / fin),
    avgGuessesWhenSolved: won ? r2((+m.gsolve || 0) / won) : null, avgSolveSeconds: won ? Math.round((+m.tsolve || 0) / won) : null,
    hintRate: r2((+m.hint || 0) / fin), skipRate: r2((+m.skip || 0) / fin), partialPerRound: r2((+m.partial || 0) / fin),
    avgPriorDifficulty: r2((+m.dsum || 0) / 10 / fin), observedDifficulty: observed(won / fin, (+m.miss || 0) / fin) };
}
async function readDims(nos) {
  if (!nos.length) return {};
  const res = await pipeline(nos.map((n) => ["HGETALL", `sd:dim:${n}`]));
  const out = {};
  for (const arr of res) for (const [k, v] of Object.entries(H(arr))) {
    const [d, val, metric] = k.split("|"); ((out[d] ||= {})[val] ||= {})[metric] = ((out[d][val][metric]) || 0) + Number(v);
  }
  return out;
}

/* ---------- Difficulty controller ----------
   Runs once per puzzle number, looking at the previous 7 Daily puzzles. Target band: 55–70% solved.
   Needs 50 finished rounds for any change and 100+ for a full step. Changes one lever at a time:
   the puzzle difficulty target first (±0.5, or ±1 with 100+ rounds), hint timing only when the target is at its limit. */
const HINTS = {
  easier: { hint1At: 0, hint2At: 0, label: "Both starter hints on" },
  easy: { hint1At: 0, hint2At: 4, label: "Flavor-family hint shown from the start" },
  normal: { hint1At: 2, hint2At: 4, label: "Standard hints (after 2 and 4 misses)" },
  hard: { hint1At: 3, hint2At: 5, label: "Hints unlock later (after 3 and 5 misses)" },
};
async function decide(no) {
  const dims = await readDims(range(no - 7, no - 1));
  const d = (dims.mode && dims.mode.daily) || {};
  const R = rates(d), N = R.finished;
  const back = range(no - 21, no - 1).reverse();
  const prevRes = back.length ? await pipeline(back.map((n) => ["HGETALL", `sd:ctrl:${n}`])) : [];
  const prev = H(prevRes.find((a) => a && a.length) || []);
  let target = prev.target ? Number(prev.target) : 5, hint = prev.hint || "normal";
  const override = (process.env.SNACKDLE_DIFFICULTY || "").toLowerCase();
  let lever = "none", reason;
  const step = N >= 100 ? 1 : 0.5;
  if (N < 50) reason = `Only ${N} finished Daily rounds in the last 7 days; waiting for 50 before changing anything.`;
  else {
    const s = R.solveRate, m = R.avgMisses, h = R.hintRate;
    if (s > 0.8 && m < 1.5 && h < 0.25) { target += step; lever = "target+"; reason = `${pct(s)}% solved with ${m} misses and ${pct(h)}% hint use: too easy.`; }
    else if (s > 0.7) {
      if (m >= 2.5 || h >= 0.4) reason = `${pct(s)}% solved is slightly above target, but players need ${m} misses on average and ${pct(h)}% use hints: difficulty looks right.`;
      else { target += 0.5; lever = "target+"; reason = `${pct(s)}% solved with few misses (${m}): slightly too easy.`; }
    } else if (s >= 0.55) reason = `${pct(s)}% solved: inside the 55–70% target band.`;
    else if (s >= 0.4) { target -= 0.5; lever = "target-"; reason = `${pct(s)}% solved: slightly below the 55–70% target.`; }
    else { target -= step; lever = "target-"; reason = `Only ${pct(s)}% solved: too hard.`; }
    if (target < 2) { target = 2; if (hint === "normal") { hint = "easy"; lever = "hints"; reason += " Puzzle difficulty is already at its minimum, so the flavor-family hint now shows from the start."; } else if (hint === "easy") { hint = "easier"; lever = "hints"; } }
    if (target > 8) { target = 8; if (hint === "normal") { hint = "hard"; lever = "hints"; reason += " Puzzle difficulty is at its maximum, so hints now unlock later."; } }
    if (lever === "target+" && hint !== "normal" && hint !== "hard") { hint = hint === "easier" ? "easy" : "normal"; target -= step; lever = "hints"; reason += " Starter hints are removed first instead of raising puzzle difficulty."; }
  }
  if (HINTS[override]) { hint = override; reason = "Hint level set manually with SNACKDLE_DIFFICULTY. " + reason; }
  return { no, target: Math.round(target * 10) / 10, hint, ...HINTS[hint], lever, reason, evidence: { window: `Daily No. ${Math.max(1, no - 7)}–${no - 1}`, ...R } };
}
// Fixed once per puzzle number so every player gets the same Daily puzzles that day.
async function controllerFor(no) {
  const [stored] = await pipeline([["GET", `sd:ctrlj:${no}`]]);
  if (stored) return JSON.parse(stored);
  const dec = await decide(no);
  await pipeline([["SET", `sd:ctrlj:${no}`, JSON.stringify(dec), "NX", "EX", 60 * 60 * 24 * 400],
    ["HSETNX", `sd:ctrl:${no}`, "target", String(dec.target)], ["HSETNX", `sd:ctrl:${no}`, "hint", dec.hint]]);
  const [again] = await pipeline([["GET", `sd:ctrlj:${no}`]]);
  return again ? JSON.parse(again) : dec;
}

/* ---------- Learned difficulty (pairs and flavors, all modes, all time) ---------- */
async function learned(no) {
  const [cached] = await pipeline([["GET", `sd:learned:${no}`]]);
  if (cached) return JSON.parse(cached);
  const [members] = await pipeline([["SMEMBERS", "sd:pairs"]]);
  const keys = members || [], pairs = {}, avoid = [];
  for (let i = 0; i < keys.length; i += 400) {
    const chunk = keys.slice(i, i + 400);
    const res = await pipeline(chunk.map((k) => ["HGETALL", `sd:pair:${k}`]));
    const busy = [];
    chunk.forEach((k, j) => { const h = H(res[j]); const fin = +h.fin || 0; if (fin >= 10) { const s = (+h.won || 0) / fin; pairs[k] = [observed(s, (+h.miss || 0) / fin), fin]; } if (fin >= 30) busy.push([k, fin]); });
    if (busy.length) {
      const tops = await pipeline(busy.map(([k]) => ["ZREVRANGE", `sd:pw:${k}`, 0, 1, "WITHSCORES"]));
      busy.forEach(([k, fin], j) => { const [t, u] = Z(tops[j]); if (t && t.count >= 0.4 * fin && t.count >= 2 * (u ? u.count : 0)) avoid.push(k); });  // skipped when dealing until reviewed
    }
  }
  const [fl] = await pipeline([["HGETALL", "sd:flav"]]);
  const fm = {}; for (const [k, v] of Object.entries(H(fl))) { const [f, m] = k.split("|"); (fm[f] ||= {})[m] = Number(v); }
  const flavors = {}; for (const [f, m] of Object.entries(fm)) if ((m.fin || 0) >= 10) flavors[f] = [observed((m.won || 0) / m.fin, (m.miss || 0) / m.fin), m.fin];
  const out = { pairs, flavors, avoid };
  await pipeline([["SET", `sd:learned:${no}`, JSON.stringify(out), "EX", 3600 * 6]]);
  return out;
}

/* ---------- Analysis report (spec: "Automated Analysis Output") ---------- */
async function report(days = 7, endNo) {
  const [allDays] = await pipeline([["SMEMBERS", "sd:alldays"]]);
  const last = endNo || Math.max(0, ...(allDays || []).map(Number));
  if (!last) return { error: "No gameplay recorded yet." };
  const nos = range(last - days + 1, last);
  const dims = await readDims(nos);
  const cmds = [];
  nos.forEach((n) => cmds.push(["HGETALL", `sd:day:${n}`], ["HGETALL", `sd:hist:${n}`], ["ZREVRANGE", `sd:wrongday:${n}`, 0, 49, "WITHSCORES"], ["SMEMBERS", `sd:daypairs:${n}`]));
  cmds.push(["PFCOUNT", ...nos.map((n) => `sd:pl:day:${n}`)]);
  const res = await pipeline(cmds);
  const dayTot = {}, hist = {}, wrong = {}, played = new Set(), perDay = [];
  nos.forEach((n, i) => {
    const d = H(res[i * 4]); for (const [k, v] of Object.entries(d)) dayTot[k] = (dayTot[k] || 0) + Number(v);
    for (const [k, v] of Object.entries(H(res[i * 4 + 1]))) hist[k] = (hist[k] || 0) + Number(v);
    for (const w of Z(res[i * 4 + 2])) wrong[w.flavor] = (wrong[w.flavor] || 0) + w.count;
    (res[i * 4 + 3] || []).forEach((p) => played.add(p));
  });
  const uniquePlayers = res[res.length - 1] || 0;
  const perDayDims = await pipeline(nos.map((n) => ["HGETALL", `sd:dim:${n}`]));
  nos.forEach((n, i) => { const h = H(perDayDims[i]); const m = {}; for (const [k, v] of Object.entries(h)) if (k.startsWith("all|all|")) m[k.split("|")[2]] = +v;
    const d = H(res[i * 4]); perDay.push({ no: n, attempts: Object.entries(d).filter(([k]) => k.startsWith("start|")).reduce((t, [, v]) => t + Number(v), 0), ...rates(m) }); });

  const all = rates((dims.all && dims.all.all) || {});
  const attempts = Object.entries(dayTot).filter(([k]) => k.startsWith("start|")).reduce((t, [, v]) => t + v, 0);
  const median = (prefix, scale) => { const e = Object.entries(hist).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [Number(k.split("|")[1]), v]).sort((a, b) => a[0] - b[0]);
    const tot = e.reduce((t, x) => t + x[1], 0); let acc = 0; for (const [k, v] of e) { acc += v; if (acc >= tot / 2) return k * scale; } return null; };
  const table = (dim, min = 10) => Object.entries(dims[dim] || {}).map(([v, m]) => ({ value: v, ...rates(m) })).filter((x) => x.finished >= min).sort((a, b) => (a.solveRate ?? 0) - (b.solveRate ?? 0));
  const wrongList = Object.entries(wrong).map(([flavor, count]) => ({ flavor, count })).sort((a, b) => b.count - a.count);
  const wrongTot = wrongList.reduce((t, x) => t + x.count, 0);

  // Flagged puzzles among those played in the window
  const pk = [...played];
  const flagged = [];
  for (let i = 0; i < pk.length; i += 150) {
    const chunk = pk.slice(i, i + 150);
    const r = await pipeline(chunk.flatMap((k) => [["HGETALL", `sd:pair:${k}`], ["ZREVRANGE", `sd:pw:${k}`, 0, -1, "WITHSCORES"], ["ZREVRANGE", `sd:pq:${k}`, 0, 2, "WITHSCORES"]]));
    chunk.forEach((k, j) => {
      const h = H(r[j * 3]), wl = Z(r[j * 3 + 1]), pq = Z(r[j * 3 + 2]); const fin = +h.fin || 0; if (fin < 20) return;
      const s = (+h.won || 0) / fin, first = (+h.first || 0) / fin, wt = wl.reduce((t, x) => t + x.count, 0), top = wl[0];
      const ent = entropy(wl), flags = [];
      const wrongPlayers = Math.max(1, fin - (+h.first || 0));
      const second = wl[1] ? wl[1].count : 0;
      if (top && top.count >= 10 && top.count >= 0.4 * wrongPlayers && top.count >= 2 * second && top.count >= 0.2 * wt) flags.push({ type: "ambiguous or unintended connection", detail: `${Math.round(Math.min(1, top.count / wrongPlayers) * 100)}% of players who missed guessed "${top.flavor}". Check whether both items really have (or are known for) it; if so add it, if not consider a clearer pair.` });
      if (s < 0.25) flags.push({ type: "too obscure / too hard", detail: `${pct(s)}% solved` + (ent != null && ent < 0.5 ? " and wrong answers are concentrated (possibly misleading)" : " with wrong answers spread widely (genuinely hard)") });
      if (first >= 0.9 && s >= 0.95) flags.push({ type: "too easy", detail: `${pct(first)}% solved on the first guess` });
      if ((+h.partial || 0) / fin >= 0.5) flags.push({ type: "possible missing synonym or partial answer", detail: `Frequent answers that fit only one item: ${pq.map((x) => x.flavor).join(", ")}` });
      if (flags.length) flagged.push({ pair: k, items: h.items ? JSON.parse(h.items) : [], answers: h.answers ? JSON.parse(h.answers) : [], finished: fin, earlySignal: fin < 50,
        solveRate: r2(s), firstGuessRate: r2(first), priorDifficulty: +h.prior || null, observedDifficulty: observed(s, (+h.miss || 0) / fin), wrongEntropy: ent, topWrong: wl.slice(0, 5), flags });
    });
  }
  flagged.sort((a, b) => b.finished - a.finished);
  const flavorTable = table("flavor", 10);
  const [nextStored] = await pipeline([["GET", `sd:ctrlj:${last + 1}`]]);
  const next = nextStored ? JSON.parse(nextStored) : await decide(last + 1);
  return {
    generatedAt: new Date().toISOString(), window: `Puzzle No. ${nos[0]}–${last} (${days} days)`, sampleNote: attempts < 50 ? "Under 50 attempts: treat everything as an early signal." : attempts < 100 ? "50–99 attempts: initial signal only." : null,
    performance: { totalAttempts: attempts, uniquePlayers, finishedRounds: all.finished, solveRate: all.solveRate, firstGuessAccuracy: all.firstGuessRate,
      medianGuessesToSolve: median("g|", 1), medianSolveSeconds: median("t|", 10), avgSolveSeconds: all.avgSolveSeconds, hintUsage: all.hintRate,
      skipRate: rates((dims.mode && dims.mode.endless) || {}).skipRate ?? null, abandonmentRate: (() => { const st = (dayTot["start|daily"] || 0) + (dayTot["start|challenge"] || 0); const f = ((dims.mode?.daily?.fin) || 0) + ((dims.mode?.challenge?.fin) || 0); return st ? r2(Math.max(0, st - f) / st) : null; })(),
      partialAnswerRate: dayTot.guesses ? r2((dayTot.partial || 0) / dayTot.guesses) : null, typoCorrectedGuessRate: dayTot.guesses ? r2((dayTot.fuzzy || 0) / dayTot.guesses) : null },
    byMode: table("mode", 1), perDay,
    difficulty: { currentAverage: all.avgPriorDifficulty, observed: all.observedDifficulty, currentTarget: (await controllerFor(last)).target, recommendedTarget: next.target, bands: table("band", 5) },
    flavorTrends: { easiest: [...flavorTable].reverse().slice(0, 8), hardest: flavorTable.slice(0, 8), mostConfused: wrongList.slice(0, 10).map((x) => ({ ...x, share: r2(x.count / (wrongTot || 1)) })) },
    puzzleTrends: { pairTypes: table("pairType", 5), categoryPairs: table("catPair", 5), country: table("country", 5), familiarity: table("famBand", 5) },
    commonWrongAnswers: { top: wrongList.slice(0, 15), entropy: entropy(wrongList) },
    flaggedPuzzles: flagged.slice(0, 25),
    adjustment: next,
  };
}

module.exports = { todayNo, controllerFor, learned, report, rates, observed, entropy, HINTS };
