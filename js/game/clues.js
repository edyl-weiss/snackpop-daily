// Taste clues and hot/cold. Both only ever depend on the round's items, so every player sees the same clues.

const traitSet=f=>new Set(TASTE[f]||"");
const hasAnyParent=(a,b)=>(PARENTS[a]||[]).some(p=>(PARENTS[b]||[]).includes(p));
const related=(a,b)=>isChildOf(a,b)||isChildOf(b,a)||hasAnyParent(a,b);
const HOODS=new Map(); NEIGHBORHOODS.forEach((h,i)=>h.forEach(f=>HOODS.set(f,[...(HOODS.get(f)||[]),i])));
const neighbors=(a,b)=>(HOODS.get(a)||[]).some(i=>(HOODS.get(b)||[]).includes(i));

// Which taste columns a round shows: the ones that tell its answers apart from the flavors players are
// likely to try instead (what else the items come in, and flavors in general). A column that reads the same
// for nearly every answer set, like Bitter (red in 97% of rounds), is dropped. Between 3 and 5 columns,
// kept in the usual order.
const MIN_TRAITS=3, MAX_TRAITS=5, TRAIT_SPLIT=0.2;
function roundTraits(items,answers){
  if(!answers.length) return TRAITS.map(([k])=>k);
  const near=[...new Set(items.flatMap(s=>s.f))].filter(f=>!answers.includes(f));
  const rest=Object.keys(FLAVORS).filter(f=>!answers.includes(f));
  const share=(list,k)=>list.length?list.filter(f=>hasTrait(f,k)).length/list.length:0;
  // half "vs what these items also come in" (the tempting wrong guesses), half "vs every flavor"
  const gap=(list,k)=>Math.abs(share(answers,k)-share(list,k));
  const ranked=TRAITS.map(([k],i)=>({k,i,split:(near.length>=6?gap(near,k):gap(rest,k))/2+gap(rest,k)/2}))
    .sort((a,b)=>b.split-a.split||a.i-b.i);
  const keep=Math.min(MAX_TRAITS,Math.max(MIN_TRAITS,ranked.filter(r=>r.split>=TRAIT_SPLIT).length));
  return ranked.slice(0,keep).sort((a,b)=>a.i-b.i).map(r=>r.k);
}

// How many of the answers have trait k. Shown as "2/4" so players learn "all", "some" or "none".
const traitCount=(answers,k)=>answers.filter(a=>hasTrait(a,k)).length;

// How close a wrong guess was to one answer: the same flavor line (Habanero vs Hot & Spicy) or the same
// neighborhood (Lemon vs Lime) is hot; the same family or mostly the same tastes is warm.
function closeness(g,a){
  if(related(g,a)||neighbors(g,a)) return 2;
  const A=traitSet(g), B=traitSet(a), union=new Set([...A,...B]).size;
  const overlap=union?[...A].filter(x=>B.has(x)).length/union:0;
  return FLAVORS[g].fam===FLAVORS[a].fam||overlap>=.5?1:0;
}
const TEMPS=["cold","warm","hot"];
function temperature(g,unfound){
  if(!unfound.length||!FLAVORS[g]) return null;
  return TEMPS[Math.max(...unfound.map(a=>closeness(g,a)))];
}
// Temperature of each guess in a round, judged against the answers not yet found when it was made
// (so guessing Lemon after finding Lime isn't "hot" just because of Lime). Right guesses get null.
function guessTemps(rd){
  const items=rd.items.map(i=>SNACKS[i]), answers=sharedOf(rd.items), found=[];
  return rd.guesses.map(g=>{
    const a=matchGuess(g,answers,items,found);
    if(a){ if(!found.includes(a)) found.push(a); return null; }
    return temperature(g,answers.filter(x=>!found.includes(x)));
  });
}
