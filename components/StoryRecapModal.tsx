'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Check,
  Copy,
  Crosshair,
  ExternalLink,
  Gavel,
  History,
  RefreshCw,
  Scroll,
  Skull,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { GameStoryEntry } from '@/context/GameContext';

interface StoryRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyHistory: GameStoryEntry[];
  winner: 'good' | 'evil' | null;
  activeRoomName: string;
}

export default function StoryRecapModal({
  isOpen,
  onClose,
  storyHistory,
  winner,
  activeRoomName,
}: StoryRecapModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyStory = async () => {
    try {
      const formattedLines = storyHistory.map(
        (entry) => `[${entry.round}] ${entry.text}`
      );
      const header = `=== KRONOLOGI CERITA GRIMOIRE BOTC: ${activeRoomName} ===\nStatus: ${
        winner === 'good'
          ? 'Kemenangan Tim Good (Warga Kota Menang)'
          : winner === 'evil'
          ? 'Kemenangan Tim Evil (Kelompok Jahat Menang)'
          : 'Permainan Sedang Berlangsung'
      }\n\n`;

      await navigator.clipboard.writeText(header + formattedLines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getCategoryIcon = (category: GameStoryEntry['category']) => {
    switch (category) {
      case 'death':
        return <Skull className="w-4 h-4 text-red-700 dark:text-[#F87171]" />;
      case 'execution':
        return <Gavel className="w-4 h-4 text-amber-700 dark:text-[#FBBF24]" />;
      case 'slayer':
        return <Crosshair className="w-4 h-4 text-blue-700 dark:text-[#60A5FA]" />;
      case 'starpass':
        return <RefreshCw className="w-4 h-4 text-purple-700 dark:text-[#C084FC]" />;
      case 'win':
        return <Trophy className="w-4 h-4 text-amber-700 dark:text-[#FACC15]" />;
      case 'start':
      default:
        return <Sparkles className="w-4 h-4 text-emerald-700 dark:text-[#34D399]" />;
    }
  };

  const getCategoryBadgeClass = (category: GameStoryEntry['category']) => {
    switch (category) {
      case 'death':
        return 'bg-red-100 border-red-300 text-red-950 dark:bg-[#EF4444]/15 dark:border-[#EF4444]/30 dark:text-[#FCA5A5] font-bold';
      case 'execution':
        return 'bg-amber-100 border-amber-300 text-amber-950 dark:bg-[#F59E0B]/15 dark:border-[#F59E0B]/30 dark:text-[#FDE68A] font-bold';
      case 'slayer':
        return 'bg-blue-100 border-blue-300 text-blue-950 dark:bg-[#3B82F6]/15 dark:border-[#3B82F6]/30 dark:text-[#BFDBFE] font-bold';
      case 'starpass':
        return 'bg-purple-100 border-purple-300 text-purple-950 dark:bg-[#A855F7]/15 dark:border-[#A855F7]/30 dark:text-[#E9D5FF] font-bold';
      case 'win':
        return 'bg-amber-200 border-amber-400 text-amber-950 dark:bg-[#EAB308]/20 dark:border-[#EAB308]/50 dark:text-[#FEF08A] font-black';
      case 'start':
      default:
        return 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-[#10B981]/15 dark:border-[#10B981]/30 dark:text-[#A7F3D0] font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.12] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-purple-100 dark:border-white/[0.08] flex items-center justify-between gap-4 bg-purple-50/70 dark:bg-[#181822]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#222230] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center text-amber-700 dark:text-[#D4AF37] shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
                Kronologi & Riwayat Cerita Permainan
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] font-mono">
                {activeRoomName} · {storyHistory.length} Peristiwa Tercatat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/story"
              onClick={onClose}
              className="brass-sheen-btn px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Halaman Penuh & Role Awal</span>
              <span className="sm:hidden">Halaman Penuh</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyStory}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100 dark:bg-[#222230] dark:hover:bg-[#2C2C3E] border border-purple-200 dark:border-white/[0.08] text-xs font-semibold text-purple-950 dark:text-[#EDEAF0] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Salin Kisah Permainan ke Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                  <span className="text-emerald-700 dark:text-[#34D399]">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-[#A6A2B2]" />
                  <span>Salin Kisah</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 dark:text-[#8E8A9E] hover:text-slate-900 dark:hover:text-[#EDEAF0] hover:bg-purple-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Tutup Riwayat Cerita"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Victory Status Banner if Game Ended */}
        {winner && (
          <div
            className={`px-6 py-4 border-b flex items-center gap-3.5 ${
              winner === 'good'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-[#064E3B]/40 dark:border-[#10B981]/40 dark:text-[#A7F3D0]'
                : 'bg-red-50 border-red-200 text-red-950 dark:bg-[#7F1D1D]/40 dark:border-[#EF4444]/40 dark:text-[#FECACA]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                winner === 'good'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-[#065F46] dark:border-[#34D399]/40 dark:text-[#34D399]'
                  : 'bg-red-100 border-red-300 text-red-700 dark:bg-[#991B1B] dark:border-[#F87171]/40 dark:text-[#F87171]'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-sm sm:text-base font-bold">
                {winner === 'good'
                  ? 'PERMAINAN SELESAI: KEMENANGAN TIM WARGA (GOOD WINS)'
                  : 'PERMAINAN SELESAI: KEMENANGAN KELOMPOK JAHAT (EVIL WINS)'}
              </div>
              <p className="text-xs opacity-90">
                {winner === 'good'
                  ? 'Seluruh Demon telah dieliminasi dan kota Ravenswood Bluff kembali damai!'
                  : 'Demon berhasil memperdaya kota hingga hanya tersisa 2 warga atau Saint dieksekusi.'}
              </p>
            </div>
          </div>
        )}

        {/* Content: Story Timeline */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {storyHistory.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Scroll className="w-8 h-8 mx-auto text-slate-400 dark:text-[#4A4756]" />
              <p className="text-xs text-slate-500 dark:text-[#8E8A9E]">
                Belum ada peristiwa cerita tercatat dalam sesi ini.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-purple-200 dark:border-white/[0.08] ml-3 pl-4 space-y-4">
              {storyHistory.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                  className="relative group"
                >
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-white dark:bg-[#252533] border-2 border-amber-500 dark:border-[#D4AF37] group-hover:scale-125 transition-transform" />

                  <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-[#181822] border border-purple-200 dark:border-white/[0.06] hover:border-purple-300 dark:hover:border-white/[0.12] transition-colors space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {getCategoryIcon(item.category)}
                          <span className="uppercase">{item.category}</span>
                        </span>
                        <span className="text-xs font-bold text-amber-800 dark:text-[#D4AF37] font-mono">
                          {item.round}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-[#716D80] font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 dark:text-[#EDEAF0] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-100 dark:border-white/[0.08] bg-purple-50/70 dark:bg-[#181822] flex items-center justify-between">
          <span className="text-[11px] text-slate-600 dark:text-[#8E8A9E]">
            Catatan cerita tersimpan otomatis di penyimpanan lokal browser.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-[#222230] dark:hover:bg-[#2C2C3E] text-xs font-bold text-purple-950 dark:text-[#EDEAF0] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}

