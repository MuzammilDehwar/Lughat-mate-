/**
 * Local Storage Persistence Layer for LughatMate
 * Offline-first, privacy-focused: zero remote telemetry or server transmission.
 */

import { DictionaryItem, STARTER_DICTIONARY, SAMPLE_STUDY_PASSAGES } from './starterDictionary';

export interface SavedWordRecord {
  id: string;
  wordId?: string;
  arabic: string;
  urdu: string;
  root?: string;
  personalNotes?: string;
  tag?: string;
  dateAdded: number;
}

export interface SavedPassageRecord {
  id: string;
  title: string;
  arabicText: string;
  urduNotes: string;
  category: string;
  dateSaved: number;
  bookmarked: boolean;
}

export interface PracticeHistoryRecord {
  totalQuizzes: number;
  correctAnswers: number;
  streak: number;
  lastPracticed: number;
  mistakes: string[]; // word IDs that need retry
  dueForReview: string[]; // spaced repetition due words
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'normal' | 'large' | 'extra';
  fontFamily: 'amiri' | 'naskh' | 'system';
  language: 'ur' | 'ar' | 'en';
  hapticFeedback: boolean;
}

export interface FeedbackReport {
  id: string;
  type: 'meaning_correction' | 'technical_bug' | 'suggestion';
  wordOrSubject: string;
  details: string;
  timestamp: number;
}

export interface LibraryExportData {
  version: 1;
  exportDate: string;
  app: 'LughatMate';
  savedWords: SavedWordRecord[];
  savedPassages: SavedPassageRecord[];
  searchHistory: string[];
}

const STORAGE_KEYS = {
  SAVED_WORDS: 'lm_saved_words_v1',
  SAVED_PASSAGES: 'lm_saved_passages_v1',
  SEARCH_HISTORY: 'lm_search_history_v1',
  PRACTICE_STATS: 'lm_practice_stats_v1',
  APP_SETTINGS: 'lm_app_settings_v1',
  FEEDBACK: 'lm_feedback_reports_v1',
  RECENT_WORDS: 'lm_recently_viewed_v1'
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'normal',
  fontFamily: 'amiri',
  language: 'ur',
  hapticFeedback: true
};

const DEFAULT_PRACTICE_STATS: PracticeHistoryRecord = {
  totalQuizzes: 0,
  correctAnswers: 0,
  streak: 0,
  lastPracticed: 0,
  mistakes: [],
  dueForReview: []
};

// Safe JSON parser helper
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

// ==================== SAVED WORDS ====================

export function getSavedWords(): SavedWordRecord[] {
  return safeGet<SavedWordRecord[]>(STORAGE_KEYS.SAVED_WORDS, [
    // Pre-populate with 2 helpful starter saved words
    {
      id: 'sw_ilm',
      wordId: 'w_ilm',
      arabic: 'عِلْمٌ',
      urdu: 'دانش، جاننا، آگاہی، فہم و فراست',
      root: 'ع-ل-م',
      personalNotes: 'حدیث: طلب العلم فريضة على كل مسلم',
      tag: 'علم',
      dateAdded: Date.now() - 86400000
    },
    {
      id: 'sw_hikmah',
      wordId: 'w_hikmah',
      arabic: 'حِكْمَةٌ',
      urdu: 'دانائی، فہم و بصیرت، درست فیصلہ',
      root: 'ح-ك-م',
      personalNotes: 'حکمت مومن کی گمشدہ میراث ہے',
      tag: 'اخلاق',
      dateAdded: Date.now() - 43200000
    }
  ]);
}

export function saveWord(word: SavedWordRecord): void {
  const words = getSavedWords();
  // Prevent duplicate by arabic or wordId
  const existingIndex = words.findIndex(
    w => (w.wordId && w.wordId === word.wordId) || w.arabic === word.arabic
  );
  if (existingIndex >= 0) {
    words[existingIndex] = { ...words[existingIndex], ...word };
  } else {
    words.unshift(word);
  }
  safeSet(STORAGE_KEYS.SAVED_WORDS, words);
}

export function removeSavedWord(id: string): void {
  const words = getSavedWords().filter(w => w.id !== id && w.wordId !== id);
  safeSet(STORAGE_KEYS.SAVED_WORDS, words);
}

export function isWordSaved(wordIdOrArabic: string): boolean {
  const words = getSavedWords();
  return words.some(w => w.wordId === wordIdOrArabic || w.arabic === wordIdOrArabic);
}

// ==================== RECENT SEARCHES ====================

export function getSearchHistory(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.SEARCH_HISTORY, ['علم', 'كتاب', 'حكمة', 'صبر']);
}

export function addSearchHistory(query: string): void {
  const clean = query.trim();
  if (!clean) return;
  const history = getSearchHistory().filter(q => q.toLowerCase() !== clean.toLowerCase());
  history.unshift(clean);
  safeSet(STORAGE_KEYS.SEARCH_HISTORY, history.slice(0, 30));
}

export function clearSearchHistory(): void {
  safeSet(STORAGE_KEYS.SEARCH_HISTORY, []);
}

// ==================== RECENTLY VIEWED WORDS ====================

export function getRecentlyViewedWords(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.RECENT_WORDS, ['w_ilm', 'w_kitab', 'w_hikmah']);
}

