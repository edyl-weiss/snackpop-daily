// Which puzzles exist, their stable ids, and each one's hidden difficulty.
// Pairs: two items (snacks or drinks) from different countries.
// Trios (Challenge): three items from at least two countries.
// A puzzle needs 1–6 shared flavors (7+ is too easy even when only 3 must be found).
function sharedOf(idx){
  const all=[...EXP[idx[0]]].filter(x=>idx.every(i=>EXP[i].has(x)));
  // Drop a broad flavor that some item only has through a shared specific one (it's the same link)
  return all.filter(p=>!(all.some(c=>isChildOf(c,p)) && !idx.every(i=>SNACKS[i].f.includes(p))));
}
// Very common flavors (20+ items: Orange, Lemon, Strawberry…) can't be the only link: too easy to guess blind.
const FLAVOR_COUNT={}; EXP.forEach(set=>set.forEach(f=>FLAVOR_COUNT[f]=(FLAVOR_COUNT[f]||0)+1));
const MAX_SHARED=6;
function okLink(sh){return sh.length>=1&&sh.length<=MAX_SHARED&&!(sh.length===1&&FLAVOR_COUNT[sh[0]]>=20)}
// Pairs are built at start-up (fast). Trios (28k+) are only needed for Challenge and Endless trios, so they
// are built lazily: a little at a time in the background after the page shows (buildTriosSlice), or all at
// once the moment something asks for them (getTrios).
const PAIRS=[];
for(let i=0;i<SNACKS.length;i++)for(let j=i+1;j<SNACKS.length;j++){
  if(SNACKS[i].c!==SNACKS[j].c&&okLink(sharedOf([i,j])))PAIRS.push([i,j]);
}
const TRIO_BUILD={i:0,out:[]};
function trioRow(i,out){
  for(let j=i+1;j<SNACKS.length;j++){
    const ij=[...EXP[i]].filter(x=>EXP[j].has(x)); if(!ij.length) continue;
    for(let k=j+1;k<SNACKS.length;k++){
      if(!ij.some(x=>EXP[k].has(x))) continue;
      if(new Set([SNACKS[i].c,SNACKS[j].c,SNACKS[k].c]).size>=2&&okLink(sharedOf([i,j,k])))out.push([i,j,k]);
    }
  }
}
function buildTriosSlice(ms){ const t0=Date.now(); while(TRIO_BUILD.i<SNACKS.length&&Date.now()-t0<ms) trioRow(TRIO_BUILD.i++,TRIO_BUILD.out); return TRIO_BUILD.i>=SNACKS.length; }
let _TRIOS=null, _DAILY_TRIOS=null;
const getTrios=()=>_TRIOS||(buildTriosSlice(Infinity),_TRIOS=TRIO_BUILD.out);
const getDailyTrios=()=>_DAILY_TRIOS||(_DAILY_TRIOS=spread(getTrios().map(p=>[...p]),19930101));
function shuffleWith(arr,r){for(let i=arr.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[arr[i],arr[k]]=[arr[k],arr[i]]}return arr}
// Seeded shuffle, then deal round-robin by each puzzle's rarest shared flavor so answers vary from day to day.
function spread(pool,seed){
  const r=mulberry32(seed); shuffleWith(pool,r);
  pool.forEach(p=>shuffleWith(p,r));
  const groups=new Map();
  pool.forEach(p=>{const k=sharedOf(p).sort((a,b)=>FLAVOR_COUNT[a]-FLAVOR_COUNT[b])[0];if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)});
  const gs=shuffleWith([...groups.values()],r), out=[];
  while(out.length<pool.length) gs.forEach(g=>{if(g.length)out.push(g.shift())});
  return out;
}
const DAILY_PAIRS=spread(PAIRS.map(p=>[...p]),20260925);

/* Stable identities.
   Saved games, Endless progress and analytics refer to items by NAME, never by position in SNACKS, so adding,
   removing or reordering items can't turn a saved puzzle into different products. A puzzle's key is a short
   hash of its item names; DATA_SIG changes whenever the puzzle pools would change. */
function hashStr(s){ let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); } return (h>>>0).toString(36); }
const NAME_IDX=new Map(SNACKS.map((s,i)=>[s.n,i]));
const namesOf=idx=>idx.map(i=>SNACKS[i].n);
const idxOf=names=>{ if(!Array.isArray(names)) return null; const out=names.map(n=>NAME_IDX.get(n)); return out.every(i=>i!==undefined)?out:null; };
const pkey=idx=>hashStr(namesOf(idx).sort().join("|"));
const DATA_SIG=hashStr(JSON.stringify([SNACKS.map(s=>[s.n,s.c,s.f]),PARENTS,MAX_SHARED]));

