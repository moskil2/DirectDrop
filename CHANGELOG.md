# Changelog

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
