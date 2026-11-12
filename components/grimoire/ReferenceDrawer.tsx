'use client';

import React, { useState } from 'react';
import { BookOpen, Moon, Sun, X } from 'lucide-react';
import { ALL_TB_ROLES, ROLE_MAP, ROLES, TB_TRAVELLERS } from '@/lib/botc-data';
import { ART_ASSETS, GRIMOIRE_PALETTE, TeamKey } from '@/lib/grimoire-theme';
import ParchmentSurface from './ParchmentSurface';
import { CharacterTokenFront, renderAbilitySegments } from './TokenPrimitives';

interface ReferenceDrawerProps {
  isOpen: boolean;
  inPlayRoleIds: Set<string>;
  onClose: () => void;
}

const TEAM_GROUPS: { key: TeamKey; heading: string; note: string }[] = [
  { key: 'townsfolk', heading: 'Townsfolk (Warga)', note: '13 peran resmi Trouble Brewing' },
  { key: 'outsider', heading: 'Outsiders (Orang Luar)', note: '4 peran dengan hambatan unik' },
  { key: 'minion', heading: 'Minions (Kaki Tangan)', note: '4 kaki tangan Evil' },
  { key: 'demon', heading: 'Demon (Iblis)', note: 'Imp — menyerang tiap malam*' },
  { key: 'traveller', heading: 'Travellers (Opsional)', note: '5 peran tamu resmi Trouble Brewing' },
];

/**
 * Slide-out warm vellum Script & Night Sheet reference drawer for Storyteller & players.
 */
