'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameSession } from '@/context/GameContext';
import WebPlayMode from '@/components/WebPlayMode';
import InGameHeader from '@/components/InGameHeader';

export default function WebPlayPage() {
  const router = useRouter();
  const { completeSetup, hasActiveGame } = useGameSession();

  const handleCompleteWebPlay = (payload: any) => {
    completeSetup(payload);
    router.push('/grimoire');
  };

  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';

  return (
    <div className={isDesktop ? 'flex-1 min-h-0 flex flex-col gap-2' : 'space-y-4 py-2'}>
      {hasActiveGame && <InGameHeader />}
      <WebPlayMode
        onCancelToDashboard={() => router.push('/')}
        onCompleteWebPlay={handleCompleteWebPlay}
      />
    </div>
  );
}
