# Tanuljuk meg együtt a típuskövetkeztetés alapjait!

A következő cikk a Hindley-Milner típuskövetkeztetés (*type inference*) 
algoritmus alapjait mutatja be átlagos programozói tudást feltételezve, 
magyarul. Bevezetésre kerül az algoritmus *miértje* és *hogyanja,* az utóbbi egy 
elméleti, "papíron, kézzel" és egy gyakorlati (vagyis kód) formában is 
bemutatásra kerül. A cikk célja, hogy az olvasó a cikk végére több-kevésbé 
értse, hogy hogyan is működnek az implicit típusosságú nyelvek és szükség esetén
saját maga is tudja merre induljon el, ha ilyesmit kellene lefejlesztenie.

Ugyanakkor a cikk nem foglalkozik az algoritmus történelmével, se nem 
matematikai hátterével, mivel ezekhez az író nem ért eléggé és már így is bőven
hosszúra sikerült ez az iromány.

## Előszó

Kedves olvasó,

Ha valaha is programoztál már egy erősen típusos nyelv modern dialektusában
bizonyára néha a te idegeidre is ráment, amikor a huszadik 
`FeneHosszúOsztály<KülönlegesElem> fho = new FeneHosszúOsztály<KülönlegesElem>()`
sort írtad a kódodban, azt kívánva, bárcsak lenne egy rövidebb módszer erre.

És bizonyára azt is tudod, kedves olvasó, hogy van rövidebb módszer. Legyen az 
a C++ `auto` kulcsszava, a Java vagy C# `var`-ja, melyek sorra lehetővé teszik,
hogy a fordító helyettünk okoskodja ki, hogy pontosan milyen típusú értéket is 
szeretnénk eltárolni. De, hogy még merészebb példát is mondjak, ott a Rust `let`
kulcsszava is, mely az esetek jelentős részében teljesen boldogan elvan azzal
az információval, amit ő maga talál ki, nekünk pedig csak olyankor kell
kisegítenünk, ha valami nagyon nem egyértelmű számára (például, ha szeretnénk
a `collect()` függvénnyel valamilyen gyűjteménybe szedni egy iterátor elemeit,
meg kell adnunk a gyűjtemény típusát, hisz a Rust önmagától nem tudja a 
szándékunk kitalálni).

Ezen kulcsszavak már évek óta a nyelvek részei, így jelenlétük nemhogy egy 
gyakorlott, de talán még egy kezdő programozót sem lep meg.  Bár láttam heves 
vitákat arról, hogy mennyire is biztonságos ezeket a kulcsszavakat alkalmazni, 
hisz a későbbiekben bezavarhat például refaktorálás során, az kétségtelen, 
hogy kifejezetten kellemes kis kényelmi funkciók.

Viszont, ami talán sokkal kevésbé nyilvánvaló, az az hogy hogy a csudába is 
csinálja ezt a fordítóprogram? Hát nem azért vagyunk mi, hogy megmondjuk az 
egyes elemek milyen típusokkal rendelkeznek? Mint kiderült egész ágazatai 
vannak a programozásnak, ahol a válasz az, hogy "Nem! Majd mi megoldjuk." 
Ezek alatt általában funkcionális nyelveket értünk, azon belül is a Meta 
Language (ismertebb nevén **ML**) nyelvcsalád, ami talán a leghíresebb arról a 
képességéről, hogy nagyon kevés kivétellel a fordító képes minden függvény és 
elem értékét önmagától meghatározni, nulla programozói segítséggel.

Persze nem ők az egyetlenek, ott a szintén funkcionális Haskell, a TypeScript,
ami annak ellenére, hogy a JavaScript botrányosan gyenge típusrendszerrel
rendelkezik meglepően derék módon találja ki mit szeretnénk magától és még
más egyéb nyelvek tömkelege. De persze ezzel a kérdést nem válaszoltam meg,
maximum egy fokkal odább rúgtam.

Úgyhogy ne is teketóriázzunk tovább, itt az ideje, hogy felfedjük a fátylat...

## Ajánlás

...legalábbis valamennyire. Bevallom, a téma amiről itt beszélni fogok nagyon is 
akadémikus. Ha az ember felmerészkedik a cikk témájához kapcsolódó egyik 
leghíresebb algoritmus [Wikipédia oldalára], akkor azon túl, hogy olyan 
hieroglifákat lát, amiknek értelmezéséhez ~~ember legyen a talpán~~ elég szilárd 
alap kell típus-elméletből, még csomó programozásban megőszült tudós neve is 
felmerül.

![A HM algoritmus matematikai alakban felírva.](/hiero.png)

Épp emiatt először is le szeretném szögezni, hogy ez a cikk okkal lett úgy
címezve, hogy "tanuljuk meg együtt" és nem úgy, hogy "most megtanítom". Bár a 
Bsc szakdolgozatom keretében egy programozási nyelvet írtam, így a téma hamar
érdekelni kezdett és mondjuk azt, hogy egy-másfél éve foglalkoztat már, ez közel 
nem jelenti azt, hogy a témát mélyen érteném vagy újító gondolatot tudnék fűzni 
hozzá.

Sőt, a következőkben látható írás jelentős része egy a Cornell University-n 
tanító professzor, Michael R. Clarkson és társainak munkájából inspirálódott, 
helyenként erősen merítve abból, akik egy [online könyvben] tették elérhetővé az
egyetemen tanított OCaml kurzusuk. Ezen kurzus egyik fejezete éppen az
értelmező programok megalkotásáról szól és ezen belül egy szekció pedig magáról
a típuskövetkeztetésről. A cikkem alapját ez a szekció szolgálja, azonban 
értelemszerűen saját verziómban az ott található gondolatok magyarul lett meg- 
és átfogalmazva, és OCaml helyett TypeScript-ben írt kóddal lett prezentálva.

