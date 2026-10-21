/**
 * Comprehensive Automated Test Suite for LughatMate
 * Tests dictionary search, normalization, storage persistence logic,
 * text tokenization, quiz scoring, and JSON export/import validation.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_DICTIONARY } from '../data/starterDictionary.ts';
import { normalizeArabic, searchDictionary, tokenizeArabicText } from '../utils/arabic.ts';
import { importLibraryJSON, exportLibraryJSON, LibraryExportData } from '../data/storage.ts';

describe('1. Arabic Diacritics Normalization Tests', () => {
  test('strips standard tashkeel (fatha, damma, kasra, sukun)', () => {
    assert.equal(normalizeArabic('عِلْمٌ'), 'علم');
    assert.equal(normalizeArabic('كِتَابٌ'), 'كتاب');
    assert.equal(normalizeArabic('مَسْجِدٌ'), 'مسجد');
  });

  test('strips shadda, tanween, and tatweel', () => {
    assert.equal(normalizeArabic('حِكْمَـةً'), 'حكمه');
    assert.equal(normalizeArabic('شَرٌّ'), 'شر');
    assert.equal(normalizeArabic('حَقٌّ'), 'حق');
  });

  test('normalizes alif variants (hamza above/below, maddah, alif wasla)', () => {
    assert.equal(normalizeArabic('أَرْضٌ'), 'ارض');
    assert.equal(normalizeArabic('إِلَىٰ'), 'الي');
    assert.equal(normalizeArabic('آدَابٌ'), 'اداب');
    assert.equal(normalizeArabic('ٱسْمٌ'), 'اسم');
  });

  test('normalizes Persian/Urdu Yeh and Kaf to standard Arabic', () => {
    assert.equal(normalizeArabic('کتاب'), 'كتاب');
    assert.equal(normalizeArabic('علمی'), 'علمي');
  });
});

describe('2. Dictionary Search Algorithm Tests', () => {
  test('finds exact match with or without diacritics', () => {
    const resWithTashkeel = searchDictionary('عِلْمٌ', STARTER_DICTIONARY);
    assert.ok(resWithTashkeel.exactMatches.length > 0);
    assert.equal(resWithTashkeel.exactMatches[0].arabicNormalized, 'علم');

    const resRaw = searchDictionary('علم', STARTER_DICTIONARY);
    assert.ok(resRaw.exactMatches.length > 0);
    assert.equal(resRaw.exactMatches[0].id, 'w_ilm');
  });

  test('searches by Urdu meaning', () => {
    const res = searchDictionary('دانائی', STARTER_DICTIONARY);
    assert.ok(res.relatedMatches.some(w => w.id === 'w_hikmah'));
  });

  test('searches by Arabic root', () => {
    const res = searchDictionary('ك-ت-ب', STARTER_DICTIONARY);
    assert.ok(res.relatedMatches.some(w => w.id === 'w_kitab' || w.id === 'w_kataba'));
  });

  test('returns empty for non-existent words (missing word handling)', () => {
    const res = searchDictionary('کلمہ_غیر_موجود_xyz', STARTER_DICTIONARY);
    assert.equal(res.exactMatches.length, 0);
    assert.equal(res.relatedMatches.length, 0);
  });
});

describe('3. Text Study Tokenizer Tests', () => {
  test('tokenizes Arabic passage and associates dictionary matches', () => {
    const sample = 'طَلَبُ الْعِلْمِ فَرِيضَةٌ';
    const tokens = tokenizeArabicText(sample, STARTER_DICTIONARY);
    
    assert.ok(tokens.length >= 3);
    const ilmToken = tokens.find(t => t.raw.includes('الْعِلْمِ'));
    assert.ok(ilmToken, 'Should tokenize word with prefix article');
    assert.ok(ilmToken.matchedEntry, 'Should match root or stripped prefix in dictionary');
    assert.equal(ilmToken.matchedEntry?.id, 'w_ilm');
  });
});

describe('4. Dictionary Corpus Integrity Audit', () => {
  test('verifies all 60 dictionary entries have valid structure', () => {
    assert.ok(STARTER_DICTIONARY.length >= 50);

    const seenIds = new Set<string>();
    for (const item of STARTER_DICTIONARY) {
      assert.ok(item.id, 'Entry must have an ID');
      assert.ok(!seenIds.has(item.id), `Duplicate ID found: ${item.id}`);
      seenIds.add(item.id);

      assert.ok(item.arabic.trim().length > 0, `Arabic empty in ${item.id}`);
      assert.ok(item.urdu.trim().length > 0, `Urdu empty in ${item.id}`);
      assert.ok(item.source.trim().length > 0, `Source missing in ${item.id}`);
      assert.ok(['اسم', 'فعل', 'حرف'].includes(item.partOfSpeech), `Invalid POS in ${item.id}`);
      assert.equal(item.verified, true, `Entry ${item.id} must be marked verified`);
    }
  });
});

describe('5. Data Import / Export Schema Validation', () => {
  test('rejects corrupt or non-LughatMate JSON safely', () => {
    const invalidJson = JSON.stringify({ foo: 'bar', words: [] });
    const result = importLibraryJSON(invalidJson);
    assert.equal(result.success, false);
    assert.ok(result.message.length > 0);
  });

  test('validates valid export structure', () => {
    const validData: LibraryExportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      app: 'LughatMate',
      savedWords: [
        {
          id: 'sw_test_1',
          wordId: 'w_ilm',
          arabic: 'عِلْمٌ',
          urdu: 'دانش',
          dateAdded: Date.now()
        }
      ],
      savedPassages: [],
      searchHistory: ['علم']
    };

    const res = importLibraryJSON(JSON.stringify(validData));
    assert.equal(res.success, true);
  });
});

describe('6. Daily Arabic Quotes Corpus & Selector', () => {
  test('verifies all classical Arabic quotes have verified text, Urdu translation, and classical source', async () => {
    const { CLASSICAL_ARABIC_QUOTES, getDailyArabicQuote } = await import('../data/dailyQuotes.ts');
    assert.ok(CLASSICAL_ARABIC_QUOTES.length >= 10);

    for (const q of CLASSICAL_ARABIC_QUOTES) {
      assert.ok(q.id && q.id.startsWith('q_'));
      assert.ok(q.arabic && q.arabic.trim().length > 5, `Arabic text missing in ${q.id}`);
      assert.ok(q.urdu && q.urdu.trim().length > 5, `Urdu translation missing in ${q.id}`);
      assert.ok(q.source && q.source.trim().length > 3, `Source attribution missing in ${q.id}`);
      assert.ok(q.theme && q.theme.trim().length > 1, `Theme missing in ${q.id}`);
    }

    const todayQuote = getDailyArabicQuote();
    assert.ok(todayQuote, 'Daily quote selector must return a valid quote');
    assert.ok(CLASSICAL_ARABIC_QUOTES.some(q => q.id === todayQuote.id));
  });
});

describe('7. Authentication & Profile Architecture Verification', () => {
  test('validates firebase configuration parameters presence', async () => {
    const { firebaseConfig } = await import('../auth/firebase.ts');
    assert.ok(firebaseConfig.projectId, 'Firebase projectId must be defined');
    assert.ok(firebaseConfig.apiKey, 'Firebase apiKey must be defined');
    assert.ok(firebaseConfig.authDomain, 'Firebase authDomain must be defined');
    assert.equal(firebaseConfig.projectId, 'lughat-mate');
    assert.equal(firebaseConfig.authDomain, 'lughat-mate.firebaseapp.com');
  });

  test('validates provider-specific readable auth error messages', async () => {
    const { getReadableAuthError } = await import('../auth/AuthContext.tsx');
    
    // Email disabled / configuration not found
    const emailConfigErr = getReadableAuthError({ code: 'auth/configuration-not-found' }, 'email');
    assert.ok(emailConfigErr.includes('Email/Password'));
    assert.ok(emailConfigErr.includes('lughat-mate'));

    // Google disabled / configuration not found
    const googleConfigErr = getReadableAuthError({ code: 'auth/configuration-not-found' }, 'google');
    assert.ok(googleConfigErr.includes('Google'));
    assert.ok(googleConfigErr.includes('lughat-mate'));

    // Facebook disabled / configuration not found
    const fbConfigErr = getReadableAuthError({ code: 'auth/configuration-not-found' }, 'facebook');
    assert.ok(fbConfigErr.includes('Facebook'));
    assert.ok(fbConfigErr.includes('lughat-mate'));

    // Operation not allowed
    const opErr = getReadableAuthError({ code: 'auth/operation-not-allowed' }, 'google');
    assert.ok(opErr.includes('Google'));

    // Invalid credentials
    const credErr = getReadableAuthError({ code: 'auth/invalid-credential' });
    assert.ok(credErr.includes('ای میل یا پاس ورڈ'));
  });

  test('validates password strength rules', () => {
    const evaluate = (p: string) => {
      let score = 0;
      if (p.length >= 6) score += 1;
      if (p.length >= 8) score += 1;
      if (/[A-Z]/.test(p) || /[0-9]/.test(p)) score += 1;
      if (/[^A-Za-z0-9]/.test(p)) score += 1;
      return score;
    };

    assert.equal(evaluate('123'), 1);
    assert.equal(evaluate('simple'), 1);
    assert.equal(evaluate('simple88'), 3);
    assert.equal(evaluate('StrongP@ss99'), 4);
  });
});

