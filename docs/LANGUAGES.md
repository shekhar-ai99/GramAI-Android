# Languages

| Language | UI text | Voice | Status |
|---|---|---|---|
| English | yes | Android TTS (en-IN) | reviewed |
| Odia | yes | Android TTS (or-IN), needs voice installed | draft, needs native review |
| Hindi | yes | Android TTS (hi-IN) | draft, needs native review. Result text not yet translated (shows English) |
| Santali (Ol Chiki) | yes, **machine translated** (Google Translate) | none on Android | unreviewed. Back-translations in the CSV flag weak strings |
| Ho | no, shows English | none on Android | no machine translation exists; needs a translator and a script decision |

## Notes on the machine-translated Santali
- Terms that came out inconsistent: "expert" appears as two different words, and "Settings", "GramAI" are transliterated.
- Disease and remedy text in `diseases.json` is **not** machine translated. It needs a local expert.

## To finish Santali and Ho
1. Give `ui_strings_translation.csv` to a native speaker. For Ho fill the last column.
2. Decide scripts. Santali: Ol Chiki. Ho: Warang Citi or Devanagari/Odia.
3. Bundle fonts (Noto Sans Ol Chiki, Noto Sans Warang Citi) in `res/font/`. Old Android
   versions lack these glyphs; a bundled font renders them on any version.
4. Record audio per disease and remedy: `assets/audio/<lang>/<id>.mp3`.
5. Update `i18n/Strings.kt` and set `Language.reviewed`.
