# Liofilizacja – symulator integracji cieplnej

Projekt 21 zmysłów. Cel: narzędzie decyzyjne do liofilizacji przemysłowej (bilans cieplny, próżnia, koszt wytworzenia, energia i PV), podane w języku wizualnym materiałów EMIX.

Stan na 2026-09-05: **architektura zaproponowana, nic nie zbudowane.** Propozycja: `plan/plan-strony.html` (opublikowana też jako artefakt). W repo leżą pliki referencyjne i te notatki.

## Pliki w repo

| Plik | Co to jest |
|---|---|
| `referencje/symulator-bilans-cieplny-v1.0.html` | Oryginalny symulator (v1.0, 179 kB, jeden plik, bez zależności poza Google Fonts). Nie ruszać – to źródło modelu. |
| `referencje/symulator-bilans-cieplny-v1.0b-render.html` | Ten sam symulator z dodanym renderem poglądowym nad kaflami (jedyna różnica wobec v1.0). |
| `referencje/linia-liofilizacji-schemat.html` | Schemat technologiczny linii 6 × 500 kg: rys. 1 schemat, rys. 2 węzeł komory, rys. 3 harmonogram, rys. 4 rzut hali 48 × 24 m, wykaz 11 aparatów, uwagi o PCM. Liczby z wariantu D symulatora. |
| `referencje/budzet-EPI-I.13.5.2.pdf` + `.txt` | Szkic budżetu operacji EPI (PS WPR I.13.5.2): Emix + Uniwersytet Rolniczy + rolnik, 2,92 mln kosztów, 2,5 mln pomocy, 420 tys. wkładu. Nabór 1.10–2.11.2026. |
| `referencje/emix-styl.css` | Arkusz stylu wyciągnięty ze strony EMIX „Piwnice 5500 m²”. Wzorzec prezentacji dla tego, co powstanie. |
| `plan/plan-strony.html` | Propozycja architektury: zasady, 3 opcje + rekomendacja, mapa serwisu, makiety 6 podstron, kafle Granty, brief i prompty na render, decyzje. |

---

## 1. Symulator – co zawiera

Jeden plik HTML, ok. 2670 linii. Vanilla JS, SVG rysowane ręcznie, brak bibliotek. Układ: lewy sticky panel parametrów (335 px) + prawa kolumna bloków wynikowych. Motyw jasny/ciemny, fonty Archivo / IBM Plex Sans / IBM Plex Mono.

### 1.1 Silnik (sekcje 1–3 kodu)

- **Stałe fizyczne**: ciepło sublimacji 2838 kJ/kg, desorpcji 3000, topnienia 333,6; cp z udziału wody; prężność pary nad lodem wg Murphy & Koop 2005.
- **Baza surowców** `PRODUCTS` – ok. 45 pozycji w grupach: owoce, warzywa, zioła, nabiał i płyny, składniki suche, mięso i podroby. Każdy ma udział wody, czas cyklu, gęstość załadunku, temperaturę zapadania, cenę sprzedaży i skupu, tłuszcz, białko, profil odżywczy (9 składników).
- **Postać na tacy**: kawałki, warstwa przecieru, foremki, płyta do wykrawania (z kształtem wykrojnika, momentem wykrawania i odzyskiem ażuru).
- **Mieszanki**: do 3 składników, temperatura zapadania ważona suchą masą, kara za rozdrobnienie tylko dla tkanki.
- **Zamrażanie**: szoker w linii / tunel IQF (osobny agregat, wentylatory, ubytek, drobne kryształy) / surowiec kupowany mrożony.
- **Próżnia**: model przejmowania ciepła zależny od ciśnienia, optimum szybkości vs granica jakości (zapadanie struktury), kara czasowa za odejście od optimum, strumienie pary i powietrza.
- **Cztery warianty układu chłodniczego**: A tradycyjny (R507, odrzut do atmosfery), B tradycyjny + odzysk skraplania na półki, C kaskada CO₂/R290, D zintegrowany 21z (kaskada + booster transkrytyczny + magazyny + przesunięcie taryfowe). COP = Carnot × sprawność egzergetyczna.
- **Odbiorniki ciepła i chłodu zakładu** (hala, CWU, CIP, osuszacz, mroźnia…) – domykają bilans systemowy; to, czego nie pokrywa odzysk, pokrywa kocioł gazowy i osobna chłodnica.
- **Silnik godzinowy**: 12 dób wzorcowych × 24 h, produkcja PV (Kraków, 35°), kształt cen RCEt (zima/przejściowy/lato, głębokość doliny), trzy taryfy (stała, dwustrefowa, dynamiczna), harmonogram obciążenia sztywnego i przesuwalnego, net-billing.
- **Koszt wytworzenia**: surowiec (gatunek, odpad sortowniczy, dźwignia uzysku), energia, robocizna, opakowanie, ogólne, amortyzacja; marża do ceny sprzedaży.
- **Wartości odżywcze**: świeży / susz konwekcyjny / liofilizat w trzech podstawach (100 g produktu, sucha masa, porcja), retencje z piśmiennictwa, oświadczenia żywieniowe wg 1924/2006, zastrzeżenia dobierane do składu.
- **Dźwignie kosztowe**: 12 dźwigni przeliczanych pełnym modelem w obie strony (poprawa / zaniedbanie), z podziałem na „wymaga nakładu” i „nastawa lub umowa”.

