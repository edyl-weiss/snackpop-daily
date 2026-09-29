// Loads the game's data, language and logic scripts into a sandbox, in the order index.html lists them,
// so tests run against exactly what the browser runs. The screen scripts (js/ui/) need a real page and
// are left out. Each call gives a fresh game with its own fake localStorage.
const fs = require("fs"), path = require("path"), vm = require("vm");
const SITE = path.join(__dirname, "..");

function scriptList() {
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  return [...html.matchAll(/<script src="(js\/[\w/-]+\.js)"><\/script>/g)].map(m => m[1]);
}

function loadGame({ saved = {}, lang = "en", edit } = {}) {
  const storage = new Map(Object.entries(saved).map(([k, v]) => [k, JSON.stringify(v)]));
  const ctx = vm.createContext({
    console, URLSearchParams, Intl,
    localStorage: { getItem: k => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)) },
    location: { search: `?lang=${lang}`, protocol: "file:", hash: "" },
    navigator: { language: lang },
    document: { querySelector: () => null },
  });
  for (const f of scriptList().filter(f => !f.startsWith("js/ui/"))) {
    vm.runInContext(fs.readFileSync(path.join(SITE, f), "utf8"), ctx, { filename: f });
    if (edit && f === "js/data/snacks.js") vm.runInContext(edit, ctx);   // let a test change the data before the logic reads it
  }
  // results come back as plain JSON so assertions compare values, not objects from another realm
  const run = code => { const v = vm.runInContext(code, ctx); return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };
  return { run, storage };
}
module.exports = { loadGame, scriptList, SITE };
