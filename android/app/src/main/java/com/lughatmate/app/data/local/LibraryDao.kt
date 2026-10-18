package com.lughatmate.app.data.local

import androidx.room.*
import com.lughatmate.app.data.model.SavedWord
import com.lughatmate.app.data.model.StudyPassage
import kotlinx.coroutines.flow.Flow

@Dao
interface LibraryDao {
    // Saved Words
    @Query("SELECT * FROM saved_words ORDER BY dateAdded DESC")
    fun getAllSavedWords(): Flow<List<SavedWord>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSavedWord(word: SavedWord)

    @Delete
    suspend fun deleteSavedWord(word: SavedWord)

    @Query("DELETE FROM saved_words WHERE id = :id OR wordId = :id")
    suspend fun deleteSavedWordById(id: String)

    @Query("SELECT EXISTS(SELECT 1 FROM saved_words WHERE id = :id OR wordId = :id OR arabic = :arabic)")
    suspend fun isWordSaved(id: String, arabic: String): Boolean

    // Study Passages
    @Query("SELECT * FROM study_passages ORDER BY dateSaved DESC")
    fun getAllPassages(): Flow<List<StudyPassage>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPassage(passage: StudyPassage)

    @Delete
    suspend fun deletePassage(passage: StudyPassage)

    @Query("DELETE FROM study_passages WHERE id = :id")
    suspend fun deletePassageById(id: String)
}
