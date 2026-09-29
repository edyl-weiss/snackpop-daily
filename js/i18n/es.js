/* Spanish (neutral Latin American, tú).
   Brand names stay original (same packaging across Latin America and Spain). Flavor names use the words on
   Latin American packaging, with Spain's words as alternates (cacahuate/cacahuete, camarón/gamba, crema/nata…).
   "Limón" alone is ambiguous (lime in Mexico, lemon in Spain), so the game asks which one. */
const ES_FLAVORS={
"Strawberry":["Fresa","frutilla","fresas"],"Banana":["Plátano","banana","banano"],"Orange":["Naranja","mandarina","clementina","naranja sanguina"],
"Lemon":["Limón amarillo","limonada","limón siciliano"],"Apple":["Manzana","manzana verde","pay de manzana"],"Grape":["Uva","uvas"],
"Mango":["Mango"],"Pineapple":["Piña","ananá"],"Raspberry":["Frambuesa"],"Coconut":["Coco"],"Cherry":["Cereza","guinda"],
"Watermelon":["Sandía"],"Blue Raspberry":["Frambuesa azul"],"Lime":["Limón verde","lima"],"Blackcurrant":["Grosella negra","casis"],
"Muscat":["Moscatel","uva moscatel"],"Melon":["Melón"],"Peach":["Durazno","melocotón"],"Chamoy":["Chamoy"],"Tamarind":["Tamarindo"],
"Coffee":["Café","capuchino","moca"],"Toffee":["Toffee"],"Popcorn":["Palomitas","palomitas de maíz","cotufas","pochoclo","canchita"],
"Chocolate Chip":["Chispas de chocolate","chips de chocolate"],"Cheesecake":["Pay de queso","tarta de queso","cheesecake"],"Brownie":["Brownie"],
"Biscoff":["Galleta caramelizada","speculoos"],"Jalapeño":["Jalapeño"],"Habanero":["Habanero"],"Buffalo":["Búfalo","alitas búfalo"],
"Curry":["Curry"],"Hot & Spicy":["Picante","enchilado","chilito","muy picante","picoso"],"Adobada":["Adobada","adobo"],"Salsa":["Salsa","salsa mexicana","pico de gallo"],
"Honey Mustard":["Miel mostaza","mostaza con miel"],"Mustard":["Mostaza"],"Onion":["Cebolla"],"Sour Cream":["Crema ácida","nata agria"],
"Pepper":["Pimienta","pimienta negra","sal y pimienta"],"Pretzel":["Pretzel"],"Tomato":["Tomate","jitomate"],"Butter":["Mantequilla"],
"Garlic":["Ajo"],"Cheese & Garlic":["Queso y ajo"],"Corn":["Elote","maíz"],"Truffle":["Trufa"],"Cinnamon":["Canela"],"Yogurt":["Yogur","yogurt"],
"Honeycomb":["Panal de miel","panal"],"Nougat":["Turrón","nougat"],"Marshmallow":["Malvavisco","bombón","nube","nubes"],
"Maple":["Maple","jarabe de arce","miel de maple"],"Pudding":["Pudín","flan","natilla","budín"],"Chestnut":["Castaña"],"Sesame":["Ajonjolí","sésamo"],
"Kiwi":["Kiwi"],"Yuzu":["Yuzu"],"Licorice":["Regaliz","orozuz"],"Ramune":["Ramune"],"Ketchup":["Cátsup","kétchup","catsup"],
"Soy Sauce":["Salsa de soya","salsa de soja","soya"],"Teriyaki":["Teriyaki"],"Taco":["Taco","tacos"],"Chipotle":["Chipotle"],"Guacamole":["Guacamole"],
"Peri Peri":["Piri piri"],"Mushroom":["Champiñón","hongos","setas"],"Kimchi":["Kimchi"],"Tom Yum":["Tom yum"],"Crab":["Cangrejo","jaiba"],
"Squid":["Calamar"],"Mayonnaise":["Mayonesa"],"Sweet & Sour":["Agridulce"],"Mentaiko":["Mentaiko"],"Salad":["Ensalada"],"Takoyaki":["Takoyaki"],
"Red Bean":["Frijol rojo","judía roja","azuki"],"Salted Egg":["Yema de huevo salada","huevo salado"],"Grapefruit":["Toronja","pomelo"],
"Passion Fruit":["Maracuyá","fruta de la pasión","parchita"],"Guava":["Guayaba"],"Lychee":["Lichi"],"Pear":["Pera"],"Blueberry":["Arándano","arándano azul","mora azul"],
"Blackberry":["Zarzamora","mora"],"Mixed Berry":["Frutos rojos","frutos del bosque","moras"],"Pomegranate":["Granada"],"Papaya":["Papaya"],
"Plum":["Ciruela"],"Rhubarb":["Ruibarbo"],"Cucumber":["Pepino"],"Fruit Punch":["Ponche de frutas","ponche"],"Root Beer":["Root beer","cerveza de raíz"],
"Cream Soda":["Soda de crema","cream soda"],"Ginger":["Jengibre"],"Elderflower":["Flor de saúco","saúco"],"Rose":["Rosa","agua de rosas"],
"Tea":["Té","té negro","té helado","té con leche"],"Cotton Candy":["Algodón de azúcar"],"Bubblegum":["Chicle","goma de mascar"],"Cola":["Cola"],
"Matcha":["Matcha","té verde"],"Mint":["Menta"],"Honey":["Miel"],"Sweet Potato":["Camote","batata","boniato"],"Cookies & Cream":["Galletas con crema","cookies and cream"],
"Birthday Cake":["Pastel de cumpleaños","tarta de cumpleaños"],"Red Velvet":["Red velvet","terciopelo rojo"],"Churro":["Churro","churros"],
"Pumpkin":["Calabaza","pay de calabaza"],"Vanilla":["Vainilla"],"Caramel":["Caramelo","cajeta"],"Salted Caramel":["Caramelo salado"],
"Turkish Delight":["Delicia turca","lokum"],"Dark Chocolate":["Chocolate amargo","chocolate negro"],"White Chocolate":["Chocolate blanco"],
"Almond":["Almendra"],"Hazelnut":["Avellana"],"Peanut":["Cacahuate","cacahuete","maní"],"Peanut Butter":["Crema de cacahuate","mantequilla de maní","crema de cacahuete"],
"Wasabi":["Wasabi"],"Chili Lime":["Chile y limón","chile limón"],"Sweet Chili":["Chile dulce","salsa de chile dulce"],"Masala":["Masala"],
"Salt & Vinegar":["Sal y vinagre","vinagre"],"Dill Pickle":["Pepinillo","pepinillo al eneldo"],"Pickled Onion":["Cebolla encurtida","cebollitas en vinagre"],
"Worcester Sauce":["Salsa inglesa","salsa worcestershire"],"Chutney":["Chutney"],"Cheese":["Queso","cheddar"],"Nacho Cheese":["Queso nacho","nachos"],
"Cheese & Onion":["Queso y cebolla"],"Sour Cream & Onion":["Crema y cebolla","crema ácida y cebolla","crema y especias"],"Ranch":["Ranch"],
"BBQ":["Barbacoa","bbq","barbecue"],"Chicken":["Pollo","pollo asado"],"Beef":["Res","carne","ternera","carne asada"],"Bacon":["Tocino","beicon"],
"Prawn Cocktail":["Cóctel de camarón","cóctel de gambas"],"Shrimp":["Camarón","gamba","langostino"],"Seaweed":["Alga","algas","alga nori"],
"Consommé":["Consomé","caldo"],"Paprika":["Pimentón","páprika"],"Pizza":["Pizza"],"Salted":["Sal","natural","clásica","con sal","sal de mar"]
};
const ES_FAMS={Fruity:"Frutal",Tangy:"Ácido",Sweet:"Dulce",Dessert:"Postre",Spicy:"Picante",Savory:"Salado",Cheesy:"Quesoso",
  Nutty:"Frutos secos","Soda fountain":"Refresco",Seafood:"Mariscos",Floral:"Floral",Chocolatey:"Chocolatoso"};