Nem akarom túldramatizálni a dolgot, de a könyv számomra erősen 
szemléletformáló volt mind az értelmezők, mind a típusellenőrzés és 
-következtetés témaköreivel kapcsolatban. Mr Clarkson homályos elméleti 
módszerek és szabályok helyett tiszta, könnyen követhető példákkal demonstrálja 
a nyelvek értelmezésének minden szakaszát, így nagyon bátran ajánlom bárkinek, 
akit érdekel a téma. Bár azt nem ígérhetem, hogy rögtön utána képes leszel 
önálló nyelvet alkotni, de azt garantálhatom, hogy a könyv végeztével sokkal 
kevésbé lesz "fekete doboz" a fordítóprogram, aminek az egyik végén bemegy a 
szöveg és a másik végén kijön *valami,* amit le tudunk futtatni.

És most, hogy remélhetőleg kellőképp leemeltem magam a kisfelhőről, vágjunk is 
bele.

## Szintaxisfák — Kód, ahogy azt a fordító látja

Sajnos mielőtt belekezdhetnénk a fő témánkba, muszáj egy apró kitérőt tennünk az
úgynevezett szintaxisfák gyors bevezetésére. Aki ezekkel tisztában van, 
nyugodtan ugorhat is tovább, azonban a többieket marasztalnám, hisz a fogalom
ismerete nélkül erősen homályos lehet a cikk többi része.

Remélhetőleg, azzal senkinek se mondok újat, hogy a számítógép (de az annál
sokkal magasabb szinten működődő értelmezők se) nem nyers szövegek alapján
működik. Értelemszerűen, ahhoz hogy eljussunk a felhasználói bemenettől a gépi
kódig, különféle átalakításokat kell végeznük, ennek a jelenlegi témához 
legfontosabbb állomása pedig az úgynevezett *absztrakt szintaxisfa* ("abstract 
syntax tree", röviden **AST**).

Az AST egy fa struktúra, mely az általunk használt nyelv elemeiből épül fel. 
Célja, hogy a struktúrálatlan nyers szövegből egy hierarchikus, a számítógép 
által könnyen feldolgozható adatstruktúra legyen. Ehhez elvetünk minden olyan 
elemet, ami az értelmezéshez nem szükséges (például ilyen az nyelvi elemek 
közötti üres hely, a fordító számára lényegtelen, hogy "3 + 5"-öt lát vagy 
"3 +  5"-öt).

Gyakorlati példaképp tegyük fel, hogy egy képzeletbeli, C-szerű nyelvben a 
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

Az AST-k előnye még, hogy a gépi kódra való fordításon túl, a fordító összes 
fázisa képes dolgozni velük. Például, ha optimalizálni szeretnénk a programunk, 
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

egy az egyben cserélhető lenne a

```
[Number(10)]
```

elemmel. De ugyanilyen optimalizáció lehet, ha egy elágazásban be tudjuk 
bizonyítani, hogy az eldöntés mindig igaz / hamis, így maga az elágazás 
eltávolítható a programból, annak helyére csupán a megfelelő ágat illesztve
vissza, ezzel egyszerűbb és rövidebb kódhoz jutva:

```
If
|
|-<Kifejezés mely mindig igaz>
|
|-<Igaz ág>
|
|-<Hamis ág>

->

<Igaz ág>

```

A különböző fordítási és optimalizálási módszerekkel könyveket lehetne 
megtölteni, azonban ez a cikk ezek helyett az AST-k még egy felhasználási 
módjára fókuszál. Ez pedig nem más, mint a programunk típusok szempontjából való 
helyességének ellenőrizése. Folytassuk most ezzel.

## Típusellenőrzés — "Ez így jó-e?"

Mielőtt magával a típuskövetkeztetéssel kezdenénk foglalkozni, nézzük meg előtte
a kissé kevésbé rejtelmes testvérét, a típusellenőrzést (*type checking*). Ha 
meg kéne fogalmaznunk mit is tesz, valahogy így írhatnánk le: 

> "Adott programkód és az ebben található változók és függvényekhez adott 
> típusok esetén eldönti, hogy ezek a típusok konzisztensek-e a kód által leírt 
> folyamattal."

Faék példával élve, igyekszünk megbizonyosodni afelől, hogy egy számnak 
deklarált változót ugyan ne adhassunk már egy szöveghez.

A folyamat egyszerűsége és egyben nehézsége, hogy minden típust előre meg kell
adnunk az ellenőrző algoritmus számára. Ez persze kedvező számunkra olyan 
szempontból, hogy az ellenőrző kódja így lényegesebben egyszerűbb, hisz nem kell 
saját magától kitalálni egy-egy érték ugyan mi is lehet (maximum elemei 
értékeknél, például számok, szövegek, vagy logikai értékek, de ezek eldöntése 
triviális). Ugyanezen ok miatt, azonban ha az algoritmus valaha olyan értékbe 
fut, aminek nincs megadott típusa akkor az egész folyamat megakad és nem tudunk 
mit mondani a programunk helyességéről.

Mivel a cikk fő témája nem ez, így csak egy rövid informális példát adok
az algoritmusra. A témában érdekeltek számára ajánlom a fentebb taglalt könyv
[idevágó fejezetét].

1. Adott számunkra két bemeneti paraméter, `ast` (lásd fentebb) mely tartalmazza 
   a jelenlegi elemét a kódnak, amit ellenőrizni szeretnénk és a második, 
   `env`, ami pedig egy úgynevezett *környezet.* Ennek feladata az olyan értékek 
   típusának eltárolása, amire a program futása során később is szükségünk 
   lehet (pl.  változók vagy függvények).
2. Megnézzük milyen elemmel is van dolgunk. Ha elemi (tehát például egy szám 
   vagy szöveg), akkor az érték típusa önmagában eldönthető. Minden más 
   ceremónia nélkül ezzel visszatérünk.
3. Ha viszont nem elemi, akkor nyelvi elemmel van dolgunk, melynek minden
   variációjára külön eljárást kell alkalmaznunk. Például:
    - Ha változót találtunk, akkor meg kell néznünk, hogy találunk-e
      hozzá tartozó értéket az `env`-ben. Ha igen, akkor visszatérünk ezzel a 
      típussal. Ha pedig nem, akkor kivétel (vagy egyéb hasonló hiba) formájában 
      jelezzük a felhasználó felé, hogy a program nem létező változót kíván 
      használni.
    - Ha változóhoz értéket szeretnénk rendelni, akkor megnézzük először, 
      hogy a hozzárendelt érték megfelel-e a típusellenőrzésnek és, ha igen, 
      akkor eltároljuk mind a változó nevét, mind az értékének típusát az `env` 
      változóban.
    - Elágazás esetén az algoritmus rekurzív meghívásával megnézzük, hogy a 
      predikátum (a rész, ami `if (<itt>)` található) logikai érték-e. Hisz, 
      bár a C(++) megengedi, azért mégis egy eldöntés ne szám vagy szöveg alapon 
      történjen. Ha ez passzol, akkor pedig szintén meghívjuk az ellenőrzést az 
      elágazás összes ágára is. Ekkor nyelvtől függően lehetőségünk van 
      megengedni vagy nem engedni meg, hogy a különféle ágak más-más 
      típusokkal térhessenek vissza.
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

Ha egy egyszerű, statikusan típusos nyelvet írunk, akkor ennyivel akár meg is 
elégedhetnénk. Legyen a felhasználó gondja-baja, hogy a típusokat szolgáltatja, 
mi kegyesen ellenőrizzük ezt neki, de helyette nem kívánunk dolgozni.

Ugyanakkor nem állt meg itt a tudomány, így végre elérkezhetünk a cikk fő
témájához, ami nem más mint a...

## Típuskövetkeztetés — "Hogyan is lenne ez jó?"

Míg a típusellenőrzés azt a kérdést válaszolja meg, hogy "az ilyen típusokkal
ellátott kód helyes-e?", a típuskövetkeztetés (*type inference*) feladata, 
hogy, 

>"Adott kód esetén lehetséges-e egyáltalán minden értékhez konzisztens típust
>rendelni és, ha igen, pontosan mik is ezek a típusok."

Remélem azért érződik, hogy itt egy lépéssel elrugaszkodottabb dologról van szó 
mint az előző szekcióban.  Itt ugyanis már nem meglévő információt akarunk a 
géppel ellenőriztetni, hanem bizonyos szabályrendszerek alapján úgy információt 
akarunk generáltatni.

Akinek ezektől a szavaktól az AI villan az agyába, nyugodtan hesegesse is el a 
gondolatot. Szerencsére az itt tárgyalt algoritmus nem csak, hogy nem igényel
semmiféle neurális mókolást, elég egyszerű ahhoz, hogy némi magyarázattal egy 
aránylag kevés valódi tapasztalattal rendelkező programozó is lekódolja. Én már 
csak tudom, hisz én magam is az vagyok.

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
bebizonyították, hogy vannak nyelvek és programok, amelyekben a típusok szimplán 
kikövetkeztethetlenek. Hogy ezek pontosan milyen nyelvek, azt itt most nem
részletezném (ez a cikk az algoritmus terjesztésére íródott, nem szidalmazására
:)), legyen annyi elég, hogy például olyan függvények, mint a C `printf`-je, ami 
tetszőleges számú és tetszőleges típusú argumentumot fogad nem következtethő ki
algoritmikus úton. Akit még ennél is jobban érdekel a kérdés, ajánlom nézze meg 
ezt a StackOverflow-os [választ], melyben a kommentelő részletesen kivesézi 
miért is nincs ingyen ebéd.

