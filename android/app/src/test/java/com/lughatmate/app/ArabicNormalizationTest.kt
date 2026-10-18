package com.lughatmate.app

import com.google.common.truth.Truth.assertThat
import com.lughatmate.app.util.ArabicNormalizer
import org.junit.Test

class ArabicNormalizationTest {

    @Test
    fun normalize_stripsFathaDammaKasraSukun() {
        val input = "عِلْمٌ"
        val normalized = ArabicNormalizer.normalize(input)
        assertThat(normalized).isEqualTo("علم")
    }

    @Test
    fun normalize_stripsShaddaAndTanween() {
        val input = "حِكْمَةً"
        val normalized = ArabicNormalizer.normalize(input)
        assertThat(normalized).isEqualTo("حکمه")
    }

    @Test
    fun normalize_unifiesAlifVariants() {
        assertThat(ArabicNormalizer.normalize("أَرْضٌ")).isEqualTo("ارض")
        assertThat(ArabicNormalizer.normalize("إِلَىٰ")).isEqualTo("الي")
        assertThat(ArabicNormalizer.normalize("آدَابٌ")).isEqualTo("اداب")
    }

    @Test
    fun normalize_handlesPersianUrduKafYeh() {
        val input = "کتاب"
        val normalized = ArabicNormalizer.normalize(input)
        assertThat(normalized).isEqualTo("كتاب")
    }
}
