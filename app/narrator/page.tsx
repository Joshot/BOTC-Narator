'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Wrench } from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import NarratorView from '@/components/NarratorView';
import InGameHeader from '@/components/InGameHeader';

export default function NarratorPage() {
  const {
    hasActiveGame,
    phase,
    dayNumber,
    players,
    executedTodayPlayerId,
    demonBluffIds,
    lastNightDeaths,
    gameAlertBanner,
    dayTimer,
    phaseStartedAt,
    setPhase,
    handleUpdateTimer,
    handleSetSingleReminderTarget,
    handleResolveImpAttack,
    handleTransitionNightToDay,
    handleTransitionDayToNextNight,
    handleExecutePlayerInDay,
    handleTriggerSlayerShot,
    handleTriggerVirginNomination,
    setSilentCard,
  } = useGameSession();

  if (!hasActiveGame || players.length === 0) {
    return (
      <div className="max-w-xl mx-auto min-h-[70dvh] flex flex-col items-center justify-center py-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-blue-600 dark:text-[#60A5FA] shadow-md dark:shadow-xl">
          <Moon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#EDEAF0]">
            Belum Ada Sesi Aktif
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#8E8A9E] leading-relaxed">
            Urutan bangun malam narator dan skrip instruksi resmi membutuhkan sesi permainan yang sudah disetup.
          </p>
        </div>
        <div>
          <Link
            href="/setup"
            className="brass-sheen-btn inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] font-bold text-xs shadow-lg transition-colors"
          >
            <Wrench className="w-4 h-4" />
            <span>Mulai Setup Sekarang</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      <InGameHeader currentTab="narrator" />
      <NarratorView
        phase={phase}
        dayNumber={dayNumber}
        players={players}
        executedTodayPlayerId={executedTodayPlayerId}
        demonBluffIds={demonBluffIds}
        lastNightDeaths={lastNightDeaths}
        gameAlertBanner={gameAlertBanner}
        dayTimer={dayTimer}
        phaseStartedAt={phaseStartedAt}
        onTimerAction={handleUpdateTimer}
        onChangePhase={setPhase}
        onSetSingleReminderTarget={handleSetSingleReminderTarget}
        onResolveImpAttack={handleResolveImpAttack}
        onTransitionNightToDay={handleTransitionNightToDay}
        onTransitionDayToNextNight={handleTransitionDayToNextNight}
        onExecutePlayerInDay={handleExecutePlayerInDay}
        onTriggerSlayerShot={handleTriggerSlayerShot}
        onTriggerVirginNomination={handleTriggerVirginNomination}
        onShowSilentCard={(card) => setSilentCard(card)}
      />
    </div>
  );
}

