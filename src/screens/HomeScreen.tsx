import React, { useState, useEffect } from 'react';
import { STARTER_DICTIONARY, DictionaryItem } from '../data/starterDictionary';
import { 
  getSavedWords, 
  getPracticeStats, 
  getSavedPassages, 
  getRecentlyViewedWords, 
  recordViewedWord, 
  isWordSaved, 
  saveWord, 
  removeSavedWord 
} from '../data/storage';
import { speakArabicWord } from '../utils/arabic';
import { 
  Search, BookOpen, Sparkles, Bookmark, BookmarkCheck, 
  Volume2, ArrowLeft, Brain, GraduationCap, Flame, 
  ChevronLeft, Award, FileText, CheckCircle2 
} from 'lucide-react';

import { DailyQuoteCard } from '../components/DailyQuoteCard';

interface HomeScreenProps {
  onNavigate: (tab: 'home' | 'dictionary' | 'text_study' | 'practice' | 'library', searchParam?: string) => void;
  onOpenWord: (item: DictionaryItem) => void;
  onOpenAndroidExport: () => void;
  saveVersion?: number;
  onStudyQuote?: (arabicText: string, title: string, urduNotes: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenWord,
  onOpenAndroidExport,
  saveVersion = 0,
  onStudyQuote
}) => {
  const [quickQuery, setQuickQuery] = useState('');
  const [savedWordsCount, setSavedWordsCount] = useState(0);
  const [practiceStats, setPracticeStats] = useState(getPracticeStats());
  const [passagesCount, setPassagesCount] = useState(0);
  const [recentWords, setRecentWords] = useState<DictionaryItem[]>([]);
  const [dailyWord, setDailyWord] = useState<DictionaryItem>(STARTER_DICTIONARY[0]);
  const [dailySaved, setDailySaved] = useState(false);
  const [isPlayingDaily, setIsPlayingDaily] = useState(false);

  // Compute daily word deterministically from day of year
  useEffect(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const word = STARTER_DICTIONARY[dayOfYear % STARTER_DICTIONARY.length] || STARTER_DICTIONARY[0];
    setDailyWord(word);
    setDailySaved(isWordSaved(word.id));

    // Stats
    setSavedWordsCount(getSavedWords().length);
    setPracticeStats(getPracticeStats());
    setPassagesCount(getSavedPassages().length);

    // Recently viewed words
    const recentIds = getRecentlyViewedWords();
    const resolved = recentIds
      .map(id => STARTER_DICTIONARY.find(w => w.id === id))
      .filter((w): w is DictionaryItem => !!w);
    setRecentWords(resolved.slice(0, 6));
  }, [saveVersion]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onNavigate('dictionary', quickQuery.trim());
    } else {
      onNavigate('dictionary');
    }
  };

  const handleToggleDailySave = () => {
    if (dailySaved) {
      removeSavedWord(dailyWord.id);
      setDailySaved(false);
      setSavedWordsCount(prev => Math.max(0, prev - 1));
    } else {
      saveWord({
        id: `sw_${Date.now()}`,
        wordId: dailyWord.id,
        arabic: dailyWord.arabic,
        urdu: dailyWord.urdu,
        root: dailyWord.root,
        tag: 'روزانہ کا لفظ',
        dateAdded: Date.now()
      });
      setDailySaved(true);
      setSavedWordsCount(prev => prev + 1);
    }
  };

  const handlePlayDaily = () => {
    setIsPlayingDaily(true);
    speakArabicWord(dailyWord.arabic);
    setTimeout(() => setIsPlayingDaily(false), 1200);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Scholarly Welcome Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#0A261D] text-amber-50 p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-arabic tracking-wide text-white leading-tight">
            لغت میٹ — عربی و اردو تعلیمی ساتھی
          </h1>

          <p className="mt-2 text-stone-200 text-sm sm:text-base leading-relaxed font-urdu font-normal opacity-90">
            مدارسِ دینیہ اور عربی زبان کے متلاشی طلبہ کے لیے مکمل آف لائن، مستند لغت اور مطالعۂ متون کا سائنسی و آسان معاون۔
          </p>

          {/* Prominent Quick Search Field */}
          <form onSubmit={handleSearchSubmit} className="mt-5 relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={quickQuery}
                onChange={e => setQuickQuery(e.target.value)}
                placeholder="عربی لفظ یا اردو معنی تلاش کریں (مثلاً: علم، کتاب، صبر)..."
                className="w-full pl-24 pr-11 py-3.5 text-sm sm:text-base rounded-2xl bg-white/95 text-stone-900 placeholder:text-stone-400 shadow-lg focus:outline-none focus:ring-3 focus:ring-amber-400 border border-emerald-700 font-arabic"
                dir="rtl"
              />
              <Search className="w-5 h-5 absolute right-3.5 text-emerald-800" />
              <button
                type="submit"
                className="absolute left-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                تلاش کریں
              </button>
            </div>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-emerald-200/80">
            <span className="font-medium text-amber-300">عام تلاش:</span>
            {['عِلْمٌ', 'كِتَابٌ', 'حِكْمَةٌ', 'صَبْرٌ', 'قَلْبٌ'].map(w => (
              <button
                key={w}
                type="button"
                onClick={() => onNavigate('dictionary', w)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-arabic transition cursor-pointer"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle Decorative Geometry in background */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-700/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-amber-500/10 blur-xl pointer-events-none"></div>
      </div>

      {/* Daily Vocabulary Card */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-l from-amber-500/15 via-amber-400/5 to-transparent px-5 py-3 border-b border-amber-200/40 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-stone-950">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">آج کا منتخب لفظ (Daily Word)</h2>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">مستند کلاسیکی لغت سے</span>
            </div>
          </div>
          <button
            onClick={() => {
              recordViewedWord(dailyWord.id);
              onOpenWord(dailyWord);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>تفصیلات دیکھیں</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-arabic font-bold text-emerald-950 dark:text-emerald-300">
                {dailyWord.arabic}
              </h3>
              <button
                onClick={handlePlayDaily}
                className={`p-2 rounded-full border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer ${
                  isPlayingDaily ? 'bg-amber-400 text-stone-950' : 'text-stone-600 dark:text-stone-300'
                }`}
                title="تلفظ سنیں"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              {dailyWord.root && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                  جذر: <strong className="font-arabic">{dailyWord.root}</strong>
                </span>
              )}
            </div>

            <p className="text-base font-urdu text-stone-800 dark:text-stone-200 leading-relaxed">
              {dailyWord.urdu}
            </p>

            {dailyWord.exampleArabic && (
              <p className="text-sm font-arabic text-emerald-800 dark:text-emerald-400 italic">
                "{dailyWord.exampleArabic}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
            <button
              onClick={handleToggleDailySave}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                dailySaved
                  ? 'bg-emerald-900/10 border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200'
              }`}
            >
              {dailySaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
              <span>{dailySaved ? 'محفوظ شدہ' : 'محفوظ کریں'}</span>
            </button>

            <button
              onClick={() => {
                recordViewedWord(dailyWord.id);
                onOpenWord(dailyWord);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              مکمل لغت کارڈ
            </button>
          </div>
        </div>
      </div>

      {/* Daily Arabic Quote Card */}
      <DailyQuoteCard onStudyPassage={onStudyQuote} />

      {/* Quick Launchpad to Primary Study Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Workspace Feature Card */}
        <div
          onClick={() => onNavigate('text_study')}
          className="group p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-emerald-600 dark:hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-xl bg-emerald-900/10 dark:bg-emerald-800/20 text-emerald-800 dark:text-emerald-300 group-hover:scale-105 transition">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
              <span>ورک اسپیس کھولیں</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
            </span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            مطالعۂ متن (Text Study)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu leading-relaxed">
            کسی بھی عربی عبارت کو چسپاں کر کے ہر لفظ کا بیک وقت معنی دیکھیں اور اپنے ذاتی نوٹس مرتب کریں۔
          </p>
        </div>

        {/* Practice Feature Card */}
        <div
          onClick={() => onNavigate('practice')}
          className="group p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-amber-600 dark:hover:border-amber-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <span>مشق شروع کریں</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition" />
            </span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            تمرین و مراجعہ (Practice & Quiz)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu leading-relaxed">
            فلیش کارڈز، چار کثیر الانتخابی سوالات، اور غلطیوں کی دہرائی کے ساتھ الفاظ کے فہم کو مضبوط بنائیں۔
          </p>
        </div>
      </div>

      {/* Learning Progress Summary */}
      <div className="p-5 rounded-2xl bg-stone-100/70 dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              آپ کی علمی پیش رفت (Learning Progress)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="text-xs text-emerald-800 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
          >
            لائبریری ملاحظہ کریں
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
            <span className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-400 block">
              {savedWordsCount}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">محفوظ الفاظ</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
            <span className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 block">
              {practiceStats.totalQuizzes}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">مکمل سوالات</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 block">
              {practiceStats.totalQuizzes > 0
                ? `${Math.round((practiceStats.correctAnswers / practiceStats.totalQuizzes) * 100)}%`
                : '0%'}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">صحتِ جوابات</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
            <span className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-400 block">
              {passagesCount}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">زیرِ مطالعہ عبارات</span>
          </div>
        </div>
      </div>

      {/* Recently Viewed Words */}
      {recentWords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>حالیہ دیکھے گئے الفاظ</span>
              <span className="text-xs font-normal text-stone-500">({recentWords.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('dictionary')}
              className="text-xs text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              پوری لغت میں تلاش کریں
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentWords.map(w => (
              <div
                key={w.id}
                onClick={() => {
                  recordViewedWord(w.id);
                  onOpenWord(w);
                }}
                className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-700/60 transition cursor-pointer text-right group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-stone-400">{w.partOfSpeech}</span>
                  <span className="text-base font-arabic font-bold text-emerald-900 dark:text-emerald-300 group-hover:text-emerald-700">
                    {w.arabic}
                  </span>
                </div>
                <p className="text-xs font-urdu text-stone-600 dark:text-stone-400 truncate">
                  {w.urdu}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Developer & Owner Attribution Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#0A261D] text-white shadow-lg border border-emerald-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 shadow-inner shrink-0">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold font-sans">
                  Official App Leadership
                </span>
                <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-700/60 font-sans">
                  LughatMate
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-amber-100 font-sans tracking-wide">
                The developer of this app is <span className="text-amber-300 font-extrabold underline decoration-amber-400/60 underline-offset-4">Muzammil Mastungi</span>
              </h4>
              <p className="text-sm font-semibold text-stone-200 font-sans">
                And the owner is <span className="text-amber-200 font-bold">Maqbool Shawani</span>
              </p>
              <p className="text-xs text-emerald-300/85 font-urdu pt-0.5 font-normal">
                ایپ ڈویلپر: <strong>مزمل مستونگی</strong> • سرپرست و مالک: <strong>مقبول شاہوانی</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAndroidExport}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap self-end sm:self-center"
          >
            اینڈرائیڈ کوڈ و گائیڈ
          </button>
        </div>
      </div>
    </div>
  );
};
