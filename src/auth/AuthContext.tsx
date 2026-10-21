/**
 * Authentication Context for LughatMate
 * Supports Firebase Auth (Email/Password, Google Sign-In, Facebook Login, Email Verification, Password Reset)
 * with graceful offline and guest mode support, and human-readable provider-specific error handling.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  setPersistence,
  browserLocalPersistence, 
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from './firebase';

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  learningGoal?: string;
  createdAt?: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  isGuest: boolean;
}

export function getReadableAuthError(err: any, provider: 'email' | 'google' | 'facebook' | 'general' = 'general'): string {
  if (!err) return 'نامعلوم خرابی پیش آئی۔ (Unknown error occurred)';
  const code = typeof err === 'string' ? err : err.code || '';
  const rawMsg = err.message || '';

  // Check for configuration not found or disabled provider in Firebase project
  if (code === 'auth/configuration-not-found' || rawMsg.includes('CONFIGURATION_NOT_FOUND')) {
    if (provider === 'email') {
      return 'فائر بیس پراجیکٹ (lughat-mate) میں Email/Password سائن ان ابھی فعال نہیں ہے۔ Firebase Console > Authentication > Sign-in method سے اسے فعال (Enable) کریں۔';
    }
    if (provider === 'google') {
      return 'فائر بیس پراجیکٹ (lughat-mate) میں Google Sign-In ابھی فعال نہیں ہے۔ Firebase Console میں Google Provider کو آن کریں۔';
    }
    if (provider === 'facebook') {
      return 'فائر بیس پراجیکٹ (lughat-mate) میں Facebook Login ابھی فعال نہیں ہے۔ Firebase Console میں Facebook App ID اور App Secret شامل کر کے اسے فعال کریں۔';
    }
    return 'اس فائر بیس پروجیکٹ میں مطلوبہ Authentication سروس فعال نہیں ہے۔ Firebase Console سے تصدیق کریں۔';
  }

  if (code === 'auth/operation-not-allowed') {
    if (provider === 'email') {
      return 'ای میل اور پاس ورڈ کا طریقہ کار فائر بیس کنسول میں غیر فعال (Disabled) ہے۔ براہ کرم Sign-in method سے اسے فعال کریں۔';
    }
    if (provider === 'google') {
      return 'گوگل سائن ان فائر بیس کنسول میں غیر فعال ہے۔ براہ کرم Firebase Console سے Google Provider فعال کریں۔';
    }
    if (provider === 'facebook') {
      return 'فیس بک سائن ان فائر بیس کنسول میں غیر فعال ہے۔ براہ کرم Firebase Console سے Facebook Provider فعال کریں۔';
    }
    return 'یہ سائن ان ذریعہ فائر بیس کنسول میں فعال نہیں ہے۔';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'یہ ویب سائٹ فائر بیس کی مجاز فہرست (Authorized Domains) میں شامل نہیں ہے۔ براہ کرم Firebase Console > Authentication > Settings میں یہ ڈومین شامل کریں۔';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'ای میل یا پاس ورڈ درست نہیں ہے۔ براہ کرم درست معلومات درج کریں۔';
  }

  if (code === 'auth/email-already-in-use') {
    return 'اس ای میل پر پہلے سے ایک اکاؤنٹ موجود ہے۔ براہ کرم سائن ان کریں۔';
  }

  if (code === 'auth/weak-password') {
    return 'پاس ورڈ کم از کم 6 حروف پر مشتمل اور مضبوط ہونا چاہیے۔';
  }

  if (code === 'auth/invalid-email') {
    return 'درج کردہ ای میل ایڈریس کا فارمیٹ درست نہیں ہے۔';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'لاگ ان ونڈو صارف کی جانب سے بند کر دی گئی تھی۔';
  }

  if (code === 'auth/popup-blocked') {
    return 'براؤزر نے پاپ اپ بلاک کر دیا۔ براہ کرم ایڈریس بار سے پاپ اپ کی اجازت دیں۔';
  }

  if (code === 'auth/network-request-failed') {
    return 'انٹرنیٹ کنکشن کا مسئلہ ہے یا نیٹ ورک دستیاب نہیں ہے۔ آپ آف لائن موڈ میں بلا رکاوٹ مطالعہ جاری رکھ سکتے ہیں۔';
  }

  if (code === 'auth/too-many-requests') {
    return 'سیکیورٹی کی خاطر عارضی رکاوٹ: بہت زیادہ کوششیں کی گئی ہیں۔ براہ کرم چند منٹ بعد دوبارہ کوشش کریں۔';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'اس ای میل کے ساتھ کسی دوسرے ذریعے (مثلاً گوگل یا فیس بک) سے پہلے اکاؤنٹ موجود ہے۔ براہ کرم اسی ذریعے سے سائن ان کریں۔';
  }

  if (code === 'auth/requires-recent-login') {
    return 'حفاظتی وجوہات کی بنا پر اس حساس عمل سے قبل دوبارہ لاگ ان ہونا ضروری ہے۔';
  }

  return `لاگ ان میں مسئلہ پیش آیا (${code || 'Error'}): ${rawMsg || 'براہ کرم دوبارہ کوشش کریں'}`;
}

interface AuthContextType {
  currentUser: UserProfileData | null;
  rawFirebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isGuest: boolean;
  signInWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, fullName: string, goal?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  refreshVerificationStatus: () => Promise<boolean>;
  updateUserProfile: (data: { displayName?: string; learningGoal?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'lughatmate_guest_mode_active';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawFirebaseUser, setRawFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
    }
    return false;
  });

  // Sync user profile from Firestore or Auth
  const syncProfile = async (fbUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      let learningGoal = 'عربی زبان و ادب کی تفہیم';
      let createdAt = fbUser.metadata.creationTime || new Date().toISOString();

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.learningGoal) learningGoal = data.learningGoal;
        if (data.createdAt) createdAt = data.createdAt;

        // Update last login
        updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString(),
          emailVerified: fbUser.emailVerified
        }).catch(() => {});
      } else {
        // Create initial user doc
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'طالب علم',
          learningGoal,
          createdAt,
          lastLoginAt: new Date().toISOString(),
          emailVerified: fbUser.emailVerified
        }).catch((err) => {
          console.warn('Could not write initial Firestore user profile:', err);
        });
      }

      setCurrentUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || 'طالب علم',
        photoURL: fbUser.photoURL,
        learningGoal,
        createdAt,
        emailVerified: fbUser.emailVerified,
        isGuest: false
      });
    } catch (e) {
      console.warn('Profile sync fallback to Auth state:', e);
      setCurrentUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || 'طالب علم',
        photoURL: fbUser.photoURL,
        learningGoal: 'عربی زبان و ادب',
        createdAt: fbUser.metadata.creationTime,
        emailVerified: fbUser.emailVerified,
        isGuest: false
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setRawFirebaseUser(fbUser);
      if (fbUser) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_STORAGE_KEY);
        await syncProfile(fbUser);
      } else {
        if (isGuest) {
          setCurrentUser({
            uid: 'guest_user',
            email: null,
            displayName: 'مہمان طالب علم (Guest)',
            photoURL: null,
            learningGoal: 'مقامی مطالعہ و تمرین',
            createdAt: undefined,
            emailVerified: false,
            isGuest: true
          });
        } else {
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isGuest]);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
    setCurrentUser({
      uid: 'guest_user',
      email: null,
      displayName: 'مہمان طالب علم (Guest)',
      photoURL: null,
      learningGoal: 'مقامی مطالعہ و تمرین',
      createdAt: undefined,
      emailVerified: false,
      isGuest: true
    });
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setCurrentUser(null);
  };

  const signInWithEmail = async (email: string, pass: string, rememberMe: boolean = true) => {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      await syncProfile(userCred.user);
      return { success: true };
    } catch (err: any) {
      const message = getReadableAuthError(err, 'email');
      return { success: false, error: message };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string, goal: string = 'عربی ادب و متون کا فہم') => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const cleanName = fullName.trim() || 'طالب علم';
      
      await updateProfile(userCred.user, {
        displayName: cleanName
      });

      // Send verification email
      try {
        await sendEmailVerification(userCred.user);
      } catch (verifErr) {
        console.warn('Could not send verification email immediately:', verifErr);
      }

      // Save user profile in Firestore
      try {
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: userCred.user.email || email.trim(),
          displayName: cleanName,
          learningGoal: goal,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          emailVerified: false
        });
      } catch (fsErr) {
        console.warn('Could not write user profile to firestore:', fsErr);
      }

      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      await syncProfile(userCred.user);
      return { success: true };
    } catch (err: any) {
      const message = getReadableAuthError(err, 'email');
      return { success: false, error: message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      await syncProfile(result.user);
      return { success: true };
    } catch (err: any) {
      const message = getReadableAuthError(err, 'google');
      return { success: false, error: message };
    }
  };

  const signInWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      await syncProfile(result.user);
      return { success: true };
    } catch (err: any) {
      const message = getReadableAuthError(err, 'facebook');
      return { success: false, error: message };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      // In production security, we do not reveal if the email exists or not, but handle rate limits & config errors
      if (err.code === 'auth/too-many-requests') {
        return { success: false, error: 'بہت زیادہ درخواستیں بھیجی جا چکی ہیں۔ براہ کرم کچھ منٹ انتظار کریں۔' };
      } else if (err.code === 'auth/invalid-email') {
        return { success: false, error: 'درج کردہ ای میل درست نہیں ہے۔' };
      } else if (err.code === 'auth/configuration-not-found' || (err.message && err.message.includes('CONFIGURATION_NOT_FOUND'))) {
        return { success: false, error: 'فائر بیس پراجیکٹ میں پاس ورڈ ری سیٹ کنفیگریشن فعال نہیں ہے۔ Firebase Console سے جانچیں۔' };
      }
      // For general cases, return success so email enumeration is mitigated
      return { success: true };
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) {
      return { success: false, error: 'کوئی فعال اکاؤنٹ لاگ ان نہیں ہے۔' };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        return { success: false, error: 'تصدیقی ای میل بھیجنے کی حد پوری ہو گئی ہے۔ تھوڑی دیر بعد کوشش کریں۔' };
      }
      return { success: false, error: getReadableAuthError(err, 'email') };
    }
  };

  const refreshVerificationStatus = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const isVerified = auth.currentUser.emailVerified;
    setCurrentUser(prev => prev ? { ...prev, emailVerified: isVerified } : null);
    if (isVerified) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true
        });
      } catch {}
    }
    return isVerified;
  };

  const updateUserProfile = async (data: { displayName?: string; learningGoal?: string }) => {
    if (isGuest || !auth.currentUser) {
      // Update guest in-memory state
      setCurrentUser(prev => prev ? {
        ...prev,
        displayName: data.displayName || prev.displayName,
        learningGoal: data.learningGoal || prev.learningGoal
      } : null);
      return { success: true };
    }

    try {
      if (data.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName.trim()
        });
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...(data.displayName ? { displayName: data.displayName.trim() } : {}),
        ...(data.learningGoal ? { learningGoal: data.learningGoal.trim() } : {})
      });

      setCurrentUser(prev => prev ? {
        ...prev,
        displayName: data.displayName?.trim() || prev.displayName,
        learningGoal: data.learningGoal?.trim() || prev.learningGoal
      } : null);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'پروفائل اپ ڈیٹ کرنے میں غلطی ہوئی۔' };
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    setIsGuest(false);
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setCurrentUser(null);
  };

  const deleteAccount = async () => {
    if (isGuest) {
      setIsGuest(false);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setCurrentUser(null);
      return { success: true };
    }

    if (!auth.currentUser) {
      return { success: false, error: 'کوئی صارف لاگ ان نہیں ہے۔' };
    }

    try {
      const uid = auth.currentUser.uid;
      // Delete from firestore
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        console.warn('Could not delete user firestore record:', e);
      }

      await deleteUser(auth.currentUser);
      setCurrentUser(null);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        return { 
          success: false, 
          error: 'سیکیورٹی کی وجہ سے اکاؤنٹ حذف کرنے سے پہلے دوبارہ لاگ ان ہونا ضروری ہے۔ براہ کرم لاگ آؤٹ کر کے دوبارہ لاگ ان کریں۔' 
        };
      }
      return { success: false, error: getReadableAuthError(err, 'general') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        rawFirebaseUser,
        isLoading,
        isGuest,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithFacebook,
        sendPasswordReset,
        resendVerification,
        refreshVerificationStatus,
        updateUserProfile,
        signOut,
        deleteAccount,
        continueAsGuest,
        exitGuestMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
