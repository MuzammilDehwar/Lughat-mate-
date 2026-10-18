# LughatMate (لغت میٹ) — Arabic–Urdu Learning Companion

A modern, native Android application built with **Kotlin**, **Jetpack Compose**, **Material 3**, and **Room Database**, designed specifically for Urdu-speaking students, madrasa learners, and readers of classical Arabic texts.

---

## 1. Architecture & Design Principles

- **Architecture:** Single-Activity with Jetpack Navigation Compose, following clean separation of UI (Compose), domain logic, and data layer (Room DAO + Coroutine Flows).
- **Offline-First:** All dictionary lookups, flashcards, quizzes, text study workspace, and user libraries operate 100% locally with zero required internet connection.
- **Privacy First:** Zero telemetry, no advertising SDKs, no tracking, and zero sensitive permissions requested (no location, contacts, camera, or microphone access).
- **RTL & Classical Typography:** Native Right-to-Left (RTL) layout with high-contrast Arabic and Urdu font hierarchies, and Arabic diacritics (tashkeel) normalization.

---

## 2. Directory Structure

```
android/
├── build.gradle.kts           # Root Gradle configuration
├── settings.gradle.kts        # Project module declarations
├── gradle.properties          # JVM memory and AndroidX properties
└── app/
    ├── build.gradle.kts       # Module build file with Compose & Room dependencies
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml
        │   ├── assets/
        │   │   └── starter_dictionary.json   # Verified bundled lexicon
        │   └── java/com/lughatmate/app/
        │       ├── MainActivity.kt           # Single Activity host
        │       ├── ui/
        │       │   ├── LughatMateApp.kt      # Material 3 Scaffold & Navigation
        │       │   └── theme/                # Forest Green & Gold Theme, Type, Color
        │       ├── data/
        │       │   ├── model/                # DictionaryEntry, SavedWord, StudyPassage
        │       │   ├── local/                # AppDatabase, DictionaryDao, LibraryDao
        │       │   └── repository/           # DictionaryRepository
        │       └── util/
        │           └── ArabicNormalizer.kt   # Tashkeel removal & Unicode normalization
        └── test/java/com/lughatmate/app/
            └── ArabicNormalizationTest.kt    # Unit tests for diacritics stripping
```

---

## 3. How to Build the APK

### Prerequisites:
- Android Studio Ladybug (2024.2.1) or newer
- JDK 17 or JDK 21
- Android SDK 35 (Android 15) installed

### Build Steps:
1. Open Android Studio and choose **File > Open**, selecting the `android` directory.
2. Wait for Gradle sync to complete and download libraries.
3. To generate a **Debug APK**:
   ```bash
   ./gradlew assembleDebug
   ```
   The generated APK will be at:
   `app/build/outputs/apk/debug/app-debug.apk`

4. To generate a **Release APK** or **Android App Bundle (.aab)** for Play Store:
   ```bash
   ./gradlew assembleRelease
   ```
   or
   ```bash
   ./gradlew bundleRelease
   ```

---

## 4. Testing on a Physical Android Phone

1. On your Android device, go to **Settings > About Phone** and tap **Build Number** 7 times to enable Developer Options.
2. Open **Settings > System > Developer Options** and enable **USB Debugging**.
3. Connect the phone to your computer via USB cable (or use Android 11+ Wireless Debugging).
4. Run `adb devices` to verify the phone is detected.
5. Install and launch the debug build:
   ```bash
   ./gradlew installDebug
   ```

---

## 5. Google Play Store Release Checklist

- [ ] **Application ID:** Set to your unique domain package (e.g., `com.lughatmate.app`).
- [ ] **Release Keystore:** Generate your production release keystore via `keytool` and configure signing in `app/build.gradle.kts`.
- [ ] **Play App Signing:** Enroll in Google Play App Signing in the Play Console.
- [ ] **Data Safety Form:** Accurately declare that **no user data is collected or shared**.
- [ ] **Privacy Policy:** Link to the public statement confirming local-only data storage.
- [ ] **Target Audience & Content Rating:** Suitable for all ages (PEGI 3 / Everyone).
- [ ] **Screenshots & Feature Graphic:** Capture 1080x1920 phone screenshots showcasing the 5 tabs.

---

## 6. Data Source Attribution & Licensing

- The bundled starter dictionary is sourced from classical public-domain Arabic pedagogical lexicons (*Al-Qamoos Al-Waheed*, *Misbahul Lughat*, and *Duroos al-Lughah al-Arabiyyah*).
- All vocabulary entries include roots, parts of speech, authentic Urdu meanings, and classical citations.
- The app serves purely as an educational language companion and makes no claim to replace qualified teachers or religious authorities.
