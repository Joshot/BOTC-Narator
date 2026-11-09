'use client';

import React from 'react';
import Link from 'next/link';
import { Swords, Wrench } from 'lucide-react';
import { useGameSession } from '@/context/GameContext';
import EvilAndBluffsView from '@/components/EvilAndBluffsView';

export default function EvilPage() {
  const {
    hasActiveGame,
    players,
    drunkFakeRoleId,
    demonBluffIds,
    setDemonBluffIds,
    setSilentCard,
  } = useGameSession();

  if (!hasActiveGame || players.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#1A251E] border border-white/[0.08] flex items-center justify-center mx-auto text-[#A83232] shadow-xl">
          <Swords className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F4EFEA]">
            Belum Ada Sesi Aktif
          </h2>
          <p className="text-sm text-[#9AA39C] leading-relaxed">
            Daftar Minion, Demon, dan peran Bluff Demon akan ditampilkan begitu permainan dimulai.
          </p>
        </div>
        <div>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#141A16] font-bold text-xs shadow-lg transition-colors"
          >
            <Wrench className="w-4 h-4" />
            <span>Mulai Setup Sekarang</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <EvilAndBluffsView
        players={players}
        drunkFakeRoleId={drunkFakeRoleId}
        demonBluffIds={demonBluffIds}
        onUpdateBluffs={setDemonBluffIds}
        onShowSilentCard={(card) => setSilentCard(card)}
      />
    </div>
  );
}

