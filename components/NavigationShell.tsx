'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked,
  Compass,
  LayoutDashboard,
  Moon,
  RotateCcw,
  Smartphone,
  Sun,
  Swords,
  Wrench,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import FullscreenCardModal from './FullscreenCardModal';
import ReferenceSheetModal from './ReferenceSheetModal';

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    mounted,
    hasActiveGame,
    phase,
    dayNumber,
    gameAlertBanner,
    silentCard,
    isRefModalOpen,
    setSilentCard,
    setIsRefModalOpen,
    resetSession,
    setPhase,
    handleTransitionNightToDay,
    handleTransitionDayToNextNight,
  } = useGameSession();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#141A16] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <span className="font-serif text-sm tracking-wider text-[#F4EFEA]">
          Memuat Grimoire Trouble Brewing...
        </span>
      </div>
    );
  }

  const isNightPhase = phase === 'first_night' || phase === 'other_night';

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/setup', label: 'Setup', icon: Wrench },
    { href: '/grimoire', label: 'Grimoire', icon: Compass, requireActive: true },
    { href: '/evil', label: 'Bluff Evil', icon: Swords, requireActive: true },
    { href: '/narrator', label: 'Narator', icon: Moon, requireActive: true },
    { href: '/webplay', label: 'Layar HP', icon: Smartphone, requireActive: true },
  ];

  return (
    <div className="min-h-screen bg-[#141A16] text-[#EDE7DB] font-sans antialiased selection:bg-[#2C3E32] selection:text-[#F4EFEA] flex flex-col">
      {/* Top Header / App Shell */}
      <header className="sticky top-0 z-40 bg-[#141A16]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="group flex items-center gap-3 shrink-0 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1F2B23] border border-white/[0.12] flex items-center justify-center shadow-inner group-hover:border-[#D4AF37]/60 transition-colors">
              <Compass className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F4EFEA] leading-tight group-hover:text-[#D4AF37] transition-colors">
                Grimoire BOTC
              </span>
              <span className="text-[10px] font-mono tracking-wider text-[#8A958D] uppercase">
                Trouble Brewing
              </span>
            </div>
          </Link>

          {/* Center Pill Navigation (Desktop & Tablet) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 p-1 bg-[#1A241E] border border-white/[0.08] rounded-full shadow-inner"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = item.requireActive && !hasActiveGame;

              if (isDisabled) {
                return (
                  <span
                    key={item.href}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5A655D] cursor-not-allowed flex items-center gap-1.5 opacity-50"
                    title="Perlu permainan aktif"
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F4EFEA] text-[#141A16] shadow-md font-bold'
                      : 'text-[#9AA39C] hover:text-[#F4EFEA] hover:bg-white/[0.05]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Phase Advancement / Status Pill */}
            {hasActiveGame && (
              <div className="hidden lg:flex items-center gap-1.5 bg-[#1F2B23] border border-white/[0.08] px-2.5 py-1 rounded-full text-xs">
                <span className="font-mono text-[11px] text-[#D4AF37] font-semibold">
                  {phase === 'first_night'
                    ? 'M1'
                    : phase === 'day'
                    ? `Siang ${dayNumber}`
                    : `Malam ${dayNumber + 1}`}
                </span>
                <span className="text-white/20">|</span>
                {isNightPhase ? (
                  <button
                    type="button"
                    onClick={handleTransitionNightToDay}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#A3E635] hover:text-white cursor-pointer transition-colors"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Fajar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTransitionDayToNextNight}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#F87171] hover:text-white cursor-pointer transition-colors"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Malam</span>
                  </button>
                )}
              </div>
            )}

            {/* Reference Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsRefModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-[#1F2B23] hover:bg-[#28372D] border border-white/[0.08] text-xs font-medium text-[#C8D1CA] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Buka Lembar Referensi Skrip"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Referensi</span>
            </button>

            {/* Reset Game Session */}
            {hasActiveGame && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset sesi permainan yang sedang berjalan?')) {
                    resetSession();
                  }
                }}
                className="p-1.5 rounded-full bg-[#1F2B23] hover:bg-[#28372D] border border-white/[0.08] text-[#8A958D] hover:text-[#F87171] cursor-pointer transition-colors"
                title="Reset Sesi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Critical Game Alert Banner (when active) */}
      {gameAlertBanner && (
        <div className="bg-[#2B171B] border-b border-[#EF4444]/40 px-4 py-2.5 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center gap-2.5 text-xs sm:text-sm text-[#FECACA]">
            <ShieldAlert className="w-4 h-4 text-[#F87171] shrink-0" />
            <span className="font-semibold">{gameAlertBanner}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Bawah Layar HP"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141A16]/95 backdrop-blur-lg border-t border-white/[0.08] h-16 flex items-center justify-around px-2"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = item.requireActive && !hasActiveGame;

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center text-[#4B554F] cursor-not-allowed opacity-40 min-w-[50px]"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[50px] transition-colors cursor-pointer ${
                isActive ? 'text-[#D4AF37] font-bold' : 'text-[#8A958D] hover:text-[#F4EFEA]'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Modals */}
      <FullscreenCardModal
        card={silentCard}
        onClose={() => setSilentCard(null)}
      />
      <ReferenceSheetModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
      />
    </div>
  );
}

