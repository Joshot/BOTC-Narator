'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Gavel,
  Gem,
  Moon,
  ShieldAlert,
  Sparkles,
  Sun,
  Sunrise,
} from 'lucide-react';
import { ROLE_MAP, ROLES } from '@/lib/botc-data';
import {
  GamePhase,
  PlayerSeat,
  buildNightOrder,
  calculateVoteThreshold,
  isPlayerPoisoned,
} from '@/lib/botc-engine';
import { RoleGlyph } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';

interface NarratorViewProps {
  phase: GamePhase;
  dayNumber: number;
  players: PlayerSeat[];
  executedTodayPlayerId: string | null;
  demonBluffIds: string[];
  lastNightDeaths: string[];
  gameAlertBanner: string | null;
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

  return (
    <div className="space-y-6">
      {/* Phase Cycle Navigation Bar */}
      <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5 px-1">
          <div className="text-xs text-[#C8A951] font-medium">
            Siklus Otomasi Narator Storyteller
          </div>
          <h2 className="font-display text-lg font-bold text-[#F5EFE6]">
            {phase === 'first_night'
              ? 'Malam Pertama (First Night)'
              : phase === 'day'
              ? `Fase Siang Hari ke-${dayNumber}`
              : `Malam Berikutnya (Malam ke-${dayNumber + 1})`}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#110F17] border border-[#292535] rounded-xl">
          <button
            type="button"
            onClick={() => handlePhaseSwitch('first_night')}
            className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              phase === 'first_night'
                ? 'bg-[#991B1B] text-white'
                : 'text-[#B8B0A2] hover:text-[#F5EFE6]'
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
                ? 'bg-[#D4AF37] text-[#121016]'
                : 'text-[#B8B0A2] hover:text-[#F5EFE6]'
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
                ? 'bg-[#991B1B] text-white'
                : 'text-[#B8B0A2] hover:text-[#F5EFE6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Malam Lanjut</span>
          </button>
        </div>
      </div>

      {/* Game Victory / Critical Event Alert Banner */}
      {gameAlertBanner && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#2B171B] border border-[#EF4444]/70 text-sm text-[#FECACA] flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-display text-base text-white">
              Pemberitahuan Penting Storyteller
            </strong>
            <p>{gameAlertBanner}</p>
          </div>
        </div>
      )}

