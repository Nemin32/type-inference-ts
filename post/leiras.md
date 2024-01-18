# Tanuljuk meg együtt a típuskövetkeztetés alapjait!

Kedves olvasó,

Ha valaha is programoztál már egy erősen típusos nyelv modern dialektusában
bizonyára néha a te idegeidre is ráment, amikor a huszadik 
`FeneHosszúOsztály<KülönlegesElem> fho = new FeneHosszúOsztály<KülönlegesElem>()`
sort írtad a kódodban, azt kívánva, bárcsak lenne egy rövidebb módszer erre.

És bizonyára azt is tudod, kedves olvasó, hogy van. Legyen az a C++ `auto` 
kulcsszava, a Java vagy C# `var`-ja, melyek sorra lehetővé teszik, hogy a 
fordító helyettünk okoskodja ki, hogy pontosan milyen típusú értéket is 
szeretnénk eltárolni. De, hogy még merészebb példát is mondjak,ott a Rust `let`
kulcsszava is, mely az esetek jelentős részében teljesen boldogan elvan azzal
az információval, amit ő maga talál ki, nekünk pedig csak olyankor kell
kisegítenünk, ha valami nagyon nem egyértelmű számára (például, ha szeretnénk
a `collect()` függvénnyel valamilyen gyűjteménybe szedni egy iterátor elemeit,
meg kell adnunk a gyűjtemény típusát, hisz a Rust önmagától nem tudja a 
szándékunk kitalálni).

Mindez nemhogy egy gyakorlott, de talán még egy kezdő programozót sem lep meg.
Bár láttam heves vitákat arról, hogy mennyire is biztonságos ezeket a 
kulcsszavakat alkalmazni, hisz a későbbiekben bezavarhat például refaktorálás
során, az kétségtelen, hogy kifejezetten kellemes kis kényelmi funkciók.

Viszont, ami talán sokkal kevésbé nyilvánvaló, hogy hogy a csudába is csinálja
ezt a fordítóprogram? Hát nem azért vagyunk mi, hogy megmondjuk az egyes elemek
milyen típusokkal rendelkeznek? Mint kiderült egész ágazatai vannak a
programozásnak, ahol a válasz az, hogy "Nem! Majd mi megoldjuk." Ezek alatt 
általában funkcionális nyelveket értünk, azon belül is a Meta Language 
(ismertebb nevén **ML**) nyelvcsalád, ami talán a leghíresebb arról a 
képességéről, hogy nagyon kevés kivétellel a fordító képes minden függvény és 
elem értékét önmagától meghatározni.

Persze nem ők az egyetlenek, ott a szintén funkcionális Haskell, a TypeScript,
ami annak ellenére, hogy a JavaScript botrányosan gyenge típusrendszerrel
rendelkezik meglepően derék módon találja ki mit szeretnénk magától és még
más egyéb nyelvek tömkelege. De persze ezzel a kérdést nem válaszoltam meg,
maximum egy fokkal odább rúgtam.

Úgyhogy itt az ideje, hogy felfedjük a fátylat...

## Előszó

...legalábbis valamennyire. Bevallom a téma amiről itt beszélni fogok nagyon is 
akadémikus. Ha az ember felmerészkedik a cikk témájához kapcsolódó egyik 
leghíresebb algoritmus Wikipédia oldalára, akkor azon túl, hogy olyan 
hieroglifákat lát, amiknek értelmezéséhez ~~ember legyen a talpán~~ elég szilárd 
alap kell típus-elméletből, még csomó programozásban megőszült tudós neve is 
felmerül.

Épp emiatt először is le szeretném szögezni, hogy ez a cikk okkal lett úgy
címezve, hogy "tanuljuk meg együtt" és nem úgy, hogy "most megtanítom". Bsc
szakdolgozatom keretében egy programozási nyelvet írtam, így a téma hamar
érdekelni kezdett és mondjuk azt, hogy egy-másfél éve foglalkoztat már,
viszont ez közel nem jelenti azt, hogy a témát mélyen érteném vagy újító 
gondolatot tudnék fűzni hozzá.

