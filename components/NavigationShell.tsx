'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronDown,
  Moon,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react';
import { useGameSession, MAX_ROOMS } from '@/context/GameContext';
import { useAppTheme } from '@/context/ThemeContext';
import FullscreenCardModal from './FullscreenCardModal';
import ReferenceSheetModal from './ReferenceSheetModal';
import StarpassModal from './StarpassModal';
import StoryRecapModal from './StoryRecapModal';
import ThemeConfirmModal from './ThemeConfirmModal';

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
  const {
    mounted,
    rooms,
    activeRoomId,
    activeRoom,
    switchRoom,
    createNewRoom,
    deleteRoom,
    hasActiveGame,
    silentCard,
    isRefModalOpen,
    isStoryModalOpen,
    starpassPending,
    storyHistory,
    winner,
    setSilentCard,
    setIsRefModalOpen,
    setIsStoryModalOpen,
    handleChooseStarpassMinion,
    handleDismissStarpassModal,
  } = useGameSession();

  const { theme, requestThemeChange } = useAppTheme();
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);

  if (!mounted) {
    return (
      <div
        className={
          isDesktop
            ? 'h-screen overflow-hidden bg-[#F6F2EA] flex flex-col items-center justify-center p-6 text-center'
            : 'min-h-screen bg-[#F1F8F4] dark:bg-[#0C0C10] flex flex-col items-center justify-center p-6 text-center'
        }
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#B45309] dark:border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <span className="font-serif text-sm tracking-wider text-[#1F1916] dark:text-[#EDEAF0]">
          {isDesktop ? 'Memuat BOTC Desktop...' : 'Memuat Grimoire Trouble Brewing...'}
        </span>
      </div>
    );
  }

  const handleCreateRoom = () => {
    setIsRoomMenuOpen(false);
    createNewRoom();
  };

  return (
    <div
      className={
        isDesktop
          ? 'h-screen overflow-hidden bg-[#F6F2EA] text-[#1F1916] font-sans antialiased flex flex-col select-none'
          : 'min-h-screen overflow-x-hidden bg-[#F1F8F4] dark:bg-[#0C0C10] text-slate-900 dark:text-[#EDEAF0] font-sans antialiased selection:bg-[#3D3552] selection:text-[#FFFFFF] flex flex-col'
      }
    >
      {/*
        Clean Minimal Navbar (Home + Discreet Room Switcher Max 3 Rooms)
      */}
      <header
        className={
          isDesktop
            ? 'shrink-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-b border-amber-900/15 px-4 py-1.5 shadow-xs'
            : 'sticky top-0 z-40 bg-white/90 dark:bg-[#0C0C10]/95 backdrop-blur-md border-b border-purple-200 dark:border-white/[0.08] px-3 sm:px-6 py-2.5 transition-colors shadow-xs'
        }
      >
        <div
          className={
            isDesktop
              ? 'max-w-[1440px] mx-auto flex items-center justify-between gap-3'
              : 'max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4'
          }
        >
          {/* Minimal Brand Link */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus:outline-none group cursor-pointer"
            >
              <div
                className={
                  isDesktop
                    ? 'w-8 h-8 rounded-lg bg-[#FAF3E3] border border-amber-700/30 flex items-center justify-center overflow-hidden group-hover:border-[#991B1B] transition-colors shadow-xs'
                    : 'w-8 h-8 rounded-lg bg-[#FAF3E3] border border-purple-200 dark:border-[#D4AF37]/40 flex items-center justify-center overflow-hidden group-hover:border-[#D4AF37] transition-colors shadow-inner'
                }
              >
                <img
                  src="/icons/icon-192.png"
                  alt="Logo BOTC"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-[#EDEAF0] group-hover:text-[#991B1B] dark:group-hover:text-[#D4AF37] transition-colors">
                  {isDesktop ? 'BOTC Desktop' : 'Grimoire BOTC'}
                </span>
                {isDesktop && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-50 text-[#991B1B] border border-red-200">
                    Trouble Brewing
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Right Header: Theme Switcher (Web Only) & Clean Room Switcher Pill (Max 3 Rooms) */}
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => requestThemeChange()}
                className="px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-[#14141B] dark:hover:bg-[#1E1E28] border border-purple-200 dark:border-white/[0.1] text-xs font-semibold text-purple-950 dark:text-[#EDEAF0] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title={theme === 'dark' ? 'Beralih ke Light Mode (Pastel Hijau & Ungu)' : 'Beralih ke Dark Mode'}
                aria-label="Ganti Tema Warna"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span className="hidden sm:inline text-[11px]">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="hidden sm:inline text-[11px]">Dark Mode</span>
                  </>
                )}
              </motion.button>
            )}

            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsRoomMenuOpen((prev) => !prev)}
                className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-[#14141B] dark:hover:bg-[#1E1E28] border border-purple-200 dark:border-white/[0.1] text-xs font-semibold text-slate-900 dark:text-[#EDEAF0] flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#D4AF37] animate-pulse" />
                <span className="font-mono">{activeRoom.name}</span>
                {hasActiveGame && (
                  <span className="text-[10px] text-slate-600 dark:text-[#A6A2B2] hidden sm:inline">
                    ({activeRoom.session.players.length}P)
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 dark:text-[#8E8A9E] transition-transform duration-200 ${
                    isRoomMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </motion.button>

              {/* Room Dropdown Menu */}
              <AnimatePresence>
                {isRoomMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsRoomMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.12] p-2.5 shadow-2xl space-y-2"
                    >
                      <div className="px-2 py-1 flex items-center justify-between border-b border-purple-100 dark:border-white/[0.06] pb-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-[#8E8A9E]">
                          Room Game ({rooms.length}/{MAX_ROOMS})
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-[#A6A2B2]">Maks. 3 Room</span>
                      </div>

                      {/* Room List */}
                      <div className="space-y-1">
                        {rooms.map((room) => {
                          const isActive = room.id === activeRoomId;
                          const isGameRunning = room.session.hasActiveGame;
                          return (
                            <div
                              key={room.id}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                                isActive
                                  ? 'bg-purple-100 dark:bg-[#222230] border border-amber-500 dark:border-[#D4AF37]/50 text-purple-950 dark:text-white font-semibold'
                                  : 'bg-transparent hover:bg-purple-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-[#A6A2B2]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  switchRoom(room.id);
                                  setIsRoomMenuOpen(false);
                                }}
                                className="flex-1 text-left flex items-center gap-2 cursor-pointer truncate"
                              >
                                {isActive && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] shrink-0" />}
                                <span className="truncate">{room.name}</span>
                                <span className="text-[10px] text-slate-500 dark:text-[#8E8A9E] font-mono shrink-0">
                                  {isGameRunning ? `${room.session.players.length}P` : 'Kosong'}
                                </span>
                              </button>

                              {rooms.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRoom(room.id);
                                  }}
                                  className="p-1 text-slate-400 dark:text-[#8E8A9E] hover:text-red-600 dark:hover:text-[#EF4444] cursor-pointer rounded transition-colors ml-1"
                                  title="Hapus Room"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Room Trigger */}
                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-amber-50 dark:bg-white/[0.05] dark:hover:bg-[#D4AF37]/15 border border-dashed border-purple-300 dark:border-white/[0.15] text-xs font-semibold text-purple-950 dark:text-[#EDEAF0] hover:text-amber-900 dark:hover:text-[#FDE68A] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Room Baru</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={
          isDesktop
            ? 'flex-1 min-h-0 overflow-hidden max-w-[1440px] w-full mx-auto px-3 sm:px-5 py-2.5 flex flex-col'
            : 'flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-8 sm:pb-12'
        }
      >
        {children}
      </main>

      {/* Global Modals */}
      <FullscreenCardModal
        card={silentCard}
        onClose={() => setSilentCard(null)}
      />
      <ReferenceSheetModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
      />
      <StarpassModal
        pendingData={starpassPending}
        onChooseMinion={handleChooseStarpassMinion}
        onDismiss={handleDismissStarpassModal}
      />
      <StoryRecapModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        storyHistory={storyHistory}
        winner={winner}
        activeRoomName={activeRoom.name}
      />
      {!isDesktop && <ThemeConfirmModal />}
    </div>
  );
}
