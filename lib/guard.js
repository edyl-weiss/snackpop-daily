// Request guards shared by the /api functions: rate limiting, origin checks, size limits and the stats key.
// No IP address is ever stored. Rate-limit counters use a salted one-way hash of the IP that expires within a day.
const crypto = require("crypto");
const { pipeline } = require("./redis");

// ---- limits (requests per window, per visitor) ----
const LIMITS = {
  log: { perMinute: 40, playersPerDay: 25 },   // a full Daily game sends about 15 events
  config: { perMinute: 30 },
  admin: { perMinute: 10 },
};
const MAX_BODY_BYTES = 8 * 1024;               // real events are under 2 KB

function clientIp(req) {
  const h = req.headers || {};
  const v = h["x-real-ip"] || h["x-vercel-forwarded-for"] || String(h["x-forwarded-for"] || "").split(",")[0];
  return String(v || "unknown").trim().slice(0, 64);
}

// Salted, truncated hash so the counters can't be turned back into an IP address.
function visitorId(req) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.KV_REST_API_TOKEN || "snackdle";
  return crypto.createHash("sha256").update(salt + "|" + clientIp(req)).digest("hex").slice(0, 16);
}

// First line of defence: a small in-memory counter per warm function instance.
// It turns away obvious floods before they cost a Redis call.
const mem = new Map();
function memoryHit(key, limit, windowMs) {
  const now = Date.now();
  let e = mem.get(key);
  if (!e || now > e.reset) { e = { n: 0, reset: now + windowMs }; mem.set(key, e); }
  e.n++;
  if (mem.size > 5000) for (const [k, v] of mem) if (now > v.reset) mem.delete(k);
  return e.n > limit;
}

// Returns true when the request is allowed. Sends a 429 and returns false otherwise.
async function rateLimit(req, res, bucket) {
  const lim = LIMITS[bucket];
  const id = visitorId(req);
  if (memoryHit(bucket + "|" + id, lim.perMinute, 60000)) return tooMany(res, 60);
  const win = Math.floor(Date.now() / 60000);
  const key = `sd:rl:${bucket}:${id}:${win}`;
  try {
    const [n] = await pipeline([["INCR", key], ["EXPIRE", key, 90]]);
    if (n > lim.perMinute) return tooMany(res, 60);
  } catch (e) {
    // If Redis is down, fall back to the in-memory limit above rather than blocking real players.
  }
  return true;
}

function tooMany(res, retry) {
  res.setHeader("Retry-After", String(retry));
  res.status(429).json({ error: "Too many requests. Try again in a minute." });
  return false;
}

// Caps how many different player IDs one visitor can create in a day, so nobody can
// fake hundreds of "players" to skew the difficulty controller. Extra events are
// accepted with a 204 but not counted, so there's no signal to work around.
async function playerAllowed(req, no, player) {
  const key = `sd:ipp:${no}:${visitorId(req)}`;
  try {
    const [, count] = await pipeline([["SADD", key, player], ["SCARD", key], ["EXPIRE", key, 60 * 60 * 26]]);
    return count <= LIMITS.log.playersPerDay;
  } catch (e) {
    return true;
  }
}

// Browsers always send Origin on a POST. Reject posts made from other websites.
function sameOrigin(req) {
  const origin = (req.headers || {}).origin;
  if (!origin) return true; // non-browser clients; the rate limit still applies
  try {
    const host = String((req.headers || {})["x-forwarded-host"] || (req.headers || {}).host || "");
    return new URL(origin).host === host;
  } catch (e) {
    return false;
  }
}

function bodyTooLarge(req) {
  const len = Number((req.headers || {})["content-length"] || 0);
  if (len > MAX_BODY_BYTES) return true;
  const b = req.body;
  if (typeof b === "string") return b.length > MAX_BODY_BYTES;
  try { return JSON.stringify(b || {}).length > MAX_BODY_BYTES; } catch (e) { return true; }
}

// /api/report and /api/stats show today's answers, so they are private.
// Set STATS_KEY in Vercel (Settings → Environment Variables), then open
// /api/report?key=YOUR_KEY or send "Authorization: Bearer YOUR_KEY".
// With no STATS_KEY set, both endpoints stay closed.
function adminAllowed(req) {
  const want = process.env.STATS_KEY;
  if (!want || want.length < 12) return false;
  const h = String((req.headers || {}).authorization || "");
  const got = h.startsWith("Bearer ") ? h.slice(7) : String((req.query || {}).key || "");
  const a = crypto.createHash("sha256").update(got).digest();
  const b = crypto.createHash("sha256").update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

function onlyMethod(req, res, method) {
  if (req.method === method || (method === "GET" && req.method === "HEAD")) return true;
  res.setHeader("Allow", method);
  res.status(405).json({ error: method + " only" });
  return false;
}

module.exports = { rateLimit, playerAllowed, sameOrigin, bodyTooLarge, adminAllowed, onlyMethod, LIMITS };
