package com.lughatmate.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "dictionary_entries")
data class DictionaryEntry(
    @PrimaryKey val id: String,
    val arabic: String,
    val arabicNormalized: String,
    val urdu: String,
    val partOfSpeech: String,
    val root: String? = null,
    val singularPlural: String? = null,
    val exampleArabic: String? = null,
    val exampleUrdu: String? = null,
    val source: String,
    val verified: Boolean = true,
    val category: String? = null
)
