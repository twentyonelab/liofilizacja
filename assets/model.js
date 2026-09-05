/* Silnik bilansu cieplnego liofilizatora – sekcje 1–3 symulatora v1.0; jedyna zmiana: pauzy zamienione na półpauzy w tekstach.
   Globalne: model(), profile(), P, P0, GROUPS, LEVERS, PRODUCTS, GRADES, SCEN, TARIFFS, FORMATS, FRZMODE, SHAPES, fluxAt(), tIce(), pIce(). */
"use strict";
/* ============================================================
   1. STAŁE FIZYCZNE I DANE SUROWCOWE
   ============================================================ */
const LF=333.6, DHS=2838, DHD=3000, CPI=2.05, CPW=4.187, CPD=1.50, K0=273.15;
const copC=(te,tc,eta)=> tc<=te ? 99 : eta*(te+K0)/(tc-te);
/* prężność pary nasyconej nad lodem – Murphy & Koop 2005, [Pa], T w °C */
function pIce(tC){
  const T=tC+K0;
  return Math.exp(9.550426-5723.265/T+3.53068*Math.log(T)-0.00728332*T);
}
/* odwrotność: temperatura lodu przy zadanej prężności [°C] */
function tIce(p){
  let a=-120, b=0.01;
  for(let i=0;i<26;i++){ const m=(a+b)/2; if(pIce(m)<p) a=m; else b=m; }
  return (a+b)/2;
}
/* współczynnik przejmowania ciepła półka → produkt, rośnie z ciśnieniem i nasyca się */
const kVac=(p,kc,kg,ph)=> kc + kg*p/(p+ph);
/* gęstość strumienia ciepła przy zadanym ciśnieniu komory */
function fluxAt(p,tShelf,kc,kg,ph,dTd){
  const tFront=tIce(p)+dTd;
  return {p, tFront, kv:kVac(p,kc,kg,ph), q:Math.max(0,kVac(p,kc,kg,ph)*(tShelf-tFront))};
}

/* Udział wody dobrany tak, aby uzysk odtwarzał dane produkcyjne (mięso i podroby – FrostX 2026),
   dla pozostałych wg tablic składu (USDA / tablice IŻŻ). `d` to gęstość załadunku tac w kg/m²
   – dla ziół jest kilkakrotnie niższa niż dla owoców i to ona, a nie masa, ogranicza wsad. */
const PRODUCTS={
  truskawka:{n:"Truskawka, plastry 5 mm",      w:.910, t:26, d:10, tc:-20, sp:200, rp:6, pro:0.7, nu:{c:58.8,b12:0,fe:.41,ca:16,k:153,kar:7,pol:230,ant:35,fib:2.0},  g:"Owoce"},
  truskCala:{n:"Truskawka, cała",              w:.910, t:40, d:7, tc:-20, sp:230, rp:6, pro:0.7, nu:{c:58.8,b12:0,fe:.41,ca:16,k:153,kar:7,pol:230,ant:35,fib:2.0},   g:"Owoce"},
  malina:   {n:"Malina, cała",                 w:.860, t:24, d:6, tc:-20, sp:260, rp:9, pro:1.2, nu:{c:26.2,b12:0,fe:.69,ca:25,k:151,kar:12,pol:300,ant:40,fib:6.5},   g:"Owoce"},
  borowka:  {n:"Borówka, cała",                w:.845, t:26, d:8, tc:-22, sp:240, rp:12, pro:0.7, nu:{c:9.7,b12:0,fe:.28,ca:6,k:77,kar:32,pol:525,ant:165,fib:2.4},   g:"Owoce"},
  jablko:   {n:"Jabłko, plastry",              w:.856, t:26, d:10, tc:-22, sp:120, rp:1.5, pro:0.3, nu:{c:4.6,b12:0,fe:.12,ca:6,k:107,kar:27,pol:135,ant:2,fib:2.4},  g:"Owoce"},
  mirabelka:{n:"Mirabelka, bez pestki",        w:.820, t:30, d:9, tc:-22, sp:150, rp:3, pro:0.7, nu:{c:9.5,b12:0,fe:.17,ca:6,k:157,kar:190,pol:320,ant:20,fib:1.4},   g:"Owoce"},
  wegierka: {n:"Węgierka, bez pestki",         w:.825, t:32, d:9, tc:-22, sp:150, rp:3.5, pro:0.7, nu:{c:9.5,b12:0,fe:.17,ca:6,k:157,kar:190,pol:320,ant:20,fib:1.4},   g:"Owoce"},
  renkloda: {n:"Renkloda, bez pestki",         w:.845, t:32, d:9, tc:-22, sp:150, rp:4, pro:0.8, nu:{c:9.5,b12:0,fe:.17,ca:6,k:157,kar:190,pol:320,ant:20,fib:1.4},   g:"Owoce"},
  mango:    {n:"Mango, kostka / plastry",       w:.835, t:26, d:10,  tc:-20, sp:170, rp:8, pro:0.8, nu:{c:36.4,b12:0,fe:.16,ca:11,k:168,kar:640,pol:100,ant:0,fib:1.6},   g:"Owoce"},
  morela:   {n:"Morela, połówki / plastry",     w:.860, t:26, d:9,   tc:-21, sp:160, rp:6, pro:1.4, nu:{c:10.0,b12:0,fe:.39,ca:13,k:259,kar:1094,pol:135,ant:0,fib:2.0},   g:"Owoce"},
  banan:    {n:"Banan, plastry",                w:.750, t:24, d:10,  tc:-18, sp:130, rp:4.5, pro:1.1, nu:{c:8.7,b12:0,fe:.26,ca:5,k:358,kar:26,pol:90,ant:0,fib:2.6}, g:"Owoce"},
  kokos:    {n:"Kokos, miąższ (wiórki, płatki)", w:.470, t:20, d:7,   tc:-15, sp:95, rp:10, fat:33.5, pro:3.3, nu:{c:3.3,b12:0,fe:2.43,ca:14,k:356,kar:0,pol:80,ant:0,fib:9.0}, g:"Owoce"},
  marchew:  {n:"Marchew, kostka",              w:.880, t:24, d:11, tc:-18, sp:110, rp:1.2, pro:0.9, nu:{c:5.9,b12:0,fe:.30,ca:33,k:320,kar:8285,pol:100,ant:0,fib:2.8},  g:"Warzywa"},
  papryka:  {n:"Papryka, paski (blanszowana)", w:.920, t:22, d:8, tc:-20, sp:130, rp:4, pro:1.0, nu:{c:127.7,b12:0,fe:.43,ca:7,k:211,kar:1624,pol:120,ant:0,fib:2.1},   g:"Warzywa"},
  ziemniak: {n:"Ziemniak, kostka (blansz.)",   w:.790, t:22, d:11, tc:-10, sp:70, rp:0.8, pro:2.0, nu:{c:19.7,b12:0,fe:.81,ca:12,k:425,kar:1,pol:60,ant:0,fib:2.2},  g:"Warzywa"},
  majeranek:{n:"Majeranek, całe gałązki",      w:.840, t:16, d:2.5, tc:-20, sp:300, rp:12, pro:3.0, nu:{c:51.0,b12:0,fe:5.0,ca:200,k:300,kar:2400,pol:700,ant:0,fib:7.0}, g:"Zioła – całe gałązki"},
  oregano:  {n:"Oregano, całe gałązki",        w:.720, t:14, d:2.8, tc:-20, sp:280, rp:14, pro:3.4, nu:{c:7.0,b12:0,fe:3.4,ca:232,k:260,kar:2620,pol:900,ant:0,fib:4.2}, g:"Zioła – całe gałązki"},
  rozmaryn: {n:"Rozmaryn, całe gałązki",       w:.680, t:16, d:3.0, tc:-20, sp:280, rp:16, pro:3.3, nu:{c:21.8,b12:0,fe:6.65,ca:317,k:668,kar:2924,pol:850,ant:0,fib:14.1}, g:"Zioła – całe gałązki"},
  bazylia:  {n:"Bazylia, całe gałązki",        w:.900, t:18, d:2.0, tc:-21, sp:320, rp:10, pro:3.2, nu:{c:18.0,b12:0,fe:3.17,ca:177,k:295,kar:3142,pol:800,ant:0,fib:1.6}, g:"Zioła – całe gałązki"},
  pietruszka:{n:"Pietruszka, nać, całe gałązki",w:.860,t:18, d:2.2, tc:-21, sp:300, rp:8, pro:3.0, nu:{c:133.0,b12:0,fe:6.20,ca:138,k:554,kar:5054,pol:600,ant:0,fib:3.3}, g:"Zioła – całe gałązki"},
  lubczyk:  {n:"Lubczyk, całe gałązki",        w:.860, t:18, d:2.2, tc:-21, sp:300, rp:10, pro:3.0, nu:{c:30.0,b12:0,fe:2.5,ca:130,k:470,kar:1800,pol:500,ant:0,fib:3.0}, g:"Zioła – całe gałązki"},
  mleko:    {n:"Mleko pełne",                  w:.875, t:24, d:8,   tc:-24, sp:16, liq:1, rp:2.2, fat:3.5, pro:3.3, nu:{c:0,b12:.45,fe:.03,ca:113,k:132,kar:7,pol:0,ant:0,fib:0}, g:"Nabiał i płyny"},
  serwatka: {n:"Retentat serwatkowy (białko natywne)", w:.750, t:24, d:9,   tc:-22, sp:120, liq:1, rp:3.5, fat:1.0, pro:6.0, nu:{c:0,b12:.30,fe:.10,ca:60,k:160,kar:0,pol:0,ant:0,fib:0}, g:"Nabiał i płyny"},
  smietKok: {n:"Śmietanka kokosowa",            w:.680, t:22, d:8,   tc:-18, sp:180, rp:8, fat:24.0, liq:1, pro:2.3, nu:{c:1.0,b12:0,fe:3.3,ca:16,k:325,kar:0,pol:60,ant:0,fib:2.2}, g:"Nabiał i płyny"},
  twarog:   {n:"Twaróg chudy",                  w:.780, t:24, d:9, tc:-16, sp:200, rp:14, fat:0.5, pro:19.0, liq:1, nu:{c:0,b12:.63,fe:.07,ca:83,k:86,kar:0,pol:0,ant:0,fib:0}, g:"Nabiał i płyny"},
  skyr:     {n:"Skyr / jogurt typu greckiego",  w:.840, t:26, d:8, tc:-20, sp:180, rp:12, fat:0.4, pro:11.0, liq:1, nu:{c:0,b12:.75,fe:.05,ca:110,k:141,kar:2,pol:0,ant:0,fib:0}, g:"Nabiał i płyny"},
  bialkoJaj:{n:"Białko jaja, płynne",           w:.880, t:24, d:8, tc:-15, sp:190, rp:12, fat:0.2, pro:11.0, liq:1, nu:{c:0,b12:.09,fe:.08,ca:7,k:163,kar:0,pol:0,ant:0,fib:0}, g:"Nabiał i płyny"},
  jogurt:   {n:"Jogurt naturalny (kawałki, proszek)",w:.870, t:26, d:8,   tc:-26, sp:160, liq:1, rp:4.5, fat:3.0, pro:3.5, nu:{c:.5,b12:.37,fe:.05,ca:121,k:155,kar:5,pol:0,ant:0,fib:0}, g:"Nabiał i płyny"},
  owies:    {n:"Płatki owsiane",                w:.087, t:14, d:6,  tc:-5,  sp:60,  rp:4,  fat:6.9, dry:1, pro:16.9, nu:{c:0,b12:0,fe:4.72,ca:54,k:429,kar:0,pol:60,ant:0,fib:10.6}, g:"Składniki suche"},
  owiesMaka:{n:"Mąka owsiana",                  w:.080, t:14, d:7,  tc:-5,  sp:60,  rp:6,  fat:7.0, dry:1, pro:13.0, nu:{c:0,b12:0,fe:4.0,ca:50,k:400,kar:0,pol:55,ant:0,fib:6.5}, g:"Składniki suche"},
  blonnik:  {n:"Błonnik owsiany",               w:.060, t:14, d:4,  tc:-4,  sp:80,  rp:12, fat:2.0, dry:1, pro:3.0, nu:{c:0,b12:0,fe:2.0,ca:50,k:200,kar:0,pol:30,ant:0,fib:60.0}, g:"Składniki suche"},
  wpi:      {n:"Izolat serwatkowy WPI 90",      w:.050, t:14, d:8, tc:-6, sp:120, rp:75, fat:0.5, pro:90.0, dry:1, nu:{c:0,b12:1.5,fe:.5,ca:400,k:200,kar:0,pol:0,ant:0,fib:0}, g:"Składniki suche"},
  wpc:      {n:"Koncentrat serwatkowy WPC 80",  w:.050, t:14, d:8, tc:-6, sp:100, rp:50, fat:7.0, pro:80.0, dry:1, nu:{c:0,b12:2.0,fe:.7,ca:450,k:500,kar:0,pol:0,ant:0,fib:0}, g:"Składniki suche"},
  groch:    {n:"Izolat białka grochu",          w:.060, t:14, d:7, tc:-6, sp:90,  rp:40, fat:7.0, pro:80.0, dry:1, nu:{c:0,b12:0,fe:5.0,ca:100,k:100,kar:0,pol:0,ant:0,fib:2.0}, g:"Składniki suche"},
  bialkoOw: {n:"Białko owsiane",                w:.060, t:14, d:7, tc:-6, sp:95,  rp:45, fat:8.0, pro:55.0, dry:1, nu:{c:0,b12:0,fe:4.0,ca:80,k:350,kar:0,pol:40,ant:0,fib:5.0}, g:"Składniki suche"},
  albumina: {n:"Albumina jaja w proszku",       w:.060, t:14, d:6, tc:-7, sp:110, rp:70, fat:0.5, pro:80.0, dry:1, nu:{c:0,b12:.20,fe:.20,ca:60,k:1100,kar:0,pol:0,ant:0,fib:0}, g:"Składniki suche"},
  omp:      {n:"Odtłuszczone mleko w proszku",  w:.040, t:14, d:8, tc:-8, sp:60,  rp:16, fat:1.0, pro:36.0, dry:1, nu:{c:1.5,b12:4.0,fe:.32,ca:1257,k:1794,kar:0,pol:0,ant:0,fib:0}, g:"Składniki suche"},
  malto:    {n:"Maltodekstryna DE 15",          w:.050, t:14, d:8,  tc:-9,  sp:40,  rp:6,  fat:0.0, dry:1, pro:0.0, nu:{c:0,b12:0,fe:0,ca:0,k:5,kar:0,pol:0,ant:0,fib:0}, g:"Składniki suche"},
  macznik:  {n:"Larwy mącznika (Tenebrio)",     w:.620, t:24, d:9, tc:-14, sp:180, rp:18, fat:13.0, pro:19.0, nu:{c:4.0,b12:.50,fe:2.0,ca:42,k:340,kar:0,pol:0,ant:0,fib:2.5}, g:"Mięso i podroby"},
  filet:    {n:"Filet z kurczaka",             w:.749, t:28, d:10, tc:-12, sp:220, rp:16, fat:1.2, pro:23.0, nu:{c:0,b12:.34,fe:.37,ca:5,k:256,kar:5,pol:0,ant:0,fib:0},  g:"Mięso i podroby"},
  wolowina: {n:"Wołowina, plastry",            w:.740, t:28, d:10, tc:-12, sp:220, rp:22, fat:5.0, pro:21.0, nu:{c:0,b12:2.60,fe:2.60,ca:12,k:318,kar:0,pol:0,ant:0,fib:0},  g:"Mięso i podroby"},
  watroba:  {n:"Wątroba wieprzowa",            w:.751, t:26, d:10, tc:-13, sp:200, rp:15, fat:3.5, pro:20.0, nu:{c:23.6,b12:26.0,fe:23.3,ca:9,k:273,kar:0,pol:0,ant:0,fib:0},  g:"Mięso i podroby"},
  serca:    {n:"Serca kurze",                  w:.807, t:28, d:9, tc:-13, sp:200, rp:12, fat:9.3, pro:15.5, nu:{c:3.2,b12:7.30,fe:5.96,ca:12,k:176,kar:0,pol:0,ant:0,fib:0},   g:"Mięso i podroby"},
  sercaWol: {n:"Serca wołowe, kostka",         w:.775, t:28, d:10, tc:-13, sp:200, rp:20, fat:4.0, pro:17.7, nu:{c:2.0,b12:8.50,fe:4.31,ca:7,k:287,kar:0,pol:0,ant:0,fib:0},  g:"Mięso i podroby"},
  zwacz:    {n:"Żwacz wołowy, mielony",        w:.800, t:28, d:10, tc:-12, sp:180, rp:14, fat:4.0, pro:12.0, nu:{c:0,b12:1.40,fe:.65,ca:69,k:67,kar:0,pol:0,ant:0,fib:0},  g:"Mięso i podroby"}
};

