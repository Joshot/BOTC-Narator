'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from '@/context/GameContext';
import WebPlayMode from '@/components/WebPlayMode';

export default function WebPlayPage() {
  const router = useRouter();
  const { completeSetup } = useGameSession();

  const handleComplete = (payload: {
    playerCount: number;
    selectedRoleIds: string[];
    isDrunkActive: boolean;
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: any[];
  }) => {
    completeSetup(payload);
    router.push('/grimoire');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="py-2">
      <WebPlayMode
        onCancelToDashboard={handleCancel}
        onCompleteWebPlay={handleComplete}
      />
    </div>
  );
}