export default function ReferenceDrawer({
  isOpen,
  inPlayRoleIds,
  onClose,
}: ReferenceDrawerProps) {
  const [tab, setTab] = useState<'script' | 'night'>('script');
  const [onlyInPlay, setOnlyInPlay] = useState(false);

  if (!isOpen) return null;

  const firstNightRoles = ALL_TB_ROLES.filter((r) => r.firstNightOrder !== null).sort(
    (a, b) => (a.firstNightOrder ?? 999) - (b.firstNightOrder ?? 999)
  );
  const otherNightRoles = ALL_TB_ROLES.filter((r) => r.otherNightOrder !== null).sort(
    (a, b) => (a.otherNightOrder ?? 999) - (b.otherNightOrder ?? 999)
  );

  const visibleFirst = onlyInPlay
    ? firstNightRoles.filter((r) => inPlayRoleIds.has(r.id))
    : firstNightRoles;
  const visibleOther = onlyInPlay
    ? otherNightRoles.filter((r) => inPlayRoleIds.has(r.id))
    : otherNightRoles;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Skrip & Urutan Malam Trouble Brewing"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <ParchmentSurface className="h-full flex flex-col rounded-none sm:rounded-l-3xl overflow-hidden">
          {/* Top Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#655342]/25 bg-[#66533f]/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={ART_ASSETS.editionTb}
                alt="Trouble Brewing"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                  Referensi Resmi · 100% Trouble Brewing
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#2a2018] truncate">
                  Skrip Karakter &amp; Urutan Malam
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panduan"
              className="w-9 h-9 rounded-xl bg-[#66533f]/10 hover:bg-[#66533f]/20 flex items-center justify-center text-[#2a2018] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b border-[#655342]/20 bg-[#66533f]/[0.04]">
            <div className="inline-flex rounded-xl p-0.5 bg-[#66533f]/15">
              <button
                type="button"
                onClick={() => setTab('script')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  tab === 'script' ? 'bg-[#2a2018] text-[#efe6d2]' : 'text-[#5c4a37]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Skrip ({ROLES.length + TB_TRAVELLERS.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('night')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  tab === 'night' ? 'bg-[#2a2018] text-[#efe6d2]' : 'text-[#5c4a37]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Urutan Malam</span>
              </button>
            </div>

            {inPlayRoleIds.size > 0 && (
              <button
                type="button"
                onClick={() => setOnlyInPlay((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  onlyInPlay
                    ? 'border-[#c9963a] bg-[#c9963a]/25 text-[#2a2018]'
                    : 'border-[#655342]/30 text-[#5c4a37]'
                }`}
              >
                {onlyInPlay ? 'Filter: Sedang Main' : 'Semua Peran'}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {tab === 'script' ? (
              TEAM_GROUPS.map((group) => {
                const rolesInTeam = ALL_TB_ROLES.filter((r) => r.team === group.key).filter(
                  (r) => !onlyInPlay || inPlayRoleIds.has(r.id)
                );
                if (rolesInTeam.length === 0) return null;

                return (
                  <section key={group.key} className="space-y-2.5">
                    <div className="flex items-baseline justify-between border-b border-[#655342]/20 pb-1">
                      <h3
                        className="font-display text-base font-bold uppercase tracking-wide"
                        style={{ color: GRIMOIRE_PALETTE.teamOnPaper[group.key] }}
                      >
                        {group.heading}
                      </h3>
                      <span className="text-[10px] font-mono text-[#5c4a37]">{group.note}</span>
                    </div>

                    <div className="space-y-2">
                      {rolesInTeam.map((role) => {
                        const active = inPlayRoleIds.has(role.id);
                        return (
                          <div
                            key={role.id}
                            className={`flex items-start gap-3 p-2.5 rounded-2xl border ${
                              active
                                ? 'border-[#c9963a] bg-[#c9963a]/15'
                                : 'border-[#655342]/20 bg-[#66533f]/[0.04]'
                            }`}
                          >
                            <CharacterTokenFront role={role} size={46} showSetupLeaf />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-sm font-bold text-[#2a2018]">
                                  {role.name}{' '}
                                  <span className="font-normal text-xs text-[#5c4a37]">
                                    ({role.indonesianName})
                                  </span>
                                </span>
                                {active && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#2a2018] text-[#efe6d2] text-[9px] font-mono uppercase tracking-wider shrink-0">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#2a2018]/90 leading-relaxed">
                                {renderAbilitySegments(role.ability)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="space-y-6">
                {/* First Night */}
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-[#655342]/25 pb-1.5">
                    <img src={ART_ASSETS.generic.dusk} alt="" className="w-6 h-6 object-contain" />
                    <h3 className="font-display text-base font-bold text-[#2a2018]">
                      Urutan Malam Pertama (First Night)
                    </h3>
                  </div>

                  {/* Standard Minion & Demon Info steps for 7+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-xl border border-[#655342]/20 bg-[#66533f]/[0.06]">
                      <img
                        src={ART_ASSETS.generic.minionInfo}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-[#760a0d]">Info Minion (7+ pemain)</div>
                        <div className="text-[11px] text-[#5c4a37]">Minion saling mengenal &amp; lihat Demon.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl border border-[#655342]/20 bg-[#66533f]/[0.06]">
                      <img
                        src={ART_ASSETS.generic.demonInfo}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-[#760a0d]">Info Demon (7+ pemain)</div>
                        <div className="text-[11px] text-[#5c4a37]">Lihat Minion + terima 3 Bluff aman.</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {visibleFirst.map((role, idx) => {
                      const active = inPlayRoleIds.has(role.id);
                      return (
                        <div
                          key={role.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                            active
                              ? 'border-[#c9963a] bg-[#c9963a]/15'
                              : 'border-[#655342]/20 bg-[#66533f]/[0.04]'
                          }`}
                        >
                          <span className="w-5 text-center font-mono text-xs font-bold text-[#5c4a37] tabular-nums">
                            {idx + 1}
                          </span>
                          <CharacterTokenFront role={role} size={34} showSetupLeaf={false} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#2a2018]">
                              {role.name}
                              {active && (
                                <span className="ml-2 text-[10px] font-mono text-[#7a5210]">
                                  · Ada di Meja
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#5c4a37] line-clamp-2">
                              {role.firstNightInstruction}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Other Nights */}
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-[#655342]/25 pb-1.5">
                    <img src={ART_ASSETS.generic.dawn} alt="" className="w-6 h-6 object-contain" />
                    <h3 className="font-display text-base font-bold text-[#2a2018]">
                      Urutan Malam Berikutnya (Other Nights)
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    {visibleOther.map((role, idx) => {
                      const active = inPlayRoleIds.has(role.id);
                      return (
                        <div
                          key={role.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                            active
                              ? 'border-[#c9963a] bg-[#c9963a]/15'
                              : 'border-[#655342]/20 bg-[#66533f]/[0.04]'
                          }`}
                        >
                          <span className="w-5 text-center font-mono text-xs font-bold text-[#5c4a37] tabular-nums">
                            {idx + 1}
                          </span>
                          <CharacterTokenFront role={role} size={34} showSetupLeaf={false} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#2a2018]">
                              {role.name}
                              {active && (
                                <span className="ml-2 text-[10px] font-mono text-[#7a5210]">
                                  · Ada di Meja
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#5c4a37] line-clamp-2">
                              {role.otherNightInstruction}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Leaf legend */}
                <div className="p-3 rounded-xl bg-[#66533f]/10 text-[11px] text-[#5c4a37] space-y-1">
                  <div className="font-bold text-[#2a2018] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-[#c9963a]" />
                    <span>Keterangan Daun pada Token Resmi:</span>
                  </div>
                  <p>
                    Daun Kiri (Hijau): Bangun Malam Pertama · Daun Kanan: Bangun Malam Berikutnya · Bunga Jingga (Bawah-Kanan): Pengubah Setup (`[+2 Outsiders]` / `[You are the Drunk]`).
                  </p>
                </div>
              </div>
            )}
          </div>
        </ParchmentSurface>
      </div>
    </div>
  );
}
