'use client';

import React, { useState } from 'react';
import { BookOpen, Moon, Sun, X } from 'lucide-react';
import { ALL_TB_ROLES, ROLE_MAP } from '@/lib/botc-data';
import { ART_ASSETS, GRIMOIRE_PALETTE, TeamKey } from '@/lib/grimoire-theme';
import ParchmentSurface from './ParchmentSurface';
import { CharacterTokenFront, renderAbilitySegments } from './TokenPrimitives';
import { useLockBodyScroll } from './useLockBodyScroll';

interface ReferenceDrawerProps {
  isOpen: boolean;
  inPlayRoleIds: Set<string>;
  onClose: () => void;
}

type DrawerTab = 'townsfolk' | 'outsider_evil' | 'traveller' | 'first_night' | 'other_nights';

const DRAWER_TABS: { id: DrawerTab; label: string }[] = [
  { id: 'townsfolk', label: 'Townsfolk' },
  { id: 'outsider_evil', label: 'Out & Evil' },
  { id: 'traveller', label: 'Traveller' },
  { id: 'first_night', label: 'Malam 1' },
  { id: 'other_nights', label: 'Malam 2+' },
];

/**
 * Centered single-screen Parchment Script & Night Sheet modal with zero internal scrolling.
 */
export default function ReferenceDrawer({
  isOpen,
  inPlayRoleIds,
  onClose,
}: ReferenceDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('townsfolk');
  const [onlyInPlay, setOnlyInPlay] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('washerwoman');

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const isScriptTab = tab === 'townsfolk' || tab === 'outsider_evil' || tab === 'traveller';

  const rolesForScriptTab = ALL_TB_ROLES.filter((r) => {
    if (tab === 'townsfolk') return r.team === 'townsfolk';
    if (tab === 'outsider_evil') {
      return r.team === 'outsider' || r.team === 'minion' || r.team === 'demon';
    }
    return r.team === 'traveller';
  }).filter((r) => !onlyInPlay || inPlayRoleIds.has(r.id));

  const firstNightRoles = ALL_TB_ROLES.filter((r) => r.firstNightOrder !== null)
    .sort((a, b) => (a.firstNightOrder ?? 999) - (b.firstNightOrder ?? 999))
    .filter((r) => !onlyInPlay || inPlayRoleIds.has(r.id));

  const otherNightRoles = ALL_TB_ROLES.filter((r) => r.otherNightOrder !== null)
    .sort((a, b) => (a.otherNightOrder ?? 999) - (b.otherNightOrder ?? 999))
    .filter((r) => !onlyInPlay || inPlayRoleIds.has(r.id));

  const activeList = isScriptTab
    ? rolesForScriptTab
    : tab === 'first_night'
    ? firstNightRoles
    : otherNightRoles;

  const inspectedRole =
    activeList.find((r) => r.id === selectedRoleId) ?? activeList[0] ?? ROLE_MAP.washerwoman;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Skrip & Urutan Malam Trouble Brewing"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[94dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ParchmentSurface className="flex flex-col rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#655342]/25 bg-[#66533f]/[0.06]">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={ART_ASSETS.editionTb}
                alt="Trouble Brewing"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                  Referensi Resmi Trouble Brewing
                </div>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#2a2018] truncate">
                  Skrip Karakter &amp; Urutan Malam
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {inPlayRoleIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyInPlay((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                    onlyInPlay
                      ? 'border-[#c9963a] bg-[#c9963a]/25 text-[#2a2018]'
                      : 'border-[#655342]/30 text-[#5c4a37]'
                  }`}
                >
                  {onlyInPlay ? 'Aktif Saja' : 'Semua'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panduan"
                className="w-8 h-8 rounded-xl bg-[#66533f]/10 hover:bg-[#66533f]/20 flex items-center justify-center text-[#2a2018] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="px-4 sm:px-5 pt-2.5 pb-2 border-b border-[#655342]/15 bg-[#66533f]/[0.03] grid grid-cols-5 gap-1">
            {DRAWER_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`py-1.5 px-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors truncate ${
                  tab === t.id ? 'bg-[#2a2018] text-[#efe6d2] shadow' : 'text-[#5c4a37] hover:bg-[#66533f]/10'
                }`}
              >
                {t.id === 'first_night' || t.id === 'other_nights' ? (
                  <Moon className="w-3 h-3 shrink-0" />
                ) : (
                  <BookOpen className="w-3 h-3 shrink-0 hidden sm:inline" />
                )}
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Zero-Scroll Body */}
          <div className="p-3 sm:p-4 space-y-3 overflow-hidden">
            {tab === 'first_night' && (
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-2 p-2 rounded-xl border border-[#655342]/20 bg-[#66533f]/[0.06]">
                  <img src={ART_ASSETS.generic.minionInfo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-[#760a0d]">Info Minion (7+)</div>
                    <div className="text-[#5c4a37]">Kenal sesama Minion & Demon.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-[#655342]/20 bg-[#66533f]/[0.06]">
                  <img src={ART_ASSETS.generic.demonInfo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-[#760a0d]">Info Demon (7+)</div>
                    <div className="text-[#5c4a37]">Lihat Minion &amp; 3 Bluff aman.</div>
                  </div>
                </div>
              </div>
            )}

            {activeList.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#5c4a37] italic">
                Tidak ada peran aktif pada kategori ini di permainan saat ini.
              </p>
            ) : (
              <div
                className={`grid gap-1.5 ${
                  isScriptTab ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4'
                }`}
              >
                {activeList.map((role, idx) => {
                  const isInPlay = inPlayRoleIds.has(role.id);
                  const isSelected = inspectedRole?.id === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#c9963a] bg-[#c9963a]/25 ring-1 ring-[#c9963a]'
                          : isInPlay
                          ? 'border-[#c9963a]/60 bg-[#c9963a]/10 hover:bg-[#c9963a]/20'
                          : 'border-[#655342]/20 bg-[#66533f]/[0.04] hover:bg-[#66533f]/[0.12]'
                      }`}
                    >
                      {!isScriptTab && (
                        <span className="font-mono text-[10px] font-bold text-[#5c4a37] shrink-0">
                          {idx + 1}.
                        </span>
                      )}
                      <CharacterTokenFront role={role} size={28} showSetupLeaf={isScriptTab} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-[11px] font-bold text-[#2a2018] truncate">
                          {role.name}
                        </div>
                        {isInPlay && (
                          <div className="text-[9px] font-mono text-[#7a5210] font-bold truncate">
                            Aktif
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pinned Detail Bar for Selected Role */}
            {inspectedRole && (
              <div className="p-3 rounded-2xl border border-[#655342]/25 bg-[#66533f]/[0.08] flex items-start gap-3">
                <CharacterTokenFront role={inspectedRole} size={48} showSetupLeaf />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-display text-sm sm:text-base font-bold"
                      style={{ color: GRIMOIRE_PALETTE.teamOnPaper[inspectedRole.team as TeamKey] }}
                    >
                      {inspectedRole.name}{' '}
                      <span className="text-xs font-normal text-[#5c4a37]">
                        ({inspectedRole.indonesianName})
                      </span>
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#5c4a37]">
                      {inspectedRole.team}
                    </span>
                  </div>
                  <p className="text-xs text-[#2a2018] leading-snug">
                    {tab === 'first_night'
                      ? inspectedRole.firstNightInstruction || renderAbilitySegments(inspectedRole.ability)
                      : tab === 'other_nights'
                      ? inspectedRole.otherNightInstruction || renderAbilitySegments(inspectedRole.ability)
                      : renderAbilitySegments(inspectedRole.ability)}
                  </p>
                </div>
              </div>
            )}

            {/* Leaf legend */}
            <div className="px-3 py-2 rounded-xl bg-[#66533f]/10 text-[10px] text-[#5c4a37] flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
              <span>
                Daun Kiri: Malam 1 · Daun Kanan: Malam 2+ · Bunga Jingga: Pengubah Setup. Klik peran untuk melihat instruksi lengkap.
              </span>
            </div>
          </div>
        </ParchmentSurface>
      </div>
    </div>
  );
}
