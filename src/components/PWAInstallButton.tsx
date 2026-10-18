import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'settings' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  if (variant === 'settings') {
    return (
      <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-800/20 text-emerald-800 dark:text-emerald-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">موبائل ایپ انسٹال کریں</h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">فون کی ہوم اسکرین پر براہِ راست آف لائن چلائیں</p>
          </div>
        </div>
        {isInstallable ? (
          <button
            onClick={install}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-semibold shadow-sm transition"
          >
            انسٹال کریں
          </button>
        ) : isIOS ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="px-3 py-1.5 rounded-lg border border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-800/10"
          >
            آئی فون پر انسٹال
          </button>
        ) : (
          <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded">
            براؤزر سپورٹڈ
          </span>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-50 dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-right">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setShowIOSGuide(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">آئی فون / آئی پیڈ پر انسٹالیشن</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                1. سفاری ٹول بار میں <strong>Share</strong> (شیئر) آئیکن پر ٹیپ کریں۔<br />
                2. فہرست میں نیچے سکرول کر کے <strong>Add to Home Screen</strong> (ہوم اسکرین میں شامل کریں) منتخب کریں۔
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                سمجھ گیا
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Header quick install button if installable or iOS
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition cursor-pointer"
        title="موبائل ہوم اسکرین پر انسٹال کریں"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">ایپ انسٹال کریں</span>
        <span className="sm:hidden">انسٹال</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-700/60 text-emerald-300 text-xs hover:bg-emerald-900/30"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>انسٹال</span>
        </button>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-50 dark:bg-stone-900 p-6 text-right shadow-2xl border border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">ہوم اسکرین پر شامل کریں</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                سفاری میں شیئر بٹن دبائیں اور "Add to Home Screen" کا انتخاب کریں۔
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold"
              >
                ٹھیک ہے
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
