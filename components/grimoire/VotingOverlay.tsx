'use client';

import React, { useState } from 'react';
import { Check, Gavel, RotateCcw, Scale, ShieldAlert, X } from 'lucide-react';
import {
  DayNomination,
  PlayerSeat,
  calculateNominationThresholds,
  canSeatNominate,
  resolveVoteTieStatus,
} from '@/lib/botc-engine';
import { BOARD_CHROME, GRIMOIRE_PALETTE } from '@/lib/grimoire-theme';
import { RingGeometry, voteArc } from '@/lib/ring-geometry';

/**
 * Clockwork brass SVG sweep rendered directly over the Grimoire ring during an active vote.
 */
export function VotingArcSvg({
  ring,
  players,
  nomination,
  nominationsToday = [],
}: {
  ring: RingGeometry;
  players: PlayerSeat[];
  nomination: DayNomination | null;
  nominationsToday?: DayNomination[];
}) {
  if (!nomination) return null;
  const nomineeIdx = players.findIndex((p) => p.id === nomination.nomineeId);
  if (nomineeIdx < 0 || !ring.positions[nomineeIdx]) return null;

  // Find furthest clockwise voter around the ring starting from nomineeIdx
  let furthestIdx: number | null = null;
  let bestSteps = -1;
  const n = players.length;

  for (const vid of nomination.voterIds) {
    const vIdx = players.findIndex((p) => p.id === vid);
    if (vIdx < 0) continue;
    let steps = (vIdx - nomineeIdx + n) % n;
    if (steps === 0) steps = n; // nominee voted last in circle
    if (steps > bestSteps) {
      bestSteps = steps;
      furthestIdx = vIdx;
    }
  }

  const arc = voteArc(
    ring.band,
    ring.rx,
    ring.ry,
    ring.size,
    n,
    ring.positions[nomineeIdx],
    furthestIdx !== null ? ring.positions[furthestIdx] : undefined
  );
  if (!arc) return null;

  const threshold = calculateNominationThresholds(
    players,
    nominationsToday.filter((item) => item.id !== nomination.id)
  ).execute;
  const isEnough = nomination.voteTotal >= threshold;

  return (
    <svg
      width={ring.band.width}
      height={ring.band.height}
      viewBox={`0 0 ${ring.band.width} ${ring.band.height}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
    >
      {/* Dim track circle */}
      <path
        d={arc.path}
        fill="none"
        stroke="rgba(201, 150, 58, 0.16)"
        strokeWidth={2.5}
        strokeDasharray="4 4"
      />
      {/* Active swept arc */}
      <path
        d={arc.path}
        fill="none"
        stroke={isEnough ? '#e0574b' : GRIMOIRE_PALETTE.accent}
        strokeWidth={3.5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${arc.lit} 1`}
        style={{ transition: 'stroke-dasharray 240ms ease, stroke 200ms ease' }}
      />
      {/* Brass clock hand arrow tip */}
      <g
        transform={`translate(${arc.arrow.x.toFixed(1)}, ${arc.arrow.y.toFixed(1)}) rotate(${arc.arrow.angle.toFixed(1)})`}
      >
        <polygon
          points="7,0 -5,-4.5 -3,0 -5,4.5"
          fill={isEnough ? '#e0574b' : GRIMOIRE_PALETTE.accent}
        />
      </g>
    </svg>
  );
}

interface DayNominationControlsProps {
  players: PlayerSeat[];
  nominationsToday: DayNomination[];
  activeNomination: DayNomination | null;
  pendingNomineeId: string | null;
  onSelectNomineeForSetup: (playerId: string | null) => void;
  onStartNomination: (nominatorId: string, nomineeId: string) => void;
  onToggleVoter: (nominationId: string, seatId: string) => void;
  onResetVotes: (nominationId: string) => void;
  onMarkExecution: (nominationId: string, mark: boolean) => void;
  onDone?: (nominationId: string) => void;
  onCancelNomination: (nominationId: string) => void;
}

/**
 * Compact day-summary card shown inside the Grimoire ring center when nominations exist
 * today and no active vote sheet is currently expanded.
 */
