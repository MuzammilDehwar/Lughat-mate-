import React, { useState } from 'react';
import { ArabicQuote, CLASSICAL_ARABIC_QUOTES, getDailyArabicQuote } from '../data/dailyQuotes';
import { speakArabicWord } from '../utils/arabic';
import { 
  Quote, Volume2, Copy, Share2, Check, 
  ChevronRight, ChevronLeft, Sparkles, BookOpen 
} from 'lucide-react';

interface DailyQuoteCardProps {
  onStudyPassage?: (arabicText: string, title: string, urduNotes: string) => void;
}

export const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({ onStudyPassage }) => {
  const [quoteIndex, setQuoteIndex] = useState(() => {
    const today = getDailyArabicQuote();
    const idx = CLASSICAL_ARABIC_QUOTES.findIndex(q => q.id === today.id);
    return idx >= 0 ? idx : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const quote = CLASSICAL_ARABIC_QUOTES[quoteIndex] || CLASSICAL_ARABIC_QUOTES[0];

  const handlePlayAudio = () => {
    setIsPlaying(true);
    speakArabicWord(quote.arabic);
    setTimeout(() => setIsPlaying(false), 2200);
  };

  const handleCopy = () => {
    const textToCopy = `«${quote.arabic}»\nاردو ترجمہ: ${quote.urdu}\nماخذ: ${quote.source}\n(لغت میٹ - عربی و اردو ساتھی)`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `«${quote.arabic}»\nترجمہ: ${quote.urdu}\nحوالہ: ${quote.source}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حکمتِ عربیہ: ${quote.theme}`,
          text: shareText
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleNext = () => {
    setQuoteIndex(prev => (prev + 1) % CLASSICAL_ARABIC_QUOTES.length);
  };

  const handlePrev = () => {
    setQuoteIndex(prev => (prev - 1 + CLASSICAL_ARABIC_QUOTES.length) % CLASSICAL_ARABIC_QUOTES.length);
  };

  const isToday = quote.id === getDailyArabicQuote().id;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#12382E] via-[#0E2F26] to-[#0A221C] text-white p-6 sm:p-7 shadow-xl border border-emerald-800/60 relative overflow-hidden text-right">
      {/* Decorative Background Accents */}
      <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>
      <div className="absolute right-4 top-4 text-emerald-800/20 pointer-events-none select-none">
        <Quote className="w-24 h-24 stroke-[1]" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-amber-200 font-arabic tracking-wide">
                  روزانہ کا عربی قول و حکمت (Daily Arabic Quote)
                </h3>
                {isToday && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                    آج کا اقتباس
                  </span>
                )}
              </div>
              <span className="text-[11px] text-stone-300 font-urdu">کلاسیکی عربی ادب اور اسلاف کی حکمت</span>
            </div>
          </div>

          {/* Theme & Counter Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/10 font-medium">
              موضوع: {quote.theme}
            </span>
            <div className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/15 transition cursor-pointer"
                title="پچھلا قول"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 text-stone-300">
                {quoteIndex + 1}/{CLASSICAL_ARABIC_QUOTES.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/15 transition cursor-pointer"
                title="اگلا قول"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Classical Arabic Sentence */}
        <div className="py-2">
          <blockquote className="text-2xl sm:text-3xl font-arabic font-bold text-amber-100 leading-[2.1] select-all">
            « {quote.arabic} »
          </blockquote>
        </div>

        {/* Urdu Translation Card */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 font-urdu">اردو مفہوم و ترجمہ:</span>
            <span className="text-[11px] text-stone-300 italic">{quote.source}</span>
          </div>
          <p className="text-base sm:text-lg font-urdu text-stone-100 leading-relaxed font-normal">
            {quote.urdu}
          </p>
          {quote.explanation && (
            <p className="text-xs font-urdu text-emerald-200/90 pt-1 border-t border-white/10">
              <strong>فائدہ و نکتہ:</strong> {quote.explanation}
            </p>
          )}
        </div>

        {/* Action Controls: Audio Pronunciation, Copy, Share, Study in Workspace */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {/* Audio Pronunciation Button */}
            <button
              onClick={handlePlayAudio}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isPlaying
                  ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/10'
              }`}
              title="عربی جملے کی درست قرات سنیں"
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-stone-950' : 'text-amber-300'}`} />
              <span>{isPlaying ? 'قرات جاری ہے...' : 'تلفظ و قرات سنیں'}</span>
            </button>

            {/* Study in Workspace Button if callback provided */}
            {onStudyPassage && (
              <button
                onClick={() => onStudyPassage(quote.arabic, `حکمت: ${quote.theme}`, quote.urdu)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 text-xs font-semibold transition cursor-pointer"
                title="اس جملے کو مطالعہ متن ورک اسپیس میں کھولیں"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>ورک اسپیس میں مطالعہ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition cursor-pointer"
              title="اقتباس کاپی کریں"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کاپی ہو گیا' : 'کاپی'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition cursor-pointer"
              title="شیئر کریں"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>شیئر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