Ezt tisztázván viszont vágjunk is bele a dolgokba. 

### Elmélet

A következőkben "kézzel" lefuttatom a HM algoritmust egy egyszerű programon,
leírva annak részeit és hogy pontosan mi is történik az egyes lépéseknél.

A továbbiakban a következő OCaml-szerű pszeudokódban írt programot fogjuk 
vizsgálni:

```
fun f ->
  fun x ->
    f(x + 1)
  end
end
```

Ahogy látható, ez az új nyelv lényegesebben más a C-től megszokottaktól. 
Remélhetőleg aránylag egyértelmű mi is az kód jelentése, de hogy mindnyájan 
ugyanott tartsunk, kiolvasva ez a következő:

> Adott egy függvény `f` argumentummal, mely visszaad egy másik függvényt `x`
> argumentummal. Ezen belső függvény értéke pedig az `f` meghívva `x+1`-re.

C-szerű nyelvben ez a következő lenne:

```
? külső(? f) {
  return ? belső(? x) {
    return f(x + 1)
  }
}

```

Értelemszerűen a dolog pikantériája, hogy a `?`-el jelölt típusokat nem mi 
szeretnénk kézzel megadni (még akkor se, ha ez a jelen példában nem lenne 
kifejezetten bonyolult), hanem elvárjuk, hogy a gép majd szépen kisakkozza 
nekünk.

#### Típusok reprezentációja

Utolsó gyors kitérő mielőtt magával az algoritmussal foglalkoznánk. A cikkben
az OCaml szakirodalom tradícióit követve a következő módon jelöljük a típusokat:

`int` / `bool` — Egyszerű, konkrét típusok. Megfeleltethetőek a megszokott, 
C-szerű programozási nyelvekből ismert típusoknak.

`'a` / `'b` / `'kiscica` — Az aposztrof és a kisbetűk árulkodnak erről a 
fajtáról. Ezek az úgynevezett "szabad" típusváltozók. A "szabadságot" itt úgy 
értjük, hogy nem tudjuk pontosan még pontosan milyen konkrét típus fog a változó
helyére kerülni, de azt igen, hogy valami állni fog itt. A HM egyik 
alapfeltételezése, hogy tetszőleges számú szabad típusváltozót tudunk gyártani.