### 1.2 Bloki prezentacji (kolejność na stronie)

1. KPI (8 kafli) – energia/kg wody, energia/kg produktu, koszt/kg, moc szczytowa, CO₂, ciepło odzyskane, pokrycie z PV, średnia cena zakupu.
2. Warianty układu A–D (karty przełączające).
3. Energia elektryczna na cykl – słupki skumulowane A–D.
4. Co jest energochłonne – dwa paski 100 % (fizyka vs maszyna) + wykres dźwigni.
5. Próżnia – kafle + dwupanelowy wykres (front sublimacji, szybkość vs ciśnienie).
6. Drabina temperatur – diagram poziomów i sprężarek.
7. Profil dobowy mocy – 6 faz cyklu.
8. Wartości odżywcze – zakładki podstawy, karty składników, pasek przewagi, oświadczenia, zastrzeżenia.
9. Koszt wytworzenia i gatunek surowca.
10. Doba wzorcowa – cena i obciążenie, wybór miesiąca.
11. Rok energetyczny i taryfa.
12. Bilans systemowy i koszt – koszt na cykl, CO₂, zwrot vs A i vs B.
13. Pełna tabela bilansu.
14. Metodyka i założenia (długi tekst generowany z liczb).

### 1.3 Ocena

**Mocne strony**: model jest kompletny i spięty (jedna zmiana suwaka przelicza wszystko, także dźwignie i gatunki), teksty interpretujące liczby są generowane z modelu, a nie wpisane na sztywno. Metodyka jest uczciwa (sekcja „czego model nie robi”).

**Słabe strony do zapamiętania**:
- 14 bloków jednym ciągiem, wszystko na jednej stronie – brak hierarchii „co jest ważne”. Czytelnik nie wie, od czego zacząć.
- Panel parametrów ma ok. 100 suwaków. Narzędzie eksperckie, nie materiał do rozmowy z partnerem.
- Ekran ok. 13 500 px wysokości przy 1440 px szerokości.
- Kod: jeden plik, funkcje `draw*` po 100–200 linii, model i prezentacja w jednym pliku. Do rozdzielenia, jeśli ma to żyć dłużej.

---

## 2. EMIX – wzorzec prezentacji

Strona `twentyonelab.github.io/piwnice_EMIX/` – „Bold Editorial Studio”. Gate z hasłem (AES-256-GCM po stronie klienta), za nią jednoplikowa aplikacja z routerem na hash (`#/`, `#/a`, `#/b`, `#/c`).

### 2.1 DNA stylu

| Element | Wartość |
|---|---|
| Paleta | wyłącznie `#FFFFFF` / `#000000` / `#525252` / `#737373`, linie `rgba(0,0,0,.10)`, stopka `#0A0A0A`. Zero kolorów akcentowych. |
| Font | Inter 400/500/600/700, 17 px, `letter-spacing:-.02em`. Nagłówki 700, `letter-spacing:-.05em`, `line-height:.9`. |
| Mono | systemowy monospace, 12–14 px, uppercase, `letter-spacing:.1em` – etykiety, numeracja bloków, eyebrow, nagłówki tabel. |
| Skala | `clamp()` wszędzie; hero 52–210 px, tytuł case 38–118 px, h2 26–40 px, h3 23–34 px. |
| Ruch | jedna krzywa `cubic-bezier(.16,1,.3,1)`, reveal przy scrollu (IntersectionObserver), nagłówki wjeżdżają literami, kursor różnicowy (`mix-blend-mode:difference`). Wszystko wyłączane przy `prefers-reduced-motion`. |
| Zdjęcia | grayscale → kolor na hover, `aspect-ratio 4/3` i `16/9`, radius 4 px. |
| Siatka | `.wrap` 1440 px, `.doc__inner` 1100 px, bloki dokumentu `200px 1fr` (numer mono po lewej, treść po prawej). |

### 2.2 Komponenty (do przeniesienia)

- `hero` – eyebrow mono, tytuł 3-liniowy uppercase, sub, „↓ Przewiń”.
- `statement` – lead 24–46 px + body 68ch.
- `facts` – 4 liczby w rzędzie z pionowymi liniami, podpis mono pod liczbą.
- `tile` – karta koncepcji ze zdjęciem, badge, strzałką na hover.
- `table` – lewa kolumna 600, nagłówki mono, linia pod thead czarna.
- `callout` – lewa linia 1 px czarna, tytuł mono, treść.
- `case-head` + `case-meta` – tytuł koncepcji i cztery metadane.
- `pitch` – „test windy” w dwóch kolumnach.
- `doc` / `block` – numerowane rozdziały 01–09.
- `kpi` – 4 liczby na siatce z 1 px szczelinami.
- `pager` – poprzednia / następna koncepcja.
- `site-foot` – ciemna stopka 3-kolumnowa.

