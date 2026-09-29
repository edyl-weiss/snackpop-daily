// Understanding a typed guess: tidy it, find the flavor it means (any language, typos), flavor families.
const norm = s => s.normalize("NFKC").toLowerCase().replace(/œ/g,"oe").replace(/æ/g,"ae").normalize("NFD").replace(/[̀-ͯ]/g,"").normalize("NFC").replace(/\b(and|et|y)\b/g,"&").replace(/\b([dl])[’']/g,"$1 ").replace(/[’']/g,"").replace(/口味|风味|風味|味道|味/g,"").replace(/[^a-z0-9&\u3040-\u30ff\u4e00-\u9fff]+/g," ").trim();
const LOOKUP = new Map();
for (const [name,info] of Object.entries(FLAVORS)){
  LOOKUP.set(norm(name),name);
  (info.alt||[]).forEach(a=>LOOKUP.set(norm(a),name));
}
// French names and spellings are accepted in every language; English wins if a spelling is already taken
const LOOKUP_CLASH=[];
for (const [name,list] of Object.entries(FR_FLAVORS)) list.forEach(a=>{ const k=norm(a); if(!k) return;
  if(LOOKUP.has(k)&&LOOKUP.get(k)!==name){LOOKUP_CLASH.push(a);return} LOOKUP.set(k,name); });
// Spanish names
for (const [name,list] of Object.entries(ES_FLAVORS)) list.forEach(a=>{ const k=norm(a); if(!k) return;
  if(LOOKUP.has(k)&&LOOKUP.get(k)!==name){LOOKUP_CLASH.push(a);return} LOOKUP.set(k,name); });
// Japanese names + reading; each spelling also added in the other kana script (いちご / イチゴ)
const kata2hira=s=>s.replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const hira2kata=s=>s.replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
for (const [name,list] of Object.entries(JA_FLAVORS)) list.flatMap(a=>[a,kata2hira(a),hira2kata(a)]).forEach(a=>{ const k=norm(a); if(!k) return;
  if(LOOKUP.has(k)&&LOOKUP.get(k)!==name){LOOKUP_CLASH.push(a);return} LOOKUP.set(k,name); });
// Spellings that honestly mean two flavors: ask instead of guessing ("limón" is lime in Mexico, lemon in Spain)
const AMBIG=new Map([[norm("limón"),["Lemon","Lime"]],[norm("limon"),["Lemon","Lime"]]]);
// Chinese names, aliases and pinyin (spaced "cao mei" and joined "caomei")
for (const [name,[list,py]] of Object.entries(ZH_FLAVORS)) [...list,py,py.replace(/ /g,"")].forEach(a=>{ const k=norm(a); if(!k) return;
  if(LOOKUP.has(k)&&LOOKUP.get(k)!==name){LOOKUP_CLASH.push(a);return} LOOKUP.set(k,name); });
