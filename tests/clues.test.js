// Guards the taste clues and hot/cold: fixed per round, sensible, and never about answers already found.
const test = require("node:test"), assert = require("node:assert/strict");
const { loadGame } = require("./load");
const { run } = loadGame();

test("every Daily round shows 3 to 5 taste columns, and they're the same for everyone", () => {
  const cols = run(`[...Array(40)].flatMap((_, d) => dealDay("daily", d + 1)).map(r => roundTraits(r.map(i => SNACKS[i]), sharedOf(r)))`);
  for (const c of cols) assert.ok(c.length >= 3 && c.length <= 5, c.join(""));
  assert.deepEqual(cols, run(`[...Array(40)].flatMap((_, d) => dealDay("daily", d + 1)).map(r => roundTraits(r.map(i => SNACKS[i]), sharedOf(r)))`));
  // Bitter is red on nearly every round, so it should almost never take a column
  assert.ok(cols.filter(c => c.includes("b")).length < cols.length * 0.1);
});

test("an all-fruit answer set keeps the Fruity column", () => {
  const r = run(`(() => { const r = dealDay("daily", 1).concat(...[...Array(60)].map((_, d) => dealDay("daily", d + 2)))
    .find(r => { const a = sharedOf(r); return a.length >= 3 && a.every(f => hasTrait(f, "f")); });
    return r && roundTraits(r.map(i => SNACKS[i]), sharedOf(r)); })()`);
  assert.ok(r && r.includes("f"), JSON.stringify(r));
});

test("counts say how many answers have the taste", () => {
  assert.equal(run(`traitCount(["Lemon","Cheese","Mango"], "o")`), 1);
  assert.equal(run(`traitCount(["Lemon","Cheese","Mango"], "w")`), 2);
});

test("hot, warm and cold", () => {
  assert.equal(run(`temperature("Lemon", ["Lime"])`), "hot");          // same neighborhood
  assert.equal(run(`temperature("Habanero", ["Hot & Spicy"])`), "hot"); // same flavor line
  assert.equal(run(`temperature("Mango", ["Lime"])`), "warm");         // same family
  assert.equal(run(`temperature("Chicken", ["Strawberry"])`), "cold");
  assert.equal(run(`temperature("Lemon", [])`), null);
});

test("a guess is judged only against answers not found yet", () => {
  const r = run(`(() => { for (const i of PAIRS) { const a = sharedOf(i);
      if (a.includes("Lime") && !a.includes("Lemon") && !a.some(x => x !== "Lime" && neighbors("Lemon", x)))
        return guessTemps({ items: i, guesses: ["Lemon", "Lime", "Lemon"] }); } })()`);
  assert.ok(r, "no pair with Lime to test");
  assert.equal(r[0], "hot");        // Lime still to find
  assert.equal(r[1], null);         // right answer
  assert.notEqual(r[2], "hot");     // Lime found, so Lemon isn't hot any more
});
