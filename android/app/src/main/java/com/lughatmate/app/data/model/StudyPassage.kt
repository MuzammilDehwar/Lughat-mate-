package com.lughatmate.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "study_passages")
data class StudyPassage(
    @PrimaryKey val id: String,
    val title: String,
    val arabicText: String,
    val urduNotes: String,
    val category: String = "عام",
    val dateSaved: Long = System.currentTimeMillis(),
    val bookmarked: Boolean = true
)
