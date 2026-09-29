function openModal(id){
  if(id==="#statsModal") fillStats();
  $(id).hidden=false; $(id).querySelector("[data-close]").focus();
}
document.querySelectorAll(".scrim").forEach(s=>{
  s.addEventListener("click",e=>{if(e.target===s||e.target.hasAttribute("data-close")) s.hidden=true});
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".scrim").forEach(s=>s.hidden=true)});
$("#helpBtn").onclick=()=>openModal("#helpModal");
$("#statsBtn").onclick=()=>openModal("#statsModal");
function fillStats(){
  const sm = game&&game.mode==="challenge" ? "challenge" : "daily", max=MODES[sm].rounds*ROUND_POINTS;
  $("#statsTitle").textContent = t("statsTitle",sm);
  const st=store.get(MODES[sm].stats,{played:0,total:0,best:0,streak:0,maxStreak:0,history:[]});
  $("#statsGrid").innerHTML=[st.played,st.played?Math.round(st.total/st.played).toLocaleString(LOC()):0,st.best.toLocaleString(LOC()),st.streak]
    .map((v,i)=>[v,t("statLabels")[i]]).map(([v,l])=>`<div>${v}<small>${l}</small></div>`).join("");
  const h=st.history||[];
  $("#dist").innerHTML=(h.length?`<p class="endless-line" style="margin:0 0 4px">${t("lastN",h.length,max.toLocaleString(LOC()))}</p>`:`<p class="endless-line" style="margin:0">${t("noGames")}</p>`)
    + h.map(x=>`<div><span>${x.no}</span><span class="bar${game&&x.no===game.no&&game.mode===sm?' cur':''}" style="width:${Math.max(8,x.score/max*100)}%">${x.score.toLocaleString(LOC())}</span></div>`).join("")
    ;
}
let tt; function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,1800)}

function applyStatic(){
  const d=document.documentElement; d.lang=LANG;
  d.style.setProperty("--t-facts",JSON.stringify(t("facts"))); d.style.setProperty("--t-prize",JSON.stringify(t("prize"))); d.style.setProperty("--t-answer",JSON.stringify(t("answer")));
  $(".tear").textContent=t("tear"); $(".ribbon").textContent=t("ribbon"); $(".bestby").textContent=t("bestby");
  $("#helpBtn").textContent=t("help"); $("#statsBtn").textContent=t("stats");
  const ls=$("#langSel"); ls.value=LANG; ls.setAttribute("aria-label",{en:"Language",fr:"Langue",es:"Idioma",zh:"语言",ja:"言語"}[LANG]);
  $("#tabs").setAttribute("aria-label",t("modeAria")); document.querySelectorAll(".tab").forEach((b,i)=>b.innerHTML=t("tabs")[i]);
  $("#guessLabel").textContent=t("guessLabel"); $("#goBtn").textContent=t("guessBtn");
  $("#helpTitle").textContent=t("helpTitle"); $("#helpBody").innerHTML=t("helpBody"); $("#helpClose").textContent=t("letsPlay"); $("#statsClose").textContent=t("close");
  $("#h1").innerHTML=`<b>${t("hint")} 1</b>${t("hint1Init")}`; $("#h2").innerHTML=`<b>${t("hint")} 2</b>${t("hint2Init")}`;
}
function setLang(l){ if(!LANGS.includes(l)) return; LANG=l; try{localStorage.setItem("snackdle-lang",JSON.stringify(l))}catch(e){}
  applyStatic(); closeSugg(); $("#msg").textContent=""; if(game) render(); if(!$("#statsModal").hidden) fillStats(); }
$("#langSel").onchange=e=>setLang(e.target.value);
applyStatic();

document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>switchMode(t.dataset.mode));
(async function(){
  await loadConfig();
  const h=(location.hash||"").slice(1); switchMode(["daily","challenge","endless"].includes(h)?h:"daily");
  // build the trio pool in small slices while the player reads the first puzzle, so Challenge opens instantly
  const step=()=>{ if(!buildTriosSlice(12)) setTimeout(step,30); };
  setTimeout(step,800);
})();
