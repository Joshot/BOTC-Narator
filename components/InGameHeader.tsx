'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  BookMarked,
  Compass,
  History,
  Moon,
  MoreVertical,
  Swords,
} from 'lucide-react';
import { useGameSession } from '@/context/GameContext';

interface InGameHeaderProps {
  currentTab?: 'grimoire' | 'evil' | 'narrator' | 'webplay';
}

export default function InGameHeader({ currentTab }: InGameHeaderProps) {
  const pathname = usePathname();
  const {
    setIsStoryModalOpen,
    setIsRefModalOpen,
    storyHistory,
  } = useGameSession();
  const [toolsOpen, setToolsOpen] = useState(false);

  const tabs = [
    { href: '/grimoire', label: 'Meja Grimoire', shortLabel: 'Grimoire', icon: Compass, id: 'grimoire' },
    { href: '/evil', label: 'Panel Evil & Bluff', shortLabel: 'Evil', icon: Swords, id: 'evil' },
    { href: '/narrator', label: 'Urutan Narator', shortLabel: 'Narator', icon: Moon, id: 'narrator' },
    { href: '/story', label: 'Kisah & Role Awal', shortLabel: 'Kisah', icon: History, id: 'story' },
  ];

  return (
    <div className="mb-3 sm:mb-4">
      {/* Compact Single-Row Sub-Navigation Bar (Mobile / Tablet / Desktop) */}
      <div className="relative flex items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
        <nav
          aria-label="Menu Sesi Storyteller"
          className="flex-1 min-w-0 grid grid-cols-4 sm:flex sm:flex-nowrap items-center gap-1 sm:gap-1.5"
        >
          {tabs.map((tab) => {
            const isActive = currentTab ? currentTab === tab.id : pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative min-h-[38px] px-1.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs lg:text-sm font-semibold flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 cursor-pointer transition-colors whitespace-nowrap truncate ${
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
                  className={`relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                    isActive
                      ? 'text-rose-100 dark:text-[#FCA5A5]'
                      : tab.id === 'evil'
                      ? 'text-red-700 dark:text-[#F87171]'
                      : tab.id === 'narrator'
                      ? 'text-indigo-700 dark:text-[#93C5FD]'
                      : 'text-amber-700 dark:text-[#D4AF37]'
                  }`}
                />
                <span className="relative z-10 lg:hidden truncate">{tab.shortLabel}</span>
                <span className="relative z-10 hidden lg:inline truncate">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop & Tablet inline Story/Script triggers; tucked into Menu on Android Phones */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] text-purple-900 dark:text-[#EDEAF0] border border-purple-200 dark:border-white/[0.06] hover:border-[#D4AF37]/50 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
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
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] text-purple-900 dark:text-[#A6A2B2] hover:text-purple-950 dark:hover:text-[#EDEAF0] border border-purple-200 dark:border-white/[0.06] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title="Buka Panduan Skrip Trouble Brewing"
          >
            <BookMarked className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
            <span>Panduan Skrip</span>
          </button>
        </div>

        {/* Click-to-open Compact Menu for HP Android & Small Tablets */}
        <div className="relative md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setToolsOpen((prev) => !prev)}
            aria-label="Menu Riwayat dan Panduan Skrip"
            className="min-h-[38px] min-w-[38px] px-2 rounded-xl bg-purple-50 dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] border border-purple-200 dark:border-white/[0.08] text-purple-900 dark:text-[#EDEAF0] flex items-center justify-center gap-1 cursor-pointer"
          >
            <MoreVertical className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
            {storyHistory.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-[#FDE68A]">
                {storyHistory.length}
              </span>
            )}
          </button>

          {toolsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setToolsOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.12] p-1.5 shadow-2xl space-y-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setToolsOpen(false);
                    setIsStoryModalOpen(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-900 dark:text-[#EDEAF0] hover:bg-purple-50 dark:hover:bg-white/[0.06] flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
                    Riwayat Cerita
                  </span>
                  {storyHistory.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-[#D4AF37]/20 text-[10px] font-mono font-bold text-amber-950 dark:text-[#FDE68A]">
                      {storyHistory.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setToolsOpen(false);
                    setIsRefModalOpen(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-900 dark:text-[#EDEAF0] hover:bg-purple-50 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                >
                  <BookMarked className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
                  <span>Panduan Skrip</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

