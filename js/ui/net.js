/* Anonymous analytics (public site only).
   Sends: mode, puzzle no, round, item names, the flavor guessed, right/wrong, round/game results,
   and a random player ID made in this browser. Nothing is sent from Endless or from the Claude preview. */
function playerId(){ let id=store.get("snackdle-pid",null); if(!id){ id=Math.random().toString(36).slice(2,12)+Date.now().toString(36).slice(-6); store.set("snackdle-pid",id);} return id; }
function logEvent(ev){
  if(!CFG.analytics) return;
  try{ fetch("/api/log",{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,
    body:JSON.stringify({...ev,lang:LANG,mode:game.mode,no:game.no||todayNumber(),r:game.cur,player:playerId()})}).catch(()=>{}); }catch(e){}
}
// Puzzle description sent with round results (hidden difficulty profile + categories/countries)
function puzzleMeta(R){
  const p=profileOf(cur().items);
  return {pair:p.key,items:R.items.map(s=>s.n),countries:R.items.map(s=>s.c),categories:p.categories,answers:R.answers,
    profile:{difficulty:p.difficulty,prior:p.prior,flavor_specificity:p.flavor_specificity,flavor_prominence:p.flavor_prominence,
      product_familiarity:p.product_familiarity,distractor_strength:p.distractor_strength,cross_category_distance:p.cross_category_distance,
      cross_country:p.cross_country,number_of_valid_flavors:p.number_of_valid_flavors,pair_type:p.pair_type}};
}
function applyConfig(j){
  if(!j||!j.difficulty) return false;
  CFG.analytics=!!j.analytics;
  const d=j.difficulty; if(Number.isInteger(d.hint1At)&&Number.isInteger(d.hint2At)) CFG.diff=d;
  if(typeof j.target==="number") CFG.target=Math.max(1.5,Math.min(9,j.target));
  if(j.learned) CFG.learned={pairs:j.learned.pairs||{},flavors:j.learned.flavors||{}};
  CFG.avoid=new Set(j.avoid||[]); PROFILE_CACHE.clear();
  return true;
}
/* The day's config is fetched once and cached, so the Daily never changes under a player mid-day.
   A slow connection gets a second, longer try before falling back to defaults (the settings decide which
   puzzles are dealt, so giving up too early would deal a different Daily from everyone else). No server at
   all (the Claude page, a file on disk: 404 or an instant refusal) → defaults right away, no waiting. */
async function loadConfig(){
  if(!/^https?:$/.test(location.protocol)) return;
  const no=todayNumber(), cached=store.get("snackdle-cfg",null);
  if(cached&&cached.no===no){ applyConfig(cached.cfg); return; }
  for(const wait of [3000,6000]){
    const t0=Date.now();
    try{
      const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),wait);
      const r=await fetch("/api/config?no="+no,{cache:"no-store",signal:ctl.signal}); clearTimeout(timer);
      if(r.status>=400&&r.status<500) return;                       // no config endpoint here
      if(r.ok){ const j=await r.json(); if(applyConfig(j)){ store.set("snackdle-cfg",{no,cfg:j}); return; } return; }
    }catch(e){ if(Date.now()-t0<300) return; }                      // refused instantly: no server to reach
    if(wait===3000) $("#tagline").textContent=t("loading");
  }
  CFG.fallback=true;
}