### 2.3 Czego w EMIX nie ma, a symulator wymaga

- **Wykresów.** EMIX to strona edytorska, symulator to 15 typów wykresów SVG. Trzeba zaprojektować wykresy w monochromie (czerń, szarości, kreskowanie, grubość linii), bo palety `--s1…--s6` z symulatora nie da się przenieść 1:1.
- **Kontrolek.** Brak suwaków, selectów, checkboxów. Trzeba je zaprojektować w duchu bramki hasła: `border-bottom:1px solid #000`, bez tła, bez radiusów.
- **Trybu ciemnego.** EMIX jest tylko jasny. Symulator ma oba. Decyzja: prawdopodobnie tylko jasny, zgodnie z wzorcem.
- **Interaktywnych tooltipów.** Do zaprojektowania.

---

## 3. Architektura (propozycja z 2026-09-05)

Rekomendacja: **hub + 6 podstron**, każda z jednym pytaniem, maks. 5 bloków, trzy warstwy głębokości (liczba → obraz → tabela po kliknięciu).

| # | Podstrona | Pytanie | Skąd treść |
|---|---|---|---|
| – | Start | Co to jest i dlaczego czytać dalej? | render, teza, 4 liczby, 6 kafli |
| 01 | Urządzenie | Dlaczego jedna maszyna liczy strumień raz, nie dwa razy? | sym. bloki 3, 4, 6; schemat rys. 2 |
| 02 | Linia i hala | Jak to stoi i pracuje w 6 komorach? | schemat rys. 1, 3, 4, wykaz aparatów |
| 03 | Ekonomia | Ile kosztuje kg i kiedy się zwraca? | sym. bloki 4, 9–12 |
| 04 | Symulator | Co się stanie, gdy zmienię surowiec? | model 1:1, tryb prosty 12 param. / ekspert |
| 05 | Granty | Z czego sfinansować i w jakiej kolejności? | budżet EPI + kafle kandydatów |
| 06 | Metodyka | Skąd liczby, czego model nie robi? | sym. bloki 13–14, uwagi schematu |

Odrzucone: jedna długa strona (wróci gęstość), trzy poziomy wtajemniczenia (za dużo utrzymania). Zasada warstw z opcji C wchodzi do B.

Granty na start: 1 kafel z danymi (EPI I.13.5.2), 4 kandydaci do weryfikacji (FENG Ścieżka SMART, kredyt ekologiczny BGK, NFOŚiGW / FE Małopolska, Horyzont Europa / EIT Food). Wspólne pola kafla: kto składa, na co, poziom, sufit, termin, relacja do EPI, dopasowanie.

Render na otwarcie: produkt, nie instalacja. Trzy bryły (komora, moduł maszynowy, 2 kasety PCM), stal + grafit, białe tło, czytelny w szarości. Trzy kadry: hero, przekrój, linia. Prompty w `plan/plan-strony.html`.

## 4. Decyzje do podjęcia przed budową

Nie rozstrzygam ich tu, tylko zapisuję. Zgodnie z zasadą: architektura przed kodem, one-way doors wskazane wprost.

1. **Jedna strona czy dwa poziomy?** Wzorzec EMIX sugeruje: strona główna (hero, statement, facts, kafle) + podstrony. Naturalny podział symulatora: bilans cieplny / próżnia i jakość / koszt i surowiec / energia i PV. To decyzja o strukturze URL i nawigacji – droga w zmianie.
2. **Ile parametrów pokazać?** 100 suwaków vs kilkanaście kluczowych + „zaawansowane” schowane. Rekomendacja robocza: warstwa prezentacyjna z ok. 12 parametrami, pełny panel pod przełącznikiem.
3. **Wykresy w monochromie.** Wymaga osobnego systemu: 1 kolor akcentu czy zero? EMIX mówi zero. Do sprawdzenia na drabinie temperatur i profilu dobowym, gdzie dziś jest 5 serii kolorystycznych.
4. **Rozdzielenie modelu od widoku.** Model (sekcje 1–3 symulatora) można przenieść bez zmian do osobnego pliku `model.js`. Widok pisany od nowa. To pozwala trzymać liczby zweryfikowane z v1.0.
5. **Bramka z hasłem** jak w EMIX (materiał wewnętrzny) czy publiczne? Wpływa na sposób publikacji.
6. **Hosting**: GitHub Pages z tego repo, jak EMIX.

---

## 5. Dziennik

- **2026-09-04** – wgrany symulator v1.0, przeczytany w całości. Rozszyfrowana i przeanalizowana strona EMIX. Zapisane pliki referencyjne i te notatki. Nic nie zbudowane.
- **2026-09-05** – nowe pliki: symulator z renderem, schemat linii, budżet EPI. Propozycja architektury strony (`plan/plan-strony.html`): hub + 6 podstron, zakładka Granty, brief na render. Czeka na decyzje 1–3.
