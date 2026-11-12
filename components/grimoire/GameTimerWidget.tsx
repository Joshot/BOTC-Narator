'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  DAY_TIMER_PRESETS_SEC,
  DayTimerState,
  computeTimerRemainingMs,
  formatTimerClock,
} from '@/lib/botc-engine';
import type { TimerAction } from '@/context/GameContext';
import { BOARD_CHROME } from '@/lib/grimoire-theme';

function playSoftBellChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Audio playback disabled or blocked
  }
}

interface GameTimerWidgetProps {
  timer: DayTimerState | null;
  phaseStartedAt?: number;
  onAction: (action: TimerAction) => void;
  variant?: 'compact' | 'panel';
}

export default function GameTimerWidget({
  timer,
  phaseStartedAt,
  onAction,
  variant = 'compact',
}: GameTimerWidgetProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const finishedPlayedRef = useRef<number | null>(null);

  const isRunning = Boolean(timer?.deadline !== null && timer?.deadline !== undefined);
  const shouldTick = isRunning || Boolean(phaseStartedAt);

  useEffect(() => {
    if (!shouldTick) return;
    setNow(Date.now());
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => window.clearInterval(interval);
  }, [shouldTick]);

  const remainingMs = timer ? computeTimerRemainingMs(timer, now) : 0;
  const elapsedMs = phaseStartedAt ? Math.max(0, now - phaseStartedAt) : 0;
  const isFinished = Boolean(timer && isRunning && remainingMs <= 0);
  const isLow = Boolean(timer && remainingMs > 0 && remainingMs <= 30_000);

  useEffect(() => {
    if (isFinished && timer?.deadline && finishedPlayedRef.current !== timer.deadline) {
      finishedPlayedRef.current = timer.deadline;
      if (soundEnabled) {
        playSoftBellChime();
      }
    }
  }, [isFinished, soundEnabled, timer?.deadline]);

  const countdownLabel = timer ? formatTimerClock(remainingMs) : '05:00';
  const elapsedLabel = formatTimerClock(elapsedMs);

  if (variant === 'panel') {
    return (
      <div className="bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-[#D4AF37]/15 border border-amber-300 dark:border-[#D4AF37]/30 flex items-center justify-center">
              <Timer className="w-4 h-4 text-amber-800 dark:text-[#FBBF24]" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-800 dark:text-[#D4AF37] font-bold">
                Timer Diskusi &amp; Fase Storyteller
              </div>
              <div className="text-xs text-slate-600 dark:text-[#8E8A9E] font-mono tabular-nums">
                Durasi fase berjalan: <strong className="text-slate-900 dark:text-[#EDEAF0]">{elapsedLabel}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-white/[0.08] bg-purple-50 dark:bg-[#1C1C26] text-xs font-semibold text-slate-700 dark:text-[#A8A092] flex items-center gap-1.5 cursor-pointer"
            title={soundEnabled ? 'Matikan bel saat waktu habis' : 'Aktifkan bel saat waktu habis'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Bel Aktif' : 'Bisukan'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-purple-50/70 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAction({ type: 'adjustSeconds', deltaSeconds: -30 })}
              className="w-9 h-9 rounded-xl border border-purple-200 dark:border-white/[0.1] bg-white dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] flex items-center justify-center cursor-pointer"
              title="Kurangi 30 detik"
              aria-label="Kurangi 30 detik"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div
              role="timer"
              aria-live="polite"
              className={`min-w-[92px] text-center font-mono text-2xl font-black tabular-nums ${
                isFinished
                  ? 'text-red-600 dark:text-[#F87171] animate-pulse'
                  : isLow
                  ? 'text-amber-600 dark:text-[#FBBF24]'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {countdownLabel}
            </div>
            <button
              type="button"
              onClick={() => onAction({ type: 'adjustSeconds', deltaSeconds: 30 })}
              className="w-9 h-9 rounded-xl border border-purple-200 dark:border-white/[0.1] bg-white dark:bg-[#1C1C26] hover:bg-purple-100 dark:hover:bg-[#252533] flex items-center justify-center cursor-pointer"
              title="Tambah 30 detik"
              aria-label="Tambah 30 detik"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {DAY_TIMER_PRESETS_SEC.map((sec) => {
              const active = timer && Math.round(timer.durationMs / 1000) === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onAction({ type: 'setDuration', seconds: sec })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#c9963a] text-[#2a2018]'
                      : 'bg-white dark:bg-[#1C1C26] border border-purple-200 dark:border-white/[0.08] text-slate-700 dark:text-[#D6CFC2] hover:bg-purple-100'
                  }`}
                >
                  {sec / 60}m
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAction({ type: isRunning && remainingMs > 0 ? 'pause' : 'start' })}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              {isRunning && remainingMs > 0 ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Mulai</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onAction({ type: 'reset' })}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-purple-200 dark:border-white/[0.1] bg-white dark:bg-[#1C1C26] hover:bg-purple-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {remainingMs === 0 && timer && (
          <div className="text-xs font-bold text-red-600 dark:text-[#FCA5A5]">
            Waktu diskusi habis — warga diminta berkumpul kembali ke lingkaran!
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => setPopoverOpen((prev) => !prev)}
        className={`px-2 py-1.5 rounded-xl border text-xs font-mono font-bold tabular-nums flex items-center gap-1.5 cursor-pointer transition-colors ${
          isFinished || remainingMs === 0
            ? 'border-[#e0574b]/70 bg-[#760a0d]/55 text-[#ffd4cf]'
            : isLow && isRunning
            ? 'border-[#f2c56b] bg-[#c9963a]/25 text-[#f2c56b]'
            : 'border-[#c9963a]/35 bg-black/45 hover:bg-black/65 text-[#efe6d2]'
        }`}
        title={`Timer Diskusi (${countdownLabel}) · Durasi Fase: ${elapsedLabel}`}
      >
        <Timer className="w-3.5 h-3.5 text-[#c9963a]" />
        <span>{countdownLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => onAction({ type: isRunning && remainingMs > 0 ? 'pause' : 'start' })}
        aria-label={isRunning && remainingMs > 0 ? 'Jeda Timer' : 'Mulai Timer'}
        title={isRunning && remainingMs > 0 ? 'Jeda Timer' : 'Mulai Timer'}
        className="p-1.5 rounded-xl border border-[#c9963a]/30 bg-black/45 hover:bg-black/70 text-[#efe6d2] cursor-pointer"
      >
        {isRunning && remainingMs > 0 ? (
          <Pause className="w-3.5 h-3.5 text-[#c9963a]" />
        ) : (
          <Play className="w-3.5 h-3.5 text-[#c9963a]" />
        )}
      </button>

      {popoverOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: BOARD_CHROME.blockBg,
            border: `1px solid ${BOARD_CHROME.blockBorder}`,
            boxShadow: BOARD_CHROME.liftedShadow,
          }}
          className="fixed sm:absolute bottom-16 right-3 sm:bottom-full sm:right-0 sm:mb-2 w-72 max-w-[92vw] rounded-2xl p-3 z-50 backdrop-blur-md space-y-2.5 text-xs text-[#efe6d2]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-[#c9963a]">
              <Clock className="w-3.5 h-3.5" />
              <span>Timer Diskusi &amp; Fase</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled((p) => !p)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#a89f8c] cursor-pointer"
                title={soundEnabled ? 'Bisukan bel' : 'Aktifkan bel'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#c9963a]" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setPopoverOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#a89f8c] cursor-pointer"
                aria-label="Tutup panel timer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-black/45 border border-white/10">
            <button
              type="button"
              onClick={() => onAction({ type: 'adjustSeconds', deltaSeconds: -30 })}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              title="Kurangi 30 detik"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="text-center">
              <div
                className={`font-mono text-2xl font-bold tabular-nums ${
                  remainingMs === 0 ? 'text-[#e0574b]' : 'text-[#efe6d2]'
                }`}
              >
                {countdownLabel}
              </div>
              <div className="text-[10px] font-mono text-[#a89f8c]">
                Fase berjalan: {elapsedLabel}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAction({ type: 'adjustSeconds', deltaSeconds: 30 })}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              title="Tambah 30 detik"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {DAY_TIMER_PRESETS_SEC.map((sec) => {
              const active = timer && Math.round(timer.durationMs / 1000) === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onAction({ type: 'setDuration', seconds: sec })}
                  className={`py-1 rounded-lg font-mono text-[11px] font-bold cursor-pointer ${
                    active
                      ? 'bg-[#c9963a] text-[#2a2018]'
                      : 'bg-white/10 hover:bg-white/20 text-[#efe6d2]'
                  }`}
                >
                  {sec / 60}m
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAction({ type: isRunning && remainingMs > 0 ? 'pause' : 'start' })}
              className="flex-1 py-2 rounded-xl bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isRunning && remainingMs > 0 ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Mulai</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onAction({ type: 'reset' })}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
