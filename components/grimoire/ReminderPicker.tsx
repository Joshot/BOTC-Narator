'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, StickyNote, X } from 'lucide-react';
import { REMINDER_TOKENS, ROLE_MAP } from '@/lib/botc-data';
import { GRIMOIRE_PALETTE } from '@/lib/grimoire-theme';
import ParchmentSurface from './ParchmentSurface';
import { ReminderDisc } from './TokenPrimitives';

interface ReminderPickerProps {
  targetPlayerName: string;
  inPlayRoleIds: Set<string>;
  hasDrunkAssigned: boolean;
  onPickReminder: (reminderId: string) => void;
  onAddCustomNote: (noteText: string) => void;
  onClose: () => void;
}

/**
 * Warm-vellum Storyteller Reminder Picker drawer ordered identically to botcgrimoire-main:
 * 1. In-Play Reminders -> 2. Custom Note creator -> 3. Out-of-Play collapsible archive.
 */
export default function ReminderPicker({
  targetPlayerName,
  inPlayRoleIds,
  hasDrunkAssigned,
  onPickReminder,
  onAddCustomNote,
  onClose,
}: ReminderPickerProps) {
  const [noteInput, setNoteInput] = useState('');
  const [showNotInPlay, setShowNotInPlay] = useState(false);

  const visibleReminders = REMINDER_TOKENS.filter((rem) => {
    if (rem.id === 'is_the_drunk' && hasDrunkAssigned) return false;
    return true;
  });

  const inPlayReminders = visibleReminders.filter(
    (rem) =>
      inPlayRoleIds.has(rem.roleId) ||
      (rem.roleId === 'undertaker' && inPlayRoleIds.has('undertaker')) ||
      rem.id === 'died_today'
  );
  const notInPlayReminders = visibleReminders.filter(
    (rem) => !inPlayReminders.some((ip) => ip.id === rem.id)
  );

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = noteInput.trim();
    if (!cleaned) return;
    onAddCustomNote(cleaned);
    setNoteInput('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilih Token Pengingat"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[86vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <ParchmentSurface className="rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[86vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#655342]/25">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                Baki Pengingat Trouble Brewing
              </p>
              <h3 className="font-display text-lg font-bold text-[#2a2018] truncate">
                Pasang Token ke {targetPlayerName}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup baki pengingat"
              className="w-9 h-9 rounded-xl bg-[#66533f]/10 hover:bg-[#66533f]/20 text-[#2a2018] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable sections */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
            {/* Section 1: In Play */}
            <section className="space-y-2.5">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#5c4a37]">
                Sedang Dimainkan ({inPlayReminders.length})
              </h4>
              {inPlayReminders.length === 0 ? (
                <p className="text-xs text-[#5c4a37]/80 italic py-2">
                  Belum ada karakter dengan token pengingat aktif di lingkaran. Gunakan Catatan Kustom atau buka daftar di bawah.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inPlayReminders.map((rem) => {
                    const role = ROLE_MAP[rem.roleId];
                    const teamColor =
                      role?.team === 'minion' || role?.team === 'demon'
                        ? GRIMOIRE_PALETTE.teamOnPaper.demon
                        : GRIMOIRE_PALETTE.teamOnPaper.townsfolk;
                    return (
                      <button
                        key={rem.id}
                        type="button"
                        onClick={() => {
                          onPickReminder(rem.id);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-[#655342]/25 bg-[#66533f]/[0.06] hover:bg-[#66533f]/[0.15] hover:border-[#c9963a] text-left transition-all cursor-pointer"
                      >
                        <ReminderDisc reminderId={rem.id} size={40} showTooltip={false} />
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-sm font-bold text-[#2a2018] truncate">
                            {rem.indonesianLabel}
                          </div>
                          <div
                            className="text-[10px] font-mono uppercase tracking-wider"
                            style={{ color: teamColor }}
                          >
                            {role?.name || rem.roleId}
                          </div>
                          <p className="text-[11px] text-[#5c4a37] line-clamp-2 leading-snug mt-0.5">
                            {rem.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 2: Custom Note */}
            <section className="space-y-2 pt-2 border-t border-[#655342]/20">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#5c4a37] flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                <span>Catatan Kustom (Chip Tulis Bebas)</span>
              </h4>
              <form onSubmit={handleSubmitNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  maxLength={32}
                  placeholder="Misal: Klaim Chef 1 / Cek Info..."
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#655342]/35 bg-white/75 text-sm text-[#2a2018] placeholder:text-[#5c4a37]/60 focus:outline-none focus:ring-2 focus:ring-[#c9963a]"
                />
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#2a2018] hover:bg-[#3f3125] disabled:opacity-40 text-[#efe6d2] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pasang</span>
                </button>
              </form>
            </section>

            {/* Section 3: Not in Play (Collapsible) */}
            {notInPlayReminders.length > 0 && (
              <section className="pt-2 border-t border-[#655342]/20">
                <button
                  type="button"
                  onClick={() => setShowNotInPlay((prev) => !prev)}
                  className="w-full flex items-center justify-between py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#5c4a37] hover:text-[#2a2018] cursor-pointer"
                >
                  <span>Tidak Sedang Dimainkan ({notInPlayReminders.length})</span>
                  {showNotInPlay ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {showNotInPlay && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {notInPlayReminders.map((rem) => {
                      const role = ROLE_MAP[rem.roleId];
                      return (
                        <button
                          key={rem.id}
                          type="button"
                          onClick={() => {
                            onPickReminder(rem.id);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-[#655342]/20 bg-[#66533f]/[0.04] hover:bg-[#66533f]/[0.14] text-left transition-all cursor-pointer"
                        >
                          <ReminderDisc reminderId={rem.id} size={36} showTooltip={false} />
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-sm font-bold text-[#2a2018] truncate">
                              {rem.indonesianLabel}
                            </div>
                            <div className="text-[10px] font-mono text-[#5c4a37]">
                              {role?.name || rem.roleId}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        </ParchmentSurface>
      </div>
    </div>
  );
}
