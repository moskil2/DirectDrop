# Changelog

## V0.53 (2026-07-15)

### Changed
- Kolejność sekcji w menu: "Wi-Fi czy Hotspot" jest teraz przed "Polityką prywatności"
- Sekcja "Kontakt" zastąpiona sekcją "Kontakt / Zgłoś błąd / Propozycja zmian" z krótkim opisem i linkiem do formularza na spotrobotics.app/support/ zamiast bezpośredniego adresu e-mail
- Wszystkie zmiany przetłumaczone na 10 języków

## V0.52 (2026-07-14)

### Fixed
- Pasek statusu (godzina/sieć/bateria) i pasek nawigacji Android nie zmieniały koloru razem z motywem ciemnym/jasnym aplikacji - teraz są zsynchronizowane z wybranym motywem

## V0.51 (2026-07-13)

### Changed
- Sekcje "Bezpieczenstwo i prywatnosc" oraz "RODO i poufnosc danych" w menu scalone w jedna sekcje "Polityka prywatnosci" z bezposrednim linkiem do pelnej polityki na spotrobotics.app
- Dawna sekcja RODO zastapiona "Regulaminem" (Terms of Service) z nowa trescia zasad korzystania z aplikacji
- Wszystkie zmiany przetlumaczone na 10 jezykow

### Added
- Przycisk "Oceń aplikację" w menu, linkujacy do listingu Google Play

## V0.50 (2026-07-09)

### Fixed
- Biale podswietlenie na zaokraglonych rogach arkusza MENU przy rozwijaniu/zwijaniu kafelkow - usuniete zaokraglenie rogow arkusza (border-radius) eliminuje przyczyne

## V0.49 (2026-07-06)

### Changed
- Etykieta SpotRobotics w sekcji About jest teraz zielonym linkiem do spotrobotics.app

---

## V0.48 (2026-07-02)

### Fixed
- **Jezyk domyslny przy swiezej instalacji** - aplikacja zawsze startowala po angielsku niezaleznie od jezyka urzadzenia; teraz jezyk jest zapisywany w Android SharedPreferences i poprawnie odczytywany przy kolejnych uruchomieniach
- Fallback getLang() z polskiego na angielski dla nieobslugiwanych kodow jezykow

### Changed
- Preferencja jezyka zapisywana w Android SharedPreferences (czyszczona przy odinstalowaniu)
- Zmiana applicationId na `app.spotrobotics.directdrop` (Google Play)

---

## V0.47 (2026-06-22)

### Added
- **Lista postepu wieloplikowego uploadu** - podczas wysylania wielu plikow z PC na telefon kazdy plik ma wlasny wiersz z paskiem postepu
- Naglowek `Connection: close` dla pobran plikow i ZIP (poprawia kompatybilnosc z niektórymi przegladarkami)
- Etykieta SpotRobotics w sekcji About

### Changed
- **Lista urzadzen inline** - lista znalezionych urzadzen wyswietlana jako karty bezposrednio pod statusem polaczenia zamiast w modalnym okienku

### Fixed
- Atrybut `lang` strony HTML teraz zgadza sie z jezykiem wybranym w aplikacji (byl zakodowany na stale jako `pl`)
- `resetUp()` czysci `upSzInfo` aby uniknac wyswietlania nieswiezego rozmiaru przy ponownym uploadzie
- Usunieto zbedne `URLDecoder.decode` (NanoHTTPD juz dekoduje URI)

---

## V0.41 (2026-06-20)

### Added
- **Karta podsumowania pobierania** - po zakonczeniu pobierania kazdego pliku na PC pojawia sie zielona karta z nazwa pliku, rozmiarem i predkoscia transferu (MB/s); karty kumuluja sie dla wielu pobran i mozna je zamknac przyciskiem X

---

## V0.40 (2026-06-20)

### Added
- **Nowa ikona favicon** - niebieska ikona DirectDrop w karcie przegladarki na stronie PC (zamiast domyslnej ikony)
- **Karta podsumowania wysylania** - po wyslaniu plikow z PC na telefon pojawia sie zielona karta z nazwa pliku, lacznie rozmiarem i predkoscia transferu; mozna ja zamknac X, a obszar uploadu od razu wraca do stanu gotowosci

---

## V0.39 (2026-06-20)

### Added
- **Download All as ZIP** - PC page now has a "Download All (ZIP)" button when sharing multiple files; ZIP is streamed without compression (level 0) for maximum speed; per-file progress shown on PC page while download runs
- **Multi-file upload PC to Phone** - PC `<input type=file>` now accepts multiple files at once; files are queued and uploaded sequentially; phone shows full file list with sizes and confirms the whole batch in one tap
- **Android Share Target** - DirectDrop appears in the Android share sheet; files shared from the gallery, file manager, or any app are received as a server-ready transfer session; supports both cold-start and hot-start

### Fixed
- App close is now instant when the server is not running (removed unconditional 1500 ms delay)
- ZIP download completion: PC page now correctly transitions to "All Done" after the ZIP is saved; phone transitions to the completed screen at the same time
- "Download All" ZIP button no longer reappears as downloadable after all individual file buttons have been dismissed

---

## V0.38 (2026-06-18)

### Added
- Server-side multi-file upload intent parsing (JSON array `{"files":[...]}`)
- Sequential upload queue with batch progress counter (`uploadedCount` / `pendingUploadTotal`)

### Changed
- `emitUploadIntent` now sends a file array instead of a single-file event

---

## V0.37 (2026-06-15)

### Added
- Blue DirectDrop branding icon on the PC download page header

### Fixed
- Polish pronoun capitalization on the PC page ("ci" -> "Ci")
- Improved text contrast on the PC download page in light theme

---

## V0.36 (2026-06-10) - Initial Release

- Phone-to-PC file transfer over local Wi-Fi - no cloud, no account, no PC app required
- Embedded HTTP server (NanoHTTPD) serves files directly from the phone
- QR code on sharing screen for instant connection
- Real-time per-file transfer progress on both phone and PC
- PC-to-phone upload (drag and drop or file picker on the PC page)
- Dark / light theme following system preference
- 10 UI languages: Polish, English, Spanish, German, French, Portuguese, Arabic, Russian, Indonesian, Japanese
- Android 8.0+ (API 26) through Android 16 (API 36) compatible
- APK size: ~1.8 MB
