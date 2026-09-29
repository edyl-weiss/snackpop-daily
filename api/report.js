// GET /api/report?days=7 — the analysis cycle output (performance, difficulty, flavor and puzzle trends,
// common wrong answers, flagged puzzles, next adjustment). Aggregated and anonymous.
const { report } = require("../lib/analytics");
module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const days = Math.max(1, Math.min(60, Number(q.days) || 7));
    const out = await report(days, Number(q.no) || undefined);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(out);
  } catch (e) {
    return res.status(503).json({ error: String(e.message || e) });
  }
};
