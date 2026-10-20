/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { DictionaryScreen } from './screens/DictionaryScreen';
import { TextStudyScreen } from './screens/TextStudyScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { WordDetailModal } from './components/WordDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AndroidCodeExportModal } from './components/AndroidCodeExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AuthModal, AuthModalView } from './components/auth/AuthModal';
import { useAuth } from './auth/AuthContext';
import { DictionaryItem } from './data/starterDictionary';
import { getAppSettings, SavedPassageRecord } from './data/storage';
import { 
  Home, Book, FileText, GraduationCap, Library, 
  Settings, Smartphone, BookOpen, User, LogIn 
} from 'lucide-react';

export default function App() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'dictionary' | 'text_study' | 'practice' | 'library'>('home');
  const [dictionarySearchParam, setDictionarySearchParam] = useState<string>('');
  const [activeRootFilter, setActiveRootFilter] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<DictionaryItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAndroidExportOpen, setIsAndroidExportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('welcome');
  const [saveVersion, setSaveVersion] = useState(0);

  // Sync theme on mount
  useEffect(() => {
    const settings = getAppSettings();
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const handleNavigate = (tab: 'home' | 'dictionary' | 'text_study' | 'practice' | 'library', searchParam?: string) => {
    setActiveTab(tab);
    if (searchParam !== undefined) {
      setDictionarySearchParam(searchParam);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRoot = (root: string) => {
    setActiveRootFilter(root);
    setActiveTab('dictionary');
    setDictionarySearchParam('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [selectedPassageForStudy, setSelectedPassageForStudy] = useState<SavedPassageRecord | null>(null);

  const handleOpenPassage = (passage: SavedPassageRecord) => {
    setSelectedPassageForStudy(passage);
    setActiveTab('text_study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudyQuote = (arabicText: string, title: string, urduNotes: string) => {
    setSelectedPassageForStudy({
      id: `quote_${Date.now()}`,
      title,
      arabicText,
      urduNotes,
      category: 'حکمت و اقوال',
      dateSaved: Date.now(),
      bookmarked: false
    });
    setActiveTab('text_study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-amber-50/30 dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Scholarly Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#133E33] text-white shadow-md border-b border-emerald-900/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div 
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 p-1 flex items-center justify-center shadow-inner group-hover:scale-105 transition">
              <img src="/icon.svg" alt="LughatMate" className="w-8 h-8 rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wide font-arabic text-amber-200">
                  لُغَتْ مِیْٹ
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-stone-300 font-urdu -mt-0.5 opacity-90 hidden sm:block">
                عربی و اردو تعلیمی ساتھی
              </p>
            </div>
          </div>

          {/* Right Action Icons: User Auth, Offline status, PWA install, Android button, Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Account / Profile Button */}
            {currentUser && !currentUser.isGuest ? (
              <button
                onClick={() => {
                  setAuthModalView('profile');
                  setIsAuthOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-urdu font-medium transition cursor-pointer"
                title="طالب علم پروفائل و کلاؤڈ سنک"
              >
                <div className="w-5 h-5 rounded-full bg-[#133E33] text-amber-300 font-arabic text-[11px] font-bold flex items-center justify-center border border-amber-400/60 shadow-inner">
                  {currentUser.displayName ? currentUser.displayName.slice(0, 1) : 'ط'}
                </div>
                <span className="hidden sm:inline font-urdu max-w-[80px] truncate">
                  {currentUser.displayName || 'طالب علم'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalView('welcome');
                  setIsAuthOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-stone-200 hover:text-white border border-emerald-700/70 text-xs font-urdu font-medium transition cursor-pointer"
                title="طالب علم لاگ ان / نیا اکاؤنٹ"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">
                  {currentUser?.isGuest ? 'مہمان (Guest)' : 'لاگ ان'}
                </span>
              </button>
            )}

            <OfflineIndicator />
            <PWAInstallButton variant="header" />

            <button
              onClick={() => setIsAndroidExportOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-200 border border-emerald-700/60 text-xs font-medium transition cursor-pointer"
              title="اینڈرائیڈ کوڈ و APK دیکھیں"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>اینڈرائیڈ پروجیکٹ</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-stone-200 hover:text-white border border-emerald-800/80 transition cursor-pointer"
              aria-label="ترتیبات کھولیں"
              title="ترتیبات"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-16">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onOpenWord={setSelectedWord}
            onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
            saveVersion={saveVersion}
            onStudyQuote={handleStudyQuote}
            onOpenAuth={(view) => {
              setAuthModalView(view || 'welcome');
              setIsAuthOpen(true);
            }}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryScreen
            initialQuery={dictionarySearchParam}
            rootFilter={activeRootFilter}
            onClearRootFilter={() => setActiveRootFilter(null)}
            onOpenWord={setSelectedWord}
          />
        )}

        {activeTab === 'text_study' && (
          <TextStudyScreen
            onOpenWordDetail={setSelectedWord}
            initialPassage={selectedPassageForStudy}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeScreen
            onOpenWordDetail={setSelectedWord}
          />
        )}

        {activeTab === 'library' && (
          <LibraryScreen
            onOpenWordDetail={setSelectedWord}
            onOpenPassageInWorkspace={handleOpenPassage}
          />
        )}
      </main>

      {/* Material 3 Style Bottom Navigation Bar for Mobile and Desktop */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800 shadow-lg"
        dir="rtl"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
          {[
            { id: 'home', label: 'صفحہ اول', icon: Home },
            { id: 'dictionary', label: 'لغت', icon: Book },
            { id: 'text_study', label: 'مطالعہ', icon: FileText },
            { id: 'practice', label: 'تمرین', icon: GraduationCap },
            { id: 'library', label: 'لائبریری', icon: Library }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (item.id === 'dictionary') {
                    setActiveRootFilter(null);
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center justify-center py-1 transition cursor-pointer relative ${
                  isActive
                    ? 'text-emerald-800 dark:text-emerald-400 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-1 w-10 h-6 bg-emerald-100 dark:bg-emerald-950/80 rounded-full -z-10 animate-in fade-in duration-150"></span>
                )}
                <Icon className={`w-5 h-5 mb-0.5 transition ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[11px] font-urdu leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Word Detail Modal */}
      <WordDetailModal
        item={selectedWord}
        onClose={() => setSelectedWord(null)}
        onSelectRoot={handleSelectRoot}
        onWordSavedChange={() => setSaveVersion(v => v + 1)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAndroidExport={() => setIsAndroidExportOpen(true)}
        onOpenAuth={(view) => {
          setAuthModalView(view || 'welcome');
          setIsAuthOpen(true);
        }}
      />

      {/* Android Code & APK Export Modal */}
      <AndroidCodeExportModal
        isOpen={isAndroidExportOpen}
        onClose={() => setIsAndroidExportOpen(false)}
      />

      {/* Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialView={authModalView}
      />
    </div>
  );
}