export function DayNominationsSummary({
  players,
  nominationsToday,
  onReopenNomination,
  onCancelNomination,
}: {
  players: PlayerSeat[];
  nominationsToday: DayNomination[];
  onReopenNomination: (nominationId: string) => void;
  onCancelNomination: (nominationId: string) => void;
}) {
  const validNominations = nominationsToday.filter((n) => !n.cancelled);
  if (validNominations.length === 0) return null;

  const tieStatus = resolveVoteTieStatus(validNominations, players);
  const onBlockPlayer = tieStatus.onBlockNomination
    ? players.find((p) => p.id === tieStatus.onBlockNomination?.nomineeId) ?? null
    : null;
  const tiedNames = tieStatus.tiedNominationIds
    .map((id) => validNominations.find((n) => n.id === id))
    .map((n) => players.find((p) => p.id === n?.nomineeId)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="w-full max-w-[276px] rounded-2xl px-2.5 py-2 text-[11px] backdrop-blur-md space-y-1.5"
      style={{
        backgroundColor: BOARD_CHROME.voteSurface,
        border: `1px solid ${BOARD_CHROME.voteEdge}`,
        color: GRIMOIRE_PALETTE.text,
      }}
    >
      {tieStatus.isTie ? (
        <div className="px-2 py-1 rounded-xl bg-red-950/60 border border-red-400/50 text-red-200 text-[10px] font-bold leading-snug">
          SERI ({tieStatus.highestVotes} suara): {tiedNames || '2+ pemain'} — Tidak ada eksekusi
        </div>
      ) : onBlockPlayer && tieStatus.onBlockNomination ? (
        <div className="px-2 py-1 rounded-xl bg-[#b03a2e]/25 border border-[#e0574b]/50 text-[#f8d7d3] text-[10px] font-bold leading-snug">
          Terancam Eksekusi: {onBlockPlayer.name} ({tieStatus.onBlockNomination.voteTotal} suara)
        </div>
      ) : (
        <div className="text-[10px] font-mono text-[#a89f8c]">
          {validNominations.length} nominasi tercatat · Belum ada calon di blok
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1">
        {validNominations.slice(-6).map((nom) => {
          const nominee = players.find((p) => p.id === nom.nomineeId);
          const isTied = tieStatus.isTie && tieStatus.tiedNominationIds.includes(nom.id);
          return (
            <div
              key={nom.id}
              className={`inline-flex items-center rounded-lg border text-[10px] overflow-hidden ${
                nom.markedForExecution
                  ? 'bg-[#b03a2e]/35 border-[#e0574b]/70 text-[#fde2df]'
                  : isTied
                  ? 'bg-red-950/50 border-red-400/60 text-red-200'
                  : 'bg-white/5 border-white/15 text-[#efe6d2]'
              }`}
            >
              <button
                type="button"
                onClick={() => onReopenNomination(nom.id)}
                title="Buka ulang rincian suara nominasi ini"
                className="px-1.5 py-0.5 font-semibold hover:bg-white/10 cursor-pointer tabular-nums"
              >
                {nominee?.name.slice(0, 8) || '?'} ({nom.voteTotal})
              </button>
              <button
                type="button"
                onClick={() => onCancelNomination(nom.id)}
                title="Batalkan nominasi & kembalikan Ghost Vote"
                aria-label={`Batalkan nominasi ${nominee?.name || ''}`}
                className="px-1 py-0.5 text-[#a89f8c] hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact clockwork Day HUD rendered neatly inside or atop the velvet board during Day phase.
 */
export function DayNominationControls({
  players,
  nominationsToday,
  activeNomination,
  pendingNomineeId,
  onSelectNomineeForSetup,
  onStartNomination,
  onToggleVoter,
  onResetVotes,
  onMarkExecution,
  onDone,
  onCancelNomination,
}: DayNominationControlsProps) {
  const [chosenNominatorId, setChosenNominatorId] = useState<string>('');
  const thresholds = calculateNominationThresholds(
    players,
    nominationsToday.filter((n) => n.id !== activeNomination?.id)
  );
  const tieStatus = resolveVoteTieStatus(nominationsToday, players);

  // Setup step when Storyteller clicked "Nominasikan" on a seat or toolbar
  if (pendingNomineeId && !activeNomination) {
    const nominee = players.find((p) => p.id === pendingNomineeId);
    const eligibleNominators = players.filter((p) =>
      canSeatNominate(nominationsToday, p.id, pendingNomineeId, players)
    );
    const pickedNominator =
      eligibleNominators.find((p) => p.id === chosenNominatorId)?.id ??
      eligibleNominators[0]?.id ??
      '';
    const isUnusedVirgin =
      nominee?.trueRoleId === 'virgin' &&
      !nominee.reminders.some((r) => r.reminderId === 'used_virgin') &&
      !nominationsToday.some((n) => !n.cancelled && n.nomineeId === nominee.id);

    return (
      <div
        className="w-[272px] max-w-[92vw] rounded-2xl p-3 text-xs shadow-2xl backdrop-blur-md space-y-2.5"
        style={{
          backgroundColor: BOARD_CHROME.voteSurface,
          border: `1px solid ${BOARD_CHROME.voteEdge}`,
          color: GRIMOIRE_PALETTE.text,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#c9963a]">
            <Gavel className="w-3.5 h-3.5" />
            <span>Nominasi Siang</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectNomineeForSetup(null)}
            aria-label="Batal"
            className="text-[#a89f8c] hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] text-[#efe6d2] flex items-center justify-between gap-2">
          <span>
            Terdakwa: <strong className="text-[#c9963a]">{nominee?.name}</strong>
          </span>
        </div>

        {isUnusedVirgin && (
          <div className="px-2 py-1.5 rounded-xl bg-amber-950/60 border border-amber-400/50 text-amber-200 text-[10px] leading-snug flex items-start gap-1.5 text-left">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Pengingat Virgin:</strong> Nominasi pertama — jika penominasi adalah Townsfolk (bukan Mabuk/Racun), penominasi langsung dieksekusi!
            </span>
          </div>
        )}

        <div className="space-y-1 text-left">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#a89f8c] block">
            Pilih Terdakwa &amp; Penominasi:
          </label>
          <select
            value={pendingNomineeId}
            onChange={(e) => onSelectNomineeForSetup(e.target.value)}
            aria-label="Pilih terdakwa"
            className="w-full rounded-lg bg-[#121614] border border-white/15 px-2 py-1.5 text-xs text-[#efe6d2]"
          >
            {players.map((p) => {
              const alreadyNominated = nominationsToday.some(
                (n) => !n.cancelled && n.nomineeId === p.id
              );
              return (
                <option key={p.id} value={p.id}>
                  Terdakwa: #{p.seatIndex + 1} {p.name}
                  {!p.isAlive ? ' (Mati)' : ''}
                  {alreadyNominated ? ' [Sudah Dinominasi]' : ''}
                </option>
              );
            })}
          </select>

          <select
            value={pickedNominator}
            onChange={(e) => setChosenNominatorId(e.target.value)}
            aria-label="Pilih penominasi"
            className="w-full rounded-lg bg-[#121614] border border-[#c9963a]/40 px-2 py-1.5 text-xs text-[#efe6d2]"
          >
            {eligibleNominators.length === 0 ? (
              <option value="">Tidak ada penominasi yang memenuhi syarat</option>
            ) : (
              eligibleNominators.map((p) => (
                <option key={p.id} value={p.id}>
                  Penominasi: #{p.seatIndex + 1} {p.name}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          type="button"
          disabled={!pickedNominator}
          onClick={() => {
            if (!pickedNominator) return;
            onStartNomination(pickedNominator, pendingNomineeId);
            onSelectNomineeForSetup(null);
          }}
          className="w-full py-2 rounded-xl bg-[#c9963a] hover:bg-[#d8a74c] disabled:opacity-40 text-[#2a2018] font-bold text-xs cursor-pointer transition-colors"
        >
          Mulai Hitung Suara
        </button>
      </div>
    );
  }

  if (!activeNomination) return null;

  const nominator = players.find((p) => p.id === activeNomination.nominatorId);
  const nominee = players.find((p) => p.id === activeNomination.nomineeId);
  const metThreshold = activeNomination.voteTotal >= thresholds.execute;
  const isThisTied =
    tieStatus.isTie && tieStatus.tiedNominationIds.includes(activeNomination.id);
  const onBlockPlayer = tieStatus.onBlockNomination
    ? players.find((p) => p.id === tieStatus.onBlockNomination?.nomineeId) ?? null
    : null;
  const isVirginFirstNom =
    nominee?.trueRoleId === 'virgin' &&
    !nominee.reminders.some((r) => r.reminderId === 'used_virgin') &&
    !nominationsToday.some(
      (n) => !n.cancelled && n.id !== activeNomination.id && n.nomineeId === nominee.id
    );

  return (
    <div
      className="w-[282px] max-w-[94vw] rounded-2xl p-3 text-xs shadow-2xl backdrop-blur-md space-y-2"
      style={{
        backgroundColor: BOARD_CHROME.voteSurface,
        border: `1px solid ${BOARD_CHROME.voteEdge}`,
        color: GRIMOIRE_PALETTE.text,
      }}
    >
      <div className="flex items-start justify-between gap-2 text-left">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#c9963a] flex items-center gap-1">
            <Scale className="w-3 h-3 shrink-0" />
            <span>Sidang Eksekusi</span>
          </div>
          <div className="font-display text-sm font-bold text-[#efe6d2] mt-0.5 truncate">
            {nominee?.name}{' '}
            <span className="font-sans text-[11px] font-normal text-[#a89f8c]">
              oleh {nominator?.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCancelNomination(activeNomination.id)}
          title="Batalkan nominasi & kembalikan suara hantu"
          aria-label="Batalkan nominasi"
          className="p-1 rounded-lg hover:bg-white/10 text-[#a89f8c] hover:text-white cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {isVirginFirstNom && (
        <div className="px-2 py-1 rounded-xl bg-amber-950/60 border border-amber-400/50 text-amber-200 text-[10px] leading-snug text-left">
          Virgin pertama dinominasikan — cek pemicu Townsfolk sebelum voting!
        </div>
      )}

      {/* Live Tally vs Needed */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 font-mono tabular-nums">
        <span>
          Suara:{' '}
          <strong className={metThreshold ? 'text-[#e0574b]' : 'text-[#c9963a]'}>
            {activeNomination.voteTotal}
          </strong>
        </span>
        <span className="text-[#a89f8c] text-[11px]">
          Butuh {thresholds.execute}
          {thresholds.tie !== undefined ? ` (Tie ${thresholds.tie})` : ''}
        </span>
      </div>

      {/* Tie / On-Block Feedback */}
      {isThisTied ? (
        <div className="px-2 py-1 rounded-xl bg-red-950/65 border border-red-400/50 text-red-200 text-[10px] font-bold">
          SERI (TIE) di {tieStatus.highestVotes} suara — blok eksekusi kosong!
        </div>
      ) : onBlockPlayer && tieStatus.onBlockNomination ? (
        <div className="px-2 py-1 rounded-xl bg-[#b03a2e]/20 border border-[#e0574b]/40 text-[#f7cbc6] text-[10px] font-semibold">
          Di atas blok: {onBlockPlayer.name} ({tieStatus.onBlockNomination.voteTotal})
        </div>
      ) : null}

      {/* Tap voter pills (Zero Scroll Compact Grid) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
        {players.map((p) => {
          const voted = activeNomination.voterIds.includes(p.id);
          const canVote = p.isAlive || p.hasGhostVote || voted;
          const isThief = p.reminders.some((r) => r.reminderId === 'thief_neg');
          const isBureaucrat = p.reminders.some((r) => r.reminderId === 'bureaucrat_3x');
          return (
            <button
              key={p.id}
              type="button"
              disabled={!canVote}
              onClick={() => onToggleVoter(activeNomination.id, p.id)}
              title={`${p.name}${!p.isAlive ? (p.hasGhostVote || voted ? ' (Suara Hantu)' : ' (Suara Habis)') : ''}`}
              className={`px-1.5 py-1 rounded-md text-[10px] font-medium cursor-pointer transition-colors truncate ${
                voted
                  ? 'bg-[#c9963a] text-[#2a2018] font-bold'
                  : canVote
                  ? 'bg-white/10 text-[#efe6d2] hover:bg-white/20'
                  : 'opacity-30 cursor-not-allowed bg-white/5 text-[#a89f8c]'
              }`}
            >
              {p.seatIndex + 1}.{p.name.slice(0, 5)}
              {isBureaucrat ? ' ×3' : isThief ? ' -1' : ''}
            </button>
          );
        })}
      </div>

      {/* Action Row: Reset | Mark Block | Done (matches botcgrimoire-main NominationControls) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={activeNomination.voterIds.length === 0}
          onClick={() => onResetVotes(activeNomination.id)}
          title="Reset semua suara"
          aria-label="Reset semua suara"
          className="p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed text-[#efe6d2] cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={isThisTied && !activeNomination.markedForExecution}
          onClick={() =>
            onMarkExecution(activeNomination.id, !activeNomination.markedForExecution)
          }
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            activeNomination.markedForExecution
              ? 'bg-[#b03a2e] text-[#efe6d2]'
              : metThreshold && !isThisTied
              ? 'bg-[#c9963a] text-[#2a2018]'
              : 'bg-white/10 text-[#efe6d2] hover:bg-white/20'
          }`}
        >
          {activeNomination.markedForExecution ? 'Di Blok (Batal)' : 'Tandai Eksekusi'}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={() => onDone(activeNomination.id)}
            title="Selesaikan perhitungan suara nominasi ini"
            className="py-1.5 px-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </button>
        )}
      </div>
    </div>
  );
}
