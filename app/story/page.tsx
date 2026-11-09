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
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#14141B] border border-white/[0.08] flex items-center justify-center mx-auto text-[#D4AF37] shadow-xl">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#EDEAF0]">
            Belum Ada Kisah Permainan
          </h2>
          <p className="text-sm text-[#8E8A9E] leading-relaxed">
            Riwayat cerita dan alur permainan akan otomatis tercatat secara kronologis begitu sesi permainan dimulai.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] font-bold text-xs shadow-lg transition-colors cursor-pointer"
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
          icon: <RefreshCw className="w-3.5 h-3.5 text-[#C084FC]" />,
          label: 'STARPASS / BUNUH DIRI',
          classes: 'bg-[#A855F7]/15 border-[#A855F7]/40 text-[#E9D5FF]',
        };
      case 'death':
        return {
          icon: <Skull className="w-3.5 h-3.5 text-[#F87171]" />,
          label: 'KEMATIAN',
          classes: 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#FCA5A5]',
        };
      case 'execution':
        return {
          icon: <Gavel className="w-3.5 h-3.5 text-[#FBBF24]" />,
          label: 'EKSEKUSI',
          classes: 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#FDE68A]',
        };
      case 'slayer':
        return {
          icon: <Crosshair className="w-3.5 h-3.5 text-[#60A5FA]" />,
          label: 'SLAYER',
          classes: 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#BFDBFE]',
        };
      case 'win':
        return {
          icon: <Trophy className="w-3.5 h-3.5 text-[#FACC15]" />,
          label: 'KEMENANGAN',
          classes: 'bg-[#EAB308]/20 border-[#EAB308]/50 text-[#FEF08A] font-bold',
        };
      case 'start':
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />,
          label: 'AWAL',
          classes: 'bg-[#10B981]/15 border-[#10B981]/40 text-[#A7F3D0]',
        };
    }
  };

  const getTeamBadge = (team: string) => {
    switch (team) {
      case 'demon':
        return 'bg-[#EF4444]/20 border-[#EF4444]/40 text-[#FCA5A5]';
      case 'minion':
        return 'bg-[#DC2626]/15 border-[#DC2626]/30 text-[#F87171]';
      case 'outsider':
        return 'bg-[#0284C7]/20 border-[#0284C7]/40 text-[#BAE6FD]';
      case 'townsfolk':
      default:
        return 'bg-[#2563EB]/20 border-[#2563EB]/40 text-[#BFDBFE]';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Phase Header & Sub-Nav */}
      <InGameHeader />

      {/* Main Page Title & Top Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#14141B] border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1C26] border border-white/[0.08] flex items-center justify-center text-[#D4AF37] shrink-0 shadow-inner">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[10px] font-mono font-bold text-[#FDE68A] uppercase">
                Kronologi Lengkap
              </span>
              <span className="text-xs text-[#8E8A9E] font-mono">
                {activeRoom.name}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#EDEAF0]">
              Kisah & Riwayat Permainan
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyStory}
            className="px-4 py-2.5 rounded-xl bg-[#222230] hover:bg-[#2C2C3E] border border-white/[0.08] text-xs font-semibold text-[#EDEAF0] flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#34D399]" />
                <span className="text-[#34D399] font-bold">Kisah Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#A6A2B2]" />
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
          className={`p-6 rounded-3xl border shadow-xl flex items-center gap-4 ${
            winner === 'good'
              ? 'bg-[#064E3B]/30 border-[#10B981]/40 text-[#A7F3D0]'
              : 'bg-[#7F1D1D]/30 border-[#EF4444]/40 text-[#FECACA]'
          }`}
        >
          <div
            className={`p-3.5 rounded-2xl border shrink-0 ${
              winner === 'good'
                ? 'bg-[#065F46] border-[#34D399]/40 text-[#34D399]'
                : 'bg-[#991B1B] border-[#F87171]/40 text-[#F87171]'
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
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-display text-base sm:text-lg font-bold text-[#EDEAF0]">
              Susunan Awal Peran Pemain ({roster.length} Pemain)
            </h2>
          </div>
          <span className="text-xs text-[#8E8A9E]">
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
                className="p-3.5 rounded-2xl bg-[#14141B] border border-white/[0.08] hover:border-[#D4AF37]/50 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#1C1C26] border border-white/[0.06] text-[10px] font-mono text-[#D4AF37]">
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
                  <div className="text-xs text-[#8E8A9E] font-medium">Nama Pemain:</div>
                  <div className="font-display text-base font-bold text-[#EDEAF0] truncate group-hover:text-[#D4AF37] transition-colors">
                    {player.name}
                  </div>
                </div>

                <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[#8E8A9E]">Peran Awal:</span>
                  <span className="font-bold text-[#EDEAF0] font-mono">
                    {role?.name || player.roleId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demon Bluff Cards if configured */}
        {demonBluffIds && demonBluffIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#14141B] border border-[#EF4444]/25 space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#EF4444]" />
              <span className="text-xs font-bold text-[#FCA5A5] uppercase tracking-wider font-mono">
                Peran Bluff Demon (Tidak Ada di Permainan):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {demonBluffIds.map((bid) => {
                const r = ROLE_MAP[bid];
                return (
                  <span
                    key={bid}
                    className="px-3 py-1 rounded-xl bg-[#2A1216] border border-[#EF4444]/40 text-xs font-semibold text-[#FCA5A5]"
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
            <h2 className="font-display text-base sm:text-lg font-bold text-[#EDEAF0]">
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
                  : 'bg-[#1C1C26] text-[#A6A2B2] hover:text-[#EDEAF0]'
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
                  : 'bg-[#1C1C26] text-[#A6A2B2] hover:text-[#EDEAF0]'
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
                  : 'bg-[#1C1C26] text-[#A6A2B2] hover:text-[#EDEAF0]'
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
                  : 'bg-[#1C1C26] text-[#A6A2B2] hover:text-[#EDEAF0]'
              }`}
            >
              Starpass
            </button>
          </div>
        </div>

        {/* Timeline Event Cards */}
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-[#14141B] border border-white/[0.08] p-6 space-y-2">
            <History className="w-8 h-8 mx-auto text-[#4A4756]" />
            <p className="text-xs text-[#8E8A9E]">
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
                      ? 'bg-[#21162B] border-[#A855F7]/40 shadow-lg shadow-purple-950/20'
                      : entry.category === 'death'
                      ? 'bg-[#1E1418] border-[#EF4444]/25'
                      : 'bg-[#14141B] border-white/[0.08]'
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
                      <span className="font-display text-xs sm:text-sm font-bold text-[#D4AF37]">
                        {entry.round}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#716D80] font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#EDEAF0] leading-relaxed font-sans">
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

