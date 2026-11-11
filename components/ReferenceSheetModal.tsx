'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookMarked, Search, X } from 'lucide-react';
import { CHARACTER_COUNTS, ROLES, TeamType } from '@/lib/botc-data';

export default function ReferenceSheetModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<'all' | TeamType>('all');

  if (!isOpen) return null;

  const filteredRoles = ROLES.filter((r) => {
    const matchesTeam = teamFilter === 'all' || r.team === teamFilter;
    const q = query.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.indonesianName.toLowerCase().includes(q) ||
      r.ability.toLowerCase().includes(q);
    return matchesTeam && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Resmi Karakter Trouble Brewing"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#17141F] border-t sm:border border-purple-200 dark:border-[#322D42] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-purple-100 dark:border-[#292535] bg-purple-50/70 dark:bg-[#1C1826]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookMarked className="w-5 h-5 text-amber-700 dark:text-[#D4AF37] shrink-0" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-[#F5EFE6] truncate">
              Lembar Referensi Trouble Brewing (Indonesia)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup lembar referensi"
            className="min-h-[42px] min-w-[42px] px-3 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-[#262134] dark:hover:bg-[#322C44] text-sm font-medium text-purple-950 dark:text-[#EDE7DB] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-purple-100 dark:border-[#292535] flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#15121C]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8E8679] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama peran atau efek kemampuan..."
              aria-label="Cari karakter"
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg bg-purple-50 dark:bg-[#1E1A29] border border-purple-200 dark:border-[#312C40] text-sm text-slate-900 dark:text-[#F5EFE6] placeholder-slate-400 dark:placeholder-[#7C7589] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-purple-50 dark:bg-[#1E1A29] border border-purple-100 dark:border-transparent rounded-lg overflow-x-auto">
            {(
              [
                ['all', 'Semua (22)'],
                ['townsfolk', 'Townsfolk'],
                ['outsider', 'Outsider'],
                ['minion', 'Minion'],
                ['demon', 'Demon'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTeamFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  teamFilter === key
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-950 dark:text-[#B8B0A2] dark:hover:text-[#F5EFE6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRoles.map((role) => {
              const isEvil = role.team === 'minion' || role.team === 'demon';
              return (
                <div
                  key={role.id}
                  className="p-4 rounded-xl bg-purple-50/50 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A] flex items-start gap-3.5 shadow-xs"
                >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#121018] border border-purple-200 dark:border-[#352F45] overflow-hidden flex items-center justify-center shrink-0 shadow">
                    <img
                      src={`/tokens/${role.id}.png`}
                      alt={role.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-[#A8A092]">
                      <span className="font-display text-sm font-bold text-slate-900 dark:text-[#F5EFE6]">
                        {role.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{role.indonesianName}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-bold ${
                          isEvil
                            ? 'text-red-700 dark:text-[#FCA5A5]'
                            : 'text-blue-700 dark:text-[#93C5FD]'
                        }`}
                      >
                        {role.team.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-[#E5DFD3] leading-relaxed">
                      {role.ability}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-[#A69F91] leading-relaxed pt-1">
                      Panduan Storyteller: {role.storytellerNote}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Rules Summary */}
          <div className="pt-4 border-t border-purple-100 dark:border-[#292535] space-y-3">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-[#F5EFE6]">
              Ringkasan Aturan Penting Storyteller
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-[#D6CFC2] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A]">
                <strong className="block text-slate-900 dark:text-[#F5EFE6] mb-1">Drunk & Poisoned</strong>
                Pemain Drunk atau Poisoned tidak punya kemampuan aktif, tetapi Storyteller tetap membangunkan mereka seolah-olah normal dan boleh memberi informasi salah.
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A]">
                <strong className="block text-slate-900 dark:text-[#F5EFE6] mb-1">Kematian & Suara Hantu</strong>
                Pemain mati tidak boleh menominasikan warga, tetapi masih bisa berbicara dan memiliki 1x Suara Hantu (Ghost Vote) untuk dipakai sampai permainan usai.
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-[#1D1927] border border-purple-200 dark:border-[#2C273A]">
                <strong className="block text-slate-900 dark:text-[#F5EFE6] mb-1">Syarat Kemenangan</strong>
                Tim Good menang jika Demon dieksekusi/mati (dan Scarlet Woman tidak menggantikannya). Tim Evil menang jika hanya tersisa 2 pemain hidup, atau Saint dieksekusi.
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-[#9C9486]">
              Tabel Karakter Resmi: 5p (3/0/1/1) · 6p (3/1/1/1) · 7p (5/0/1/1) · 8p (5/1/1/1) · 9p (5/2/1/1) · 10p (7/0/2/1) · 11p (7/1/2/1) · 12p (7/2/2/1) · 13p (9/0/3/1) · 14p (9/1/3/1) · 15p (9/2/3/1). Total karakter di database: {Object.keys(CHARACTER_COUNTS).length} konfigurasi jumlah pemain.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
