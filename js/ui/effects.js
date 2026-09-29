/* Game feel (effects).
   submit() sets FX for the guess that was just made; render() uses it once so only new things animate.
   A new "deal" (new round, new mode, next Endless puzzle) slides the products in and stamps the tier. */
let FX=null, CUR_FX=null, LAST_DEAL="", PREV_NUM={}, PREV_HINT=[false,false];
const REDUCED=(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}})();
function restart(el,cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function countTo(el,key,to){
  if(!el) return; const from=PREV_NUM[key]; PREV_NUM[key]=to;
  if(from===undefined||from===to||REDUCED) return;
  restart(el,to<from?"num-down":"num-up");
  const t0=performance.now(), dur=500, fmt=v=>Math.round(v).toLocaleString(LOC());
  const tail=el.querySelector("small"), tailHtml=tail?tail.outerHTML:"";
  (function step(now){ const k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,3);
    el.innerHTML=fmt(from+(to-from)*e)+tailHtml; if(k<1) requestAnimationFrame(step); })(t0);
}
function crumbs(anchor,n,spread){
  if(REDUCED||!anchor) return; const r=anchor.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  const cols=["#FFD23F","#F26A22","#7FE3FF","#139A5E","#E24D7E","#FFF6E2"];
  for(let i=0;i<n;i++){ const c=document.createElement("i"); c.className="crumb";
    const a=Math.random()*Math.PI*2, d=(spread||140)*(.45+Math.random()*.7);
    c.style.cssText=`left:${cx}px;top:${cy}px;background:${cols[i%cols.length]};--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d+90}px;--rot:${Math.random()*720-360}deg;--t:${.8+Math.random()*.6}s;${i%3===0?"border-radius:50%":i%3===1?"width:7px;height:12px":""}`;
    document.body.appendChild(c); setTimeout(()=>c.remove(),1600); }
}
function stampTier(text){
  if(REDUCED||!text) return; const w=$(".window"); if(!w) return;
  w.querySelectorAll(".stamp").forEach(x=>x.remove());
  const st=document.createElement("div"); st.className="stamp"; st.setAttribute("aria-hidden","true"); st.textContent=text;
  w.appendChild(st); setTimeout(()=>st.remove(),1600);
}