const FORMATS={
  kawalki:{n:"Kawałki / plastry – wg surowca"},
  warstwa:{n:"Mielone – warstwa na tacy"},
  formy:  {n:"Mielone – w foremkach na tacy"},
  plyta:  {n:"Mielone – płyta do wykrawania"}
};
const SHAPES={
  prostokat:{n:"Prostokąt / kwadrat", y:92},
  szescian: {n:"Sześciokąt (plaster miodu)", y:88},
  kolo:     {n:"Koło / krążek", y:72},
  gwiazda:  {n:"Gwiazdka, serce, kwiatek", y:48},
  litera:   {n:"Litery i figurki", y:38}
};
const CUTSTAGE={
  sucha:   {n:"Po suszeniu – z suchej płyty"},
  mrozona: {n:"Przed suszeniem – z płyty mrożonej"}
};
/* Referencyjne wartości spożycia (rozp. 1169/2011 zał. XIII) i progi oświadczeń (rozp. 1924/2006) */
const NUTR=[
  {k:"c",   n:"Witamina C",        u:"mg", nrv:80,   ret:[90,35],   g2:"witaminy C"},
  {k:"b12", n:"Witamina B12",      u:"µg", nrv:2.5,  ret:[95,75],   g2:"witaminy B12"},
  {k:"fe",  n:"Żelazo",            u:"mg", nrv:14,   ret:[100,100], g2:"żelaza"},
  {k:"ca",  n:"Wapń",              u:"mg", nrv:800,  ret:[100,100], g2:"wapnia"},
  {k:"k",   n:"Potas",             u:"mg", nrv:2000, ret:[100,100], g2:"potasu"},
  {k:"kar", n:"Beta-karoten",      u:"µg", nrv:9600, ret:[85,55],   g2:"witaminy A"},
  {k:"pol", n:"Polifenole ogółem", u:"mg", nrv:0,    ret:[92,65]},
  {k:"ant", n:"Antocyjany",        u:"mg", nrv:0,    ret:[88,45]},
  {k:"fib", n:"Błonnik",           u:"g",  nrv:0,    ret:[100,100]}
];
const BASIS={
  produkt:{n:"Na 100 g produktu", t:"Na 100 g produktu", d:"Tak wygląda etykieta. Mierzy głównie usunięcie wody."},
  sucha:  {n:"Na 100 g suchej masy", t:"Na 100 g suchej masy", d:"Uczciwe porównanie chemiczne. Widać samą retencję."},
  porcja: {n:"Na porcję z 100 g świeżego", t:"Na porcję ze 100 g świeżego", d:"Co realnie dostaje konsument w równoważnej porcji."}
};
const BASORD=["produkt","sucha","porcja"];

