import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { 
  X, Mail, Lock, User, Eye, EyeOff, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowRight, Sparkles, RefreshCw, LogOut, Trash2, 
  ExternalLink, Bookmark, Cloud, BookOpen, Clock, AlertTriangle, KeyRound
} from 'lucide-react';
import { getSavedWords, getSavedPassages } from '../../data/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';

export type AuthModalView = 
  | 'welcome' 
  | 'login' 
  | 'signup' 
  | 'forgot_password' 
  | 'verification' 
  | 'profile' 
  | 'terms';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthModalView;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialView = 'welcome' 
}) => {
  const { 
    currentUser, 
    isGuest, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    sendPasswordReset, 
    resendVerification, 
    refreshVerificationStatus, 
    updateUserProfile, 
    signOut, 
    deleteAccount, 
    continueAsGuest 
  } = useAuth();

  const [view, setView] = useState<AuthModalView>(initialView);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [learningGoal, setLearningGoal] = useState('عربی زبان و ادب کی تفہیم');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rate limits
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputConfirmation, setDeleteInputConfirmation] = useState('');

  // Editing profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');

  // Reset or switch view
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (currentUser && !currentUser.isGuest) {
        setView('profile');
        setEditName(currentUser.displayName || '');
        setEditGoal(currentUser.learningGoal || 'عربی زبان و ادب کی تفہیم');
      } else {
        setView(initialView);
      }
    }
  }, [isOpen, currentUser, initialView]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-stone-300' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'کمزور (Weak)', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'مناسب (Fair)', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'مضبوط (Strong)', color: 'bg-emerald-500' };
      case 4:
        return { score: 100, label: 'بہترین (Excellent)', color: 'bg-emerald-600' };
      default:
        return { score: 15, label: 'بہت مختصر', color: 'bg-rose-400' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('براہ کرم ای میل اور پاس ورڈ دونوں درج فرمائیں۔');
      return;
    }

    setLoading(true);
    const res = await signInWithEmail(email, password, rememberMe);
    setLoading(false);

    if (res.success) {
      setView('profile');
    } else {
      setErrorMsg(res.error || 'لاگ ان ناکام رہا۔');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('براہ کرم اپنا پورا نام درج فرمائیں۔');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('براہ کرم درست ای میل ایڈریس درج فرمائیں۔');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا ضروری ہے۔');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('پاس ورڈ اور تصدیقی پاس ورڈ ایک جیسے نہیں ہیں۔');
      return;
    }

    setLoading(true);
    const res = await signUpWithEmail(email, password, fullName, learningGoal);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('اکاؤنٹ کامیابی سے بن گیا! تصدیقی ای میل روانہ کر دی گئی ہے۔');
      setView('verification');
    } else {
      setErrorMsg(res.error || 'اکاؤنٹ بنانے میں رکاوٹ آئی۔');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);

    if (res.success) {
      setView('profile');
    } else {
      setErrorMsg(res.error || 'گوگل سائن ان میں رکاوٹ آئی۔');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('براہ کرم ای میل درج کریں۔');
      return;
    }

    setLoading(true);
    const res = await sendPasswordReset(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('اگر یہ ای میل اکاؤنٹ سے منسلک ہے، تو پاس ورڈ ری سیٹ کا لنک بھیج دیا گیا ہے۔ برائے مہربانی اپنا ان باکس یا اسپام فولڈر چیک کریں۔');
    } else {
      setErrorMsg(res.error || 'درخواست بھیجنے میں مسئلہ آیا۔');
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    const res = await resendVerification();
    setLoading(false);

    if (res.success) {
      setSuccessMsg('نیا تصدیقی لنک روانہ کر دیا گیا ہے۔');
      setResendCooldown(60);
    } else {
      setErrorMsg(res.error || 'ای میل بھیجنے میں رکاوٹ آئی۔');
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    const isVerified = await refreshVerificationStatus();
    setLoading(false);
    if (isVerified) {
      setSuccessMsg('ماشاءاللہ! آپ کی ای میل کامیابی سے تصدیق شدہ ہو چکی ہے۔');
    } else {
      setErrorMsg('ابھی تک ای میل کی تصدیق مکمل نہیں ہوئی۔ اگر آپ نے لنک کھول لیا ہے تو ایک بار صفحہ ریفریش کریں۔');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg('نام خالی نہیں ہو سکتا۔');
      return;
    }
    setLoading(true);
    const res = await updateUserProfile({
      displayName: editName,
      learningGoal: editGoal
    });
    setLoading(false);
    if (res.success) {
      setIsEditingProfile(false);
      setSuccessMsg('پروفائل کامیابی سے اپ ڈیٹ ہو گئی۔');
    } else {
      setErrorMsg(res.error || 'پروفائل محفوظ نہیں ہو سکی۔');
    }
  };

  const handleCloudSync = async () => {
    if (!currentUser || currentUser.isGuest) {
      setErrorMsg('کلاؤڈ سنک کے لیے براہ کرم ایک مستقل اکاؤنٹ میں لاگ ان کریں۔');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const savedWords = getSavedWords();
      const savedPassages = getSavedPassages();

      // Sync words to Firestore subcollection
      for (const word of savedWords) {
        const wordDocId = word.id || `word_${Date.now()}`;
        await setDoc(doc(db, 'users', currentUser.uid, 'saved_words', wordDocId), {
          id: wordDocId,
          userId: currentUser.uid,
          wordId: word.wordId || '',
          arabic: word.arabic,
          urdu: word.urdu,
          root: word.root || '',
          personalNotes: word.personalNotes || '',
          tag: word.tag || 'عمومی',
          dateAdded: word.dateAdded || Date.now()
        }, { merge: true });
      }

      // Sync passages
      for (const passage of savedPassages) {
        const passageDocId = passage.id || `pass_${Date.now()}`;
        await setDoc(doc(db, 'users', currentUser.uid, 'saved_passages', passageDocId), {
          id: passageDocId,
          userId: currentUser.uid,
          title: passage.title,
          arabicText: passage.arabicText,
          urduNotes: passage.urduNotes || '',
          category: passage.category || 'عمومی',
          dateSaved: passage.dateSaved || Date.now(),
          bookmarked: passage.bookmarked || false
        }, { merge: true });
      }

      setSyncStatus(`کامیابی! ${savedWords.length} الفاظ اور ${savedPassages.length} متون کلاؤڈ پر محفوظ ہو گئے۔`);
    } catch (err: any) {
      setSyncStatus('کلاؤڈ بیک اپ میں مسئلہ پیش آیا۔ براہ کرم انٹرنیٹ کنکشن چیک کریں۔');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInputConfirmation.trim() !== 'حذف') {
      setErrorMsg('تصدیق کے لیے باکس میں لفظ "حذف" لکھیں۔');
      return;
    }
    setLoading(true);
    const res = await deleteAccount();
    setLoading(false);
    if (res.success) {
      setShowDeleteConfirm(false);
      onClose();
    } else {
      setErrorMsg(res.error || 'اکاؤنٹ حذف نہیں کیا جا سکا۔');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-amber-50/95 dark:bg-stone-900 border border-emerald-900/40 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-[#133E33] text-white px-6 py-4.5 flex items-center justify-between border-b border-emerald-800 relative shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 p-1 flex items-center justify-center shadow-inner">
              <img src="/icon.svg" alt="LughatMate" className="w-7 h-7 rounded-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold font-arabic text-amber-200 flex items-center gap-2">
                <span>لُغَتْ مِیْٹ</span>
                <span className="text-xs font-normal text-emerald-200 opacity-90">|</span>
                <span className="text-xs font-normal font-sans text-stone-200">
                  {view === 'welcome' && 'خوش آمدید'}
                  {view === 'login' && 'لاگ ان'}
                  {view === 'signup' && 'نیا اکاؤنٹ بنائیں'}
                  {view === 'forgot_password' && 'پاس ورڈ کی بحالی'}
                  {view === 'verification' && 'ای میل تصدیق'}
                  {view === 'profile' && 'طالب علم پروفائل'}
                  {view === 'terms' && 'شرائط و رازداری'}
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800/80 text-emerald-200 hover:text-white transition cursor-pointer"
            aria-label="بند کریں"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <p className="font-urdu leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <p className="font-urdu leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* VIEW A: WELCOME / GET STARTED */}
          {view === 'welcome' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2 pt-2">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 mb-1">
                  <BookOpen className="w-8 h-8 text-emerald-800 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold font-arabic text-stone-900 dark:text-amber-200">
                  فہمِ عربی کا تعلیمی سفر شروع کریں
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-urdu max-w-sm mx-auto leading-relaxed">
                  اپنا مستقل طالب علم اکاؤنٹ بنائیں تاکہ آپ کا ذخیرہ الفاظ اور علمی نوٹس کلاؤڈ پر محفوظ رہیں اور کسی بھی ڈیوائس پر دستیاب ہوں۔
                </p>
              </div>

              {/* Honest Benefits Card */}
              <div className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 text-right space-y-3">
                <p className="text-xs font-bold font-urdu text-emerald-900 dark:text-emerald-300 border-b border-stone-100 dark:border-stone-700 pb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  اکاؤنٹ بنانے کے حقیقی علمی فوائد:
                </p>
                <ul className="text-xs text-stone-600 dark:text-stone-300 font-urdu space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>محفوظ کلاؤڈ بیک اپ: فون تبدیل کرنے پر بھی آپ کے محفوظ کردہ الفاظ ضائع نہیں ہوں گے۔</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>کلاؤڈ نوٹس اور کلاسیکی متون کا مطالعہ ہر جگہ ہم وقت (Sync)۔</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>روزانہ کی علمی تمرین اور تسلسل (Streak) کا ریکارڈ۔</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>مفت اور اشتہارات سے پاک: خالص تعلیمی مقاصد کے لیے تیار شدہ۔</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  onClick={() => { setErrorMsg(null); setView('signup'); }}
                  className="w-full py-3 px-4 rounded-xl bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>نیا اکاؤنٹ بنائیں (Create Account)</span>
                </button>

                <button
                  onClick={() => { setErrorMsg(null); setView('login'); }}
                  className="w-full py-3 px-4 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-urdu text-sm font-semibold border border-stone-200 dark:border-stone-700 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں (Sign In)</span>
                </button>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      continueAsGuest();
                      onClose();
                    }}
                    className="text-xs font-urdu text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 underline decoration-dotted transition cursor-pointer"
                  >
                    بغیر اکاؤنٹ کے بطور مہمان جاری رکھیں (Continue as Guest)
                  </button>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-urdu mt-0.5">
                    (مہمان موڈ میں ڈیٹا صرف آپ کے موجودہ براؤزر میں مقامی طور پر رہے گا)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: CREATE ACCOUNT */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  پورا نام (Full Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثلاً: محمد طلحہ فاروقی"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-urdu focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  ای میل ایڈریس (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700 text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  پاس ورڈ (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کم از کم 6 حروف"
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700 text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-500 font-urdu">
                      <span>طاقت: {passwordStrength.label}</span>
                      <span>نمبر، کیپیٹل اور علامات استعمال کریں</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  پاس ورڈ کی تصدیق (Confirm Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="پاس ورڈ دوبارہ درج کریں"
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700 text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  علمی مقصد (Learning Goal)
                </label>
                <select
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-urdu focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="عربی زبان و ادب کی تفہیم">عربی زبان و ادب کی تفہیم</option>
                  <option value="درسِ نظامی و مدرسہ نصاب">درسِ نظامی و مدرسہ نصاب</option>
                  <option value="قرآنی لغات و تراکیب نحویہ">قرآنی لغات و تراکیب نحویہ</option>
                  <option value="کلاسیکی کتب کا براہِ راست مطالعہ">کلاسیکی کتب کا براہِ راست مطالعہ</option>
                  <option value="عربی بول چال و گفتگو">عربی بول چال و گفتگو</option>
                </select>
              </div>

              {/* Terms Link */}
              <p className="text-[11px] text-stone-500 font-urdu leading-relaxed">
                اکاؤنٹ بنا کر آپ ہماری{' '}
                <button
                  type="button"
                  onClick={() => setView('terms')}
                  className="text-emerald-700 dark:text-amber-400 underline font-semibold cursor-pointer"
                >
                  شرائطِ استعمال و رازداری پالیسی
                </button>
                {' '}سے متفق ہوتے ہیں۔
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <User className="w-4 h-4 text-amber-400" />}
                <span>اکاؤنٹ مکمل کریں</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setView('login'); }}
                  className="text-xs text-stone-600 dark:text-stone-300 font-urdu hover:text-emerald-800 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  پہلے سے اکاؤنٹ ہے؟ <span className="font-bold underline text-emerald-700 dark:text-amber-400">لاگ ان کریں</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW C: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  ای میل ایڈریس (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700 text-left"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold font-urdu text-stone-700 dark:text-stone-300">
                    پاس ورڈ (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(null); setView('forgot_password'); }}
                    className="text-xs font-urdu text-emerald-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    پاس ورڈ بھول گئے؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="پاس ورڈ درج کریں"
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700 text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-stone-300"
                />
                <label htmlFor="rememberMe" className="text-xs font-urdu text-stone-600 dark:text-stone-300 cursor-pointer select-none">
                  مجھے اس ڈیوائس پر لاگ ان رکھیں (Remember Session)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <KeyRound className="w-4 h-4 text-amber-400" />}
                <span>لاگ ان کریں (Sign In)</span>
              </button>

              {/* Google Sign-in */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200 dark:border-stone-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-amber-50 dark:bg-stone-900 text-stone-500 font-urdu">یا</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-urdu text-xs font-medium border border-stone-300 dark:border-stone-700 shadow-sm transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>گوگل اکاؤنٹ کے ذریعے لاگ ان (Google Sign-In)</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setView('signup'); }}
                  className="text-xs text-stone-600 dark:text-stone-300 font-urdu hover:text-emerald-800 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  اکاؤنٹ نہیں ہے؟ <span className="font-bold underline text-emerald-700 dark:text-amber-400">نیا اکاؤنٹ بنائیں</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW D: FORGOT PASSWORD */}
          {view === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-200">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-urdu text-stone-900 dark:text-stone-100">
                  پاس ورڈ کی بحالی
                </h3>
                <p className="text-xs text-stone-500 font-urdu leading-relaxed max-w-xs mx-auto">
                  اپنا رجسٹرڈ ای میل ایڈریس درج کریں۔ ہم آپ کو پاس ورڈ ری سیٹ کرنے کا محفوظ لنک روانہ کریں گے۔
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold font-urdu text-stone-700 dark:text-stone-300 mb-1.5">
                  ای میل ایڈریس (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700 text-left"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Mail className="w-4 h-4 text-amber-400" />}
                <span>بحالی کا لنک بھیجیں (Send Reset Link)</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setView('login'); }}
                  className="text-xs font-urdu text-emerald-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>واپس لاگ ان کی طرف جائیں</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW E: EMAIL VERIFICATION */}
          {view === 'verification' && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-200">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold font-urdu text-stone-900 dark:text-stone-100">
                  ای میل تصدیق کا عمل
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-urdu leading-relaxed max-w-sm mx-auto mt-1">
                  ہم نے <span className="font-mono font-semibold text-emerald-800 dark:text-amber-300" dir="ltr">{currentUser?.email || email}</span> پر تصدیقی لنک بھیجا ہے۔ اپنے اکاؤنٹ کی مکمل حفاظت کے لیے لنک پر کلک کریں۔
                </p>
              </div>

              <div className="bg-amber-100/50 dark:bg-stone-800/80 p-4 rounded-2xl border border-amber-200 dark:border-stone-700 text-right space-y-2 text-xs font-urdu text-stone-700 dark:text-stone-300">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>تصدیق کی کیفیت:</span>
                </div>
                <p>
                  {currentUser?.emailVerified ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> ای میل تصدیق شدہ ہے!
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      غیر تصدیق شدہ (Unverified) — ان باکس یا اسپام میں موصولہ لنک کھولیں۔
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleCheckVerification}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-urdu text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>تصدیق کی کیفیت دوبارہ چیک کریں (Check Status)</span>
                </button>

                <button
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-700 dark:text-stone-200 font-urdu text-xs font-medium border border-stone-300 dark:border-stone-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0 ? `دوبارہ بھیجنے کے لیے ${resendCooldown} سیکنڈ انتظار کریں` : 'تصدیقی ای میل دوبارہ بھیجیں (Resend Email)'}
                  </span>
                </button>

                <button
                  onClick={() => setView('profile')}
                  className="w-full py-2 px-4 text-xs font-urdu text-stone-500 hover:text-stone-800 dark:text-stone-400 cursor-pointer"
                >
                  پروفائل کی طرف آگے بڑھیں
                </button>
              </div>
            </div>
          )}

          {/* VIEW F: USER PROFILE */}
          {view === 'profile' && (
            <div className="space-y-5">
              {currentUser?.isGuest ? (
                /* Guest State banner */
                <div className="bg-amber-100/60 dark:bg-stone-800 p-4 rounded-2xl border border-amber-300/80 dark:border-stone-700 text-right space-y-3">
                  <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-bold font-urdu">
                    <User className="w-5 h-5 text-amber-600" />
                    <span>آپ فی الحال بطور مہمان (Guest) استعمال کر رہے ہیں</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 font-urdu leading-relaxed">
                    آپ کے نوٹس اور محفوظ الفاظ صرف اس براؤزر میں ہیں۔ اگر آپ ڈیوائس تبدیل کریں گے یا براؤزر ہسٹری صاف کریں گے تو ڈیٹا محفوظ نہیں رہے گا۔ کلاؤڈ سنک کے لیے اکاؤنٹ بنائیں۔
                  </p>
                  <button
                    onClick={() => { setErrorMsg(null); setView('signup'); }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-amber-400" />
                    <span>مفت اکاؤنٹ بنائیں اور ڈیٹا محفوظ کریں</span>
                  </button>
                </div>
              ) : (
                /* Authenticated Profile View */
                <div className="space-y-4">
                  {/* Avatar & Info Badge */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#133E33] text-amber-300 flex items-center justify-center text-xl font-bold font-arabic shadow-inner border border-amber-400/40">
                      {currentUser?.displayName ? currentUser.displayName.slice(0, 1) : 'ط'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base font-urdu text-stone-900 dark:text-stone-100">
                          {currentUser?.displayName || 'طالب علم'}
                        </h4>
                        {currentUser?.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-urdu bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            تصدیق شدہ
                          </span>
                        ) : (
                          <button
                            onClick={() => setView('verification')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-urdu bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition cursor-pointer"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            تصدیق درکار ہے
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 font-mono mt-0.5" dir="ltr">
                        {currentUser?.email}
                      </p>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-urdu mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>ہدف: {currentUser?.learningGoal || 'عربی زبان و ادب کی تفہیم'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Account Metadata Cards */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-urdu">
                    <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>اکاؤنٹ کی تاریخ:</span>
                      </div>
                      <p className="font-sans font-medium text-stone-800 dark:text-stone-200 text-[11px]">
                        {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ur-PK') : 'حال ہی میں'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center gap-1.5 text-stone-500 mb-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>مقامی ذخیرہ:</span>
                      </div>
                      <p className="font-urdu font-medium text-stone-800 dark:text-stone-200 text-[11px]">
                        {getSavedWords().length} الفاظ محفوظ
                      </p>
                    </div>
                  </div>

                  {/* Cloud Sync Section */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <span className="text-xs font-bold font-urdu text-emerald-900 dark:text-emerald-200">
                          کلاؤڈ بیک اپ و ہم وقتی (Cloud Sync)
                        </span>
                      </div>
                      <button
                        onClick={handleCloudSync}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-lg bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-xs font-medium shadow-sm transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'محفوظ ہو رہا ہے...' : 'ابھی سنک کریں'}</span>
                      </button>
                    </div>
                    {syncStatus && (
                      <p className="text-[11px] font-urdu text-emerald-800 dark:text-emerald-300 leading-normal">
                        {syncStatus}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-500 font-urdu">
                      آپ کے منتخب الفاظ، نوٹس، اور مطالعہ شدہ متون آپ کے ذاتی محفوظ کلاؤڈ ڈیٹا بیس میں محفوظ کیے جاتے ہیں۔
                    </p>
                  </div>

                  {/* Edit Profile Section */}
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                      <h5 className="text-xs font-bold font-urdu text-stone-800 dark:text-stone-200">
                        پروفائل میں ترمیم کریں
                      </h5>
                      <div>
                        <label className="block text-[11px] font-urdu text-stone-600 dark:text-stone-400 mb-1">
                          پورا نام
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-amber-50/40 dark:bg-stone-900 text-sm font-urdu"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-urdu text-stone-600 dark:text-stone-400 mb-1">
                          علمی ہدف
                        </label>
                        <input
                          type="text"
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-amber-50/40 dark:bg-stone-900 text-sm font-urdu"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-urdu text-xs font-medium cursor-pointer"
                        >
                          تبدیلیاں محفوظ کریں
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 rounded-xl border border-stone-300 font-urdu text-xs text-stone-600 hover:bg-stone-100 cursor-pointer"
                        >
                          منسوخ
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-urdu text-xs font-medium transition cursor-pointer"
                    >
                      پروفائل و تعلیمی ہدف میں ترمیم
                    </button>
                  )}
                </div>
              )}

              {/* Actions: Sign out & Delete account */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <button
                  onClick={async () => {
                    await signOut();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-urdu text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-stone-500" />
                  <span>لاگ آؤٹ کریں (Sign Out)</span>
                </button>

                {!currentUser?.isGuest && (
                  <div>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2 text-rose-600 dark:text-rose-400 hover:underline font-urdu text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>اکاؤنٹ ہمیشہ کے لیے حذف کریں (Delete Account)</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-right space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold font-urdu text-rose-800 dark:text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>کیا آپ واقعی اپنا اکاؤنٹ حذف کرنا چاہتے ہیں؟</span>
                        </div>
                        <p className="text-[11px] font-urdu text-rose-700 dark:text-rose-400 leading-normal">
                          اس سے آپ کا کلاؤڈ پروفائل اور تمام آن لائن ڈیٹا ہمیشہ کے لیے مٹ جائے گا۔ تصدیق کے لیے نیچے دیے گئے خانے میں لفظ <span className="font-bold">"حذف"</span> لکھیں۔
                        </p>
                        <input
                          type="text"
                          value={deleteInputConfirmation}
                          onChange={(e) => setDeleteInputConfirmation(e.target.value)}
                          placeholder='یہاں "حذف" ٹائپ کریں'
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-stone-900 font-urdu"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading || deleteInputConfirmation.trim() !== 'حذف'}
                            className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-urdu text-xs font-medium cursor-pointer disabled:opacity-40"
                          >
                            مستقل حذف کریں
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteInputConfirmation('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 font-urdu text-xs text-stone-600 cursor-pointer"
                          >
                            منسوخ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW G: TERMS AND PRIVACY */}
          {view === 'terms' && (
            <div className="space-y-4 text-right">
              <div className="space-y-1">
                <h3 className="text-base font-bold font-urdu text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <span>شرائطِ استعمال و رازداری کی پالیسی (Privacy & Terms)</span>
                </h3>
                <p className="text-xs text-stone-500 font-urdu">
                  LughatMate ایک دیانت دار اور غیر تجارتی تعلیمی پلیٹ فارم ہے۔
                </p>
              </div>

              <div className="bg-white dark:bg-stone-800/70 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-urdu text-stone-700 dark:text-stone-300 space-y-3 leading-relaxed">
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    ۱. ڈیٹا کی رازداری اور ذاتی حفاظت:
                  </h4>
                  <p>
                    ہم صارفین کا کوئی بھی نجی ڈیٹا (جیسے رابطے، تصاویر، لوکیشن، مائیکروفون) طلب نہیں کرتے۔ صارف کا ای میل صرف اکاؤنٹ کی تصدیق اور کلاؤڈ بیک اپ کے لیے استعمال ہوتا ہے۔
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    ۲. تجارتی مقاصد سے پاک:
                  </h4>
                  <p>
                    اس ایپ میں کسی قسم کے اشتہارات یا یوزر ٹریکنگ ٹولز شامل نہیں ہیں۔ ہم صارفین کا ڈیٹا کسی تیسرے فریق کو فروخت نہیں کرتے۔
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    ۳. ڈیٹا کی ملکیت:
                  </h4>
                  <p>
                    طالب علم اپنے تمام نوٹس اور الفاظ کا خود مالک ہے۔ آپ کسی بھی وقت اپنے اکاؤنٹ سے اپنا مکمل ڈیٹا ڈاؤن لوڈ (JSON برآمد) یا اکاؤنٹ مستقل طور پر حذف کر سکتے ہیں۔
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    ۴. سیکیورٹی اور تصدیق:
                  </h4>
                  <p>
                    اکاؤنٹ کی توثیق کے لیے محفوظ ترین انڈسٹری اسٹینڈرڈز (Firebase Auth اور SSL اینکرپشن) بروئے کار لائے جاتے ہیں۔
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView('signup')}
                className="w-full py-2.5 rounded-xl bg-[#133E33] hover:bg-[#184d3f] text-amber-200 font-urdu text-xs font-medium cursor-pointer"
              >
                سمجھ آگئی، اکاؤنٹ بنانے کے لیے واپس جائیں
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
