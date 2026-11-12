'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { GamePhase, PlayerSeat } from '@/lib/botc-engine';

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
  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
  const aliveCount = players.filter((p) => p.isAlive).length;

  const phaseLabel =
    phase === 'first_night'
      ? 'Malam Pertama'
      : phase === 'day'
      ? `Siang Hari ke-${dayNumber}`
      : `Malam ke-${Math.max(2, dayNumber)}`;

  return (
    <div
      className={
        isDesktop
          ? 'h-full min-h-0 flex flex-col justify-between gap-3 py-0.5 overflow-hidden'
          : 'max-w-6xl mx-auto space-y-8 py-2'
      }
    >
      {/* Editorial Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={
          isDesktop
            ? 'relative shrink-0 rounded-2xl bg-[#FFFCF7] border border-amber-700/20 px-6 py-4 overflow-hidden shadow-sm'
            : 'relative rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 sm:p-10 overflow-hidden shadow-xl'
        }
      >
        {/* Subtle Gold Aura */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#D4AF37]/8 blur-3xl pointer-events-none" />

        {isDesktop ? (
          <img
            src="/art/editions/tb.webp"
            alt=""
            aria-hidden="true"
            className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 h-28 w-28 object-contain opacity-90 pointer-events-none drop-shadow-sm"
          />
        ) : (
          /* Clocktower Mechanical Astrolabe Watermark */
          <div
            aria-hidden="true"
            className="hidden md:block absolute -right-14 top-1/2 -translate-y-1/2 w-72 h-72 pointer-events-none opacity-[0.09] dark:opacity-[0.11] text-purple-900 dark:text-[#D4AF37]"
          >
            <svg
              viewBox="0 0 200 200"
              fill="none"
              className="w-full h-full animate-clockwork-slow"
            >
              <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
              <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="1" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <line
                  key={deg}
                  x1="100"
                  y1="10"
                  x2="100"
                  y2="24"
                  stroke="currentColor"
                  strokeWidth="2"
                  transform={`rotate(${deg} 100 100)`}
                />
              ))}
            </svg>
            <svg
              viewBox="0 0 200 200"
              fill="none"
              className="absolute inset-0 w-full h-full animate-clockwork-reverse"
            >
              <circle cx="100" cy="100" r="54" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
              <polygon points="100,48 110,100 100,152 90,100" stroke="currentColor" strokeWidth="1.2" />
              <polygon points="48,100 100,110 152,100 100,90" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="100" cy="100" r="14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        <div className={`relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 ${isDesktop ? 'md:pr-32' : 'gap-6'}`}>
          <div className={isDesktop ? 'space-y-1.5 max-w-2xl' : 'space-y-3 max-w-2xl'}>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-100 dark:bg-[#0C0C10] border border-purple-200 dark:border-[#D4AF37]/30 text-[11px] font-mono font-semibold text-purple-900 dark:text-[#D4AF37] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
              Trouble Brewing · Storyteller Assistant
            </div>
            <h1 className={`font-display font-bold tracking-tight text-slate-900 dark:text-[#EDEAF0] leading-[1.12] ${isDesktop ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>
              Grimoire. Narasi. Intuisi.
            </h1>
            <p className={`text-slate-600 dark:text-[#8E8A9E] leading-relaxed ${isDesktop ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
              Asisten narator digital resmi untuk memandu sesi <em>Blood on the Clocktower</em>. Kelola pembagian peran rahasia, status racun, lingkaran kursi, serta panduan malam secara presisi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenRulesReference}
              className="px-4 py-2 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-semibold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <BookMarked className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
              <span>Lembar Skrip</span>
            </button>
            {hasActiveGame && (
              <button
                type="button"
                onClick={onResetSession}
                className="px-4 py-2 rounded-full bg-purple-50 dark:bg-white/[0.05] hover:bg-red-50 dark:hover:bg-[#3D1A1E] border border-purple-200 dark:border-white/[0.08] hover:border-red-300 dark:hover:border-[#EF4444]/40 text-xs font-semibold text-slate-600 dark:text-[#8E8A9E] hover:text-red-700 dark:hover:text-[#FECACA] flex items-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sesi</span>
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
          {/* Main Status Bento Card - Perfectly Responsive to Dark and Light Mode */}
          <div className={`lg:col-span-2 bg-white dark:bg-[#181520] text-[#1E1B4B] dark:text-[#EDEAF0] border border-purple-200 dark:border-[#2A2636] flex flex-col justify-between relative overflow-hidden ${isDesktop ? 'rounded-2xl p-4 shadow-sm' : 'rounded-3xl p-6 sm:p-8 shadow-xl'}`}>
            <div className={isDesktop ? 'space-y-2' : 'space-y-4'}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-[#0C0C10] text-purple-900 dark:text-[#D4AF37] border border-purple-200 dark:border-white/[0.08] text-[10px] font-mono font-bold tracking-wider uppercase">
                  Sesi Aktif Berjalan
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-[#8E8A9E] font-mono">
                  {playerCount} Pemain Terdaftar
                </span>
              </div>

              <div className={isDesktop ? 'flex flex-wrap items-center justify-between gap-3' : ''}>
                <div>
                  <h2 className={`font-display font-bold text-slate-900 dark:text-[#EDEAF0] tracking-tight ${isDesktop ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
                    {phaseLabel}
                  </h2>
                  {!isDesktop && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8E8A9E] mt-1">
                      Meja lingkaran grimoire dan susunan peran siap dikelola.
                    </p>
                  )}
                </div>

                {/* Stats Row */}
                <div className={`grid grid-cols-3 gap-2.5 ${isDesktop ? 'min-w-[240px]' : 'pt-2 gap-3'}`}>
                  <div className={`rounded-xl bg-purple-50 dark:bg-[#14141B] border border-purple-100 dark:border-white/[0.06] ${isDesktop ? 'px-3 py-1.5' : 'p-3 rounded-2xl'}`}>
                    <span className="text-[10px] text-slate-500 dark:text-[#8E8A9E] block font-medium">Hidup</span>
                    <span className={`font-display font-bold text-emerald-700 dark:text-[#34D399] ${isDesktop ? 'text-xl' : 'text-2xl'}`}>
                      {aliveCount}
                    </span>
                  </div>
                  <div className={`rounded-xl bg-purple-50 dark:bg-[#14141B] border border-purple-100 dark:border-white/[0.06] ${isDesktop ? 'px-3 py-1.5' : 'p-3 rounded-2xl'}`}>
                    <span className="text-[10px] text-slate-500 dark:text-[#8E8A9E] block font-medium">Tewas</span>
                    <span className={`font-display font-bold text-red-600 dark:text-[#F87171] ${isDesktop ? 'text-xl' : 'text-2xl'}`}>
                      {playerCount - aliveCount}
                    </span>
                  </div>
                  <div className={`rounded-xl bg-purple-50 dark:bg-[#14141B] border border-purple-100 dark:border-white/[0.06] ${isDesktop ? 'px-3 py-1.5' : 'p-3 rounded-2xl'}`}>
                    <span className="text-[10px] text-slate-500 dark:text-[#8E8A9E] block font-medium">Hari</span>
                    <span className={`font-display font-bold text-slate-900 dark:text-[#EDEAF0] ${isDesktop ? 'text-xl' : 'text-2xl'}`}>
                      #{dayNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className={`flex flex-wrap items-center gap-2 border-t border-purple-100 dark:border-white/[0.08] ${isDesktop ? 'pt-3 mt-2.5' : 'pt-6 mt-4 gap-2.5'}`}>
              <Link
                href="/grimoire"
                className="brass-sheen-btn px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
              >
                <Compass className="w-4 h-4 fill-current" />
                <span>Buka Grimoire</span>
              </Link>
              <Link
                href="/narrator"
                className="px-4 py-2 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] text-purple-900 dark:text-[#EDEAF0] border border-purple-200 dark:border-white/[0.1] text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Moon className="w-4 h-4 text-purple-600 dark:text-[#93C5FD]" />
                <span>Urutan Narator</span>
              </Link>
              <Link
                href="/evil"
                className="px-4 py-2 rounded-full bg-red-100 dark:bg-[#2A1216] hover:bg-red-200 dark:hover:bg-[#3D1A1E] text-red-900 dark:text-[#FCA5A5] border border-red-200 dark:border-[#EF4444]/30 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Swords className="w-4 h-4 text-red-600 dark:text-[#EF4444]" />
                <span>Tim Evil & Bluff</span>
              </Link>
            </div>
          </div>

          {/* Quick Side Widget: Kisah & Log */}
          <div className={`bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex flex-col justify-between ${isDesktop ? 'rounded-2xl p-4 shadow-sm space-y-2' : 'rounded-3xl p-6 sm:p-7 shadow-xl space-y-4'}`}>
            <div className={isDesktop ? 'space-y-1.5' : 'space-y-3'}>
              <span className="text-[11px] font-mono text-purple-700 dark:text-[#D4AF37] font-semibold uppercase tracking-wider block">
                Riwayat Sesi
              </span>
              <h3 className={`font-display font-bold text-slate-900 dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                Kisah & Log Permainan
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] leading-relaxed">
                Pantau susunan peran awal setiap kursi serta kronologi peristiwa kematian, eksekusi, dan pergantian Demon.
              </p>
            </div>

            <Link
              href="/story"
              className="w-full py-2.5 px-4 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center justify-between transition-colors shadow-sm"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
                <span>Buka Kisah Permainan</span>
              </span>
              <ArrowRight className="w-4 h-4 text-purple-700 dark:text-[#8E8A9E]" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Main Bento Cards Grid (Action Hub) */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${isDesktop ? 'gap-3 flex-1 min-h-0' : 'gap-5'}`}>
        {/* Card 1: Setup Baru */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          whileHover={{ y: -3 }}
          className={`bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex flex-col justify-between hover:border-purple-400 dark:hover:border-[#D4AF37]/50 transition-colors group ${isDesktop ? 'rounded-2xl p-4 shadow-sm space-y-3 min-h-0' : 'rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl'}`}
        >
          <div className={isDesktop ? 'space-y-2' : 'space-y-3'}>
            <div className={`${isDesktop ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} bg-purple-50 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-[#D4AF37] group-hover:scale-110 transition-transform`}>
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-bold text-slate-900 dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                Mode Setup Biasa
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] mt-1 leading-relaxed">
                Atur 5–15 pemain, komposisi Townsfolk/Outsider/Minion/Demon, rumus pengacak seimbang, serta pilih pembagian bergilir (Discovery) atau langsung ke Grimoire.
              </p>
            </div>
          </div>

          <Link
            href="/setup"
            className="w-full py-2.5 px-5 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] fill-current" />
            <span>Buka Mode Setup Biasa</span>
          </Link>
        </motion.div>

        {/* Card 2: Mode 1 — Ambil Token dari Kantong Velvet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          whileHover={{ y: -3 }}
          className={`bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex flex-col justify-between hover:border-purple-400 dark:hover:border-[#D4AF37]/50 transition-colors group ${isDesktop ? 'rounded-2xl p-4 shadow-sm space-y-3 min-h-0' : 'rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl'}`}
        >
          <div className={isDesktop ? 'space-y-2' : 'space-y-3'}>
            <div className={`${isDesktop ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} bg-purple-50 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-[#D4AF37] group-hover:scale-110 transition-transform`}>
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-bold text-slate-900 dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                Ambil Token (Kantong Velvet)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] mt-1 leading-relaxed">
                Aduk kepingan tertutup di dalam kantong velvet, biarkan setiap pemain memilih tokennya sendiri dengan animasi flip 3D rahasia sebelum masuk ke Grimoire.
              </p>
            </div>
          </div>

          <Link
            href="/webplay"
            className="w-full py-2.5 px-5 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
            <span>Buka Kantong Velvet</span>
          </Link>
        </motion.div>

        {/* Card 3: Demo Cepat */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.26 }}
          whileHover={{ y: -3 }}
          className={`bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex flex-col justify-between hover:border-emerald-300 dark:hover:border-white/[0.2] transition-colors group ${isDesktop ? 'rounded-2xl p-4 shadow-sm space-y-3 min-h-0' : 'rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg hover:shadow-xl'}`}
        >
          <div className={isDesktop ? 'space-y-2' : 'space-y-3'}>
            <div className={`${isDesktop ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-2xl'} bg-emerald-50 dark:bg-[#0C0C10] border border-emerald-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-[#34D399] group-hover:scale-110 transition-transform`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-bold text-slate-900 dark:text-[#EDEAF0] ${isDesktop ? 'text-lg' : 'text-xl'}`}>
                Sesi Demo Instan (8 Pemain)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] mt-1 leading-relaxed">
                Mulai langsung sesi simulasi 8 pemain siap pakai untuk mencoba fungsi meja grimoire, token status, dan urutan malam.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onQuickStartDemo}
            className="w-full py-2.5 px-5 rounded-full bg-emerald-100 dark:bg-[#0C0C10] hover:bg-emerald-200 dark:hover:bg-[#1E1E28] border border-emerald-300 dark:border-white/[0.1] text-xs font-bold text-emerald-900 dark:text-[#EDEAF0] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-[#34D399]" />
            <span>Mulai Demo 8 Pemain</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