const GRADES={
  deser:   {n:"Deserowa / klasa I", d:55,  loss:2,  dm:0},
  przem:   {n:"Przemysłowa (odniesienie)", d:0, loss:6, dm:0},
  odrzut:  {n:"Odrzut sortowniczy / klasa II", d:-32, loss:14, dm:.5},
  nadwyzka:{n:"Przejrzałe i nadwyżki sezonowe", d:-58, loss:24, dm:1.5}
};
const FRZMODE={
  inline:{n:"Szoker w linii (obieg zakładu)"},
  iqf:   {n:"Tunel fluidyzacyjny IQF (osobna maszyna)"},
  kupny: {n:"Surowiec kupowany mrożony"}
};

const SINKS_H=[
  {id:"h1", n:"Ogrzewanie hali i piwnic",            T:45, q:120, on:true},
  {id:"h2", n:"Wstępne podgrzanie i mycie surowca",  T:35, q:60,  on:true},
  {id:"h3", n:"CWU i mycie zakładu",                 T:60, q:150, on:true},
  {id:"h4", n:"Regeneracja osuszacza hali pakowania",T:80, q:90,  on:true},
  {id:"h5", n:"Pasteryzacja / CIP mleczarni",        T:85, q:200, on:false}
];
const SINKS_C=[
  {id:"c1", n:"Chłodnica powietrza hali pakowania",  T:2,  q:45, on:true},
  {id:"c2", n:"Dojrzewalnia serów",                  T:12, q:60, on:false},
  {id:"c3", n:"Mroźnia surowca",                     T:-20,q:80, on:true}
];

/* --- fotowoltaika: Kraków, 35° S, kWh/kWp miesięcznie (profil typu PVGIS) --- */
const PV_M=[25,40,80,115,130,128,133,122,95,65,30,20];      /* suma 983 kWh/kWp */
const DAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const DAYLEN=[8.5,10.0,11.9,13.8,15.5,16.3,15.9,14.4,12.5,10.6,8.9,8.1];
const MONTHS=["styczeń","luty","marzec","kwiecień","maj","czerwiec","lipiec","sierpień","wrzesień","październik","listopad","grudzień"];
const MSHORT=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

/* --- kształt doby cen na rynku dnia następnego (RCEt), znormalizowany do średniej 1 --- */
function norm(a){const m=a.reduce((x,y)=>x+y,0)/a.length; return a.map(v=>v/m);}
const SHAPE={
  zima:norm([.80,.74,.70,.69,.72,.82,1.05,1.30,1.35,1.25,1.15,1.08,1.02,1.00,1.02,1.12,1.35,1.60,1.55,1.40,1.25,1.10,.98,.88]),
  przej:norm([.78,.72,.68,.66,.68,.78,.98,1.20,1.15,.98,.80,.65,.55,.52,.55,.70,.92,1.20,1.50,1.65,1.55,1.30,1.05,.90]),
  lato:norm([.72,.66,.62,.60,.62,.72,.92,1.10,1.05,.85,.60,.38,.25,.20,.22,.32,.55,.85,1.25,1.75,2.10,1.95,1.45,1.05])
};
const SEASON=["zima","zima","przej","przej","lato","lato","lato","lato","przej","przej","zima","zima"];
const MONTHF=[1.20,1.15,1.02,.88,.82,.85,.90,.92,.98,1.05,1.15,1.18];
const TARIFFS={flat:{n:"Stała (jednostrefowa)"},zone:{n:"Dwustrefowa (dzień / noc)"},dyn:{n:"Dynamiczna (RCEt godzinowe)"}};

/* Dźwignie kosztowe: każda opisana realną zmianą w obie strony.
   `lepiej` to kierunek poprawy, `gorzej` – koszt zaniedbania. */
const LEVERS=[
 {n:"Sprawność egzergetyczna sprężarek", z:"±5 p.p.",
  lepiej:p=>({etaCO2:p.etaCO2+5, etaR290:p.etaR290+5}), gorzej:p=>({etaCO2:p.etaCO2-5, etaR290:p.etaR290-5}),
  t:"Ekonomizer, większe wymienniki, sprężarki inwerterowe. Najdroższa dźwignia inwestycyjnie, ale jedyna, która działa w każdej godzinie roku i na każdym surowcu."},
 {n:"Czas cyklu – obróbka wstępna", z:"∓15 %",
  lepiej:p=>({tCycle:p.tCycle*0.85}), gorzej:p=>({tCycle:p.tCycle*1.15}),
  t:"Cieńsze plastry, blanszowanie, PEF, ultradźwięki. Działa podwójnie: mniej godzin próżni i urządzeń pomocniczych, a przy tym więcej cykli w roku."},
 {n:"Temperatura kondensatora lodu", z:"∓5 K",
  lepiej:p=>({tIceSurf:p.tIceSurf+5}), gorzej:p=>({tIceSurf:p.tIceSurf-5}),
  t:"Nie schładzaj głębiej, niż wymaga ciśnienie w komorze. Farmaceutyczne −60 °C w żywności to czysta strata – Cuddon pracuje na −40 °C."},
 {n:"Poziom skraplania stopnia wysokiego", z:"∓5 K",
  lepiej:p=>({tCondHT:p.tCondHT-5}), gorzej:p=>({tCondHT:p.tCondHT+5}),
  t:"Podnoś skraplanie tylko do poziomu, na którym ciepło ma odbiorcę. Bez odbiorcy każdy stopień wyżej jest czystym kosztem sprężania."},
 {n:"Urządzenia pomocnicze", z:"∓25 %",
  lepiej:p=>({pAux:p.pAux*0.75}), gorzej:p=>({pAux:p.pAux*1.25}),
  t:"Pompy glikolu i wentylatory na falownikach, wyłączanie w fazach bez obciążenia. Tania dźwignia, bo te urządzenia chodzą przez cały cykl bez przerwy."},
 {n:"Zespół próżniowy", z:"∓25 %",
  lepiej:p=>({pVac:p.pVac*0.75}), gorzej:p=>({pVac:p.pVac*1.25}),
  t:"Dobór pomp do rzeczywistej nieszczelności, a nie do katalogu. Po osiągnięciu próżni roboczej praca na obniżonych obrotach."},
 {n:"Magazyny ciepła i chłodu", z:"+8 / −4 h",
  lepiej:p=>({storeColdH:p.storeColdH+8, storeHeatH:p.storeHeatH+8}),
  gorzej:p=>({storeColdH:Math.max(0,p.storeColdH-4), storeHeatH:Math.max(0,p.storeHeatH-4)}),
  t:"Więcej godzin buforowania to więcej zużycia przesuniętego w tanie godziny i pod własną produkcję. Zasobnik wodny jest tani, magazyn chłodu na poziomie kaskadowym też."},
 {n:"Moc instalacji PV", z:"+100 / −50 kWp",
  lepiej:p=>({pvKwp:p.pvKwp+100}), gorzej:p=>({pvKwp:Math.max(0,p.pvKwp-50)}),
  t:"Pełną cenę zakupu jest wart tylko ten kilowat, który zakład zużyje na miejscu. Powyżej mocy podstawowej autokonsumpcja szybko spada i przyrost korzyści maleje."},
 {n:"Wilgotność końcowa produktu", z:"±1 p.p.",
  lepiej:p=>({wEnd:p.wEnd+1}), gorzej:p=>({wEnd:Math.max(1,p.wEnd-1)}),
  t:"Nie susz głębiej, niż wymaga trwałość i aktywność wody. Ostatni punkt procentowy to woda związana, odrywana entalpią wyższą niż sublimacja."},
 {n:"Temperatura zamrożenia", z:"±5 K",
  lepiej:p=>({tFreeze:p.tFreeze+5}), gorzej:p=>({tFreeze:p.tFreeze-5}),
  t:"Mroź tylko tak głęboko, jak wymaga struktura produktu i temperatura eutektyczna. Każde 5 K to realny chłód do wytworzenia."},
 {n:"Surowiec mrożony na wejściu", z:"−25 °C, kupowany",
  lepiej:p=>({tIn:-25, frzMode:"kupny"}), gorzej:p=>({tIn:15, frzMode:"iqf"}),
  t:"Zamrażanie poza cyklem skraca cykl o całą fazę mrożenia. Efekt siedzi w przerobie, nie w kilowatogodzinach. Własny tunel IQF w bilansie działa odwrotnie."},
 {n:"Rozliczenie energii", z:"dynamiczna / stała",
  lepiej:p=>({tariff:"dyn"}), gorzej:p=>({tariff:"flat"}),
  t:"Przy pracy ciągłej profil zakładu sam zbiera tanie godziny nocne. Zmiana umowy nie wymaga żadnej inwestycji – to najtańsza pozycja na tej liście."}
];
/* nakład: 1 = wymaga inwestycji, 0 = nastawa albo umowa */
[1,1,0,0,1,1,1,1,0,0,0,0].forEach((v,i)=>{ if(LEVERS[i]) LEVERS[i].inv=v; });

const SCEN=[
  {k:"A", nm:"Tradycyjny",        ds:"Grzałki elektryczne na półkach, agregat R507 dwustopniowy, skraplacz powietrzny. Stan techniki."},
  {k:"B", nm:"Tradycyjny + odzysk",ds:"To samo, ale skraplanie podniesione do poziomu półek i ciepło skraplania zawrócone na półki."},
  {k:"C", nm:"Kaskada CO₂ / R290", ds:"CO₂ subkrytyczny na kondensatorze lodu, R290 jako stopień wysoki. Sterowany poziom skraplania, odzysk chłodu z odszraniania."},
  {k:"D", nm:"Zintegrowany 21z",   ds:"Kaskada + booster CO₂ transkrytyczny na potrzeby wysokotemperaturowe + magazyn ciepła i chłodu + przesunięcie taryfowe."}
];

/* ============================================================
   2. PARAMETRY – definicja pól sterujących
   ============================================================ */
