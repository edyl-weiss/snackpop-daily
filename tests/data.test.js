// Guards the game data: catches the mistakes that are easy to make when editing a list by hand.
const test = require("node:test"), assert = require("node:assert/strict");
const { loadGame } = require("./load");
const g = loadGame(), run = g.run;

test("every flavor a snack lists exists in FLAVORS", () => {
  const bad = run(`SNACKS.flatMap(s => s.f.filter(f => !FLAVORS[f]).map(f => s.n + ": " + f))`);
  assert.deepEqual(bad, []);
});
test("snack names are unique (saved games and puzzle keys depend on it)", () => {
  const dupes = run(`SNACKS.map(s => s.n).filter((n, i, a) => a.indexOf(n) !== i)`);
  assert.deepEqual(dupes, []);
});
test("every flavor has taste traits", () => {
  assert.deepEqual(run(`Object.keys(FLAVORS).filter(f => !TASTE[f])`), []);
  assert.deepEqual(run(`Object.keys(TASTE).filter(f => !FLAVORS[f])`), []);
});
test("every flavor neighborhood uses real flavor names, and every flavor has a neighborhood", () => {
  assert.deepEqual(run(`NEIGHBORHOODS.flat().filter(f => !FLAVORS[f])`), []);
  assert.deepEqual(run(`Object.keys(FLAVORS).filter(f => !NEIGHBORHOODS.some(h => h.includes(f)))`), []);
});
test("every flavor has a name in every language", () => {
  for (const t of ["FR_FLAVORS", "ES_FLAVORS", "ZH_FLAVORS", "JA_FLAVORS"])
    assert.deepEqual(run(`Object.keys(FLAVORS).filter(f => !${t}[f])`), [], t);
});
test("every product type, country and flavor family is translated", () => {
  for (const L of ["FR", "ES", "ZH", "JA"]) {
    assert.deepEqual(run(`[...new Set(SNACKS.map(s => s.t))].filter(t => !${L}_TYPES[t])`), [], L + "_TYPES");
    assert.deepEqual(run(`[...new Set(SNACKS.map(s => s.c))].filter(c => !${L}_COUNTRIES[c])`), [], L + "_COUNTRIES");
    assert.deepEqual(run(`[...new Set(Object.values(FLAVORS).map(v => v.fam))].filter(f => !${L}_FAMS[f])`), [], L + "_FAMS");
  }
});
test("every language has every UI text key", () => {
  for (const L of ["fr", "es", "zh", "ja"])
    assert.deepEqual(run(`Object.keys(I18N.en).filter(k => !(k in I18N.${L}) && !["langBtn","langAria","from"].includes(k))`), [], L);
});
test("no spelling means two different flavors across languages (except the known one)", () => {
  assert.deepEqual(run(`LOOKUP_CLASH`), ["mocha"]);
});
