'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  EyeOff,
  LayoutGrid,
  Minus,
  Pause,
  Play,
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
import {
  DAY_TIMER_PRESETS_SEC,
  DayTimerState,
  computeTimerRemainingMs,
  formatTimerClock,
} from '@/lib/botc-engine';
import type { TimerAction } from '@/context/GameContext';
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
  dayTimer?: DayTimerState | null;
  phaseStartedAt?: number;
  onTimerAction?: (action: TimerAction) => void;
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
  dayTimer = null,
  phaseStartedAt,
  onTimerAction,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  winner = null,
  onSetWinnerManual,
}: BoardToolsMenuProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const isRunning = Boolean(dayTimer?.deadline !== null && dayTimer?.deadline !== undefined);

  useEffect(() => {
    if (!isOpen || (!isRunning && !phaseStartedAt)) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isOpen, isRunning, phaseStartedAt]);

  if (!isOpen) return null;

  const remainingMs = dayTimer ? computeTimerRemainingMs(dayTimer, now) : 0;
  const elapsedMs = phaseStartedAt ? Math.max(0, now - phaseStartedAt) : 0;
  const countdownLabel = dayTimer ? formatTimerClock(remainingMs) : '05:00';
  const isFinished = Boolean(dayTimer && isRunning && remainingMs <= 0);
  const isLow = Boolean(dayTimer && remainingMs > 0 && remainingMs <= 30_000);

  return (
    <div
      role="menu"
      className={`absolute ${
        align === 'right' ? 'right-0' : 'left-0'
      } top-full mt-2 w-[268px] sm:w-[292px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-100px)] overflow-y-auto rounded-2xl p-2.5 z-50 shadow-2xl border border-[#c9963a]/40 bg-[#141a1d]/95 backdrop-blur-md space-y-2`}
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

      {/* Discussion Timer */}
      {onTimerAction && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#c9963a]">
              <Clock className="w-3 h-3" />
              <span>Timer</span>
              {phaseStartedAt && (
                <span className="font-mono font-normal text-[#a89f8c] lowercase">
                  · {formatTimerClock(elapsedMs)}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {DAY_TIMER_PRESETS_SEC.slice(0, 3).map((sec) => {
                const active = dayTimer && Math.round(dayTimer.durationMs / 1000) === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onTimerAction({ type: 'setDuration', seconds: sec })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                      active ? 'bg-[#c9963a] text-[#2a2018]' : 'bg-white/10 text-[#efe6d2] hover:bg-white/20'
                    }`}
                  >
                    {sec / 60}m
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onTimerAction({ type: 'reset' })}
                title="Reset Timer"
                aria-label="Reset Timer"
                className="p-1 rounded bg-white/10 hover:bg-white/20 text-[#efe6d2] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onTimerAction({ type: 'adjustSeconds', deltaSeconds: -30 })}
                title="Kurangi 30 detik"
                aria-label="Kurangi 30 detik"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[#efe6d2] flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span
                className={`min-w-[54px] text-center font-mono text-sm font-black tabular-nums ${
                  isFinished
                    ? 'text-[#ff9c94] animate-pulse'
                    : isLow && isRunning
                    ? 'text-[#f2c56b]'
                    : 'text-[#efe6d2]'
                }`}
              >
                {countdownLabel}
              </span>
              <button
                type="button"
                onClick={() => onTimerAction({ type: 'adjustSeconds', deltaSeconds: 30 })}
                title="Tambah 30 detik"
                aria-label="Tambah 30 detik"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[#efe6d2] flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onTimerAction({ type: isRunning && remainingMs > 0 ? 'pause' : 'start' })
              }
              className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[#c9963a] hover:bg-[#e0b254] text-[#2a2018] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {isRunning && remainingMs > 0 ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Mulai</span>
                </>
              )}
            </button>
          </div>
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