const P={
  product:"truskawka", format:"kawalki", batch:500, wEnd:3.0, tCycle:26, avail:85, tFrz:4.0, tDes:3.0, trayArea:50,
  layerMm:12, moldMl:25, moldDepth:18, moldCover:78, pureeDens:1.05, frontSpeed:0.8, sublExp:1.6,
  cutShape:"kolo", cutYield:72, cutStage:"mrozona", scrapRecov:95, scrapPrice:60,
  frzMode:"inline", tIQF:-38, iqfFan:25, iqfLoss:1.0, iqfCrystal:12,
  mix2:"owies", mix2pct:0, mix3:"kokos", mix3pct:0,
  basis:"produkt", wEndTrad:18, retFD:100, retTrad:100,
  grade:"przem", rawPrice:6.0, lossMilledRel:60, labor:20, pack:12, overhead:10, life:15, salePrice:200,
  pCham:65, kC:8, kG:14, pHalf:40, dTdrive:4, airLeak:0.5, collapsePen:14,
  tIn:15, tFreeze:-35, tShelf:40, tIceSurf:-40, tAmb:15,
  tCasc:-5, tCondHT:50, dTe:5, dTcasc:5, dTcAir:25, dTcDry:10, tW1:20, tW2:85,
  etaHFC:45, etaCO2:52, etaR290:45, etaBoost:42, storeBonus:3,
  leak:5, radLeak:3, vapSens:1.3, boundFrac:8, iceFrac:96, etaHeat:98,
  fDefrost:5, fMatch:88, fMatchStore:98, etaBoiler:90,
  pVac:5.5, dutyVac:70, pAux:4.0,
  elDay:0.92, elNight:0.62, gasPrice:0.30, powerFee:219,
  tariff:"dyn", mktMean:410, duckDepth:100, sprzedMar:40, distVar:180, sellShare:100,
  pvKwp:100, pvYield:985, pvCapex:2700, storeHeatH:8, storeColdH:8, flexBase:8, viewMonth:6,
  co2el:0.55, co2gas:0.202,
  capexA:520, capexB:610, capexC:980, capexD:1350,
  sinksH:SINKS_H.map(s=>({...s})), sinksC:SINKS_C.map(s=>({...s}))
};
const P0=JSON.parse(JSON.stringify(P));

