'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Wand2 } from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import InGameHeader from '@/components/InGameHeader';
import GrimoireBoard from '@/components/GrimoireBoard';
import VelvetBackdrop from '@/components/grimoire/VelvetBackdrop';

export default function GrimoirePage() {
  const router = useRouter();
  const {
    mounted,
    hasActiveGame,
    players,
    phase,
    dayNumber,
    executedTodayPlayerId,
    demonBluffIds,
    isDrunkActive,
    winner,
    velvetColour,
    nominationsToday,
    dayTimer,
    phaseStartedAt,
    canUndo,
    canRedo,
    startDemoGame,
    handleUpdateTimer,
    undoLastAction,
    redoLastAction,
    setVelvetColour,
    setDemonBluffIds,
    handleSetDrunkPlayer,
    handleSwapSeats,
    handleMoveSeat,
    handleRotateRing,
    handleAddSeat,
    handleRemoveSeat,
    handleRenamePlayer,
    handleSetPlayerAlignment,
    handleKillPlayer,
    handleResurrectPlayer,
    handleChangeDeathCause,
    handleToggleAlive,
    handleToggleGhostVote,
    handleAddReminder,
    handleAddCustomNoteReminder,
    handleEditCustomNoteReminder,
    handleMoveReminder,
    handleRemoveReminder,
    handleExecutePlayerInDay,
    handleChangePlayerTrueRole,
    handleTransitionNightToDay,
    handleTransitionDayToNextNight,
    handleEndGameManual,
    handleNominatePlayer,
    handleToggleVoteForNomination,
    handleResetNominationVotes,
    handleMarkNomination,
    handleCancelNomination,
    setSilentCard,
  } = useGameSession();

  if (!mounted) return null;

  if (!hasActiveGame || players.length === 0) {
    return (
      <div className="py-4">
        <VelvetBackdrop
          colour={velvetColour}
          center
          className="rounded-3xl min-h-[72dvh] p-6 sm:p-8 shadow-2xl border border-[#c9963a]/30"
        >
          <div className="max-w-md mx-auto space-y-6">
            <img
              src="/art/editions/tb.webp"
              alt="Trouble Brewing"
              className="w-16 h-16 mx-auto object-contain drop-shadow"
            />
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold text-[#efe6d2]">
                Meja Grimoire Belum Siap
              </h1>
              <p className="text-sm text-[#a89f8c] leading-relaxed">
                Susun kantong peran terlebih dahulu lewat Mode Ambil Kantong Velvet atau Setup Biasa.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/webplay')}
                className="px-5 py-2.5 rounded-full bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ambil dari Kantong Velvet</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/setup')}
                className="px-5 py-2.5 rounded-full bg-black/50 hover:bg-black/70 border border-[#c9963a]/40 text-[#efe6d2] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-[#c9963a]" />
                <span>Mode Setup Biasa</span>
              </button>
              <button
                type="button"
                onClick={startDemoGame}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#efe6d2] font-bold text-xs cursor-pointer"
              >
                Mulai Demo 8 Pemain
              </button>
            </div>
          </div>
        </VelvetBackdrop>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-1">
      <InGameHeader currentTab="grimoire" />
      <GrimoireBoard
        players={players}
        phase={phase}
        dayNumber={dayNumber}
        executedTodayPlayerId={executedTodayPlayerId}
        demonBluffIds={demonBluffIds}
        isDrunkActive={isDrunkActive}
        winner={winner}
        velvetColour={velvetColour}
        nominationsToday={nominationsToday}
        dayTimer={dayTimer}
        phaseStartedAt={phaseStartedAt}
        onTimerAction={handleUpdateTimer}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undoLastAction}
        onRedo={redoLastAction}
        onVelvetColourChange={setVelvetColour}
        onUpdateBluffs={setDemonBluffIds}
        onSetDrunkPlayer={handleSetDrunkPlayer}
        onSwapSeats={handleSwapSeats}
        onMoveSeat={handleMoveSeat}
        onRotateRing={handleRotateRing}
        onAddSeat={handleAddSeat}
        onRemoveSeat={handleRemoveSeat}
        onRenamePlayer={handleRenamePlayer}
        onSetPlayerAlignment={handleSetPlayerAlignment}
        onKillPlayer={handleKillPlayer}
        onResurrectPlayer={handleResurrectPlayer}
        onChangeDeathCause={handleChangeDeathCause}
        onToggleAlive={handleToggleAlive}
        onToggleGhostVote={handleToggleGhostVote}
        onAddReminder={handleAddReminder}
        onAddCustomNoteReminder={handleAddCustomNoteReminder}
        onEditCustomNoteReminder={handleEditCustomNoteReminder}
        onMoveReminder={handleMoveReminder}
        onRemoveReminder={handleRemoveReminder}
        onMarkExecutedToday={handleExecutePlayerInDay}
        onChangePlayerTrueRole={handleChangePlayerTrueRole}
        onAdvancePhase={() => {
          if (phase === 'day') handleTransitionDayToNextNight();
          else handleTransitionNightToDay();
        }}
        onSetWinnerManual={handleEndGameManual}
        onStartNomination={handleNominatePlayer}
        onToggleNominationVote={handleToggleVoteForNomination}
        onResetNominationVotes={handleResetNominationVotes}
        onMarkNominationExecution={handleMarkNomination}
        onCancelNomination={handleCancelNomination}
        onShowSilentCard={(card) => setSilentCard(card)}
      />
    </div>
  );
}
