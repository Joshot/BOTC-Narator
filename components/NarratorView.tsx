'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Gavel,
  Gem,
  MessageSquare,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
} from 'lucide-react';
import { ROLE_MAP, ROLES } from '@/lib/botc-data';
import {
  DayTimerState,
  GamePhase,
  PlayerSeat,
  buildNightOrder,
  calculateVoteThreshold,
  isPlayerPoisoned,
} from '@/lib/botc-engine';
import type { TimerAction } from '@/context/GameContext';
import { SilentCardPayload } from './FullscreenCardModal';
import { CharacterToken } from './TokenArtwork';
import GameTimerWidget from './grimoire/GameTimerWidget';
import ShowSheetModal from './grimoire/ShowSheetModal';

interface NarratorViewProps {
  phase: GamePhase;
  dayNumber: number;
  players: PlayerSeat[];
  executedTodayPlayerId: string | null;
  demonBluffIds: string[];
  lastNightDeaths: string[];
  gameAlertBanner: string | null;
  dayTimer?: DayTimerState | null;
  phaseStartedAt?: number;
  onTimerAction?: (action: TimerAction) => void;
  onChangePhase: (nextPhase: GamePhase) => void;
  onSetSingleReminderTarget: (reminderId: string, targetPlayerId: string) => void;
  onResolveImpAttack: (targetPlayerId: string) => { outcomeMessage: string };
  onTransitionNightToDay: () => void;
  onTransitionDayToNextNight: () => void;
  onExecutePlayerInDay: (playerId: string | null) => void;
  onTriggerSlayerShot: (slayerPlayerId: string, targetPlayerId: string) => string;
  onTriggerVirginNomination: (virginPlayerId: string, nominatorPlayerId: string) => string;
  onShowSilentCard: (card: SilentCardPayload) => void;
}