const GROUPS=[
 {t:"Wsad i cykl", open:true, f:[
  {k:"product", l:"Surowiec", type:"select", opts:PRODUCTS},
  {k:"format", l:"Postać na tacy", type:"select", opts:FORMATS},
  {k:"mix2", l:"Składnik dodatkowy 1", type:"select", opts:PRODUCTS},
  {k:"mix2pct", l:"Udział składnika 1", u:"% masy mokrej", min:0, max:70, step:1,
   h:"Zero wyłącza mieszankę. Składniki suche wnoszą suchą masę, nie wnosząc wody – to najprostszy sposób na poprawę uzysku i podniesienie temperatury zapadania."},
  {k:"mix3", l:"Składnik dodatkowy 2", type:"select", opts:PRODUCTS},
  {k:"mix3pct", l:"Udział składnika 2", u:"% masy mokrej", min:0, max:70, step:1},
  {k:"layerMm", l:"Grubość warstwy przecieru", u:"mm", min:4, max:40, step:1, showIf:"warstwaLub"},
  {k:"cutShape", l:"Kształt wykrojnika", type:"select", opts:SHAPES, showIf:"plyta"},
  {k:"cutYield", l:"Wykorzystanie płyty", u:"%", min:20, max:96, step:1, showIf:"plyta",
   h:"Ile powierzchni płyty zamienia się w kształty. Prostokąty tracą tylko marginesy, koła w układzie sześciokątnym schodzą do ok. 72 %, figurki poniżej 50 %."},
  {k:"cutStage", l:"Moment wykrawania", type:"select", opts:CUTSTAGE, showIf:"plyta"},
  {k:"scrapRecov", l:"Odzysk ażuru do przecieru", u:"%", min:0, max:100, step:1, showIf:"mrozona",
   h:"Ażur z płyty mrożonej wraca prosto do mieszalnika. To jest powód, dla którego warto wykrawać przed suszeniem, a nie po."},
  {k:"scrapPrice", l:"Cena ażuru jako proszku", u:"zł/kg", min:0, max:300, step:5, showIf:"sucha",
   h:"Ażur z suchej płyty nadaje się na granulat albo proszek. Zero oznacza, że traktujesz go jako odpad."},
  {k:"moldMl", l:"Objętość formy", u:"ml", min:2, max:250, step:1, showIf:"formy",
   h:"Objętość jednej foremki. Razem z głębokością napełnienia wyznacza obrys formy, liczbę sztuk na tacy i masę jednej kostki."},
  {k:"moldDepth", l:"Głębokość napełnienia formy", u:"mm", min:4, max:60, step:1, showIf:"formy",
   h:"To ona, a nie objętość, decyduje o czasie sublimacji – front przesuwa się od góry w dół."},
  {k:"moldCover", l:"Pokrycie tacy formami", u:"%", min:40, max:95, step:1, showIf:"formy"},
  {k:"pureeDens", l:"Gęstość przecieru", u:"kg/l", min:.8, max:1.3, step:.01, showIf:"mielone"},
  {k:"frontSpeed", l:"Szybkość frontu sublimacji przy 10 mm", u:"mm/h", min:.3, max:2.0, step:.05, showIf:"mielone",
   h:"Zakres literaturowy 0,3–2,0 mm/h. Czas suszenia w warstwie i w formie wynika wprost z tej wielkości."},
  {k:"sublExp", l:"Wykładnik grubości warstwy", u:"–", min:1.0, max:2.0, step:.05, showIf:"mielone",
   h:"1,0 to front o stałej prędkości, 2,0 to suszenie ograniczone dyfuzją przez wysuszoną warstwę. Rzeczywistość leży pomiędzy – narastający opór wysuszonego placka spowalnia front."},
  {k:"batch", l:"Masa wsadu na cykl", u:"kg", min:50, max:2000, step:25},
  {k:"trayArea", l:"Powierzchnia tac w komorze", u:"m²", min:5, max:400, step:5,
   h:"Cuddon FD600 ma 57 m², FD1000 – 92 m², FD1800 – 170 m². Przy ~10 kg/m² dla owoców i ~2,5 kg/m² dla ziół to ta liczba, a nie masa, wyznacza realny wsad."},
  {k:"_prod", type:"info"},
  {k:"wEnd", l:"Wilgotność końcowa", u:"%", min:1, max:8, step:.5},
  {k:"tCycle", l:"Czas cyklu", u:"h", min:12, max:48, step:1},
  {k:"tFrz", l:"Czas zamrażania", u:"h", min:1, max:10, step:.5},
  {k:"tDes", l:"Czas desorpcji", u:"h", min:1, max:8, step:.5},
  {k:"avail", l:"Dostępność ruchowa", u:"%", min:50, max:95, step:1, h:"Ile godzin w roku komora realnie pracuje."}
 ]},
 {t:"Zamrażanie surowca", open:true, f:[
  {k:"tIn", l:"Temperatura surowca na wejściu", u:"°C", min:-40, max:25, step:1,
   h:"Poniżej −1,5 °C surowiec wchodzi już zamrożony i komora nie płaci za zamrażanie. Kto za nie zapłacił, rozstrzyga wybór poniżej."},
  {k:"frzMode", l:"Sposób zamrażania", type:"select", opts:FRZMODE},
  {k:"tIQF", l:"Temperatura powietrza w tunelu IQF", u:"°C", min:-45, max:-25, step:1, showIf:"iqf"},
  {k:"iqfFan", l:"Wentylatory fluidyzacji", u:"% pracy sprężarek", min:5, max:60, step:1, showIf:"iqf",
   h:"Fluidyzacja złoża wymaga dużego strumienia powietrza – to podstawowa różnica energetyczna wobec szokera."},
  {k:"iqfLoss", l:"Ubytek masy w tunelu (dehydratacja)", u:"%", min:0, max:4, step:.1, showIf:"iqf"},
  {k:"iqfCrystal", l:"Wydłużenie sublimacji od drobnych kryształów", u:"%", min:0, max:35, step:1, showIf:"iqf",
   h:"Szybkie mrożenie daje drobne kryształy lodu, a więc drobne pory i większy opór przepływu pary. Lepszy wygląd, dłuższe suszenie."},
  {k:"tFreeze", l:"Temperatura zamrożenia", u:"°C", min:-45, max:-20, step:1},
 ]},
 {t:"Temperatury procesu", f:[
  {k:"tShelf", l:"Średnia temperatura półek", u:"°C", min:15, max:70, step:1},
  {k:"tIceSurf", l:"Temperatura kondensatora lodu", u:"°C", min:-55, max:-30, step:1,
   h:"Cuddon FD1800GPC pracuje na −40 °C. Farmacja schodzi do −60…−80 °C, co jest bardzo drogie energetycznie."},
  {k:"tAmb", l:"Temperatura otoczenia (średnia roczna)", u:"°C", min:-5, max:30, step:1}
 ]},
 {t:"Próżnia i ciśnienie", open:true, f:[
  {k:"pCham", l:"Ciśnienie robocze w komorze", u:"Pa", min:5, max:250, step:1,
   h:"Niżej nie znaczy lepiej. Poniżej ok. 40 Pa przewodzenie ciepła przez gaz zanika i produkt stygnie, powyżej ok. 150 Pa front robi się za ciepły i grozi zapadaniem struktury."},
  {k:"dTdrive", l:"Nadwyżka temperatury frontu nad równowagą", u:"K", min:1, max:12, step:.5,
   h:"O tyle front musi być cieplejszy od temperatury równowagi, żeby przepchnąć parę przez wysuszoną warstwę i kanał do kondensatora."},
  {k:"kC", l:"Przejmowanie ciepła bez udziału gazu", u:"W/m²K", min:2, max:20, step:.5,
   h:"Styk tacy z półką plus promieniowanie. To jedyne, co zostaje przy bardzo niskim ciśnieniu."},
  {k:"kG", l:"Maksymalny udział gazu w przejmowaniu ciepła", u:"W/m²K", min:2, max:30, step:.5},
  {k:"pHalf", l:"Ciśnienie połówkowe udziału gazu", u:"Pa", min:10, max:120, step:5},
  {k:"collapsePen", l:"Obniżenie temperatury zapadania dla przecieru", u:"K", min:0, max:25, step:1, showIf:"mielone",
   h:"Wartości bazowe dotyczą tkanki, w której ściany komórkowe podtrzymują matrycę. Po rozdrobnieniu zostaje sama faza amorficzna cukrów i granica spada do poziomu Tg\u2032 soku, czyli o kilkanaście kelwinów."},
  {k:"airLeak", l:"Nieszczelność komory", u:"kg powietrza/h", min:.05, max:5, step:.05,
   h:"To powietrze, a nie parę wodną, usuwa pompa próżniowa. Parę wymraża kondensator lodu."}
 ]},
 {t:"Obiegi chłodnicze", f:[
  {k:"tCasc", l:"Poziom kaskadowy CO₂ / R290", u:"°C", min:-20, max:5, step:1},
  {k:"tCondHT", l:"Skraplanie R290 (poziom użytkowy)", u:"°C", min:35, max:70, step:1,
   h:"Podniesienie tego poziomu pozwala R290 obsłużyć więcej odbiorników, ale kosztuje COP. Odbiorniki powyżej tego poziomu przejmuje booster CO₂."},
  {k:"etaCO2", l:"Sprawność egzergetyczna CO₂ (stopień niski)", u:"%", min:35, max:65, step:1},
  {k:"etaR290", l:"Sprawność egzergetyczna R290", u:"%", min:35, max:60, step:1},
  {k:"etaBoost", l:"Sprawność boostera CO₂ transkryt. (Lorenz)", u:"%", min:30, max:60, step:1},
  {k:"etaHFC", l:"Sprawność egzergetyczna agregatu HFC", u:"%", min:30, max:60, step:1,
   h:"Odniesienie dla wariantów tradycyjnych. 0,45 odpowiada dobremu układowi dwustopniowemu R507."},
  {k:"tW2", l:"Temperatura wody z boostera", u:"°C", min:60, max:95, step:1},
  {k:"tW1", l:"Temperatura wody powrotnej", u:"°C", min:5, max:45, step:1},
  {k:"dTe", l:"Różnica na parowniku", u:"K", min:2, max:12, step:1},
  {k:"dTcasc", l:"Różnica w wymienniku kaskadowym", u:"K", min:2, max:12, step:1},
  {k:"dTcAir", l:"Podniesienie skraplania – skraplacz powietrzny", u:"K", min:10, max:35, step:1},
  {k:"dTcDry", l:"Podniesienie – dry cooler / obieg odrzutu", u:"K", min:5, max:25, step:1}
 ]},
 {t:"Straty, sprawności, magazyny", f:[
  {k:"leak", l:"Udział sublimacji pokryty przeciekiem ciepła", u:"%", min:0, max:15, step:1},
  {k:"radLeak", l:"Dodatkowe obciążenie kondensatora (promieniowanie)", u:"%", min:0, max:10, step:.5},
  {k:"boundFrac", l:"Udział wody związanej (desorpcja)", u:"%", min:0, max:20, step:1},
  {k:"iceFrac", l:"Udział wody wymrożonej", u:"%", min:85, max:99, step:1},
  {k:"etaHeat", l:"Sprawność grzania elektrycznego", u:"%", min:85, max:100, step:1},
  {k:"fDefrost", l:"Koszt odszraniania (warianty A/B)", u:"% E_kond", min:0, max:15, step:1},
  {k:"fMatch", l:"Zgodność czasowa ciepła bez magazynu", u:"%", min:50, max:100, step:1},
  {k:"fMatchStore", l:"Zgodność czasowa z magazynem ciepła", u:"%", min:80, max:100, step:1},
  {k:"storeBonus", l:"Zysk sprawności z pracy ustalonej (magazyn chłodu)", u:"p.p.", min:0, max:8, step:.5},
  {k:"etaBoiler", l:"Sprawność kotła gazowego (odniesienie)", u:"%", min:75, max:105, step:1}
 ]},
 {t:"Urządzenia pomocnicze", f:[
  {k:"pVac", l:"Moc zespołu próżniowego", u:"kW", min:1, max:40, step:.5},
  {k:"dutyVac", l:"Obciążenie zespołu próżniowego", u:"%", min:30, max:100, step:5},
  {k:"pAux", l:"Moc urządzeń pomocniczych", u:"kW", min:.5, max:30, step:.5}
 ]},
 {t:"Ceny, taryfa, wskaźniki", f:[
  {k:"elDay", l:"Energia elektryczna – strefa droga", u:"zł/kWh", min:.3, max:2, step:.01},
  {k:"elNight", l:"Energia elektryczna – strefa tania", u:"zł/kWh", min:.2, max:2, step:.01},
  {k:"gasPrice", l:"Gaz ziemny", u:"zł/kWh", min:.1, max:1, step:.01},
  {k:"powerFee", l:"Opłata mocowa", u:"zł/MWh", min:0, max:400, step:5},
  {k:"co2el", l:"Wskaźnik emisji – energia elektryczna", u:"kg/kWh", min:.05, max:.9, step:.01},
  {k:"co2gas", l:"Wskaźnik emisji – gaz", u:"kg/kWh", min:.15, max:.25, step:.002}
 ]},
 {t:"Wartości odżywcze", f:[
  {k:"wEndTrad", l:"Wilgotność suszu tradycyjnego", u:"%", min:8, max:25, step:1,
   h:"Susz konwekcyjny rzadko schodzi poniżej 15–20 % wody. Liofilizat idzie do 2–4 %, więc zagęszcza mocniej – część przewagi na etykiecie bierze się właśnie stąd, nie z retencji."},
  {k:"retFD", l:"Korekta retencji – liofilizacja", u:"% wartości bazowej", min:60, max:120, step:1},
  {k:"retTrad", l:"Korekta retencji – susz konwekcyjny", u:"% wartości bazowej", min:40, max:160, step:1,
   h:"Bazowe współczynniki: witamina C 90 / 35 %, antocyjany 88 / 45, polifenole 92 / 65, beta-karoten 85 / 55, potas i błonnik 100 / 100. Rozrzut w piśmiennictwie jest duży – te suwaki pozwalają go objąć."}
 ]},
 {t:"Surowiec i koszt wytworzenia", open:true, f:[
  {k:"grade", l:"Gatunek surowca", type:"select", opts:GRADES},
  {k:"rawPrice", l:"Cena surowca – gatunek przemysłowy", u:"zł/kg", min:.5, max:40, step:.1,
   h:"Odniesienie. Truskawka przemysłowa w skupie 2026: 4,0–6,3 zł/kg. Wybór gatunku przelicza tę cenę i odpad sortowniczy."},
  {k:"lossMilledRel", l:"Odpad przy mieleniu wzgl. kawałków", u:"%", min:20, max:100, step:5, showIf:"mielone",
   h:"Wady kształtu, kalibru i wybarwienia nie dyskwalifikują surowca, który i tak trafi pod nóż. Odpaść musi tylko to, co zepsute."},
  {k:"labor", l:"Robocizna", u:"zł/kg produktu", min:0, max:120, step:1},
  {k:"pack", l:"Opakowanie", u:"zł/kg produktu", min:0, max:80, step:1},
  {k:"overhead", l:"Kontrola jakości i koszty ogólne", u:"zł/kg produktu", min:0, max:80, step:1},
  {k:"life", l:"Okres amortyzacji", u:"lat", min:5, max:25, step:1},
  {k:"salePrice", l:"Cena sprzedaży", u:"zł/kg produktu", min:20, max:600, step:5,
   h:"Zmiana surowca podstawia cenę odniesienia dla jego kategorii. Truskawka w plastrach 170–260 zł/kg to dana zweryfikowana; pozostałe są szacunkami rynkowymi do potwierdzenia."}
 ]},
 {t:"Fotowoltaika", open:true, f:[
  {k:"pvKwp", l:"Moc instalacji PV", u:"kWp", min:0, max:600, step:5,
   h:"0 wyłącza fotowoltaikę z modelu. Produkcja liczona dla Krakowa, 35° na południe."},
  {k:"pvYield", l:"Uzysk roczny", u:"kWh/kWp", min:800, max:1200, step:5},
  {k:"pvCapex", l:"Nakład jednostkowy PV", u:"zł/kWp", min:1500, max:4500, step:50}
 ]},
 {t:"Taryfa i rynek energii", open:true, f:[
  {k:"tariff", l:"Sposób rozliczenia energii", type:"select", opts:TARIFFS},
  {k:"mktMean", l:"Średnia cena rynkowa (RCEt)", u:"zł/MWh", min:150, max:800, step:5},
  {k:"duckDepth", l:"Głębokość doliny południowej", u:"%", min:0, max:180, step:5,
   h:"0 spłaszcza dobę do ceny średniej, 100 to kształt obserwowany w 2025 r., powyżej – scenariusz dalszego przyrostu PV w systemie."},
  {k:"sprzedMar", l:"Marża sprzedawcy", u:"zł/MWh", min:0, max:150, step:5},
  {k:"distVar", l:"Dystrybucja – składnik zmienny", u:"zł/MWh", min:50, max:400, step:5},
  {k:"sellShare", l:"Rozliczenie eksportu (net-billing)", u:"% RCEt", min:0, max:100, step:5,
   h:"Nadwyżka trafia do depozytu prosumenckiego po cenie rynkowej. Przy cenie ujemnej rozliczenie wynosi zero."}
 ]},
 {t:"Magazyny i elastyczność", open:true, f:[
  {k:"storeColdH", l:"Magazyn chłodu – bufor pracy stopnia niskiego", u:"h", min:0, max:16, step:.5,
   h:"Zasobnik na poziomie kaskadowym. Ile godzin pracy sprężarki potrafi zbuforować."},
  {k:"storeHeatH", l:"Magazyn ciepła – bufor stopnia wysokiego", u:"h", min:0, max:16, step:.5},
  {k:"flexBase", l:"Elastyczność bez magazynów", u:"%", min:0, max:30, step:1,
   h:"Ile zużycia da się przesunąć samym harmonogramem cykli i fazy zamrażania. Dotyczy wariantów A, B i C."}
 ]},
 {t:"Nakłady inwestycyjne", f:[
  {k:"capexA", l:"Wariant A – układ chłodniczy i grzewczy", u:"tys. zł", min:100, max:4000, step:10},
  {k:"capexB", l:"Wariant B", u:"tys. zł", min:100, max:4000, step:10},
  {k:"capexC", l:"Wariant C", u:"tys. zł", min:100, max:4000, step:10},
  {k:"capexD", l:"Wariant D", u:"tys. zł", min:100, max:4000, step:10}
 ]}
];
/* ============================================================
   2b. SILNIK GODZINOWY – PV, CENY, HARMONOGRAM OBCIĄŻENIA
   ============================================================ */
