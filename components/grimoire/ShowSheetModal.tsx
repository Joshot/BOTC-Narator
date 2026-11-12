'use client';

import React, { useState } from 'react';
import { Eye, MessageSquare, Users, X } from 'lucide-react';
import { ALL_TB_ROLES, ROLE_MAP } from '@/lib/botc-data';
import { GRIMOIRE_PALETTE, VelvetColour } from '@/lib/grimoire-theme';
import { PlayerSeat } from '@/lib/botc-engine';
import VelvetBackdrop from './VelvetBackdrop';
import ParchmentSurface from './ParchmentSurface';
import { CharacterTokenFront } from './TokenPrimitives';
import { useLockBodyScroll } from './useLockBodyScroll';

type TeamTab = 'townsfolk' | 'outsider' | 'evil' | 'traveller' | 'all';

const TEAM_TABS: { id: TeamTab; label: string }[] = [
  { id: 'townsfolk', label: 'Townsfolk (13)' },
  { id: 'outsider', label: 'Outsider (4)' },
  { id: 'evil', label: 'Evil (5)' },
  { id: 'traveller', label: 'Traveller (5)' },
  { id: 'all', label: 'Semua' },
];

type SheetKind =
  | 'you_are'
  | 'this_player_is'
  | 'this_is_demon'
  | 'these_are_minions'
  | 'not_in_play'
  | 'selected_you'
  | 'custom_note';

const SHEET_LABELS: { id: SheetKind; label: string; heading: string }[] = [
  { id: 'you_are', label: 'Anda Adalah...', heading: 'ANDA ADALAH' },
  { id: 'this_player_is', label: 'Pemain Ini Adalah...', heading: 'PEMAIN INI ADALAH' },
  { id: 'this_is_demon', label: 'Demon Anda', heading: 'INI ADALAH DEMON ANDA' },
  { id: 'these_are_minions', label: 'Minion Anda', heading: 'INI ADALAH MINION ANDA' },
  { id: 'not_in_play', label: '3 Bluff (Tidak Main)', heading: 'TIDAK ADA DI PERMAINAN' },
  { id: 'selected_you', label: 'Memilih Anda', heading: 'PEMAIN INI MEMILIH ANDA' },
  { id: 'custom_note', label: 'Pesan Kustom', heading: 'PESAN STORYTELLER' },
];

interface ShowSheetModalProps {
  isOpen: boolean;
  players: PlayerSeat[];
  demonBluffIds: string[];
  velvetColour?: VelvetColour;
  initialRoleId?: string;
  onClose: () => void;
}

/**
 * Storyteller "Show Card" full-screen Velvet & Parchment studio mirroring botcgrimoire-main's ShowSheet:
 * Pick a preset sheet ("ANDA ADALAH", "TIDAK ADA DI PERMAINAN", "INI ADALAH DEMON ANDA", etc.)
 * plus tokens or custom freeform text, then display cleanly across the device to the waking player.
 */
