'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from '@/context/GameContext';
import DashboardView from '@/components/DashboardView';

export default function HomePage() {
  const router = useRouter();
  const {
    hasActiveGame,
    playerCount,
    phase,
    dayNumber,
    players,
    startDemoGame,
    resetSession,
    setIsRefModalOpen,
  } = useGameSession();

  const handleStartNewSetup = () => {
    router.push('/setup');
  };

  const handleStartWebPlay = () => {
    router.push('/webplay');
  };

  const handleContinueGame = (targetTab: 'grimoire' | 'evil' | 'narrator') => {
    router.push(`/${targetTab}`);
  };

  const handleQuickStartDemo = () => {
    startDemoGame();
    router.push('/grimoire');
  };

  return (
    <DashboardView
      hasActiveGame={hasActiveGame}
      playerCount={playerCount}
      phase={phase}
      dayNumber={dayNumber}
      players={players}
      onStartNewSetup={handleStartNewSetup}
      onStartWebPlay={handleStartWebPlay}
      onContinueGame={handleContinueGame}
      onQuickStartDemo={handleQuickStartDemo}
      onOpenRulesReference={() => setIsRefModalOpen(true)}
      onResetSession={resetSession}
    />
  );
}
