'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Wrench } from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import GrimoireBoard from '@/components/GrimoireBoard';

export default function GrimoirePage() {
  const {
    hasActiveGame,
    players,
    phase,
    dayNumber,
    executedTodayPlayerId,
    demonBluffIds,
    isDrunkActive,
    handleSetDrunkPlayer,
    handleSwapSeats,
    handleMoveSeat,
    handleKillPlayer,
    handleResurrectPlayer,
    handleChangeDeathCause,
    handleToggleAlive,
    handleToggleGhostVote,
    handleAddReminder,
    handleRemoveReminder,
    handleExecutePlayerInDay,
    handleChangePlayerTrueRole,
    setSilentCard,
    startDemoGame,
  } = useGameSession();

  if (!hasActiveGame || players.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#1A251E] border border-white/[0.08] flex items-center justify-center mx-auto text-[#D4AF37] shadow-xl">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F4EFEA]">
            Belum Ada Sesi Grimoire Aktif
          </h2>
          <p className="text-sm text-[#9AA39C] leading-relaxed">
            Untuk membuka meja Grimoire, silakan buat konfigurasi permainan baru melalui Wizard Setup atau mulai simulasi instan.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/setup"
            className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#141A16] font-bold text-xs flex items-center gap-2 shadow-lg transition-colors"
          >
            <Wrench className="w-4 h-4" />
            <span>Mulai Setup Baru</span>
          </Link>
          <button
            type="button"
            onClick={startDemoGame}
            className="px-6 py-3 rounded-full bg-[#1A251E] hover:bg-[#243228] border border-white/[0.1] text-[#F4EFEA] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#6EE7B7]" />
            <span>Mulai Demo 8 Pemain</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <GrimoireBoard
        players={players}
        phase={phase}
        dayNumber={dayNumber}
        executedTodayPlayerId={executedTodayPlayerId}
        demonBluffIds={demonBluffIds}
        isDrunkActive={isDrunkActive}
        onSetDrunkPlayer={handleSetDrunkPlayer}
        onSwapSeats={handleSwapSeats}
        onMoveSeat={handleMoveSeat}
        onKillPlayer={handleKillPlayer}
        onResurrectPlayer={handleResurrectPlayer}
        onChangeDeathCause={handleChangeDeathCause}
        onToggleAlive={handleToggleAlive}
        onToggleGhostVote={handleToggleGhostVote}
        onAddReminder={handleAddReminder}
        onRemoveReminder={handleRemoveReminder}
        onMarkExecutedToday={handleExecutePlayerInDay}
        onChangePlayerTrueRole={handleChangePlayerTrueRole}
        onShowSilentCard={(card) => setSilentCard(card)}
      />
    </div>
  );
}

