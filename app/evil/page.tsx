'use client';

import React from 'react';
import Link from 'next/link';
import { Swords, Wrench } from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import EvilAndBluffsView from '@/components/EvilAndBluffsView';
import InGameHeader from '@/components/InGameHeader';

export default function EvilPage() {
  const {
    hasActiveGame,
    players,
    drunkFakeRoleId,
    demonBluffIds,
    setDemonBluffIds,
    setSilentCard,
  } = useGameSession();

  const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';

  if (!hasActiveGame || players.length === 0) {
    return (
      <div
        className={
          isDesktop
            ? 'max-w-xl mx-auto flex-1 min-h-0 flex flex-col items-center justify-center py-6 text-center space-y-5'
            : 'max-w-xl mx-auto min-h-[70dvh] flex flex-col items-center justify-center py-8 text-center space-y-6'
        }
      >
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-red-600 dark:text-[#EF4444] shadow-md dark:shadow-xl">
          <Swords className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#EDEAF0]">
            Belum Ada Sesi Aktif
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#8E8A9E] leading-relaxed">
            Daftar Minion, Demon, dan peran Bluff Demon akan ditampilkan begitu permainan dimulai.
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
    <div className={isDesktop ? 'flex-1 min-h-0 flex flex-col gap-2' : 'py-2 space-y-6'}>
      <InGameHeader currentTab="evil" />
      <div className={isDesktop ? 'flex-1 min-h-0 overflow-y-auto pr-1' : ''}>
        <EvilAndBluffsView
          players={players}
          drunkFakeRoleId={drunkFakeRoleId}
          demonBluffIds={demonBluffIds}
          onUpdateBluffs={setDemonBluffIds}
          onShowSilentCard={(card) => setSilentCard(card)}
        />
      </div>
    </div>
  );
}

