// Guards the server functions with an in-memory stand-in for Redis (no network, no real database).
const test = require("node:test"), assert = require("node:assert/strict");
const path = require("path");

// A tiny fake of the Redis commands the functions use.
function fakeRedis() {
  const kv = new Map(), sets = new Map(), hashes = new Map();
  const cmds = [];
  const run = ([c, k, ...a]) => {
    cmds.push(c);
    switch (c) {
      case "INCR": kv.set(k, (+kv.get(k) || 0) + 1); return kv.get(k);
      case "SADD": { const s = sets.get(k) || new Set(); const had = s.has(a[0]); s.add(a[0]); sets.set(k, s); return had ? 0 : 1; }
      case "SCARD": return (sets.get(k) || new Set()).size;
      case "HINCRBY": { const h = hashes.get(k) || {}; h[a[0]] = (h[a[0]] || 0) + Number(a[1]); hashes.set(k, h); return h[a[0]]; }
      case "GET": return kv.has(k) ? kv.get(k) : null;
      case "SET": if (a.includes("NX") && kv.has(k)) return null; kv.set(k, a[0]); return "OK";
      default: return 1;
    }
  };
  return { pipeline: async list => list.map(run), kv, sets, hashes, cmds };
}
function withFake(fake) {
  const redisPath = require.resolve(path.join(__dirname, "../lib/redis"));
  require.cache[redisPath] = { id: redisPath, filename: redisPath, loaded: true, exports: { pipeline: fake.pipeline, K: require("../lib/redis").K, TTL: 1 } };
  for (const m of ["../lib/limits", "../api/log", "../lib/analytics"]) delete require.cache[require.resolve(m)];
}
const res = () => { const r = { code: 0, body: null }; r.status = c => { r.code = c; return r; }; r.json = b => { r.body = b; return r; }; r.end = () => r; return r; };
const guess = (player, ip) => ({ method: "POST", headers: { "x-forwarded-for": ip },
  body: { t: "guess", mode: "daily", no: 5, r: 0, player, pair: "abc123", guess: "Cheese", correct: false } });

test("one network can't invent unlimited players", async () => {
  const fake = fakeRedis(); withFake(fake);
  const log = require("../api/log");
  const { PLAYERS_PER_DAY } = require("../lib/limits");
  let stored = 0, ignored = 0;
  for (let i = 0; i < PLAYERS_PER_DAY + 10; i++) {
    const r = res(); await log(guess("player" + String(i).padStart(4, "0"), "203.0.113.9"), r);
    r.code === 204 ? stored++ : r.code === 202 ? ignored++ : assert.fail("unexpected " + r.code);
  }
  assert.equal(stored, PLAYERS_PER_DAY); assert.equal(ignored, 10);
  const r = res(); await log(guess("someoneelse1", "198.51.100.7"), r);   // a different network is unaffected
  assert.equal(r.code, 204);
});

test("the network id is a salted hash, never the IP itself", async () => {
  const fake = fakeRedis(); withFake(fake);
  const log = require("../api/log");
  await log(guess("abcdefgh1", "203.0.113.9"), res());
  const keys = [...fake.kv.keys(), ...fake.sets.keys(), ...fake.hashes.keys()];
  assert.ok(keys.length > 0 && keys.every(k => !k.includes("203.0.113.9")));
});

test("bad input is rejected before touching the database", async () => {
  const fake = fakeRedis(); withFake(fake);
  const log = require("../api/log");
  const r = res(); await log({ method: "POST", headers: {}, body: { t: "guess", mode: "daily", no: 5, player: "x", pair: "1-2" } }, r);
  assert.equal(r.code, 400); assert.equal(fake.cmds.length, 0);
});

test("learned difficulty is frozen for the whole puzzle day", async () => {
  const fake = fakeRedis(); withFake(fake);
  const { learnedFor } = require("../lib/analytics");
  const first = await learnedFor(9);
  fake.hashes.set("sd:pair:zz", { fin: 40, won: 1 });              // new data arrives later that day…
  fake.sets.set("sd:pairs", new Set(["zz"]));
  assert.deepEqual(await learnedFor(9), first);                    // …but day 9 keeps the numbers it started with
});
