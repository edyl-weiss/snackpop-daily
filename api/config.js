// GET /api/config?no=N — today's difficulty target, hint timing, learned pair/flavor difficulty and pairs to avoid.
const { todayNo, controllerFor, learnedFor } = require("../lib/analytics");
module.exports = async (req, res) => {
  const est = todayNo(), asked = Number((req.query || {}).no);
  const no = Number.isInteger(asked) && Math.abs(asked - est) <= 1 ? asked : est;
  try {
    const ctrl = await controllerFor(no);
    const L = await learnedFor(no);
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({ analytics: true, no, target: ctrl.target,
      difficulty: { level: ctrl.hint, hint1At: ctrl.hint1At, hint2At: ctrl.hint2At, label: ctrl.label, reason: ctrl.reason },
      learned: { pairs: L.pairs, flavors: L.flavors }, avoid: L.avoid });
  } catch (e) {
    return res.status(200).json({ analytics: false, no, target: 5, difficulty: { level: "normal", hint1At: 2, hint2At: 4, label: "Standard hints", reason: String(e.message || e) } });
  }
};
