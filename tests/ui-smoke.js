// Browser smoke test: every mode and language loads without script errors and a guess round-trips.
// Needs Playwright (npm i -D playwright && npx playwright install chromium). Run: node tests/ui-smoke.js
const { chromium } = require("playwright");
const path = require("path");
const page = "file://" + path.join(__dirname, "..", "index.html");

(async () => {
  const browser = await chromium.launch(); let failed = 0;
  for (const [lang, width] of [["en", 1280], ["en", 390], ["fr", 390], ["es", 390], ["zh", 390], ["ja", 390]]) {
    for (const mode of ["daily", "challenge", "endless"]) {
      const p = await browser.newPage({ viewport: { width, height: 900 } }); const errors = [];
      p.on("pageerror", e => errors.push(e.message));
      await p.goto(`${page}?lang=${lang}#${mode}`, { waitUntil: "domcontentloaded" });
      await p.waitForFunction(() => typeof game !== "undefined" && game);
      const answer = await p.evaluate(() => fn(info().answers[0]));      // type it the way a player in this language would
      await p.fill("#guess", answer); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
      const ok = await p.evaluate(() => cur().guesses.length === 1 && info().found.length === 1 && document.querySelectorAll("#rows .grow").length >= 1);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (errors.length || !ok || overflow) { failed++; console.log("FAIL", lang, width, mode, { errors, ok, overflow }); }
      await p.close();
    }
  }
  await browser.close();
  console.log(failed ? `${failed} failed` : "ui smoke: all passed"); process.exit(failed ? 1 : 0);
})();