/* produkcja PV w kW dla każdej godziny doby wzorcowej miesiąca m */
function pvDay(m,p){
  if(p.pvKwp<=0) return new Array(24).fill(0);
  const dl=DAYLEN[m], noon=(m>=3&&m<=9)?13.0:12.0, sr=noon-dl/2;
  const raw=[];
  for(let h=0;h<24;h++){
    const t=h+0.5;
    raw.push(t<=sr||t>=sr+dl ? 0 : Math.pow(Math.sin(Math.PI*(t-sr)/dl),1.25));
  }
  const sum=raw.reduce((a,b)=>a+b,0)||1;
  const daily=PV_M[m]*(p.pvYield/983)*p.pvKwp/DAYS[m];
  return raw.map(v=>v/sum*daily);
}
/* cena rynkowa RCEt w zł/MWh */
function mktDay(m,p){
  const sh=SHAPE[SEASON[m]], d=p.duckDepth/100, base=p.mktMean*MONTHF[m];
  return sh.map(v=>base*(1+(v-1)*d));
}
/* cena zakupu i sprzedaży w zł/kWh */
function pricesDay(m,p){
  const mk=mktDay(m,p);
  const peak=h=>h>=7&&h<22;
  let buy,sell;
  if(p.tariff==="dyn"){
    buy=mk.map((v,h)=>(Math.max(0,v)+p.sprzedMar+p.distVar+(peak(h)?p.powerFee:0))/1000);
    sell=mk.map(v=>Math.max(0,v)*(p.sellShare/100)/1000);
  }else if(p.tariff==="zone"){
    const dear=h=>(h>=7&&h<13)||(h>=16&&h<22);
    buy=mk.map((_,h)=>(dear(h)?p.elDay:p.elNight)+(peak(h)?p.powerFee/1000:0));
    sell=mk.map(v=>Math.max(0,v)*(p.sellShare/100)/1000);
  }else{
    buy=mk.map((_,h)=>p.elDay+(peak(h)?p.powerFee/1000:0));
    sell=mk.map(v=>Math.max(0,v)*(p.sellShare/100)/1000);
  }
  return {mk,buy,sell};
}
/* rozłożenie doby: obciążenie sztywne płasko, elastyczne w najtańsze godziny */
function scheduleDay(m,p,ctx){
  const pv=pvDay(m,p), pr=pricesDay(m,p);
  const flex=ctx.eDay*ctx.flexShare, rigid=ctx.eDay-flex;
  const load=new Array(24).fill(rigid/24);
  let left=flex;
  /* krok 1 – godziny z nadwyżką PV, od najniższej wartości eksportu */
  const o1=[...Array(24).keys()].filter(h=>pv[h]>load[h]).sort((a,b)=>pr.sell[a]-pr.sell[b]);
  for(const h of o1){ if(left<=1e-9) break;
    const room=Math.min(pv[h]-load[h],ctx.pMax-load[h]);
    if(room<=0) continue; const add=Math.min(room,left); load[h]+=add; left-=add; }
  /* krok 2 – reszta wg ceny zakupu */
  const o2=[...Array(24).keys()].sort((a,b)=>pr.buy[a]-pr.buy[b]);
  for(const h of o2){ if(left<=1e-9) break;
    const room=Math.max(0,ctx.pMax-load[h]); if(room<=0) continue;
    const add=Math.min(room,left); load[h]+=add; left-=add; }
  if(left>1e-9){ const per=left/24; for(let h=0;h<24;h++) load[h]+=per; }
  const self=[],imp=[],exp=[];
  let S=0,I=0,E=0,C=0;
  for(let h=0;h<24;h++){
    const sf=Math.min(pv[h],load[h]), i=load[h]-sf, e=pv[h]-sf;
    self.push(sf); imp.push(i); exp.push(e);
    S+=sf; I+=i; E+=e; C+=i*pr.buy[h]-e*pr.sell[h];
  }
  return {pv,load,self,imp,exp,buy:pr.buy,sell:pr.sell,mk:pr.mk,S,I,E,C,unplaced:left};
}
/* bilans roczny dla zadanego zużycia i elastyczności */
function yearly(p,eDay,pMax,flexShare){
  const mo=[]; let S=0,I=0,E=0,C=0,PVy=0;
  const ctx={eDay,pMax:Math.max(pMax,eDay/24*1.05),flexShare};
  for(let m=0;m<12;m++){
    const d=scheduleDay(m,p,ctx), n=DAYS[m];
    mo.push({m,d,n,S:d.S*n,I:d.I*n,E:d.E*n,C:d.C*n,PV:(d.S+d.E)*n});
    S+=d.S*n; I+=d.I*n; E+=d.E*n; C+=d.C*n; PVy+=(d.S+d.E)*n;
  }
  const use=eDay*365;
  return {mo,S,I,E,C,PV:PVy,use,autok:PVy>0?S/PVy*100:0,pokrycie:use>0?S/use*100:0,
          avgBuy:use>0?C/use:0};
}
/* ============================================================
   3. MODEL
   ============================================================ */
