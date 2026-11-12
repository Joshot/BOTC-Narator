'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from '@/context/GameContext';
import SetupWizard from '@/components/SetupWizard';

export default function SetupPage() {
  const router = useRouter();
  const {
    playerCount,
    completeSetup,
    setSilentCard,
    startDemoGame,
  } = useGameSession();

  const handleCompleteSetup = (payload: {
    playerCount: number;
    isDrunkActive: boolean;
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: any[];
  }) => {
    completeSetup(payload);
    router.push('/grimoire');
  };

  const handleQuickDemo = () => {
    startDemoGame();
    router.push('/grimoire');
  };

  const handleCancel = () => {
    router.push('/');
  };

  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';

  return (
    <div className={isDesktop ? 'flex-1 min-h-0 flex flex-col' : 'py-2'}>
      <SetupWizard
        initialPlayerCount={playerCount || 8}
        onCompleteSetup={handleCompleteSetup}
        onQuickStartDemo={handleQuickDemo}
        onCancelToDashboard={handleCancel}
        onShowSilentCard={(card) => setSilentCard(card)}
      />
    </div>
  );
}
