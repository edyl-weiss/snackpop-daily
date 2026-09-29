// Server settings, scoring, the game object, dealing today's rounds, saving, Endless.
// Everything the server decides for today lives in one place; only applyConfig() (ui.js) writes it.
const CFG={
  analytics:false,                               // true only on the public site with the database connected
  diff:{level:"normal",hint1At:2,hint2At:4,label:"Standard hints"},   // hint timing
  target:5,                                      // shared difficulty target for today's Daily/Challenge
  learned:{pairs:{},flavors:{}},                 // observed difficulty per puzzle key / flavor: [difficulty, finished rounds]
  avoid:new Set(),                               // puzzle keys flagged as ambiguous; skipped when dealing
  fallback:false                                 // true when /api/config couldn't be reached (defaults in use)
};

const ROUND_POINTS=1000, MISS_COST=125, MAX_MISSES=6, NEED_CAP=3;   // NEED_CAP = most flavors a round asks for
const MODES={
  daily:{label:"Daily",rounds:3,size:2,key:"snackdle-d8-",stats:"snackdle-s5-daily"},
  challenge:{label:"Challenge",rounds:1,size:3,key:"snackdle-c8-",stats:"snackdle-s5-challenge"},
  endless:{label:"Endless",rounds:1}
};
// Which answer does a guess find? The flavor itself, or the specific shared flavor it's the broad version of.
function matchGuess(g,answers,items,found){
  if(answers.includes(g)) return g;
  if(!items.every(s=>itemHas(s,g))) return null;
  const kids=answers.filter(a=>isChildOf(a,g));
  return kids.find(a=>!found.includes(a))||kids[0]||null;
}
// A round: items (indexes), guesses. Derived: answers, need, found, misses, done, won, score.
function roundInfo(rd){
  const items=rd.items.map(i=>SNACKS[i]);
  const answers=sharedOf(rd.items);
  const need=Math.min(answers.length,NEED_CAP);
  const found=[]; let misses=0;
  rd.guesses.forEach(g=>{const a=matchGuess(g,answers,items,found); if(a){ if(!found.includes(a)) found.push(a) } else misses++;});
  const won=found.length>=need, lost=!won&&(rd.free?!!rd.revealed:misses>=MAX_MISSES);
  const score=Math.max(0,Math.round(ROUND_POINTS*Math.min(found.length,need)/need)-MISS_COST*misses);
  return {items,answers,need,found,misses,won,lost,done:won||lost,score};
}

// game = {mode, no, rounds:[{items,guesses}], cur}
let game=null, endlessSize=2;
const cur = () => game.rounds[game.cur];
const info = () => roundInfo(cur());
const gameDone = () => game.rounds.every(r=>roundInfo(r).done);
const gameTotal = () => game.rounds.reduce((t,r)=>t+roundInfo(r).score,0);

/* A day this player has already started is restored exactly as saved (by item names), so their puzzles can't
   change mid-day even if the data, the server's settings or their connection changed since. */
function loadDaily(m){
  const no=todayNumber(), M=MODES[m];
  const saved=store.get(M.key+no,null);
  let rounds=null;
  if(saved&&Array.isArray(saved.rounds)&&saved.rounds.length===M.rounds){
    const restored=saved.rounds.map(sr=>{ const items=idxOf(sr.names); return items&&items.length===M.size?{...sr,items,names:undefined,guesses:Array.isArray(sr.guesses)?sr.guesses:[]}:null; });
    if(restored.every(Boolean)) rounds=restored;
  }
  if(!rounds) rounds=dealDay(m,no).map(items=>({items,guesses:[]}));
  game={mode:m,no,rounds,cur:0};
  game.cur=Math.max(0,rounds.findIndex(r=>!roundInfo(r).done)); if(rounds.every(r=>roundInfo(r).done)) game.cur=rounds.length-1;
  finishLoad();
}
// Integer hash: picks each day's starting point in the shuffled pool, the same for everyone on that day.
function hash32(n){ n=Math.imul(n^0x9e3779b9,0x85ebca6b); n^=n>>>13; n=Math.imul(n,0xc2b2ae35); return (n^(n>>>16))>>>0; }
/* Daily tiers: round 1 Easy, round 2 Medium, round 3 Hard. Each tier has hard rules; the adaptive target (CFG.target) only
   moves the pick within the tier's window, so round 1 always stays easy and round 3 always stays hard.
   Popular flavor = one of the everyday flavors (EASY_F) or one sold by 25+ items in the game. */