export default function ShowSheetModal({
  isOpen,
  players,
  demonBluffIds,
  velvetColour = 'midnight',
  initialRoleId,
  onClose,
}: ShowSheetModalProps) {
  const [sheetKind, setSheetKind] = useState<SheetKind>(
    initialRoleId ? 'this_player_is' : 'not_in_play'
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    initialRoleId ? [initialRoleId] : demonBluffIds.slice(0, 3)
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [teamTab, setTeamTab] = useState<TeamTab>('townsfolk');
  const [presenting, setPresenting] = useState(false);

  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const filteredRoles = ALL_TB_ROLES.filter((role) => {
    if (teamTab === 'all') return true;
    if (teamTab === 'evil') return role.team === 'minion' || role.team === 'demon';
    return role.team === teamTab;
  });

  const activePreset = SHEET_LABELS.find((s) => s.id === sheetKind) ?? SHEET_LABELS[0];

  const handleSelectKind = (kind: SheetKind) => {
    setSheetKind(kind);
    if (kind === 'not_in_play') {
      setSelectedRoleIds(demonBluffIds.slice(0, 3));
      setTeamTab('townsfolk');
    } else if (kind === 'this_is_demon') {
      const demon = players.find((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon');
      setSelectedRoleIds(demon ? [demon.trueRoleId] : ['imp']);
      setTeamTab('evil');
    } else if (kind === 'these_are_minions') {
      const minions = players.filter((p) => ROLE_MAP[p.trueRoleId]?.team === 'minion');
      setSelectedRoleIds(minions.map((m) => m.trueRoleId));
      setTeamTab('evil');
    } else if (kind === 'you_are' || kind === 'this_player_is') {
      setSelectedRoleIds(initialRoleId ? [initialRoleId] : ['imp']);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : prev.length >= 4
        ? [...prev.slice(1), roleId]
        : [...prev, roleId]
    );
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  if (presenting) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={activePreset.heading}
        className="fixed inset-0 z-50 overflow-hidden"
      >
        <VelvetBackdrop
          colour={velvetColour}
          className="h-dvh w-full overflow-hidden"
          contentClassName="items-center justify-between p-4 sm:p-8 text-center h-full overflow-hidden"
        >
          <div className="w-full max-w-3xl flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
              Kartu Tunjuk Bisu
            </span>
            <button
              type="button"
              onClick={() => setPresenting(false)}
              className="px-4 py-2 rounded-xl border border-[#c9963a]/40 bg-black/50 text-[#efe6d2] text-xs font-bold hover:bg-black/70 cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Kembali Edit</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto flex flex-col items-center justify-center gap-4 sm:gap-6">
            <h2 className="font-display text-2xl sm:text-5xl font-bold tracking-wide text-[#efe6d2] drop-shadow">
              {activePreset.heading}
            </h2>

            {sheetKind === 'custom_note' ? (
              <ParchmentSurface className="w-full max-w-lg rounded-2xl p-6 sm:p-8 text-center">
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#2a2018] whitespace-pre-wrap">
                  {customText || 'Angkat 1 jari...'}
                </p>
              </ParchmentSurface>
            ) : sheetKind === 'selected_you' ? (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {selectedPlayerIds.map((pid) => {
                  const p = players.find((item) => item.id === pid);
                  if (!p) return null;
                  const role = ROLE_MAP[p.trueRoleId];
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border border-[#c9963a]/50 bg-black/55"
                    >
                      {role && <CharacterTokenFront role={role} size={78} />}
                      <span className="font-display text-lg font-bold text-[#efe6d2]">
                        Kursi #{p.seatIndex + 1} · {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {selectedRoleIds.map((rid) => {
                  const role = ROLE_MAP[rid];
                  if (!role) return null;
                  return (
                    <div key={rid} className="flex flex-col items-center gap-2 max-w-[165px] sm:max-w-[195px]">
                      <CharacterTokenFront role={role} size={selectedRoleIds.length > 2 ? 104 : 132} showAbility />
                      <div>
                        <div className="font-display text-lg sm:text-xl font-bold text-[#efe6d2]">
                          {role.name}
                        </div>
                        <div className="text-xs text-[#a89f8c] mt-0.5 leading-snug">
                          {role.indonesianName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-6 py-2.5 rounded-full bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-sm cursor-pointer shadow-lg"
          >
            Selesai & Tutup
          </button>
        </VelvetBackdrop>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Siapkan Kartu Tunjuk Malam"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-hidden"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl max-h-[94dvh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <ParchmentSurface className="rounded-3xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#655342]/25">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                Layar Komunikasi Bisu Storyteller
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#2a2018]">
                Pilih Kartu untuk Ditunjukkan ke Pemain
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-xl bg-[#66533f]/10 hover:bg-[#66533f]/20 flex items-center justify-center text-[#2a2018] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 overflow-hidden">
            {/* Sheet type chips */}
            <div className="flex flex-wrap gap-1.5">
              {SHEET_LABELS.map((item) => {
                const active = item.id === sheetKind;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectKind(item.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2a2018] text-[#efe6d2] shadow'
                        : 'bg-[#66533f]/10 text-[#2a2018] hover:bg-[#66533f]/20'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {sheetKind === 'custom_note' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5c4a37] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Tulis Pesan atau Angka Informasi (misal: &quot;0&quot;, &quot;1&quot;, atau nama):</span>
                </label>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Contoh: Ada 2 pasangan Evil bersebelahan..."
                  className="w-full p-3 rounded-xl border border-[#655342]/35 bg-white/80 text-sm text-[#2a2018] focus:outline-none focus:ring-2 focus:ring-[#c9963a]"
                />
              </div>
            ) : sheetKind === 'selected_you' ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#5c4a37] flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Pilih pemain yang menunjuk/memilih:</span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {players.map((p) => {
                    const checked = selectedPlayerIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlayer(p.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-left text-[11px] font-semibold truncate cursor-pointer ${
                          checked
                            ? 'border-[#c9963a] bg-[#c9963a]/25 text-[#2a2018]'
                            : 'border-[#655342]/25 bg-white/40 text-[#5c4a37]'
                        }`}
                      >
                        #{p.seatIndex + 1} {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#5c4a37]">
                    Pilih 1–4 token (Terpilih: {selectedRoleIds.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {TEAM_TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTeamTab(t.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                          teamTab === t.id
                            ? 'bg-[#c9963a] text-[#2a2018]'
                            : 'bg-[#66533f]/10 text-[#5c4a37] hover:bg-[#66533f]/20'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className={`grid gap-1.5 ${
                    teamTab === 'all'
                      ? 'grid-cols-6 sm:grid-cols-9'
                      : 'grid-cols-4 sm:grid-cols-5'
                  }`}
                >
                  {filteredRoles.map((role) => {
                    const picked = selectedRoleIds.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl border text-center cursor-pointer transition-all ${
                          picked
                            ? 'border-[#c9963a] bg-[#c9963a]/25 ring-1 ring-[#c9963a]'
                            : 'border-[#655342]/20 bg-[#66533f]/[0.05] hover:bg-[#66533f]/[0.14]'
                        }`}
                      >
                        <CharacterTokenFront
                          role={role}
                          size={teamTab === 'all' ? 30 : 40}
                          showSetupLeaf={false}
                        />
                        <span
                          className={`font-bold leading-tight truncate w-full ${
                            teamTab === 'all' ? 'text-[9px]' : 'text-[10px]'
                          }`}
                          style={{ color: GRIMOIRE_PALETTE.ink }}
                        >
                          {role.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-5 py-3 border-t border-[#655342]/25 flex items-center justify-end gap-2 bg-[#66533f]/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#5c4a37] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => setPresenting(true)}
              className="px-5 py-2 rounded-xl bg-[#2a2018] hover:bg-[#3f3125] text-[#efe6d2] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Eye className="w-4 h-4 text-[#c9963a]" />
              <span>Tampilkan Layar Penuh</span>
            </button>
          </div>
        </ParchmentSurface>
      </div>
    </div>
  );
}
