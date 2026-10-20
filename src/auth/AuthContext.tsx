/**
 * Authentication Context for LughatMate
 * Supports Firebase Auth (Email/Password, Google Sign-In, Email Verification, Password Reset)
 * with graceful offline and guest mode support.
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
import { auth, db, googleProvider } from './firebase';

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

interface AuthContextType {
  currentUser: UserProfileData | null;
  rawFirebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isGuest: boolean;
  signInWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, fullName: string, goal?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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
      let message = 'لاگ ان کرنے میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'ای میل یا پاس ورڈ غلط ہے۔ براہ کرم درست معلومات درج کریں۔';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'کئی غلط کوششیں ہو چکی ہیں۔ سیکیورٹی کی خاطر کچھ دیر بعد کوشش کریں۔';
      } else if (err.code === 'auth/invalid-email') {
        message = 'درج کردہ ای میل کا فارمیٹ درست نہیں ہے۔';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'انٹرنیٹ کنکشن دستیاب نہیں ہے۔ آف لائن موڈ میں جاری رکھیں۔';
      }
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
      let message = 'اکاؤنٹ بنانے میں رکاوٹ آئی۔ براہ کرم دوبارہ کوشش کریں۔';
      if (err.code === 'auth/email-already-in-use') {
        message = 'اس ای میل پر پہلے سے ایک اکاؤنٹ موجود ہے۔ براہ کرم لاگ ان کریں۔';
      } else if (err.code === 'auth/weak-password') {
        message = 'پاس ورڈ کم از کم 6 حروف کا اور محفوظ ہونا چاہیے۔';
      } else if (err.code === 'auth/invalid-email') {
        message = 'ای میل کا فارمیٹ غلط ہے۔';
      }
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
      let message = 'گوگل سے لاگ ان مکمل نہیں ہو سکا۔';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'گوگل سائن ان ونڈو بند کر دی گئی تھی۔';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'براؤزر نے پاپ اپ بلاک کر دیا۔ براہ کرم پاپ اپس کی اجازت دیں۔';
      }
      return { success: false, error: message };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      // In production security, we do not reveal if the email exists or not, but handle rate limits
      if (err.code === 'auth/too-many-requests') {
        return { success: false, error: 'بہت زیادہ درخواستیں بھیجی جا چکی ہیں۔ براہ کرم کچھ منٹ انتظار کریں۔' };
      } else if (err.code === 'auth/invalid-email') {
        return { success: false, error: 'درج کردہ ای میل درست نہیں ہے۔' };
      }
      // For general cases, return success or a neutral message so email enumeration is mitigated
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
      return { success: false, error: 'تصدیقی ای میل بھیجنے میں مسئلہ آیا۔' };
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
      return { success: false, error: 'اکاؤنٹ حذف نہیں ہو سکا۔ دوبارہ کوشش کریں۔' };
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
