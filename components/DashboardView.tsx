'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookMarked,
  Coins,
  Compass,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Swords,
  Users,
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
  const aliveCount = players.filter((p) => p.isAlive).length;

  const phaseLabel =
    phase === 'first_night'
      ? 'Malam Pertama'
      : phase === 'day'
      ? `Siang Hari ke-${dayNumber}`
      : `Malam ke-${dayNumber + 1}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-2">
      {/* Editorial Hero Header */}
      <div className="relative rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 sm:p-10 overflow-hidden shadow-xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-[#0C0C10] border border-purple-200 dark:border-[#D4AF37]/30 text-[11px] font-mono font-semibold text-purple-900 dark:text-[#D4AF37] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
              Trouble Brewing · Storyteller Assistant
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-[#EDEAF0] leading-[1.15]">
              Grimoire. Narasi. Intuisi.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#8E8A9E] leading-relaxed">
              Asisten narator digital resmi untuk memandu sesi <em>Blood on the Clocktower</em>. Kelola pembagian peran rahasia, status racun, lingkaran kursi, serta panduan malam secara presisi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenRulesReference}
              className="px-4 py-2.5 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-semibold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <BookMarked className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
              <span>Lembar Skrip</span>
            </button>
            {hasActiveGame && (
              <button
                type="button"
                onClick={onResetSession}
                className="px-4 py-2.5 rounded-full bg-purple-50 dark:bg-white/[0.05] hover:bg-red-50 dark:hover:bg-[#3D1A1E] border border-purple-200 dark:border-white/[0.08] hover:border-red-300 dark:hover:border-[#EF4444]/40 text-xs font-semibold text-slate-600 dark:text-[#8E8A9E] hover:text-red-700 dark:hover:text-[#FECACA] flex items-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sesi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Game Bento Overview (When Active) */}
      {hasActiveGame && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Status Bento Card - Perfectly Responsive to Dark and Light Mode */}
          <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#181520] text-[#1E1B4B] dark:text-[#EDEAF0] border border-purple-200 dark:border-[#2A2636] p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-[#0C0C10] text-purple-900 dark:text-[#D4AF37] border border-purple-200 dark:border-white/[0.08] text-[11px] font-mono font-bold tracking-wider uppercase">
                  Sesi Aktif Berjalan
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-[#8E8A9E] font-mono">
                  {playerCount} Pemain Terdaftar
                </span>
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#EDEAF0] tracking-tight">
                  {phaseLabel}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8E8A9E] mt-1">
                  Status permainan tersimpan otomatis di perangkat. Meja lingkaran grimoire siap dikelola.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-[#14141B] border border-purple-100 dark:border-white/[0.06]">
                  <span className="text-[11px] text-slate-500 dark:text-[#8E8A9E] block font-medium">Hidup</span>
                  <span className="font-display text-2xl font-bold text-emerald-700 dark:text-[#34D399]">
                    {aliveCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-[#14141B] border border-purple-100 dark:border-white/[0.06]">
                  <span className="text-[11px] text-slate-500 dark:text-[#8E8A9E] block font-medium">Tewas</span>
                  <span className="font-display text-2xl font-bold text-red-600 dark:text-[#F87171]">
                    {playerCount - aliveCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-[#14141B] border border-purple-100 dark:border-white/[0.06]">
                  <span className="text-[11px] text-slate-500 dark:text-[#8E8A9E] block font-medium">Hari</span>
                  <span className="font-display text-2xl font-bold text-slate-900 dark:text-[#EDEAF0]">
                    #{dayNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className="flex flex-wrap items-center gap-2.5 pt-6 mt-4 border-t border-purple-100 dark:border-white/[0.08]">
              <Link
                href="/grimoire"
                className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-md"
              >
                <Compass className="w-4 h-4 fill-current" />
                <span>Buka Grimoire</span>
              </Link>
              <Link
                href="/narrator"
                className="px-4 py-2.5 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] text-purple-900 dark:text-[#EDEAF0] border border-purple-200 dark:border-white/[0.1] text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Moon className="w-4 h-4 text-purple-600 dark:text-[#93C5FD]" />
                <span>Urutan Narator</span>
              </Link>
              <Link
                href="/evil"
                className="px-4 py-2.5 rounded-full bg-red-100 dark:bg-[#2A1216] hover:bg-red-200 dark:hover:bg-[#3D1A1E] text-red-900 dark:text-[#FCA5A5] border border-red-200 dark:border-[#EF4444]/30 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Swords className="w-4 h-4 text-red-600 dark:text-[#EF4444]" />
                <span>Tim Evil & Bluff</span>
              </Link>
            </div>
          </div>

          {/* Quick Side Widget */}
          <div className="rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between shadow-xl space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-mono text-purple-700 dark:text-[#D4AF37] font-semibold uppercase tracking-wider block">
                Mode Pemain
              </span>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
                Layar Rahasia Pemain
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] leading-relaxed">
                Gunakan mode HP untuk membagikan token rahasia secara bergantian (pass-and-play) tanpa memerlukan kartu fisik.
              </p>
            </div>

            <Link
              href="/webplay"
              className="w-full py-3 px-4 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center justify-between transition-colors shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
                <span>Buka Layar HP</span>
              </span>
              <ArrowRight className="w-4 h-4 text-purple-700 dark:text-[#8E8A9E]" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Bento Cards Grid (Action Hub) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Setup Baru */}
        <div className="rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-purple-400 dark:hover:border-[#D4AF37]/50 transition-all shadow-lg group">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-[#D4AF37] group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
                Setup Permainan Baru
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] mt-1 leading-relaxed">
                Atur 5–15 pemain, komposisi Townsfolk/Outsider/Minion/Demon, pilih karakter otomatis atau acak, serta beri nama kursi pemain.
              </p>
            </div>
          </div>

          <Link
            href="/setup"
            className="w-full py-3 px-5 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37] fill-current" />
            <span>Mulai Wizard Setup</span>
          </Link>
        </div>

        {/* Card 2: Main di Web (Roll Koin) */}
        <div className="rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-purple-400 dark:hover:border-[#D4AF37]/50 transition-all shadow-lg group">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-[#D4AF37] group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
                Bermain di Web (Roll Koin)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] mt-1 leading-relaxed">
                Bermain langsung tanpa kartu fisik dengan koin rahasia satu per satu. Setiap pemain melihat peran dengan aman di layar.
              </p>
            </div>
          </div>

          <Link
            href="/webplay"
            className="w-full py-3 px-5 rounded-full bg-purple-100 dark:bg-[#1E1E28] hover:bg-purple-200 dark:hover:bg-[#282838] border border-purple-300 dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
            <span>Buka Mode Roll Koin</span>
          </Link>
        </div>

        {/* Card 3: Demo Cepat */}
        <div className="rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-emerald-300 dark:hover:border-white/[0.2] transition-all shadow-lg group">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#0C0C10] border border-emerald-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-[#34D399] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
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
            className="w-full py-3 px-5 rounded-full bg-emerald-100 dark:bg-[#0C0C10] hover:bg-emerald-200 dark:hover:bg-[#1E1E28] border border-emerald-300 dark:border-white/[0.1] text-xs font-bold text-emerald-900 dark:text-[#EDEAF0] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-[#34D399]" />
            <span>Mulai Demo 8 Pemain</span>
          </button>
        </div>
      </div>
    </div>
  );
}
