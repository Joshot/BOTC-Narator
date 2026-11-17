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
  currentTab?: 'grimoire' | 'evil' | 'narrator' | 'webplay' | 'story';
}

export default function InGameHeader({ currentTab }: InGameHeaderProps) {
  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
  const pathname = usePathname();
  const {
    setIsStoryModalOpen,
    setIsRefModalOpen,
    storyHistory,
    language,
    setLanguage,
    t,
  } = useGameSession();
  const [toolsOpen, setToolsOpen] = useState(false);

  const isEn = language === 'en';

  const handleOpenPauseMenu = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('botc-open-pause-menu', { detail: { tab: 'menu' } }));
    }
  };

  const tabs = [
    {
      href: '/grimoire',
      label: isEn ? 'Grimoire Board' : 'Meja Grimoire',
      shortLabel: 'Grimoire',
      icon: Compass,
      id: 'grimoire',
    },
    {
      href: '/evil',
      label: isEn ? 'Evil Team & Bluffs' : 'Panel Evil & Bluff',
      shortLabel: 'Evil',
      icon: Swords,
      id: 'evil',
    },
    {
      href: '/narrator',
      label: isEn ? 'Night Narrator' : 'Urutan Narator',
      shortLabel: isEn ? 'Narrator' : 'Narator',
      icon: Moon,
      id: 'narrator',
    },
    {
      href: '/story',
      label: isEn ? 'Story History' : 'Kisah Permainan',
      shortLabel: isEn ? 'Story' : 'Kisah',
      icon: History,
      id: 'story',
    },
  ];

  return (
    <div className={isDesktop ? 'shrink-0' : 'mb-3 sm:mb-4'}>
      {/* Compact Grimoire Sub-Navigation Bar */}
      <div className="relative flex items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#FAF6EE] dark:bg-[#14141B] border border-[#C9963A]/35 dark:border-white/[0.08] rounded-2xl shadow-xs">
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
                    : 'bg-[#F2EBDB] dark:bg-[#1C1C26] hover:bg-[#E8DFC7] dark:hover:bg-[#252533] text-[#5C4A37] dark:text-[#A6A2B2] hover:text-[#2A2018] dark:hover:text-[#EDEAF0]'
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

        {/* Desktop & Tablet inline Story/Script triggers + Pause Menu button */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F2EBDB] dark:bg-[#1C1C26] hover:bg-[#E8DFC7] dark:hover:bg-[#252533] text-[#2A2018] dark:text-[#EDEAF0] border border-[#C9963A]/25 dark:border-white/[0.06] hover:border-[#C9963A] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title={isEn ? 'Open Game Story Chronology' : 'Buka Catatan Riwayat Cerita Permainan'}
          >
            <History className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
            <span>{isEn ? 'Story History' : 'Riwayat Cerita'}</span>
            {storyHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#C9963A]/25 dark:bg-[#D4AF37]/20 text-[10px] font-mono font-bold text-[#2A2018] dark:text-[#FDE68A]">
                {storyHistory.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsRefModalOpen(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F2EBDB] dark:bg-[#1C1C26] hover:bg-[#E8DFC7] dark:hover:bg-[#252533] text-[#5C4A37] dark:text-[#A6A2B2] hover:text-[#2A2018] dark:hover:text-[#EDEAF0] border border-[#C9963A]/25 dark:border-white/[0.06] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            title={isEn ? 'Open Trouble Brewing Character Reference Sheet' : 'Buka Panduan Skrip Trouble Brewing'}
          >
            <BookMarked className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
            <span>{isEn ? 'Script Guide' : 'Panduan Skrip'}</span>
          </button>

          {/* Quick Language Toggle (EN / ID) */}
          <button
            type="button"
            onClick={() => setLanguage(isEn ? 'id' : 'en')}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#FAF6EE] dark:bg-[#1C1C26] hover:bg-[#EFE6D2] dark:hover:bg-[#252533] text-[#2A2018] dark:text-[#EDEAF0] border border-[#C9963A]/45 dark:border-white/[0.1] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            title={isEn ? 'Switch Language to Bahasa Indonesia' : 'Ganti Bahasa ke English (Default)'}
          >
            <span className={isEn ? 'text-[#991B1B] font-extrabold' : 'text-[#76614B]'}>EN</span>
            <span className="text-[#C9963A]">/</span>
            <span className={!isEn ? 'text-[#991B1B] font-extrabold' : 'text-[#76614B]'}>ID</span>
          </button>

          {/* Dedicated In-Game ESC / Pause Menu Button */}
          <button
            type="button"
            onClick={handleOpenPauseMenu}
            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF6EE] dark:bg-[#1C1C26] hover:bg-[#EFE6D2] dark:hover:bg-[#252533] text-[#2A2018] dark:text-[#EDEAF0] border border-[#C9963A]/45 dark:border-white/[0.1] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            title={isEn ? 'Pause Menu & Settings (ESC)' : 'Menu Jeda & Pengaturan (ESC)'}
          >
            <span className="w-2 h-2 rounded-full bg-[#991B1B] animate-pulse" />
            <span>{isEn ? 'Pause' : 'Jeda'}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#C9963A]/20 text-[#2A2018] uppercase">
              ESC
            </span>
          </button>
        </div>

        {/* Click-to-open Compact Menu for HP Android & Small Tablets */}
        <div className="relative md:hidden shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLanguage(isEn ? 'id' : 'en')}
            className="min-h-[38px] px-2 rounded-xl bg-[#FAF6EE] border border-[#C9963A]/40 text-xs font-mono font-bold text-[#2A2018] flex items-center gap-0.5 cursor-pointer"
            title={isEn ? 'Switch Language' : 'Ganti Bahasa'}
          >
            <span className={isEn ? 'text-[#991B1B]' : 'text-[#76614B]'}>EN</span>
            <span className="text-[#C9963A]">/</span>
            <span className={!isEn ? 'text-[#991B1B]' : 'text-[#76614B]'}>ID</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPauseMenu}
            className="min-h-[38px] px-2 rounded-xl bg-[#FAF6EE] border border-[#C9963A]/40 text-xs font-bold text-[#2A2018] flex items-center gap-1 cursor-pointer"
            title={isEn ? 'Pause (ESC)' : 'Menu Jeda (ESC)'}
          >
            <span className="w-2 h-2 rounded-full bg-[#991B1B]" />
            <span>ESC</span>
          </button>

          <button
            type="button"
            onClick={() => setToolsOpen((prev) => !prev)}
            aria-label={isEn ? 'Story History and Script Reference Menu' : 'Menu Riwayat dan Panduan Skrip'}
            className="min-h-[38px] min-w-[38px] px-2 rounded-xl bg-[#F2EBDB] dark:bg-[#1C1C26] hover:bg-[#E8DFC7] dark:hover:bg-[#252533] border border-[#C9963A]/30 dark:border-white/[0.08] text-[#2A2018] dark:text-[#EDEAF0] flex items-center justify-center gap-1 cursor-pointer"
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
                className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl bg-[#FAF6EE] dark:bg-[#14141B] border border-[#C9963A]/40 dark:border-white/[0.12] p-1.5 shadow-2xl space-y-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setToolsOpen(false);
                    setIsStoryModalOpen(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#2A2018] dark:text-[#EDEAF0] hover:bg-[#E8DFC7] dark:hover:bg-white/[0.06] flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
                    {isEn ? 'Story History' : 'Riwayat Cerita'}
                  </span>
                  {storyHistory.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#C9963A]/25 dark:bg-[#D4AF37]/20 text-[10px] font-mono font-bold text-[#2A2018] dark:text-[#FDE68A]">
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
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#2A2018] dark:text-[#EDEAF0] hover:bg-[#E8DFC7] dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer"
                >
                  <BookMarked className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
                  <span>{isEn ? 'Script Guide' : 'Panduan Skrip'}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setToolsOpen(false);
                    handleOpenPauseMenu();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold text-[#991B1B] hover:bg-red-50 flex items-center gap-2 cursor-pointer border-t border-[#C9963A]/20 pt-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#991B1B]" />
                  <span>{isEn ? 'Pause Menu (ESC)' : 'Menu Jeda (ESC)'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

