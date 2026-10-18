package com.lughatmate.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_words")
data class SavedWord(
    @PrimaryKey val id: String,
    val wordId: String? = null,
    val arabic: String,
    val urdu: String,
    val root: String? = null,
    val personalNotes: String? = null,
    val tag: String? = "عمومی",
    val dateAdded: Long = System.currentTimeMillis()
)
