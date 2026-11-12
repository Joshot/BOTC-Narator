'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookMarked, Search, X } from 'lucide-react';
import { CHARACTER_COUNTS, ROLES, type RoleDefinition } from '@/lib/botc-data';
import { CharacterToken } from './TokenArtwork';
import { useLockBodyScroll } from './grimoire/useLockBodyScroll';

type RefTab = 'townsfolk' | 'outsider' | 'evil' | 'rules';

export default function ReferenceSheetModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<RefTab>('townsfolk');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(ROLES[0]?.id ?? 'washerwoman');

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filteredRoles: RoleDefinition[] = q
    ? ROLES.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.indonesianName.toLowerCase().includes(q) ||
          r.ability.toLowerCase().includes(q)
      ).slice(0, 15)
    : ROLES.filter((r) => {
        if (activeTab === 'evil') return r.team === 'minion' || r.team === 'demon';
        if (activeTab === 'rules') return false;
        return r.team === activeTab;
      });

  const inspectedRole =
    filteredRoles.find((r) => r.id === selectedRoleId) ?? filteredRoles[0] ?? ROLES[0];
  const inspectedIsEvil =
    inspectedRole?.team === 'minion' || inspectedRole?.team === 'demon';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Resmi Karakter Trouble Brewing"
      className="fixed inset-0 z-50 bg-slate-900/65 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[94dvh] bg-white dark:bg-[#17141F] border border-purple-200 dark:border-[#322D42] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-purple-100 dark:border-[#292535] bg-purple-50/70 dark:bg-[#1C1826]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookMarked className="w-4 h-4 text-amber-700 dark:text-[#D4AF37] shrink-0" />
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#F5EFE6] truncate">
              Lembar Referensi Trouble Brewing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup lembar referensi"
            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-[#262134] dark:hover:bg-[#322C44] text-xs font-semibold text-purple-950 dark:text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-purple-100 dark:border-[#292535] flex flex-col sm:flex-row gap-2 bg-white dark:bg-[#15121C]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#8E8679] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari karakter atau kemampuan..."
              aria-label="Cari karakter"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-purple-50 dark:bg-[#1E1A29] border border-purple-200 dark:border-[#312C40] text-xs sm:text-sm text-slate-900 dark:text-[#F5EFE6] placeholder-slate-400 dark:placeholder-[#7C7589] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-purple-50 dark:bg-[#1E1A29] border border-purple-100 dark:border-transparent rounded-lg">
            {(
              [
                ['townsfolk', 'Town (13)'],
                ['outsider', 'Out (4)'],
                ['evil', 'Evil (5)'],
                ['rules', 'Aturan'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveTab(key);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  !q && activeTab === key
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-950 dark:text-[#B8B0A2] dark:hover:text-[#F5EFE6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Single-Screen Body (Zero Scroll) */}
        <div className="p-3 sm:p-4 overflow-hidden flex-1 flex flex-col justify-between gap-3">
          {!q && activeTab === 'rules' ? (
            <div className="space-y-3 my-auto">
              <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5EFE6]">
                Ringkasan Aturan Storyteller Trouble Brewing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 dark:text-[#D6CFC2] leading-snug">
                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A]">
                  <strong className="block text-slate-900 dark:text-[#F5EFE6] mb-1">Drunk & Poisoned</strong>
                  Pemain Drunk/Poisoned kehilangan kemampuan asli, tapi tetap dibangunkan dan boleh diberi info palsu.
                </div>
                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A]">
                  <strong className="block text-slate-900 dark:text-[#F5EFE6] mb-1">Kematian & Suara Hantu</strong>
                  Pemain mati tak boleh menominasikan, namun tetap berdiskusi dan punya 1x Ghost Vote hingga akhir game.
                </div>
                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A]">
                  <strong className="block text-slate-900 dark:text-[#F5EFE6] mb-1">Syarat Menang</strong>
                  Good menang jika Demon mati (tanpa Scarlet Woman aktif). Evil menang jika tersisa 2 hidup atau Saint dieksekusi.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-[#1C1826] border border-purple-100 dark:border-[#2C273A] text-[11px] text-slate-600 dark:text-[#B8B0A2] leading-relaxed">
                <strong>Komposisi Pemain ({Object.keys(CHARACTER_COUNTS).length} skala):</strong>{' '}
                5p (3/0/1/1) · 6p (3/1/1/1) · 7p (5/0/1/1) · 8p (5/1/1/1) · 9p (5/2/1/1) · 10p (7/0/2/1) · 11p (7/1/2/1) · 12p (7/2/2/1) · 13p (9/0/3/1) · 14p (9/1/3/1) · 15p (9/2/3/1).
              </div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-[#A8A092]">
              Tidak ada peran yang cocok dengan pencarian &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {filteredRoles.map((role) => {
                  const isSelected = inspectedRole?.id === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center gap-1 text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#D4AF37] bg-amber-50 dark:bg-[#271F17] ring-1 ring-[#D4AF37]'
                          : 'border-purple-200 dark:border-[#2C273A] bg-purple-50/50 dark:bg-[#1D1927] hover:bg-purple-100/60 dark:hover:bg-[#262134]'
                      }`}
                    >
                      <CharacterToken roleId={role.id} size="sm" showSetupLeaf />
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-[#F5EFE6] truncate w-full leading-tight">
                        {role.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {inspectedRole && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#322D42] flex items-start gap-3">
                  <div className="shrink-0">
                    <CharacterToken roleId={inspectedRole.id} size="md" showSetupLeaf />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-[#A8A092]">
                      <span className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5EFE6]">
                        {inspectedRole.name}
                      </span>
                      <span>·</span>
                      <span>{inspectedRole.indonesianName}</span>
                      <span>·</span>
                      <span
                        className={`font-bold ${
                          inspectedIsEvil
                            ? 'text-red-700 dark:text-[#FCA5A5]'
                            : 'text-blue-700 dark:text-[#93C5FD]'
                        }`}
                      >
                        {inspectedRole.team.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-[#E5DFD3] leading-snug">
                      {inspectedRole.ability}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-[#A69F91] leading-snug">
                      <strong>Panduan Storyteller:</strong> {inspectedRole.storytellerNote}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
