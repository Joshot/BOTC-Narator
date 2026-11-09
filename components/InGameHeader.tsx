'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  ChevronRight,
  Compass,
  History,
  Moon,
  Smartphone,
  Sun,
  Swords,
} from 'lucide-react';
import { useGameSession } from '@/context/GameContext';

interface InGameHeaderProps {
  currentTab?: 'grimoire' | 'evil' | 'narrator' | 'webplay';
}

export default function InGameHeader({ currentTab }: InGameHeaderProps) {
  const pathname = usePathname();
  const {
    phase,
    dayNumber,
    setPhase,
    handleTransitionNightToDay,
    handleTransitionDayToNextNight,
    setIsStoryModalOpen,
    setIsRefModalOpen,
    storyHistory,
  } = useGameSession();

  const isNightPhase = phase === 'first_night' || phase === 'other_night';

  const tabs = [
    { href: '/grimoire', label: 'Meja Grimoire', icon: Compass, id: 'grimoire' },
    { href: '/evil', label: 'Panel Evil & Bluff', icon: Swords, id: 'evil' },
    { href: '/narrator', label: 'Urutan Narator', icon: Moon, id: 'narrator' },
    { href: '/webplay', label: 'Layar HP Pemain', icon: Smartphone, id: 'webplay' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* ================= IN-GAME SUB-NAVIGATION TABS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-[#14141B] border border-white/[0.08] rounded-2xl shadow-sm">
        <nav aria-label="Menu Sesi Storyteller" className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = currentTab ? currentTab === tab.id : pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#991B1B] text-white shadow-md'
                    : 'bg-[#1C1C26] hover:bg-[#252533] text-[#A6A2B2] hover:text-[#EDEAF0]'
                }`}
              >
                <tab.icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-[#FCA5A5]'
                      : tab.id === 'evil'
                      ? 'text-[#F87171]'
                      : tab.id === 'narrator'
                      ? 'text-[#93C5FD]'
                      : 'text-[#D4AF37]'
                  }`}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Story Chronicle & Reference Sheet Triggers */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold bg-[#1C1C26] hover:bg-[#252533] text-[#EDEAF0] border border-white/[0.06] hover:border-[#D4AF37]/50 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title="Buka Catatan Riwayat Cerita Permainan"
          >
            <History className="w-4 h-4 text-[#D4AF37]" />
            <span>Riwayat Cerita</span>
            {storyHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[10px] font-mono text-[#FDE68A]">
                {storyHistory.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsRefModalOpen(true)}
            className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold bg-[#1C1C26] hover:bg-[#252533] text-[#A6A2B2] hover:text-[#EDEAF0] border border-white/[0.06] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title="Buka Panduan Skrip Trouble Brewing"
          >
            <BookMarked className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">Panduan Skrip</span>
          </button>
        </div>
      </div>

      {/* ================= PROMINENT MANUAL PHASE CONTROLLER BANNER ================= */}
      <div className="bg-[#14141B] border-2 border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
              Kontrol Fase Storyteller
            </span>
            <span className="text-xs text-[#716D80]">·</span>
            <span className="text-[11px] text-[#34D399] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              Auto Save Aktif
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1C1C26] border border-white/[0.08] shrink-0">
              {isNightPhase ? (
                <Moon className="w-5 h-5 text-[#93C5FD]" />
              ) : (
                <Sun className="w-5 h-5 text-[#FBBF24]" />
              )}
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#EDEAF0]">
                {phase === 'first_night'
                  ? 'Malam Pertama (First Night)'
                  : phase === 'day'
                  ? `Fase Siang Hari ke-${dayNumber}`
                  : `Malam ke-${dayNumber + 1}`}
              </h2>
              <p className="text-xs text-[#8E8A9E] leading-tight">
                {phase === 'first_night'
                  ? 'Semua mata tertutup. Minion & Demon saling mengenal, karakter malam pertama menerima info.'
                  : phase === 'day'
                  ? 'Mata terbuka. Warga berdiskusi terbuka, Slayer/Virgin memicu efek, dan nominasi eksekusi.'
                  : 'Semua mata tertutup. Demon menyerang, Monk melindungi, Undertaker melihat peran korban siang.'}
              </p>
            </div>
          </div>
        </div>

        {/* Phase Buttons: Instant Execution Without Browser Confirm Alerts */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {isNightPhase ? (
            <button
              type="button"
              onClick={handleTransitionNightToDay}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 shadow-lg"
            >
              <Sun className="w-4 h-4 fill-current" />
              <span>Lanjut ke Siang Hari {phase === 'first_night' ? '1' : dayNumber}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTransitionDayToNextNight}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 shadow-lg"
            >
              <Moon className="w-4 h-4" />
              <span>Lanjut ke Malam Hari {dayNumber + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Quick Manual Phase Selector (Zero confirm dialogs) */}
          <div className="flex items-center gap-1 p-1 bg-[#0C0C10] border border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPhase('first_night')}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                phase === 'first_night'
                  ? 'bg-[#991B1B] text-white font-bold'
                  : 'text-[#8E8A9E] hover:text-[#EDEAF0]'
              }`}
            >
              M1
            </button>
            <button
              type="button"
              onClick={() => setPhase('day')}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                phase === 'day'
                  ? 'bg-[#D4AF37] text-[#0C0C10] font-bold'
                  : 'text-[#8E8A9E] hover:text-[#EDEAF0]'
              }`}
            >
              Siang
            </button>
            <button
              type="button"
              onClick={() => setPhase('other_night')}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                phase === 'other_night'
                  ? 'bg-[#991B1B] text-white font-bold'
                  : 'text-[#8E8A9E] hover:text-[#EDEAF0]'
              }`}
            >
              Malam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

