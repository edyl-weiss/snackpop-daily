// Stops one network from flooding /api/log with invented players, which would skew the daily difficulty.
// The network is identified only by a salted hash of its IP address that changes every puzzle day; the IP
// itself is never stored. Limits are generous because a school or office shares one address.
const crypto = require("crypto");
const { pipeline } = require("./redis");

const EVENTS_PER_MINUTE = 90;   // a fast human makes a few guesses a minute; 90 leaves room for a whole classroom
const PLAYERS_PER_DAY = 30;     // distinct browser ids per network per puzzle day

function networkId(req, no) {
  const h = req.headers || {};
  const ip = String(h["x-forwarded-for"] || "").split(",")[0].trim() || String(h["x-real-ip"] || "") || "unknown";
  return crypto.createHash("sha256").update(`${ip}|${no}|${process.env.LOG_SALT || "snack-crackle-pop"}`).digest("hex").slice(0, 16);
}

async function withinLimits(req, no, player) {
  const id = networkId(req, no), minute = Math.floor(Date.now() / 60000);
  const rate = `sd:rl:${id}:${minute}`, players = `sd:ipp:${id}`;
  const [events, , , , distinct] = await pipeline([
    ["INCR", rate], ["EXPIRE", rate, 120],
    ["SADD", players, player], ["EXPIRE", players, 60 * 60 * 24 * 2], ["SCARD", players],
  ]);
  return events <= EVENTS_PER_MINUTE && distinct <= PLAYERS_PER_DAY;
}

module.exports = { withinLimits, networkId, EVENTS_PER_MINUTE, PLAYERS_PER_DAY };