const EPOCH = new Date(2026,8,25); // Puzzle No. 1 = Sep 25, 2026
function todayNumber(){const n=new Date();const d=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.round((d-EPOCH)/864e5)+1}
/* Hidden difficulty profile (1–10 scale).
   Built from the spec's four main levers (flavor prominence, product familiarity, distractor flavors,
   category distance) plus flavor specificity and country distance. Starting values are editorial estimates;
   CFG.learned (from /api/config) blends in observed pair and flavor difficulty as players generate data. */
const SAVORY_FAMS=new Set(["Savory","Cheesy","Spicy","Tangy","Seafood"]);
function categoryOf(s){
  if(s.d) return /milk|cultured/i.test(s.t)?"Milk drink":"Soda";
  if(/gum|chew|candy|lollipop|sweets|jelly|mint|taffy|pastille|bean|tamarind/i.test(s.t)) return "Candy";
  if(/chip|crisp|puff|popcorn|corn|pretzel|cracker|stick|ring|seaweed|noodle|snack mix/i.test(s.t)&&!/biscuit|chocolate|butter crackers|dipping/i.test(s.t)) return "Savory snack";
  const sav=s.f.filter(f=>FLAVORS[f]&&SAVORY_FAMS.has(FLAVORS[f].fam)).length;
  if(sav*2>=s.f.length) return "Savory snack";
  if(/chocolate|wafer|mushroom/i.test(s.t)) return "Chocolate";
  return "Cookie & cake";
}
// Product familiarity 1–10 (9 = sold and advertised worldwide, 6 = well known in its home market, 3 = regional or niche)
const FAMILIAR=new Set(["Pringles","Lay's","Doritos","Cheetos","Oreo","Kit Kat","Coca-Cola Flavors","Fanta","Sprite","Skittles","Starburst","Haribo Goldbears","Mentos","Chupa Chups","Pocky","Milka","Toblerone","Kinder Bueno","Cadbury Dairy Milk","Hi-Chew","Jolly Rancher","Life Savers","Airheads","Sour Patch Kids","Takis","Pepero","Choco Pie","Tim Tam","Walkers","Lotus Biscoff","Hello Panda","Ritter Sport","Crush","Sunkist","Tango","Sanpellegrino","White Rabbit","Cheez-It","SunChips","Chex Mix","McVitie's Digestives","Jaffa Cakes","Calbee Potato Chips","Yan Yan","Koala's March","Tony's Chocolonely","Honey Butter Chip"]);
const NICHE=new Set(["Frisps","funny-frisch","Zweifel KEZZ","Wedel CRUSH","Caprice","Fazer Domino","Meiji Fruit Juice Gummy","Kanro Pure Gummy","Up Gummy","Poifull","Oh Yes","ACE Crackers","Barcel Snaps","Duvalín","Savoy","Farmbake","Kettle (Australia)","PROPER Crunch Corn","Clearly Canadian","The Pop Shoppe","Boylan","Sprecher","Virgil's","Culture Pop","Loux","Frize Botânicos","Kofola","Hartwall Jaffa","Tomomasu Fruit Cider","Frula Ramune","Mitsuya Squash","Wilkinson","Sangaria Hajikete","Demisoda","Tams","Chaparritas","Kirks","Remedy Sodaly","Bickford's Esprit","Saxbys Spliced","KA Sparkling","Cawston Press","Lemonsoda","Sumol","Club-Mate","Thomas Henry","fritz-limo","Kuai Kuai","Irvins","Chitato","Mamee Monster","Tohato Caramel Corn","Kkobuk Chips","Butterkist","Jelly Tots","POM-BEAR","Skips","Lorenz Crunchips","San Carlo","Red Rock Deli","Jatz","Tiny Teddy","Pulparindo","Bingo! Mad Angles","Want Want Senbei"]);
const familiarity=s=>FAMILIAR.has(s.n)?9:NICHE.has(s.n)?3:6;
// Flavor specificity 1–10 (spec tiers): common = 2, medium = 5, everything else = 8
const EASY_F=new Set(["Orange","Vanilla","Strawberry","Lemon","Cherry","Grape","Apple","Banana","Mint","Cheese","BBQ","Salted","Hot & Spicy","Salt & Vinegar","Cola","Peach","Watermelon","Coffee","Caramel"]);
const MED_F=new Set(["Ginger","Honey","Cinnamon","Coconut","Mango","Pineapple","Raspberry","Lime","Peanut","Hazelnut","Almond","Matcha","Sour Cream & Onion","Chicken","Onion","Pizza","Ranch","Jalapeño","Cheese & Onion","Paprika","Pepper","Tomato","Garlic","Curry","Peanut Butter","Cookies & Cream","Melon","Blueberry","Dark Chocolate","White Chocolate","Toffee","Sweet Chili","Chili Lime","Seaweed","Shrimp","Wasabi","Root Beer","Cream Soda","Passion Fruit","Grapefruit","Mixed Berry","Blue Raspberry","Fruit Punch","Yogurt","Tea","Butter","Beef","Bacon","Sweet Potato","Corn","Salted Caramel","Birthday Cake","Pumpkin","Nacho Cheese","Sour Cream","Popcorn","Cotton Candy","Bubblegum","Brownie","Chocolate Chip","Cheesecake","Maple","Kiwi","Dill Pickle","Ketchup","Buffalo","Taco","Salsa","Habanero","Teriyaki","Soy Sauce","Red Velvet","Churro","Marshmallow"]);
const specificity=f=>{ const L=CFG.learned.flavors[f];
  const prior=EASY_F.has(f)?2:MED_F.has(f)?5:8; if(!L) return prior; const w=L[1]/(L[1]+30); return prior*(1-w)+L[0]*w; };
