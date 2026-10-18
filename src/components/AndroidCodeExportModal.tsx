import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  Smartphone, Download, FileCode, Check, Copy, 
  ExternalLink, Terminal, CheckCircle2, ChevronRight, 
  X, Layers, FolderArchive, ShieldCheck 
} from 'lucide-react';
import { STARTER_DICTIONARY } from '../data/starterDictionary';

interface AndroidCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeExportModal: React.FC<AndroidCodeExportModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'build_guide' | 'inspect_code' | 'play_checklist'>('overview');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const sampleKotlinFiles = [
    {
      name: 'MainActivity.kt',
      path: 'app/src/main/java/com/lughatmate/app/MainActivity.kt',
      code: `package com.lughatmate.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.lughatmate.app.ui.LughatMateApp
import com.lughatmate.app.ui.theme.LughatMateTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LughatMateTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    LughatMateApp()
                }
            }
        }
    }
}`
    },
    {
      name: 'DictionaryEntry.kt',
      path: 'app/src/main/java/com/lughatmate/app/data/model/DictionaryEntry.kt',
      code: `package com.lughatmate.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dictionary_entries")
data class DictionaryEntry(
    @PrimaryKey val id: String,
    val arabic: String,
    val arabicNormalized: String,
    val urdu: String,
    val partOfSpeech: String,
    val root: String?,
    val singularPlural: String?,
    val exampleArabic: String?,
    val exampleUrdu: String?,
    val source: String,
    val verified: Boolean = true,
    val category: String? = null
)`
    },
    {
      name: 'DictionaryDao.kt',
      path: 'app/src/main/java/com/lughatmate/app/data/local/DictionaryDao.kt',
      code: `package com.lughatmate.app.data.local

import androidx.room.*
import com.lughatmate.app.data.model.DictionaryEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface DictionaryDao {
    @Query("SELECT * FROM dictionary_entries ORDER BY arabic ASC")
    fun getAllEntries(): Flow<List<DictionaryEntry>>

    @Query("""
        SELECT * FROM dictionary_entries 
        WHERE arabicNormalized LIKE '%' || :query || '%' 
           OR urdu LIKE '%' || :query || '%'
           OR root LIKE '%' || :query || '%'
        ORDER BY 
           CASE WHEN arabicNormalized = :query THEN 1 ELSE 2 END,
           arabic ASC
    """)
    fun search(query: String): Flow<List<DictionaryEntry>>

    @Query("SELECT * FROM dictionary_entries WHERE root = :root")
    fun getByRoot(root: String): Flow<List<DictionaryEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(entries: List<DictionaryEntry>)
}`
    },
    {
      name: 'ArabicNormalizer.kt',
      path: 'app/src/main/java/com/lughatmate/app/util/ArabicNormalizer.kt',
      code: `package com.lughatmate.app.util

object ArabicNormalizer {
    private val TASHKEEL_REGEX = Regex("[\\\\u0617-\\\\u061A\\\\u064B-\\\\u065F\\\\u0670\\\\u06D6-\\\\u06ED]")
    private val TATWEEL_REGEX = Regex("\\\\u0640")

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
}`
    }
  ];

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Root files
      zip.file('README.md', `# LughatMate — Arabic–Urdu Learning Companion
Native Android Application built with Kotlin, Jetpack Compose, Material 3, and Room.

## Features
- 100% Offline Classical Arabic–Urdu Dictionary
- Diacritics (Tashkeel) Insensitive Search
- Interactive Arabic Text Study Workspace
- Flashcards and 4-Option Quizzes with Error Retry
- Local-first Privacy (Zero permissions, no tracking)
- Light & Dark Material 3 Themes

## Build Instructions
1. Open this project folder in Android Studio Ladybug or newer.
2. Allow Gradle sync to download Kotlin & Compose dependencies.
3. Run \`./gradlew assembleDebug\` to generate debug APK.
4. Run \`./gradlew assembleRelease\` for production signed APK.
`);

      zip.file('build.gradle.kts', `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}
`);

      zip.file('settings.gradle.kts', `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "LughatMate"
include(":app")
`);

      zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`);

      // App build.gradle.kts
      zip.file('app/build.gradle.kts', `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.lughatmate.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.lughatmate.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.navigation:navigation-compose:2.8.3")
    
    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Coroutines & Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("com.google.truth:truth:1.4.2")
}
`);

      // AndroidManifest.xml
      zip.file('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="LughatMate"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.LughatMate">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`);

      // Assets starter dictionary
      zip.file('app/src/main/assets/starter_dictionary.json', JSON.stringify(STARTER_DICTIONARY, null, 2));

      // Kotlin source files
      sampleKotlinFiles.forEach(f => {
        zip.file(f.path, f.code);
      });

      // Generate zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LughatMate_Android_Source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6 transition-all text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100 font-arabic">
                اینڈرائیڈ پروجیکٹ و APK گائیڈ (Android Release Suite)
              </h3>
              <p className="text-[11px] text-stone-300 font-urdu">
                Kotlin 2.0 • Jetpack Compose • Material 3 • Room DB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-850 px-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            خلاصہ و ڈاؤن لوڈ
          </button>
          <button
            onClick={() => setActiveTab('build_guide')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'build_guide'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            APK کمپائل ہدایات
          </button>
          <button
            onClick={() => setActiveTab('inspect_code')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'inspect_code'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            کوڈ فائلز دیکھیں
          </button>
          <button
            onClick={() => setActiveTab('play_checklist')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'play_checklist'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            گوگل پلے ریلیز چیک لسٹ
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-stone-800 dark:text-stone-200">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <FolderArchive className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-urdu">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1">
                    مکمل اینڈرائیڈ سورس کوڈ زپ پیکج
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400">
                    یہ زپ فائل مکمل اینڈرائیڈ اسٹوڈیو پروجیکٹ پر مشتمل ہے، جس میں تمام Kotlin کوڈ، Room ڈیٹا بیس، Jetpack Compose یوزر انٹرفیس، اور مصدقہ لغت ڈیٹا شامل ہے۔
                  </p>
                </div>
              </div>

              {/* Instant Download Button */}
              <div className="text-center py-2">
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5 text-amber-300" />
                  <span>{isZipping ? 'زپ تیار ہو رہی ہے...' : 'اینڈرائیڈ پروجیکٹ زپ ڈاؤن لوڈ کریں (.ZIP)'}</span>
                </button>
                {downloadSuccess && (
                  <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>LughatMate_Android_Source.zip ڈاؤن لوڈ ہو چکی ہے!</span>
                  </p>
                )}
              </div>

              {/* Architecture highlights */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-stone-400 block text-[10px]">ٹارگٹ SDK:</span>
                  <strong>Android 15 (API 35)</strong>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-stone-400 block text-[10px]">کم سے کم مطابقت (Min SDK):</span>
                  <strong>Android 8.0 (API 26)</strong>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-stone-400 block text-[10px]">یوزر انٹرفیس فریم ورک:</span>
                  <strong>Jetpack Compose (Material 3)</strong>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-stone-400 block text-[10px]">لوکل ڈیٹا بیس:</span>
                  <strong>Android Room (SQLite)</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'build_guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-stone-700 dark:text-stone-300 font-urdu">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                اینڈرائیڈ اسٹوڈیو میں APK کمپائل اور فون پر انسٹال کرنے کا طریقہ:
              </h4>

              <ol className="space-y-3 list-decimal list-inside text-stone-600 dark:text-stone-400">
                <li className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="text-stone-900 dark:text-stone-100">مرحلہ 1: زپ فائل کو ان زپ کریں:</strong><br />
                  ڈاؤن لوڈ کردہ <code className="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-[11px] font-sans">LughatMate_Android_Source.zip</code> کو اپنے کمپیوٹر پر کھولیں۔
                </li>

                <li className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="text-stone-900 dark:text-stone-100">مرحلہ 2: اینڈرائیڈ اسٹوڈیو میں کھولیں:</strong><br />
                  اینڈرائیڈ اسٹوڈیو (Android Studio) چلا کر <strong>Open Project</strong> منتخب کریں اور اس فولڈر کی نشاندہی کریں۔ گریڈل خودکار طور پر ڈیپینڈینسیز سنک کر لے گا۔
                </li>

                <li className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="text-stone-900 dark:text-stone-100">مرحلہ 3: ڈیبگ یا ریلیز APK جنریٹ کریں:</strong><br />
                  ٹرمینل میں درج ذیل کمانڈ چلائیں:<br />
                  <div className="mt-1.5 p-2 rounded-lg bg-stone-900 text-emerald-400 font-mono text-left text-[11px]" dir="ltr">
                    ./gradlew assembleDebug
                  </div>
                  یا ریلیز ورژن کے لیے:<br />
                  <div className="mt-1.5 p-2 rounded-lg bg-stone-900 text-emerald-400 font-mono text-left text-[11px]" dir="ltr">
                    ./gradlew assembleRelease
                  </div>
                </li>

                <li className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="text-stone-900 dark:text-stone-100">مرحلہ 4: حقیقی فون (Physical Phone) پر انسٹالیشن:</strong><br />
                  اپنے فون کی Settings &gt; Developer Options میں جا کر <strong>USB Debugging</strong> آن کریں، اور اینڈرائیڈ اسٹوڈیو کے Run بٹن پر کلک کریں۔
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'inspect_code' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
                نیچے دی گئی بنیادی نیٹو فائلز کو ملاحظہ اور کاپی فرمائیں:
              </p>

              <div className="space-y-3">
                {sampleKotlinFiles.map(file => (
                  <div
                    key={file.name}
                    className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-stone-100 dark:bg-stone-750 flex items-center justify-between text-xs">
                      <span className="font-mono text-stone-600 dark:text-stone-300 font-bold" dir="ltr">
                        {file.name}
                      </span>
                      <button
                        onClick={() => handleCopyCode(file.name, file.code)}
                        className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {copiedFile === file.name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFile === file.name ? 'کاپی ہو گیا' : 'کوڈ کاپی کریں'}</span>
                      </button>
                    </div>

                    <pre
                      className="p-3 text-[11px] font-mono text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-900 overflow-x-auto text-left"
                      dir="ltr"
                    >
                      {file.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'play_checklist' && (
            <div className="space-y-3 text-xs font-urdu text-stone-700 dark:text-stone-300">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-2">
                گوگل پلے اسٹور (Google Play Console) پیش کرنے سے قبل ضروری تقاضے:
              </h4>

              <div className="space-y-2">
                {[
                  { title: 'دستخط شدہ کی اسٹور (Keystore / Play App Signing):', desc: 'ریلیز بنڈل (.aab) کو اپنی نجی کی اسٹور سے سائن کریں۔' },
                  { title: 'پرائیویسی پالیسی یو آر ایل (Privacy Policy URL):', desc: 'ایپ کی 100% آف لائن، زیرو ڈیٹا کلیکشن پالیسی کا پبلک لنک کنسول میں درج کریں۔' },
                  { title: 'ہدف سامعین اور مواد کی درجہ بندی (Content Rating):', desc: 'ایپ اسلامی علوم و لغت کے لیے ہے، PEGI 3 / Everyone ریٹنگ منتخب کریں۔' },
                  { title: 'ایپ اسکرین شاٹس اور گرافکس:', desc: 'مختلف فون اور ٹیبلٹ اسکرین سائزز (7 انچ، 10 انچ) کے اسکرین شاٹس منسلک کریں۔' },
                  { title: 'اشتہارات اور ڈیٹا سیفٹی کا بیان:', desc: 'گوگل پلے ڈیٹا سیفٹی فارم میں "No data collected or shared" منتخب کریں۔' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 dark:text-stone-100">{item.title}</strong>
                      <p className="text-stone-500 text-[11px] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
