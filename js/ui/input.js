function submit(raw){
  const msg=$("#msg"), R=info();
  msg.style.color="";
  if(R.done) return;
  if(!raw.trim()){msg.textContent=t("typeFirst");return}
  const res=resolveFlavor(raw);
  if(res&&res.amb){msg.textContent=t("amb",res.amb.map(fn));return}
  if(!res&&/^((milk )?choc(olate)?|chocolat( au lait)?|(牛奶)?巧克力|(ミルク)?チョコ(レート)?)$/.test(norm(raw))){msg.textContent=t("choc");return}
  if(!res){msg.textContent=t("unknown",raw);return}
  const name=res.name, heard=res.fuzzy?t("heard",fn(name)):"";
  
  if(cur().guesses.includes(name)){msg.textContent=heard+t("already",fn(name));return}
  const hit=matchGuess(name,R.answers,R.items,R.found);
  if(hit&&R.found.includes(hit)){msg.textContent=heard+t("covered",fn(name),fn(hit));return}
  const rd=cur(), now=Date.now(); if(!rd.t0) rd.t0=now;
  const h1=game.mode==="endless"?2:CFG.diff.hint1At, hintVisible=R.misses>=h1;
  const matchedItems=R.items.filter(s=>itemHas(s,name)).length, partial=!hit&&matchedItems>0;
  if(!rd.guesses.length){ rd.tFirst=now-rd.t0; rd.firstHit=!!hit; }
  rd.hint=rd.hint||hintVisible; if(partial) rd.partials=(rd.partials||0)+1;
  rd.guesses.push(name);
  const after=info();
  if(after.won&&!rd.tSolve) rd.tSolve=now-rd.t0;
  logEvent({t:"guess",pair:profileOf(rd.items).key,guess:name,fuzzy:!!res.fuzzy,correct:!!hit,partial,counted_as:hit||null,
    guess_number:rd.guesses.length,hint_visible:hintVisible,ms_since_start:now-rd.t0});
  if(after.done){
    logEvent({t:"round",...puzzleMeta(after),won:after.won,misses:after.misses,score:game.mode==="endless"?null:after.score,
      total_guesses:rd.guesses.length,first_guess_correct:!!rd.firstHit,ms_to_first_guess:rd.tFirst||0,ms_to_solve:after.won?rd.tSolve:null,
      hint_used:!!rd.hint,partial_guesses:rd.partials||0,found:after.found});
    recordSkill({won:after.won,misses:after.misses,hintUsed:!!rd.hint,firstWin:!!rd.firstHit});
    if(game.mode!=="endless"&&gameDone()) logEvent({t:"game",total:gameTotal(),max:game.rounds.length*ROUND_POINTS}); }
  const via = hit&&hit!==name ? t("via",fn(hit)) : "";
  FX={guess:name,hit:hit||null,partial,won:after.won,done:after.done};
  msg.style.color = hit ? "var(--hit)" : "";
  msg.textContent = heard + (hit ? (after.won?"":t("hit",fn(name),via,after.need-after.found.length)) : partial ? t("partial",fn(name)) : t("miss",fn(name)));
  if(game.mode==="endless"){
    const st=endlessState(); st.guesses=cur().guesses; saveEndless(st);
  } else {
    saveDaily();
    if(after.done&&gameDone()) recordStats();
  }
  restart(msg,"flash");
  $("#guess").value=""; closeSugg(); render();
  if(after.done) showResult();
}
function showResult(){ const r=$("#result"); if(!r||r.hidden) return; setTimeout(()=>{ try{ r.scrollIntoView({behavior:"smooth",block:"center"}) }catch(e){} },150); }
function recordStats(){
  const k=MODES[game.mode].stats;
  const st=store.get(k,{played:0,total:0,best:0,streak:0,maxStreak:0,last:null,history:[]});
  if(st.last===game.no) return;
  const t=gameTotal();
  st.played++; st.total+=t; st.best=Math.max(st.best,t);
  st.streak=(st.last===game.no-1?st.streak:0)+1; st.maxStreak=Math.max(st.maxStreak,st.streak);
  st.last=game.no; st.history=[...(st.history||[]),{no:game.no,score:t}].slice(-7);
  store.set(k,st);
  setTimeout(()=>openModal("#statsModal"),900);
}

let sel=-1, items=[];
function suggest(){
  const q=norm($("#guess").value), ul=$("#sugg");
  if(!q){closeSugg();return}
  const hits=new Map();
  for(const [k,v] of LOOKUP){ if(k.includes(q)){ const score=k.startsWith(q)?0:1; if(!hits.has(v)||hits.get(v)>score) hits.set(v,score);} }
  if(!hits.size&&q.length>=4){ const lim=allowedEdits(q.length)||1;
    for(const [k,v] of LOOKUP){ const dd=editDist(q,k.slice(0,q.length+1)); if(dd<=lim&&(!hits.has(v)||hits.get(v)>2+dd)) hits.set(v,2+dd); } }
  items=[...hits.entries()].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0])).map(x=>x[0]).slice(0,8);
  if(!items.length){closeSugg();return}
  sel=-1;
  ul.innerHTML=items.map((v,i)=>`<li role="option" id="opt${i}" aria-selected="false" class="${cur().guesses.includes(v)?'used':''}" data-v="${v}">${fn(v)}<small>${cur().guesses.includes(v)?t("tried"):famName(FLAVORS[v].fam)}</small></li>`).join("");
  ul.hidden=false; $("#guess").setAttribute("aria-expanded","true");
}
function closeSugg(){$("#sugg").hidden=true;$("#guess").setAttribute("aria-expanded","false");sel=-1}
function hl(){[...$("#sugg").children].forEach((li,i)=>li.setAttribute("aria-selected",i===sel?"true":"false"));
  $("#guess").setAttribute("aria-activedescendant",sel>=0?"opt"+sel:"")}
$("#guess").addEventListener("input",suggest);
$("#guess").addEventListener("keydown",e=>{
  if($("#sugg").hidden) return;
  if(e.key==="ArrowDown"){e.preventDefault();sel=Math.min(items.length-1,sel+1);hl()}
  else if(e.key==="ArrowUp"){e.preventDefault();sel=Math.max(0,sel-1);hl()}
  else if(e.key==="Enter"&&sel>=0){e.preventDefault();submit(items[sel])}
  else if(e.key==="Escape"){closeSugg()}
});
$("#sugg").addEventListener("mousedown",e=>{const li=e.target.closest("li");if(li){e.preventDefault();submit(li.dataset.v)}});
$("#guess").addEventListener("blur",()=>setTimeout(closeSugg,120));
$("#form").addEventListener("submit",e=>{e.preventDefault();
  const v=$("#guess").value; const r=resolveFlavor(v); if((!r||r.amb)&&items.length===1&&!$("#sugg").hidden){submit(items[0])} else submit(v)});
