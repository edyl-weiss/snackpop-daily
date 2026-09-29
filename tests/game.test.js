// Guards the game logic: guess matching in every language, dealing, saved games and Endless.
const test = require("node:test"), assert = require("node:assert/strict");
const { loadGame } = require("./load");

test("guesses resolve in every language, with typos", () => {
  const { run } = loadGame();
  const cases = {
    "chese": "Cheese", "lime chili": "Chili Lime", "cheddar cheese chips": "Cheese", "flamin hot": "Hot & Spicy",
    "fraise": "Strawberry", "sel et vinaigre": "Salt & Vinegar", "cornichon à l'aneth": "Dill Pickle",
    "cacahuate": "Peanut", "chile y limón": "Chili Lime", "salsa inglesa": "Worcester Sauce",
    "草莓味": "Strawberry", "caomei": "Strawberry", "番茄味薯片": "Tomato", "芥末": "Wasabi",
    "いちご": "Strawberry", "イチゴ": "Strawberry", "のりしお": "Seaweed", "ｺﾝｿﾒ": "Consommé",
  };
  for (const [typed, want] of Object.entries(cases))
    assert.equal(run(`(resolveFlavor(${JSON.stringify(typed)}) || {}).name`), want, typed);
  assert.deepEqual(run(`resolveFlavor("limón")`), { amb: ["Lemon", "Lime"] });
  assert.equal(run(`resolveFlavor("chocolate")`), null);
  assert.equal(run(`resolveFlavor("zzzz")`), null);
});

test("a broad flavor finds the specific answer it covers", () => {
  const { run } = loadGame();
  const i = n => run(`NAME_IDX.get(${JSON.stringify(n)})`);
  const items = JSON.stringify([i("Takis"), i("Kettle Brand")]);   // both have Habanero, which is under Hot & Spicy
  assert.equal(run(`matchGuess("Hot & Spicy", sharedOf(${items}), ${items}.map(k=>SNACKS[k]), [])`) !== null, true);
});

test("the Daily is the same every time for the same day, and gets harder each round", () => {
  const a = loadGame().run(`dealDay("daily", 12).map(namesOf)`), b = loadGame().run(`dealDay("daily", 12).map(namesOf)`);
  assert.deepEqual(a, b);
  const { run } = loadGame();
  for (let no = 1; no <= 30; no++) {
    const d = run(`dealDay("daily", ${no}).map(x => profileOf(x).difficulty)`);
    assert.ok(d[0] < d[1] && d[1] < d[2], `day ${no}: ${d}`);
    assert.ok(run(`dealDay("daily", ${no}).every((x, r) => TIERS[r].ok(profileOf(x), x.map(i => SNACKS[i])))`), `day ${no} tier rules`);
  }
});

test("every pair puzzle joins two countries with 1 to 6 shared flavors", () => {
  const { run } = loadGame();
  assert.equal(run(`PAIRS.filter(p => SNACKS[p[0]].c === SNACKS[p[1]].c || !okLink(sharedOf(p))).length`), 0);
  assert.ok(run(`PAIRS.length`) > 1000);
});

test("puzzle keys depend on item names, not their position in the list", () => {
  const plain = loadGame().run(`pkey([NAME_IDX.get("Pocky"), NAME_IDX.get("Oreo")])`);
  const moved = loadGame({ edit: `SNACKS.reverse()` }).run(`pkey([NAME_IDX.get("Oreo"), NAME_IDX.get("Pocky")])`);
  assert.equal(plain, moved);
});

test("a started day is restored by names even after the snack list changed", () => {
  const first = loadGame();
  const no = first.run(`todayNumber()`);
  const rounds = first.run(`dealDay("daily", ${no}).map(x => ({ names: namesOf(x), guesses: ["Kimchi"] }))`);
  // reversing SNACKS moves every index; the old index-based saves would have shown different products
  const later = loadGame({ edit: `SNACKS.reverse()`, saved: { ["snackdle-d8-" + no]: { rounds } } });
  later.run(`finishLoad = () => {}; loadDaily("daily")`);
  assert.deepEqual(later.run(`game.rounds.map(r => namesOf(r.items))`), rounds.map(r => r.names));
  assert.deepEqual(later.run(`game.rounds.map(r => r.guesses)`), rounds.map(r => r.guesses));
});

test("Endless survives saved progress from an older snack list", () => {
  const { run } = loadGame({ saved: { "snackdle-endless8": { size: 2, cur: [99999, 3], guesses: ["Kimchi"], bag2: [999999, -1, "x"], bag3: [] } } });
  run(`finishLoad = () => {}; loadEndless(false)`);        // used to crash in nextEndless()
  assert.equal(run(`game.rounds[0].items.length`), 2);
  assert.ok(run(`game.rounds[0].items.every(i => i >= 0 && i < SNACKS.length)`));
  assert.deepEqual(run(`game.rounds[0].guesses`), []);
});

test("Endless keeps its place when the data is unchanged", () => {
  const g = loadGame();
  g.run(`finishLoad = () => {}; loadEndless(false)`);
  const names = g.run(`namesOf(game.rounds[0].items)`), saved = JSON.parse(g.storage.get("snackdle-endless8"));
  const again = loadGame({ saved: { "snackdle-endless8": saved } });
  again.run(`finishLoad = () => {}; loadEndless(false)`);
  assert.deepEqual(again.run(`namesOf(game.rounds[0].items)`), names);
  assert.equal(again.run(`endlessState().bag2.length`), saved.bag2.length);
});

test("trios are built lazily and match a full build", () => {
  const { run } = loadGame();
  assert.equal(run(`TRIO_BUILD.i`), 0);                    // nothing built at start-up
  const n = run(`getTrios().length`);
  assert.ok(n > 20000);
  assert.equal(run(`getTrios().filter(t => new Set(t.map(i => SNACKS[i].c)).size < 2).length`), 0);
});

test("scoring", () => {
  const { run } = loadGame();
  const i = run(`dealDay("daily", 3)[0]`);
  const a = run(`sharedOf(${JSON.stringify(i)})`);
  assert.equal(run(`roundInfo({ items: ${JSON.stringify(i)}, guesses: ${JSON.stringify(a.slice(0, 3))} }).score`), 1000);
  assert.equal(run(`roundInfo({ items: ${JSON.stringify(i)}, guesses: ["Kimchi", ...${JSON.stringify(a.slice(0, 3))}] }).score`), 875);
  assert.equal(run(`roundInfo({ items: ${JSON.stringify(i)}, guesses: Array(6).fill(0).map((_, k) => "zz" + k) }).lost`), true);
});