      {phase !== 'day' ? (
        /* ================= NIGHT NARRATOR VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail: Full Night Order Sequence */}
          <div className="lg:col-span-4 bg-[#181520] border border-[#2A2636] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-bold text-[#F5EFE6]">
                Urutan Bangun Resmi
              </h3>
              <span className="font-mono text-xs text-[#A8A092] tabular-nums">
                {completedStepIds.length}/{nightSteps.length} Selesai
              </span>
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
                    className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#251F33] border-[#D4AF37] text-[#F5EFE6]'
                        : isDone
                        ? 'bg-[#14121B] border-[#252131] text-[#8E8698]'
                        : 'bg-[#14121B] border-[#262234] text-[#D6CFC2] hover:border-[#3A344E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[#1E1A2A] font-mono text-[11px] font-bold text-[#D4AF37] flex items-center justify-center shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {step.title}
                        </div>
                        <div className="text-[11px] text-[#9C9486] truncate">
                          {step.subtitle}
                        </div>
                      </div>
                    </div>

                    {isDone && (
                      <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Card: Active Storyteller Instruction & Automated Controls */}
          <div className="lg:col-span-8 space-y-4">
            {currentStep && (
              <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 sm:p-7 space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#292535]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#231E30] border border-[#3B3450] flex items-center justify-center shrink-0">
                      {currentStep.roleId ? (
                        <img
                          src={`/tokens/${currentStep.roleId}.png`}
                          alt={currentStep.roleId}
                          className="w-10 h-10 rounded-full object-contain filter drop-shadow shrink-0"
                        />
                      ) : currentStep.order === 999 ? (
                        <Sunrise className="w-6 h-6 text-[#FBBF24]" />
                      ) : (
                        <Moon className="w-6 h-6 text-[#93C5FD]" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-[#D4AF37] tabular-nums">
                        LANGKAH {safeStepIdx + 1} DARI {nightSteps.length}
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5EFE6]">
                        {currentStep.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#B8B0A2]">
                        {currentStep.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* High-priority Drunk / Poisoned / Teensyville Warning */}
                {currentStep.storytellerWarning && (
                  <div className="p-4 rounded-xl bg-[#2D181C] border border-[#EF4444]/60 text-xs sm:text-sm text-[#FECACA] flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">
                      {currentStep.storytellerWarning}
                    </p>
                  </div>
                )}

                {/* Main Narration & Physical Action Instruction */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#A8A092]">
                    Panduan Tindakan & Narasi Storyteller:
                  </div>
                  <p className="text-sm sm:text-base text-[#F5EFE6] leading-relaxed bg-[#13101A] border border-[#292438] rounded-xl p-4">
                    {currentStep.instruction}
                  </p>
                </div>

                {/* Automated Calculation Helper */}
                {currentStep.dynamicHelperText && (
                  <div className="p-4 rounded-xl bg-[#162231] border border-[#38BDF8]/40 text-xs sm:text-sm text-[#BAE6FD] leading-relaxed">
                    <strong className="block text-[#7DD3FC] mb-0.5">
                      Kalkulasi Otomatis Sistem Grimoire:
                    </strong>
                    {currentStep.dynamicHelperText}
                  </div>
                )}

                {/* Direct Interactive Target Pickers for Night Actions */}
                {currentStep.roleId === 'poisoner' && !currentStep.isDrunkPlayer && (
                  <div className="pt-2 space-y-2">
                    <div className="text-xs font-semibold text-[#FCA5A5]">
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
                                : 'bg-[#1E1A2A] hover:bg-[#2B253B] text-[#EDE7DB] border-[#342E46]'
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
                    <div className="text-xs font-semibold text-[#93C5FD]">
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
                                  : 'bg-[#1E1A2A] hover:bg-[#2B253B] text-[#EDE7DB] border-[#342E46]'
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
                    <div className="text-xs font-semibold text-[#93C5FD]">
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
                                  : 'bg-[#1E1A2A] hover:bg-[#2B253B] text-[#EDE7DB] border-[#342E46]'
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
                    <div className="text-xs font-semibold text-[#FCA5A5]">
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
                                : 'bg-[#1E1A2A] hover:bg-[#2B253B] text-[#EDE7DB] border-[#342E46]'
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
                      <div className="p-3 rounded-xl bg-[#261822] border border-[#D4AF37]/50 text-xs text-[#FDE68A]">
                        {impFeedback}
                      </div>
                    )}
                  </div>
                )}

                {/* Silent Fullscreen Card Quick Helpers inside Narrator */}
                <div className="pt-3 border-t border-[#292535] space-y-3">
                  <div className="text-xs font-medium text-[#A8A092]">
                    Alat Bantu Layar Tunjuk Bisu (Tampilkan ke Pemain Tanpa Bicara):
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStep.id === 'first-minion-info' && (
                      <button
                        type="button"
                        onClick={() => {
                          const demon = players.find(
                            (p) => ROLE_MAP[p.trueRoleId]?.team === 'demon'
                          );
                          if (!demon) return;
                          onShowSilentCard({
                            heading: 'INI ADALAH DEMON ANDA',
                            subheading: `${demon.name} (Kursi ${demon.seatIndex + 1})`,
                            roleIds: [demon.trueRoleId],
                          });
                        }}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#991B1B] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Layar Info Demon</span>
                      </button>
                    )}

                    {currentStep.id === 'first-demon-info' && (
                      <button
                        type="button"
                        onClick={() =>
                          onShowSilentCard({
                            heading: '3 KARAKTER INI TIDAK DIMAINKAN',
                            subheading: 'Opsi Bluff Aman untuk Demon',
                            roleIds: demonBluffIds,
                          })
                        }
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#121016] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
                        className="min-h-[40px] min-w-[42px] px-3 py-1.5 rounded-xl bg-[#221E2E] hover:bg-[#302A40] border border-[#38324B] font-mono text-xs font-bold text-[#FDE68A] cursor-pointer"
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
                        className="min-h-[40px] rounded-xl bg-[#13111A] border border-[#322D42] px-2.5 py-1.5 text-xs text-[#EDE7DB]"
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
                            heading: 'KARAKTER INI ADALAH:',
                            roleIds: [cardRoleToShow],
                          })
                        }
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#221E2E] hover:bg-[#302A40] border border-[#38324B] text-xs font-semibold text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Tunjuk Token</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step Navigation Footer */}
                <div className="pt-4 border-t border-[#292535] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (safeStepIdx > 0) setActiveStepIdx(safeStepIdx - 1);
                    }}
                    disabled={safeStepIdx === 0}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#221E2E] hover:bg-[#2F2A40] disabled:opacity-40 text-xs sm:text-sm font-semibold text-[#EDE7DB] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Langkah Sebelumnya</span>
                  </button>

                  {safeStepIdx < nightSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={markStepAndAdvance}
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Sun className="w-4 h-4" />
                      <span>Selesaikan Malam & Masuk Siang Hari</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= DAY PHASE VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Morning Announcement & Nomination Execution Tracker */}
          <div className="lg:col-span-7 bg-[#181520] border border-[#2A2636] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-2 pb-4 border-b border-[#292535]">
              <div className="text-xs font-mono text-[#D4AF37]">
                PENGUMUMAN PAGI HARI KE-{dayNumber}
              </div>
              <h3 className="font-display text-xl font-bold text-[#F5EFE6]">
                Laporan Fajar & Sidang Warga
              </h3>
              <p className="text-sm text-[#DED7CA] bg-[#13101A] border border-[#292535] rounded-xl p-4 leading-relaxed">
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
              <div className="p-3 rounded-xl bg-[#13101A] border border-[#292535]">
                <div className="text-2xl font-bold text-[#6EE7B7]">
                  {voteStats.aliveCount}
                </div>
                <div className="text-[11px] font-sans text-[#A8A092]">Warga Hidup</div>
              </div>
              <div className="p-3 rounded-xl bg-[#13101A] border border-[#D4AF37]/40">
                <div className="text-2xl font-bold text-[#FDE68A]">
                  {voteStats.votesNeeded}
                </div>
                <div className="text-[11px] font-sans text-[#D6CFC2]">
                  Min. Suara Eksekusi
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#13101A] border border-[#292535]">
                <div className="text-2xl font-bold text-[#93C5FD]">
                  {voteStats.ghostVotesRemaining}
                </div>
                <div className="text-[11px] font-sans text-[#A8A092]">Suara Hantu</div>
              </div>
            </div>

            {/* Record Execution of the Day */}
            <div className="space-y-3 pt-2">
              <label
                htmlFor="day-execution-select"
                className="block text-sm font-semibold text-[#F5EFE6]"
              >
                Catat Eksekusi Warga Hari Ini (Otomatis Update Undertaker & Cek Kemenangan):
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <select
                  id="day-execution-select"
                  value={selectedExecutionId}
                  onChange={(e) => setSelectedExecutionId(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#13101A] border border-[#342E46] px-3 py-2 text-sm text-[#F5EFE6]"
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
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Gavel className="w-4 h-4" />
                  <span>Konfirmasi Eksekusi</span>
                </button>
              </div>

              {executedTodayPlayerId && (
                <div className="text-xs text-[#FDE68A]">
                  Tercatat dieksekusi hari ini:{' '}
                  <strong>
                    {players.find((p) => p.id === executedTodayPlayerId)?.name}
                  </strong>
                </div>
              )}
            </div>

            {dayActionResult && (
              <div className="p-3.5 rounded-xl bg-[#182433] border border-[#38BDF8]/40 text-xs sm:text-sm text-[#BAE6FD]">
                {dayActionResult}
              </div>
            )}

            <div className="pt-4 border-t border-[#292535] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDayActionResult(null);
                  onTransitionDayToNextNight();
                }}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Moon className="w-4 h-4" />
                <span>Akhiri Siang & Mulai Malam ke-{dayNumber + 1}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Day Abilities Helper (Slayer & Virgin) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Slayer Day Action */}
            <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-base font-bold text-[#F5EFE6] flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#60A5FA]" />
                <span>Uji Klaim Tembakan Slayer</span>
              </h3>
              <p className="text-xs text-[#A8A092]">
                Jika ada pemain mengklaim Slayer di siang hari dan menembak seseorang, cek otomatis hasilnya di sini (memperhitungkan Drunk, Poisoned, dan bluff).
              </p>

              <div className="space-y-2">
                <select
                  aria-label="Pilih pemain yang mengklaim Slayer"
                  value={slayerActorId}
                  onChange={(e) => setSlayerActorId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-[#13101A] border border-[#322D42] px-3 py-1.5 text-xs text-[#EDE7DB]"
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
                  className="w-full min-h-[42px] rounded-xl bg-[#13101A] border border-[#322D42] px-3 py-1.5 text-xs text-[#EDE7DB]"
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
                  className="w-full min-h-[42px] rounded-xl bg-[#221E2E] hover:bg-[#302A42] disabled:opacity-40 border border-[#3B3450] text-xs font-semibold text-[#F5EFE6] cursor-pointer"
                >
                  Proses Tembakan Slayer
                </button>
              </div>
            </div>

            {/* Virgin First Nomination Helper */}
            <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-base font-bold text-[#F5EFE6] flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#60A5FA]" />
                <span>Uji Nominasi Pertama Virgin</span>
              </h3>
              {virginSeat ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-[#C8C0B3]">
                    Pemegang token Virgin saat ini: <strong>{virginSeat.name}</strong> (Kursi{' '}
                    {virginSeat.seatIndex + 1}
                    {virginSeat.trueRoleId === 'drunk' ? ' — Sebenarnya Drunk!' : ''}). Pilih siapa yang menominasikan {virginSeat.name}:
                  </p>
                  <select
                    aria-label="Pilih pemain yang menominasikan Virgin"
                    value={virginNominatorId}
                    onChange={(e) => setVirginNominatorId(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl bg-[#13101A] border border-[#322D42] px-3 py-1.5 text-xs text-[#EDE7DB]"
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
                    className="w-full min-h-[42px] rounded-xl bg-[#221E2E] hover:bg-[#302A42] disabled:opacity-40 border border-[#3B3450] text-xs font-semibold text-[#F5EFE6] cursor-pointer"
                  >
                    Cek Efek Nominasi Virgin
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#8E8698]">
                  Tidak ada Virgin yang belum terpakai dalam permainan saat ini.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
