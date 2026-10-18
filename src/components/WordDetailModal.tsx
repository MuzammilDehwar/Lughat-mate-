import React, { useState } from 'react';
import { DictionaryItem } from '../data/starterDictionary';
import { speakArabicWord } from '../utils/arabic';
import { isWordSaved, saveWord, removeSavedWord, saveFeedbackReport } from '../data/storage';
import { 
  Volume2, Bookmark, BookmarkCheck, Copy, Share2, 
  Check, X, ShieldCheck, Flag, Sparkles, BookOpen 
} from 'lucide-react';

interface WordDetailModalProps {
  item: DictionaryItem | null;
  onClose: () => void;
  onSelectRoot?: (root: string) => void;
  onWordSavedChange?: () => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  item,
  onClose,
  onSelectRoot,
  onWordSavedChange
}) => {
  if (!item) return null;

  const [saved, setSaved] = useState(() => isWordSaved(item.id) || isWordSaved(item.arabic));
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    speakArabicWord(item.arabic);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  const handleToggleSave = () => {
    if (saved) {
      removeSavedWord(item.id);
      setSaved(false);
    } else {
      saveWord({
        id: `sw_${Date.now()}`,
        wordId: item.id,
        arabic: item.arabic,
        urdu: item.urdu,
        root: item.root,
        personalNotes: personalNote || undefined,
        tag: item.category || 'عمومی',
        dateAdded: Date.now()
      });
      setSaved(true);
    }
    if (onWordSavedChange) onWordSavedChange();
  };

  const handleCopy = () => {
    const textToCopy = `${item.arabic}\nمعنی: ${item.urdu}\nجذر: ${item.root || '-'}\nمثال: ${item.exampleArabic || ''} (${item.exampleUrdu || ''})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `لغت میٹ (عربی-اردو مطالعہ):\n${item.arabic}\nمعنی: ${item.urdu}\n${item.exampleArabic ? `مثال: ${item.exampleArabic}` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `لغت میٹ: ${item.arabic}`,
          text: shareText
        });
      } catch {
        // Fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;
    saveFeedbackReport({
      type: 'meaning_correction',
      wordOrSubject: item.arabic,
      details: reportDetails
    });
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccess(false);
      setReportDetails('');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all my-8 animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 p-6 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              aria-label="بند کریں"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-950/60 text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                مستند اندراج
              </span>
              <span className="text-[11px] font-medium bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-full border border-amber-500/30">
                {item.partOfSpeech}
              </span>
            </div>
          </div>

          {/* Main Arabic Word Typography */}
          <div className="text-center py-2">
            <h2 className="text-4xl sm:text-5xl font-arabic font-bold text-amber-100 tracking-wide select-all leading-tight">
              {item.arabic}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={handlePlayAudio}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isPlaying 
                    ? 'bg-amber-400 text-stone-950 shadow-md' 
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title="تلفظ سنیں"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                <span>تلفظ سنیں</span>
              </button>
              {item.root && (
                <button
                  onClick={() => {
                    if (onSelectRoot) {
                      onSelectRoot(item.root!);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/15 cursor-pointer"
                  title="اس مادہ / جذر کے دیگر الفاظ دیکھیں"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>مادہ: <strong className="font-arabic tracking-wider">{item.root}</strong></span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-stone-800 dark:text-stone-200">
          {/* Urdu Meaning */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-stone-800/60 border border-amber-200/50 dark:border-stone-700">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 block mb-1">
              اردو معانی و تشریح:
            </span>
            <p className="text-lg font-urdu text-stone-900 dark:text-stone-100 leading-relaxed font-medium">
              {item.urdu}
            </p>
            {item.singularPlural && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-200/40 dark:border-stone-700 text-xs font-arabic text-stone-600 dark:text-stone-400">
                {item.singularPlural}
              </div>
            )}
          </div>

          {/* Example Sentence if available */}
          {item.exampleArabic && (
            <div className="p-4 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>شاہد و تمثیل (مستند جملہ):</span>
              </div>
              <p className="text-xl font-arabic text-emerald-950 dark:text-emerald-200 leading-relaxed">
                {item.exampleArabic}
              </p>
              {item.exampleUrdu && (
                <p className="text-sm font-urdu text-stone-600 dark:text-stone-300">
                  {item.exampleUrdu}
                </p>
              )}
            </div>
          )}

          {/* Source Attribution */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
            <span>ماخذ لغت: <strong className="text-stone-700 dark:text-stone-300">{item.source}</strong></span>
            {item.category && (
              <span className="bg-stone-200/60 dark:bg-stone-800 px-2.5 py-0.5 rounded text-[11px]">
                شعبہ: {item.category}
              </span>
            )}
          </div>

          {/* Personal Note Input Toggle */}
          {showNoteInput && (
            <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-300 block mb-1">
                ذاتی مطالعہ کا نوٹ (اختیاری):
              </label>
              <textarea
                value={personalNote}
                onChange={e => setPersonalNote(e.target.value)}
                placeholder="اس لفظ کے متعلق اپنا فہم یا یاد دہانی لکھیں..."
                rows={2}
                className="w-full text-xs p-2 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-emerald-700"
              />
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            {/* Save / Bookmark */}
            <button
              onClick={handleToggleSave}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition cursor-pointer ${
                saved
                  ? 'bg-emerald-900/10 border-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
              }`}
            >
              {saved ? <BookmarkCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" /> : <Bookmark className="w-5 h-5" />}
              <span className="text-[11px] mt-1">{saved ? 'محفوظ شدہ' : 'محفوظ کریں'}</span>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 transition cursor-pointer"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              <span className="text-[11px] mt-1">{copied ? 'کاپی ہو گیا' : 'کاپی کریں'}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 transition cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[11px] mt-1">شیئر کریں</span>
            </button>

            {/* Report correction */}
            <button
              onClick={() => setShowReportModal(true)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-750 transition cursor-pointer"
              title="معنی یا حوالہ کی تصحیح تجویز کریں"
            >
              <Flag className="w-5 h-5" />
              <span className="text-[11px] mt-1">رپورٹ / تصحیح</span>
            </button>
          </div>
        </div>

        {/* In-Modal Feedback / Correction Sub-Dialog */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 p-5 shadow-2xl text-right">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setShowReportModal(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  لفظ "{item.arabic}" میں تصحیح تجویز کریں
                </h4>
              </div>

              {reportSuccess ? (
                <div className="p-4 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-800 dark:text-emerald-200 text-center text-xs font-semibold">
                  آپ کی رپورٹ مقامی طور پر محفوظ ہو چکی ہے۔ جزاکم اللہ خیرا!
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    علمی دیانت اور صحتِ معانی کے تحت اگر آپ کو کوئی سہو نظر آئے تو تفصیل درج فرمائیں:
                  </p>
                  <textarea
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    required
                    placeholder="صحیح معنی یا معتبر کتاب کا حوالہ..."
                    rows={3}
                    className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-emerald-800"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      رپورٹ محفوظ کریں
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg text-xs text-stone-600 dark:text-stone-400"
                    >
                      منسوخ
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
