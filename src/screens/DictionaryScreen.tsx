import React, { useState, useEffect, useMemo } from 'react';
import { STARTER_DICTIONARY, DictionaryItem } from '../data/starterDictionary';
import { 
  searchDictionary, 
  normalizeArabic, 
  speakArabicWord 
} from '../utils/arabic';
import { 
  getSearchHistory, 
  addSearchHistory, 
  clearSearchHistory, 
  isWordSaved, 
  saveWord, 
  removeSavedWord, 
  recordViewedWord 
} from '../data/storage';
import { 
  Search, X, Volume2, Bookmark, BookmarkCheck, 
  Sparkles, Filter, History, Trash2, Plus, 
  Check, Share2, Info, BookOpen 
} from 'lucide-react';

interface DictionaryScreenProps {
  initialQuery?: string;
  onOpenWord: (item: DictionaryItem) => void;
  rootFilter?: string | null;
  onClearRootFilter?: () => void;
}

export const DictionaryScreen: React.FC<DictionaryScreenProps> = ({
  initialQuery = '',
  onOpenWord,
  rootFilter = null,
  onClearRootFilter
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedPos, setSelectedPos] = useState<'all' | 'اسم' | 'فعل' | 'حرف'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchHistoryList, setSearchHistoryList] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [missingWordSavedNotice, setMissingWordSavedNotice] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customArabic, setCustomArabic] = useState('');
  const [customUrdu, setCustomUrdu] = useState('');

  useEffect(() => {
    setSearchHistoryList(getSearchHistory());
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      addSearchHistory(initialQuery);
      setSearchHistoryList(getSearchHistory());
    }
  }, [initialQuery]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    STARTER_DICTIONARY.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, []);

  // Filtered and searched items
  const searchResults = useMemo(() => {
    let base = STARTER_DICTIONARY;

    // Filter by root if provided
    if (rootFilter) {
      base = base.filter(item => item.root && item.root === rootFilter);
    }

    // Filter by part of speech
    if (selectedPos !== 'all') {
      base = base.filter(item => item.partOfSpeech === selectedPos);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      base = base.filter(item => item.category === selectedCategory);
    }

    // If query is empty, return base list
    if (!query.trim()) {
      return { exactMatches: [], list: base };
    }

    const { exactMatches, relatedMatches } = searchDictionary(query, base);
    return {
      exactMatches,
      list: [...exactMatches, ...relatedMatches]
    };
  }, [query, selectedPos, selectedCategory, rootFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearchHistory(query.trim());
      setSearchHistoryList(getSearchHistory());
      setShowHistory(false);
    }
  };

  const handleSelectHistory = (h: string) => {
    setQuery(h);
    addSearchHistory(h);
    setSearchHistoryList(getSearchHistory());
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistoryList([]);
  };

  const handleInsertChar = (char: string) => {
    setQuery(prev => prev + char);
  };

  const handleSaveMissingWord = () => {
    if (!query.trim()) return;
    saveWord({
      id: `sw_${Date.now()}`,
      arabic: query.trim(),
      urdu: 'ذاتی مطالعہ کے لیے زیرِ تحقیق لفظ',
      tag: 'تحقیقی لفظ',
      dateAdded: Date.now()
    });
    setMissingWordSavedNotice(true);
    setTimeout(() => setMissingWordSavedNotice(false), 2500);
  };

  const handleSaveCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customArabic.trim()) return;
    saveWord({
      id: `sw_${Date.now()}`,
      arabic: customArabic.trim(),
      urdu: customUrdu.trim() || 'ذاتی اندراج',
      tag: 'کسٹم اندراج',
      dateAdded: Date.now()
    });
    setShowAddCustomModal(false);
    setCustomArabic('');
    setCustomUrdu('');
    setMissingWordSavedNotice(true);
    setTimeout(() => setMissingWordSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-5 pb-24" dir="rtl">
      {/* Title & Root filter alert if active */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-arabic text-emerald-950 dark:text-emerald-200">
            عربی–اردو جامع لغت (Dictionary)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
            اعراب و تشکیلی علامات سے بے نیاز سمارٹ سرچ۔ کل اندراجات: {STARTER_DICTIONARY.length} الفاظ
          </p>
        </div>

        {rootFilter && (
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-xl text-xs">
            <span>مادہ سے فلٹر شدہ: <strong className="font-arabic text-sm">{rootFilter}</strong></span>
            <button
              onClick={onClearRootFilter}
              className="text-stone-500 hover:text-stone-900 dark:hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search Input Bar with Clear and History */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (!showHistory && e.target.value === '') setShowHistory(true);
            }}
            onFocus={() => setShowHistory(true)}
            placeholder="عربی لفظ، اردو معنی یا مادہ تلاش کریں..."
            className="w-full pl-24 pr-11 py-3 text-sm sm:text-base rounded-2xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border border-stone-300 dark:border-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-arabic"
          />
          <Search className="w-5 h-5 absolute right-3.5 text-emerald-800 dark:text-emerald-400" />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (onClearRootFilter) onClearRootFilter();
              }}
              className="absolute left-16 p-1 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          <button
            type="submit"
            className="absolute left-2 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            تلاش
          </button>
        </form>

        {/* Quick Arabic Character Helper Bar */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">خصوصی حروف:</span>
          {['ء', 'آ', 'أ', 'إ', 'ة', 'ى', 'ئ', 'ؤ'].map(char => (
            <button
              key={char}
              type="button"
              onClick={() => handleInsertChar(char)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-800 hover:text-white text-stone-800 dark:text-stone-200 font-arabic font-bold text-sm border border-stone-200 dark:border-stone-700 transition"
              title={`حرف ${char} شامل کریں`}
            >
              {char}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAddCustomModal(true)}
            className="mr-auto text-xs text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>نیا ذاتی لفظ درج کریں</span>
          </button>
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistoryList.length > 0 && (
          <div className="absolute top-full mt-2 w-full z-30 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl p-3 text-right">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                حالیہ تلاشیں
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-stone-400 hover:text-red-600 flex items-center gap-1 text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                تاریخ صاف کریں
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {searchHistoryList.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectHistory(h)}
                  className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-900/10 text-stone-800 dark:text-stone-200 text-xs font-arabic border border-stone-200/60 dark:border-stone-700 transition cursor-pointer"
                >
                  {h}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="mt-3 w-full text-center text-xs text-stone-400 hover:text-stone-600 py-1"
            >
              بند کریں
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs (Part of Speech & Category) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        {/* Part of speech pills */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200/60 dark:border-stone-700 text-xs font-medium">
          {(
            [
              { key: 'all', label: 'تمام اقسام' },
              { key: 'اسم', label: 'اسماء' },
              { key: 'فعل', label: 'افعال' },
              { key: 'حرف', label: 'حروف' }
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedPos(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedPos === tab.key
                  ? 'bg-emerald-800 text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="all">تمام شعبہ جات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Missing word notification banner if triggered */}
      {missingWordSavedNotice && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>یہ لفظ آپ کی ذاتی مطالعاتی لائبریری میں شامل کر دیا گیا ہے۔</span>
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-3">
        {searchResults.list.length > 0 ? (
          <>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
              <span>نتائج: {searchResults.list.length} الفاظ</span>
              {query && <span>تلاش برائے: "{query}"</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.list.map(item => {
                const saved = isWordSaved(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      recordViewedWord(item.id);
                      onOpenWord(item);
                    }}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-600 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition cursor-pointer text-right group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              speakArabicWord(item.arabic);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="تلفظ سنیں"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                            {item.partOfSpeech}
                          </span>
                          {item.root && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-medium">
                              جذر: {item.root}
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-arabic font-bold text-emerald-950 dark:text-emerald-300 group-hover:text-emerald-700 transition">
                          {item.arabic}
                        </h3>
                      </div>

                      <p className="text-sm font-urdu text-stone-800 dark:text-stone-200 line-clamp-2 leading-relaxed">
                        {item.urdu}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                      <span className="text-[11px] truncate">{item.source}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (saved) {
                              removeSavedWord(item.id);
                            } else {
                              saveWord({
                                id: `sw_${Date.now()}`,
                                wordId: item.id,
                                arabic: item.arabic,
                                urdu: item.urdu,
                                root: item.root,
                                tag: item.category || 'لغت',
                                dateAdded: Date.now()
                              });
                            }
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            saved
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60'
                              : 'text-stone-400 hover:text-stone-700'
                          }`}
                        >
                          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 group-hover:underline">
                          مطالعہ کریں
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Missing Word State - Fulfills Prompt Requirement:
             "If a word is absent, display: 'This word is not available in the offline dictionary yet.'
              Offer an option to save the missing word to a personal study list. Do not pretend that a missing word was successfully translated."
          */
          <div className="p-8 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-center space-y-4 my-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Info className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                یہ لفظ ابھی آف لائن لغت میں موجود نہیں ہے۔
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu max-w-md mx-auto leading-relaxed">
                "This word is not available in the offline dictionary yet."
                <br />
                لغت میٹ میں صرف مستند اور تصدیق شدہ الفاظ شامل کیے جاتے ہیں، من گھڑت یا خودکار غلط ترجمے سے اجتناب کیا گیا ہے۔
              </p>
            </div>

            {query.trim() && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveMissingWord}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>اس لفظ کو ذاتی مطالعہ لسٹ میں محفوظ کریں</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl text-xs hover:bg-stone-200 dark:hover:bg-stone-700"
                >
                  تمام الفاظ واپس دکھائیں
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Custom Word Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setShowAddCustomModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-arabic">
                نیا لفظ یا اصطلاح شامل کریں
              </h3>
            </div>

            <form onSubmit={handleSaveCustomEntry} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  عربی لفظ (مع اعراب یا بغیر اعراب):
                </label>
                <input
                  type="text"
                  required
                  value={customArabic}
                  onChange={e => setCustomArabic(e.target.value)}
                  placeholder="مثال: تَفَقُّهٌ"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base font-arabic focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  اردو معنی و تشریح:
                </label>
                <textarea
                  rows={3}
                  value={customUrdu}
                  onChange={e => setCustomUrdu(e.target.value)}
                  placeholder="مستند لغت یا استاد سے سنا ہوا درست مفہوم..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-urdu focus:outline-emerald-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  محفوظ کریں
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-600 dark:text-stone-400"
                >
                  منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
