'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Gavel,
  Ghost,
  HeartPulse,
  Pencil,
  PlusCircle,
  Scale,
  ShieldAlert,
  Skull,
  Trash2,
  X,
} from 'lucide-react';
import { ALL_TB_ROLES, ROLE_MAP } from '@/lib/botc-data';
import { PlayerSeat, getPlayerAlignment } from '@/lib/botc-engine';
import ParchmentSurface from './ParchmentSurface';
import { CharacterTokenFront } from './TokenPrimitives';

interface SeatContextMenuProps {
  seat: PlayerSeat;
  totalSeats: number;
  isDayPhase: boolean;
  style?: React.CSSProperties;
  onOpenReminderPicker: () => void;
  onStartNomination: () => void;
  onKill: (cause: 'demon' | 'execution' | 'slayer') => void;
  onResurrect: () => void;
  onToggleGhostVote: () => void;
  onToggleAlignment: () => void;
  onChangeRole: (newRoleId: string) => void;
  onRename: (name: string) => void;
  onMoveSeat: (dir: 'cw' | 'ccw') => void;
  onStartSwap: () => void;
  onPeekSeat: () => void;
  onShowSeatToken: () => void;
  onRemoveSeat: () => void;
  onClose: () => void;
}

/**
 * Collision-avoidant warm vellum Storyteller context popover anchored beside a clicked seat.
 * First item is "Tambah Pengingat" just like botcgrimoire-main's tactile seat menu.
 */
