'use client';

import React, { useState } from 'react';
import { Plus, StickyNote, X } from 'lucide-react';
import { REMINDER_TOKENS, ROLE_MAP } from '@/lib/botc-data';
import { GRIMOIRE_PALETTE } from '@/lib/grimoire-theme';
import ParchmentSurface from './ParchmentSurface';
import { ReminderDisc } from './TokenPrimitives';
import { useLockBodyScroll } from './useLockBodyScroll';

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
  const [activeTab, setActiveTab] = useState<'in_play' | 'other'>('in_play');

  useLockBodyScroll(true);

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
  const displayedReminders = activeTab === 'in_play' ? inPlayReminders : notInPlayReminders;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-[2px] overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[94dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ParchmentSurface className="rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#655342]/25">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                Baki Pengingat Trouble Brewing
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#2a2018] truncate">
                Pasang Token ke {targetPlayerName}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup baki pengingat"
              className="w-8 h-8 rounded-xl bg-[#66533f]/10 hover:bg-[#66533f]/20 text-[#2a2018] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Switcher (Zero Scroll Fit) */}
          <div className="px-4 sm:px-5 pt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('in_play')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                activeTab === 'in_play'
                  ? 'bg-[#2a2018] text-[#efe6d2] shadow'
                  : 'bg-[#66533f]/10 text-[#5c4a37] hover:bg-[#66533f]/20'
              }`}
            >
              Sedang Main ({inPlayReminders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('other')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                activeTab === 'other'
                  ? 'bg-[#2a2018] text-[#efe6d2] shadow'
                  : 'bg-[#66533f]/10 text-[#5c4a37] hover:bg-[#66533f]/20'
              }`}
            >
              Lainnya ({notInPlayReminders.length})
            </button>
          </div>

          {/* Reminder Tiles Grid */}
          <div className="p-3 sm:p-4 overflow-hidden">
            {displayedReminders.length === 0 ? (
              <p className="text-xs text-[#5c4a37]/80 italic text-center py-6">
                Tidak ada token di kategori ini. Coba tab lain atau pasang Catatan Kustom di bawah.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {displayedReminders.map((rem) => {
                  const role = ROLE_MAP[rem.roleId];
                  const teamColor =
                    role?.team === 'minion' || role?.team === 'demon'
                      ? GRIMOIRE_PALETTE.teamOnPaper.demon
                      : GRIMOIRE_PALETTE.teamOnPaper.townsfolk;
                  return (
                    <button
                      key={rem.id}
                      type="button"
                      title={rem.description}
                      onClick={() => {
                        onPickReminder(rem.id);
                        onClose();
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl border border-[#655342]/25 bg-[#66533f]/[0.06] hover:bg-[#66533f]/[0.15] hover:border-[#c9963a] text-left transition-all cursor-pointer"
                    >
                      <ReminderDisc reminderId={rem.id} size={32} showTooltip={false} />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-xs sm:text-sm font-bold text-[#2a2018] truncate">
                          {rem.indonesianLabel}
                        </div>
                        <div
                          className="text-[10px] font-mono uppercase tracking-wider truncate"
                          style={{ color: teamColor }}
                        >
                          {role?.name || rem.roleId}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pinned Compact Custom Note Footer */}
          <form
            onSubmit={handleSubmitNote}
            className="px-4 sm:px-5 py-3 border-t border-[#655342]/25 bg-[#66533f]/[0.06] flex items-center gap-2"
          >
            <StickyNote className="w-4 h-4 text-[#5c4a37] shrink-0" />
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              maxLength={32}
              placeholder="Catatan kustom (mis. Klaim Chef 1)..."
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-[#655342]/35 bg-white/80 text-xs sm:text-sm text-[#2a2018] placeholder:text-[#5c4a37]/60 focus:outline-none focus:ring-2 focus:ring-[#c9963a]"
            />
            <button
              type="submit"
              disabled={!noteInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-[#2a2018] hover:bg-[#3f3125] disabled:opacity-40 text-[#efe6d2] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pasang</span>
            </button>
          </form>
        </ParchmentSurface>
      </div>
    </div>
  );
}