`t1 -> t2` (olvasd "nyíl `t1`-ből `t2`-be") — Akik még nem igazán foglalkoztak 
funkcionális programozzással most valószínűleg kicsit pislogni fognak. 
Amikor én először megláttam ezt a jelölést, szintén kissé hüledeztem, 
hogy "most mi, miért így néz ki?", de valójában egyáltalán nem bonyolult 
rendszer. Működésében hasonlít a matematikában megszokott 
`értelmezési tartomány -> értékkészlet` kapcsolathoz, azonban a 
legegyszerűbb úgy felfogni, hogy "ha egy `t1`-et kapok, egy `t2`-t fogok 
visszaadni."

Például, a következő függvény

```
int dupláz(int x) {
  return x * 2
}
```

típusa `int -> int` volna, hisz egy szám bemenetet vár, melyre egy 
másik számot ad kimenetként. Ahogy látható az argumentum vagy a függvény neve a
típus szempontjából irreleváns, így nem jelenik meg.

Ez eddig remélhetőleg triviális. De mi történik akkor, ha egy függvény több
argumentumot is vár? Ilyenkor az egyszerűség kedvéért (még ha nem is tűnik
egyszerűbbnek elsőre), úgy értelmezzük, hogy egy `n`-argumentumú függvény
valójában `n` darab 1-argumentumú függvényből épül fel és az egyes 
argumentumok átadásával mindig egy másik függvényt kapunk, egészen addig,
amíg egy végső értéket nem kapunk.

Példa,

```
V több_argumentum(A a, B b, C c) {
  return // valami művelet, ami egy V típusú értékhez vezet.
}
```

Ekkor a függvényünk típusa (vagy szignatúrája) `A -> B -> C -> V`. Ezt úgy
értelmezzük, mintha a következő zárójelek lennének ott: `A -> (B -> (C -> V))`

Tehát, egy `A` típusú értéket váró függvény, mely visszaad egy `B` típusú 
értéket váró függvényt, mely visszaad egy `C` típusú értéket váró függvényt,
mely végül visszaad egy `V` értéket.

Velem vagy még? Remélem. Bár elsőre fölösleges komplikálásnak tűnhet, ez
a fajta reprezentáció nagyban megkönnyíti a függvények típusairól való 
érvelést, ahogy az majd hamarosan láthatóvá is fog válni.

#### Megkötések kigyűjtése

Az algoritmus első lépése, hogy egy adott AST-ről különféle **megkötéseket** 
gyűjtünk. Ez önmagában elég homályos lehet, de egy egyszerű példával világossá
fog válni. Tegyük fel van egy ilyen egyenletünk: `HM(a) = HM(x + 5)`, ahol `HM` 
tetszőleges nyelvi elemet annak típusához rendel. Ebből két megkötést is le 
tudunk vonni. Mivel tudjuk, hogy az összeadás számokon operál így az garantált, 
hogy `HM(x) = int`. És mivel azt is tudjuk, hogy egy összeadás végeredménye 
szintén szám, így azt is tudjuk, hogy `HM(a) = int`.

Tehát a megkötés egy olyan egyenlet, melynek bal és jobboldalán is egy-egy típus
áll, melyeket egyenlőnek tekintünk.

Természetesen a különböző nyelvi elemek különböző megkötéseket is vonnak maguk
után. Például, ha adott a következő elágazás

```
if (pred) {
  <igaz ág>
} else {
  <hamis ág>
}
```

akkor a következő megkötéseket vonhatjuk le :

* `HM(pred) = bool`
* `az egész if = 't`
* `HM(<igaz ág>) = 't`
* `HM(<hamis ág>) = 't`

(Ezt úgy értelmezzük, hogy az elágazásunk predikátumának logikai értéknek kell
lennie, a két ágnak pedig ugyanolyan típusúnak, mely végül az egész elágazás
típusává is válik.)

Fontos megjegyezni, hogy a típusellenőrzésnél emlegetett `env` környezettel 
ellentétben a megkötések fölfelé terjednek. Ez azt jelenti, hogy ha például
három elágazást egymásba ágyazunk, akkor a legkülsöbb elágazás megkötései
tartalmazni fogják a belső elágazások megkötéseit is.

Ennek következménye, hogy mire feldolgoztunk mindent és elértünk ismét a 
gyökérelemhez egy az egész programra konzisztens megkötés-halmazzal fogunk
rendelkezni.

---

A jelenlegi példánk esetén ez a folyamat a következőképp néz ki:

Kiindulási alapunk a teljes kód és egy úgynevezett *statikus környezet,* mely
többé-kevésbé ugyanazt a feladatot tölti be, mint a típusellenőrzésnél is 
emlegetett környezet, azonban ahelyett, hogy az összes típust tartalmazná már az
algoritmus futásának kezdetekor, csak azokat tartalmazza, amiket a nyelv 
készítői előre beprogramoztak.

Ez jelen esetben, a `+`-t jelenti, melynek típusa `int -> int -> int`, hisz két 
számot ad össze és egy harmadikkal tér vissza. 

A kezdeti állapotunk a következőképp írhatjuk fel:

```
+ : int -> int -> int |- fun f -> fun x -> f(x + 1) end end
```

A `|-` jel elé helyezzük az eddig ismert típusaink, mely kezdetben csupán a 
statikus környezetből (vagyis jelen esetben az összeadás műveletből) áll. A jel 
maga úgy értelmezendő, hogy "a bal oldalból következik, hogy ...". 

A jeltől jobbra található az éppen feldolgozandó nyelvi elem, mely az algoritmus
kezdetekor egy függvény. Ezen függvény `f` argumentumának típusát még nem 
ismerjük. Generáljunk neki egyet és folytassuk az algoritmust a függvény
törzsén belül.

```
+ : int -> int -> int, f : 'a |- fun x -> f(x + 1) end
```

Ugyanez a történet. Generáljunk az `x`-nek egy szabad típusváltozót és 
folytassuk a második függvény törzsének vizsgálatát.

```
+ : int -> int -> int, f : 'a, x : 'b |- f(x + 1)
```

