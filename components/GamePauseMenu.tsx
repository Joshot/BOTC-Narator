'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Check,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Monitor,
  Power,
  RotateCcw,
  Settings,
  Shield,
  Volume2,
  VolumeX,
  X,
  Play,
  Home,
  Info,
  Globe,
} from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import { VELVET_COLOURS, VelvetColour } from '@/lib/grimoire-theme';
import { requestDesktopAction, onDesktopWindowStateChange } from '@/lib/desktop-bridge';

interface GamePauseMenuProps {
  isOpen: boolean;
  initialTab?: 'menu' | 'settings' | 'about';
  onClose: () => void;
}

export default function GamePauseMenu({ isOpen, initialTab = 'menu', onClose }: GamePauseMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    hasActiveGame,
    phase,
    dayNumber,
    players,
    velvetColour,
    setVelvetColour,
    resetSession,
    language,
    setLanguage,
    t,
  } = useGameSession();

  const [activeTab, setActiveTab] = useState<'menu' | 'settings' | 'about'>(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tokenScale, setTokenScale] = useState<'compact' | 'normal' | 'large'>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [confirmMainMenu, setConfirmMainMenu] = useState(false);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setConfirmQuit(false);
      setConfirmMainMenu(false);
    }
  }, [isOpen, initialTab]);

  // Load preferences from localStorage & window state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedScale = localStorage.getItem('botc_token_scale') as 'compact' | 'normal' | 'large' | null;
    if (savedScale) setTokenScale(savedScale);

    const savedSound = localStorage.getItem('botc_sound_fx');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    setIsFullscreen(Boolean(document.fullscreenElement));

    const unsubscribe = onDesktopWindowStateChange((full) => {
      setIsFullscreen(full);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleFullscreen = () => {
    requestDesktopAction('toggle-fullscreen');
    setIsFullscreen((prev) => !prev);
  };

  const handleSetFullscreen = (target: boolean) => {
    requestDesktopAction(target ? 'fullscreen' : 'windowed');
    setIsFullscreen(target);
  };

  const handleChangeTokenScale = (scale: 'compact' | 'normal' | 'large') => {
    setTokenScale(scale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('botc_token_scale', scale);
      window.dispatchEvent(new CustomEvent('botc-token-scale-change', { detail: { scale } }));
    }
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('botc_sound_fx', String(next));
      }
      return next;
    });
  };

  const handleReturnToMainMenu = () => {
    onClose();
    router.push('/');
  };

  const handleQuitApp = () => {
    requestDesktopAction('quit');
  };

  const aliveCount = players.filter((p) => p.isAlive).length;
  const isEn = language === 'en';
  const phaseLabel = isEn
    ? phase === 'first_night'
      ? 'First Night'
      : phase === 'day'
      ? `Day ${dayNumber}`
      : `Night ${Math.max(2, dayNumber)}`
    : phase === 'first_night'
    ? 'Malam Pertama'
    : phase === 'day'
    ? `Siang Hari ke-${dayNumber}`
    : `Malam ke-${Math.max(2, dayNumber)}`;

  const isHome = pathname === '/' || pathname === '/dashboard';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md select-none overflow-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 8, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#FAF6EE] text-[#2A2018] border-2 border-[#C9963A] shadow-[0_24px_64px_rgba(0,0,0,0.55),0_0_0_1px_rgba(201,150,58,0.35)] overflow-hidden flex flex-col"
          >
            {/* Ornate Header with Trouble Brewing Brand */}
            <div className="relative px-6 py-4 bg-[#EFE6D2] border-b border-[#C9963A]/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] border border-[#C9963A]/50 p-1 flex items-center justify-center shadow-xs">
                  <img
                    src="/icons/icon-192.png"
                    alt="Logo Trouble Brewing"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#2A2018] leading-tight">
                    {activeTab === 'menu'
                      ? isEn
                        ? 'Game Paused'
                        : 'Jeda Permainan'
                      : activeTab === 'settings'
                      ? isEn
                        ? 'Settings & Options'
                        : 'Opsi & Pengaturan'
                      : isEn
                      ? 'About Trouble Brewing'
                      : 'Tentang BOTC Desktop'}
                  </h2>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#76614B]">
                    Blood on the Clocktower · Trouble Brewing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FAF6EE] hover:bg-[#E2D5BA] border border-[#C9963A]/40 text-[#5C4A37] hover:text-[#2A2018] flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Menu Jeda (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* TAB 1: MAIN PAUSE MENU */}
              {activeTab === 'menu' && (
                <div className="space-y-3">
                  {/* Status Strip if Game is Running */}
                  {hasActiveGame && !isHome && (
                    <div className="p-3.5 rounded-2xl bg-[#F2EBDB] border border-[#C9963A]/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-display text-sm font-bold text-[#991B1B] block">
                          {phaseLabel}
                        </span>
                        <span className="text-[#5C4A37] text-[11px]">
                          {isEn
                            ? `${aliveCount} Alive of ${players.length} Players`
                            : `${aliveCount} Hidup dari ${players.length} Pemain`}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#C9963A]/20 border border-[#C9963A]/40 text-[#2A2018] font-mono font-bold text-[10px] uppercase">
                        {isEn ? 'In Progress' : 'Sesi Berjalan'}
                      </span>
                    </div>
                  )}

                  {/* Primary Action: Resume Game */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#991B1B] hover:bg-[#B91C1C] text-[#FAF6EE] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isEn ? 'Resume Game' : 'Lanjutkan Permainan (Resume)'}</span>
                    <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-black/25 text-[#FAF6EE]/80 uppercase">
                      ESC
                    </span>
                  </button>

                  {/* Settings / Options Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="w-full py-3 px-4 rounded-2xl bg-[#FAF6EE] hover:bg-[#EFE6D2] border border-[#C9963A]/50 text-[#2A2018] font-bold text-sm flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-[#C9963A]" />
                      <span>{isEn ? 'Settings & Display Options' : 'Pengaturan & Opsi Tampilan'}</span>
                    </div>
                    <span className="text-xs text-[#76614B]">
                      {isEn ? 'Language, Screen, Felt, Audio →' : 'Bahasa, Layar, Kain, Audio →'}
                    </span>
                  </button>

                  {/* Return to Main Menu Button */}
                  {!isHome && (
                    <div>
                      {confirmMainMenu ? (
                        <div className="p-3.5 rounded-2xl bg-[#FFF8E7] border border-amber-600/40 space-y-2.5">
                          <p className="text-xs text-[#5C4A37] leading-relaxed">
                            {isEn
                              ? 'Return to Main Menu? Current game progress is saved.'
                              : 'Kembali ke Menu Utama? Status permainan tetap tersimpan dan dapat dilanjutkan kapan saja.'}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleReturnToMainMenu}
                              className="flex-1 py-2 rounded-xl bg-[#2A2018] text-[#FAF6EE] text-xs font-bold hover:bg-[#433527] cursor-pointer"
                            >
                              {isEn ? 'Yes, to Dashboard' : 'Ya, ke Menu Utama'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmMainMenu(false)}
                              className="px-3 py-2 rounded-xl border border-[#C9963A]/40 text-xs font-bold text-[#5C4A37] hover:bg-[#EFE6D2] cursor-pointer"
                            >
                              {isEn ? 'Cancel' : 'Batal'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmMainMenu(true)}
                          className="w-full py-3 px-4 rounded-2xl bg-[#FAF6EE] hover:bg-[#EFE6D2] border border-[#C9963A]/30 text-[#2A2018] font-semibold text-sm flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Home className="w-4 h-4 text-[#76614B]" />
                          <span>{isEn ? 'Return to Dashboard' : 'Kembali ke Menu Utama (Dashboard)'}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* About Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-[#EFE6D2]/60 text-xs text-[#5C4A37] font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-[#C9963A]" />
                      <span>{isEn ? 'About Trouble Brewing' : 'Tentang & Lisensi Trouble Brewing'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#76614B]">v1.0.0</span>
                  </button>

                  <div className="pt-2 border-t border-[#C9963A]/25">
                    {confirmQuit ? (
                      <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 space-y-2.5">
                        <p className="text-xs text-red-950 font-medium leading-relaxed">
                          {isEn
                            ? 'Are you sure you want to quit the application?'
                            : 'Yakin ingin menutup aplikasi BOTC Desktop?'}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleQuitApp}
                            className="flex-1 py-2 rounded-xl bg-red-800 text-white text-xs font-bold hover:bg-red-900 cursor-pointer"
                          >
                            {isEn ? 'Quit Now' : 'Tutup Aplikasi Sekarang'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmQuit(false)}
                            className="px-3 py-2 rounded-xl border border-red-300 text-xs font-bold text-red-800 hover:bg-red-100 cursor-pointer"
                          >
                            {isEn ? 'Cancel' : 'Batal'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmQuit(true)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-red-50/80 hover:bg-red-100 border border-red-200 text-red-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Quit Application' : 'Keluar ke Desktop (Quit)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SETTINGS & OPTIONS */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Language Filter: English (Default) vs Bahasa Indonesia */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-[#EFE6D2]/80 border-2 border-[#C9963A]/60 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider font-mono text-[#2A2018] flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-[#991B1B]" />
                        <span>{isEn ? 'Language Filter' : 'Filter Bahasa'}</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#991B1B] text-[#FAF6EE] uppercase">
                        {isEn ? 'Active: English' : 'Aktif: Indonesia'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C4A37] leading-relaxed">
                      {isEn
                        ? 'Select game language. 100% pure English or Indonesian across all roles, abilities, reminders, and narrator instructions without mixing.'
                        : 'Pilih bahasa permainan. 100% murni Bahasa Indonesia atau Inggris untuk seluruh peran, kemampuan, pengingat, dan panduan narator tanpa campur.'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                          language === 'en'
                            ? 'bg-[#FAF6EE] border-[#991B1B] text-[#2A2018] ring-2 ring-[#991B1B] shadow-sm font-bold'
                            : 'bg-[#FAF6EE]/60 border-[#C9963A]/40 text-[#5C4A37] hover:bg-[#FAF6EE]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold">🇬🇧 English</span>
                          {language === 'en' && <Check className="w-4 h-4 text-[#991B1B]" />}
                        </div>
                        <span className="text-[10px] font-semibold text-[#991B1B] uppercase tracking-wider">
                          {isEn ? 'Default / Official' : 'Default Resmi'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLanguage('id')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                          language === 'id'
                            ? 'bg-[#FAF6EE] border-[#991B1B] text-[#2A2018] ring-2 ring-[#991B1B] shadow-sm font-bold'
                            : 'bg-[#FAF6EE]/60 border-[#C9963A]/40 text-[#5C4A37] hover:bg-[#FAF6EE]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold">🇮🇩 Indonesia</span>
                          {language === 'id' && <Check className="w-4 h-4 text-[#991B1B]" />}
                        </div>
                        <span className="text-[10px] font-semibold text-[#76614B] uppercase tracking-wider">
                          {isEn ? 'Indonesian' : 'Bahasa Indonesia'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Display Mode: Fullscreen vs Windowed */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider font-mono text-[#5C4A37] flex items-center justify-between">
                      <span>{isEn ? 'Display Window Mode' : 'Mode Tampilan Jendela'}</span>
                      <span className="text-[10px] text-[#76614B] lowercase font-normal">(F11 shortcut)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetFullscreen(true)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                          isFullscreen
                            ? 'bg-[#C9963A]/25 border-[#C9963A] text-[#2A2018] ring-1 ring-[#C9963A]'
                            : 'bg-[#FAF6EE] border-[#C9963A]/30 text-[#5C4A37] hover:bg-[#EFE6D2]'
                        }`}
                      >
                        <Maximize2 className="w-5 h-5 text-[#991B1B]" />
                        <span className="text-xs font-bold">
                          {isEn ? 'Fullscreen' : 'Layar Penuh (Fullscreen)'}
                        </span>
                        <span className="text-[10px] text-[#76614B] leading-tight">
                          {isEn
                            ? 'Fills entire monitor without Windows taskbar'
                            : 'Tanpa taskbar Windows, penuh ke seluruh monitor'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetFullscreen(false)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                          !isFullscreen
                            ? 'bg-[#C9963A]/25 border-[#C9963A] text-[#2A2018] ring-1 ring-[#C9963A]'
                            : 'bg-[#FAF6EE] border-[#C9963A]/30 text-[#5C4A37] hover:bg-[#EFE6D2]'
                        }`}
                      >
                        <Minimize2 className="w-5 h-5 text-[#C9963A]" />
                        <span className="text-xs font-bold">
                          {isEn ? 'Fit Window' : 'Jendela Pas (Fit Window)'}
                        </span>
                        <span className="text-[10px] text-[#76614B] leading-tight">
                          {isEn
                            ? 'Standard window with title bar and taskbar'
                            : 'Ukuran standar pas dengan taskbar'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Velvet Fabric Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider font-mono text-[#5C4A37] block">
                      {isEn ? 'Grimoire Table Velvet Felt' : 'Warna Kain Meja Grimoire (Velvet Felt)'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VELVET_COLOURS.map((v) => {
                        const isSelected = velvetColour === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setVelvetColour(v.id as VelvetColour)}
                            className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#C9963A] bg-[#C9963A]/20 ring-2 ring-[#C9963A]'
                                : 'border-[#C9963A]/30 bg-[#FAF6EE] hover:bg-[#EFE6D2]'
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-full border border-black/40 shadow-inner flex items-center justify-center relative overflow-hidden"
                              style={{ backgroundColor: v.swatch }}
                            >
                              <img
                                src={v.art}
                                alt=""
                                aria-hidden="true"
                                className="w-full h-full object-cover opacity-80"
                              />
                              {isSelected && (
                                <Check className="w-4 h-4 text-white drop-shadow-md z-10" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#2A2018] truncate w-full">
                              {v.label.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Token Scale Preference */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider font-mono text-[#5C4A37] block">
                      {isEn ? 'Token Size Scale' : 'Skala Ukuran Token Lingkaran'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          {
                            id: 'compact',
                            label: isEn ? 'Compact' : 'Kompak',
                            sub: isEn ? 'Small screens' : 'Layar Kecil',
                          },
                          {
                            id: 'normal',
                            label: isEn ? 'Normal' : 'Standar',
                            sub: isEn ? 'Balanced' : 'Seimbang',
                          },
                          {
                            id: 'large',
                            label: isEn ? 'Large' : 'Besar',
                            sub: isEn ? 'Fullscreen' : 'Fullscreen',
                          },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleChangeTokenScale(item.id)}
                          className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                            tokenScale === item.id
                              ? 'bg-[#C9963A]/25 border-[#C9963A] text-[#2A2018] font-bold ring-1 ring-[#C9963A]'
                              : 'bg-[#FAF6EE] border-[#C9963A]/30 text-[#5C4A37] hover:bg-[#EFE6D2]'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-[#76614B]">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio & Sound FX Toggle */}
                  <div className="pt-2 border-t border-[#C9963A]/25 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#2A2018]">
                        {isEn ? 'Audio Effects (Bell & Gong)' : 'Efek Audio Sesi (Bell & Gong)'}
                      </div>
                      <div className="text-[11px] text-[#5C4A37]">
                        {isEn
                          ? 'Audible bells on phase transitions and timer completion'
                          : 'Bunyi penanda fase dan lonceng nominasi'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        soundEnabled
                          ? 'bg-[#2A2018] text-[#FAF6EE] border-[#2A2018]'
                          : 'bg-[#FAF6EE] text-[#76614B] border-[#C9963A]/40'
                      }`}
                    >
                      {soundEnabled ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-[#C9963A]" />
                          <span>{isEn ? 'Sound ON' : 'Aktif'}</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Muted' : 'Bisu'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Back to Pause Menu */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('menu')}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#C9963A]/40 text-xs font-bold text-[#5C4A37] hover:bg-[#EFE6D2] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{isEn ? 'Back to Menu' : 'Kembali ke Menu Jeda'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: ABOUT */}
              {activeTab === 'about' && (
                <div className="space-y-3 text-xs leading-relaxed text-[#5C4A37]">
                  <div className="p-3.5 rounded-2xl bg-[#F2EBDB] border border-[#C9963A]/30 space-y-1.5">
                    <div className="font-display font-bold text-sm text-[#2A2018]">
                      Blood on the Clocktower — Trouble Brewing
                    </div>
                    <p>
                      Aplikasi desktop ini merupakan asisten narator digital offline resmi berbasis WebView2 Windows dan Next.js, diselaraskan dengan karya komunitas botcgrimoire.
                    </p>
                    <p className="text-[11px] text-[#76614B]">
                      Karakter, artwork, dan mekanik permainan merupakan hak cipta <em>The Pandemonium Institute</em>.
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div><strong>Mode Aplikasi:</strong> BOTC Desktop (Windows 10/11)</div>
                    <div><strong>Runtime:</strong> Microsoft Edge WebView2 (.NET 10.0)</div>
                    <div><strong>Edisi Aktif:</strong> Trouble Brewing (Bahasa Indonesia)</div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('menu')}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#C9963A]/40 text-xs font-bold text-[#5C4A37] hover:bg-[#EFE6D2] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Kembali ke Menu Jeda</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
