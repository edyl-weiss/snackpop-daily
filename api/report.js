// GET /api/report?days=7 — the analysis cycle output (performance, difficulty, flavor and puzzle trends,
// common wrong answers, flagged puzzles, next adjustment). Aggregated and anonymous.
const { report } = require("../lib/analytics");
const { rateLimit, adminAllowed, onlyMethod } = require("../lib/guard");
module.exports = async (req, res) => {
  if (!onlyMethod(req, res, "GET")) return;
  if (!(await rateLimit(req, res, "admin"))) return;
  if (!adminAllowed(req)) return res.status(404).json({ error: "not found" });
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const q = req.query || {};
    const days = Math.max(1, Math.min(60, Number(q.days) || 7));
    const out = await report(days, Number(q.no) || undefined);
    return res.status(200).json(out);
  } catch (e) {
    console.error("stats failed:", e);
    return res.status(503).json({ error: "unavailable" });
  }
};
