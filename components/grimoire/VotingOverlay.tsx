'use client';

import React, { useState } from 'react';
import { Gavel, RotateCcw, Scale, X } from 'lucide-react';
import {
  DayNomination,
  PlayerSeat,
  calculateNominationThresholds,
  canSeatNominate,
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
}: {
  ring: RingGeometry;
  players: PlayerSeat[];
  nomination: DayNomination | null;
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

  const isEnough = nomination.voteTotal >= calculateNominationThresholds(players, []).execute;

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
  onCancelNomination: (nominationId: string) => void;
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
  onCancelNomination,
}: DayNominationControlsProps) {
  const [chosenNominatorId, setChosenNominatorId] = useState<string>('');
  const thresholds = calculateNominationThresholds(
    players,
    nominationsToday.filter((n) => n.id !== activeNomination?.id)
  );

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

    return (
      <div
        className="w-[260px] max-w-[92%] rounded-2xl p-3 text-xs shadow-2xl backdrop-blur-md space-y-2.5"
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

        <div className="text-[11px] text-[#efe6d2]">
          Terdakwa: <strong className="text-[#c9963a]">{nominee?.name}</strong>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[#a89f8c]">
            Pilih Penominasi (Pemain Hidup):
          </label>
          <select
            value={pickedNominator}
            onChange={(e) => setChosenNominatorId(e.target.value)}
            className="w-full rounded-lg bg-[#121614] border border-[#c9963a]/40 px-2 py-1.5 text-xs text-[#efe6d2]"
          >
            {eligibleNominators.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.seatIndex + 1} {p.name}
              </option>
            ))}
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

  return (
    <div
      className="w-[275px] max-w-[94%] rounded-2xl p-3 text-xs shadow-2xl backdrop-blur-md space-y-2.5"
      style={{
        backgroundColor: BOARD_CHROME.voteSurface,
        border: `1px solid ${BOARD_CHROME.voteEdge}`,
        color: GRIMOIRE_PALETTE.text,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#c9963a] flex items-center gap-1">
            <Scale className="w-3 h-3" />
            <span>Sidang Eksekusi</span>
          </div>
          <div className="font-display text-sm font-bold text-[#efe6d2] mt-0.5">
            {nominee?.name}{' '}
            <span className="font-sans text-[11px] font-normal text-[#a89f8c]">
              oleh {nominator?.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCancelNomination(activeNomination.id)}
          title="Tutup / Batalkan nominasi"
          className="p-1 rounded-lg hover:bg-white/10 text-[#a89f8c] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Tally vs Needed */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 font-mono tabular-nums">
        <span>
          Suara:{' '}
          <strong className={metThreshold ? 'text-[#e0574b]' : 'text-[#c9963a]'}>
            {activeNomination.voteTotal}
          </strong>
        </span>
        <span className="text-[#a89f8c]">
          Butuh {thresholds.execute}
          {thresholds.tie !== undefined ? ` (Tie ${thresholds.tie})` : ''}
        </span>
      </div>

      {/* Tap voter pills (Zero Scroll Compact Grid) */}
      <div className="grid grid-cols-4 gap-1">
        {players.map((p) => {
          const voted = activeNomination.voterIds.includes(p.id);
          const canVote = p.isAlive || p.hasGhostVote || voted;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!canVote}
              onClick={() => onToggleVoter(activeNomination.id, p.id)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors ${
                voted
                  ? 'bg-[#c9963a] text-[#2a2018] font-bold'
                  : canVote
                  ? 'bg-white/10 text-[#efe6d2] hover:bg-white/20'
                  : 'opacity-30 cursor-not-allowed bg-white/5 text-[#a89f8c]'
              }`}
            >
              {p.seatIndex + 1}.{p.name.slice(0, 6)}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onResetVotes(activeNomination.id)}
          title="Reset semua suara"
          className="p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-[#efe6d2] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            onMarkExecution(activeNomination.id, !activeNomination.markedForExecution)
          }
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
            activeNomination.markedForExecution
              ? 'bg-[#b03a2e] text-[#efe6d2]'
              : metThreshold
              ? 'bg-[#c9963a] text-[#2a2018]'
              : 'bg-white/10 text-[#efe6d2] hover:bg-white/20'
          }`}
        >
          {activeNomination.markedForExecution
            ? 'Eksekusi Terpilih (Selesai)'
            : 'Tandai Dihukum Mati'}
        </button>
      </div>
    </div>
  );
}