Áhá! Itt már más a helyzet. Egy függvényhívás áll előttünk. Először is nézzük 
meg mi is annak a függvénynek a típusa, amit meg szeretnénk hívni:

```
+ : int -> int -> int, f : 'a, x : 'b |- f : 'a -| {}
```

Benne van a környezetünkben, hogy `f : 'a`, így `'a`-val térünk vissza. Ez még
semmilyen megkötést nem termelt. A megkötéseket a `-|` jel után soroljuk fel, 
mely jelentése "a bal oldal a következőhőz vezet ...", a `{}` pedig az üres 
halmaz jelölése.

Rendben, a függvényünk típusa megvan, most nézzük az argumentumot. Hunyorítsunk 
picit és fel fog tűnni, hogy az összeadás valójában értelmezhető egy kettős
függvényhívásnak is. `x + 1 = +(x)(1)`. Vagyis "meghívjuk" az összeadás 
függvényt először `x`-el, majd az így kapott "függvényt" meghívjuk `1`-el.

Nos, függvényhívást láttunk már, szóval végezzük el az előző lépéseket:

```
+ : int -> int -> int, f : 'a, x : 'b |- +(x)
  + : int -> int -> int, f : 'a, x : 'b |- + : int -> int -> int -| {}
  + : int -> int -> int, f : 'a, x : 'b |- x : 'b -| {}
```

Eddig nagyon semmi érdekes nem történt, itt azonban elkezdődik a varázslat. 
Ugyanis most, hogy már nem tudunk mélyebbre menni (az `1` mellékág, eléréséhez 
kénytelenek vagyunk visszalépni egyet), a folyamat elkezd visszafesleni és 
ezáltal meg is születik az első megkötésünk:

```
+ : int -> int -> int, f : 'a, x : 'b |- +(x) : 'c -| 
  int -> int -> int = 'b -> 'c
```

Generálunk egy új típusváltozót, jelen esetben `'c`, ez lesz a függvényünk 
visszatérési értékének típusa. Mivel a függvény `x` paramétert vár, (mely egy 
`'b` típusú érték), így ekkor már tudjuk, hogy a függvényünk típusa `'b -> 'c`,
melynek meg kell egyeznie a függvénytörzs típusával, tehát 
`int -> int -> int`-el. Ha ez így rögtön nincs meg, ajánlok eltölteni itt egy 
percet meggyőződni, hogy logikus, ami történik. Amint ez megvan a többi már 
majdnem mind gyerekjáték.

Haladjunk tovább, hisz van még egy másik argumentumunk is.

```
+ : int -> int -> int, f : 'a, x : 'b |- 1 : int -| {}
```

Itt semmi meglepő nem történik. Egyszerű értékek esetén (pl. `1`) a típust 
önmagából el tudjuk dönteni, megkötés pedig nem termelődik.

Megint elértük az AST egyik levél-elemét, így az algoritmus ismét egy szintet 
visszafeslik:


```
+ : int -> int -> int, f : 'a, x : 'b |- +(x)(1) : 'd -| 
  'c = int -> 'd, 
  int -> int -> int = 'b -> 'c
```

Ez egy másik szituáció, ami kissé megkavarhatja az embert. Lássuk, miért is
`'c = int -> 'd` az új megkötésünk. Ez nem mást mond ki mint:

> "Egy `'c` típusú függvény egy `int` típusú argumentum esetén `'d` típusú 
> értéket ad vissza."

Győződjünk meg róla, hogy ez valóban így van: 

- A `+(x)` függvény típusát előzőleg `'c`-nek határoztuk meg,
- az `1` argumentum típusa triviálisan `int`,
- a teljes függvényhívás (vagyis `+(x)(1)`) típusát tetszőleges alapon `'d`-nek
  kereszteltük,
- tehát, ha egy `'c` típusú függvényre (`+(x)`) meghívunk egy `int` argumentumot
  (`1`), akkor eredményként egy `'d` típusú értéket kapunk kapunk.
- másképp fogalmazva `'c` egy `int -> 'd` típust takar,
- vagyis, megkötésként fogalmazva, `'c = int -> 'd`.

A gondolat egyáltalán nem triviális és én is tíz percet szórakoztam vele, hogy
olyan formában tudjam itt leírni, hogy az remélhetőleg ne zavarja össze a 
hallgatóságot.

![](/func_judg.png)

```
+ : int -> int -> int, f : 'a, x : 'b |- f(x + 1) : 'e -|
  'a = 'd -> 'e
  'c = int -> 'd, 
  int -> int -> int = 'b -> 'c
```

Csak, hogy biztosra menjünk, hogy megértettük a függvényhívás működését, itt
van még egyszer levezetve:

- Az `f` függvény típusát még korábban `'a`-nak határoztuk meg,
- az `x+1` kifejezés típusát most számoltuk ki `'d`-nek,
- `f(x+1)` típusát most alkottuk meg, ez az `'e`,
- tehát `'a` olyan függvénytípus, amit egy `'d` típusú értékkel meghívva `'e`-t 
  kapunk,
- vagyis `'a = 'd -> 'e`.

```
+ : int -> int -> int, f : 'a |- fun x -> f(x + 1) end : 'b -> 'e -|
  'a = 'd -> 'e
  'c = int -> 'd, 
  int -> int -> int = 'b -> 'c
```

Ekkor új megkötés már nem keletkezik, csupán azt a következtetést vonjuk le, 
hogy mivel `x` típusa `'b`, a függvénytörzsé pedig `'e`, így az egész függvény
típusa `'b -> 'e`. A függvényhívások után ez egy kellemesen egyszerű ítélet.

```
+ : int -> int -> int |- fun f -> fun x -> f(x + 1) end end : 'a -> 'b -> 'e -|
  'a = 'd -> 'e
  'c = int -> 'd, 
  int -> int -> int = 'b -> 'c
```

És ezzel megszületett a végső ítélet is: 

Az egész program típusa `'a -> 'b -> 'e`.

A megkötéseink pedig rendre:

