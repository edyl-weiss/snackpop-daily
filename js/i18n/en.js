// English text (also the fallback for any key another language lacks). Keys are shared by every language.
const LANGS=["en","fr","es","zh","ja"];
const I18N={
en:{
  locale:"en-US", loading:"Loading today’s puzzles…",  title:"Snack Crackle Pop",
  tear:"Tear here · fresh puzzles daily", ribbon:"So you think you know snacks?", bestby:"Best before: midnight",
  help:"How to play", stats:"Stats", langBtn:"FR", langAria:"Passer en français",
  tabs:["Daily","Challenge <small>3 items</small>","Endless"], modeAria:"Game mode",
  guessLabel:"Your guess", guessBtn:"Guess", placeholder:"Name a flavor: BBQ, Mango, Matcha…", roundDone:"Round’s done",
  burst:{daily:"3 rounds<small>easy → hard</small>",challenge:"Trio<small>3-way link</small>",endless:"Non-stop<small>no scores</small>"},
  meta:(m,no,d,trio)=>m==="daily"?`Daily No. ${no} · ${d}`:m==="challenge"?`Challenge No. ${no} · ${d}`:`Endless · ${trio?"trios":"pairs"}`,
  tiers:["Easy","Medium","Hard"], roundN:i=>`Round ${i}`, playing:"Playing", total:"Total", pts:n=>`${n} points`,
  countLine:(d,n,X)=>{const num=n===3?"three":"two";
    const w=d===0?`These ${num} snacks`:d===n?`These ${num} drinks`:n===2?"This snack and drink":`These ${num} snacks and drinks`;
    return `${w} have <b>${X} flavor${X===1?"":"s"}</b> in common.`},
  needLine:(X,cap)=>X===1?"Can you name it?":X<=cap?`Can you name all ${X}?`:`Name any ${cap}.`,
  tierLines:["Warm-up round. ","Medium round. Things get trickier. ","Hard round. This one sorts out the experts. "], trioLine:"Three at once. ",
  rulesFree:"Just for fun: no points, no pressure, guess all you want.",
  rules:(p,c)=>`${p} points up for grabs. Each wrong guess costs ${c}.`,
  thisWeek:l=>` This week: ${l}.`, diffLabel:{},
  found:"Flavors found", flavorN:i=>`Flavor ${i}`, misses:"Misses", roundScore:"Round score",
  facts:"Guess Facts", prize:"PRIZE INSIDE", answer:"THE ANSWER",
  thFlavor:"Flavor", tasteClues:"Taste clues", nextGuess:"Next guess…",
  traits:{w:"Sweet",s:"Salty",o:"Sour",b:"Bitter",h:"Spicy",u:"Savory",f:"Fruity",c:"Creamy"},
  traitNo:(x,l)=>`${x} isn't ${l}`, traitCell:(l,c,n)=>`${l}: ${c} of ${n} answers`, temp:{hot:"Hot",warm:"Warm",cold:"Cold"}, tempMsg:{hot:" Ooh, you're hot though.",warm:" Getting warmer.",cold:" Ice cold."},
  markAria:(s,y,x)=>`${s} ${y?"has":"does not have"} ${x}`,
  hint:"Hint", hintFam:"flavor family", hintLetter:"first letter", freebie:"freebie",
  hintWhen:n=>n===0?"on the house":`unlocks after ${n} ${n===1?"miss":"misses"}`,
  hint1Closed:"The family of a flavor you’re missing", hint2Closed:"That flavor’s first letter",
  hint1Init:"Flavor family", hint2Init:"First letter",
  and:" and ", list:(a)=>a.length===3?`${a[0]}, ${a[1]} and ${a[2]}`:`${a[0]} and ${a[1]}`,
  heads:{flawless:"Flawless.",nailed:"Nailed it!",got:"Got there!",missed:"Here’s what you missed",stumped:"Stumped!"},
  wonNoMiss:ns=>`You linked ${ns} without a single miss. Show-off.`,
  won:(ns,m)=>`You linked ${ns} with ${m} ${m===1?"miss":"misses"}.`,
  lostSome:(f,n)=>`You got ${f} of ${n}. Not bad!`, lostNone:"This one got away.", share:ns=>`${ns} share:`,
  wasOne:"The flavor was", wasMany:"The flavors were", bonus:l=>`Bonus flavors you could’ve said: ${l}.`,
  nextUp:t=>`Next up: ${t} →`, todayTotal:"Today's total", copyScore:"Copy your score",
  sendIt:"Send it to the friend who thinks they know snacks.", freshIn:trio=>`Fresh ${trio?"trio":"pairs"} in`,
  deal:"Deal me another", copied:"Copied! Now go send it", selected:"Selected. Copy it and send it",
  hungry:"Still hungry?", playOther:m=>m==="challenge"?"Play today's Challenge":"Play today's Daily", tryEndless:"Try Endless",
  sizeAria:"Endless puzzle size", pairs:"Pairs", trios:"Trios", giveUp:"I give up", skip:"Skip this one",
  typeFirst:"Type a flavor first, then hit Guess.", amb:l=>`${l.join(" or ")}? Pick the one you meant.`,
  choc:"Plain chocolate would be too easy, so it doesn’t count. Try Dark or White Chocolate.",
  unknown:r=>`Hmm, "${r}" isn’t a flavor we know. Check the spelling or pick from the list.`,
  heard:n=>`Going with ${n}. `, already:n=>`You already tried ${n}. Mix it up!`,
  covered:(n,h)=>`${n} counts as ${h}, and you’ve already got that one.`,
  via:h=>` (counts as ${h})`, hit:(n,v,left)=>`Yes! ${n} is a match${v}. ${left} more to go.`,
  partial:n=>`Close! Only some of them come in ${n}.`, miss:n=>`Nope, not ${n}.`,
  statsTitle:m=>m==="challenge"?"Your Challenge stats":"Your Daily stats",
  statLabels:["Played","Average","Best","Day streak"],
  lastN:(n,max)=>`Your last ${n} ${n===1?"game":"games"} (out of ${max})`, noGames:"No games yet. Go set a score for your friends to beat.",
  tried:"tried", close:"Close", letsPlay:"Let’s play", helpTitle:"How to play",
  shareHead:(m,no)=>m==="daily"?`Snack Crackle Pop No. ${no}`:m==="challenge"?`Snack Crackle Pop Challenge No. ${no}`:"Snack Crackle Pop Endless",
  kind:d=>d?"Drink":"Snack", from:"from", confirmed:n=>`Flavors confirmed for ${n}`,
  helpBody:`<ol>
      <li>You get two snacks or drinks, usually from different countries. Your job: name the flavors they've <b>both</b> come in. We'll tell you how many there are.</li>
      <li>If they share more than one, find them all, up to 3. Start typing and pick from the list.</li>
      <li>Each round is worth <b>1,000 points</b>. Every wrong guess costs you <b>125</b>, and six misses ends the round. Anything you found still counts.</li>
      <li>We're not fussy about spelling. "chese", "carmel", "green tea" and "lime chili" all work.</li>
      <li>Broad flavors count. A Habanero or Flamin' Hot snack matches "Hot & Spicy", and Nacho Cheese matches "Cheese".</li>
      <li>A wrong guess isn't wasted. You'll see a <b>✓</b> on anything that does have that flavor, and it gets added to that item's card as a clue.</li>
      <li><b>Taste clues:</b> each round shows the 3–5 tastes that matter most for it. When your guess has one of them, the box says how many answers share it: <b style="color:var(--hit)">4/4</b> all of them, <b style="color:var(--some)">2/4</b> some, <b style="color:var(--tomato)">0/4</b> none. Blank means your guess doesn't have that taste.</li>
      <li><b>Hot or cold:</b> every miss gets a temperature. 🔥 Hot: right neighborhood (Lemon when it's Lime). ♨️ Warm: same family or similar tastes. 🧊 Cold: not even the same aisle.</li>
      <li>Stuck? After 2 misses you get the flavor family of one you're missing. After 4, its first letter.</li>
      <li><b>Daily</b> is three rounds, <b>Easy → Medium → Hard</b>, for a best score of 3,000. Round 1 is everyday flavors. Round 3 is where real snack experts earn it. New puzzles at midnight, your time.</li>
      <li><b>Challenge</b> is one daily round with three items instead of two. <b>Endless</b> keeps dealing pairs or trios for as long as you want: no points, no miss limit.</li>
      <li>The puzzles adjust based on how everyone plays, and Endless adjusts to you.</li>
    </ol>
    <p style="color:var(--ink-soft);font-size:14px;margin:0">The fine print: a flavor counts if it's part of the product's current lineup, and blends count toward each flavor in the name (Strawberry Lime counts as Strawberry and as Lime). Also in French, Spanish, Chinese and Japanese: switch at the top.</p>`
}
};