const ES_COUNTRIES={"Japan":"Japón","Japan & UK":"Japón y Reino Unido","South Korea":"Corea del Sur","United Kingdom":"Reino Unido","Ireland":"Irlanda",
  "Australia":"Australia","India":"India","Mexico":"México","Israel":"Israel","Netherlands":"Países Bajos","Germany":"Alemania",
  "Germany & Switzerland":"Alemania y Suiza","Switzerland":"Suiza","Italy":"Italia","Spain":"España","United States":"Estados Unidos",
  "United States & UK":"EE. UU. y Reino Unido","Belgium":"Bélgica","Poland":"Polonia","Greece":"Grecia","Finland":"Finlandia","China":"China",
  "Taiwan":"Taiwán","Thailand":"Tailandia","Philippines":"Filipinas","Indonesia":"Indonesia","Malaysia":"Malasia","Singapore":"Singapur",
  "Canada":"Canadá","Portugal":"Portugal","Czechia":"Chequia"};
const ES_CC={UK:"RU",US:"EE. UU."};
const ES_TYPES={"Biscuit sticks":"Palitos de galleta","Wafer bar":"Barra de oblea","Chewy candy":"Dulce masticable","Dipping sticks":"Palitos para dipear",
  "Potato chips":"Papas fritas","Shrimp crackers":"Botana de camarón","Marshmallow cake":"Pastelito con malvavisco","Crisps":"Papas fritas",
  "Corn snack":"Botana de maíz","Potato rings":"Aros de papa","Prawn cocktail puffs":"Inflados de cóctel de camarón","Sponge biscuit":"Galleta con bizcocho",
  "Biscuit":"Galleta","Chocolate bar":"Tableta de chocolate","Chocolate biscuit":"Galleta con chocolate","Baked crackers":"Galletas saladas horneadas",
  "Corn puffs":"Inflados de maíz","Rolled tortilla chips":"Totopos enrollados","Peanut candy":"Dulce de cacahuate","Peanut puffs":"Inflados de cacahuate",
  "Syrup waffle":"Wafle con jarabe","Chewy mints":"Pastillas masticables","Gummy bears":"Ositos de goma","Lollipop":"Paleta","Stacked chips":"Papas en lata",
  "Tortilla chips":"Totopos","Cheese puffs":"Inflados de queso","Sandwich cookie":"Galleta rellena","Multigrain chips":"Chips multigrano",
  "Flavored pretzels":"Pretzels sazonados","Taffy bars":"Barritas de caramelo suave","Hard candy":"Caramelo macizo","Chocolate pretzels":"Pretzels con chocolate",
  "Fruit chews":"Masticables de fruta","Hard candy rings":"Caramelos en aro","Sour gummies":"Gomitas ácidas","Kettle chips":"Papas estilo casero",
  "Cheese crackers":"Galletas de queso","Snack mix":"Mezcla de botanas","Ridged crisps":"Papas onduladas","Popcorn":"Palomitas",
  "Fruit sweets":"Dulces de fruta","Fruit gums":"Gomitas de fruta","Jelly sweets":"Gomitas","Crunchy corn":"Maíz crujiente",
  "Bear-shaped crisps":"Papas en forma de oso","Square chocolate bar":"Chocolate cuadrado","Wafers":"Obleas","Wafer rolls":"Barquillos",
  "Sandwich biscuit":"Galleta rellena","Gummies":"Gomitas","Savory sticks":"Palitos salados","Filled biscuits":"Galletas rellenas",
  "Jelly beans":"Grageas de goma","Soda gummies":"Gomitas sabor refresco","Layered chips":"Chips en capas","Snack cake":"Pastelito",
  "Butter crackers":"Galletas de mantequilla","Chili candy lollipop":"Paleta enchilada","Tamarind candy":"Dulce de tamarindo",
  "Hazelnut cream candy":"Dulce de crema de avellana","Teddy biscuits":"Galletitas de osito","Round crackers":"Galletas saladas redondas",
  "Square crackers":"Galletas saladas cuadradas","Cookies":"Galletas","Puffed corn sticks":"Palitos de maíz inflado","Potato sticks in a cup":"Palitos de papa en vaso",
  "Chocolate mushrooms":"Hongos de chocolate","Corn cones":"Conitos de maíz","Caramel corn puffs":"Inflados de maíz acaramelado","Milk candy":"Dulce de leche",
  "Rice crackers":"Galletas de arroz","Crispy seaweed":"Alga crujiente","Prawn crackers":"Chips de camarón","Noodle snack":"Botana de fideos",
  "Salted egg chips":"Chips de yema salada","Triangle chips":"Chips triangulares","Flavored milk":"Leche saborizada","Fruit soda":"Refresco de fruta",
  "Orange soda":"Refresco de naranja","Lemon-lime soda":"Refresco de lima-limón","Cola":"Refresco de cola","Craft soda":"Refresco artesanal",
  "Cane-sugar soda":"Refresco de caña","Prebiotic soda":"Refresco prebiótico","Probiotic soda":"Refresco probiótico","Sparkling fruit drink":"Bebida de fruta con gas",
  "Retro soda":"Refresco retro","Fruit blend":"Mezcla de frutas","Botanical lemonade":"Limonada botánica","Sparkling soft drinks":"Bebidas con gas",
  "Caribbean soda":"Refresco caribeño","Sparkling juice":"Jugo con gas","Fruit cordial soda":"Refresco de jarabe de frutas","Exotic fruit soda":"Refresco de fruta tropical",
  "Italian soda":"Refresco italiano","Lemonade":"Limonada","Sodas & lemonades":"Refrescos y limonadas","Mate soda":"Refresco de mate","Citrus soda":"Refresco cítrico",
  "Fruit & cola soda":"Refrescos de fruta y cola","Sparkling mineral water":"Agua mineral con gas","Herbal cola":"Cola de hierbas",
  "Cultured milk drink":"Bebida láctea fermentada","Fruit cider (soda)":"Sidra de fruta (refresco)","Ramune":"Ramune","Sparkling water":"Agua con gas",
  "Milk soda":"Refresco lácteo","Sparkling fruit soda":"Refresco de fruta con gas","Fruit drink":"Bebida de fruta","Classic soft drink":"Refresco clásico",
  "Brewed soft drink":"Refresco fermentado","Sparkling soft drink":"Bebida con gas","Soft drink":"Refresco"};
