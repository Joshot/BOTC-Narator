'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useLanguage } from '@/context/LanguageContext';
import {
  BookMarked,
  Coins,
  Compass,
  History,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Swords,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Settings,
} from 'lucide-react';
import { GamePhase, PlayerSeat } from '@/lib/botc-engine';
import { requestDesktopAction, onDesktopWindowStateChange } from '@/lib/desktop-bridge';

interface DashboardViewProps {
  hasActiveGame: boolean;
  playerCount: number;
  phase: GamePhase;
  dayNumber: number;
  players: PlayerSeat[];
  onStartNewSetup: () => void;
  onStartWebPlay: () => void;
  onContinueGame: (targetTab: 'grimoire' | 'evil' | 'narrator') => void;
  onQuickStartDemo: () => void;
  onOpenRulesReference: () => void;
  onResetSession: () => void;
}

export default function DashboardView({
  hasActiveGame,
  playerCount,
  phase,
  dayNumber,
  players,
  onStartNewSetup,
  onStartWebPlay,
  onContinueGame,
  onQuickStartDemo,
  onOpenRulesReference,
  onResetSession,
}: DashboardViewProps) {
  const { language } = useLanguage();
  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
  const aliveCount = players.filter((p) => p.isAlive).length;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
    const unsubscribe = onDesktopWindowStateChange((full) => setIsFullscreen(full));
    return () => unsubscribe();
  }, []);

  const handleOpenSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('botc-open-pause-menu', { detail: { tab: 'settings' } }));
    }
  };

  const phaseLabel =
    phase === 'first_night'
      ? (language === 'en' ? 'First Night' : 'Malam Pertama')
      : phase === 'day'
      ? (language === 'en' ? `Day ${dayNumber}` : `Siang Hari ke-${dayNumber}`)
      : (language === 'en' ? `Night ${Math.max(2, dayNumber)}` : `Malam ke-${Math.max(2, dayNumber)}`);

  return (
    <div
      className={
        isDesktop
          ? 'w-full h-full min-h-0 flex-1 flex flex-col justify-between gap-3 overflow-hidden select-none'
          : 'max-w-6xl mx-auto space-y-8 py-2'
      }
    >
      {/* Editorial Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={
          isDesktop
            ? 'relative shrink-0 rounded-3xl bg-[#FAF6EE] border-2 border-[#C9963A]/40 px-6 py-4 overflow-hidden shadow-sm'
            : 'relative rounded-3xl bg-[#FAF6EE] dark:bg-[#14141B] border border-[#C9963A]/40 dark:border-white/[0.08] p-6 sm:p-10 overflow-hidden shadow-xl'
        }
      >
        {/* Subtle Gold Aura */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#C9963A]/10 blur-3xl pointer-events-none" />

        {/* Edition Watermark Art */}
        <img
          src="/art/editions/tb.webp"
          alt=""
          aria-hidden="true"
          className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 h-28 w-28 object-contain opacity-85 pointer-events-none drop-shadow-sm"
        />

        <div className={`relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 ${isDesktop ? 'md:pr-32' : 'gap-6'}`}>
          <div className={isDesktop ? 'space-y-1.5 max-w-3xl' : 'space-y-3 max-w-2xl'}>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#F2EBDB] dark:bg-[#0C0C10] border border-[#C9963A]/40 text-[11px] font-mono font-semibold text-[#2A2018] dark:text-[#D4AF37] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#991B1B]" />
              Trouble Brewing · Storyteller Grimoire
            </div>
            <h1 className={`font-display font-bold tracking-tight text-[#2A2018] dark:text-[#EDEAF0] leading-[1.12] ${isDesktop ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>
              {language === 'en' ? 'Grimoire. Storytelling. Intuition.' : 'Grimoire. Narasi. Intuisi.'}
            </h1>
            <p className={`text-[#5C4A37] dark:text-[#8E8A9E] leading-relaxed ${isDesktop ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
              {language === 'en'
                ? 'Official digital narrator assistant for guiding Blood on the Clocktower sessions. Manage secret role distribution, poisoned status, circular seating, and night sequences with precision.'
                : 'Asisten narator digital resmi untuk memandu sesi Blood on the Clocktower. Kelola pembagian peran rahasia, status racun, lingkaran kursi, serta panduan malam secara presisi.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenRulesReference}
              className="px-4 py-2 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] dark:bg-[#1E1E28] border border-[#C9963A]/35 text-xs font-bold text-[#2A2018] dark:text-[#EDEAF0] flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <BookMarked className="w-4 h-4 text-[#C9963A]" />
              <span>{language === 'en' ? 'Script Sheet' : 'Lembar Skrip'}</span>
            </button>

            {isDesktop && (
              <button
                type="button"
                onClick={handleOpenSettings}
                className="px-3.5 py-2 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] border border-[#C9963A]/35 text-xs font-bold text-[#2A2018] flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                title={language === 'en' ? 'Display Options & Felt Theme (ESC)' : 'Opsi Tampilan & Kain Meja (ESC)'}
              >
                <Settings className="w-4 h-4 text-[#C9963A]" />
                <span>{language === 'en' ? 'Options' : 'Opsi'}</span>
              </button>
            )}

            {hasActiveGame && (
              <button
                type="button"
                onClick={onResetSession}
                className="px-3.5 py-2 rounded-xl bg-red-50/80 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-900 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Reset Session' : 'Reset Sesi'}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Active Game Bento Overview (When Active) */}
      {hasActiveGame && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.08, ease: 'easeOut' }}
          className={`grid grid-cols-1 lg:grid-cols-3 ${isDesktop ? 'gap-3 shrink-0' : 'gap-5'}`}
        >
          {/* Main Status Bento Card */}
          <div className={`lg:col-span-2 bg-[#FAF6EE] dark:bg-[#181520] text-[#2A2018] dark:text-[#EDEAF0] border-2 border-[#C9963A]/40 flex flex-col justify-between relative overflow-hidden ${isDesktop ? 'rounded-3xl p-4 sm:p-5 shadow-xs' : 'rounded-3xl p-6 sm:p-8 shadow-xl'}`}>
            <div className={isDesktop ? 'space-y-2' : 'space-y-4'}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#991B1B]/10 text-[#991B1B] border border-[#991B1B]/25 text-[10px] font-mono font-bold tracking-wider uppercase">
                  {language === 'en' ? 'Active Session Running' : 'Sesi Aktif Berjalan'}
                </span>
                <span className="text-xs font-semibold text-[#5C4A37] dark:text-[#8E8A9E] font-mono">
                  {language === 'en' ? `${playerCount} Registered Players` : `${playerCount} Pemain Terdaftar`}
                </span>
              </div>

              <div className={isDesktop ? 'flex flex-wrap items-center justify-between gap-3' : ''}>
                <div>
                  <h2 className={`font-display font-bold text-[#2A2018] dark:text-[#EDEAF0] tracking-tight ${isDesktop ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {phaseLabel}
                  </h2>
                  {!isDesktop && (
                    <p className="text-xs sm:text-sm text-[#5C4A37] dark:text-[#8E8A9E] mt-1">
                      {language === 'en'
                        ? 'Grimoire table circle and role setup are active.'
                        : 'Meja lingkaran grimoire dan susunan peran siap dikelola.'}
                    </p>
                  )}
                </div>

                {/* Stats Row */}
                <div className={`grid grid-cols-3 gap-2.5 ${isDesktop ? 'min-w-[240px]' : 'pt-2 gap-3'}`}>
                  <div className={`rounded-xl bg-[#F2EBDB] dark:bg-[#14141B] border border-[#C9963A]/25 ${isDesktop ? 'px-3 py-1.5' : 'p-3 rounded-2xl'}`}>
                    <span className="text-[10px] text-[#5C4A37] dark:text-[#8E8A9E] block font-medium">
                      {language === 'en' ? 'Alive' : 'Hidup'}
                    </span>
                    <span className={`font-display font-bold text-emerald-700 dark:text-[#34D399] ${isDesktop ? 'text-xl' : 'text-2xl'}`}>
                      {aliveCount}
                    </span>
                  </div>
                  <div className={`rounded-xl bg-[#F2EBDB] dark:bg-[#14141B] border border-[#C9963A]/25 ${isDesktop ? 'px-3 py-1.5' : 'p-3 rounded-2xl'}`}>
                    <span className="text-[10px] text-[#5C4A37] dark:text-[#8E8A9E] block font-medium">
                      {language === 'en' ? 'Dead' : 'Tewas'}
                    </span>
                    <span className={`font-display font-bold text-red-700 dark:text-[#F87171] ${isDesktop ? 'text-xl' : 'text-2xl'}`}>
                      {playerCount - aliveCount}
                    </span>
                  </div>
                  <div className={`rounded-xl bg-[#F2EBDB] dark:bg-[#14141B] border border-[#C9963A]/25 ${isDesktop ? 'px-3 py-1.5' : 'p-3 rounded-2xl'}`}>
                    <span className="text-[10px] text-[#5C4A37] dark:text-[#8E8A9E] block font-medium">
                      {language === 'en' ? 'Day' : 'Hari'}
                    </span>
                    <span className={`font-display font-bold text-[#2A2018] dark:text-[#EDEAF0] ${isDesktop ? 'text-xl' : 'text-2xl'}`}>
                      #{dayNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className={`flex flex-wrap items-center gap-2 border-t border-[#C9963A]/25 ${isDesktop ? 'pt-3 mt-2.5' : 'pt-6 mt-4 gap-2.5'}`}>
              <Link
                href="/grimoire"
                className="px-4 py-2 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-[#FAF6EE] text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-md"
              >
                <Compass className="w-4 h-4 fill-current" />
                <span>{language === 'en' ? 'Open Grimoire Table' : 'Buka Meja Grimoire'}</span>
              </Link>
              <Link
                href="/narrator"
                className="px-4 py-2 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] text-[#2A2018] dark:text-[#EDEAF0] border border-[#C9963A]/30 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Moon className="w-4 h-4 text-[#C9963A]" />
                <span>{language === 'en' ? 'Night Narrator' : 'Urutan Narator'}</span>
              </Link>
              <Link
                href="/evil"
                className="px-4 py-2 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] text-[#2A2018] dark:text-[#EDEAF0] border border-[#C9963A]/30 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Swords className="w-4 h-4 text-[#991B1B]" />
                <span>{language === 'en' ? 'Evil Team & Bluffs' : 'Tim Evil & Bluff'}</span>
              </Link>
            </div>
          </div>

          {/* Quick Side Widget: Kisah & Log */}
          <div className={`bg-[#FAF6EE] dark:bg-[#14141B] border-2 border-[#C9963A]/40 flex flex-col justify-between ${isDesktop ? 'rounded-3xl p-4 shadow-xs space-y-2' : 'rounded-3xl p-6 sm:p-7 shadow-xl space-y-4'}`}>
            <div className={isDesktop ? 'space-y-1.5' : 'space-y-3'}>
              <span className="text-[11px] font-mono text-[#991B1B] font-bold uppercase tracking-wider block">
                {language === 'en' ? 'Session Chronicle' : 'Riwayat Sesi'}
              </span>
              <h3 className={`font-display font-bold text-[#2A2018] dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                {language === 'en' ? 'Story & Initial Roles' : 'Kisah & Susunan Awal'}
              </h3>
              <p className="text-xs text-[#5C4A37] dark:text-[#8E8A9E] leading-relaxed">
                {language === 'en'
                  ? 'Track secret starting roles of all players and the timeline of deaths and nominations.'
                  : 'Pantau susunan peran rahasia setiap pemain serta kronologi peristiwa kematian dan nominasi.'}
              </p>
            </div>

            <Link
              href="/story"
              className="w-full py-2.5 px-4 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] border border-[#C9963A]/35 text-xs font-bold text-[#2A2018] dark:text-[#EDEAF0] flex items-center justify-between transition-colors shadow-xs"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C9963A]" />
                <span>{language === 'en' ? 'Open Game Story' : 'Buka Kisah Permainan'}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[#5C4A37]" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Main Bento Cards Grid (Action Hub) */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${isDesktop ? 'gap-3 flex-1 min-h-0' : 'gap-5'}`}>
        {/* Card 1: Setup Biasa */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          whileHover={{ y: -2 }}
          className={`bg-[#FAF6EE] dark:bg-[#14141B] border-2 border-[#C9963A]/35 flex flex-col justify-between hover:border-[#C9963A] transition-colors group ${isDesktop ? 'rounded-3xl p-4 shadow-xs space-y-3 min-h-0' : 'rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl'}`}
        >
          <div className={isDesktop ? 'space-y-1.5' : 'space-y-3'}>
            <div className={`${isDesktop ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} bg-[#F2EBDB] border border-[#C9963A]/40 flex items-center justify-center text-[#991B1B] group-hover:scale-110 transition-transform`}>
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-bold text-[#2A2018] dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                {language === 'en' ? 'Standard Setup Mode' : 'Mode Setup Biasa'}
              </h3>
              <p className="text-xs text-[#5C4A37] dark:text-[#8E8A9E] mt-1 leading-relaxed">
                {language === 'en'
                  ? 'Configure 5–15 players, character bag composition, balanced distribution formulas, and pass-and-play Discovery or direct Grimoire entry.'
                  : 'Atur 5–15 pemain, komposisi Townsfolk/Outsider/Minion/Demon, rumus pengacak seimbang, serta pilih pembagian bergilir (Discovery) atau langsung ke Grimoire.'}
              </p>
            </div>
          </div>

          <Link
            href="/setup"
            className="w-full py-2.5 px-5 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] border border-[#C9963A]/35 text-xs font-bold text-[#2A2018] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-[#991B1B] fill-current" />
            <span>{language === 'en' ? 'Start Game Setup' : 'Mulai Setup Permainan'}</span>
          </Link>
        </motion.div>

        {/* Card 2: Mode Ambil Token Velvet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          whileHover={{ y: -2 }}
          className={`bg-[#FAF6EE] dark:bg-[#14141B] border-2 border-[#C9963A]/35 flex flex-col justify-between hover:border-[#C9963A] transition-colors group ${isDesktop ? 'rounded-3xl p-4 shadow-xs space-y-3 min-h-0' : 'rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl'}`}
        >
          <div className={isDesktop ? 'space-y-1.5' : 'space-y-3'}>
            <div className={`${isDesktop ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} bg-[#F2EBDB] border border-[#C9963A]/40 flex items-center justify-center text-[#C9963A] group-hover:scale-110 transition-transform`}>
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-bold text-[#2A2018] dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                {language === 'en' ? 'Velvet Bag Token Draw' : 'Ambil Token (Kantong Velvet)'}
              </h3>
              <p className="text-xs text-[#5C4A37] dark:text-[#8E8A9E] mt-1 leading-relaxed">
                {language === 'en'
                  ? 'Stir the face-down tokens inside the velvet bag and let each player pick their own token with secret 3D flip animation.'
                  : 'Aduk kepingan tertutup di dalam kantong velvet, biarkan setiap pemain memilih tokennya sendiri dengan animasi flip 3D rahasia sebelum masuk ke Grimoire.'}
              </p>
            </div>
          </div>

          <Link
            href="/webplay"
            className="w-full py-2.5 px-5 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] border border-[#C9963A]/35 text-xs font-bold text-[#2A2018] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Coins className="w-3.5 h-3.5 text-[#C9963A]" />
            <span>{language === 'en' ? 'Open Velvet Bag' : 'Buka Kantong Velvet'}</span>
          </Link>
        </motion.div>

        {/* Card 3: Demo Cepat */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.26 }}
          whileHover={{ y: -2 }}
          className={`bg-[#FAF6EE] dark:bg-[#14141B] border-2 border-[#C9963A]/35 flex flex-col justify-between hover:border-[#C9963A] transition-colors group ${isDesktop ? 'rounded-3xl p-4 shadow-xs space-y-3 min-h-0' : 'rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl'}`}
        >
          <div className={isDesktop ? 'space-y-1.5' : 'space-y-3'}>
            <div className={`${isDesktop ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} bg-[#F2EBDB] border border-[#C9963A]/40 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-bold text-[#2A2018] dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                {language === 'en' ? 'Instant Demo (8 Players)' : 'Sesi Demo Instan (8 Pemain)'}
              </h3>
              <p className="text-xs text-[#5C4A37] dark:text-[#8E8A9E] mt-1 leading-relaxed">
                {language === 'en'
                  ? 'Instantly start a ready-to-run 8-player simulation session to test the grimoire table, status tokens, and night cycle.'
                  : 'Mulai langsung sesi simulasi 8 pemain siap pakai untuk mencoba fungsi meja grimoire, token status, dan urutan malam.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onQuickStartDemo}
            className="w-full py-2.5 px-5 rounded-xl bg-[#F2EBDB] hover:bg-[#E8DFC7] border border-[#C9963A]/35 text-xs font-bold text-[#2A2018] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'en' ? 'Start 8-Player Demo' : 'Mulai Demo 8 Pemain'}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
