'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  Compass,
  Home,
  Moon,
  Plus,
  ShieldAlert,
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
  const {
    mounted,
    rooms,
    activeRoomId,
    activeRoom,
    switchRoom,
    createNewRoom,
    deleteRoom,
    hasActiveGame,
    gameAlertBanner,
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
      <div className="min-h-screen bg-[#0C0C10] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <span className="font-serif text-sm tracking-wider text-[#EDEAF0]">
          Memuat Grimoire Trouble Brewing...
        </span>
      </div>
    );
  }

  const handleCreateRoom = () => {
    setIsRoomMenuOpen(false);
    createNewRoom();
  };

  return (
    <div className="min-h-screen bg-[#0C0C10] text-[#EDEAF0] font-sans antialiased selection:bg-[#3D3552] selection:text-[#FFFFFF] flex flex-col">
      {/* 
        Clean Minimal Navbar (Requested by user: "navbarnya kosonggg aja yaaaa")
        Only Brand Title + Discreet Room Switcher (Max 3 Rooms)
      */}
      <header className="sticky top-0 z-40 bg-[#0C0C10]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Minimal Brand Link & Home Link */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus:outline-none group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#14141B] border border-white/[0.1] flex items-center justify-center group-hover:border-[#D4AF37]/60 transition-colors shadow-inner">
                <Compass className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="font-display text-base font-bold tracking-tight text-[#EDEAF0] group-hover:text-[#D4AF37] transition-colors">
                Grimoire BOTC
              </span>
            </Link>

            <Link
              href="/"
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-[#A6A2B2] hover:text-[#EDEAF0] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Home</span>
            </Link>
          </div>

          {/* Right Header: Theme Switcher & Clean Room Switcher Pill (Max 3 Rooms) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => requestThemeChange()}
              className="px-3 py-1.5 rounded-full bg-[#14141B] hover:bg-[#1E1E28] border border-white/[0.1] text-xs font-semibold text-[#EDEAF0] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
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
                  <Moon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span className="hidden sm:inline text-[11px]">Dark Mode</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoomMenuOpen((prev) => !prev)}
                className="px-3.5 py-1.5 rounded-full bg-[#14141B] hover:bg-[#1E1E28] border border-white/[0.1] text-xs font-semibold text-[#EDEAF0] flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="font-mono">{activeRoom.name}</span>
              {hasActiveGame && (
                <span className="text-[10px] text-[#A6A2B2] hidden sm:inline">
                  ({activeRoom.session.players.length}P)
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#8E8A9E]" />
            </button>

            {/* Room Dropdown Menu */}
            {isRoomMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsRoomMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl bg-[#14141B] border border-white/[0.12] p-2.5 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E8A9E]">
                      Room Game ({rooms.length}/{MAX_ROOMS})
                    </span>
                    <span className="text-[10px] text-[#A6A2B2]">Maks. 3 Room</span>
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
                              ? 'bg-[#222230] border border-[#D4AF37]/50 text-white font-semibold'
                              : 'bg-transparent hover:bg-white/[0.04] text-[#A6A2B2]'
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
                            {isActive && <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                            <span className="truncate">{room.name}</span>
                            <span className="text-[10px] text-[#8E8A9E] font-mono shrink-0">
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
                              className="p-1 text-[#8E8A9E] hover:text-[#EF4444] cursor-pointer rounded transition-colors ml-1"
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
                    className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-[#D4AF37]/15 border border-dashed border-white/[0.15] text-xs font-semibold text-[#EDEAF0] hover:text-[#FDE68A] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Room Baru</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Critical Game Alert Banner (when active) */}
      {gameAlertBanner && (
        <div className="bg-[#2A1216] border-b border-[#EF4444]/40 px-4 py-2 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center gap-2.5 text-xs text-[#FECACA]">
            <ShieldAlert className="w-4 h-4 text-[#F87171] shrink-0" />
            <span className="font-semibold">{gameAlertBanner}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-12">
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
      <ThemeConfirmModal />
    </div>
  );
}