export function recordViewedWord(wordId: string): void {
  if (!wordId) return;
  const list = getRecentlyViewedWords().filter(id => id !== wordId);
  list.unshift(wordId);
  safeSet(STORAGE_KEYS.RECENT_WORDS, list.slice(0, 15));
}

// ==================== STUDY PASSAGES ====================

export function getSavedPassages(): SavedPassageRecord[] {
  return safeGet<SavedPassageRecord[]>(
    STORAGE_KEYS.SAVED_PASSAGES,
    SAMPLE_STUDY_PASSAGES.map(p => ({
      id: p.id,
      title: p.title,
      arabicText: p.arabicText,
      urduNotes: p.urduNotes,
      category: p.category,
      dateSaved: Date.now() - 172800000,
      bookmarked: true
    }))
  );
}

export function savePassage(passage: SavedPassageRecord): void {
  const list = getSavedPassages();
  const index = list.findIndex(p => p.id === passage.id);
  if (index >= 0) {
    list[index] = passage;
  } else {
    list.unshift(passage);
  }
  safeSet(STORAGE_KEYS.SAVED_PASSAGES, list);
}

export function deletePassage(id: string): void {
  const list = getSavedPassages().filter(p => p.id !== id);
  safeSet(STORAGE_KEYS.SAVED_PASSAGES, list);
}

// ==================== PRACTICE & REVISION ====================

export function getPracticeStats(): PracticeHistoryRecord {
  return safeGet<PracticeHistoryRecord>(STORAGE_KEYS.PRACTICE_STATS, DEFAULT_PRACTICE_STATS);
}

export function recordQuizResult(correct: boolean, wordId: string): void {
  const stats = getPracticeStats();
  stats.totalQuizzes += 1;
  if (correct) {
    stats.correctAnswers += 1;
    stats.streak += 1;
    // Remove from mistakes if present
    stats.mistakes = stats.mistakes.filter(id => id !== wordId);
  } else {
    stats.streak = 0;
    if (!stats.mistakes.includes(wordId)) {
      stats.mistakes.push(wordId);
    }
  }
  stats.lastPracticed = Date.now();
  safeSet(STORAGE_KEYS.PRACTICE_STATS, stats);
}

export function resetPracticeStats(): void {
  safeSet(STORAGE_KEYS.PRACTICE_STATS, DEFAULT_PRACTICE_STATS);
}

// ==================== SETTINGS ====================

export function getAppSettings(): AppSettings {
  return safeGet<AppSettings>(STORAGE_KEYS.APP_SETTINGS, DEFAULT_SETTINGS);
}

export function updateAppSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  safeSet(STORAGE_KEYS.APP_SETTINGS, updated);
  return updated;
}

// ==================== FEEDBACK ====================

export function saveFeedbackReport(report: Omit<FeedbackReport, 'id' | 'timestamp'>): FeedbackReport {
  const reports = safeGet<FeedbackReport[]>(STORAGE_KEYS.FEEDBACK, []);
  const newReport: FeedbackReport = {
    ...report,
    id: `fb_${Date.now()}`,
    timestamp: Date.now()
  };
  reports.unshift(newReport);
  safeSet(STORAGE_KEYS.FEEDBACK, reports);
  return newReport;
}

export function getFeedbackReports(): FeedbackReport[] {
  return safeGet<FeedbackReport[]>(STORAGE_KEYS.FEEDBACK, []);
}

// ==================== EXPORT / IMPORT ====================

export function exportLibraryJSON(): string {
  const payload: LibraryExportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    app: 'LughatMate',
    savedWords: getSavedWords(),
    savedPassages: getSavedPassages(),
    searchHistory: getSearchHistory()
  };
  return JSON.stringify(payload, null, 2);
}

export function importLibraryJSON(rawJson: string): { success: boolean; message: string; importedCount?: number } {
  try {
    const data = JSON.parse(rawJson);
    if (!data || data.app !== 'LughatMate' || !Array.isArray(data.savedWords)) {
      return {
        success: false,
        message: 'درآمد کردہ فائل کا فارمیٹ ناموزوں ہے۔ براہِ کرم لغت میٹ کی برآمد کردہ JSON فائل منتخب کریں۔'
      };
    }

    const currentWords = getSavedWords();
    const currentPassages = getSavedPassages();

    // Merge saved words safely without duplicates
    const wordMap = new Map<string, SavedWordRecord>();
    currentWords.forEach(w => wordMap.set(w.arabic, w));
    data.savedWords.forEach((w: SavedWordRecord) => {
      if (w.arabic) wordMap.set(w.arabic, w);
    });
    safeSet(STORAGE_KEYS.SAVED_WORDS, Array.from(wordMap.values()));

    // Merge passages
    if (Array.isArray(data.savedPassages)) {
      const passageMap = new Map<string, SavedPassageRecord>();
      currentPassages.forEach(p => passageMap.set(p.id, p));
      data.savedPassages.forEach((p: SavedPassageRecord) => {
        if (p.id && p.arabicText) passageMap.set(p.id, p);
      });
      safeSet(STORAGE_KEYS.SAVED_PASSAGES, Array.from(passageMap.values()));
    }

    return {
      success: true,
      message: 'لائبریری کا ڈیٹا کامیابی سے درآمد کر لیا گیا ہے۔',
      importedCount: data.savedWords.length
    };
  } catch {
    return {
      success: false,
      message: 'فائل کو پڑھنے میں خرابی پیش آئی۔ فائل کا ڈیٹا درست JSON نہیں ہے۔'
    };
  }
}
