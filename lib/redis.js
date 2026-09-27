// Tiny Upstash Redis REST client (no dependencies).
// Works with the env vars the Vercel Marketplace "Upstash for Redis" integration adds
// (KV_REST_API_URL / KV_REST_API_TOKEN) or Upstash's own names.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function pipeline(cmds) {
  if (!URL_ || !TOKEN) throw new Error("Redis is not connected (missing KV_REST_API_URL / KV_REST_API_TOKEN)");
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("Redis error " + r.status);
  const out = await r.json();
  return out.map((x) => (x && "result" in x ? x.result : null));
}

// Key layout (all keys expire after 180 days)
const K = {
  days: "sd:days",                                   // SET of "mode:no"
  round: (m, n, r) => `sd:r:${m}:${n}:${r}`,          // HASH items, players, won, lost, misses, score, guesses, hintStart
  wrong: (m, n, r) => `sd:rw:${m}:${n}:${r}`,         // ZSET wrong guesses
  right: (m, n, r) => `sd:rc:${m}:${n}:${r}`,         // ZSET correct guesses
  started: (m, n, r) => `sd:rp:${m}:${n}:${r}`,       // SET players who guessed in this round
  seen: (m, n, r) => `sd:rg:${m}:${n}:${r}`,          // SET "player|guess" (count each guess once per player)
  finished: (m, n, r) => `sd:rd:${m}:${n}:${r}`,      // SET players who finished this round
  game: (m, n) => `sd:g:${m}:${n}`,                   // HASH finished, total, perfect
  gameDone: (m, n) => `sd:gd:${m}:${n}`,              // SET players who finished the whole game
  players: (m, n) => `sd:pl:${m}:${n}`,               // HyperLogLog of players
};
const TTL = 60 * 60 * 24 * 180;

module.exports = { pipeline, K, TTL };