// Word-order-insensitive keys ("lime chili" = "chili lime") and filler words that can be ignored
const FILLER=new Set(["sabor","sabores","con","el","los","las","del","al","en","flavor","flavour","flavored","flavoured","taste","style","the","saveur","saveurs","gout","parfum","arome","au","aux","a","de","du","des","d","la","le","les","l"]);
const tokKey=k=>k.split(" ").filter(w=>w&&!FILLER.has(w)&&w!=="&").sort().join(" ");
const TOKLOOK=new Map(); for(const [k,v] of LOOKUP){ const t=tokKey(k); if(t&&!TOKLOOK.has(t)) TOKLOOK.set(t,v); }
function editDist(a,b){ // Damerau-Levenshtein (adjacent swaps count as one edit)
  const d=[...Array(a.length+1)].map((_,i)=>[i,...Array(b.length).fill(0)]); for(let j=1;j<=b.length;j++) d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    const c=a[i-1]===b[j-1]?0:1; d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  } return d[a.length][b.length];
}
const allowedEdits=n=>n<=3?0:n<=5?1:n<=9?2:3;
// Returns {name, fuzzy} for a confident match, {amb:[a,b]} when two flavors are equally close, or null.
function resolveFlavor(raw){
  const q=norm(raw); if(!q) return null;
  if(AMBIG.has(q)) return {amb:AMBIG.get(q)};
  if(LOOKUP.has(q)) return {name:LOOKUP.get(q),fuzzy:false};
  const t=tokKey(q); if(TOKLOOK.has(t)) return {name:TOKLOOK.get(t),fuzzy:false};
  if(/[\u3040-\u30ff\u4e00-\u9fff]/.test(q)){ // Chinese: longest known name inside the input ("番茄薯片" → 番茄)
    const qq=q.replace(/ /g,""); let best=[],bl=0;
    for(const [k,v] of LOOKUP){ if(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(k)||!qq.includes(k)) continue;
      if(k.length>bl){bl=k.length;best=[v]} else if(k.length===bl&&!best.includes(v)) best.push(v); }
    if(best.length===1) return {name:best[0],fuzzy:LOOKUP.get(qq)!==best[0]};
    if(best.length>1) return {amb:best.slice(0,3)};
    let cand=null,cd=9,tie=false; for(const [k,v] of LOOKUP){ if(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(k)||k.length<4||Math.abs(k.length-qq.length)>1) continue;
      const d=editDist(qq,k); if(d<cd){cd=d;cand=v;tie=false} else if(d===cd&&v!==cand) tie=true; }
    return cand&&cd<=1&&!tie?{name:cand,fuzzy:true}:null;
  }
  // Extra words around a known name ("cheddar cheese", "barbeque sauce"): use the longest name fully contained
  const qs=new Set(t.split(" ")); let sub=[],subLen=0;
  for(const [k,v] of LOOKUP){ const kt=tokKey(k).split(" ").filter(Boolean); if(!kt.length||!kt.every(w=>qs.has(w))) continue;
    if(kt.length>subLen){subLen=kt.length;sub=[v]} else if(kt.length===subLen&&!sub.includes(v)) sub.push(v); }
  if(sub.length===1) return {name:sub[0],fuzzy:true};
  if(sub.length>1) return {amb:sub.slice(0,3)};
  const lim=allowedEdits(t.replace(/ /g,"").length); if(!lim) return null;
  const best=new Map();
  for(const [k,v] of LOOKUP){ const kk=tokKey(k); const dd=Math.min(editDist(q,k),editDist(t,kk)); if(dd<=lim&&(!best.has(v)||best.get(v)>dd)) best.set(v,dd); }
  const ranked=[...best.entries()].sort((a,b)=>a[1]-b[1]);
  if(!ranked.length) return null;
  if(ranked.length>1&&ranked[1][1]===ranked[0][1]) return {amb:ranked.slice(0,3).map(x=>x[0])};
  return {name:ranked[0][0],fuzzy:true};
}
const FLAVOR_NAMES = Object.keys(FLAVORS).sort((a,b)=>a.localeCompare(b));
/* Flavor families.
   An item with a specific flavor also counts for the broader one, so Habanero Takis match Hot & Spicy Twisties
   and Nacho Cheese Doritos match Cheese Cheetos. When two items only share the broad flavor through the same
   specific one (both have Cheese & Onion), the specific flavor is the answer and guessing the broad one finds it. */
const PARENTS={
  "Nacho Cheese":["Cheese"], "Cheese & Onion":["Cheese","Onion"], "Cheese & Garlic":["Cheese","Garlic"],
  "Sour Cream & Onion":["Sour Cream","Onion"], "Pickled Onion":["Onion"],
  "Jalapeño":["Hot & Spicy"], "Habanero":["Hot & Spicy"], "Chipotle":["Hot & Spicy"], "Peri Peri":["Hot & Spicy"],
  "Buffalo":["Hot & Spicy"], "Sweet Chili":["Hot & Spicy"], "Chili Lime":["Hot & Spicy","Lime"], "Adobada":["Hot & Spicy"],
  "Kimchi":["Hot & Spicy"], "Tom Yum":["Hot & Spicy"], "Masala":["Curry"],
  "Salted Caramel":["Caramel"], "Honey Mustard":["Honey","Mustard"], "Peanut Butter":["Peanut"],
  "Muscat":["Grape"], "Matcha":["Tea"], "Prawn Cocktail":["Shrimp"], "Ketchup":["Tomato"]
};
const EXP=SNACKS.map(s=>{const set=new Set(s.f);s.f.forEach(f=>(PARENTS[f]||[]).forEach(p=>set.add(p)));return set});
const itemHas=(s,g)=>EXP[SNACKS.indexOf(s)].has(g);
const isChildOf=(c,p)=>(PARENTS[c]||[]).includes(p);