Sőt, a következőkben látható írás nagyrésze egy a Cornell University-n tanító
professzor, Michael R. Clarkson és társainak munkájára alapul, akik egy [online
könyvben](https://cs3110.github.io/textbook/cover.html) tették elérhetővé az
egyetemen tanított OCaml kurzusuk. Ezen kurzus egyik fejezete éppen az
interpreterek megalkotásáról szól és ezen belül egy szekció pedig magáról
a típuskövetkeztetésről. A cikkem alapját ez a szekció szolgálja, azonban 
értelemszerűen magyarul meg- és átfogalmazva és OCaml / Pszeudokód helyett 
TypeScript-ben írt kóddal prezentálva.

Nem akarom túldramatizálni a dolgot, de a könyv számomra abszolút 
szemléletformáló volt a típusellenőrzés és -következtetés témaköreivel 
kapcsolatban. Mr Clarkson homályos elméleti módszerek és szabályok helyett 
tiszta, könnyen követhető példákkal demonstrálja a nyelvek interpretációjának
minden szakaszát, így nagyon bátran ajánlom bárkinek, akit érdekel a téma.
Azt nem ígérem, hogy rögtön utána képes leszel önálló nyelvet alkotni, de azt
garantálhatom, hogy sokkal kevésbé lesz innentől "fekete doboz" a 
fordítóprogram, aminek az egyik végén bemegy a szöveg és a másik végén kijön
*valami,* amit le tudunk futtatni.

És most, hogy remélhetőleg kellőképp levettem magam a kisfelhőről, vágjunk is 
bele.

## Szintaxisfák — Kód, ahogy azt a fordító látja

Sajnos mielőtt belekezdhetnénk a fő témánkba, muszáj egy apró kitérőt tennünk az
úgynevezett szintaxisfák gyors bevezetésére. Aki ezekkel tisztában van, 
nyugodtan ugorhat is tovább, azonban a többieket marasztalnám, hisz a fogalom
ismerete nélkül erősen homályos lehet a cikk többi része.

Remélhetőleg, azzal senkinek se mondunk újat, hogy a számítógép (de az annál
sokkal magasabb szinten működődő interpreterek se) nem nyers szövegek alapján
működik. Értelemszerűen, ahhoz hogy eljussunk a felhasználói bemenettől a gépi
kódig, különféle átalakításokat kell végeznük, ennek a témához legfontosabbb
állomása pedig az úgynevezett *absztrakt szintaxisfa* ("abstract syntax tree",
röviden **AST**).

Ez egy fa struktúra, mely az általunk használt nyelv elemeiből épül fel. Célja,
hogy a struktúrálatlan nyers szövegből egy hierarchikus, a számítógép által
könnyen feldolgozható adatstruktúra legyen. Ehhez elvetünk minden olyan elemet,
ami az értelmezéshez nem szükséges (például ilyen az nyelvi elemek közötti 
üres hely, a fordító számára lényegtelen, hogy "3 + 5"-öt lát vagy 
"3 +  5"-öt).

Gyakorlati példaképp tegyük fel, hogy egy képzeletbeli C-szerű nyelvben a 
következő kódot írtuk:


```
if (pred(true)) {
  print("OK")
} else {
  print(5 * 2)
}

```

Ha ezt a kódot lefuttatnánk egy szintén képzeletbeli fordítóprogramon, az valami
ehhez hasonló AST-t generálna:

```
If
|
|-FunctionCall 
| |
| |-Identifier("pred") 
| |
| |-[Boolean(true)]
|
|-FunctionCall 
| |
| |-Identifier("print") 
| |
| |-[String("OK")]
|
|-FunctionCall 
  |
  |-Identifier("print") 
  |
  |-[Arithmetic
     |
     |-Identifier("*")
     |
     |-Atom(5)
     |
     |-Atom(2)]
```

Ahogy az látható a fából, egyszerűen a szülő-gyerek kapcsolatból leolvasva meg
tudjuk mondani az egyes elemek hogyan is követik egymást, mit kell kiértékelnünk
azelőtt, hogy az adott elem értékét meghatározhassuk.

Ezen kívül egyértelművé válik még az is, hogy az egyes változók *tartományai* 
(vagyis, hogy hol érhetőek el a program futása során) hol találhatóak. Ehhez
elegendő csupán lekövetni a fát és megkeresni azokat az ágakat, ahol 
hozzárendelést végzünk. Ez után az összes gyermek-ágban elérhetőnek tekinthetjük
ezt a változót, egészen addig, amíg másik ágat nem kezdünk vizsgálni.

Az AST előnye még, hogy a gépi kódra való fordításon túl, a fordító összes 
fázisa képes dolgozni vele. Például, ha optimalizálni szeretnénk a programunk, 
akkor csak kicserélünk elemeket a fában azok optimálisabb változatára. 

Jelen példánkban a következő elem,

```
  |-[Arithmetic
     |
     |-Identifier("*")
     |
     |-Atom(5)
     |
     |-Atom(2)]
```

egy az egyben cserélhető lenne az

```
[Number(10)]
```

elemmel. De ugyanilyen optimalizáció lehet, ha egy elágazásban be tudjuk 
bizonyítani, hogy az eldöntés mindig igaz / hamis, így maga az elágazás 
eltávolítható a programból, annak helyére csupán a megfelelő ágat illesztve
vissza:

```
If
|
|-Boolean(true)
|
|-<Igaz ág>
|
|-<Hamis ág>

=>

<Igaz ág>

```

A fordításon és optimalizáláson túl lehetőségünk van a programunk típusok
szempontjából való helyességét is ellenőrizni. Folytassuk most ezzel.

## Típusellenőrzés

Mielőtt magával a típuskövetkeztetéssel kezdenénk foglalkozni, nézzük meg előtte
a kissé kevésbé rejtelmes testvérét, a típusellenőrzést (*type checking*). Ha meg kéne 
fogalmaznunk mit is tesz, valahogy így írhatnánk le: 

> "Adott programkód és az ebben található változók és függvényekhez adott 
> típusok esetén eldönti, hogy ezek a típusok konzisztensek-e a kód által leírt 
> folyamattal."

Egyszerűbben fogalmazva, igyekszünk megbizonyosodni afelől, hogy egy számnak
deklarált változót ugyan ne adhassunk már egy szöveghez.

A folyamat egyszerűsége és egyben nehézsége, hogy minden típust előre meg kell
adnunk. Ez persze kedvező számunkra olyan szempontból, hogy az ellenőrző kódja 
lényegesebben egyszerűbb, hisz nem kell saját magától kitalálni egy-egy érték 
ugyan mi is lehet (maximum elemei értékeknél, például számok, szövegek, vagy 
logikai értékek, de ezek eldöntése triviális). Ugyanezen ok miatt, azonban ha 
az algoritmus valaha olyan értékbe fut, aminek nincs megadott típusa akkor az 
egész folyamat megakad és nem tudunk mit mondani a programunk helyességéről.

Mivel a cikk fő témája nem ez, így csak egy rövid informális példát adok
az algoritmusra. A témában érdekeltek számára ajánlom a fentebb taglalt könyv
[idevágó 
fejezetét](https://cs3110.github.io/textbook/chapters/interp/typecheck.html).

1. Adott számunkra két bemeneti paraméter, `ast` (lásd fentebb) mely tartalmazza 
   a jelenlegi elemét a kódnak, amit ellenőrizni szeretnénk és a második, 
   `env`, ami pedig egy úgynevezett *környezet.* Ennek feladata az olyan értékek 
   típusának eltárolása, amire a program futása során később is szükségünk 
   lehet (pl.  változók vagy függvények).
2. Megnézzük milyen elemmel is van dolgunk. Ha elemi (tehát például egy szám 
   vagy szöveg), akkor az érték típusa önmagában eldönthető. Minden más 
   ceremónia nélkül ezzel visszatérünk.
3. Ha viszont nem elemi, akkor nyelvi elemmel van dolgunk, melynek minden
   variációjára külön eljárást kell alkalmaznunk.
    - Ha változót találtunk például, akkor meg kell néznünk, hogy találunk-e
      hozzá tartozó értéket az `env`-ben. Ha igen, akkor visszatérünk ezzel a 
      típussal. Ha pedig nem, akkor kivétel (vagy egyéb hasonló hiba) formájában 
      jelezzük a felhasználó felé, hogy a program nem létező változót kíván 
      használni.
    - Ellenben, ha például változóhoz értéket szeretnénk rendelni, akkor 
      megnézzük először, hogy a hozzárendelt érték megfelel-e a 
      típusellenőrzésnek és, ha igen, akkor eltároljuk mind a változó nevét, 
      mind az értékének típusát az `env` változóban.
    - Elágazás esetén megnézzük, hogy a predikátum (a rész, ami `if (<itt>)` 
      található) logikai érték-e. Hisz, bár a C(++) megengedi, azért mégis egy 
      eldöntés ne szám vagy szöveg alapon történjen. Ha ez passzol, akkor pedig
      rekurzívan meghívjuk az ellenőrzést az elágazás összes ágára is. Ekkor 
      nyelvtől függően lehetőségünk van megengedni vagy nem engedni meg, hogy a 
      különféle ágak más-más típusokkal térhessenek vissza.
    - For-ciklus esetén annyival izgalmasabb a helyzet, hogy mielőtt 
      ellenőriznénk a ciklus törzsét, előtte az `env` változóba be kell 
      helyeznünk a ciklusváltozó értékét is. Tehát például:
      ```
      for (int i = 0; i < 5; i++) { 
        /* Itt az i egy int típusú érték. */
      }
      ```
    - Függvénydefiníció esetén eltároljuk annak visszatérési értékét, az egyes
      argumentumok típusait, majd ellenőrizzük, hogy a függvény törzse
      lefuttatás esetén valóban azzal a típussal rendelkezne-e, amire számítunk.
      Ezt gond nélkül megtehetjük, hisz hiába nem ismerjük az argumentumok 
      konkrét értékét, mégis tudjuk azok típusait, hisz ezek előre meg lettek
      adva. Ha minden passzol, akkor eltároljuk az `env` változóba a függvény
      nevét és a fentebb említett információkat.
    - Függvényhívásnál pedig egyszerűen lekérjük az `env`-ből a függvényt,
      megnézzük, hogy az átadott argumentumok megfelelnek az elvártaknak,
      majd, ha minden megfelel, a típusellenőrzés eredményeképp visszaadjuk
      a definíciónál elmentett visszatérési érték típusát.
    - Műveletek esetén rekurzívan ellenőrizzük, hogy a művelet bal és a jobb
      oldalán álló elemek megfelelő típusúak, majd végül visszaadjuk a művelet
      kimeneti típusát.
    - Természetesen létezhetnek egyéb nyelvi konstrukciók, melyek szintén saját 
      egzotikus szabályokkal rendelkeznek. Ezeket itt most nem tárgyalnám, de
      remélhetőleg a fentebb leírtak legalább egy kis betekintést nyújtanak a 
      C-szerű nyelvek szabályrendszerébe.
5. Ha a folyamat a programkód összes elemén végigfutott és sehol se ütköztünk
   ellentmondásba, akkor kimondhatjuk, hogy a kódunk értékei konzisztensek a 
   megadott típusokkal, így legalábbis elméleti síkon értelmes eredményt kell,
   hogy kapjunk.

Ha egy egyszerű (persze relatívan szólva) statikusan típusos nyelvet írunk, 
akkor ennyivel akár meg is elégedhetnénk. Legyen a felhasználó gondja-baja, 
hogy a típusokat szolgáltatja, mi kegyesen ellenőrizzük ezt neki, de helyette 
nem kívánunk dolgozni.

Ugyanakkor nem állt meg itt a tudomány, így végre elérkezhetünk a cikk fő
témájához, ami nem más mint a...

## Típuskövetkeztetés

Míg a típusellenőrzés azt a kérdést válaszolja meg, hogy "az ilyen típusokkal
ellátott kód helyes-e?", a típuskövetkeztetés (*type inference*) feladata, 
hogy megmondja adott kód esetén, hogy létezik-e egyáltalán helyes típusozás 
hozzá és, ha igen, mi is pontosan az.

Remélem azért érződik, hogy itt egy lépéssel elrugaszkodottabb dologról van szó.
Itt ugyanis már nem meglévő információt akarunk a géppel ellenőriztetni, hanem
bizonyos szabályrendszerek alapján úgy információt akarunk generáltatni.

Akinek ezektől a szavaktól az AI villan az agyába, nyugodtan hesegesse is.
Szerencsére az itt tárgyalt algoritmus nem csak, hogy nem igényel semmiféle
neurális mókolást, elég egyszerű ahhoz, hogy némi magyarázattal egy aránylag
kevés valódi tapasztalattal rendelkező programozó is lekódolja. Én már csak 
tudom, hisz én magam is az vagyok.

Ezen bűvös algoritmus a formális és informális nyelvekben is általában a **HM**
betűszóval van illetve, mely az algoritmus két egymástól független 
feltalálójának Roger **H**indleynek és Robin **M**ilnernek a nevéből ered.
Az algoritmust az tette híressé és teszi ma is rengeteg nyelv fordítójának és 
értelmezőjének részévé, hogy aránylag egyszerű szabályok segítségével közel
bármely programról képes megmondani, hogy annak elemei konzisztensen típusosak-e
és, ha igen, mik ezek a típusok.

"Szuper," mondod te, kedves olvasó, "de, ha ez ennyire csúcs eszköz, miért nincs
mindenütt használva?"

A kérdés jogos, a válasz pedig kissé lelombozó. A programozói világ nagyjai
hiába találták ki ezt az őszintén tényleg elképesztő algoritmust, sajnos azt is
bebizonyították, hogy vannak nyelvek, amelyekben a típusok szimplán 
kikövetkeztethetlenek. Hogy ezek pontosan milyen nyelvek, azt itt most nem
részletezném (ez a cikk az algoritmus terjesztésére íródott, nem szidalmazására
:)), legyen annyi elég, hogy például olyan függvények, mint a C `printf`-je, ami 
tetszőleges számú és tetszőleges típusú argumentumot fogad nem következtethő ki
algoritmikus úton. Azonban akit még ennél is jobban érdekel a kérdés, ajánlom 
nézze meg ezt a StackOverflow-os [választ], melyben a kommentelő részletesen 
kivesézi miért is nincs ingyen ebéd.

Ezt tisztázván viszont vágjunk is bele a dolgokba. 

### Elmélet

Utolsó gyors kitérő mielőtt magával az algoritmussal foglalkoznánk. A cikkben
az OCaml szakirodalom tradícióit követve a következő módon jelöljük a típusokat:

`szám` / `logikai` / `szöveg` — Egyszerű, konkrét típusok. Megfeleltethetőek
az `int`, `bool`, `string`, stb. típusoknak a megszokott programozási 
nyelvekből.

`'a` / `'b` / `'kiscica` — Az aposztrof és a kisbetűk árulkodnak erről a 
fajtáról. Ezek az úgynevezett "szabad" típusváltozók. Nem tudjuk pontosan még 
pontosan milyen konkrét típus fog a helyükre kerülni, de azt igen, hogy valami 
állni fog itt.

`t1 => t2` (olvasd "nyíl `t1`-ből `t2`-be") — Akik még nem igazán foglalkoztak 
funkcionális programozzással most valószínűleg kicsit pislogni fognak. 
Amikor én először megláttam ezt a jelölést, szintén kissé hüledeztem, 
hogy "most mi, miért így néz ki?", de valójában egyáltalán nem bonyolult 
rendszer. Működésében hasonlít a matematikában megszokott 
`értelmezési tartomány => értékkészlet` kapcsolathoz, azonban a 
legegyszerűbb úgy felfogni, hogy "ha egy `t1`-et kapok, egy `t2`-t fogok 
visszaadni."

Például, ha van egy ilyen függvényünk, hogy
```
int duplaz(int x) {
  return x * 2
}
```

akkor a típusunk `int => int`, hisz egy szám bemenetet vár, melyre egy másik 
számot ad kimenetként. Ahogy látható az argumentum vagy a függvény neve a
típus szempontjából irreleváns, így nem jelenik meg.

Ez eddig remélhetőleg triviális. De mi történik akkor, ha egy függvény több
argumentumot is vár? Ilyenkor az egyszerűség kedvéért (még ha nem is tűnik
egyszerűbbnek elsőre), úgy értelmezzük, hogy egy `n`-argumentumú függvény
valójában `n` darab 1-argumentumú függvényből épül fel és az egyes 
argumentumok átadásával mindig egy másik függvényt kapunk, egészen addig,
amíg egy végső értéket nem kapunk.

Példa,

```
V tobb_arg(A a, B b, C c) {
  return // valami művelet, ami egy V típusú értékhez vezet.
}
```

Ekkor a függvényünk típusa (vagy szignatúrája) `A => B => C => V`. Ezt úgy
értelmezzük, mintha a következő zárójelek lennének ott: `A => (B => (C => V))`

Tehát, egy `A` típusú értéket váró függvény, mely visszaad egy `B` típusú 
értéket váró függvényt, mely visszaad egy `C` típusú értéket váró függvényt,
mely végül visszaad egy `V` értéket.

Velem vagy még? Remélem. Bár elsőre fölösleges komplikálásnak tűnhet, ez
a fajta reprezentáció nagyban megkönnyíti a függvények típusairól való 
érvelést, ahogy az majd hamarosan láthatóvá is fog válni.

---

Az algoritmus első lépése, hogy egy adott AST-ről különféle megkötéseket 
gyűjtünk. Ez önmagában elég homályos lehet, de egy egyszerű példával világossá
fog válni. Tegyük fel van egy ilyen egyenletünk: `a = x + 5`, ebből két 
megkötést is le tudunk vonni. Mivel tudjuk, hogy az összeadás számokon operál
így az garantált, hogy `x = szám`. És mivel azt is tudjuk, hogy egy összeadás
végeredménye szintén szám, így azt is tudjuk, hogy `a = szám`.

Természetesen a különböző nyelvi elemek különböző megkötéseket is vonnak maguk
után. Például, ha adott

```
if (pred) {
  <igaz ág>
} else {
  <hamis ág>
}
```

akkor a következő megkötéseket vonhatjuk le:

* `pred = logikai`
* `az egész if = 't`
* `HM(<igaz ág>) = 't`
* `HM(<hamis ág>) = 't`

Fontos megjegyezni, hogy a típusellenőrzésnél emlegetett `env` környezettel 
ellentétben a megkötések fölfelé terjednek. Ez azt jelenti, hogy ha például
három elágazást egymásba ágyazunk, akkor a legkülsöbb elágazás megkötései
tartalmazni fogják a belső elágazások megkötéseit is.

Ennek következménye, hogy mire feldolgoztunk mindent és elértünk ismét a 
gyökérelemhez egy az egész programra konzisztens megkötés-halmazzal fogunk
rendelkezni.

---

Ezt követi a második (és egyben harmadik) lépés, melyek az *egyesítés* és 
*helyettesítés* lépései. Ezek során a kapott típusmegkötéseket feloldjuk és új,
specifikusabb megkötéseket kapunk.

Például tegyük fel, hogy a következő függvényt vizsgáljuk:

```
fun f ->
  fun x ->
    f(x + 1)
  end
end
```

Ahogy látható, ez az új nyelv lényegesebben más a C-től megszokottaktól. Csak, 
hogy mindnyájan ugyanott tartsunk, kiolvasva ez a következő:

> Adott egy függvény `f` argumentummal, mely visszaad egy másik függvényt `x`
> argumentummal. Ezen belső függvény értéke pedig az `f` meghívva `x+1`-re.

C-szerű nyelvben ez a következő lenne:

```
? külső(? f) {
  ? belső(? x) {
    return f(x + 1)
  }
}

```

Értelemszerűen a dolog pikantériája, hogy a `?`-el jelölt típusokat nem mi 
szeretnénk kézzel megadni (még akkor is, ha jelen példában nem lenne 
kifejezetten bonyolult), hanem elvárjuk, hogy majd a gép szépen kisakkozza 
nekünk.

Az algoritmus első lépésének lefutása után a következő megkötéseket kapjuk:

* `'a = 'd => 'e`
* `'c = int => 'd `
* `int => int => int = 'b => 'c`

Ezen felül tudjuk, hogy a függvény végső visszatérési értékének típusa 
`'a => 'b => 'e`.

Ezzel önmagában nem tudunk még sokat kezdeni. Az egyetlen információ, amivel
szolgál, hogy az így kapott végső függvény két értéket vár (melyek típusa `'a` 
és `'b`), majd egy `'e`-vel tér vissza. Ez több a semminél, de további 
következtetéseket is le lehet vonni.

Ehhez három szabályt alkalmazunk:

1. `X = X`, ahol `X` bármilyen típus (legyen nyil, szabad vagy konkrét változó),
   szimplán kiiktatásra kerül a halmazból, hisz nem szolgál új információval.

2. `'a = X` (vagy `X = 'a`) esetén, ahol `'a` tetszőleges szabad változó,
   a megkötés kiiktatásra kerül a halmazból és a halmaz összes többi elemében
   `'a`-t átírjuk `X`-re. Ez a *behelyettesítés*. **Ezen felül eltároljuk azt**
   **a tényt, hogy `'a = X` a függvény visszatérési értékei között.**

3. `A => B = C => D` megkötés esetén, ahol `A`, `B`, `C` és `D` mind tetszőleges
   típus melyek nyilakkal vannak összekötve, az egyenlet kiiktatható és helyette
   két új egyenletet veszünk fel a halmazba a következő alakkal:

     - `A = C`
     - `B = D`

   Ezzel azt értük el, hogy a nyilakat kisebb részekre bontottuk, miközben 
   megőrizzük az eredeti struktúra megkötéseit.
  
Ahogy látható a három lépésből egyedül a második esetén jutunk új megkötésekhez,
mind az 1.-es, mind a 3.-as szabály csupán kisebb elemekre bontja a meglévő 
megkötéseink vagy egy az egyben kiiktatja őket.

---

Visszatérve a példánkhoz, haladjunk sorrendben végig a megkötéseinken (melyeket
most ismét bemásolok az egyszerűség kedvéért):

* `'a = 'd => 'e`
* `'c = int => 'd `
* `int => int => int = 'b => 'c`

Az első `'a = X` alakban van, mely a 2. szabálynak felel meg. Tehát kiiktatjuk
az egyenletet a halmazból, átírjuk a többi egyenletben található `'a`-t 
`'d => 'e`-re, majd elmentjük a végeredmény halmazba az eredeti megkötést.

Mivel az `'a` semelyik másik megkötésben nem jelenik meg, így sok minden nem 
változik. Megkötéseink a következők:

* `'c = int => 'd `
* `int => int => int = 'b => 'c`

Végeredmény halmazunk pedig:

* `d => 'e / 'a`

Itt a perjel csupán annyit jelent, hogy ez már nem feldolgozandó megkötés,
hanem egy elvégzett behelyettesítés. De lelki szemeid előtt nyugodtan 
értelmezheted egyenlőségjelnek is.

Haladjunk tovább. Vegyük észre, hogy a második megkötésben található `'c` két 
megjelenik a harmadik megkötésben is. Alkalmazzuk ismét a 2. szabályt rajta: 
Kiiktatjuk a második egyenletet és a harmadikban ahol `'c`-t találunk 
azt átírjuk `int => 'd`-re:

* `int => int => int = 'b => int => 'd`

Végül elmentjük a behelyettesítést a végeredmény halmazunkba:

* `d => 'e / 'a`
* `int => 'd / 'c`

Most pedig a 3. szabályt kell alkalmaznunk. Emlékezzünk, hogy `t1 => t2 => t3`
értelmezhető `t1 => (t2 => t3)`-ként. Így értelmezve a harmadik egyenletet,
bontsuk ketté!

* `int = 'b`
* `int => int = int => 'd`

(A végeredmény halmaz változatlan.)

Az így kapott új első egyenlet a 2. szabály triviális alkalmazása:

* `int => int = int => 'd`

Végeredmény halmaz:

* `d => 'e / 'a`
* `int => 'd / 'c`
* `int / 'b`

Ismét egy nyillal van dolgunk. Bontsunk megint.

* `int = int`
* `int = 'd`

(A végeredmény halmaz változatlan.)

Az első egyenletben végre találkozunk az 1.-es szabállyal. Tehát, menjen az első
egyenlet a fenébe.

* `int = 'd`

Ez pedig ismét triviális 2. szabály.

Ekkor a megkötés halmazunk üres, a végeredmény pedig a következő:

* `d => 'e / 'a`
* `int => 'd / 'c`
* `int / 'b`
* `int / 'd`

Ekkor előszedjük ismét a kimeneti típusunk, mely jelen esetben `'a => 'b => 'e`.
Itt már nem kell semmiféle eldöntést végeznünk, helyettesítsük csak be sorban
a végeredmény halmaz elemeit a kimeneti típusra:

* `d => 'e / 'a` => `'d => 'e => 'b => 'e`
* `int => 'd / 'c` => `'d => 'e => 'b => 'e`
* `int / 'b` => `'d => 'e => int => 'e`
* `int / 'd` => `int => 'e => int => 'e`

Így tehát a végleges kimeneti típusunk: `int => 'e => int => 'e`

Értelmezzük, mit is jelent ez.

```
fun f ->
  fun x ->
    f(x + 1)
  end
end
```


[választ]: https://stackoverflow.com/questions/10462479/what-is-a-fully-type-inferred-language-and-limitations-of-such-language/10470321#10470321