function model(p,lite){
  const base=PRODUCTS[p.product], gr=GRADES[p.grade]||GRADES.przem;
  const wBase=Math.max(.02,base.w-(gr.dm||0)/100);
  const comps=[{p:base, w:wBase, s:Math.max(0,100-p.mix2pct-p.mix3pct), rp:p.rawPrice}];
  if(p.mix2pct>0) comps.push({p:PRODUCTS[p.mix2], w:PRODUCTS[p.mix2].w, s:p.mix2pct, rp:PRODUCTS[p.mix2].rp||6});
  if(p.mix3pct>0) comps.push({p:PRODUCTS[p.mix3], w:PRODUCTS[p.mix3].w, s:p.mix3pct, rp:PRODUCTS[p.mix3].rp||6});
  const sTot=comps.reduce((a,c)=>a+c.s,0)||100;
  comps.forEach(c=>c.f=c.s/sTot);
  const mixed=comps.length>1;
  const w=Math.max(.02,comps.reduce((a,c)=>a+c.f*c.w,0));
  const dmTot=comps.reduce((a,c)=>a+c.f*(1-c.w),0);
  /* temperatura zapadania ważona suchą masą – matrycę buduje sucha masa, nie woda.
     Kara za rozdrobnienie dotyczy tylko tkanki, bo nośniki suche nie mają struktury komórkowej. */
  const milledNow=p.format!=="kawalki";
  /* kara za rozdrobnienie dotyczy tylko tkanki: składniki suche i płynne koloidy
     nie mają struktury komórkowej, którą można zniszczyć młynkiem */
  comps.forEach(c=>{ c.tc=(c.p.tc||-20)-((milledNow&&!c.p.dry&&!c.p.liq)?p.collapsePen:0); });
  const tcMix=comps.reduce((a,c)=>a+c.f*(1-c.w)*c.tc,0)/Math.max(1e-9,dmTot);
  const rawMix=comps.reduce((a,c)=>a+c.f*c.rp,0);
  const pr={n:base.n, w, t:comps.reduce((a,c)=>a+c.f*c.p.t,0), d:comps.reduce((a,c)=>a+c.f*(c.p.d||10),0),
    tc:tcMix, sp:base.sp, rp:rawMix, fat:comps.reduce((a,c)=>a+c.f*(c.p.fat||0),0),
    pro:comps.reduce((a,c)=>a+c.f*(c.p.pro||0),0),
    nu:(function(){const o={},any=comps.some(c=>c.p.nu);
      if(!any) return null;
      NUTR.forEach(x=>{o[x.k]=comps.reduce((a,c)=>a+c.f*((c.p.nu&&c.p.nu[x.k])||0),0);});
      return o;})()};
  const wEnd=p.wEnd/100, tFp=-1.5;
  const cpF=CPW*w+CPD*(1-w), cpZ=CPI*w+CPD*(1-w);
  const tCondAir=p.tAmb+p.dTcAir, eH=p.etaHFC/100;

  /* --- postać na tacy: gęstość załadunku i czas sublimacji --- */
  const milled=p.format!=="kawalki";
  let dens=pr.d||10, sublGeo=null, pieces=null, mPieceRaw=0, mPieceDry=0, depth=0;
  if(p.format==="warstwa"||p.format==="plyta"){
    depth=p.layerMm; dens=depth*p.pureeDens; sublGeo=(10/p.frontSpeed)*Math.pow(depth/10,p.sublExp);
  }else if(p.format==="formy"){
    depth=p.moldDepth; dens=depth*p.pureeDens*(p.moldCover/100); sublGeo=(10/p.frontSpeed)*Math.pow(depth/10,p.sublExp);
    const footCm2=p.moldMl/(depth/10);
    pieces=Math.max(1,Math.round(10000*(p.moldCover/100)/footCm2*p.trayArea));
    mPieceRaw=p.moldMl*p.pureeDens/1000;
    mPieceDry=mPieceRaw*(1-w)/(1-wEnd);
  }

  /* --- ubytek masy w tunelu fluidyzacyjnym --- */
  const iqf=p.frzMode==="iqf";
  const mTunel=p.batch, mIn=iqf?p.batch*(1-p.iqfLoss/100):p.batch;
  const dm=mIn*(1-w), mProd=dm/(1-wEnd), mWat=mIn-mProd;

  /* --- czas cyklu: fazy stałe + sublimacja --- */
  const tFrzEff=(p.frzMode==="inline"&&p.tIn>tFp)?p.tFrz:0.5;
  let subl=sublGeo!==null?sublGeo:Math.max(1,p.tCycle-(0.5+p.tFrz+0.5+p.tDes+1.0));
  if(iqf) subl*=(1+p.iqfCrystal/100);

  /* --- próżnia: front sublimacji, przejmowanie ciepła, kara za odejście od optimum --- */
  const tCollapse=pr.tc;
  const vac=fluxAt(p.pCham,p.tShelf,p.kC,p.kG,p.pHalf,p.dTdrive);
  let vacOpt=vac;
  for(let pp=6;pp<=250;pp+=2){
    const v=fluxAt(pp,p.tShelf,p.kC,p.kG,p.pHalf,p.dTdrive);
    if(v.q>vacOpt.q) vacOpt=v;
  }
  let pSafe=5;
  for(let pp=5;pp<=250;pp+=1){ if(tIce(pp)+p.dTdrive<=tCollapse) pSafe=pp; else break; }
  const pWork=Math.min(vacOpt.p,pSafe);          /* zalecana nastawa: optimum ograniczone jakością */
  const pressPen=vac.q>1e-6?vacOpt.q/vac.q:4;
  subl*=Math.min(4,pressPen);
  const collapse=vac.tFront>tCollapse;
  const tCyc=0.5+tFrzEff+0.5+subl+p.tDes+1.0;
  /* strumienie: parę wymraża kondensator, powietrze usuwa pompa */
  const mVap=mWat/Math.max(.1,subl);
  const vVap=461.5*(vac.tFront+K0)/Math.max(1,p.pCham);
  const vAir=287*293.15/Math.max(1,p.pCham);
  const pCond=pIce(p.tIceSurf), dPdrive=pIce(vac.tFront)-pCond;

  /* --- zapotrzebowanie na chłód przy zamrażaniu --- */
  const chlod=(t1,t2)=>{
    if(t2>=t1) return 0;
    if(t1>tFp) return (mIn*cpF*(t1-tFp)+mIn*w*LF*(p.iceFrac/100)+mIn*cpZ*(tFp-t2))/3600;
    return mIn*cpZ*(t1-t2)/3600;
  };
  const Qpre=p.tIn>tFp?mIn*cpF*(p.tIn-tFp)/3600:0;
  const Qlat=p.tIn>tFp?mIn*w*LF*(p.iceFrac/100)/3600:0;
  const Qsen=chlod(p.tIn,p.tFreeze)-Qpre-Qlat;
  let Qfreeze=0, Eiqf=0, copIQF=0, QiqfTh=0;
  if(p.frzMode==="inline"){
    Qfreeze=chlod(p.tIn,p.tFreeze);
  }else if(iqf){
    QiqfTh=chlod(p.tIn,p.tIQF);
    copIQF=copC(p.tIQF-p.dTe,tCondAir,eH);
    Eiqf=QiqfTh/copIQF*(1+p.iqfFan/100);
    Qfreeze=chlod(p.tIQF,p.tFreeze);
  }else{
    Qfreeze=chlod(p.tIn,p.tFreeze);
  }
  const mB=mWat*(p.boundFrac/100), mF=mWat-mB;
  const Qsubl=(mF*DHS+mB*DHD)/3600;
  const Qshelf=Qsubl*(1-p.leak/100);
  const Qice  =Qsubl*(1+p.vapSens/100+p.radLeak/100);
  const Qdefr =mWat*(LF+CPI*(0-p.tIceSurf))/3600;

  /* --- poziomy temperatur --- */
  const tEvIce=p.tIceSurf-p.dTe, tEvFrz=p.tFreeze-p.dTe;
  const tDry=p.tAmb+p.dTcDry, tCondB=Math.max(p.tShelf+10, tDry);
  const eCO=p.etaCO2/100, eR=p.etaR290/100, eB=p.etaBoost/100;

  /* --- odbiorniki --- */
  const sh=p.sinksH.filter(s=>s.on), sc=p.sinksC.filter(s=>s.on);
  const hSum=sh.reduce((a,s)=>a+s.q,0), cSum=sc.reduce((a,s)=>a+s.q,0);
  const hHTlist=sh.filter(s=>s.T<=p.tCondHT-p.dTe), hVHTlist=sh.filter(s=>s.T>p.tCondHT-p.dTe);
  const hHT=hHTlist.reduce((a,s)=>a+s.q,0), hVHT=hVHTlist.reduce((a,s)=>a+s.q,0);
  const hBmax=sh.filter(s=>s.T<=tCondB-p.dTe).reduce((a,s)=>a+s.q,0);
  const Evac=p.pVac*tCyc*(p.dutyVac/100), Eaux=p.pAux*tCyc;
  const etaHt=p.etaHeat/100, fM=p.fMatch/100, fMS=p.fMatchStore/100;
  const R={};

  /* ---------- A: tradycyjny ---------- */
  {
    const ci=copC(tEvIce,tCondAir,eH), cf=copC(tEvFrz,tCondAir,eH);
    const Eice=Qice/ci, Efrz=Qfreeze/cf, Esh=Qshelf/etaHt, Edef=(p.fDefrost/100)*Eice;
    R.A={parts:{Eice,Efrz,Esh,Evac,Eaux,Eoth:Edef}, el:Eice+Efrz+Esh+Evac+Eaux+Edef,
      hCov:0, coldCov:0, Qw:0, Qhot:0, cop:{"CO₂ / HFC −45 °C":ci,"Mrożenie":cf},
      levels:[{T:tCondAir,q:Qice+Eice+Qfreeze+Efrz,lab:"odrzut do atmosfery",waste:true}],
      QthShelfEl:Qshelf, arch:"jednopoziomowy odrzut ciepła"};
  }
  /* ---------- B: tradycyjny + odzysk ---------- */
  {
    const ci=copC(tEvIce,tCondB,eH), cf=copC(tEvFrz,tCondB,eH);
    const Eice=Qice/ci, Efrz=Qfreeze/cf;
    const Qrej=(Qice+Eice)*fM;
    const Qsh=Math.min(Qshelf,Qrej);
    const Esh=(Qshelf-Qsh)/etaHt, Edef=(p.fDefrost/100)*Eice;
    const hCov=Math.min(hBmax,Math.max(0,Qrej-Qsh));
    R.B={parts:{Eice,Efrz,Esh,Evac,Eaux,Eoth:Edef}, el:Eice+Efrz+Esh+Evac+Eaux+Edef,
      hCov, coldCov:0, Qw:Math.max(0,(Qice+Eice+Qfreeze+Efrz)-Qsh-hCov), Qhot:Qsh+hCov,
      cop:{"HFC dwustopniowy":ci,"Mrożenie":cf},
      levels:[{T:tCondB,q:Qice+Eice+Qfreeze+Efrz,lab:"skraplanie podniesione"}],
      QthShelfEl:Qshelf-Qsh, arch:"odzysk ciepła skraplania na półki"};
  }
  /* ---------- C / D: kaskada ---------- */
  const casc=(store,booster,shift)=>{
    const b=store?p.storeBonus/100:0, eLo=eCO+b, eHi=eR+b;
    const c1=copC(tEvIce,p.tCasc,eLo);
    const QpreCov=Math.min(Qpre,Qdefr);
    const Qlow=Qice+(Qfreeze-QpreCov);
    const W1=Qlow/c1, Qcasc=Qlow+W1;
    const tEvHi=p.tCasc-p.dTcasc;
    const c2H=copC(tEvHi,p.tCondHT,eHi), c2L=copC(tEvHi,tDry,eHi);
    const f=store?fMS:fM;
    const demHT=(Qshelf+hHT)/f;
    const QinHT=Math.min(demHT*c2H/(c2H+1),Qcasc);
    const QoutHT=QinHT*(c2H+1)/c2H, WHT=QoutHT-QinHT;
    const Qrem=Qcasc-QinHT, WLT=Qrem/c2L, QLT=Qrem+WLT;
    let Qbo=0,Wbo=0,copBo=0;
    if(booster && hVHT>0 && QLT>0){
      const tlmK=(p.tW2-p.tW1)/Math.log((p.tW2+K0)/(p.tW1+K0));
      copBo=eB*tlmK/Math.max(1,(tlmK-(tDry-5+K0)));
      Qbo=Math.min(hVHT, QLT*copBo/Math.max(.1,copBo-1)); Wbo=Qbo/copBo;
    }
    const QdelHT=QoutHT*f, shDel=Math.min(Qshelf,QdelHT);
    const Esh=Math.max(0,Qshelf-shDel)/etaHt;
    const hCov=Math.min(hHT,Math.max(0,QdelHT-shDel))+Qbo;
    const coldCov=Math.min(cSum,Math.max(0,Qdefr-QpreCov));
    const cop={"CO₂ subkryt. −45 °C":c1,"R290 → poziom użytkowy":c2H,"R290 → odrzut":c2L};
    if(copBo>0) cop["CO₂ transkryt. (grzejny)"]=copBo;
    const levels=[{T:p.tCasc,q:Qcasc,lab:"poziom kaskadowy"},{T:p.tCondHT,q:QoutHT,lab:"R290 – półki i odbiorniki"}];
    if(Qbo>0) levels.push({T:p.tW2,q:Qbo,lab:"booster CO₂ – wysoka temperatura"});
    if(Qrem-(Qbo-Wbo)>0) levels.push({T:tDry,q:Math.max(0,QLT-Qbo+Wbo),lab:"odrzut do dry coolera",waste:true});
    return {parts:{Eice:W1,Efrz:WHT,Esh,Evac,Eaux,Eoth:WLT+Wbo}, el:W1+WHT+WLT+Wbo+Esh+Evac+Eaux,
      hCov, coldCov, Qw:Math.max(0,QLT-Qbo+Wbo), Qhot:shDel+hCov, cop, levels, shift,
      QthShelfEl:Qshelf-shDel, W1,WHT,WLT,Wbo,Qbo,QoutHT,Qcasc,QLT,QpreCov,
      arch: booster?"trójstopniowa kaskada CO₂ / R290 / CO₂ transkryt.":"kaskada CO₂ / R290, dwa poziomy odrzutu"};
  };
  R.C=casc(false,false,0); R.D=casc(true,true,p.shiftD/100);

  /* --- domknięcie bilansu systemowego, koszty, emisje --- */
  const cyclesYr=Math.floor(8760*(p.avail/100)/tCyc);
  const chillA=copC(-15,tCondAir,eH), chillD=copC(-15,tDry,eR+p.storeBonus/100);
  for(const k of ["A","B","C","D"]){
    const s=R[k]; s.k=k;
    if(Eiqf>0){ s.parts.Efrz+=Eiqf; s.el+=Eiqf; s.Eiqf=Eiqf; } else s.Eiqf=0;
    s.gas=Math.max(0,hSum-s.hCov)/(p.etaBoiler/100);
    s.elCold=Math.max(0,cSum-s.coldCov)/(k==="A"||k==="B"?chillA:chillD);
    s.elTot=s.el+s.elCold;
    s.perKgW=s.el/mWat; s.perKgP=s.elTot/mProd;
    s.prof=profile(p,s,{Qice,Qfreeze,Qshelf,Evac,Eaux,tCyc,tFrzEff,subl,Eiqf,store:k==="D"});
    s.peak=Math.max(...s.prof.map(x=>x.tot));
    /* elastyczność: magazyny buforują pracę sprężarek (tylko wariant D ma tę architekturę) */
    const Pl=s.parts.Eice/tCyc, Ph=(s.parts.Efrz+s.parts.Eoth-Eiqf)/tCyc;
    const shiftable=k==="D" ? Math.min(s.parts.Eice+s.parts.Efrz+s.parts.Eoth, p.storeColdH*Pl+p.storeHeatH*Ph)
                            : s.elTot*(p.flexBase/100);
    s.flexShare=Math.max(0,Math.min(.92, shiftable/Math.max(1,s.elTot)));
    /* bilans godzinowy w skali roku */
    s.eDay=s.elTot*cyclesYr/365;
    s.yr=yearly(p,s.eDay,s.peak,s.flexShare);
    s.gasYr=s.gas*cyclesYr;
    s.costYr=s.yr.C+s.gasYr*p.gasPrice;
    s.cost=s.costYr/Math.max(1,cyclesYr);
    s.co2=s.elTot*p.co2el+s.gas*p.co2gas;
    s.costKg=s.cost/mProd; s.co2Kg=s.co2/mProd;
    s.capex=p["capex"+k]*1000+(p.pvKwp*p.pvCapex);
    /* --- koszt wytworzenia na kg produktu --- */
    const lossF=(milled?gr.loss*(p.lossMilledRel/100):gr.loss)/100;
    const rawBase=p.rawPrice*(1+(gr.d||0)/100)/Math.max(.05,1-lossF);   /* baza: upust gatunkowy i odpad sortowniczy */
    const rawUnit=comps.reduce((a,c,i)=>a+c.f*(i===0?rawBase:c.rp),0); /* dodatki po cenie katalogowej */
    const tYr=mProd*cyclesYr/1000;
    s.cost5={
      surowiec:rawUnit*(mTunel/mProd),
      energia:s.costKg,
      robocizna:p.labor, opakowanie:p.pack, ogolne:p.overhead,
      amortyzacja:tYr>0?s.capex/(p.life*tYr*1000):0
    };
    s.cogs=Object.values(s.cost5).reduce((a,b)=>a+b,0);
    /* --- wykrawanie kształtów z płyty --- */
    if(p.format==="plyta"){
      const cy=p.cutYield/100;
      if(p.cutStage==="mrozona"){
        s.cutEff=cy+(1-cy)*(p.scrapRecov/100);      /* ażur wraca do przecieru przed suszeniem */
        s.scrapRev=0; s.scrapKg=(1-s.cutEff);
      }else{
        s.cutEff=cy;
        s.scrapRev=(1-cy)*p.scrapPrice;             /* ażur suchy sprzedany jako proszek */
        s.scrapKg=1-cy;
      }
      s.cogsPlyta=s.cogs;
      s.cogs=(s.cogs-s.scrapRev)/Math.max(.05,s.cutEff);
    } else { s.cutEff=1; s.scrapRev=0; s.scrapKg=0; s.cogsPlyta=s.cogs; }
    s.marza=p.salePrice-s.cogs;
    s.rawUnit=rawUnit; s.lossF=lossF; s.tYr=tYr;
    /* wariant referencyjny bez PV oraz w pozostałych taryfach – pomijane w trybie lite */
    if(!lite){
      const noPv={...p,pvKwp:0};
      s.yrNoPv=yearly(noPv,s.eDay,s.peak,s.flexShare);
      s.byTariff={};
      for(const t of ["flat","zone","dyn"]){
        s.byTariff[t]={pv:yearly({...p,tariff:t},s.eDay,s.peak,s.flexShare).C,
                       noPv:yearly({...noPv,tariff:t},s.eDay,s.peak,s.flexShare).C};
      }
    }
  }
  const trayNeed=mIn/dens, trayFit=p.trayArea*dens;
  const fatRaw=pr.fat||0, fatProd=Math.min(95,fatRaw*(mTunel/mProd));
  const proRaw=pr.pro||0, proProd=Math.min(95,proRaw*(mTunel/mProd));
  /* --- wartości odżywcze: świeży / susz konwekcyjny / liofilizat --- */
  let nutro=null;
  if(pr.nu){
    const wT=p.wEndTrad/100;
    const concFD=(1-wEnd)>0?( (1-w)>0? (1-wEnd)/(1-w) :1):1;
    const concTR=(1-w)>0?(1-wT)/(1-w):1;
    nutro=NUTR.map(x=>{
      const base=pr.nu[x.k]||0;
      const rFD=x.ret[0]/100*(p.retFD/100), rTR=x.ret[1]/100*(p.retTrad/100);
      let sw,tr,li;
      if(p.basis==="sucha"){ const d=Math.max(.01,1-w); sw=base/d; tr=base*rTR/d; li=base*rFD/d; }
      else if(p.basis==="porcja"){ sw=base; tr=base*rTR; li=base*rFD; }
      else { sw=base; tr=base*rTR*concTR; li=base*rFD*concFD; }   /* na 100 g produktu */
      return {...x, base, sw, tr, li, rFD:rFD*100, rTR:rTR*100};
    });
    nutro.concFD=concFD; nutro.concTR=concTR;
  }
  return {p,pr,gr,comps,mixed,rawMix,dmTot,fatRaw,fatProd,proRaw,proProd,nutro,mIn,mTunel,mProd,mWat,dm,yieldR:mTunel/mProd,trayNeed,trayFit,dens,milled,depth,
    pieces,mPieceRaw,mPieceDry,tCyc,subl,tFrzEff,Eiqf,copIQF,QiqfTh,iqf,
    vac,vacOpt,pressPen,tCollapse,collapse,mVap,vVap,vAir,pCond,dPdrive,pSafe,pWork,Qpre,Qlat,Qsen,Qfreeze,Qsubl,Qshelf,Qice,Qdefr,
    tEvIce,tEvFrz,tCondAir,tDry,tCondB,hSum,cSum,hHT,hVHT,hHTlist,hVHTlist,sh,sc,cyclesYr,R,Evac,Eaux};
}