export default function SeatContextMenu({
  seat,
  totalSeats,
  isDayPhase,
  style,
  onOpenReminderPicker,
  onStartNomination,
  onKill,
  onResurrect,
  onToggleGhostVote,
  onToggleAlignment,
  onChangeRole,
  onRename,
  onMoveSeat,
  onStartSwap,
  onPeekSeat,
  onShowSeatToken,
  onRemoveSeat,
  onClose,
}: SeatContextMenuProps) {
  const [subPanel, setSubPanel] = useState<'main' | 'role' | 'rename' | 'kill'>('main');
  const [draftName, setDraftName] = useState(seat.name);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const trueRole = ROLE_MAP[seat.trueRoleId];
  const perceivedRole = ROLE_MAP[seat.perceivedRoleId];
  const effectiveAlignment = getPlayerAlignment(seat);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftName.trim()) {
      onRename(draftName.trim());
    }
    setSubPanel('main');
  };

  return (
    <div
      style={style}
      onClick={(e) => e.stopPropagation()}
      className="z-40 w-[264px] max-w-[calc(100vw-24px)]"
    >
      <ParchmentSurface className="rounded-2xl overflow-hidden shadow-2xl">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#655342]/25 bg-[#66533f]/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            {trueRole && <CharacterTokenFront role={trueRole} size={32} alignment={effectiveAlignment} />}
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5c4a37]">
                Kursi #{seat.seatIndex + 1} · {effectiveAlignment === 'evil' ? 'Evil' : 'Good'}
              </div>
              <div className="font-display text-sm font-bold text-[#2a2018] truncate">
                {seat.name} ({trueRole?.name}
                {seat.trueRoleId === 'drunk' && perceivedRole ? ` -> ${perceivedRole.name}` : ''})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu kursi"
            className="w-7 h-7 rounded-lg hover:bg-[#66533f]/15 flex items-center justify-center text-[#2a2018] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Views */}
        {subPanel === 'main' && (
          <div className="p-1.5 space-y-1 text-xs font-medium text-[#2a2018] max-h-[60vh] overflow-y-auto">
            {/* 1. Remind (always first!) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReminderPicker();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#c9963a]/20 hover:bg-[#c9963a]/35 font-bold text-[#2a2018] cursor-pointer transition-colors text-left"
            >
              <PlusCircle className="w-4 h-4 text-[#7a5210] shrink-0" />
              <span>Tambah Pengingat / Catatan</span>
            </button>

            {/* 2. Nominate during Day */}
            {isDayPhase && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartNomination();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
              >
                <Gavel className="w-4 h-4 text-[#760a0d] shrink-0" />
                <span>Nominasikan untuk Eksekusi</span>
              </button>
            )}

            {/* 3. Life / Death / Ghost Vote */}
            {seat.isAlive ? (
              <button
                type="button"
                onClick={() => setSubPanel('kill')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#760a0d]/10 text-[#760a0d] font-semibold cursor-pointer transition-colors text-left"
              >
                <Skull className="w-4 h-4 shrink-0" />
                <span>Tandai Pemain Mati...</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onResurrect();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-800/10 text-emerald-900 font-semibold cursor-pointer transition-colors text-left"
                >
                  <HeartPulse className="w-4 h-4 shrink-0" />
                  <span>Hidupkan Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleGhostVote();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
                >
                  <Ghost className="w-4 h-4 text-[#5c4a37] shrink-0" />
                  <span>
                    Ghost Vote: {seat.hasGhostVote ? 'Tersedia (Klik Pakai)' : 'Habis (Klik Kembalikan)'}
                  </span>
                </button>
              </>
            )}

            <div className="my-1 border-t border-[#655342]/18" />

            {/* 4. Peek & Silent Show */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onPeekSeat();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
            >
              <Eye className="w-4 h-4 text-[#0064ac] shrink-0" />
              <span>Intip Detail Rahasia</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onShowSeatToken();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
            >
              <ShieldAlert className="w-4 h-4 text-[#5c4a37] shrink-0" />
              <span>Tunjuk Token ke Pemain</span>
            </button>

            <div className="my-1 border-t border-[#655342]/18" />

            {/* 5. Role, Alignment & Name */}
            <button
              type="button"
              onClick={() => setSubPanel('role')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#5c4a37] shrink-0" />
              <span>Ganti Karakter ({trueRole?.name})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleAlignment();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
            >
              <Scale className="w-4 h-4 text-[#5c4a37] shrink-0" />
              <span>
                Aliansi: {effectiveAlignment === 'good' ? 'Good -> Ubah ke Evil' : 'Evil -> Ubah ke Good'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubPanel('rename')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#66533f]/12 cursor-pointer transition-colors text-left"
            >
              <Pencil className="w-4 h-4 text-[#5c4a37] shrink-0" />
              <span>Ubah Nama Pemain</span>
            </button>

            {/* 6. Seat Position Controls */}
            <div className="flex items-center gap-1 px-1 pt-1">
              <button
                type="button"
                onClick={() => onMoveSeat('ccw')}
                title="Geser berlawanan jarum jam"
                className="flex-1 py-1.5 rounded-lg border border-[#655342]/25 bg-[#66533f]/[0.06] hover:bg-[#66533f]/[0.15] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Geser</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartSwap();
                }}
                title="Tukar kursi dengan pemain lain"
                className="flex-1 py-1.5 rounded-lg border border-[#655342]/25 bg-[#66533f]/[0.06] hover:bg-[#66533f]/[0.15] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Tukar</span>
              </button>
              <button
                type="button"
                onClick={() => onMoveSeat('cw')}
                title="Geser searah jarum jam"
                className="flex-1 py-1.5 rounded-lg border border-[#655342]/25 bg-[#66533f]/[0.06] hover:bg-[#66533f]/[0.15] flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Geser</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {totalSeats > 5 && (
              <div className="pt-1">
                {!confirmRemove ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[#760a0d] hover:bg-[#760a0d]/10 cursor-pointer transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Hapus Kursi Ini</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveSeat();
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#760a0d] text-[#efe6d2] font-bold text-center cursor-pointer"
                  >
                    Konfirmasi Hapus {seat.name}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Kill Cause Subpanel */}
        {subPanel === 'kill' && (
          <div className="p-2.5 space-y-2 text-xs">
            <p className="font-semibold text-[#5c4a37] px-1">Pilih penyebab kematian:</p>
            <button
              type="button"
              onClick={() => {
                onKill('demon');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#760a0d]/15 hover:bg-[#760a0d]/25 text-[#760a0d] font-bold cursor-pointer text-left"
            >
              <Skull className="w-4 h-4 shrink-0" />
              <span>Dibunuh Demon (Malam)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onKill('execution');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#c9963a]/25 hover:bg-[#c9963a]/40 text-[#2a2018] font-bold cursor-pointer text-left"
            >
              <Gavel className="w-4 h-4 shrink-0" />
              <span>Dieksekusi Kota (Siang)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onKill('slayer');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0064ac]/15 hover:bg-[#0064ac]/25 text-[#0064ac] font-bold cursor-pointer text-left"
            >
              <Crosshair className="w-4 h-4 shrink-0" />
              <span>Tertembak Slayer (Siang)</span>
            </button>
            <button
              type="button"
              onClick={() => setSubPanel('main')}
              className="w-full py-1.5 rounded-lg text-center text-[#5c4a37] hover:bg-[#66533f]/10 cursor-pointer"
            >
              Kembali
            </button>
          </div>
        )}

        {/* Rename Subpanel */}
        {subPanel === 'rename' && (
          <form onSubmit={handleRenameSubmit} className="p-3 space-y-2.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#5c4a37]">
              Nama Baru Kursi #{seat.seatIndex + 1}
            </label>
            <input
              type="text"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={24}
              className="w-full px-3 py-2 rounded-xl border border-[#655342]/40 bg-white/80 text-sm font-semibold text-[#2a2018] focus:outline-none focus:ring-2 focus:ring-[#c9963a]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubPanel('main')}
                className="flex-1 py-1.5 rounded-xl border border-[#655342]/30 text-xs font-semibold text-[#5c4a37] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-xl bg-[#2a2018] text-[#efe6d2] text-xs font-bold cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Change Role Subpanel */}
        {subPanel === 'role' && (
          <div className="p-2.5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#5c4a37]">
                Pilih Peran Baru
              </span>
              <button
                type="button"
                onClick={() => setSubPanel('main')}
                className="text-xs font-bold text-[#0064ac] cursor-pointer"
              >
                Kembali
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
              {ALL_TB_ROLES.map((role) => {
                const active = role.id === seat.trueRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      onChangeRole(role.id);
                      onClose();
                    }}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-[11px] cursor-pointer transition-colors ${
                      active
                        ? 'border-[#c9963a] bg-[#c9963a]/25 font-bold'
                        : 'border-[#655342]/20 bg-[#66533f]/[0.04] hover:bg-[#66533f]/[0.15]'
                    }`}
                  >
                    <CharacterTokenFront role={role} size={24} showSetupLeaf={false} />
                    <span className="truncate text-[#2a2018]">{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </ParchmentSurface>
    </div>
  );
}
