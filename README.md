# Liofilizacja z integracją cieplną

Strona prezentacyjna linii liofilizacji 21 zmysłów × Emix: czym jest liofilizacja, urządzenie, linia i hala, ekonomia, symulator bilansu, finansowanie, metodyka.

## Uruchomienie

Na żywo: https://twentyonelab.github.io/liofilizacja/

Strona statyczna, bez budowania. Otwórz `index.html` albo włącz GitHub Pages:

**Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` (albo ta gałąź), folder `/ (root)` → Save.**

Po kilku minutach strona będzie pod `https://twentyonelab.github.io/liofilizacja/`.

## Struktura

| Ścieżka | Rola |
|---|---|
| `index.html` | Cała strona, osiem widoków przełączanych routerem na hash (`#/`, `#/liofilizacja`, `#/urzadzenie`, `#/linia`, `#/ekonomia`, `#/symulator`, `#/granty`, `#/metodyka`). |
| `assets/style.css` | Styl. Baza z materiałów EMIX (biel, czerń, Inter), kolory tylko w danych. |
| `assets/model.js` | Silnik bilansu cieplnego, sekcje 1–3 symulatora v1.0 bez zmian. |
| `assets/app.js` | Router, podpięcie liczb do treści (`data-k`), wykresy SVG, symulator. |
| `assets/img/` | Rendery poglądowe. |
| `referencje/` | Materiały źródłowe: symulator v1.0, schemat linii, budżet EPI, arkusz stylu EMIX. |
| `plan/` | Propozycja architektury strony. |
| `makieta/` | Poprzednia makieta, historyczna. |
| `liofilizacja.md` | Notatki projektowe i dziennik. |

## Zestaw odniesienia

Wszystkie liczby na stronach 01–03 pochodzą z jednego przeliczenia modelu: truskawka w plastrach, 500 kg na 50 m² tac, zamrażanie w tunelu IQF, 69 Pa, wariant D, taryfa dynamiczna, 100 kWp. Zdefiniowany w `assets/app.js` jako `REF`. Ten zestaw odtwarza liczby ze schematu linii (cykl 24,6 h, 302 cykle, 83 t/rok z sześciu komór).
