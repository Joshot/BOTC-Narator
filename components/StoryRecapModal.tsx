'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Crosshair,
  Gavel,
  History,
  Moon,
  RefreshCw,
  Scroll,
  ShieldAlert,
  Skull,
  Sparkles,
  Sun,
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
        return <Skull className="w-4 h-4 text-[#F87171]" />;
      case 'execution':
        return <Gavel className="w-4 h-4 text-[#FBBF24]" />;
      case 'slayer':
        return <Crosshair className="w-4 h-4 text-[#60A5FA]" />;
      case 'starpass':
        return <RefreshCw className="w-4 h-4 text-[#C084FC]" />;
      case 'win':
        return <Trophy className="w-4 h-4 text-[#FACC15]" />;
      case 'start':
      default:
        return <Sparkles className="w-4 h-4 text-[#34D399]" />;
    }
  };

  const getCategoryBadgeClass = (category: GameStoryEntry['category']) => {
    switch (category) {
      case 'death':
        return 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#FCA5A5]';
      case 'execution':
        return 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#FDE68A]';
      case 'slayer':
        return 'bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#BFDBFE]';
      case 'starpass':
        return 'bg-[#A855F7]/15 border-[#A855F7]/30 text-[#E9D5FF]';
      case 'win':
        return 'bg-[#EAB308]/20 border-[#EAB308]/50 text-[#FEF08A] font-bold';
      case 'start':
      default:
        return 'bg-[#10B981]/15 border-[#10B981]/30 text-[#A7F3D0]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#14141B] border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-[#181822]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#222230] border border-white/[0.08] flex items-center justify-center text-[#D4AF37]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#EDEAF0]">
                Kronologi & Riwayat Cerita Permainan
              </h3>
              <p className="text-xs text-[#8E8A9E] font-mono">
                {activeRoomName} · {storyHistory.length} Peristiwa Tercatat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyStory}
              className="px-3 py-1.5 rounded-xl bg-[#222230] hover:bg-[#2C2C3E] border border-white/[0.08] text-xs font-semibold text-[#EDEAF0] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Salin Kisah Permainan ke Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34D399]" />
                  <span className="text-[#34D399]">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#A6A2B2]" />
                  <span>Salin Kisah</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8E8A9E] hover:text-[#EDEAF0] hover:bg-white/[0.06] transition-colors cursor-pointer"
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
                ? 'bg-[#064E3B]/40 border-[#10B981]/40 text-[#A7F3D0]'
                : 'bg-[#7F1D1D]/40 border-[#EF4444]/40 text-[#FECACA]'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                winner === 'good'
                  ? 'bg-[#065F46] border-[#34D399]/40 text-[#34D399]'
                  : 'bg-[#991B1B] border-[#F87171]/40 text-[#F87171]'
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
                  ? 'Seluruh Demon telah dieliminasi dan kota Ravenwood Bluff kembali damai!'
                  : 'Demon berhasil memperdaya kota hingga hanya tersisa 2 warga atau Saint dieksekusi.'}
              </p>
            </div>
          </div>
        )}

        {/* Content: Story Timeline */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {storyHistory.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Scroll className="w-8 h-8 mx-auto text-[#4A4756]" />
              <p className="text-xs text-[#8E8A9E]">
                Belum ada peristiwa cerita tercatat dalam sesi ini.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-white/[0.08] ml-3 pl-4 space-y-4">
              {storyHistory.map((item, idx) => (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-[#252533] border-2 border-[#D4AF37] group-hover:scale-125 transition-transform" />

                  <div className="p-3.5 rounded-2xl bg-[#181822] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1.5">
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
                        <span className="text-xs font-bold text-[#D4AF37] font-mono">
                          {item.round}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#716D80] font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#EDEAF0] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#181822] flex items-center justify-between">
          <span className="text-[11px] text-[#8E8A9E]">
            Catatan cerita tersimpan otomatis di penyimpanan lokal browser.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#222230] hover:bg-[#2C2C3E] text-xs font-bold text-[#EDEAF0] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

