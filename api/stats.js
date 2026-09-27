// GET /api/stats?days=7 — per-puzzle, per-round Daily/Challenge stats (anonymous) plus today's controller decision.
const { getStats } = require("../lib/stats");
const { todayNo, controllerFor } = require("../lib/analytics");
const { rateLimit, adminAllowed, onlyMethod } = require("../lib/guard");
module.exports = async (req, res) => {
  if (!onlyMethod(req, res, "GET")) return;
  if (!(await rateLimit(req, res, "admin"))) return;
  if (!adminAllowed(req)) return res.status(404).json({ error: "not found" });
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const days = Math.max(1, Math.min(60, Number((req.query || {}).days) || 7));
    const stats = await getStats(days);
    stats.difficulty = await controllerFor(todayNo());
        return res.status(200).json(stats);
  } catch (e) {
    console.error("stats failed:", e);
    return res.status(503).json({ error: "unavailable" });
  }
};
