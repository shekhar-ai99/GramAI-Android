package com.example.gramai.i18n

import java.util.Locale

/**
 * Languages the app can show. [nativeName] is what the picker displays, in the
 * language's own script, so a reader can find theirs without reading English.
 *
 * [ttsLocale] is null where Android ships no text-to-speech voice (Santali, Ho).
 * Those languages need pre-recorded audio, see TODO.md.
 * [reviewed] is false until a native speaker has signed off the UI text; the
 * picker marks unreviewed languages and the app falls back to English strings.
 */
enum class Language(
    val code: String,
    val nativeName: String,
    val ttsLocale: Locale?,
    val reviewed: Boolean
) {
    ODIA("or", "ଓଡ଼ିଆ", Locale("or", "IN"), reviewed = false),
    ENGLISH("en", "English", Locale("en", "IN"), reviewed = true),
    HINDI("hi", "हिन्दी", Locale("hi", "IN"), reviewed = false),
    // Ol Chiki script. Needs Noto Sans Ol Chiki bundled (older phones lack it).
    SANTALI("sat", "ᱥᱟᱱᱛᱟᱲᱤ", null, reviewed = false),
    // Script (Warang Citi vs Devanagari/Odia) is undecided, so the name is Latin for now.
    HO("hoc", "Ho", null, reviewed = false);

    /** True when the app has UI text written for this language (not the English fallback). */
    val hasUiText: Boolean get() = this == ODIA || this == ENGLISH || this == HINDI

    companion object {
        fun fromCode(code: String?): Language = values().firstOrNull { it.code == code } ?: ODIA
    }
}
