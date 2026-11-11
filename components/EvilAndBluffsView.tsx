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

  const isUnder7 = players.length < 7;

  return (
    <div className="space-y-6">
      {/* Evil Team Coordination Panel */}
      <div className="bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100 dark:border-white/[0.08]">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0] flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-600 dark:text-[#EF4444]" />
              <span>Panel Tim Evil (Demon & Minion)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8E8A9E]">
              {isUnder7
                ? 'Permainan di bawah 7 pemain (Teensyville): Minion & Demon tidak saling mengenal.'
                : 'Malam Pertama: Minion dan Demon saling mengenali rekan satu tim secara rahasia.'}
            </p>
          </div>

          {demon && !isUnder7 && (
            <button
              type="button"
              onClick={() =>
                onShowSilentCard({
                  heading: 'INI ADALAH DEMON ANDA',
                  subheading: `Duduk di Kursi ${demon.seatIndex + 1}`,
                  roleIds: [demon.trueRoleId],
                  footerNote:
                    'Tunjukkan layar ini kepada para Minion saat mereka bangun, sambil menunjuk ke arah tempat duduk Demon.',
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shrink-0 transition-colors shadow-md"
            >
              <Eye className="w-4 h-4" />
              <span>Kartu Tunjuk Demon ke Minion</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demon Box */}
          <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-[#1C1318] border border-red-200 dark:border-[#DC2626]/30 space-y-3">
            <div className="text-xs text-red-800 dark:text-[#FCA5A5] font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <Swords className="w-4 h-4 text-red-600 dark:text-[#F87171]" />
              <span>Demon Utama</span>
            </div>
            {demon ? (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#120E15] border border-red-200 dark:border-[#3E1A22] shadow-sm">
                <div className="shrink-0 mt-0.5">
                  <CharacterToken
                    roleId={demon.trueRoleId}
                    size="sm"
                    isDead={!demon.isAlive}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#8E8A9E]">
                    <span className="font-mono tabular-nums text-amber-800 dark:text-[#D4AF37] font-bold">
                      Kursi {demon.seatIndex + 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={demon.isAlive ? 'text-emerald-700 dark:text-[#34D399] font-bold' : 'text-red-700 dark:text-[#F87171] font-bold'}>
                      {demon.isAlive ? 'Hidup' : 'Mati'}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-[#EDEAF0] break-words">
                    <span className="text-slate-900 dark:text-white font-extrabold">{demon.name}</span> —{' '}
                    <span className="text-red-700 dark:text-[#FDE68A] font-extrabold">
                      {ROLE_MAP[demon.trueRoleId]?.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#8E8A9E] leading-relaxed pt-0.5">
                    {ROLE_MAP[demon.trueRoleId]?.ability}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-700 dark:text-[#FCA5A5]">Demon belum ditentukan.</p>
            )}
          </div>

          {/* Minions Box */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-[#181522] border border-purple-200 dark:border-white/[0.08] space-y-3">
            <div className="text-xs text-purple-900 dark:text-[#C4B5FD] font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Rekan Minion ({minions.length} Orang)</span>
            </div>
            <div className="space-y-3">
              {minions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-[#8E8A9E]">Tidak ada Minion dalam sesi ini.</p>
              ) : (
                minions.map((m) => {
                  const role = ROLE_MAP[m.trueRoleId];
                  return (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#120E15] border border-purple-200 dark:border-white/[0.06] shadow-sm"
                    >
                      <div className="shrink-0 mt-0.5">
                        <CharacterToken
                          roleId={m.trueRoleId}
                          size="sm"
                          isDead={!m.isAlive}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#8E8A9E]">
                          <span className="font-mono tabular-nums text-amber-800 dark:text-[#D4AF37] font-bold">
                            Kursi {m.seatIndex + 1}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={m.isAlive ? 'text-emerald-700 dark:text-[#34D399] font-bold' : 'text-red-700 dark:text-[#F87171] font-bold'}>
                            {m.isAlive ? 'Hidup' : 'Mati'}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-[#EDEAF0] break-words">
                          <span className="text-slate-900 dark:text-white font-extrabold">{m.name}</span> —{' '}
                          <span className="text-purple-800 dark:text-[#FDE68A] font-extrabold">{role?.name}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#8E8A9E] leading-relaxed pt-0.5">
                          {role?.ability}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Secret Drunk Summary Note for Storyteller */}
        {drunkPlayer && drunkFakeRoleId && (
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-[#131D2A] border border-sky-300 dark:border-[#38BDF8]/40 text-xs sm:text-sm text-sky-950 dark:text-[#BAE6FD]">
            Catatan Keamanan Bluff: <strong>{drunkPlayer.name}</strong> (Kursi{' '}
            {drunkPlayer.seatIndex + 1}) adalah <strong>Drunk</strong> yang mengira dirinya{' '}
            <strong>{ROLE_MAP[drunkFakeRoleId]?.name}</strong>. Sistem telah mengecualikan peran ini dari 3 Bluff Demon di bawah.
          </div>
        )}
      </div>

      {/* 3 Safe Demon Bluffs Panel */}
      <div className="bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100 dark:border-white/[0.08]">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
              Rekomendasi 3 Bluff Aman untuk Demon
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8E8A9E]">
              Ketiga karakter Townsfolk ini dipastikan <strong>tidak sedang dimainkan</strong> oleh pemain mana pun.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRerollBluffs}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 dark:bg-[#1E1E28] dark:hover:bg-[#282838] dark:border-white/[0.1] text-xs font-bold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Shuffle className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
              <span>Acak 3 Bluff Lain</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onShowSilentCard({
                  heading: '3 KARAKTER INI TIDAK DIMAINKAN',
                  subheading: isUnder7
                    ? 'Opsi Bluff Aman untuk Demon (Under 7: Info Minion Disembunyikan)'
                    : minions.length > 0
                    ? `Rekan Minion: Kursi ${minions.map((m) => m.seatIndex + 1).join(', ')}`
                    : 'Gunakan peran ini sebagai gertakan (Bluff) aman Anda',
                  roleIds: demonBluffIds,
                  footerNote:
                    'Tidak ada warga baik yang memegang 3 token ini. Anda dapat mengklaim peran ini dengan aman.',
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#121016] text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer transition-colors shadow-md border border-[#F59E0B]"
            >
              <Eye className="w-4 h-4 text-[#121016]" />
              <span>Tunjukkan 3 Bluff ke Demon (Layar Penuh)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demonBluffIds.map((roleId, idx) => {
            const role = ROLE_MAP[roleId];
            if (!role) return null;
            return (
              <div
                key={roleId}
                className="p-4 rounded-2xl bg-purple-50/70 dark:bg-[#1A1A24] border border-purple-200 dark:border-white/[0.08] flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <CharacterToken roleId={roleId} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-[#D4AF37] uppercase tracking-wider block">
                      Bluff #{idx + 1}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-[#EDEAF0]">{role.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-[#8E8A9E] leading-relaxed line-clamp-3">
                      {role.ability}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-100 dark:border-white/[0.06]">
                  <select
                    value={roleId}
                    onChange={(e) => {
                      const next = [...demonBluffIds];
                      next[idx] = e.target.value;
                      onUpdateBluffs(next);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#14141B] border border-purple-300 dark:border-white/[0.1] text-xs text-slate-900 dark:text-[#EDEAF0] font-semibold cursor-pointer focus:outline-none"
                  >
                    <option value={roleId}>{role.name} (Aktif)</option>
                    {allAvailableSafeGoodRoles
                      .filter((r) => !demonBluffIds.includes(r.id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          Ganti ke: {r.name}
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