I18N.es={
  locale:"es-MX", loading:"Cargando los retos de hoy…",  title:"Snack Crackle Pop",
  tear:"Abre aquí · retos nuevos cada día", ribbon:"¿Experto en snacks? Demuéstralo.", bestby:"Consumir antes de: medianoche",
  help:"Cómo jugar", stats:"Stats", tabs:["Diario","Reto <small>3 productos</small>","Sin fin"], modeAria:"Modo de juego",
  guessLabel:"Tu respuesta", guessBtn:"Adivinar", placeholder:"Prueba: mango, barbacoa…", roundDone:"Ronda terminada",
  burst:{daily:"3 rondas<small>de menos a más</small>",challenge:"Trío<small>tres a la vez</small>",endless:"Sin parar<small>cero presión</small>"},
  meta:(m,no,d,trio)=>m==="daily"?`Diario n.º ${no} · ${d}`:m==="challenge"?`Reto n.º ${no} · ${d}`:`Sin fin · ${trio?"tríos":"pares"}`,
  tiers:["Fácil","Medio","Difícil"], roundN:i=>`Ronda ${i}`, playing:"Jugando", total:"Total", pts:n=>`${n} puntos`,
  countLine:(d,n,X)=>{const num=n===3?"tres":"dos";
    const w=d===0?`Estos ${num} snacks`:d===n?`Estas ${num} bebidas`:n===2?"Este snack y esta bebida":`Estos ${num} snacks y bebidas`;
    return `${w} tienen <b>${X} sabor${X===1?"":"es"}</b> en común.`},
  needLine:(X,cap)=>X===1?"¿Le atinas?":X<=cap?`¿Te sabes los ${X}?`:`Con ${cap} basta.`,
  tierLines:["Para calentar. ","Aquí se pone interesante. ","Aquí se separan los expertos de los aficionados. "], trioLine:"Tres de un jalón. ",
  rulesFree:"Puro gusto: sin puntos, sin presión, adivina todo lo que quieras.",
  rules:(p,c)=>`${p} puntos en juego. Cada error te cuesta ${c}.`,
  thisWeek:l=>` Esta semana: ${l}.`, diffLabel:{easier:"las dos pistas de regalo",easy:"pista de familia desde el inicio",hard:"las pistas salen más tarde"},
  found:"Sabores encontrados", flavorN:i=>`Sabor ${i}`, misses:"Errores", roundScore:"Puntos de la ronda",
  facts:"Datos de tus intentos", prize:"¡PREMIO ADENTRO!", answer:"LA RESPUESTA",
  thFlavor:"Sabor", tasteClues:"Pistas de sabor", nextGuess:"Te toca…",
  traits:{w:"Dulce",s:"Salado",o:"Ácido",b:"Amargo",h:"Picante",u:"Umami",f:"Frutal",c:"Cremoso"},
  traitNo:(x,l)=>`${x}: no es ${l}`, traitCell:(l,g)=>`${l}: ${g?"alguna respuesta también":"ninguna respuesta"}`,
  markAria:(s,y,x)=>`${s} ${y?"sí viene":"no viene"} en ${x}`,
  hint:"Pista", hintFam:"familia", hintLetter:"primera letra", freebie:"regalo",
  hintWhen:n=>n===0?"de regalo":`sale tras ${n} error${n>1?"es":""}`,
  hint1Closed:"La familia de un sabor que te falta", hint2Closed:"La primera letra de ese sabor",
  hint1Init:"Familia del sabor", hint2Init:"Primera letra",
  and:" y ", list:a=>a.length===3?`${a[0]}, ${a[1]} y ${a[2]}`:`${a[0]} y ${a[1]}`,
  heads:{flawless:"Sin un solo error.",nailed:"¡Le atinaste!",got:"¡Por fin!",missed:"Esto es lo que te faltó",stumped:"¡Te dejó en blanco!"},
  wonNoMiss:ns=>`Encontraste lo que tienen en común ${ns} sin fallar ni una. Presumido.`,
  won:(ns,m)=>`Encontraste lo que tienen en común ${ns}, con ${m} error${m>1?"es":""}.`,
  lostSome:(f,n)=>`Sacaste ${f} de ${n}. ¡Nada mal!`, lostNone:"Esta se te escapó.", share:ns=>`${ns} tienen en común:`,
  wasOne:"El sabor era", wasMany:"Los sabores eran", bonus:l=>`También valían: ${l}.`,
  nextUp:t=>`Sigue: ${t} →`, todayTotal:"Total de hoy", copyScore:"Copiar mi puntaje",
  sendIt:"Mándaselo al amigo que se cree experto en snacks.", freshIn:trio=>trio?"Nuevo trío en":"Nuevos pares en",
  deal:"¡Otra!", copied:"¡Copiado! Ahora mándalo", selected:"Seleccionado. Cópialo y mándalo",
  hungry:"¿Todavía con hambre?", playOther:m=>m==="challenge"?"Juega el Reto de hoy":"Juega el Diario de hoy", tryEndless:"Prueba Sin fin",
  sizeAria:"Tamaño de los retos Sin fin", pairs:"Pares", trios:"Tríos", giveUp:"Me rindo", skip:"Siguiente",
  typeFirst:"Escribe un sabor primero y luego dale a Adivinar.", amb:l=>`¿${l.join(" o ")}? Elige el que querías.`,
  choc:"Solo «chocolate» sería muy fácil, así que no cuenta. Prueba amargo o blanco.",
  unknown:r=>`Mmm, «${r}» no lo conocemos. Revisa cómo lo escribiste o elige de la lista.`,
  heard:n=>`Va con ${n}. `, already:n=>`${n} ya lo intentaste. ¡Cámbiale!`,
  covered:(n,h)=>`${n} cuenta como ${h}, y ese ya lo tienes.`,
  via:h=>` (cuenta como ${h})`, hit:(n,v,left)=>`¡Sí! ${n}, bien visto${v}. Te faltan ${left}.`,
  partial:n=>`¡Casi! Solo algunos vienen en ${n}.`, miss:n=>`Nop, no es ${n}.`,
  statsTitle:m=>m==="challenge"?"Tus stats del Reto":"Tus stats del Diario",
  statLabels:["Jugadas","Promedio","Récord","Racha"],
  lastN:(n,max)=>n===1?`Tu última partida (de ${max})`:`Tus últimas ${n} partidas (de ${max})`, noGames:"Todavía no juegas. Ve y pon un puntaje que tus amigos tengan que superar.",
  tried:"ya", close:"Cerrar", letsPlay:"¡Va!", helpTitle:"Cómo jugar",
  shareHead:(m,no)=>m==="daily"?`Snack Crackle Pop n.º ${no}`:m==="challenge"?`Snack Crackle Pop Reto n.º ${no}`:"Snack Crackle Pop Sin fin",
  kind:d=>d?"Bebida":"Snack", confirmed:n=>`Sabores confirmados de ${n}`,
  helpBody:`<ol>
      <li>Te salen dos snacks o bebidas, casi siempre de países distintos. Tu misión: adivinar los sabores en los que han salido <b>los dos</b>. Te decimos cuántos son.</li>
      <li>Si comparten varios, encuéntralos todos (máximo 3). Empieza a escribir y elige de la lista.</li>
      <li>Cada ronda vale <b>1,000 puntos</b>. Cada error te cuesta <b>125</b>, y con seis errores se acaba la ronda. Lo que ya encontraste sí cuenta.</li>
      <li>No te claves con la ortografía: «qeso», «caramleo», «té verde» o «limón chile» funcionan. En inglés también.</li>
      <li>Las familias grandes cuentan: un snack Habanero o Flamin’ Hot cuenta como «Picante», y Queso nacho como «Queso».</li>
      <li>Fallar no es perder el tiempo: verás un <b>✓</b> en cada producto que sí tiene ese sabor, y queda en su tarjeta como pista.</li>
      <li><b>Pistas de sabor:</b> cada intento prende sus sabores (dulce, salado, ácido, amargo, picante, umami) y si es frutal o cremoso. <b style="color:var(--hit)">Verde</b>: al menos una respuesta también lo tiene. <b style="color:var(--tomato)">Rojo</b>: ninguna. Gris: tu intento no tiene ese sabor. ¿Pusiste Limón amarillo (dulce + ácido) y te salió verde en ácido y rojo en dulce? La respuesta es ácida, no dulce.</li>
      <li>¿Atorado? Tras 2 errores te damos la familia de un sabor que te falta. Tras 4, su primera letra.</li>
      <li>El <b>Diario</b> son tres rondas, <b>Fácil → Medio → Difícil</b>, para un máximo de 3,000. La 1 son sabores de todos los días. En la 3 se nota quién sabe de verdad. Retos nuevos a medianoche, hora local.</li>
      <li>El <b>Reto</b> es una ronda al día con tres productos en vez de dos. <b>Sin fin</b> te reparte pares o tríos todo lo que quieras: sin puntos ni límite de errores.</li>
      <li>Los retos se ajustan según cómo juega todo el mundo, y Sin fin se ajusta a ti.</li>
    </ol>
    <p style="color:var(--ink-soft);font-size:14px;margin:0">Letra chiquita: un sabor cuenta si está en la línea actual del producto, y las mezclas cuentan para cada sabor del nombre (Fresa-Limón verde cuenta como Fresa y como Limón verde). Las marcas se quedan con su nombre original.</p>`
};