-  `'a = 'd -> 'e`
-  `'c = int -> 'd`
-  `int -> int -> int = 'b -> 'c`

Csak hogy lássuk mennyire sok munkát is végez helyettünk a gép, itt az egész
algoritmus, immáron megszakítás nélkül. (A "rövidség" kedvéért az összeadás 
típusát nem írom ki teljesen, helyette a `'+` típust használom rövidítésként, 
melyet `int -> int -> int`-nek olvass.)

```
+ : '+ |- fun f -> fun x -> f(x+1) end end : 'a -> 'b -> 'e -| 'a = 'd -> 'e 'c = int -> 'd, '+ = 'b -> 'c
  + : '+, f : 'a |- fun x -> f(x+1) end : 'b -> 'e -| 'a = 'd -> 'e 'c = int -> 'd, '+ = 'b -> 'c
    + : '+, f : 'a, x : 'b |- f(x+1) : 'e -| 'a = 'd -> 'e 'c = int -> 'd, '+ = 'b -> 'c
      + : '+, f : 'a, x : 'b |- f : 'a -| {}
      + : '+, f : 'a, x : 'b |- +(x)(1) : 'd -| 'c = int -> 'd, '+ = 'b -> 'c
        + : '+, f : 'a, x : 'b |- +(x) : 'c -| '+ = 'b -> 'c
          + : '+, f : 'a, x : 'b |- + : '+ -| {}
          + : '+, f : 'a, x : 'b |- x : 'b -| {}
        + : '+, f : 'a, x : 'b |- 1 : int -| {}
```

Remélhetőleg így, hogy lépésenként átnéztük, már nem annyira rémisztő ez az
egyenletkavalkád. Ugyanakkor egyételmű, hogy az algoritmust által végrehajtott
lépések száma nagyon hamar átláthatatlanul naggyá válna, így ennél bonyolultabb
példát nem is nézünk.

Szóval, tök jó, akkor ezzel kész is volnánk... Na várjunk, de hát még mindig nem 
tudjuk mi a függvényünk típusa! Most mi van?

#### Egyesítés és behelyettesítés

Az van, hogy még nem teljesen vagyunk kész. A megkötések kigyűjtésének 
gyötrelmes folyamatát  az *egyesítés és helyettesítés* lépése követi. Ennek 
során a kapott típusmegkötéseket feloldjuk és új, specifikusabb megkötéseket 
kapunk, melyet végül a vizsgált kód végső típusának meghatározására tudunk majd
felhasználni.

Ismétlésképp az algoritmus első lépésének lefutása után a következő megkötéseket 
kaptuk:

* `'a = 'd -> 'e`
* `'c = int -> 'd `
* `int -> int -> int = 'b -> 'c`

Ezen felül tudjuk, hogy a függvény végső visszatérési értékének típusa 
`'a -> 'b -> 'e`.

Ezzel önmagában nem tudunk még sokat kezdeni. Az egyetlen információ, amivel
ez szolgál, hogy az így kapott végső függvény két értéket vár (melyek típusa
`'a` és `'b`), majd egy `'e`-vel tér vissza. Ez is több a semminél, de 
szerencsére jóval pontosabb további következtetéseket is le lehet vonni.

Ehhez három szabályt alkalmazunk megkötéstől függően:

1. `X = X`, ahol `X` bármilyen típus (legyen nyil, szabad típusváltozó vagy 
   konkrét típus), szimplán kiiktatásra kerül a halmazból, hisz nem szolgál új 
   információval.

2. `'a = X` (vagy `X = 'a`) esetén, ahol `'a` tetszőleges szabad típusváltozó,
   a megkötés kiiktatásra kerül a halmazból és a halmaz összes többi elemében
   `'a`-t átírjuk `X`-re. Ez a *behelyettesítés*. **Ezen felül eltároljuk azt**
   **a tényt, hogy `'a = X` a függvény visszatérési értékei között.**

3. `A -> B = C -> D` megkötés esetén (ahol `A`, `B`, `C` és `D` mind tetszőleges
   típusok, melyek nyilakkal vannak összekötve) az egyenlet kiiktatható és 
   helyette két új egyenletet veszünk fel a halmazba a következő alakkal:

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

* `'a = 'd -> 'e`
* `'c = int -> 'd `
* `int -> int -> int = 'b -> 'c`

Az első `'a = X` alakban van, mely a 2. szabálynak felel meg. Tehát kiiktatjuk
az egyenletet a halmazból, átírjuk a többi egyenletben található `'a`-t 
`'d -> 'e`-re, majd elmentjük a végeredmény halmazba az eredeti megkötést.

Mivel az `'a` semelyik másik megkötésben nem jelenik meg, így sok minden nem 
változik. Megkötéseink a következők:

* `'c = int -> 'd `
* `int -> int -> int = 'b -> 'c`

Végeredmény halmazunk pedig:

* `('d -> 'e) / 'a`

Itt a perjel csupán annyit jelent, hogy ez már nem feldolgozandó megkötés,
hanem egy elvégzett behelyettesítés. De lelki szemeid előtt nyugodtan 
értelmezheted egyenlőségjelnek is.

Haladjunk tovább. Vegyük észre, hogy a második megkötésben található `'c` 
megjelenik a harmadik megkötésben is. Alkalmazzuk ismét a 2. szabályt rajta: 
Kiiktatjuk a második egyenletet és a harmadikban ahol `'c`-t találunk 
azt átírjuk `int -> 'd`-re:

* `int -> int -> int = 'b -> int -> 'd`

Végül elmentjük a behelyettesítést a végeredmény halmazunkba:

* `('d -> 'e) / 'a`
* `(int -> 'd) / 'c`

Most pedig a 3. szabályt kell alkalmaznunk. Emlékezzünk, hogy `t1 -> t2 -> t3`
felfogható `t1 -> (t2 -> t3)`-ként. Így értelmezve a harmadik egyenletet,
bontsuk ketté!

* `int = 'b`
* `int -> int = int -> 'd`

(A végeredmény halmaz változatlan.)

