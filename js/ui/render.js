function packet(s,i){
  const known=cur().guesses.filter(g=>itemHas(s,g));
  const fx=CUR_FX, react=fx?(itemHas(s,fx.guess)?" hop":" nope"):"";
  const cls=(s.d?"can":"bag")+react;
  return `<div class="${cls}" style="--c:${s.bg};--c2:${s.fg}" aria-label="${t("kind",s.d)} ${i+1}: ${itemName(s)}, ${typeName(s)} · ${countryName(s)}">
    ${s.d?'<span class="band" aria-hidden="true"></span>':""}
    <span class="cc" title="${countryName(s)}">${ccName(s)}</span>
    <div class="art">${artFor(s)}</div>
    <p class="pname">${itemName(s)}</p>${itemName(s)!==s.n?`<div class="porig">${s.n}</div>`:""}
    <div class="pinfo">${typeName(s)} · ${countryName(s)}</div>
    <div class="known" aria-label="${t("confirmed",itemName(s))}">${known.map(k=>`<span${fx&&k===fx.guess?' class="new"':""}>${fn(k)}</span>`).join("")}</div></div>`;
}
/* Crop every drawing to its artwork and center it. The drawings were made on a 100×100 grid with uneven
   margins, so their visual center wasn't the box center. getBBox() gives the true artwork bounds; the
   viewBox is set to those bounds plus the outline width, and xMidYMid centers it in the ellipse. */
