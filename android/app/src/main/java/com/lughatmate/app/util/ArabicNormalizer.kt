package com.lughatmate.app.util

/**
 * Utility for normalizing Arabic and Urdu text for error-tolerant search.
 * Removes harakat (tashkeel), tatweel, and normalizes alif variants.
 */
object ArabicNormalizer {
    private val TASHKEEL_REGEX = Regex("[\\u0617-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]")
    private val TATWEEL_REGEX = Regex("\\u0640")

    fun normalize(text: String): String {
        return text
            .replace(TASHKEEL_REGEX, "")
            .replace(TATWEEL_REGEX, "")
            .replace(Regex("[أإآٱ]"), "ا")
            .replace("ة", "ه")
            .replace("ى", "ي")
            .replace("ی", "ي")
            .replace("ک", "ك")
            .trim()
            .lowercase()
    }
}
