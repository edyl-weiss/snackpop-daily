// Picking the language and turning canonical names into the current language's words.
function pickLang(){
  try{ const q=new URLSearchParams(location.search).get("lang"); if(LANGS.includes(q)) return q; }catch(e){}
  try{ const s=localStorage.getItem("snackdle-lang"); if(s&&LANGS.includes(JSON.parse(s))) return JSON.parse(s); }catch(e){}
  const nl=(navigator.language||"").toLowerCase(); return ["fr","es","zh","ja"].find(l=>nl.startsWith(l))||"en";
}
let LANG=pickLang();
const t=(k,...a)=>{ const v=(I18N[LANG]&&I18N[LANG][k]!==undefined)?I18N[LANG][k]:I18N.en[k]; return typeof v==="function"?v(...a):v; };
const LOC=()=>t("locale");
const FLAV_NAME={fr:f=>FR_FLAVORS[f]&&FR_FLAVORS[f][0],es:f=>ES_FLAVORS[f]&&ES_FLAVORS[f][0],zh:f=>ZH_FLAVORS[f]&&ZH_FLAVORS[f][0][0],ja:f=>JA_FLAVORS[f]&&JA_FLAVORS[f][0]};
const LOC_FAMS={fr:FR_FAMS,es:ES_FAMS,zh:ZH_FAMS,ja:JA_FAMS}, LOC_TYPES={fr:FR_TYPES,es:ES_TYPES,zh:ZH_TYPES,ja:JA_TYPES},
      LOC_COUNTRIES={fr:FR_COUNTRIES,es:ES_COUNTRIES,zh:ZH_COUNTRIES,ja:JA_COUNTRIES}, LOC_CC={fr:FR_CC,es:ES_CC}, LOC_NAMES={zh:ZH_NAMES,ja:JA_NAMES};
const fn=f=>(FLAV_NAME[LANG]&&FLAV_NAME[LANG](f))||f;                         // flavor display name
const famName=f=>(LOC_FAMS[LANG]||{})[f]||f;
const typeName=s=>(LOC_TYPES[LANG]||{})[s.t]||s.t;
const countryName=s=>(LOC_COUNTRIES[LANG]||{})[s.c]||s.c;
const ccName=s=>LOC_CC[LANG]?s.cc.split(" · ").map(c=>LOC_CC[LANG][c]||c).join(" · "):s.cc;
const itemName=s=>(LOC_NAMES[LANG]||{})[s.n]||s.n;                            // brand name as sold locally, when there is one
const hintLetter=f=>LANG==="zh"?((ZH_FLAVORS[f]||[0,"?"])[1][0]||"?").toUpperCase()
  :LANG==="ja"?[...((JA_FLAVORS[f]||[])[1]||fn(f))][0]:[...fn(f)][0];         // pinyin initial / first kana of the reading / first letter
const tierName=i=>(t("tiers")||[])[i]||"";
