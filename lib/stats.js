const { pipeline, K } = require("./redis");

const hash = (arr) => { const o = {}; for (let i = 0; arr && i < arr.length; i += 2) o[arr[i]] = arr[i + 1]; return o; };
const zlist = (arr) => { const o = []; for (let i = 0; arr && i < arr.length; i += 2) o.push({ flavor: arr[i], count: Number(arr[i + 1]) }); return o; };
const ROUNDS = { daily: 3, challenge: 1 };

// Aggregated stats for the most recent `days` puzzles of each mode.
async function getStats(days = 7) {
  const [members] = await pipeline([["SMEMBERS", K.days]]);
  const byMode = { daily: [], challenge: [] };
  (members || []).forEach((m) => { const [mode, no] = m.split(":"); if (byMode[mode]) byMode[mode].push(Number(no)); });
  const out = { generatedAt: new Date().toISOString(), days, modes: {} };
  for (const mode of Object.keys(byMode)) {
    const nos = [...new Set(byMode[mode])].sort((a, b) => b - a).slice(0, days).sort((a, b) => a - b);
    const cmds = [];
    for (const no of nos) {
      cmds.push(["HGETALL", K.game(mode, no)], ["PFCOUNT", K.players(mode, no)]);
      for (let r = 0; r < ROUNDS[mode]; r++)
        cmds.push(["HGETALL", K.round(mode, no, r)], ["ZREVRANGE", K.wrong(mode, no, r), 0, 9, "WITHSCORES"], ["ZREVRANGE", K.right(mode, no, r), 0, 9, "WITHSCORES"]);
    }
    const res = cmds.length ? await pipeline(cmds) : [];
    let i = 0; const puzzles = [];
    for (const no of nos) {
      const g = hash(res[i++]); const players = Number(res[i++]) || 0; const rounds = [];
      for (let r = 0; r < ROUNDS[mode]; r++) {
        const h = hash(res[i++]); const wrong = zlist(res[i++]); const right = zlist(res[i++]);
        const won = +h.won || 0, lost = +h.lost || 0, fin = won + lost;
        rounds.push({
          round: r + 1, items: h.items ? JSON.parse(h.items) : [], players: +h.players || 0, finished: fin, won, lost,
          solveRate: fin ? +(won / fin).toFixed(3) : null,
          avgMisses: fin ? +((+h.misses || 0) / fin).toFixed(2) : null,
          avgScore: fin ? Math.round((+h.score || 0) / fin) : null,
          firstGuessRate: fin ? +((+h.first || 0) / fin).toFixed(3) : null, hintRate: fin ? +((+h.hint || 0) / fin).toFixed(3) : null,
          avgSolveSeconds: won ? Math.round((+h.tsolve || 0) / won) : null, pair: h.pair || null, difficulty: h.difficulty ? +h.difficulty : null,
          topWrong: wrong, topCorrect: right,
        });
      }
      const gf = +g.finished || 0;
      puzzles.push({ no, players, gamesFinished: gf, avgTotal: gf ? Math.round((+g.total || 0) / gf) : null, perfect: +g.perfect || 0, rounds });
    }
    out.modes[mode] = { puzzles };
  }
  return out;
}

module.exports = { getStats };