Az így kapott új első egyenlet a 2. szabály triviális alkalmazása:

* `int -> int = int -> 'd`

Végeredmény halmaz:

* `('d -> 'e) / 'a`
* `(int -> 'd) / 'c`
* `int / 'b`

Ismét egy nyillal van dolgunk. Bontsunk megint.

* `int = int`
* `int = 'd`

(A végeredmény halmaz változatlan.)

Az első egyenletben végre találkozunk az 1.-es szabállyal. Tehát, minden marad
változatlan, az első egyenlet meg megy a kukába.

* `int = 'd`

Ez pedig ismét a 2. szabály triviális alkalmazása.

Ekkor a megkötés halmazunk üres, a végeredmény pedig a következő:

* `('d -> 'e) / 'a`
* `(int -> 'd) / 'c`
* `int / 'b`
* `int / 'd`

Az algoritmus ezen lépése ekkor véget ér.

#### Végső típus kiszámítása

A végeredmény halmazunk elkészültével előszedjük ismét a kimeneti típusunk, 
mely jelen esetben `'a -> 'b -> 'e`. Itt már nem kell semmiféle eldöntést 
végeznünk, helyettesítsük csak be sorban a végeredmény halmaz elemeit a kimeneti
típusra. (Emlékeztetőképp a perjel bal oldalán lévő dolgot helyettesítjük be
a jobboldalira.)

* `('d -> 'e) / 'a` -> `('d -> 'e) -> 'b -> 'e`
* `(int -> 'd) / 'c` -> `('d -> 'e) -> 'b -> 'e` (nincs `'c`, így változatlan 
  marad)
* `int / 'b` -> `('d -> 'e) -> int -> 'e`
* `int / 'd` -> `(int -> 'e) -> int -> 'e`

Így tehát a végleges kimeneti típusunk: `(int -> 'e) -> int -> 'e`

Értelmezzük, mit is jelent ez az által, hogy behelyettesítünk a függvény két
korábban megadott alakjába:

```
fun f : (int -> 'e) ->
  fun x : int ->
    f(x + 1) : 'e
  end
end
```

```
(int -> 'e) külső((int -> 'e) f) {
  return 'e belső(int x) {
    return f(x + 1)
  }
}
```

Tehát, `külső` egy olyan függvény, mely egy `int -> 'e` függvényt vár `f`
paraméterképp és egy másik `int -> 'e` függvénnyel (ez lesz `belső`) tér vissza.
`belső` egy olyan függvény, ami egy `int` vagyis szám paramétert vár `x` néven. 
Visszatérési értéke `f(x+1)`, ami egy `'e` típusú érték.

A tanulság, hogy ennyi kódból szimplán nem tudjuk mit is csinál az `f`. Lehet
hogy valami összehasonlítást végez. Lehet szöveggé alakítja a számot. Lehet
formattálja a merevlemezed. Egyszerűen nincs elég információnk. 

Azonban, ez bőven nem jelenti, hogy nem jutottunk sok hasznos információhoz! 
Megismertük a függvény alakját és azt is tudjuk, hogy mivel megjelenik az 
összeadásban, az `x`-nek muszáj egy számnak lennie és bár `f` kimeneti típusát 
nem ismerjük, azt tudjuk, hogy a bementi értékének számnak kell lennie. 

A HM varázsa, hogy mindezt úgy végeztük el, hogy fogalmunk sincs mik az 
argumentumok pontos értékei. Ezen kívül az algoritmus azt is garantálja, hogy a 
lehető legáltalánosabb típust adja meg.

De mit is értünk legáltalánosabb típus alatt? 

Az előző példánál maradva, a függvény végső típusa lehetett volna akár 
`(int -> bool) -> int -> bool`. Az `'e` egy szabad típusváltozó, így papríon 
bármit behelyettesíthetnénk a helyére. Ugyanakkor, az ég világon semmi nem köti 
ki a programban, hogy `f` valóban egy logikai értékkel fog visszatérni. Épp 
erről koptattam a pennám, hogy szimplán nincs elég információnk arról, hogy 
tudjuk. 

Ugyanakkor a ló másik oldalán is simán leeshetünk. Az `('a -> 'e) -> int -> 'e` 
se volna megfelelő visszatérési típus, hisz tudjuk az `x` alapján, hogy `f` 
bemeneti típusa mindenképp szám.

Tehát a legáltalánosabb típus alatt olyan típust értünk, melynek részei akkor
és csak akkor vannak konkretizálva, ha elég információval rendelkezünk ehhez.

### Let-polimorfizmus

A figyelmes olvasónak feltűnhet, hogy az eddig tárgyalt nyelvből gyanúsan 
hiányzik a változók hozzárendelésének lehetősége. De tegyük csak bele a nyelvbe,
bizonyára semmi gond nem történhet.

Innentől elérhető a `let <változó> = <érték> in <törzs>` konstrukció, ami a
`<törzs>`-ön belül elérhetővé teszi a `<változó>` változót, `<érték>` értékkel.

```
let x = 10 + 5 in
  x : int
```

No, minden rendben, csak nem robbant fel az univerzum. Az algoritmusunk 
megfelelő típust számol pont mint korábban. Igen ám, de próbáljunk most meg egy
különös programot, csak a biztonság kedvéért:

```
let id = fun x -> x in
  let a = id(5) in
    id(true)
```

És rögtön lángokban a világ... Ugyanis, hiába jutunk el odáig, hogy az `id` 
típusa `'a -> 'a` (hisz az identitás függvény típustól függően minden értéken 
működik), amint elérünk az `id(5)` függvényhíváshoz, az `'a` konkretizálódik
`int -> int`-re. Így amikor az `id(true)` kerül kiértékelésre, a 
típuskövetkeztetés hibába fut, annak ellenére, hogy a két függvényhívás (és a 
két `'a`) egymástól független.

