'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Compass,
  Copy,
  Crosshair,
  Crown,
  Eye,
  Filter,
  Gavel,
  History,
  Moon,
  RefreshCw,
  Scroll,
  ShieldAlert,
  Skull,
  Sparkles,
  Sun,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useGameSession, GameStoryEntry, InitialPlayerRoster } from '@/context/GameContext';
import { ROLE_MAP } from '@/lib/botc-data';
import InGameHeader from '@/components/InGameHeader';

export default function StoryPage() {
  const {
    hasActiveGame,
    players,
    initialPlayers,
    demonBluffIds,
    winner,
    storyHistory,
    activeRoom,
    dayNumber,
    phase,
  } = useGameSession();

  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!hasActiveGame) {
    return (
      <div className="max-w-xl mx-auto min-h-[70dvh] flex flex-col items-center justify-center py-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-amber-700 dark:text-[#D4AF37] shadow-md dark:shadow-xl">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#EDEAF0]">
            Belum Ada Kisah Permainan
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#8E8A9E] leading-relaxed">
            Riwayat cerita dan alur permainan akan otomatis tercatat secara kronologis begitu sesi permainan dimulai.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/setup"
            className="brass-sheen-btn inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] font-bold text-xs shadow-lg transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Mulai Setup Permainan</span>
          </Link>
        </div>
      </div>
    );
  }

  // Fallback if initialPlayers not captured yet (e.g. from existing sessions)
  const roster: InitialPlayerRoster[] =
    initialPlayers && initialPlayers.length > 0
      ? initialPlayers
      : players.map((p) => ({
          id: p.id,
          name: p.name,
          seatIndex: p.seatIndex,
          roleId: p.trueRoleId,
          perceivedRoleId: p.perceivedRoleId,
          team: ROLE_MAP[p.trueRoleId]?.team || 'townsfolk',
        }));

  const handleCopyStory = async () => {
    try {
      const header = `=== KRONOLOGI CERITA & SUSUNAN PERAN: ${activeRoom.name} ===\nStatus: ${
        winner === 'good'
          ? 'Kemenangan Tim Good (Warga Kota Menang)'
          : winner === 'evil'
          ? 'Kemenangan Tim Evil (Kelompok Jahat Menang)'
          : `Permainan Sedang Berlangsung (Fase ${phase}, Hari ${dayNumber})`
      }\n\n--- SUSUNAN PERAN AWAL PEMAIN ---\n${roster
        .map(
          (p) =>
            `Kursi ${p.seatIndex + 1}: ${p.name} - Peran Awal: ${
              ROLE_MAP[p.roleId]?.name || p.roleId
            } (${p.team})`
        )
        .join('\n')}\n\n--- KRONOLOGI ALUR CERITA ---\n${storyHistory
        .map((entry) => `[${entry.round}] ${entry.text}`)
        .join('\n')}\n`;

      await navigator.clipboard.writeText(header);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const filteredHistory = storyHistory.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'deaths') return item.category === 'death' || item.category === 'starpass';
    return item.category === filterCategory;
  });

  const getCategoryBadge = (category: GameStoryEntry['category']) => {
    switch (category) {
      case 'starpass':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-purple-700 dark:text-[#C084FC]" />,
          label: 'STARPASS / BUNUH DIRI',
          classes: 'bg-purple-100 dark:bg-[#A855F7]/15 border-purple-300 dark:border-[#A855F7]/40 text-purple-950 dark:text-[#E9D5FF] font-bold',
        };
      case 'death':
        return {
          icon: <Skull className="w-3.5 h-3.5 text-red-700 dark:text-[#F87171]" />,
          label: 'KEMATIAN',
          classes: 'bg-red-100 dark:bg-[#EF4444]/15 border-red-300 dark:border-[#EF4444]/40 text-red-950 dark:text-[#FCA5A5] font-bold',
        };
      case 'execution':
        return {
          icon: <Gavel className="w-3.5 h-3.5 text-amber-700 dark:text-[#FBBF24]" />,
          label: 'EKSEKUSI',
          classes: 'bg-amber-100 dark:bg-[#F59E0B]/15 border-amber-300 dark:border-[#F59E0B]/40 text-amber-950 dark:text-[#FDE68A] font-bold',
        };
      case 'slayer':
        return {
          icon: <Crosshair className="w-3.5 h-3.5 text-blue-700 dark:text-[#60A5FA]" />,
          label: 'SLAYER',
          classes: 'bg-blue-100 dark:bg-[#3B82F6]/15 border-blue-300 dark:border-[#3B82F6]/40 text-blue-950 dark:text-[#BFDBFE] font-bold',
        };
      case 'win':
        return {
          icon: <Trophy className="w-3.5 h-3.5 text-amber-700 dark:text-[#FACC15]" />,
          label: 'KEMENANGAN',
          classes: 'bg-amber-100 dark:bg-[#EAB308]/20 border-amber-400 dark:border-[#EAB308]/50 text-amber-950 dark:text-[#FEF08A] font-black',
        };
      case 'start':
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-[#34D399]" />,
          label: 'AWAL',
          classes: 'bg-emerald-100 dark:bg-[#10B981]/15 border-emerald-300 dark:border-[#10B981]/40 text-emerald-950 dark:text-[#A7F3D0] font-bold',
        };
    }
  };

  const getTeamBadge = (team: string) => {
    switch (team) {
      case 'demon':
        return 'bg-red-100 text-red-950 border-red-300 dark:bg-[#450A0A]/60 dark:text-[#FCA5A5] dark:border-[#EF4444]/60 font-black';
      case 'minion':
        return 'bg-orange-100 text-orange-950 border-orange-300 dark:bg-[#7F1D1D]/50 dark:text-[#FECACA] dark:border-[#DC2626]/50 font-black';
      case 'outsider':
        return 'bg-sky-100 text-sky-950 border-sky-300 dark:bg-[#075985]/60 dark:text-[#BAE6FD] dark:border-[#0284C7]/60 font-black';
      case 'townsfolk':
      default:
        return 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-[#1E3A8A]/60 dark:text-[#BFDBFE] dark:border-[#2563EB]/60 font-black';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Phase Header & Sub-Nav */}
      <InGameHeader />

      {/* Main Page Title & Top Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-[#1C1C26] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center text-[#D4AF37] shrink-0 shadow-inner">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-[#D4AF37]/20 text-[10px] font-mono font-bold text-amber-800 dark:text-[#FDE68A] uppercase">
                Kronologi Lengkap
              </span>
              <span className="text-xs text-slate-500 dark:text-[#8E8A9E] font-mono">
                {activeRoom.name}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#EDEAF0]">
              Kisah & Riwayat Permainan
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyStory}
            className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-[#222230] hover:bg-purple-100 dark:hover:bg-[#2C2C3E] border border-purple-200 dark:border-white/[0.08] text-xs font-semibold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-[#34D399]" />
                <span className="text-emerald-700 dark:text-[#34D399] font-bold">Kisah Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-[#A6A2B2]" />
                <span>Salin Seluruh Kisah</span>
              </>
            )}
          </button>

          <Link
            href="/grimoire"
            className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Grimoire</span>
          </Link>
        </div>
      </div>

      {/* Victory Status Banner */}
      {winner && (
        <div
          className={`p-6 rounded-3xl border shadow-md dark:shadow-xl flex items-center gap-4 ${
            winner === 'good'
              ? 'bg-emerald-50 dark:bg-[#064E3B]/30 border-emerald-400 dark:border-[#10B981]/40 text-emerald-950 dark:text-[#A7F3D0]'
              : 'bg-red-50 dark:bg-[#7F1D1D]/30 border-red-400 dark:border-[#EF4444]/40 text-red-950 dark:text-[#FECACA]'
          }`}
        >
          <div
            className={`p-3.5 rounded-2xl border shrink-0 ${
              winner === 'good'
                ? 'bg-emerald-600 dark:bg-[#065F46] border-emerald-500 dark:border-[#34D399]/40 text-white dark:text-[#34D399]'
                : 'bg-red-600 dark:bg-[#991B1B] border-red-500 dark:border-[#F87171]/40 text-white dark:text-[#F87171]'
            }`}
          >
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold">
              {winner === 'good'
                ? 'KEMENANGAN WARGA KOTA (TIM GOOD MENANG)'
                : 'KEMENANGAN KELOMPOK JAHAT (TIM EVIL MENANG)'}
            </h2>
            <p className="text-xs sm:text-sm opacity-90 mt-0.5 leading-relaxed">
              {winner === 'good'
                ? 'Seluruh Demon berhasil dimusnahkan oleh warga kota Ravenwood Bluff!'
                : 'Kekuatan jahat berhasil memperdaya kota hingga syarat kemenangan terpenuhi.'}
            </p>
          </div>
        </div>
      )}

      {/* ================= SECTION 1: ROLE AWAL SETIAP PEMAIN ================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600 dark:text-[#D4AF37]" />
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#EDEAF0]">
              Susunan Awal Peran Pemain ({roster.length} Pemain)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-[#8E8A9E]">
            Peran rahasia yang dibagikan pada awal permainan
          </span>
        </div>

        {/* Player Roster Grid (Responsive Mobile 2-cols / Desktop 4-cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roster.map((player) => {
            const role = ROLE_MAP[player.roleId];
            return (
              <div
                key={player.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] hover:border-[#D4AF37]/60 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-[#1C1C26] border border-purple-200 dark:border-white/[0.06] text-[10px] font-mono text-purple-900 dark:text-[#D4AF37] font-bold">
                    Kursi #{player.seatIndex + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-wider ${getTeamBadge(
                      player.team
                    )}`}
                  >
                    {player.team}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-600 dark:text-[#8E8A9E] font-medium">Nama Pemain:</div>
                  <div className="font-display text-base font-extrabold text-slate-900 dark:text-[#EDEAF0] truncate group-hover:text-amber-600 dark:group-hover:text-[#D4AF37] transition-colors">
                    {player.name}
                  </div>
                </div>

                <div className="pt-1 border-t border-purple-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-[#8E8A9E]">Peran Awal:</span>
                  <span className="font-black text-slate-900 dark:text-[#EDEAF0] font-mono">
                    {role?.name || player.roleId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demon Bluff Cards if configured */}
        {demonBluffIds && demonBluffIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-[#14141B] border border-red-200 dark:border-[#EF4444]/25 space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-600 dark:text-[#EF4444]" />
              <span className="text-xs font-bold text-red-900 dark:text-[#FCA5A5] uppercase tracking-wider font-mono">
                Peran Bluff Demon (Tidak Ada di Permainan):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {demonBluffIds.map((bid) => {
                const r = ROLE_MAP[bid];
                return (
                  <span
                    key={bid}
                    className="px-3 py-1 rounded-xl bg-white dark:bg-[#2A1216] border border-red-200 dark:border-[#EF4444]/40 text-xs font-bold text-red-900 dark:text-[#FCA5A5] shadow-sm"
                  >
                    {r?.name || bid}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ================= SECTION 2: KRONOLOGI CERITA LENGKAP ================= */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Scroll className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#EDEAF0]">
              Kronologi Alur Cerita ({filteredHistory.length} Peristiwa)
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === 'all'
                  ? 'bg-[#D4AF37] text-[#0C0C10] font-bold'
                  : 'bg-purple-50 dark:bg-[#1C1C26] text-purple-900 dark:text-[#A6A2B2] hover:bg-purple-100 dark:hover:text-[#EDEAF0]'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('deaths')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === 'deaths'
                  ? 'bg-[#EF4444] text-white font-bold'
                  : 'bg-purple-50 dark:bg-[#1C1C26] text-purple-900 dark:text-[#A6A2B2] hover:bg-purple-100 dark:hover:text-[#EDEAF0]'
              }`}
            >
              Kematian & Bunuh Diri
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('execution')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === 'execution'
                  ? 'bg-[#F59E0B] text-[#0C0C10] font-bold'
                  : 'bg-purple-50 dark:bg-[#1C1C26] text-purple-900 dark:text-[#A6A2B2] hover:bg-purple-100 dark:hover:text-[#EDEAF0]'
              }`}
            >
              Eksekusi
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('starpass')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === 'starpass'
                  ? 'bg-[#A855F7] text-white font-bold'
                  : 'bg-purple-50 dark:bg-[#1C1C26] text-purple-900 dark:text-[#A6A2B2] hover:bg-purple-100 dark:hover:text-[#EDEAF0]'
              }`}
            >
              Starpass
            </button>
          </div>
        </div>

        {/* Timeline Event Cards */}
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] p-6 space-y-2">
            <History className="w-8 h-8 mx-auto text-[#4A4756]" />
            <p className="text-xs text-slate-500 dark:text-[#8E8A9E]">
              Tidak ada peristiwa cerita yang sesuai dengan filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((entry, idx) => {
              const badge = getCategoryBadge(entry.category);
              const isStarpass = entry.category === 'starpass';
              return (
                <div
                  key={entry.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-colors space-y-2 ${
                    isStarpass
                      ? 'bg-purple-50 dark:bg-[#21162B] border-purple-300 dark:border-[#A855F7]/40 shadow-sm'
                      : entry.category === 'death'
                      ? 'bg-red-50/70 dark:bg-[#1E1418] border-red-200 dark:border-[#EF4444]/25'
                      : 'bg-white dark:bg-[#14141B] border-purple-200 dark:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${badge.classes}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="font-display text-xs sm:text-sm font-bold text-amber-700 dark:text-[#D4AF37]">
                        {entry.round}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 dark:text-[#716D80] font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-[#EDEAF0] leading-relaxed font-sans">
                    {entry.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

