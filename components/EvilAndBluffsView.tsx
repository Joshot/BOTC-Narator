'use client';

import React from 'react';
import { Eye, Shuffle, Swords, Users } from 'lucide-react';
import { ROLE_MAP } from '@/lib/botc-data';
import { PlayerSeat, computeSafeDemonBluffs } from '@/lib/botc-engine';
import { CharacterToken } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';

interface EvilAndBluffsViewProps {
  players: PlayerSeat[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
  onUpdateBluffs: (newBluffs: string[]) => void;
  onShowSilentCard: (card: SilentCardPayload) => void;
}

export default function EvilAndBluffsView({
  players,
  drunkFakeRoleId,
  demonBluffIds,
  onUpdateBluffs,
  onShowSilentCard,
}: EvilAndBluffsViewProps) {
  const demon = players.find((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon') ?? null;
  const minions = players.filter((p) => ROLE_MAP[p.trueRoleId]?.team === 'minion');
  const drunkPlayer = players.find((p) => p.trueRoleId === 'drunk') ?? null;

  const inPlayRoleIds = players.map((p) => p.trueRoleId);
  const { allAvailableSafeGoodRoles } = computeSafeDemonBluffs(
    inPlayRoleIds,
    drunkFakeRoleId
  );

  const handleRerollBluffs = () => {
    const { recommendedBluffs } = computeSafeDemonBluffs(
      inPlayRoleIds,
      drunkFakeRoleId
    );
    onUpdateBluffs(recommendedBluffs);
  };

  const handleReplaceSingleBluff = (slotIdx: number, newRoleId: string) => {
    const next = [...demonBluffIds];
    const existingIdx = next.indexOf(newRoleId);
    if (existingIdx !== -1 && existingIdx !== slotIdx) {
      next[existingIdx] = next[slotIdx];
    }
    next[slotIdx] = newRoleId;
    onUpdateBluffs(next);
  };

  return (
    <div className="space-y-6">
      {/* Evil Team Coordination Panel */}
      <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#292535]">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-[#F5EFE6] flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#EF4444]" />
              <span>Panel Rahasia Tim Evil (Demon & Minion)</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#B8B0A2]">
              Gunakan panel ini pada Malam Pertama agar Minion dan Demon saling mengenali rekan satu tim mereka tanpa suara.
            </p>
          </div>

          {demon && (
            <button
              type="button"
              onClick={() =>
                onShowSilentCard({
                  heading: 'INI ADALAH DEMON ANDA',
                  subheading: `${demon.name} · Duduk di Kursi ${demon.seatIndex + 1}`,
                  roleIds: [demon.trueRoleId],
                  footerNote:
                    'Tunjukkan layar ini kepada para Minion saat mereka bangun, sambil menunjuk ke arah tempat duduk Demon.',
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shrink-0 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Kartu Tunjuk untuk Minion</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demon Box */}
          <div className="p-4 rounded-xl bg-[#221418] border border-[#DC2626]/40 flex items-start gap-4">
            {demon ? (
              <>
                <CharacterToken
                  roleId={demon.trueRoleId}
                  size="md"
                  isDead={!demon.isAlive}
                />
                <div className="space-y-1 min-w-0">
                  <div className="text-xs text-[#FCA5A5] font-medium">
                    DEMON UTAMA · KURSI {demon.seatIndex + 1}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#F5EFE6]">
                    {demon.name}
                  </h3>
                  <p className="text-xs text-[#E5DFD3]">
                    {ROLE_MAP[demon.trueRoleId]?.name} —{' '}
                    {demon.isAlive ? 'Masih Hidup' : 'Sudah Mati'}
                  </p>
                  <p className="text-xs text-[#C8C0B3] leading-relaxed pt-1">
                    {ROLE_MAP[demon.trueRoleId]?.ability}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#FCA5A5]">Demon belum ditentukan.</p>
            )}
          </div>

          {/* Minions Box */}
          <div className="p-4 rounded-xl bg-[#1D1622] border border-[#EF4444]/30 space-y-3">
            <div className="text-xs text-[#FCA5A5] font-medium flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>REKAN MINION ({minions.length} ORANG)</span>
            </div>
            <div className="space-y-3">
              {minions.map((m) => {
                const role = ROLE_MAP[m.trueRoleId];
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-[#141019] border border-[#2C2436]"
                  >
                    <CharacterToken
                      roleId={m.trueRoleId}
                      size="sm"
                      isDead={!m.isAlive}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#A8A092]">
                        <span className="font-mono tabular-nums">
                          Kursi {m.seatIndex + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{m.isAlive ? 'Hidup' : 'Mati'}</span>
                      </div>
                      <div className="font-semibold text-sm text-[#F5EFE6] truncate">
                        {m.name} — {role?.name} ({role?.indonesianName})
                      </div>
                      <p className="text-xs text-[#B8B0A2] truncate">{role?.ability}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Secret Drunk Summary Note for Storyteller */}
        {drunkPlayer && drunkFakeRoleId && (
          <div className="p-3.5 rounded-xl bg-[#152130] border border-[#38BDF8]/40 text-xs sm:text-sm text-[#BAE6FD]">
            Catatan Keamanan Bluff: <strong>{drunkPlayer.name}</strong> (Kursi{' '}
            {drunkPlayer.seatIndex + 1}) adalah <strong>Drunk</strong> yang mengira dirinya{' '}
            <strong>{ROLE_MAP[drunkFakeRoleId]?.name}</strong>. Sistem telah mengecualikan{' '}
            <strong>{ROLE_MAP[drunkFakeRoleId]?.name}</strong> dari daftar 3 Bluff Demon di bawah agar Demon tidak bertabrakan klaim dengan Drunk.
          </div>
        )}
      </div>

      {/* 3 Safe Demon Bluffs Panel */}
      <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#292535]">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-[#F5EFE6]">
              Rekomendasi 3 Bluff Aman untuk Demon
            </h2>
            <p className="text-xs sm:text-sm text-[#B8B0A2]">
              Ketiga karakter Townsfolk ini dipastikan <strong>tidak sedang dimainkan</strong> oleh pemain mana pun di meja saat ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRerollBluffs}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#231F30] hover:bg-[#302B42] border border-[#3A344E] text-xs font-semibold text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-[#D4AF37]" />
              <span>Acak 3 Bluff Lain</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onShowSilentCard({
                  heading: '3 KARAKTER INI TIDAK DIMAINKAN',
                  subheading:
                    demon && minions.length > 0
                      ? `Rekan Minion Anda: ${minions
                          .map((m) => `${m.name} (Kursi ${m.seatIndex + 1})`)
                          .join(', ')}`
                      : 'Gunakan salah satu peran ini sebagai gertakan (Bluff) aman Anda',
                  roleIds: demonBluffIds,
                  footerNote:
                    'Tidak ada warga baik yang memegang 3 token ini. Anda juga boleh membagikan info bluff ini kepada Minion di siang hari.',
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Tunjukkan 3 Bluff ke Demon (Layar Penuh)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demonBluffIds.map((bluffId, idx) => {
            const role = ROLE_MAP[bluffId];
            if (!role) return null;

            return (
              <div
                key={`${bluffId}-${idx}`}
                className="p-5 rounded-2xl bg-[#13111A] border border-[#2C283B] flex flex-col items-center text-center justify-between gap-4"
              >
                <div className="space-y-3 flex flex-col items-center">
                  <span className="text-xs font-mono text-[#D4AF37]">
                    OPSI BLUFF 0{idx + 1}
                  </span>
                  <CharacterToken roleId={role.id} size="lg" showIndonesianSubtitle />
                  <p className="text-xs sm:text-sm text-[#DED7CA] leading-relaxed">
                    {role.ability}
                  </p>
                </div>

                <div className="w-full pt-3 border-t border-[#262234]">
                  <label
                    htmlFor={`bluff-select-${idx}`}
                    className="block text-[11px] text-[#9C9486] mb-1.5"
                  >
                    Ganti Opsi Bluff 0{idx + 1}:
                  </label>
                  <select
                    id={`bluff-select-${idx}`}
                    value={bluffId}
                    onChange={(e) => handleReplaceSingleBluff(idx, e.target.value)}
                    className="w-full min-h-[40px] rounded-lg bg-[#1D1928] border border-[#342E45] px-2.5 py-1.5 text-xs font-semibold text-[#EDE7DB]"
                  >
                    {allAvailableSafeGoodRoles.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.indonesianName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
