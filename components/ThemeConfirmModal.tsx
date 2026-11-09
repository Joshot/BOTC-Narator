'use client';

import React from 'react';
import { Check, Moon, Palette, Sparkles, Sun, X } from 'lucide-react';
import { useAppTheme } from '@/context/ThemeContext';

export default function ThemeConfirmModal() {
  const {
    isConfirmModalOpen,
    targetTheme,
    confirmThemeChange,
    cancelThemeChange,
  } = useAppTheme();

  if (!isConfirmModalOpen || !targetTheme) return null;

  const isSwitchingToLight = targetTheme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#14141B] dark:bg-[#14141B] border border-white/[0.12] p-6 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={cancelThemeChange}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#8E8A9E] hover:text-[#EDEAF0] hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Batal Ganti Tema"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl border shrink-0 ${
              isSwitchingToLight
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#34D399]'
                : 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#A78BFA]'
            }`}
          >
            {isSwitchingToLight ? (
              <Sun className="w-6 h-6 text-[#FBBF24]" />
            ) : (
              <Moon className="w-6 h-6 text-[#93C5FD]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">
              Konfirmasi Tampilan
            </div>
            <h3 className="font-display text-xl font-bold text-[#EDEAF0]">
              {isSwitchingToLight
                ? 'Beralih ke Light Mode?'
                : 'Beralih ke Dark Mode?'}
            </h3>
            <p className="text-xs text-[#A6A2B2] leading-relaxed">
              {isSwitchingToLight
                ? 'Tampilan akan berganti ke tema terang bernuansa Hijau Pastel lembut dan Ungu Lavender yang nyaman di mata.'
                : 'Tampilan akan berganti kembali ke tema gelap Obsidian Dark dengan aksen Emas dan Crimson khas Grimoire.'}
            </p>
          </div>
        </div>

        {/* Color Palette Preview Badge */}
        <div className="p-3.5 rounded-2xl bg-[#1C1C26] border border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#EDEAF0]">
              {isSwitchingToLight ? 'Tema: Hijau Pastel & Ungu' : 'Tema: Obsidian Dark'}
            </span>
          </div>

          {/* Color dots preview */}
          <div className="flex items-center gap-1.5">
            {isSwitchingToLight ? (
              <>
                <span className="w-4 h-4 rounded-full bg-[#D1FAE5] border border-[#10B981]" title="Hijau Pastel" />
                <span className="w-4 h-4 rounded-full bg-[#EDE9FE] border border-[#8B5CF6]" title="Ungu Lavender" />
                <span className="w-4 h-4 rounded-full bg-[#FFFFFF] border border-slate-300" title="Putih Bersih" />
              </>
            ) : (
              <>
                <span className="w-4 h-4 rounded-full bg-[#0C0C10] border border-white/20" title="Obsidian" />
                <span className="w-4 h-4 rounded-full bg-[#D4AF37] border border-amber-300" title="Emas" />
                <span className="w-4 h-4 rounded-full bg-[#991B1B] border border-red-500" title="Crimson" />
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={cancelThemeChange}
            className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-[#EDEAF0] transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={confirmThemeChange}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg cursor-pointer ${
              isSwitchingToLight
                ? 'bg-gradient-to-r from-[#10B981] to-[#8B5CF6] hover:from-[#059669] hover:to-[#7C3AED] text-white'
                : 'bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10]'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Ya, Ganti Tema</span>
          </button>
        </div>
      </div>
    </div>
  );
}