/* profil dobowy: 6 faz, moc elektryczna z rozdziałem proporcjonalnym do obciążenia cieplnego */
function profile(p,s,q){
  const dLoad=.5, dPull=.5, dUnload=1.0, frz=q.Qfreeze>0.5;
  const ph=[
    {n:"Załadunek",  d:dLoad,      fIce:0,   fFrz:0, fSh:0,   fV:0  },
    {n:frz?"Mrożenie":"Temperowanie", d:q.tFrzEff, fIce:0, fFrz:1, fSh:0, fV:0 },
    {n:"Próżnia",    d:dPull,      fIce:.02, fFrz:0, fSh:.05, fV:2.0},
    {n:"Sublimacja", d:q.subl,     fIce:.86, fFrz:0, fSh:.83, fV:1.0},
    {n:"Desorpcja",  d:p.tDes,     fIce:.12, fFrz:0, fSh:.12, fV:1.0},
    {n:"Odszranianie i rozładunek", d:dUnload, fIce:0, fFrz:0, fSh:0, fV:.3}
  ];
  if(q.store){ const tot=ph.reduce((a,x)=>a+x.d,0); ph.forEach(x=>x.fFrz=x.d/tot); }
  const iqfKw=(q.Eiqf||0)/q.tCyc;
  const Eref=s.parts.Eice+s.parts.Efrz+s.parts.Eoth-(q.Eiqf||0);
  const thTot=q.Qice+q.Qfreeze || 1;
  const vBase=p.pVac*(p.dutyVac/100);
  let t=0; const out=[];
  for(const x of ph){
    const th=q.Qice*x.fIce+q.Qfreeze*x.fFrz;
    const ref=(Eref*th/thTot)/x.d + iqfKw;
    const shp=(s.QthShelfEl/(p.etaHeat/100))*x.fSh/(x.fSh>0?x.d:1);
    const vac=vBase*x.fV, aux=p.pAux;
    out.push({n:x.n,t0:t,t1:t+x.d,ref,sh:x.fSh>0?shp:0,vac,aux,tot:ref+(x.fSh>0?shp:0)+vac+aux});
    t+=x.d;
  }
  return out;
}
