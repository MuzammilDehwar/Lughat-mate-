/**
 * Arabic language utilities for LughatMate
 * Tashkeel stripping, diacritic normalization, tokenization, and pronunciation.
 */

import { DictionaryItem } from '../data/starterDictionary';

// Arabic Tashkeel Unicode Regex Range
const TASHKEEL_REGEX = /[\u0617-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL_REGEX = /\u0640/g;

/**
 * Strips tashkeel (diacritics), tatweel, and normalizes alif/yaa/taa-marbuta
 * to allow accurate, error-tolerant searching.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove diacritics
    .replace(TASHKEEL_REGEX, '')
    // Remove tatweel (kashida)
    .replace(TATWEEL_REGEX, '')
    // Normalize Alif with Hamza / Maddah to bare Alif
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbutah to Haa (for fuzzy matching)
    .replace(/ة/g, 'ه')
    // Normalize Alif Maqsura to Yaa
    .replace(/ى/g, 'ي')
    // Normalize Persian/Urdu Yeh and Kaf to standard Arabic
    .replace(/ی/g, 'ي')
    .replace(/ک/g, 'ك')
    .trim()
    .toLowerCase();
}

/**
 * Token for interactive text study
 */
export interface TextToken {
  id: string;
  raw: string;
  isWord: boolean;
  normalized?: string;
  matchedEntry?: DictionaryItem;
}

/**
 * Tokenizes Arabic passage into words and separators
 */
export function tokenizeArabicText(
  text: string,
  dictionary: DictionaryItem[]
): TextToken[] {
  if (!text) return [];

  // Match words (Arabic/Urdu letters) vs separators (spaces, punctuation)
  const regex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w]+|[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w\s]+|\s+)/g;
  const matches = text.match(regex) || [];

  // Create dictionary lookup map by normalized word grouped by POS
  const dictGroups = new Map<string, DictionaryItem[]>();
  for (const item of dictionary) {
    const key = normalizeArabic(item.arabic);
    const existing = dictGroups.get(key) || [];
    existing.push(item);
    dictGroups.set(key, existing);
  }

  return matches.map((token, index) => {
    const isWord = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w]/.test(token);
    if (!isWord) {
      return {
        id: `tok_${index}`,
        raw: token,
        isWord: false
      };
    }

    const norm = normalizeArabic(token);
    const hasDefiniteArticle = norm.startsWith('ال') && norm.length > 3;

    let targetStem = norm;
    if (hasDefiniteArticle) {
      targetStem = norm.substring(2);
    } else if (norm.startsWith('و') && norm.length > 2) {
      const withoutWaw = norm.substring(1);
      targetStem = withoutWaw.startsWith('ال') ? withoutWaw.substring(2) : withoutWaw;
    } else if (norm.startsWith('ف') && norm.length > 2) {
      targetStem = norm.substring(1);
    } else if (norm.startsWith('ب') && norm.length > 2) {
      targetStem = norm.substring(1);
    } else if (norm.startsWith('ل') && norm.length > 2) {
      targetStem = norm.substring(1);
    }

    const candidates = dictGroups.get(targetStem) || dictGroups.get(norm);
    let match: DictionaryItem | undefined;

    if (candidates && candidates.length > 0) {
      if (hasDefiniteArticle) {
        // Grammatical rule: The prefix 'ال' is exclusive to nouns (اسماء)
        match = candidates.find(c => c.partOfSpeech === 'اسم') || candidates[0];
      } else {
        match = candidates[0];
      }
    }

    return {
      id: `tok_${index}`,
      raw: token,
      isWord: true,
      normalized: norm,
      matchedEntry: match
    };
  });
}

/**
 * Searches the dictionary with fuzzy relevance scoring
 */
export function searchDictionary(
  query: string,
  items: DictionaryItem[]
): { exactMatches: DictionaryItem[]; relatedMatches: DictionaryItem[] } {
  const cleanQ = query.trim();
  if (!cleanQ) return { exactMatches: [], relatedMatches: [] };

  const normQ = normalizeArabic(cleanQ);
  const cleanQLetters = normQ.replace(/[- \s]/g, '');

  const exact: DictionaryItem[] = [];
  const related: DictionaryItem[] = [];

  for (const item of items) {
    const normItem = normalizeArabic(item.arabic);
    const normRoot = item.root ? normalizeArabic(item.root) : '';
    const cleanRootLetters = normRoot.replace(/[- \s]/g, '');

    // Check exact normalized match
    if (normItem === normQ) {
      exact.push(item);
      continue;
    }

    // Check root match (either formatted with hyphens or continuous letters)
    const isRootMatch =
      cleanRootLetters.length >= 2 &&
      cleanQLetters.length >= 2 &&
      (cleanRootLetters === cleanQLetters || cleanRootLetters.includes(cleanQLetters));

    // Check Arabic word starts with or contains query
    const isArabicMatch =
      normItem.startsWith(normQ) ||
      normItem.includes(normQ) ||
      isRootMatch;

    // Check Urdu meaning match
    const isUrduMatch = item.urdu.toLowerCase().includes(cleanQ.toLowerCase());

    if (isArabicMatch || isUrduMatch) {
      related.push(item);
    }
  }

  return { exactMatches: exact, relatedMatches: related };
}

/**
 * Native Arabic speech synthesis for pronunciation practice
 */
export function speakArabicWord(arabicText: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(arabicText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85; // Scholarly deliberate pace
    utterance.pitch = 1.0;

    // Pick best Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arVoice) {
      utterance.voice = arVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
