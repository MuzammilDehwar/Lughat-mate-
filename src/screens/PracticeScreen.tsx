import React, { useState, useEffect, useMemo } from 'react';
import { STARTER_DICTIONARY, DictionaryItem } from '../data/starterDictionary';
import { 
  getPracticeStats, 
  recordQuizResult, 
  resetPracticeStats, 
  getSavedWords, 
  PracticeHistoryRecord 
} from '../data/storage';
import { speakArabicWord } from '../utils/arabic';
import { 
  GraduationCap, Award, RefreshCw, Volume2, 
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  RotateCcw, Sparkles, AlertTriangle, ArrowRight, 
  BookMarked, Brain, Layers 
} from 'lucide-react';

interface PracticeScreenProps {
  onOpenWordDetail: (item: DictionaryItem) => void;
}

type Mode = 'flashcard' | 'quiz_ar_ur' | 'quiz_ur_ar';
type SourceType = 'all' | 'saved_only' | 'mistakes_only';

interface QuizQuestion {
  word: DictionaryItem;
  options: string[];
  correctAnswer: string;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  onOpenWordDetail
}) => {
  const [mode, setMode] = useState<Mode>('quiz_ar_ur');
  const [sourceType, setSourceType] = useState<SourceType>('all');
  const [stats, setStats] = useState<PracticeHistoryRecord>(getPracticeStats());

  // Current session questions
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Pool of available dictionary items based on source
  const availableWords = useMemo(() => {
    if (sourceType === 'saved_only') {
      const saved = getSavedWords();
      const matched = STARTER_DICTIONARY.filter(d => 
        saved.some(s => s.wordId === d.id || s.arabic === d.arabic)
      );
      return matched;
    }
    if (sourceType === 'mistakes_only') {
      const mistakes = stats.mistakes;
      const matched = STARTER_DICTIONARY.filter(d => mistakes.includes(d.id));
      return matched;
    }
    return STARTER_DICTIONARY;
  }, [sourceType, stats.mistakes]);

  // Questions generator
  const questions: QuizQuestion[] = useMemo(() => {
    const list = [...availableWords].sort(() => Math.random() - 0.5).slice(0, 10);
    return list.map(item => {
      if (mode === 'quiz_ur_ar') {
        // Options are Arabic words
        const distractors = STARTER_DICTIONARY
          .filter(d => d.id !== item.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(d => d.arabic);
        const options = [...distractors, item.arabic].sort(() => Math.random() - 0.5);
        return {
          word: item,
          options,
          correctAnswer: item.arabic
        };
      } else {
        // Options are Urdu meanings
        const distractors = STARTER_DICTIONARY
          .filter(d => d.id !== item.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(d => d.urdu);
        const options = [...distractors, item.urdu].sort(() => Math.random() - 0.5);
        return {
          word: item,
          options,
          correctAnswer: item.urdu
        };
      }
    });
  }, [availableWords, mode]);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      setSessionScore(prev => prev + 1);
    }
    setSessionTotal(prev => prev + 1);
    recordQuizResult(isCorrect, currentQ.word.id);
    setStats(getPracticeStats());
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsFlipped(false);
    } else {
      setSessionFinished(true);
    }
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFlipped(false);
    setSessionScore(0);
    setSessionTotal(0);
    setSessionFinished(false);
  };

  const handleResetAllStats = () => {
    if (confirm('کیا آپ واقعی اپنی مکمل تمرینی تاریخ اور اسکور ری سیٹ کرنا چاہتے ہیں؟')) {
      resetPracticeStats();
      setStats(getPracticeStats());
    }
  };

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-arabic text-emerald-950 dark:text-emerald-200">
            تمرین و مراجعہ (Practice & Revision)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
            مستند الفاظ کے معنی، مادہ اور یاد دہانی کے خودکار کوئز اور فلیش کارڈز۔
          </p>
        </div>

        {/* Practice Stats Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs flex items-center gap-1.5 shadow-xs">
            <Award className="w-4 h-4 text-amber-500" />
            <span>کل سوالات: <strong>{stats.totalQuizzes}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>تسلسل (Streak): <strong>{stats.streak}</strong></span>
          </div>
        </div>
      </div>

      {/* Mode and Source Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Modes */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => {
              setMode('quiz_ar_ur');
              handleRestartSession();
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'quiz_ar_ur'
                ? 'bg-emerald-800 text-white font-bold'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            عربی سے اردو کوئز
          </button>
          <button
            onClick={() => {
              setMode('quiz_ur_ar');
              handleRestartSession();
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'quiz_ur_ar'
                ? 'bg-emerald-800 text-white font-bold'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            اردو سے عربی فہم
          </button>
          <button
            onClick={() => {
              setMode('flashcard');
              handleRestartSession();
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'flashcard'
                ? 'bg-emerald-800 text-white font-bold'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            فلیش کارڈز (بطاقات)
          </button>
        </div>

        {/* Source Pool Filter */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => {
              setSourceType('all');
              handleRestartSession();
            }}
            className={`px-2.5 py-1 rounded-lg ${sourceType === 'all' ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold' : 'text-stone-500'}`}
          >
            تمام ذخیرہ
          </button>
          <button
            onClick={() => {
              setSourceType('saved_only');
              handleRestartSession();
            }}
            className={`px-2.5 py-1 rounded-lg ${sourceType === 'saved_only' ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold' : 'text-stone-500'}`}
          >
            محفوظ الفاظ
          </button>
          {stats.mistakes.length > 0 && (
            <button
              onClick={() => {
                setSourceType('mistakes_only');
                handleRestartSession();
              }}
              className={`px-2.5 py-1 rounded-lg ${sourceType === 'mistakes_only' ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-bold' : 'text-stone-500'}`}
            >
              غلطیوں کی دہرائی ({stats.mistakes.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Practice Container */}
      {availableWords.length === 0 ? (
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {sourceType === 'saved_only' ? 'کوئی محفوظ لفظ موجود نہیں ہے' : 'کوئی سابقہ غلطی موجود نہیں ہے'}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu leading-relaxed">
            {sourceType === 'saved_only'
              ? 'آپ کی محفوظ کردہ فہرست میں فی الحال کوئی لفظ نہیں ہے۔ لغت سے چند الفاظ محفوظ کریں یا تمام ذخیرے کی مشق کریں۔'
              : 'ماشاء اللہ! آپ کے تمام پچھلے جوابات درست رہے ہیں اور کوئی لفظ زیرِ دہرائی نہیں ہے۔'}
          </p>
          <button
            onClick={() => {
              setSourceType('all');
              handleRestartSession();
            }}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            تمام ذخیرہ الفاظ کی مشق کریں
          </button>
        </div>
      ) : !sessionFinished && currentQ ? (
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md overflow-hidden max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2">
            <div
              className="bg-emerald-700 h-2 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>سوال {currentIndex + 1} از {questions.length}</span>
              <div className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-400">
                <span>اسکور: {sessionScore} / {sessionTotal}</span>
              </div>
            </div>

            {/* Flashcard Mode */}
            {mode === 'flashcard' ? (
              <div className="space-y-6">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[240px] p-8 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none shadow-sm ${
                    isFlipped
                      ? 'bg-amber-50/50 dark:bg-stone-850 border-amber-400/60'
                      : 'bg-emerald-950 text-white border-emerald-800 hover:scale-[1.01]'
                  }`}
                >
                  {!isFlipped ? (
                    <div className="space-y-4">
                      <span className="text-xs uppercase tracking-wider text-emerald-300">عربی لفظ</span>
                      <h3 className="text-5xl font-arabic font-bold text-amber-100">
                        {currentQ.word.arabic}
                      </h3>
                      {currentQ.word.root && (
                        <span className="text-xs text-emerald-300 block">
                          مادہ: {currentQ.word.root}
                        </span>
                      )}
                      <p className="text-xs text-stone-300 mt-4 flex items-center justify-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>معنی اور تشریح دیکھنے کے لیے کارڈ پر ٹیپ کریں</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-stone-900 dark:text-stone-100">
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                        اردو مفہوم و تشریح
                      </span>
                      <h3 className="text-2xl font-urdu font-bold leading-relaxed">
                        {currentQ.word.urdu}
                      </h3>
                      {currentQ.word.exampleArabic && (
                        <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-arabic text-emerald-900 dark:text-emerald-300">
                          {currentQ.word.exampleArabic}
                        </div>
                      )}
                      <div className="text-[11px] text-stone-500">
                        ماخذ: {currentQ.word.source}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => speakArabicWord(currentQ.word.arabic)}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    title="تلفظ سنیں"
                  >
                    <Volume2 className="w-5 h-5 text-emerald-800" />
                  </button>

                  <button
                    onClick={() => onOpenWordDetail(currentQ.word)}
                    className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-300 transition"
                    title="مکمل لغت کارڈ ملاحظہ کریں"
                  >
                    <BookMarked className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      recordQuizResult(true, currentQ.word.id);
                      setSessionScore(prev => prev + 1);
                      setSessionTotal(prev => prev + 1);
                      handleNextQuestion();
                    }}
                    className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>خوب یاد ہے (Remembered)</span>
                  </button>

                  <button
                    onClick={() => {
                      recordQuizResult(false, currentQ.word.id);
                      setSessionTotal(prev => prev + 1);
                      handleNextQuestion();
                    }}
                    className="px-4 py-3 border border-red-300 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>دوبارہ دہرائیں</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Multiple Choice Quiz Mode */
              <div className="space-y-6">
                {/* Question Prompt */}
                <div className="p-6 rounded-2xl bg-emerald-950 text-white text-center space-y-2">
                  <span className="text-xs text-emerald-300">
                    {mode === 'quiz_ar_ur' ? 'اس عربی لفظ کا صحیح اردو معنی منتخب کریں:' : 'اس اردو معنی کے لیے درست عربی لفظ منتخب کریں:'}
                  </span>
                  <h3 className={`font-bold select-all ${mode === 'quiz_ar_ur' ? 'text-4xl sm:text-5xl font-arabic text-amber-200' : 'text-2xl font-urdu text-white'}`}>
                    {mode === 'quiz_ar_ur' ? currentQ.word.arabic : currentQ.word.urdu}
                  </h3>
                  {mode === 'quiz_ar_ur' && (
                    <button
                      onClick={() => speakArabicWord(currentQ.word.arabic)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white transition cursor-pointer mt-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>تلفظ سنیں</span>
                    </button>
                  )}
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === currentQ.correctAnswer;

                    let btnClass = 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 hover:border-emerald-600';

                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500';
                      } else if (isSelected) {
                        btnClass = 'bg-red-100 dark:bg-red-950/80 border-red-500 text-red-900 dark:text-red-200 ring-2 ring-red-500';
                      } else {
                        btnClass = 'opacity-40 bg-stone-100 dark:bg-stone-850 border-stone-200 dark:border-stone-800';
                      }
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        disabled={isAnswered}
                        className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between text-sm ${btnClass} ${
                          mode === 'quiz_ur_ar' ? 'font-arabic text-lg' : 'font-urdu'
                        }`}
                      >
                        <span className="leading-relaxed">{opt}</span>
                        {isAnswered && (
                          <span>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Panel after answer */}
                {isAnswered && (
                  <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 flex items-center justify-between animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className={`text-xs font-bold block ${selectedOption === currentQ.correctAnswer ? 'text-emerald-700' : 'text-red-600'}`}>
                        {selectedOption === currentQ.correctAnswer ? 'ماشاء اللہ! درست جواب' : 'توجہ فرمائیں! صحیح جواب یہ تھا'}
                      </span>
                      {currentQ.word.root && (
                        <p className="text-xs text-stone-600 dark:text-stone-400">
                          مادہ: <strong className="font-arabic">{currentQ.word.root}</strong> | ماخذ: {currentQ.word.source}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenWordDetail(currentQ.word)}
                        className="px-3 py-2 bg-stone-200 dark:bg-stone-750 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                        title="مکمل لغت کارڈ دیکھیں"
                      >
                        لغت کارڈ
                      </button>
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>اگلا سوال</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Session Completed Result View */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
            <Award className="w-8 h-8 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-arabic text-stone-900 dark:text-stone-100">
              مشق مکمل ہوئی! بارک اللّٰہ
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
              آپ کے اس سیشن کا حاصل کردہ اسکور:
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700 flex items-center justify-around">
            <div>
              <span className="text-3xl font-bold text-emerald-800 dark:text-emerald-400 block">
                {sessionScore}
              </span>
              <span className="text-xs text-stone-500">درست جوابات</span>
            </div>
            <div className="w-px h-10 bg-amber-200 dark:bg-stone-700"></div>
            <div>
              <span className="text-3xl font-bold text-stone-900 dark:text-stone-100 block">
                {sessionTotal > 0 ? `${Math.round((sessionScore / sessionTotal) * 100)}%` : '0%'}
              </span>
              <span className="text-xs text-stone-500">کامیابی کا تناسب</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleRestartSession}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>دوبارہ مشق شروع کریں</span>
            </button>
            {stats.mistakes.length > 0 && (
              <button
                onClick={() => {
                  setSourceType('mistakes_only');
                  handleRestartSession();
                }}
                className="w-full py-2.5 border border-amber-500/50 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold hover:bg-amber-500/10 cursor-pointer"
              >
                صرف غلط ہونے والے الفاظ کی دہرائی ({stats.mistakes.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Honest Scientific Trust notice & Reset Option */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 border-t border-stone-200 dark:border-stone-800">
        <p className="font-urdu leading-relaxed text-right">
          تمام سوالات صرف مصدقہ لغت کے اندراجات سے بنائے جاتے ہیں۔ کوئی من گھڑت مواد شامل نہیں ہے۔
        </p>
        <button
          onClick={handleResetAllStats}
          className="text-stone-400 hover:text-red-600 transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تمرینی اسکور ری سیٹ کریں</span>
        </button>
      </div>
    </div>
  );
};
