import React, { useState } from 'react';
import { 
  getAppSettings, 
  updateAppSettings, 
  AppSettings, 
  clearSearchHistory, 
  resetPracticeStats, 
  saveFeedbackReport, 
  getFeedbackReports 
} from '../data/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  Settings, X, Moon, Sun, Monitor, Type, 
  Volume2, ShieldCheck, Info, RotateCcw, 
  Trash2, Flag, Heart, Check, BookOpen, 
  FileText, ExternalLink, User, Cloud 
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAndroidExport: () => void;
  onOpenAuth?: (view?: 'welcome' | 'profile' | 'login') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAndroidExport,
  onOpenAuth
}) => {
  if (!isOpen) return null;

  const { currentUser } = useAuth();

  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'about' | 'privacy' | 'feedback'>('settings');
  const [feedbackType, setFeedbackType] = useState<'meaning_correction' | 'technical_bug' | 'suggestion'>('meaning_correction');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleUpdate = (partial: Partial<AppSettings>) => {
    const updated = updateAppSettings(partial);
    setSettings(updated);

    // Apply dark mode immediately to html document
    if (partial.theme) {
      if (partial.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (partial.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    }
  };

  const handleClearHistory = () => {
    if (confirm('کیا آپ واقعی تلاش کی تمام تاریخ صاف کرنا چاہتے ہیں؟')) {
      clearSearchHistory();
      setActionNotice('تلاش کی تاریخ صاف کر دی گئی ہے۔');
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  const handleResetProgress = () => {
    if (confirm('کیا آپ واقعی اپنے تمرینی اسکور اور کوئز کی تاریخ ری سیٹ کرنا چاہتے ہیں؟')) {
      resetPracticeStats();
      setActionNotice('علمی پیش رفت کامیابی سے ری سیٹ کر دی گئی ہے۔');
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackDetails.trim()) return;

    saveFeedbackReport({
      type: feedbackType,
      wordOrSubject: feedbackSubject.trim() || 'عمومی رپورٹ',
      details: feedbackDetails.trim()
    });

    setFeedbackSuccess(true);
    setFeedbackSubject('');
    setFeedbackDetails('');
    setTimeout(() => {
      setFeedbackSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6 transition-all text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800 text-amber-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100 font-arabic">ترتیبات و معلومات (Settings)</h3>
              <p className="text-[11px] text-stone-300 font-urdu">لغت میٹ کی شخصی ترتیبات اور شرائط</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-850 px-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'settings'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            عام ترتیبات
          </button>
          <button
            onClick={() => setActiveSubTab('about')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'about'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            تعارف و مآخذ
          </button>
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'privacy'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            پرائیویسی و سیکیورٹی
          </button>
          <button
            onClick={() => setActiveSubTab('feedback')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'feedback'
                ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 font-bold'
                : 'border-transparent text-stone-600 dark:text-stone-400'
            }`}
          >
            رپورٹ و تجاویز
          </button>
        </div>

        {/* Feedback message banner */}
        {actionNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
            <span>{actionNotice}</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {activeSubTab === 'settings' && (
            <div className="space-y-5">
              {/* Account & Profile Card */}
              <div className="p-4 rounded-xl bg-amber-100/60 dark:bg-stone-800 border border-amber-200/80 dark:border-stone-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#133E33] text-amber-300 flex items-center justify-center font-arabic font-bold text-base border border-amber-400/40 shrink-0">
                    {currentUser && !currentUser.isGuest ? (currentUser.displayName ? currentUser.displayName.slice(0, 1) : 'ط') : <User className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-urdu text-stone-900 dark:text-stone-100">
                      {currentUser && !currentUser.isGuest ? currentUser.displayName : 'مہمان موڈ (Guest)'}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-urdu mt-0.5">
                      {currentUser && !currentUser.isGuest ? (currentUser.email || 'کلاؤڈ اکاؤنٹ') : 'مقامی اسٹوریج میں فعال ہے'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth?.(currentUser && !currentUser.isGuest ? 'profile' : 'welcome');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#133E33] hover:bg-[#184d3f] text-amber-200 text-xs font-urdu font-medium transition cursor-pointer"
                >
                  {currentUser && !currentUser.isGuest ? 'پروفائل کھولیں' : 'اکاؤنٹ بنائیں / لاگ ان'}
                </button>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                  ایپ تھیم (ظاہری انداز):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'روشن (Light)', icon: Sun },
                    { id: 'dark', label: 'تاریک (Dark)', icon: Moon },
                    { id: 'system', label: 'خودکار (System)', icon: Monitor }
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleUpdate({ theme: t.id as any })}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                          settings.theme === t.id
                            ? 'bg-emerald-900/10 border-emerald-800 text-emerald-800 dark:text-emerald-400'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Size Scaling */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                  عربی و اردو فونٹ کا سائز:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'small', label: 'چھوٹا' },
                    { id: 'normal', label: 'معیاری' },
                    { id: 'large', label: 'بڑا' },
                    { id: 'extra', label: 'بہت بڑا' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleUpdate({ fontSize: f.id as any })}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                        settings.fontSize === f.id
                          ? 'bg-emerald-900/10 border-emerald-800 text-emerald-800 dark:text-emerald-400'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arabic Font Family */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                  عربی رسم الخط کا انداز:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'amiri', label: 'امِیری (کلاسیکی)' },
                    { id: 'naskh', label: 'نسخ (واضح)' },
                    { id: 'system', label: 'سسٹم فونٹ' }
                  ].map(ff => (
                    <button
                      key={ff.id}
                      onClick={() => handleUpdate({ fontFamily: ff.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold font-arabic transition cursor-pointer text-center ${
                        settings.fontFamily === ff.id
                          ? 'bg-emerald-900/10 border-emerald-800 text-emerald-800 dark:text-emerald-400'
                          : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {ff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* In-App PWA Install Banner */}
              <PWAInstallButton variant="settings" />

              {/* Native Android Project CTA */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                    نیٹو اینڈرائیڈ سورس کوڈ (Kotlin + Jetpack Compose)
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    APK کمپائل کرنے کے لیے مکمل Android Studio پروجیکٹ حاصل کریں
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAndroidExport();
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  کوڈ دیکھیں
                </button>
              </div>

              {/* Danger Zone Actions */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <button
                  onClick={handleClearHistory}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                >
                  <span>تلاش کی سابقہ تاریخ صاف کریں</span>
                  <Trash2 className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={handleResetProgress}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                >
                  <span>کوئز اور تعلیمی اسکور ری سیٹ کریں</span>
                  <RotateCcw className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'about' && (
            <div className="space-y-4 text-stone-800 dark:text-stone-200 text-xs leading-relaxed font-urdu">
              <div className="p-4 rounded-xl bg-emerald-950 text-white text-center space-y-1">
                <h4 className="text-xl font-arabic font-bold text-amber-200">لغت میٹ (LughatMate)</h4>
                <p className="text-xs text-stone-300 font-sans">Arabic–Urdu Learning Companion v1.0.0</p>
              </div>

              <div>
                <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1">
                  1. علمی مشن و ہدف:
                </h5>
                <p className="text-stone-600 dark:text-stone-400">
                  لغت میٹ کا مقصد مدارسِ دینیہ، اسلامی علوم اور عربی زبان کے اردو داں طلبہ کو ایک خالص علمی، تیز رفتار اور مکمل آف لائن تعلیمی ساتھی فراہم کرنا ہے، جس میں مستند مآخذ اور امانتِ علمی کو اولین ترجیح دی گئی ہے۔
                </p>
              </div>

              <div>
                <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1">
                  2. لغوی مآخذ اور ڈیٹا سورس (Attribution):
                </h5>
                <p className="text-stone-600 dark:text-stone-400">
                  بنڈل شدہ آف لائن لغت کا ذخیرہ مستند کلاسیکی کتبِ لغت (جیسے القاموس الوحید از مولانا وحید الزماں کیرانویؒ، مصباح اللغات از مولانا عبد الحفیظ بلیاویؒ، اور دروس اللغۃ العربیۃ از ڈاکٹر وی عبد الرحیم) کی تحقیق شدہ بنیادوں سے اخذ کیا گیا ہے جو خالص تعلیمی مفادِ عامہ (Open Educational Commons) کے تحت قانونی طور پر قابلِ استعمال ہے۔
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                <h5 className="font-bold text-xs mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>اہم شرعی و اخلاقی وضاحت (Educational Trust):</span>
                </h5>
                <p className="text-[11px] leading-relaxed">
                  لغت میٹ صرف ایک لسانی و لغوی مطالعہ کا ٹول ہے۔ یہ کسی طور پر بھی مستند مفتی، عالمِ دین یا استاد کا متبادل نہیں ہے اور نہ ہی اس کے ذریعے شرعی فتاویٰ یا استنباطِ احکام جائز ہے۔ جہاں بھی تصدیق شدہ معنی دستیاب نہ ہوں، ایپ اسے خودکار طریقے سے گھڑنے کے بجائے واضح طور پر "غیر دستیاب" ظاہر کرتی ہے۔
                </p>
              </div>
            </div>
          )}

          {activeSubTab === 'privacy' && (
            <div className="space-y-4 text-stone-800 dark:text-stone-200 text-xs leading-relaxed font-urdu">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>سچی اور شفاف پرائیویسی پالیسی (Truthful Privacy Notice)</span>
              </div>

              <p className="text-stone-600 dark:text-stone-400">
                لغت میٹ کو صارف کے احترام اور رازداری کے اعلیٰ ترین اصولوں پر تعمیر کیا گیا ہے:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <h6 className="font-bold text-stone-900 dark:text-stone-100 mb-0.5">
                    ✓ 100% مقامی ذخیرہ (Local-First Architecture):
                  </h6>
                  <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                    آپ کے تمام محفوظ الفاظ، مطالعاتی عبارات، ذاتی نوٹس اور کوئز کا اسکور صرف آپ کے فون/براؤزر کی مقامی میموری (LocalStorage / Room DB) میں محفوظ رہتے ہیں۔
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <h6 className="font-bold text-stone-900 dark:text-stone-100 mb-0.5">
                    ✓ زیرو ٹریکنگ اور کوئی تجزیاتی کوڈ نہیں (Zero Telemetry):
                  </h6>
                  <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                    اس ایپ میں کوئی گوگل اینالیٹکس، فیس بک SDK، یا اشتہاراتی ٹریکر شامل نہیں ہیں۔
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <h6 className="font-bold text-stone-900 dark:text-stone-100 mb-0.5">
                    ✓ حساس اجازتوں سے مکمل پاک (Zero Sensitive Permissions):
                  </h6>
                  <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                    ایپ لوکیشن، کیمرہ، رابطے (Contacts)، یا مائیکروفون کی کوئی اجازت طلب نہیں کرتی۔
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'feedback' && (
            <div className="space-y-4 text-right">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                  تصحیح یا تکنیکی مسئلہ رپورٹ کریں
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
                  اگر آپ کو کسی لفظ کے معنی، مادہ یا جملے میں کوئی لغزش نظر آئے تو برائے مہربانی مطلع فرمائیں۔ آپ کی رپورٹ مکمل رازداری کے ساتھ مقامی طور پر محفوظ رہے گی۔
                </p>
              </div>

              {feedbackSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-center text-xs font-semibold">
                  آپ کی تجویز یا رپورٹ مقامی طور پر محفوظ ہو چکی ہے۔ تعاون پر شکریہ!
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                      رپورٹ کی نوعیت:
                    </label>
                    <select
                      value={feedbackType}
                      onChange={e => setFeedbackType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-emerald-800"
                    >
                      <option value="meaning_correction">لغوی معنی یا حوالہ کی تصحیح</option>
                      <option value="technical_bug">تکنیکی خرابی یا بگ</option>
                      <option value="suggestion">نئے فیچر کی تجویز</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                      موضوع یا متعلقہ لفظ:
                    </label>
                    <input
                      type="text"
                      value={feedbackSubject}
                      onChange={e => setFeedbackSubject(e.target.value)}
                      placeholder="مثلاً: لفظ 'علم' کا مادہ یا سرچ اسکرین..."
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                      تفصیل و صحیح حوالہ:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={feedbackDetails}
                      onChange={e => setFeedbackDetails(e.target.value)}
                      placeholder="معتبر لغت یا کتاب کے صفحہ کا حوالہ درج کریں..."
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-urdu focus:outline-emerald-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    رپورٹ محفوظ کریں
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
