'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookMarked,
  ChevronRight,
  Compass,
  History,
  Moon,
  Sun,
  Swords,
} from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import GameTimerWidget from './grimoire/GameTimerWidget';

interface InGameHeaderProps {
  currentTab?: 'grimoire' | 'evil' | 'narrator' | 'webplay';
}

export default function InGameHeader({ currentTab }: InGameHeaderProps) {
  const pathname = usePathname();
  const {
    phase,
    dayNumber,
    dayTimer,
    phaseStartedAt,
    handleUpdateTimer,
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
    { href: '/story', label: 'Kisah & Role Awal', icon: History, id: 'story' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* ================= IN-GAME SUB-NAVIGATION TABS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
        <nav aria-label="Menu Sesi Storyteller" className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = currentTab ? currentTab === tab.id : pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative min-h-[38px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'bg-purple-50 dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] text-purple-900 dark:text-[#A6A2B2] hover:text-purple-950 dark:hover:text-[#EDEAF0]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="ingame-nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#991B1B] shadow-md"
                    aria-hidden="true"
                  />
                )}
                <tab.icon
                  className={`relative z-10 w-4 h-4 ${
                    isActive
                      ? 'text-rose-100 dark:text-[#FCA5A5]'
                      : tab.id === 'evil'
                      ? 'text-red-700 dark:text-[#F87171]'
                      : tab.id === 'narrator'
                      ? 'text-indigo-700 dark:text-[#93C5FD]'
                      : 'text-amber-700 dark:text-[#D4AF37]'
                  }`}
                />
                <span className="relative z-10">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Story Chronicle & Reference Sheet Triggers */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] text-purple-900 dark:text-[#EDEAF0] border border-purple-200 dark:border-white/[0.06] hover:border-[#D4AF37]/50 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title="Buka Catatan Riwayat Cerita Permainan"
          >
            <History className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
            <span>Riwayat Cerita</span>
            {storyHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-[#D4AF37]/20 text-[10px] font-mono font-bold text-amber-950 dark:text-[#FDE68A]">
                {storyHistory.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsRefModalOpen(true)}
            className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] text-purple-900 dark:text-[#A6A2B2] hover:text-purple-950 dark:hover:text-[#EDEAF0] border border-purple-200 dark:border-white/[0.06] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title="Buka Panduan Skrip Trouble Brewing"
          >
            <BookMarked className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
            <span className="hidden sm:inline">Panduan Skrip</span>
          </button>
        </div>
      </div>

      {/* ================= PROMINENT MANUAL PHASE CONTROLLER BANNER ================= */}
      <div className="bg-white dark:bg-[#14141B] border-2 border-amber-500/60 dark:border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-700 dark:text-[#D4AF37] uppercase tracking-wider font-mono">
              Kontrol Fase Storyteller
            </span>
            <span className="text-xs text-slate-400 dark:text-[#716D80]">·</span>
            <span className="text-[11px] text-emerald-700 dark:text-[#34D399] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#34D399] animate-pulse" />
              Auto Save Aktif
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-[#1C1C26] border border-purple-200 dark:border-white/[0.08] shrink-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {isNightPhase ? (
                  <motion.div
                    key="moon-icon"
                    initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 45, scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5 text-indigo-600 dark:text-[#93C5FD]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun-icon"
                    initial={{ rotate: 45, scale: 0.7, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -45, scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5 text-amber-500 dark:text-[#FBBF24]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#EDEAF0]">
                {phase === 'first_night'
                  ? 'Malam Pertama (First Night)'
                  : phase === 'day'
                  ? `Fase Siang Hari ke-${dayNumber}`
                  : `Malam ke-${Math.max(2, dayNumber)}`}
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] leading-tight">
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
        <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <GameTimerWidget
            timer={dayTimer}
            phaseStartedAt={phaseStartedAt}
            onAction={handleUpdateTimer}
            variant="compact"
          />

          {isNightPhase ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleTransitionNightToDay}
              className="brass-sheen-btn min-h-[44px] px-4 sm:px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Sun className="w-4 h-4 fill-current shrink-0" />
              <span>Lanjut ke Siang Hari {phase === 'first_night' ? 1 : Math.max(2, dayNumber)}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleTransitionDayToNextNight}
              className="brass-sheen-btn min-h-[44px] px-4 sm:px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Moon className="w-4 h-4 shrink-0" />
              <span>Lanjut ke Malam Hari {dayNumber + 1}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </motion.button>
          )}

          {/* Quick Manual Phase Selector (Zero confirm dialogs) */}
          <div className="flex items-center gap-1 p-1 bg-purple-100 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPhase('first_night')}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                phase === 'first_night'
                  ? 'bg-[#991B1B] text-white font-bold'
                  : 'text-slate-600 dark:text-[#8E8A9E] hover:text-purple-900 dark:hover:text-[#EDEAF0]'
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
                  : 'text-slate-600 dark:text-[#8E8A9E] hover:text-purple-900 dark:hover:text-[#EDEAF0]'
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
                  : 'text-slate-600 dark:text-[#8E8A9E] hover:text-purple-900 dark:hover:text-[#EDEAF0]'
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

