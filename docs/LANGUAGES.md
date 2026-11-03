# Languages

| Language | UI text | Voice | Status |
|---|---|---|---|
| English | yes | Android TTS (en-IN) | reviewed |
| Odia | yes | Android TTS (or-IN), needs voice installed | draft, needs native review |
| Hindi | yes | Android TTS (hi-IN) | draft, needs native review. Result text not yet translated (shows English) |
| Santali | no, shows English | none on Android | needs translation + Ol Chiki font + recorded audio |
| Ho | no, shows English | none on Android | needs translation + script decision + font + recorded audio |

## To finish Santali and Ho
1. Give `ui_strings_translation.csv` to a native speaker (and a local expert for the
   disease and remedy text in `diseases.json`). Do not machine-translate remedies.
2. Decide scripts. Santali: Ol Chiki (recommended, official). Ho: Warang Citi or Devanagari/Odia.
3. Bundle fonts (Noto Sans Ol Chiki, Noto Sans Warang Citi) in `res/font/`. Old Android
   versions lack these glyphs; a bundled font renders them on any version.
4. Record audio per disease and remedy, saved as `assets/audio/<lang>/<id>.mp3`.
5. Add the strings to `i18n/Strings.kt` and set `Language.hasUiText` and `reviewed`.
