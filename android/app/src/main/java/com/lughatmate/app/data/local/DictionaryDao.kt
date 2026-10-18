package com.lughatmate.app.data.local

import androidx.room.*
import com.lughatmate.app.data.model.DictionaryEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface DictionaryDao {
    @Query("SELECT * FROM dictionary_entries ORDER BY arabic ASC")
    fun getAllEntries(): Flow<List<DictionaryEntry>>

    @Query("SELECT * FROM dictionary_entries WHERE id = :id LIMIT 1")
    suspend fun getEntryById(id: String): DictionaryEntry?

    @Query("""
        SELECT * FROM dictionary_entries 
        WHERE arabicNormalized LIKE '%' || :query || '%' 
           OR urdu LIKE '%' || :query || '%'
           OR root LIKE '%' || :query || '%'
        ORDER BY 
           CASE 
               WHEN arabicNormalized = :query THEN 1 
               WHEN arabicNormalized LIKE :query || '%' THEN 2 
               ELSE 3 
           END,
           arabic ASC
    """)
    fun search(query: String): Flow<List<DictionaryEntry>>

    @Query("SELECT * FROM dictionary_entries WHERE root = :root ORDER BY arabic ASC")
    fun getByRoot(root: String): Flow<List<DictionaryEntry>>

    @Query("SELECT COUNT(*) FROM dictionary_entries")
    suspend fun getCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(entries: List<DictionaryEntry>)
}