Persze "megoldhatnánk" a problémát azzal, hogy visszagyömöszöljük a 
változókötést Pandora dobozába. De valljuk be ez nem volna életszerű döntés, 
hisz nincs ember, aki anélkül kíván programozni. Ehelyett inkább oldjuk meg az 
algoritmusban magában, hogy támogassa ezt a nyelvi elemet.

Szerencsénkre összesen két elméleti síkon egyszerű változást kell elvégeznünk az
algoritmusunkban. Sajnos viszont, ha korábban buzgón nekiláttunk az algoritmus
implementálásának kód formájában, akkor ezek az "egyszerű" változtatásokhoz jó
sok helyen át kell írni a dolgokat. De épp ez is ennek a cikknek a lényege, hogy
ha már én egyszer megszenvedtem ezeket a csapdákat, a kedves olvasónak legalább 
ne kelljen.

De mi is ez a két bűvös változás? 

Az első, hogy bevezetjük a *típussémák* fogalmát. Egy típusséma a következőképp 
néz ki: `egy v. több <típusváltozó> . <típus>` 

Olvasata pedig a következő: A `<típus>` típusban található egy vagy több
`<típusváltozó>` *általános.* Ez annyit jelent, hogy minden alkalommal, amikor
a típus kiértékelésre kerül, új szabad változó kerül az összes típusváltozó 
helyére.

Változókötések esetén a változóhoz kötött érték típusa típussémaként kerül 
eltárolásra. Fontos, hogy csak azok a típusváltozók válnak általánossá, melyek 
nem rendelkeznek egyéb megkötésekkel. Ellenkező esetben felülírhatnánk olyan 
típusokat is, melyek értéke "kívülről" (vagyis a kötésen túlról) származik
és egyáltalán nem is általános.

A második változtatás elmagyarázásához vegyük példának az `id` függvényt. A 
típussémák bevezetése után a függvény típusa `'a . 'a -> 'a`. És amikor újra 
lekérjük ezt a típust (például a két függvényhívás ellenőrzése közben) új, 
nem-séma(!) típust gyártunk belőle, például `'b -> 'b` és `'c -> 'c`, majd 
ezeket egymástól függetlenül használjuk az algoritmus további részeiben.

Ekkor a `'b -> 'b`-ből `int -> int` lesz, a `'c -> 'c`-ből pedig `bool -> bool`
az algoritmus boldogan lefut és mindenki boldog.

#### Hol is a HM határa?

Bár tudom, hogy azt ígértem, hogy nem fogok az algoritmus limitációiról 
beszélni, mégis szeretném gyorsan megemlíteni, hogy immáron, hogy tisztában 
vagyunk vele, hogyan is működnek a polimorf típusok az algoritmusban, mi is az 
amit *nem* tudunk reprezentálni.

Amit eddig láttunk azok úgynevezett egy-rangú polimorf típusok. Ez annyit 
jelent, hogy az általános típusváltozók (tehát, ami a pont előtt van) a típus 
legkülső részén állnak és máshol nem is állhatnak.

Ezzel szemben léteznek magasabb-rangú polimorf típusok is, melyekben az 
általános típusváltozók valahol a típusban beágyazva jelennek meg. Példaképp 
képzeljünk el egy függvényt, mely varázsütésre bármely típusból képes szöveget 
létrehozni és egy másikat, mely az első függvénynek megfelelő paramétert vár és 
tetszőleges típussal tér vissza. Ekkor az első függvény típusa 
`'a . 'a -> string`, a másodiké pedig `('a . 'a -> string) -> 'b`. Ekkor az 
általános típusváltozó *nem* kívül áll, hisz a legkülső elem a nyíl, ami 
összeköti a sémát a `'b`-vel.

Ez pedig sajnos szimplán [nem eldönthető], így nem hogy a sima HM, de bármilyen
képzelt vagy valós típuskövetkeztető algoritmus elhasalna rajta. Ez persze nem 
jelenti azt, hogy vége a világnak. A Haskell nyelv például támogatja az ilyen 
típusokat is és mégis a HM (kiterjesztett alakja, az ún. [System F]) döcög 
alatta. Csupán annyit tesz, hogy ilyen esetekben a programozónak is kell kicsit 
güriznie és meg kell adnia az ilyen függvények típusait kézzel.

---

Ha négy-öt mellékes szállal is, de az elméleti rész végre befejeződött. Azonban
az algoritmus megértésének elősegítésére írtam TypeScriptben egy egyszerű 
megvalósítást, mely erősen kikommentelve megtalálható a repó `src` mappájában. 
Ha esetleg bármi nem lenne tiszta a leírásomból, remélhetőleg a kódot olvasva
eloszlik a köd.

### Összefoglalás

Köszönöm szépen, hogy elolvastad ezt a kis cikket! Nincs nagy gyakorlatom 
ilyesmikben, de remélem ennek ellenére nem lett nagyon szedett-vedett.

Persze kérdéses, hogy a való életben hol hasznos ez a tudás, amit most esetleg 
itt elsajátíthattál és erre őszintén egy vállrándításon és egy "fene tudján" túl
nagyon hasznos választ nem is tudok adni, de hiszem, hogy érdemes ilyesmikben is
jártasnak lenni, hisz a programozás nem csak a kenyérkereső corporate mókolásról
szól, hanem egy nagyon is izgalmas ágazat, ahol az átlag, két lábon járó ember
is alkothat olyat, ami más számára csak matematikai krikszkraksz.

Ha mást nem, remélem legalább egy érdekes olvasmányt nyújtottam a reggeli 
kávéhoz.

[Wikipédia oldalára]: https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system
[online könyvben]: https://cs3110.github.io/textbook/cover.html
[idevágó fejezetét]: https://cs3110.github.io/textbook/chapters/interp/typecheck.html
[választ]: https://stackoverflow.com/questions/10462479/what-is-a-fully-type-inferred-language-and-limitations-of-such-language/10470321#10470321
[nem eldönthető]: https://www.sciencedirect.com/science/article/pii/S0168007298000475
[System F]: https://en.wikipedia.org/wiki/System_F