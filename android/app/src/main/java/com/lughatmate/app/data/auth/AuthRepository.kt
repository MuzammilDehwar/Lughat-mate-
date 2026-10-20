package com.lughatmate.app.data.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await

data class UserProfile(
    val uid: String,
    val email: String?,
    val displayName: String?,
    val isEmailVerified: Boolean,
    val isGuest: Boolean = false
)

class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    private val _currentUser = MutableStateFlow<UserProfile?>(getCurrentProfile())
    val currentUser: StateFlow<UserProfile?> = _currentUser.asStateFlow()

    init {
        auth.addAuthStateListener { firebaseAuth ->
            _currentUser.value = firebaseAuth.currentUser?.let { user ->
                UserProfile(
                    uid = user.uid,
                    email = user.email,
                    displayName = user.displayName ?: "طالب علم",
                    isEmailVerified = user.isEmailVerified,
                    isGuest = false
                )
            }
        }
    }

    private fun getCurrentProfile(): UserProfile? {
        val user = auth.currentUser ?: return null
        return UserProfile(
            uid = user.uid,
            email = user.email,
            displayName = user.displayName ?: "طالب علم",
            isEmailVerified = user.isEmailVerified,
            isGuest = false
        )
    }

    suspend fun signInWithEmail(email: String, pass: String): Result<UserProfile> {
        return try {
            val result = auth.signInWithEmailAndPassword(email.trim(), pass).await()
            val user = result.user ?: throw Exception("صارف کا ڈیٹا موصول نہیں ہوا")
            Result.success(
                UserProfile(
                    uid = user.uid,
                    email = user.email,
                    displayName = user.displayName ?: "طالب علم",
                    isEmailVerified = user.isEmailVerified
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signUpWithEmail(email: String, pass: String, fullName: String): Result<UserProfile> {
        return try {
            val result = auth.createUserWithEmailAndPassword(email.trim(), pass).await()
            val user = result.user ?: throw Exception("اکاؤنٹ بنانے میں رکاوٹ")

            val profileUpdates = UserProfileChangeRequest.Builder()
                .setDisplayName(fullName.trim())
                .build()
            user.updateProfile(profileUpdates).await()

            try {
                user.sendEmailVerification().await()
            } catch (_: Exception) {}

            Result.success(
                UserProfile(
                    uid = user.uid,
                    email = user.email,
                    displayName = fullName.trim(),
                    isEmailVerified = user.isEmailVerified
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> {
        return try {
            auth.sendPasswordResetEmail(email.trim()).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendEmailVerification(): Result<Unit> {
        return try {
            auth.currentUser?.sendEmailVerification()?.await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun continueAsGuest() {
        _currentUser.value = UserProfile(
            uid = "guest_user",
            email = null,
            displayName = "مہمان طالب علم",
            isEmailVerified = false,
            isGuest = true
        )
    }

    fun signOut() {
        auth.signOut()
        _currentUser.value = null
    }

    suspend fun deleteAccount(): Result<Unit> {
        return try {
            auth.currentUser?.delete()?.await()
            _currentUser.value = null
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
