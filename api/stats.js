// GET /api/stats?days=7 — per-puzzle, per-round Daily/Challenge stats (anonymous) plus today's controller decision.
const { getStats } = require("../lib/stats");
const { todayNo, controllerFor } = require("../lib/analytics");
module.exports = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(60, Number((req.query || {}).days) || 7));
    const stats = await getStats(days);
    stats.difficulty = await controllerFor(todayNo());
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(stats);
  } catch (e) {
    return res.status(503).json({ error: String(e.message || e) });
  }
};