function fitArt(root){
  (root||document).querySelectorAll(".art svg, .mini svg").forEach(svg=>{
    if(svg.dataset.fit) return;
    try{
      const b=svg.getBBox(); if(!b.width||!b.height) return;
      const pad=2;  // outlines are 2.5px wide; getBBox ignores stroke, so add half of it plus a hair
      svg.setAttribute("viewBox",`${(b.x-pad).toFixed(2)} ${(b.y-pad).toFixed(2)} ${(b.width+2*pad).toFixed(2)} ${(b.height+2*pad).toFixed(2)}`);
      svg.setAttribute("preserveAspectRatio","xMidYMid meet");
      svg.dataset.fit="1";
    }catch(e){}
  });
}
function render(){
  if(!cur().t0&&!info().done) cur().t0=Date.now();
  const R=info(), items=R.items, m=game.mode;
  CUR_FX=FX; FX=null; const fx=CUR_FX;
  const root=document.documentElement; root.dataset.mode=m; root.dataset.tier=m==="daily"?String(game.cur):"";
  const dealKey=m+":"+(game.no||"")+":"+game.cur+":"+cur().items.join("-"), dealt=dealKey!==LAST_DEAL;
  if(dealt){ LAST_DEAL=dealKey; delete PREV_NUM.live; }
  document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-selected",t.dataset.mode===m?"true":"false"));
  $("#game").setAttribute("aria-labelledby","tab-"+m);
  const dateStr=new Date().toLocaleDateString(LOC(),{month:"short",day:"numeric",year:"numeric"});
  $(".burst div").innerHTML = t("burst")[m];
  $("#meta").textContent = t("meta",m,game.no,dateStr,items.length===3);

  // Round tracker (Daily): three pills with each round's score
  const rb=$("#roundbar");
  if(game.rounds.length>1){
    rb.hidden=false;
    rb.innerHTML=game.rounds.map((r,i)=>{const ri=roundInfo(r);const st=i===game.cur?"cur":ri.done?"done":"";
      return `<button type="button" class="rpill ${st}" data-r="${i}" ${ri.done||i===game.cur?"":"disabled"} aria-label="${t("roundN",i+1)}, ${tierName(i)}${ri.done?`, ${t("pts",ri.score)}`:""}">
        <span><em class="rn">${t("roundN",i+1)} · </em>${tierName(i)}</span><b>${ri.done?ri.score.toLocaleString(LOC()):i===game.cur?t("playing"):"—"}</b></button>`}).join("")
      +`<div class="rtotal"><span>${t("total")}</span><b>${gameTotal().toLocaleString(LOC())}<small> / ${(game.rounds.length*ROUND_POINTS).toLocaleString(LOC())}</small></b></div>`;
    rb.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{game.cur=+b.dataset.r;finishLoad()});
  } else rb.hidden=true;

  // Instruction line
  const X=R.answers.length;
  const countLine = t("countLine",items.filter(s=>s.d).length,items.length,X);
  const needLine = t("needLine",X,NEED_CAP);
  const tierLine = m==="daily"&&TIERS[game.cur] ? t("tierLines")[game.cur] : m==="challenge" ? t("trioLine") : "";
  const free=m==="endless";
  $("#tagline").innerHTML=`${countLine}${LANG==="zh"?"":" "}${needLine} <span class="rules">${free?t("rulesFree"):`${tierLine}${t("rules",ROUND_POINTS.toLocaleString(LOC()),MISS_COST)}${CFG.diff.level!=="normal"?t("thisWeek",(t("diffLabel")[CFG.diff.level]||CFG.diff.label).toLowerCase()):""}`}</span>`;

  const mu=$("#matchup"); mu.classList.toggle("trio",items.length===3);
  mu.innerHTML=items.map(packet).join(`<div class="link" aria-hidden="true"><div>+</div></div>`);
  if(dealt){ restart(mu,"deal"); restart($("#tagline"),"fresh");
    if(!R.done&&!cur().guesses.length) stampTier(m==="daily"?tierName(game.cur):m==="challenge"?"×3":""); }
  else mu.classList.remove("deal");

  // Progress: found slots + miss meter + live score
  $("#progress").innerHTML=`<div class="slots" aria-label="${t("found")}">${[...Array(R.need)].map((_,i)=>{const f=R.found[i];return `<span class="slot${f?" got":""}${f&&fx&&f===fx.hit?" new":""}">${f?`✓ ${fn(f)}`:t("flavorN",i+1)}</span>`}).join("")}</div>
    ${free?"":`<div class="meter"><span class="mlabel">${t("misses")}</span>${[...Array(MAX_MISSES)].map((_,i)=>`<i class="${i<R.misses?"x":""}${fx&&!fx.hit&&i===R.misses-1?" new":""}"></i>`).join("")}</div>
    <div class="live"><span>${t("roundScore")}</span><b>${(R.done?R.score:Math.max(0,ROUND_POINTS-MISS_COST*R.misses)).toLocaleString(LOC())}</b></div>`}`;

  const bd=$(".board"); bd.style.setProperty("--n",items.length); bd.classList.toggle("trio",items.length===3);
  $("#bhead").innerHTML=`<span>#</span><span>${t("thFlavor")}</span>`+items.map(s=>`<span title="${itemName(s)}" aria-label="${itemName(s)}"><i class="mini">${artFor(s)}</i><em class="hn">${itemName(s)}</em></span>`).join("")
    +`<span class="tr" aria-label="${t("tasteClues")}">${TRAITS.map(([k])=>`<b>${t("traits")[k]}</b>`).join("")}</span>`;
  const g=cur().guesses;
  const rows=g.map((x,i)=>{
    const hits=items.map(s=>itemHas(s,x)), win=hits.every(Boolean);
    const tr=`<span class="tr">${TRAITS.map(([k])=>{ const l=t("traits")[k]; if(!hasTrait(x,k)) return `<span class="tc x" aria-label="${t("traitNo",fn(x),l.toLowerCase())}"></span>`;
      const g=R.answers.some(a=>hasTrait(a,k));
      return `<span class="tc ${g?"g":"r"}" aria-label="${t("traitCell",l,g)}">${g?"✓":"✕"}</span>`}).join("").replace(/<span class="tc/g,(()=>{let n=0;return()=>`<span style="--i:${n++}" class="tc`})())}</span>`;
    const mk=(y,s,k)=>`<span style="--i:${k}" class="mark ${y?'y':'n'}" aria-label="${t("markAria",itemName(s),y,fn(x))}">${y?'✓':'✕'}</span>`;
    return `<div class="grow${win?' win':''}${i===g.length-1&&fx?' fresh':''}"><span class="n">${i+1}</span><span class="f">${fn(x)}${win||free?"":` <small class="pen">−${MISS_COST}</small>`}</span>${hits.map((y,k)=>mk(y,items[k],k)).join("")}${tr}</div>`});
  if(!R.done) rows.push(`<div class="grow empty"><span class="n">${g.length+1}</span><span class="f">${t("nextGuess")}</span>${items.map(()=>"<span></span>").join("")}</div>`);
  $("#rows").innerHTML=rows.join("");

  // Hints point at the first flavor not yet found
  const target=R.answers.find(a=>!R.found.includes(a))||R.answers[0];
  const h1=$("#h1"), h2=$("#h2");
  const h1At=m==="endless"?2:CFG.diff.hint1At, h2At=m==="endless"?4:CFG.diff.hint2At;
  const when=n=>t("hintWhen",n);
  const open1=R.misses>=h1At||R.done, open2=R.misses>=h2At||R.done;
  const new1=open1&&!PREV_HINT[0]&&!dealt&&!R.won, new2=open2&&!PREV_HINT[1]&&!dealt&&!R.won; PREV_HINT=[open1,open2];
  if(open1){h1.className="hint open"+(new1?" new":"");h1.innerHTML=`<b>${t("hint")} 1 · ${t("hintFam")}${h1At===0&&!R.done?` · ${t("freebie")}`:""}</b><span>${famName(FLAVORS[target].fam)}</span>`}
  else {h1.className="hint";h1.innerHTML=`<b>${t("hint")} 1 · ${when(h1At)}</b>${t("hint1Closed")}`}
  if(open2){h2.className="hint open"+(new2?" new":"");h2.innerHTML=`<b>${t("hint")} 2 · ${t("hintLetter")}${h2At===0&&!R.done?` · ${t("freebie")}`:""}</b><span>${hintLetter(target)}…</span>`}
  else {h2.className="hint";h2.innerHTML=`<b>${t("hint")} 2 · ${when(h2At)}</b>${t("hint2Closed")}`}

  $("#guess").disabled=R.done; $("#goBtn").disabled=R.done;
  $("#guess").placeholder = R.done ? t("roundDone") : t("placeholder");
  renderResult(); renderBar();
  fitArt();
  // numbers glide; guess reactions
  const live=$(".live b"); if(live) countTo(live,"live",R.done?R.score:Math.max(0,ROUND_POINTS-MISS_COST*R.misses));
  const tot=$(".rtotal b"); if(tot) countTo(tot,"total:"+m+game.no,gameTotal());
  if(fx){
    if(!fx.hit) restart($("#form .row"),"shake");
    if(fx.won) setTimeout(()=>crumbs($("#matchup"),R.misses===0?46:30,R.misses===0?240:180),120);
    else if(fx.hit) crumbs($("#goBtn"),12,90);
  }
}
const emo = (items,x) => {const n=items.filter(s=>itemHas(s,x)).length;return n===items.length?"🟩":n?"🟨":"⬜"};
function shareText(){
  const lines=game.rounds.map((r,i)=>{const ri=roundInfo(r);return `${game.rounds.length>1?`R${i+1} `:""}${r.guesses.map(x=>emo(ri.items,x)).join("")} ${ri.score}`});
  const head=t("shareHead",game.mode,game.no);
  return `${head} · ${gameTotal().toLocaleString(LOC())}/${(game.rounds.length*ROUND_POINTS).toLocaleString(LOC())}\n${lines.join("\n")}`;
}
function renderResult(){
  const r=$("#result"), R=info();
  if(!R.done){r.hidden=true;return}
  r.hidden=false; r.classList.toggle("lost",!R.won);
  const names=R.items.map(itemName); const nameStr=t("list",names);
  const missed=R.answers.filter(a=>!R.found.includes(a));
  const last=game.cur===game.rounds.length-1, allDone=gameDone();
  const free=game.mode==="endless";
  const H=t("heads"), head = R.won ? (R.misses===0?H.flawless:R.misses<=2?H.nailed:H.got) : free ? H.missed : H.stumped;
  let body=`<h2>${head}${free||(!R.won&&!R.score)?"":` <span class="pts">+${R.score.toLocaleString(LOC())}</span>`}</h2>
    ${R.won?`<p>${R.misses===0?t("wonNoMiss",nameStr):t("won",nameStr,R.misses)}</p>`
      :`<p>${R.found.length?t("lostSome",R.found.length,R.need):t("lostNone")} ${t("share",nameStr)}</p><div class="reveal-line">${R.answers.length===1?t("wasOne"):t("wasMany")}</div>`}
    <div class="answers">${R.answers.map(a=>`<span class="${R.found.includes(a)?"":"other"}">${fn(a)}</span>`).join("")}</div>
    ${R.won&&missed.length?`<p class="note">${t("bonus",missed.map(fn).join(", "))}</p>`:""}`;
  if(game.mode==="daily"&&!allDone){
    const nxt=game.rounds.findIndex(x=>!roundInfo(x).done);
    body+=`<div class="share-row"><button class="go" type="button" id="nextR" style="padding:10px 18px">${t("nextUp",tierName(nxt)||t("roundN",nxt+1))}</button></div>`;
  } else if(game.mode!=="endless"){
    const total=gameTotal(), max=game.rounds.length*ROUND_POINTS;
    body+=`${game.rounds.length>1?`<div class="final"><span>${t("todayTotal")}</span><b>${total.toLocaleString(LOC())}</b><small>/ ${max.toLocaleString(LOC())}</small></div>
      <div class="breakdown">${game.rounds.map((x,i)=>{const ri=roundInfo(x);return `<div><span>${tierName(i)||t("roundN",i+1)}</span><span>${ri.items.map(itemName).join(" + ")}</span><b>${ri.score.toLocaleString(LOC())}</b></div>`}).join("")}</div>`:""}
      <div class="share-row"><pre class="grid-emoji" id="shareTxt">${shareText()}</pre><button class="icon-btn" type="button" id="shareBtn">${t("copyScore")}</button></div>
      <p class="note" style="margin:10px 0 0">${t("sendIt")}</p>
      <p class="next" style="margin-top:12px">${t("freshIn",game.mode==="challenge")} <span id="countdown"></span></p>`;
  } else {
    body+=`<div class="share-row"><button class="go" type="button" id="nextRound" style="padding:10px 18px">${t("deal")}</button></div>`;
  }
  r.innerHTML=body;
  const sb=$("#shareBtn"); if(sb) sb.onclick=async()=>{
    try{await navigator.clipboard.writeText(shareText());toast(t("copied"))}
    catch(e){const t=$("#shareTxt");t.hidden=false;const sel=getSelection(),rg=document.createRange();rg.selectNodeContents(t);sel.removeAllRanges();sel.addRange(rg);toast(t("selected"))}
  };
  const nr=$("#nextRound"); if(nr) nr.onclick=()=>loadEndless(true);
  const nx=$("#nextR"); if(nx) nx.onclick=()=>{game.cur=game.rounds.findIndex(x=>!roundInfo(x).done);finishLoad();window.scrollTo({top:0,behavior:"smooth"})};
  tick();
}
function renderBar(){
  const p=$("#pbar");
  if(game.mode!=="endless"){
    p.innerHTML=gameDone()?`<span>${t("hungry")}</span><button class="textbtn" type="button" data-go="${game.mode==="daily"?"challenge":"daily"}">${t("playOther",game.mode==="daily"?"challenge":"daily")}</button><button class="textbtn" type="button" data-go="endless">${t("tryEndless")}</button>`:"";
  } else {
    p.innerHTML=`<div class="seg" role="group" aria-label="${t("sizeAria")}">
        <button type="button" data-size="2" aria-pressed="${endlessSize===2}">${t("pairs")}</button>
        <button type="button" data-size="3" aria-pressed="${endlessSize===3}">${t("trios")}</button></div>
      ${info().done?"":`<button class="textbtn" type="button" id="reveal">${t("giveUp")}</button><button class="textbtn" type="button" id="skip">${t("skip")}</button>`}`;
    p.querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>{const s=endlessState();const n=+b.dataset.size;if(n===s.size)return;
      s.size=n; nextEndless(s); saveEndless(s); loadEndless(false)});
    const sk=$("#skip"); if(sk) sk.onclick=()=>{ const R=info(); logEvent({t:"skip",...puzzleMeta(R),total_guesses:cur().guesses.length,found:R.found}); loadEndless(true); };
    const rv=$("#reveal"); if(rv) rv.onclick=()=>{$("#msg").textContent="";const R=info(); logEvent({t:"skip",reveal:true,...puzzleMeta(R),total_guesses:cur().guesses.length,found:R.found});const s=endlessState();s.revealed=true;saveEndless(s);cur().revealed=true;render();showResult()};
  }
  p.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>switchMode(b.dataset.go));
}
function tick(){
  const el=$("#countdown"); if(!el) return;
  const n=new Date(), m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1), s=Math.max(0,Math.floor((m-n)/1000));
  el.textContent=[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,"0")).join(":");
}
// Rolls over to the new daily puzzle at local midnight, even if the page stays open.
setInterval(()=>{ if(game&&game.mode!=="endless"&&todayNumber()!==game.no){ const m=game.mode; game.no=todayNumber(); loadConfig().then(()=>loadDaily(m)); } else tick(); },1000);