const isPopular=f=>EASY_F.has(f)||FLAVOR_COUNT[f]>=25;
const TIERS=[
  {name:"Easy",  win:[1,4.2],   off:-1.5, ok:(p,it)=>p.answers.every(isPopular)&&it.every(s=>!NICHE.has(s.n))&&p.primary&&EASY_F.has(p.primary)},
  {name:"Medium",win:[3.8,6.2], off:0,    ok:(p,it)=>p.answers.some(isPopular)&&!(p.answers.every(f=>EASY_F.has(f)))&&it.filter(s=>NICHE.has(s.n)).length<2},
  {name:"Hard",  win:[5.6,10],  off:1.5,  ok:(p,it)=>p.answers.filter(isPopular).length<Math.min(p.answers.length,NEED_CAP)}
];
const CHALLENGE_TIER={name:"Challenge",win:[1,10],off:0.5,ok:()=>true};
const tierFor=(m,r)=>MODES[m].rounds===3?TIERS[r]:CHALLENGE_TIER;
function pickInTier(pool,start,tier,exclude,minD){
  const t=Math.max(tier.win[0],Math.min(tier.win[1],CFG.target+tier.off));
  let best=null,bestD=1e9;
  for(let pass=0;pass<3&&!best;pass++){           // pass 0: all rules · 1: drop the window · 2: anything unused
    for(let k=0;k<pool.length;k++){
      const idx=pool[(start+k)%pool.length];
      if(idx.some(i=>exclude.has(i))) continue;
      const p=profileOf(idx); if(CFG.avoid.has(p.key)) continue;
      if(pass<2&&!tier.ok(p,idx.map(i=>SNACKS[i]))) continue;
      if(pass<1&&(p.difficulty<tier.win[0]||p.difficulty>tier.win[1]||p.difficulty<=minD)) continue;
      const dd=Math.abs(p.difficulty-t);
      if(dd<=0.4) return idx;
      if(dd<bestD){bestD=dd;best=idx}
      if(k>4000&&best) break;
    }
  }
  return best||pool[start%pool.length];
}
function dealDay(m,no){
  const M=MODES[m], pool=M.size===3?getDailyTrios():DAILY_PAIRS, used=new Set(), out=[];
  let prevD=0;
  for(let r=0;r<M.rounds;r++){
    const idx=pickInTier(pool,hash32(no*7+r*131+(M.size===3?999:0))%pool.length,tierFor(m,r),used,prevD);
    prevD=profileOf(idx).difficulty;
    idx.forEach(i=>used.add(i)); out.push([...idx]);
  }
  return out;
}
function saveDaily(){ store.set(MODES[game.mode].key+game.no,{rounds:game.rounds.map(r=>({...r,items:undefined,names:namesOf(r.items)}))}); }
// Endless: shuffled bag, no repeats until the whole pool has been played.
/* Endless state is kept by item names plus DATA_SIG. The "bags" hold positions in the pools, so they're thrown
   away (and rebuilt) whenever the data changed; the current puzzle survives if its items still exist. */
function endlessState(){
  const st=store.get("snackdle-endless8",null)||{};
  const out={size:st.size===3?3:2,guesses:Array.isArray(st.guesses)?st.guesses:[],revealed:!!st.revealed,t0:st.t0,bag2:[],bag3:[],cur:null,sig:DATA_SIG};
  const names=st.curNames||(Array.isArray(st.cur)&&st.cur.every(i=>Number.isInteger(i)&&i>=0&&i<SNACKS.length)?namesOf(st.cur):null);
  out.cur=idxOf(names);
  if(!out.cur) out.guesses=[];
  if(st.sig===DATA_SIG){ out.bag2=Array.isArray(st.bag2)?st.bag2:[]; out.bag3=Array.isArray(st.bag3)?st.bag3:[]; }
  return out;
}
function saveEndless(st){ store.set("snackdle-endless8",{...st,cur:undefined,curNames:st.cur?namesOf(st.cur):null,sig:DATA_SIG}); }
/* Player skill: rolling record of this player's last 20 finished rounds (any mode), kept in this browser.
   Every 5 rounds the player's Endless target moves by at most 0.5, per the spec's gradual-adjustment rules. */
function skillState(){ return store.get("snackdle-skill",{target:4.5,hist:[],sinceChange:0}); }
function recordSkill(R){
  const sk=skillState();
  sk.hist=[...sk.hist,{won:R.won,misses:R.misses,hint:R.hintUsed?1:0,first:R.firstWin?1:0}].slice(-20);
  sk.sinceChange=(sk.sinceChange||0)+1;
  if(sk.sinceChange>=5&&sk.hist.length>=8){
    const last=sk.hist.slice(-10), n=last.length;
    const solve=last.filter(x=>x.won).length/n, miss=last.reduce((t,x)=>t+x.misses,0)/n, hint=last.reduce((t,x)=>t+x.hint,0)/n;
    let delta=0;
    if(solve>=0.8&&miss<1.5&&hint<0.2) delta=0.5;
    else if(solve<0.4||miss>4) delta=-0.5;
    if(delta){ sk.target=Math.max(2,Math.min(8,sk.target+delta)); sk.sinceChange=0; }
  }
  store.set("snackdle-skill",sk);
}
function nextEndless(st){
  const bagKey="bag"+st.size, pool=st.size===3?getTrios():PAIRS;
  st[bagKey]=(st[bagKey]||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<pool.length);
  if(!st[bagKey].length) st[bagKey]=shuffleWith(pool.map((_,i)=>i),Math.random);
  const bag=st[bagKey], target=skillState().target;
  // look at up to 60 random candidates still in the bag and take the one nearest this player's level
  let bestPos=bag.length-1,bestD=1e9;
  for(let k=0;k<Math.min(60,bag.length);k++){
    const pos=Math.floor(Math.random()*bag.length), p=profileOf(pool[bag[pos]]);
    if(CFG.avoid.has(p.key)) continue;
    const dd=Math.abs(p.difficulty-target)+Math.random()*0.3;
    if(dd<bestD){bestD=dd;bestPos=pos}
  }
  const pick=bag.splice(bestPos,1)[0];
  st.cur=shuffleWith([...pool[pick]],Math.random); st.guesses=[]; st.revealed=false; st.t0=Date.now();
}
function loadEndless(forceNew){
  const st=endlessState();
  if(forceNew||!st.cur||st.cur.length!==st.size){ nextEndless(st); saveEndless(st); }
  endlessSize=st.size;
  game={mode:"endless",no:null,rounds:[{items:st.cur,guesses:st.guesses,free:true,revealed:!!st.revealed,t0:st.t0}],cur:0};
  finishLoad();
}
function finishLoad(){
  $("#msg").textContent=""; $("#guess").value=""; closeSugg();
  try{ if(location.hash!=="#"+game.mode) history.replaceState(null,"","#"+game.mode) }catch(e){}
  render();
}
function switchMode(m){ if(m==="endless") loadEndless(false); else loadDaily(m); }