// How strongly an item "advertises" a flavor: early in its list (headline) = 9, mid-list = 6, deep catalog = 3, only via a broader family = 5
function prominence(s,f){ const i=s.f.indexOf(f); if(i<0) return 5; const n=s.f.length; return n<=5||i<3?9:i<8?6:3; }
const CATDIST={"Savory snack|Savory snack":2,"Candy|Candy":2,"Chocolate|Chocolate":2,"Cookie & cake|Cookie & cake":2,"Soda|Soda":2,"Milk drink|Milk drink":2,"Soda|Milk drink":3,
  "Candy|Chocolate":3,"Chocolate|Cookie & cake":3,"Candy|Cookie & cake":4,"Candy|Soda":5,"Candy|Milk drink":5,"Chocolate|Milk drink":5,"Cookie & cake|Milk drink":5,
  "Chocolate|Soda":6,"Cookie & cake|Soda":7,"Savory snack|Candy":7,"Savory snack|Chocolate":7,"Savory snack|Cookie & cake":6,"Savory snack|Soda":8,"Savory snack|Milk drink":8};
const catDist=(a,b)=>CATDIST[a+"|"+b]??CATDIST[b+"|"+a]??5;
const PROFILE_CACHE=new Map();
function profileOf(idx){
  const key=pkey(idx);
  if(PROFILE_CACHE.has(key)) return PROFILE_CACHE.get(key);
  const items=idx.map(i=>SNACKS[i]), answers=sharedOf(idx), need=Math.min(answers.length,NEED_CAP);
  const easiest=[...answers].sort((a,b)=>specificity(a)-specificity(b)).slice(0,need);
  const spec=easiest.reduce((t,f)=>t+specificity(f),0)/need;
  const prom=easiest.reduce((t,f)=>t+items.reduce((u,s)=>u+prominence(s,f),0)/items.length,0)/need;
  const fam=items.reduce((t,s)=>t+familiarity(s),0)/items.length;
  const all=new Set(); items.forEach(s=>s.f.forEach(f=>all.add(f)));
  const partial=[...all].filter(f=>!answers.includes(f)&&items.filter(s=>itemHas(s,f)).length>=1).length;
  const distr=Math.min(10,Math.round(Math.log2(1+partial)*2.2*10)/10);
  const cats=items.map(categoryOf);
  let cd=0,pairsN=0; for(let i=0;i<cats.length;i++)for(let j=i+1;j<cats.length;j++){cd+=catDist(cats[i],cats[j]);pairsN++} cd/=pairsN;
  const cross=new Set(items.map(s=>s.c)).size>1;
  let d=0.30*spec+0.25*(10-prom)+0.15*(10-fam)+0.15*distr+0.10*cd+0.05*(cross?6:3);
  d-=Math.min(1.5,0.5*(answers.length-need));           // spare valid answers make a round easier
  d=Math.max(1,Math.min(10,5+(d-3.9)*1.8));              // spread the raw score across the 1–10 scale
  const L=CFG.learned.pairs[key];
  const prior=Math.round(d*10)/10;
  if(L){ const w=L[1]/(L[1]+25); d=d*(1-w)+L[0]*w; }       // blend in observed difficulty
  const kinds=items.map(s=>s.d?"drink":"snack").sort().join("+");
  const p={key,difficulty:Math.round(d*10)/10,prior,flavor_specificity:+spec.toFixed(1),flavor_prominence:+prom.toFixed(1),product_familiarity:+fam.toFixed(1),
    distractor_strength:distr,cross_category_distance:+cd.toFixed(1),cross_country:cross,number_of_valid_flavors:answers.length,
    answer_ambiguity:Math.max(0,answers.length-need),pair_type:kinds,categories:cats,primary:easiest[0],answers};
  PROFILE_CACHE.set(key,p); return p;
}
