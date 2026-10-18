import React, { useState, useEffect, useMemo } from 'react';
import { STARTER_DICTIONARY, SAMPLE_STUDY_PASSAGES, DictionaryItem } from '../data/starterDictionary';
import { tokenizeArabicText, normalizeArabic, speakArabicWord } from '../utils/arabic';
import { 
  getSavedPassages, 
  savePassage, 
  deletePassage, 
  SavedPassageRecord 
} from '../data/storage';
import { 
  FileText, Copy, Share2, Save, Trash2, 
  BookOpen, Sparkles, AlertCircle, Check, 
  Volume2, X, ChevronDown, ChevronUp, Layers, 
  ShieldAlert, RefreshCw, ZoomIn, ZoomOut 
} from 'lucide-react';

interface TextStudyScreenProps {
  onOpenWordDetail: (item: DictionaryItem) => void;
  initialPassage?: SavedPassageRecord | null;
}

export const TextStudyScreen: React.FC<TextStudyScreenProps> = ({
  onOpenWordDetail,
  initialPassage
}) => {
  const [inputText, setInputText] = useState(initialPassage?.arabicText || SAMPLE_STUDY_PASSAGES[0].arabicText);
  const [passageTitle, setPassageTitle] = useState(initialPassage?.title || SAMPLE_STUDY_PASSAGES[0].title);
  const [urduNotes, setUrduNotes] = useState(initialPassage?.urduNotes || SAMPLE_STUDY_PASSAGES[0].urduNotes);
  const [category, setCategory] = useState(initialPassage?.category || SAMPLE_STUDY_PASSAGES[0].category);

  useEffect(() => {
    if (initialPassage) {
      setInputText(initialPassage.arabicText);
      setPassageTitle(initialPassage.title);
      setUrduNotes(initialPassage.urduNotes);
      setCategory(initialPassage.category);
      setSelectedToken(null);
      setMatchedEntry(null);
    }
  }, [initialPassage]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [matchedEntry, setMatchedEntry] = useState<DictionaryItem | null>(null);
  const [fontSize, setFontSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');
  const [copied, setCopied] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [showSavedListModal, setShowSavedListModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tokenize the input text into words
  const tokens = useMemo(() => {
    return tokenizeArabicText(inputText, STARTER_DICTIONARY);
  }, [inputText]);

  // Handle token tap
  const handleTokenClick = (tokenRaw: string, match?: DictionaryItem) => {
    setSelectedToken(tokenRaw);
    if (match) {
      setMatchedEntry(match);
    } else {
      // Try fuzzy find
      const norm = normalizeArabic(tokenRaw);
      const found = STARTER_DICTIONARY.find(d => normalizeArabic(d.arabic) === norm);
      setMatchedEntry(found || null);
    }
  };

  const handleCopyText = () => {
    if (!inputText.trim()) return;
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inputText.trim()) return;
    const shareContent = `${passageTitle ? `${passageTitle}\n` : ''}${inputText}\n\nنوٹس: ${urduNotes || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: passageTitle || 'عربی مطالعہ - لغت میٹ',
          text: shareContent
        });
      } catch {
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  const handleSavePassageToLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setValidationError('عبارت خالی نہیں ہو سکتی۔');
      return;
    }
    if (inputText.length > 5000) {
      setValidationError('عبارت کا حجم 5000 حروف سے زیادہ نہیں ہو سکتا۔');
      return;
    }

    const newPassage: SavedPassageRecord = {
      id: `pass_${Date.now()}`,
      title: passageTitle.trim() || 'غیر عنوان شدہ عبارت',
      arabicText: inputText.trim(),
      urduNotes: urduNotes.trim(),
      category: category.trim() || 'عمومی',
      dateSaved: Date.now(),
      bookmarked: true
    };

    savePassage(newPassage);
    setShowSaveDialog(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleLoadSample = (sample: typeof SAMPLE_STUDY_PASSAGES[0]) => {
    setInputText(sample.arabicText);
    setPassageTitle(sample.title);
    setUrduNotes(sample.urduNotes);
    setCategory(sample.category);
    setSelectedToken(null);
    setMatchedEntry(null);
  };

  const handleLoadSaved = (saved: SavedPassageRecord) => {
    setInputText(saved.arabicText);
    setPassageTitle(saved.title);
    setUrduNotes(saved.urduNotes);
    setCategory(saved.category);
    setSelectedToken(null);
    setMatchedEntry(null);
    setShowSavedListModal(false);
  };

  const handleClear = () => {
    if (confirm('کیا آپ واقعی موجودہ عبارت صاف کرنا چاہتے ہیں؟')) {
      setInputText('');
      setPassageTitle('');
      setUrduNotes('');
      setSelectedToken(null);
      setMatchedEntry(null);
    }
  };

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-arabic text-emerald-950 dark:text-emerald-200">
            مطالعۂ متن و فہمِ عبارات (Text Study Workspace)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
            عربی عبارت درج کریں، کسی بھی لفظ پر ٹیپ کر کے فوری لغت دیکھیں اور اپنے نوٹس محفوظ کریں۔
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sample Passages selector */}
          <button
            onClick={() => setShowSavedListModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>محفوظ یا نمونہ عبارات</span>
          </button>

          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
          >
            <Save className="w-4 h-4" />
            <span>عبارت محفوظ کریں</span>
          </button>
        </div>
      </div>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>عبارت آپ کے ذاتی مطالعاتی نوٹس میں محفوظ کر لی گئی ہے۔</span>
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
      )}

      {/* Main Workspace Grid: Text on Left (in RTL), Token Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Arabic Reading Pane */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {passageTitle || 'عربی عبارت'}
                </span>
                {category && (
                  <span className="text-[10px] bg-stone-200/80 dark:bg-stone-700 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300">
                    {category}
                  </span>
                )}
              </div>

              {/* Text size zoom and actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setFontSize('text-xl')}
                    className={`px-2 py-0.5 rounded text-xs ${fontSize === 'text-xl' ? 'bg-emerald-800 text-white font-bold' : 'text-stone-600'}`}
                    title="چھوٹا متن"
                  >
                    ص
                  </button>
                  <button
                    onClick={() => setFontSize('text-2xl')}
                    className={`px-2 py-0.5 rounded text-xs ${fontSize === 'text-2xl' ? 'bg-emerald-800 text-white font-bold' : 'text-stone-600'}`}
                    title="درمیانہ متن"
                  >
                    م
                  </button>
                  <button
                    onClick={() => setFontSize('text-3xl')}
                    className={`px-2 py-0.5 rounded text-xs ${fontSize === 'text-3xl' ? 'bg-emerald-800 text-white font-bold' : 'text-stone-600'}`}
                    title="بڑا متن"
                  >
                    ک
                  </button>
                </div>

                <button
                  onClick={handleCopyText}
                  className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  title="کاپی کریں"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  title="شیئر کریں"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 transition"
                  title="صاف کریں"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Arabic Reading View */}
            <div className="p-6 bg-[#FEFDF9] dark:bg-stone-900/95 min-h-[220px]">
              <div className="text-xs text-stone-400 mb-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>رہنمائی: کسی بھی لفظ پر ٹیپ کر کے اس کا فوری معنی معلوم کریں۔</span>
              </div>

              {inputText.trim() ? (
                <div className={`font-arabic leading-[2.2] ${fontSize} text-stone-900 dark:text-stone-100 select-text`}>
                  {tokens.map(token => {
                    if (!token.isWord) {
                      return <span key={token.id}>{token.raw}</span>;
                    }

                    const isSelected = selectedToken === token.raw;
                    const hasMatch = !!token.matchedEntry;

                    return (
                      <span
                        key={token.id}
                        onClick={() => handleTokenClick(token.raw, token.matchedEntry)}
                        className={`inline-block px-1 py-0.5 mx-0.5 rounded-lg cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-amber-400 text-stone-950 font-bold shadow-xs ring-2 ring-amber-500'
                            : hasMatch
                            ? 'hover:bg-emerald-100 dark:hover:bg-emerald-950/80 hover:text-emerald-900 dark:hover:text-emerald-200 border-b border-emerald-600/40'
                            : 'hover:bg-stone-200 dark:hover:bg-stone-800'
                        }`}
                        title={hasMatch ? `معنی: ${token.matchedEntry?.urdu}` : 'لغت میں تلاش کریں'}
                      >
                        {token.raw}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-stone-400">
                  عبارت درج کرنے کے لیے نیچے دیے گئے خانے میں لکھیں یا چسپاں کریں۔
                </div>
              )}
            </div>

            {/* Text Input / Edit Area */}
            <div className="p-4 bg-stone-50 dark:bg-stone-850 border-t border-stone-200 dark:border-stone-800">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1.5">
                عربی متن تبدیل یا چسپاں کریں:
              </label>
              <textarea
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  setValidationError(null);
                }}
                rows={4}
                dir="rtl"
                placeholder="یہاں عربی عبارت چسپاں کریں..."
                className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-arabic text-lg focus:outline-emerald-800 shadow-inner"
              />
              {validationError && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationError}
                </p>
              )}
            </div>
          </div>

          {/* User's Explanation / Notes Area */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-800" />
              <span>ذاتی تشریح و مطالعاتی نوٹس (Urdu Notes & Explanation)</span>
            </h3>
            <textarea
              value={urduNotes}
              onChange={e => setUrduNotes(e.target.value)}
              rows={3}
              placeholder="اس عبارت کے متعلق اپنے استاد کے فرمودات، لغوی نکات یا خلاصہ تحریر فرمائیں..."
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-urdu leading-relaxed focus:outline-emerald-800"
            />
          </div>
        </div>

        {/* Right Column: Token Inspector & Dictionary Lookup Sheet */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs p-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  لفظی تحقیق (Token Inspector)
                </h3>
              </div>
              {selectedToken && (
                <button
                  onClick={() => {
                    setSelectedToken(null);
                    setMatchedEntry(null);
                  }}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedToken ? (
              <div className="mt-4 space-y-4 text-right">
                <div className="p-4 rounded-xl bg-emerald-950 text-white text-center relative overflow-hidden">
                  <div className="text-xs text-emerald-300 mb-1">منتخب لفظ</div>
                  <h4 className="text-3xl font-arabic font-bold text-amber-200 select-all">
                    {selectedToken}
                  </h4>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => speakArabicWord(selectedToken)}
                      className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>تلفظ</span>
                    </button>
                  </div>
                </div>

                {matchedEntry ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-stone-800 border border-amber-200/60 dark:border-stone-700">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                        اردو معنی:
                      </span>
                      <p className="text-base font-urdu text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                        {matchedEntry.urdu}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        <span className="text-stone-400 block text-[10px]">قسم:</span>
                        <strong>{matchedEntry.partOfSpeech}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        <span className="text-stone-400 block text-[10px]">مادہ / جذر:</span>
                        <strong className="font-arabic">{matchedEntry.root || 'غیر درج'}</strong>
                      </div>
                    </div>

                    {matchedEntry.exampleArabic && (
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-xs">
                        <span className="text-[10px] text-stone-400 block mb-1">شاہدِ لغت:</span>
                        <p className="font-arabic text-sm text-stone-900 dark:text-stone-100">
                          {matchedEntry.exampleArabic}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => onOpenWordDetail(matchedEntry)}
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      مکمل کارڈ لغت میں کھولیں
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 text-center space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu leading-relaxed">
                      یہ مخصوص لفظ فی الحال آف لائن لغت کے ابتدائی ذخیرے میں موجود نہیں ہے۔
                    </p>
                    <p className="text-[11px] text-stone-500">
                      آپ اس لفظ کو ذاتی تحقیق کے طور پر اپنی لائبریری میں شامل کر سکتے ہیں۔
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400 text-xs font-urdu space-y-2">
                <Layers className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
                <p>عبارت میں موجود کسی بھی عربی لفظ پر ٹیپ کریں تاکہ اس کے مستند معانی اور مادہ ظاہر ہوں۔</p>
              </div>
            )}

            {/* Honest Scientific Disclaimer as per Prompt Guideline:
                "For the first version, do not claim that the app fully understands Arabic grammar or classical scholarly passages.
                 If morphological analysis, i'rab, or automated translation is not actually implemented and verified, label it as unavailable rather than simulating a result."
            */}
            <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>علمی وضاحت و احتیاط:</span>
              </div>
              یہ ایپ صرف مستند لغوی معانی فراہم کرتی ہے۔ خودکار اعراب (i'rab) یا مصنوعی نحو کا غلط دعویٰ نہیں کیا گیا تاکہ دینی کتب کے فہم میں کوئی مغالطہ نہ ہو۔
            </div>
          </div>
        </div>
      </div>

      {/* Save Passage Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setShowSaveDialog(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-arabic">
                عبارت لائبریری میں محفوظ کریں
              </h3>
            </div>

            <form onSubmit={handleSavePassageToLibrary} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  عبارت کا عنوان:
                </label>
                <input
                  type="text"
                  required
                  value={passageTitle}
                  onChange={e => setPassageTitle(e.target.value)}
                  placeholder="مثلاً: حديث النية / شعر الحكمة"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  شعبہ یا کیٹیگری:
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="حدیث، فقہ، ادب، نحو وغیرہ"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  ذاتی نوٹس / تشریح:
                </label>
                <textarea
                  rows={3}
                  value={urduNotes}
                  onChange={e => setUrduNotes(e.target.value)}
                  placeholder="اس عبارت کے اہم نکات..."
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
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-600 dark:text-stone-400"
                >
                  منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved / Sample Passages Selector Modal */}
      {showSavedListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 p-6 shadow-2xl text-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
              <button onClick={() => setShowSavedListModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-arabic">
                کلاسیکی و محفوظ شدہ عبارات
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-stone-500 mb-2">کلاسیکی نمونہ عبارات:</h4>
                <div className="space-y-2">
                  {SAMPLE_STUDY_PASSAGES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleLoadSample(s)}
                      className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-700 transition cursor-pointer text-right group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300">
                          {s.category}
                        </span>
                        <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                          {s.title}
                        </h5>
                      </div>
                      <p className="text-xs font-arabic text-stone-600 dark:text-stone-400 line-clamp-1">
                        {s.arabicText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Saved Passages */}
              <div>
                <h4 className="text-xs font-bold text-stone-500 mb-2">آپ کی محفوظ شدہ عبارات:</h4>
                {getSavedPassages().length > 0 ? (
                  <div className="space-y-2">
                    {getSavedPassages().map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleLoadSaved(p)}
                        className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-700 transition cursor-pointer text-right group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-stone-400">
                            {new Date(p.dateSaved).toLocaleDateString()}
                          </span>
                          <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                            {p.title}
                          </h5>
                        </div>
                        <p className="text-xs font-arabic text-stone-600 dark:text-stone-400 line-clamp-1">
                          {p.arabicText}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 py-3 text-center">کوئی ذاتی عبارت محفوظ نہیں ہے۔</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