export default function NarratorView({
  phase,
  dayNumber,
  players,
  executedTodayPlayerId,
  demonBluffIds,
  lastNightDeaths,
  gameAlertBanner,
  dayTimer = null,
  phaseStartedAt,
  onTimerAction,
  onChangePhase,
  onSetSingleReminderTarget,
  onResolveImpAttack,
  onTransitionNightToDay,
  onTransitionDayToNextNight,
  onExecutePlayerInDay,
  onTriggerSlayerShot,
  onTriggerVirginNomination,
  onShowSilentCard,
}: NarratorViewProps) {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [impFeedback, setImpFeedback] = useState<string | null>(null);
  const [cardRoleToShow, setCardRoleToShow] = useState<string>('washerwoman');
  const [isShowSheetOpen, setIsShowSheetOpen] = useState(false);
  const [quickCustomNote, setQuickCustomNote] = useState('');

  // Day helper states
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>('');
  const [slayerActorId, setSlayerActorId] = useState<string>('');
  const [slayerTargetId, setSlayerTargetId] = useState<string>('');
  const [dayActionResult, setDayActionResult] = useState<string | null>(null);
  const [virginNominatorId, setVirginNominatorId] = useState<string>('');

  const nightSteps =
    phase === 'day'
      ? []
      : buildNightOrder(phase, players, executedTodayPlayerId, demonBluffIds);

  const safeStepIdx =
    nightSteps.length === 0 ? 0 : Math.min(activeStepIdx, nightSteps.length - 1);
  const currentStep = nightSteps[safeStepIdx] ?? null;

  const voteStats = calculateVoteThreshold(players);
  const alivePlayers = players.filter((p) => p.isAlive);

  const handlePhaseSwitch = (targetPhase: GamePhase) => {
    setActiveStepIdx(0);
    setCompletedStepIds([]);
    setImpFeedback(null);
    setDayActionResult(null);
    onChangePhase(targetPhase);
  };

  const markStepAndAdvance = () => {
    if (!currentStep) return;
    setCompletedStepIds((prev) =>
      prev.includes(currentStep.id) ? prev : [...prev, currentStep.id]
    );
    setImpFeedback(null);
    if (safeStepIdx < nightSteps.length - 1) {
      setActiveStepIdx(safeStepIdx + 1);
    }
  };

  const virginSeat = players.find(
    (p) =>
      p.perceivedRoleId === 'virgin' &&
      !p.reminders.some((r) => r.reminderId === 'used_virgin')
  );

  const progressPct =
    nightSteps.length > 0
      ? Math.round((completedStepIds.length / nightSteps.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Phase Cycle Navigation Bar */}
      <div className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5 px-1">
          <div className="text-xs text-amber-700 dark:text-[#C8A951] font-semibold">
            Siklus Otomasi Narator Storyteller
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-[#F5EFE6]">
            {phase === 'first_night'
              ? 'Malam Pertama (First Night)'
              : phase === 'day'
              ? `Fase Siang Hari ke-${dayNumber}`
              : `Malam Berikutnya (Malam ke-${Math.max(2, dayNumber)})`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveStepIdx(0);
              setCompletedStepIds([]);
              setImpFeedback(null);
              setDayActionResult(null);
              if (phase === 'day') onTransitionDayToNextNight();
              else onTransitionNightToDay();
            }}
            className={`brass-sheen-btn min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap ${
              phase === 'day'
                ? 'bg-[#991B1B] hover:bg-[#B91C1C] text-white'
                : 'bg-[#D4AF37] hover:bg-[#E5C365] text-[#121016]'
            }`}
          >
            {phase === 'day' ? (
              <>
                <Moon className="w-3.5 h-3.5 shrink-0" />
                <span>Lanjut Malam {dayNumber + 1}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Lanjut Siang {phase === 'first_night' ? 1 : Math.max(2, dayNumber)}
                </span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setIsShowSheetOpen(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-[#231F30] dark:hover:bg-[#312B44] border border-purple-200 dark:border-[#39324D] text-purple-950 dark:text-[#F5EFE6] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-[#D4AF37]" />
            <span>Tunjuk Kartu</span>
          </button>

          <div className="grid grid-cols-3 gap-1 p-1 bg-purple-50 dark:bg-[#110F17] border border-purple-200 dark:border-[#292535] rounded-xl">
          <button
            type="button"
            onClick={() => handlePhaseSwitch('first_night')}
            className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              phase === 'first_night'
                ? 'bg-[#991B1B] text-white shadow'
                : 'text-slate-600 dark:text-[#B8B0A2] hover:text-purple-950 dark:hover:text-[#F5EFE6]'
            }`}
          >
            <Moon className="w-3.5 h-3.5 shrink-0" />
            <span>Malam 1</span>
          </button>

          <button
            type="button"
            onClick={() => handlePhaseSwitch('day')}
            className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              phase === 'day'
                ? 'bg-[#D4AF37] text-[#121016] shadow font-bold'
                : 'text-slate-600 dark:text-[#B8B0A2] hover:text-purple-950 dark:hover:text-[#F5EFE6]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 shrink-0" />
            <span>Siang Hari</span>
          </button>

          <button
            type="button"
            onClick={() => handlePhaseSwitch('other_night')}
            className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              phase === 'other_night'
                ? 'bg-[#991B1B] text-white shadow'
                : 'text-slate-600 dark:text-[#B8B0A2] hover:text-purple-950 dark:hover:text-[#F5EFE6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Malam Lanjut</span>
          </button>
          </div>
        </div>
      </div>

      {phase !== 'day' ? (
        /* ================= NIGHT NARRATOR VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail: Full Night Order Sequence */}
          <div className="lg:col-span-4 bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-[#F5EFE6]">
                Urutan Bangun Resmi
              </h3>
              <span className="font-mono text-xs text-slate-600 dark:text-[#A8A092] tabular-nums">
                {completedStepIds.length}/{nightSteps.length} Selesai
              </span>
            </div>

            {/* Smooth Animated Night Progress Gauge */}
            <div className="h-1.5 w-full rounded-full bg-purple-100 dark:bg-[#110F17] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#10B981]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>

            <div className="space-y-1.5">
              {nightSteps.map((step, idx) => {
                const isActive = idx === safeStepIdx;
                const isDone = completedStepIds.includes(step.id);

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setActiveStepIdx(idx);
                      setImpFeedback(null);
                    }}
                    className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-50 dark:bg-[#251F33] border-amber-500 dark:border-[#D4AF37] text-slate-900 dark:text-[#F5EFE6] shadow-sm'
                        : isDone
                        ? 'bg-emerald-50/50 dark:bg-[#14121B] border-emerald-200 dark:border-[#252131] text-slate-500 dark:text-[#8E8698]'
                        : 'bg-purple-50/40 dark:bg-[#14121B] border-purple-200 dark:border-[#262234] text-slate-700 dark:text-[#D6CFC2] hover:border-purple-400 dark:hover:border-[#3A344E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full font-mono text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums ${
                          isActive
                            ? 'bg-amber-500 text-white dark:bg-[#D4AF37] dark:text-[#121016]'
                            : 'bg-purple-100 dark:bg-[#1E1A2A] text-amber-800 dark:text-[#D4AF37]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {step.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#9C9486] truncate">
                          {step.subtitle}
                        </div>
                      </div>
                    </div>

                    {isDone && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-[#34D399] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Card: Active Storyteller Instruction & Automated Controls */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence mode="wait">
              {currentStep && (
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-purple-100 dark:border-[#292535]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-[#231E30] border border-purple-200 dark:border-[#3B3450] flex items-center justify-center shrink-0 shadow-sm">
                        {currentStep.roleId ? (
                          <CharacterToken
                            roleId={currentStep.roleId}
                            size="sm"
                            showSetupLeaf={false}
                          />
                        ) : currentStep.order === 999 ? (
                          <Sunrise className="w-6 h-6 text-amber-500 dark:text-[#FBBF24]" />
                        ) : (
                          <Moon className="w-6 h-6 text-indigo-600 dark:text-[#93C5FD]" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-amber-700 dark:text-[#D4AF37] tabular-nums">
                          LANGKAH {safeStepIdx + 1} DARI {nightSteps.length}
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F5EFE6]">
                          {currentStep.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B8B0A2]">
                          {currentStep.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* High-priority Drunk / Poisoned / Teensyville Warning */}
                  {currentStep.storytellerWarning && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-[#2D181C] border border-red-300 dark:border-[#EF4444]/60 text-xs sm:text-sm text-red-900 dark:text-[#FECACA] flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-[#F87171] shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">
                        {currentStep.storytellerWarning}
                      </p>
                    </div>
                  )}

                  {/* Main Narration & Physical Action Instruction */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-[#A8A092]">
                      Panduan Tindakan & Narasi Storyteller:
                    </div>
                    <p className="text-sm sm:text-base text-slate-900 dark:text-[#F5EFE6] leading-relaxed bg-purple-50/70 dark:bg-[#13101A] border border-purple-200 dark:border-[#292438] rounded-xl p-4">
                      {currentStep.instruction}
                    </p>
                  </div>

                  {/* Automated Calculation Helper */}
                  {currentStep.dynamicHelperText && (
                    <div className="p-4 rounded-xl bg-sky-50 dark:bg-[#162231] border border-sky-300 dark:border-[#38BDF8]/40 text-xs sm:text-sm text-sky-950 dark:text-[#BAE6FD] leading-relaxed">
                      <strong className="block text-sky-800 dark:text-[#7DD3FC] mb-0.5">
                        Kalkulasi Otomatis Sistem Grimoire:
                      </strong>
                      {currentStep.dynamicHelperText}
                    </div>
                  )}

                  {/* Direct Interactive Target Pickers for Night Actions */}
                  {currentStep.roleId === 'poisoner' && !currentStep.isDrunkPlayer && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-semibold text-red-800 dark:text-[#FCA5A5]">
                        Pilih Target Racun Poisoner Malam Ini (Otomatis Pasang Token Poisoned):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {players.map((p) => {
                          const hasPoison = isPlayerPoisoned(p);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onSetSingleReminderTarget('poisoned', p.id)}
                              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                hasPoison
                                  ? 'bg-[#991B1B] text-white border-[#EF4444]'
                                  : 'bg-purple-50 hover:bg-purple-100 text-slate-800 border-purple-200 dark:bg-[#1E1A2A] dark:hover:bg-[#2B253B] dark:text-[#EDE7DB] dark:border-[#342E46]'
                              }`}
                            >
                              #{p.seatIndex + 1} {p.name} {hasPoison ? '(Diracun)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentStep.roleId === 'monk' && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-semibold text-blue-900 dark:text-[#93C5FD]">
                        Pilih Pemain yang Dilindungi Monk (Selain Diri Sendiri):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {players
                          .filter((p) => p.id !== currentStep.playerId)
                          .map((p) => {
                            const isProt = p.reminders.some(
                              (r) => r.reminderId === 'protected'
                            );
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  if (!currentStep.isDrunkPlayer && !currentStep.isPoisonedPlayer) {
                                    onSetSingleReminderTarget('protected', p.id);
                                  }
                                }}
                                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                  isProt
                                    ? 'bg-[#1D4ED8] text-white border-[#60A5FA]'
                                    : 'bg-purple-50 hover:bg-purple-100 text-slate-800 border-purple-200 dark:bg-[#1E1A2A] dark:hover:bg-[#2B253B] dark:text-[#EDE7DB] dark:border-[#342E46]'
                                }`}
                              >
                                #{p.seatIndex + 1} {p.name} {isProt ? '(Protected)' : ''}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {currentStep.roleId === 'butler' && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-semibold text-blue-900 dark:text-[#93C5FD]">
                        Pilih Tuan (Master) yang Ditunjuk Butler:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {players
                          .filter((p) => p.id !== currentStep.playerId)
                          .map((p) => {
                            const isMaster = p.reminders.some(
                              (r) => r.reminderId === 'master'
                            );
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => onSetSingleReminderTarget('master', p.id)}
                                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                  isMaster
                                    ? 'bg-[#1D4ED8] text-white border-[#60A5FA]'
                                    : 'bg-purple-50 hover:bg-purple-100 text-slate-800 border-purple-200 dark:bg-[#1E1A2A] dark:hover:bg-[#2B253B] dark:text-[#EDE7DB] dark:border-[#342E46]'
                                }`}
                              >
                                #{p.seatIndex + 1} {p.name} {isMaster ? '(Master)' : ''}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {currentStep.roleId === 'imp' && phase === 'other_night' && (
                    <div className="pt-2 space-y-3">
                      <div className="text-xs font-semibold text-red-800 dark:text-[#FCA5A5]">
                        Pilih Target Serangan Imp Malam Ini (Sistem Otomatis Cek Monk, Soldier & Starpass):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {players.map((p) => {
                          const markedDie = p.reminders.some(
                            (r) => r.reminderId === 'die_imp'
                          );
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const res = onResolveImpAttack(p.id);
                                setImpFeedback(res.outcomeMessage);
                              }}
                              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                markedDie
                                  ? 'bg-[#991B1B] text-white border-[#EF4444]'
                                  : 'bg-purple-50 hover:bg-purple-100 text-slate-800 border-purple-200 dark:bg-[#1E1A2A] dark:hover:bg-[#2B253B] dark:text-[#EDE7DB] dark:border-[#342E46]'
                              }`}
                            >
                              #{p.seatIndex + 1} {p.name}
                              {p.id === currentStep.playerId ? ' (Bunuh Diri / Starpass)' : ''}
                              {markedDie ? ' [MATI]' : ''}
                            </button>
                          );
                        })}
                      </div>
                      {impFeedback && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#261822] border border-amber-300 dark:border-[#D4AF37]/50 text-xs text-amber-950 dark:text-[#FDE68A] font-medium">
                          {impFeedback}
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep.roleId === 'undertaker' && phase === 'other_night' && (() => {
                    const executedTarget = executedTodayPlayerId
                      ? players.find((p) => p.id === executedTodayPlayerId)
                      : players.find((p) =>
                          p.reminders.some((r) => r.reminderId === 'died_today')
                        );
                    const executedTrueRole = executedTarget
                      ? ROLE_MAP[executedTarget.trueRoleId]
                      : null;

                    return (
                      <div className="pt-2 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-purple-950 dark:text-[#E9D5FF]">
                            Pilih / Konfirmasi Korban Eksekusi Siang Tadi (Klik Nama Pemain):
                          </div>
                          {executedTarget && (
                            <button
                              type="button"
                              onClick={() => onSetSingleReminderTarget('died_today', '')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#221E2E] dark:hover:bg-[#312B42] text-[11px] font-semibold text-slate-700 dark:text-[#C4BCD0] cursor-pointer transition-colors"
                            >
                              Kosongkan Eksekusi
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {players.map((p) => {
                            const isExec = executedTarget?.id === p.id;
                            const isExecutedDead = !p.isAlive && p.deathCause === 'execution';
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                  onSetSingleReminderTarget('died_today', isExec ? '' : p.id)
                                }
                                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                  isExec
                                    ? 'bg-[#6D28D9] text-white border-[#A78BFA] shadow-sm'
                                    : isExecutedDead
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 dark:bg-[#2A2018] dark:hover:bg-[#382B20] dark:text-[#FDE68A] dark:border-[#D4AF37]/50'
                                    : 'bg-purple-50 hover:bg-purple-100 text-slate-800 border-purple-200 dark:bg-[#1E1A2A] dark:hover:bg-[#2B253B] dark:text-[#EDE7DB] dark:border-[#342E46]'
                                }`}
                              >
                                #{p.seatIndex + 1} {p.name}{' '}
                                {isExec
                                  ? '(Dieksekusi)'
                                  : !p.isAlive
                                  ? '(Mati)'
                                  : ''}
                              </button>
                            );
                          })}
                        </div>

                        {executedTarget && executedTrueRole ? (
                          <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-[#191524] border border-purple-200 dark:border-[#342E46] space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-slate-700 dark:text-[#D5CEBC]">
                                Korban:{' '}
                                <strong className="text-slate-950 dark:text-white">
                                  {executedTarget.name} (Kursi {executedTarget.seatIndex + 1})
                                </strong>{' '}
                                — Peran Asli:{' '}
                                <strong className="text-purple-900 dark:text-[#E9D5FF]">
                                  {executedTrueRole.name} ({executedTrueRole.indonesianName})
                                </strong>
                              </span>
                            </div>

                            {(executedTarget.trueRoleId === 'spy' ||
                              executedTarget.trueRoleId === 'recluse' ||
                              currentStep.isDrunkPlayer ||
                              currentStep.isPoisonedPlayer) && (
                              <p className="text-[11px] text-amber-800 dark:text-[#FDE68A]">
                                {currentStep.isDrunkPlayer || currentStep.isPoisonedPlayer
                                  ? 'Catatan Storyteller: Undertaker sedang Mabuk/Diracun — Anda boleh memakai pemilih token di bawah untuk menampilkan peran palsu.'
                                  : `Catatan Misregistration: Korban adalah ${executedTrueRole.name}, sehingga Anda boleh menunjuk peran lain via pemilih token di bawah.`}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                onShowSilentCard({
                                  heading: 'KARAKTER PEMAIN YANG DIEKSEKUSI',
                                  subheading: 'Eksekusi siang hari',
                                  roleIds: [executedTrueRole.id],
                                })
                              }
                              className="brass-sheen-btn w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-105 text-[#121016] text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                            >
                              <Eye className="w-4 h-4 shrink-0" />
                              <span>
                                Tunjukkan Token {executedTrueRole.name} ke Undertaker (Layar Penuh)
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#191622] border border-purple-200/80 dark:border-[#2C263B] text-xs text-slate-600 dark:text-[#A8A092]">
                            Belum ada korban eksekusi dipilih. Klik salah satu pemain di atas jika siang tadi ada eksekusi, atau biarkan kosong dan lewati membangunkan Undertaker.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Silent Fullscreen Card Quick Helpers inside Narrator */}
                  <div className="pt-3 border-t border-purple-100 dark:border-[#292535] space-y-3">
                    <div className="text-xs font-medium text-slate-600 dark:text-[#A8A092]">
                      Alat Bantu Layar Tunjuk Bisu (Tampilkan ke Pemain Tanpa Bicara):
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {currentStep.id === 'first-minion-info' && (
                        players.length >= 7 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const demon = players.find(
                                (p) => ROLE_MAP[p.trueRoleId]?.team === 'demon'
                              );
                              if (!demon) return;
                              onShowSilentCard({
                                heading: 'INI ADALAH DEMON ANDA',
                                subheading: 'Storyteller menunjuk ke arah pemain Demon ini',
                                roleIds: [demon.trueRoleId],
                              });
                            }}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Layar Info Demon</span>
                          </button>
                        ) : (
                          <span className="text-xs text-red-800 dark:text-[#FCA5A5] italic px-2.5 py-1 bg-red-50 dark:bg-[#1C1318] rounded-lg border border-red-200 dark:border-[#DC2626]/30">
                            Permainan di bawah 7 pemain: Minion tidak dibangunkan untuk info Demon.
                          </span>
                        )
                      )}

                      {currentStep.id === 'first-demon-info' && (
                        <button
                          type="button"
                          onClick={() =>
                            onShowSilentCard({
                              heading: '3 KARAKTER INI TIDAK DIMAINKAN',
                              subheading:
                                players.length < 7
                                  ? 'Opsi Bluff Aman untuk Demon (Under 7: Info Minion Disembunyikan)'
                                  : 'Opsi Bluff Aman untuk Demon',
                              roleIds: demonBluffIds,
                            })
                          }
                          className="brass-sheen-btn min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Layar 3 Bluff Demon</span>
                        </button>
                      )}

                      {/* Quick Number Cards 0, 1, 2, 3 */}
                      {['0', '1', '2', '3'].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            onShowSilentCard({
                              heading: 'INFORMASI ANGKA MALAM INI',
                              bigText: num,
                            })
                          }
                          className="min-h-[40px] min-w-[42px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 dark:bg-[#221E2E] dark:hover:bg-[#302A40] dark:border-[#38324B] dark:text-[#FDE68A] font-mono text-xs font-bold cursor-pointer transition-colors"
                        >
                          Angka {num}
                        </button>
                      ))}

                      {/* Quick Role Token Show Selector */}
                      <div className="flex items-center gap-1.5">
                        <select
                          aria-label="Pilih token karakter untuk ditampilkan di layar penuh"
                          value={cardRoleToShow}
                          onChange={(e) => setCardRoleToShow(e.target.value)}
                          className="min-h-[40px] rounded-xl bg-purple-50 dark:bg-[#13111A] border border-purple-200 dark:border-[#322D42] px-2.5 py-1.5 text-xs text-slate-900 dark:text-[#EDE7DB]"
                        >
                          {ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                              Token: {r.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onShowSilentCard({
                              heading: 'KARAKTER INI ADALAH',
                              roleIds: [cardRoleToShow],
                            })
                          }
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-950 dark:bg-[#221E2E] dark:hover:bg-[#302A40] dark:border-[#38324B] dark:text-[#EDE7DB] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-[#D4AF37]" />
                          <span>Tunjuk Token</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsShowSheetOpen(true)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 dark:bg-[#2B2216] dark:hover:bg-[#3B2E1E] dark:border-[#D4AF37]/40 dark:text-[#FDE68A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Semua Kartu Info &amp; Pesan</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Custom Night Note Bar */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={quickCustomNote}
                        onChange={(e) => setQuickCustomNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && quickCustomNote.trim()) {
                            e.preventDefault();
                            onShowSilentCard({
                              heading: 'PESAN STORYTELLER',
                              bigText: quickCustomNote.trim(),
                            });
                          }
                        }}
                        placeholder="Ketik pesan / info malam kustom untuk ditunjukkan (mis. Pilih 1 Pemain)..."
                        className="flex-1 min-h-[38px] rounded-xl bg-purple-50 dark:bg-[#13111A] border border-purple-200 dark:border-[#322D42] px-3 py-1.5 text-xs text-slate-900 dark:text-[#EDE7DB] placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        disabled={!quickCustomNote.trim()}
                        onClick={() => {
                          if (!quickCustomNote.trim()) return;
                          onShowSilentCard({
                            heading: 'PESAN STORYTELLER',
                            bigText: quickCustomNote.trim(),
                          });
                        }}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] disabled:opacity-40 text-[#121016] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Tunjuk Catatan</span>
                      </button>
                    </div>
                  </div>

                  {/* Step Navigation Footer */}
                  <div className="pt-4 border-t border-purple-100 dark:border-[#292535] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (safeStepIdx > 0) setActiveStepIdx(safeStepIdx - 1);
                      }}
                      disabled={safeStepIdx === 0}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-40 text-purple-950 dark:bg-[#221E2E] dark:hover:bg-[#2F2A40] dark:text-[#EDE7DB] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Langkah Sebelumnya</span>
                    </button>

                    {safeStepIdx < nightSteps.length - 1 ? (
                      <button
                        type="button"
                        onClick={markStepAndAdvance}
                        className="brass-sheen-btn min-h-[46px] px-6 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>Tandai Selesai & Langkah Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStepIdx(0);
                          setCompletedStepIds([]);
                          onTransitionNightToDay();
                        }}
                        className="brass-sheen-btn min-h-[46px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                      >
                        <Sun className="w-4 h-4" />
                        <span>Selesaikan Malam & Masuk Siang Hari</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ================= DAY PHASE VIEW ================= */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Morning Announcement & Nomination Execution Tracker */}
          <div className="lg:col-span-7 bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="space-y-2 pb-4 border-b border-purple-100 dark:border-[#292535]">
              <div className="text-xs font-mono font-bold text-amber-700 dark:text-[#D4AF37]">
                PENGUMUMAN PAGI HARI KE-{dayNumber}
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-[#F5EFE6]">
                Laporan Fajar & Sidang Warga
              </h3>
              <p className="text-sm text-slate-800 dark:text-[#DED7CA] bg-purple-50/70 dark:bg-[#13101A] border border-purple-200 dark:border-[#292535] rounded-xl p-4 leading-relaxed">
                {dayNumber === 1
                  ? '"Selamat pagi warga Ravenswood Bluff! Tidak ada korban jiwa pada malam pertama. Silakan berdiskusi secara terbuka maupun tertutup sebelum sesi nominasi dibuka."'
                  : lastNightDeaths.length > 0
                  ? `"Selamat pagi! Tadi malam, warga menemukan ${lastNightDeaths.join(
                      ' dan '
                    )} tewas secara misterius. Mereka kini tidak lagi bisa menominasikan, namun masih menyimpan 1 Suara Hantu."`
                  : '"Selamat pagi! Malam berlalu dengan sunyi dan TIDAK ADA warga yang mati tadi malam!"'}
              </p>
            </div>

            {/* Majority Vote Stats */}
            <div className="grid grid-cols-3 gap-3 text-center font-mono tabular-nums">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-[#13101A] border border-emerald-200 dark:border-[#292535]">
                <div className="text-2xl font-bold text-emerald-700 dark:text-[#6EE7B7]">
                  {voteStats.aliveCount}
                </div>
                <div className="text-[11px] font-sans text-slate-600 dark:text-[#A8A092]">Warga Hidup</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-[#13101A] border border-amber-300 dark:border-[#D4AF37]/40">
                <div className="text-2xl font-bold text-amber-900 dark:text-[#FDE68A]">
                  {voteStats.votesNeeded}
                </div>
                <div className="text-[11px] font-sans text-amber-950 dark:text-[#D6CFC2]">
                  Min. Suara Eksekusi
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#13101A] border border-blue-200 dark:border-[#292535]">
                <div className="text-2xl font-bold text-blue-700 dark:text-[#93C5FD]">
                  {voteStats.ghostVotesRemaining}
                </div>
                <div className="text-[11px] font-sans text-slate-600 dark:text-[#A8A092]">Suara Hantu</div>
              </div>
            </div>

            {/* Record Execution of the Day */}
            <div className="space-y-3 pt-2">
              <label
                htmlFor="day-execution-select"
                className="block text-sm font-semibold text-slate-900 dark:text-[#F5EFE6]"
              >
                Catat Eksekusi Warga Hari Ini (Otomatis Update Undertaker & Cek Kemenangan):
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <select
                  id="day-execution-select"
                  value={selectedExecutionId}
                  onChange={(e) => setSelectedExecutionId(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl bg-purple-50 dark:bg-[#13101A] border border-purple-200 dark:border-[#342E46] px-3 py-2 text-sm text-slate-900 dark:text-[#F5EFE6]"
                >
                  <option value="">-- Pilih Pemain yang Dieksekusi (Atau Kosongkan) --</option>
                  {alivePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      Kursi {p.seatIndex + 1}: {p.name} (Asli: {ROLE_MAP[p.trueRoleId]?.name})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedExecutionId) {
                      onExecutePlayerInDay(null);
                      setDayActionResult(
                        'Sidang ditutup tanpa eksekusi warga hari ini.'
                      );
                    } else {
                      const target = players.find((p) => p.id === selectedExecutionId);
                      onExecutePlayerInDay(selectedExecutionId);
                      setDayActionResult(
                        `${target?.name ?? 'Pemain'} resmi dieksekusi, ditandai Mati, dan diberi token "Executed" untuk info Undertaker malam nanti.`
                      );
                      setSelectedExecutionId('');
                    }
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
                >
                  <Gavel className="w-4 h-4" />
                  <span>Konfirmasi Eksekusi</span>
                </button>
              </div>

              {executedTodayPlayerId && (
                <div className="text-xs font-semibold text-amber-800 dark:text-[#FDE68A]">
                  Tercatat dieksekusi hari ini:{' '}
                  <strong>
                    {players.find((p) => p.id === executedTodayPlayerId)?.name}
                  </strong>
                </div>
              )}
            </div>

            {dayActionResult && (
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-[#182433] border border-sky-300 dark:border-[#38BDF8]/40 text-xs sm:text-sm text-sky-950 dark:text-[#BAE6FD]">
                {dayActionResult}
              </div>
            )}

            <div className="pt-4 border-t border-purple-100 dark:border-[#292535] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDayActionResult(null);
                  onTransitionDayToNextNight();
                }}
                className="brass-sheen-btn w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <Moon className="w-4 h-4" />
                <span>Akhiri Siang & Mulai Malam ke-{dayNumber + 1}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Storyteller Timer & Day Abilities Helper (Slayer & Virgin) */}
          <div className="lg:col-span-5 space-y-5">
            {onTimerAction && (
              <GameTimerWidget
                timer={dayTimer}
                phaseStartedAt={phaseStartedAt}
                onAction={onTimerAction}
                variant="panel"
              />
            )}

            {/* Slayer Day Action */}
            <div className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-5 space-y-3 shadow-lg">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-[#F5EFE6] flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-blue-600 dark:text-[#60A5FA]" />
                <span>Uji Klaim Tembakan Slayer</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#A8A092]">
                Jika ada pemain mengklaim Slayer di siang hari dan menembak seseorang, cek otomatis hasilnya di sini (memperhitungkan Drunk, Poisoned, dan bluff).
              </p>

              <div className="space-y-2">
                <select
                  aria-label="Pilih pemain yang mengklaim Slayer"
                  value={slayerActorId}
                  onChange={(e) => setSlayerActorId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-purple-50 dark:bg-[#13101A] border border-purple-200 dark:border-[#322D42] px-3 py-1.5 text-xs text-slate-900 dark:text-[#EDE7DB]"
                >
                  <option value="">Pilih Pemain yang Menembak (Klaim Slayer)...</option>
                  {alivePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.seatIndex + 1} {p.name} ({ROLE_MAP[p.trueRoleId]?.name})
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Pilih target tembakan Slayer"
                  value={slayerTargetId}
                  onChange={(e) => setSlayerTargetId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-purple-50 dark:bg-[#13101A] border border-purple-200 dark:border-[#322D42] px-3 py-1.5 text-xs text-slate-900 dark:text-[#EDE7DB]"
                >
                  <option value="">Pilih Target yang Ditembak...</option>
                  {alivePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.seatIndex + 1} {p.name} ({ROLE_MAP[p.trueRoleId]?.name})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!slayerActorId || !slayerTargetId}
                  onClick={() => {
                    const msg = onTriggerSlayerShot(slayerActorId, slayerTargetId);
                    setDayActionResult(msg);
                  }}
                  className="w-full min-h-[42px] rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-40 border border-purple-300 text-purple-950 dark:bg-[#221E2E] dark:hover:bg-[#302A42] dark:border-[#3B3450] dark:text-[#F5EFE6] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Proses Tembakan Slayer
                </button>
              </div>
            </div>

            {/* Virgin First Nomination Helper */}
            <div className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-5 space-y-3 shadow-lg">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-[#F5EFE6] flex items-center gap-2">
                <Gem className="w-4 h-4 text-blue-600 dark:text-[#60A5FA]" />
                <span>Uji Nominasi Pertama Virgin</span>
              </h3>
              {virginSeat ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-700 dark:text-[#C8C0B3]">
                    Pemegang token Virgin saat ini: <strong>{virginSeat.name}</strong> (Kursi{' '}
                    {virginSeat.seatIndex + 1}
                    {virginSeat.trueRoleId === 'drunk' ? ' — Sebenarnya Drunk!' : ''}). Pilih siapa yang menominasikan {virginSeat.name}:
                  </p>
                  <select
                    aria-label="Pilih pemain yang menominasikan Virgin"
                    value={virginNominatorId}
                    onChange={(e) => setVirginNominatorId(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl bg-purple-50 dark:bg-[#13101A] border border-purple-200 dark:border-[#322D42] px-3 py-1.5 text-xs text-slate-900 dark:text-[#EDE7DB]"
                  >
                    <option value="">Pilih Penominasi...</option>
                    {alivePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.seatIndex + 1} {p.name} (Asli: {ROLE_MAP[p.trueRoleId]?.name})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!virginNominatorId}
                    onClick={() => {
                      const msg = onTriggerVirginNomination(
                        virginSeat.id,
                        virginNominatorId
                      );
                      setDayActionResult(msg);
                    }}
                    className="w-full min-h-[42px] rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-40 border border-purple-300 text-purple-950 dark:bg-[#221E2E] dark:hover:bg-[#302A42] dark:border-[#3B3450] dark:text-[#F5EFE6] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cek Efek Nominasi Virgin
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-[#8E8698]">
                  Tidak ada Virgin yang belum terpakai dalam permainan saat ini.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <ShowSheetModal
        isOpen={isShowSheetOpen}
        players={players}
        demonBluffIds={demonBluffIds}
        initialRoleId={cardRoleToShow}
        onClose={() => setIsShowSheetOpen(false)}
      />
    </div>
  );
}
