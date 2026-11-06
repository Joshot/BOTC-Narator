'use client';

import React from 'react';
import {
  BookMarked,
  Coins,
  Compass,
  Moon,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Swords,
  Users,
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#231A26] border border-[#D4AF37]/40 text-xs font-semibold text-[#FDE68A] tracking-wider uppercase">
          Edisi Resmi Trouble Brewing · Bahasa Indonesia
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F5EFE6] text-balance">
          Digital Grimoire & Storyteller Assistant
        </h1>
        <p className="text-sm sm:text-base text-[#B8B0A2] leading-relaxed">
          Asisten narator resmi untuk memandu permainan papan <em>Blood on the Clocktower</em>. Kelola pembagian peran rahasia, visualisasi kursi melingkar, token pengingat, dan urutan malam secara otomatis.
        </p>
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Game Card (If present) */}
        {hasActiveGame ? (
          <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-[#22161A] via-[#1B1626] to-[#16202E] border-2 border-[#D4AF37] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3D354E]">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                  Sesi Permainan Sedang Berlangsung
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5EFE6]">
                  {phaseLabel} · {playerCount} Pemain ({aliveCount} Hidup)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#14291F] border border-[#10B981]/50 text-xs font-semibold text-[#6EE7B7]">
                  Tersimpan di LocalStorage
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#D6CFC2]">
              Sesi permainan aktif Anda tersimpan utuh di perangkat ini. Anda dapat langsung membuka meja Grimoire, mengecek tim Evil & Bluff, atau menjalankan narasi urutan malam.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onContinueGame('grimoire')}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <Compass className="w-4 h-4" />
                <span>Buka Meja Grimoire</span>
              </button>

              <button
                type="button"
                onClick={() => onContinueGame('narrator')}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#221E2E] hover:bg-[#312B42] border border-[#3D354E] text-[#EDE7DB] text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Moon className="w-4 h-4 text-[#93C5FD]" />
                <span>Buka Narator Malam</span>
              </button>

              <button
                type="button"
                onClick={() => onContinueGame('evil')}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#221E2E] hover:bg-[#312B42] border border-[#3D354E] text-[#EDE7DB] text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Swords className="w-4 h-4 text-[#F87171]" />
                <span>Panel Evil & Bluff</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Bermain Penuh di Web (Pass-and-Play Koin) Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#231A26] to-[#18131E] border-2 border-[#D4AF37] hover:border-[#F59E0B] transition-all flex flex-col justify-between space-y-4 shadow-xl group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[#2E201B] border border-[#D4AF37]/60 flex items-center justify-center text-[#F59E0B]">
                <Coins className="w-6 h-6 animate-pulse" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1A1208] border border-[#F59E0B]/60 text-[11px] font-bold text-[#FDE68A] uppercase tracking-wider">
                Mode Baru
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#F5EFE6]">
              Bermain Penuh di Web
            </h2>
            <p className="text-xs sm:text-sm text-[#D6CFC2] leading-relaxed">
              Main langsung di HP atau web dengan sistem putar koin rahasia (Pass-and-Play). Pilih karakter, putar koin satu per satu untuk setiap pemain, masukkan nama secara manual tanpa nama bawaan, dan mulai malam pertama setelah jeda 3 detik.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartWebPlay}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Coins className="w-4 h-4" />
            <span>Mulai Bermain di Web (Roll Koin)</span>
          </button>
        </div>

        {/* Start New Setup Card */}
        <div className="p-6 rounded-2xl bg-[#181520] border border-[#2D283B] hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between space-y-4 shadow-lg group">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#231E2E] border border-[#3D354E] flex items-center justify-center text-[#D4AF37]">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#F5EFE6]">
              Setup Permainan Fisik / Grimoire Manual
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A092] leading-relaxed">
              Mulai konfigurasi baru untuk memandu permainan kartu fisik: tentukan 5–15 pemain, komposisi peran, nama kursi berurutan searah jarum jam, dan rahasia peran Drunk.
            </p>
          </div>

          <button
            type="button"
            onClick={onStartNewSetup}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Setup Manual</span>
          </button>
        </div>

        {/* Quick Demo Session Card */}
        <div className="p-6 rounded-2xl bg-[#181520] border border-[#2D283B] hover:border-[#38BDF8]/60 transition-all flex flex-col justify-between space-y-4 shadow-lg">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#172230] border border-[#2A435E] flex items-center justify-center text-[#38BDF8]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#F5EFE6]">
              Muat Sesi Contoh (8 Pemain)
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A092] leading-relaxed">
              Ingin langsung mencoba atau mendemonstrasikan aplikasi? Muat sesi contoh lengkap dengan 8 pemain duduk melingkar, peran Drunk aktif, Poisoner, Monk, Spy, dan Imp.
            </p>
          </div>

          <button
            type="button"
            onClick={onQuickStartDemo}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253247] border border-[#38BDF8]/50 text-[#BAE6FD] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Muat Contoh Cepat</span>
          </button>
        </div>

        {/* Rules & Reference Sheet Card */}
        <div className="p-6 rounded-2xl bg-[#181520] border border-[#2D283B] hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between space-y-4 shadow-lg">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#231E2E] border border-[#3D354E] flex items-center justify-center text-[#D4AF37]">
              <BookMarked className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#F5EFE6]">
              Buku Panduan & Referensi Peran
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A092] leading-relaxed">
              Buka lembar panduan resmi Trouble Brewing berbahasa Indonesia. Berisi 22 deskripsi peran, urutan bangun malam, dan interaksi kemampuan khusus (Drunk, Slayer, Virgin, Imp Starpass).
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRulesReference}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#221E2E] hover:bg-[#2E283E] border border-[#3D354E] text-[#EDE7DB] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <BookMarked className="w-4 h-4 text-[#D4AF37]" />
            <span>Buka Lembar Referensi</span>
          </button>
        </div>

        {/* Official Rules & Count Specs Card */}
        <div className="p-6 rounded-2xl bg-[#181520] border border-[#2D283B] flex flex-col justify-between space-y-4 shadow-lg">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#231E2E] border border-[#3D354E] flex items-center justify-center text-[#D4AF37]">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#F5EFE6]">
              Tabel Komposisi Trouble Brewing
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A092] leading-relaxed">
              Mendukung penuh aturan standar 5 hingga 15 pemain: kalkulasi otomatis ambang batas suara eksekusi, suara hantu untuk pemain mati, dan efek Baron (+2 Outsiders, -2 Townsfolk).
            </p>
          </div>

          <div className="text-xs text-[#8E8698] font-mono">
            Kapasitas: 5 - 15 Warga · 22 Karakter Resmi · Mode Spy Bersih
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Existing Game if any */}
      {hasActiveGame && (
        <div className="pt-4 border-t border-[#292535] flex items-center justify-between text-xs text-[#8E8698]">
          <span>Ingin menghapus sesi permainan aktif saat ini?</span>
          <button
            type="button"
            onClick={onResetSession}
            className="px-3 py-1.5 rounded-lg bg-[#24171A] hover:bg-[#361B20] text-[#FECACA] border border-[#EF4444]/40 font-medium cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hapus Sesi Aktif</span>
          </button>
        </div>
      )}
    </div>
  );
}
