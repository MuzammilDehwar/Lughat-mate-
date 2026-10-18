import React, { useState, useEffect, useMemo } from 'react';
import { 
  getSavedWords, 
  removeSavedWord, 
  saveWord, 
  SavedWordRecord,
  getSavedPassages, 
  deletePassage, 
  savePassage, 
  SavedPassageRecord,
  exportLibraryJSON, 
  importLibraryJSON 
} from '../data/storage';
import { STARTER_DICTIONARY, DictionaryItem } from '../data/starterDictionary';
import { speakArabicWord } from '../utils/arabic';
import { 
  Library, Bookmark, FileText, Search, Trash2, 
  Download, Upload, Edit3, Check, X, 
  AlertTriangle, Share2, Volume2, Plus, 
  Calendar, Tag, BookOpen 
} from 'lucide-react';

interface LibraryScreenProps {
  onOpenWordDetail: (item: DictionaryItem) => void;
  onOpenPassageInWorkspace: (passage: SavedPassageRecord) => void;
}

type Tab = 'words' | 'passages';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onOpenWordDetail,
  onOpenPassageInWorkspace
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('words');
  const [savedWords, setSavedWords] = useState<SavedWordRecord[]>([]);
  const [savedPassages, setSavedPassages] = useState<SavedPassageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState<{ type: 'word' | 'passage'; id: string; title: string } | null>(null);

  // Edit word note modal state
  const [editingWord, setEditingWord] = useState<SavedWordRecord | null>(null);
  const [editedNote, setEditedNote] = useState('');
  const [editedTag, setEditedTag] = useState('');

  // Import / Export states
  const [importNotice, setImportNotice] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = () => {
    setSavedWords(getSavedWords());
    setSavedPassages(getSavedPassages());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Unique tags for saved words
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    savedWords.forEach(w => {
      if (w.tag) set.add(w.tag);
    });
    return Array.from(set);
  }, [savedWords]);

  // Filtered words
  const filteredWords = useMemo(() => {
    return savedWords.filter(w => {
      const matchQuery =
        !searchQuery.trim() ||
        w.arabic.includes(searchQuery) ||
        w.urdu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.personalNotes && w.personalNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTag = selectedTag === 'all' || w.tag === selectedTag;
      return matchQuery && matchTag;
    });
  }, [savedWords, searchQuery, selectedTag]);

  // Filtered passages
  const filteredPassages = useMemo(() => {
    return savedPassages.filter(p => {
      return (
        !searchQuery.trim() ||
        p.title.includes(searchQuery) ||
        p.arabicText.includes(searchQuery) ||
        p.urduNotes.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [savedPassages, searchQuery]);

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'word') {
      removeSavedWord(itemToDelete.id);
    } else {
      deletePassage(itemToDelete.id);
    }
    setItemToDelete(null);
    loadData();
  };

  const handleSaveEditedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;
    saveWord({
      ...editingWord,
      personalNotes: editedNote.trim() || undefined,
      tag: editedTag.trim() || undefined
    });
    setEditingWord(null);
    loadData();
  };

  const handleExportJSON = () => {
    const jsonStr = exportLibraryJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LughatMate_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const res = importLibraryJSON(content);
      setImportNotice(res);
      if (res.success) {
        loadData();
      }
      setTimeout(() => setImportNotice(null), 4000);
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-arabic text-emerald-950 dark:text-emerald-200">
            میری ذاتی لائبریری (My Library)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-urdu">
            آپ کے محفوظ کردہ الفاظ، عبارات، ذاتی نوٹس اور کلاؤڈ لیس آف لائن بیک اپ۔
          </p>
        </div>

        {/* Export / Import buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 cursor-pointer"
            title="ذاتی ڈیٹا کو JSON فائل میں برآمد کریں"
          >
            <Download className="w-3.5 h-3.5" />
            <span>بیک اپ ڈاؤن لوڈ</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>بیک اپ درآمد کریں</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Import feedback notice */}
      {importNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between ${
            importNotice.success
              ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-100 dark:bg-red-950/80 border-red-400 text-red-900 dark:text-red-200'
          }`}
        >
          <span>{importNotice.message}</span>
          <button onClick={() => setImportNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs (Words vs Passages) */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('words')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'words'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>محفوظ الفاظ ({savedWords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('passages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'passages'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مطالعاتی عبارات ({savedPassages.length})</span>
          </button>
        </div>

        {/* Filter by Tag if words tab */}
        {activeTab === 'words' && availableTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:outline-emerald-800"
          >
            <option value="all">تمام ٹیگز</option>
            {availableTags.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Filter / Search Bar inside Library */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'words' ? 'محفوظ الفاظ یا ذاتی نوٹس میں تلاش کریں...' : 'محفوظ عبارات میں تلاش کریں...'}
          className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-emerald-800 shadow-xs"
        />
        <Search className="w-4 h-4 absolute right-3.5 top-3 text-stone-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Words Tab Content */}
      {activeTab === 'words' && (
        <div className="space-y-3">
          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWords.map(w => {
                // Find starter dict match if available
                const dictMatch = STARTER_DICTIONARY.find(d => d.id === w.wordId || d.arabic === w.arabic);

                return (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-emerald-700/60 transition flex flex-col justify-between text-right"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakArabicWord(w.arabic)}
                            className="p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title="تلفظ سنیں"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          {w.tag && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                              {w.tag}
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-arabic font-bold text-emerald-950 dark:text-emerald-300">
                          {w.arabic}
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm font-urdu text-stone-800 dark:text-stone-200 leading-relaxed">
                        {w.urdu}
                      </p>

                      {w.personalNotes && (
                        <div className="mt-2.5 p-2 rounded-lg bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200/40 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 font-urdu">
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block mb-0.5">
                            ذاتی نوٹ:
                          </span>
                          {w.personalNotes}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
                      <span>{new Date(w.dateAdded).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingWord(w);
                            setEditedNote(w.personalNotes || '');
                            setEditedTag(w.tag || '');
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="نوٹ ترمیم کریں"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {dictMatch && (
                          <button
                            onClick={() => onOpenWordDetail(dictMatch)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="لغت کارڈ دیکھیں"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setItemToDelete({ type: 'word', id: w.id, title: w.arabic })}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="حذف کریں"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-stone-400 font-urdu text-xs space-y-2">
              <Bookmark className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
              <p>کوئی محفوظ لفظ موجود نہیں ہے۔</p>
              <p className="text-[11px] text-stone-500">لغت سے کوئی بھی لفظ بُک مارک کر کے یہاں دیکھیں۔</p>
            </div>
          )}
        </div>
      )}

      {/* Passages Tab Content */}
      {activeTab === 'passages' && (
        <div className="space-y-3">
          {filteredPassages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPassages.map(p => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-emerald-700/60 transition flex flex-col justify-between text-right"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">
                        {p.category || 'عبارت'}
                      </span>
                      <h4 className="font-bold text-base text-stone-900 dark:text-stone-100 font-arabic">
                        {p.title}
                      </h4>
                    </div>

                    <p className="text-base font-arabic text-emerald-950 dark:text-emerald-200 line-clamp-3 leading-relaxed bg-[#FAF9F5] dark:bg-stone-850 p-3 rounded-xl border border-stone-200/50 dark:border-stone-700/60">
                      {p.arabicText}
                    </p>

                    {p.urduNotes && (
                      <p className="text-xs font-urdu text-stone-600 dark:text-stone-400 line-clamp-2">
                        <strong>نوٹس:</strong> {p.urduNotes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
                    <span>{new Date(p.dateSaved).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenPassageInWorkspace(p)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition"
                      >
                        ورک اسپیس میں مطالعہ کریں
                      </button>
                      <button
                        onClick={() => setItemToDelete({ type: 'passage', id: p.id, title: p.title })}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="حذف کریں"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-stone-400 font-urdu text-xs space-y-2">
              <FileText className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 stroke-[1.5]" />
              <p>کوئی مطالعاتی عبارت محفوظ نہیں ہے۔</p>
              <p className="text-[11px] text-stone-500">مطالعۂ متن کے ورک اسپیس سے اپنی عبارات یہاں محفوظ کریں۔</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Before Destructive Action Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-right">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 text-center mb-2">
              کیا آپ واقعی حذف کرنا چاہتے ہیں؟
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 text-center mb-5 font-urdu">
              "{itemToDelete.title}" کو آپ کی ذاتی لائبریری سے حذف کر دیا جائے گا۔
            </p>

            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ہاں، حذف کریں
              </button>
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                منسوخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Word Note Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 p-6 shadow-2xl text-right">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setEditingWord(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-arabic">
                لفظ "{editingWord.arabic}" کے نوٹس کی تدوین
              </h3>
            </div>

            <form onSubmit={handleSaveEditedWord} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  شعبہ / ٹیگ:
                </label>
                <input
                  type="text"
                  value={editedTag}
                  onChange={e => setEditedTag(e.target.value)}
                  placeholder="مثلاً: علم، نحو، فقہ..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  ذاتی یاد دہانی / نوٹس:
                </label>
                <textarea
                  rows={3}
                  value={editedNote}
                  onChange={e => setEditedNote(e.target.value)}
                  placeholder="اس لفظ کا استاد کی زبانی مفہوم یا جملہ..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-urdu focus:outline-emerald-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  تبدیلی محفوظ کریں
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWord(null)}
                  className="px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-xl text-xs text-stone-600 dark:text-stone-400"
                >
                  منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
