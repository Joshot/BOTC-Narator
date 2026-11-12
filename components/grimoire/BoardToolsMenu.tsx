'use client';

import React from 'react';
import {
  BookOpen,
  EyeOff,
  LayoutGrid,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  ScrollText,
  Sparkles,
  Trophy,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import type { VelvetColour } from '@/lib/grimoire-theme';
import { VelvetColourSelector } from './VelvetBackdrop';

export interface BoardToolsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
  viewMode: 'circle' | 'cards';
  onToggleViewMode: () => void;
  onRotateRing?: (dir: 'cw' | 'ccw') => void;
  arrangeGapsVisible: boolean;
  onToggleArrangeGaps?: () => void;
  onOpenScript: () => void;
  onOpenBluffs?: () => void;
  spyStealth: boolean;
  onToggleStealth: () => void;
  velvetColour: VelvetColour;
  onVelvetColourChange?: (colour: VelvetColour) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  winner?: 'good' | 'evil' | null;
  onSetWinnerManual?: (winner: 'good' | 'evil' | null) => void;
}

/**
 * Unified click-to-open Grimoire toolbar menu so secondary Storyteller controls
 * stay hidden until tapped and never collide with corner badges or ring seats.
 */
export default function BoardToolsMenu({
  isOpen,
  onClose,
  align = 'left',
  viewMode,
  onToggleViewMode,
  onRotateRing,
  arrangeGapsVisible,
  onToggleArrangeGaps,
  onOpenScript,
  onOpenBluffs,
  spyStealth,
  onToggleStealth,
  velvetColour,
  onVelvetColourChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  winner = null,
  onSetWinnerManual,
}: BoardToolsMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      role="menu"
      className={`absolute ${
        align === 'right' ? 'right-0' : 'left-0'
      } top-full mt-2 w-[264px] sm:w-[288px] max-w-[calc(100vw-24px)] rounded-2xl p-2.5 z-50 shadow-2xl border border-[#c9963a]/40 bg-[#141a1d]/95 backdrop-blur-md space-y-2`}
    >
      <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9963a]">
          Alat Grimoire
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu alat"
          className="p-1 rounded-lg text-[#a89f8c] hover:text-[#efe6d2] hover:bg-white/10 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary Layout & Script */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onToggleViewMode();
            onClose();
          }}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 text-[#efe6d2] text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          {viewMode === 'circle' ? (
            <LayoutGrid className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
          )}
          <span className="truncate">{viewMode === 'circle' ? 'Mode Daftar' : 'Lingkaran'}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onOpenScript();
            onClose();
          }}
          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 text-[#efe6d2] text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          {viewMode === 'circle' ? (
            <ScrollText className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
          ) : (
            <BookOpen className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
          )}
          <span className="truncate">Panduan Skrip</span>
        </button>
      </div>

      {/* Ring Seating Controls */}
      {viewMode === 'circle' && (onRotateRing || onToggleArrangeGaps) && (
        <div className="grid grid-cols-3 gap-1.5">
          {onRotateRing && (
            <button
              type="button"
              role="menuitem"
              onClick={() => onRotateRing('ccw')}
              title="Putar berlawanan jarum jam"
              className="min-h-[36px] px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 text-[#efe6d2] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#c9963a]" />
              <span>Kiri</span>
            </button>
          )}
          {onToggleArrangeGaps && (
            <button
              type="button"
              role="menuitem"
              onClick={onToggleArrangeGaps}
              title="Tambah / atur kursi baru"
              className={`min-h-[36px] px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                arrangeGapsVisible
                  ? 'bg-[#c9963a] text-[#2a2018]'
                  : 'bg-white/5 hover:bg-white/12 text-[#efe6d2]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kursi</span>
            </button>
          )}
          {onRotateRing && (
            <button
              type="button"
              role="menuitem"
              onClick={() => onRotateRing('cw')}
              title="Putar searah jarum jam"
              className="min-h-[36px] px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 text-[#efe6d2] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Kanan</span>
              <RotateCw className="w-3.5 h-3.5 text-[#c9963a]" />
            </button>
          )}
        </div>
      )}

      {/* Bluffs & Spy Stealth */}
      <div className="grid grid-cols-2 gap-1.5">
        {onOpenBluffs && (
          <button
            type="button"
            role="menuitem"
            disabled={spyStealth}
            onClick={() => {
              onOpenBluffs();
              onClose();
            }}
            title={spyStealth ? 'Matikan mode stealth untuk ubah Bluff' : 'Atur 3 Demon Bluffs'}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 disabled:opacity-40 disabled:cursor-not-allowed text-[#efe6d2] text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
            <span className="truncate">Atur Bluff</span>
          </button>
        )}

        <button
          type="button"
          role="menuitem"
          onClick={onToggleStealth}
          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
            spyStealth
              ? 'bg-emerald-600 text-white'
              : 'bg-white/5 hover:bg-white/12 text-[#efe6d2]'
          }`}
        >
          {spyStealth ? (
            <EyeOff className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Users className="w-3.5 h-3.5 text-[#c9963a] shrink-0" />
          )}
          <span className="truncate">{spyStealth ? 'Stealth: ON' : 'Stealth'}</span>
        </button>
      </div>

      {/* Undo / Redo */}
      {(onUndo || onRedo) && (
        <div className="grid grid-cols-2 gap-1.5">
          {onUndo && (
            <button
              type="button"
              role="menuitem"
              disabled={!canUndo}
              onClick={() => {
                onUndo();
                onClose();
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 disabled:opacity-35 disabled:cursor-not-allowed text-[#efe6d2] text-xs font-bold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Undo2 className="w-3.5 h-3.5 text-[#c9963a]" />
                Undo
              </span>
              <span className="text-[9px] font-mono text-[#a89f8c]">Ctrl+Z</span>
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              role="menuitem"
              disabled={!canRedo}
              onClick={() => {
                onRedo();
                onClose();
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 disabled:opacity-35 disabled:cursor-not-allowed text-[#efe6d2] text-xs font-bold flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Redo2 className="w-3.5 h-3.5 text-[#c9963a]" />
                Redo
              </span>
              <span className="text-[9px] font-mono text-[#a89f8c]">Ctrl+Y</span>
            </button>
          )}
        </div>
      )}

      {/* Velvet Felt Colour */}
      {onVelvetColourChange && (
        <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-white/5">
          <span className="text-[11px] font-bold text-[#a89f8c]">Kain Meja</span>
          <VelvetColourSelector value={velvetColour} onChange={onVelvetColourChange} compact />
        </div>
      )}

      {/* Manual Game Over */}
      {onSetWinnerManual && !winner && (
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSetWinnerManual('good');
              onClose();
            }}
            className="min-h-[36px] px-2 py-1.5 rounded-xl bg-[#0064ac]/45 hover:bg-[#0064ac]/75 text-[#efe6d2] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#f4e4bc]" />
            <span>Good Menang</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onSetWinnerManual('evil');
              onClose();
            }}
            className="min-h-[36px] px-2 py-1.5 rounded-xl bg-[#760a0d]/55 hover:bg-[#760a0d]/85 text-[#efe6d2] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#f4e4bc]" />
            <span>Evil Menang</span>
          </button>
        </div>
      )}
    </div>
  );
}
