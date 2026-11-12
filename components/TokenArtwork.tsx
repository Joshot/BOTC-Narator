'use client';

import React from 'react';
import {
  Beer,
  Crosshair,
  Crown,
  Droplets,
  Eye,
  FlaskConical,
  Ghost,
  Hammer,
  Heart,
  HelpCircle,
  Moon,
  ScrollText,
  Shield,
  Shirt,
  Skull,
  Sparkles,
  Swords,
  UserCheck,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { ExtendedTeamType, REMINDER_MAP, ROLE_MAP } from '@/lib/botc-data';
import { AlignmentSide, GRIMOIRE_PALETTE, TeamKey } from '@/lib/grimoire-theme';
import { CharacterTokenFront, ReminderDisc } from './grimoire/TokenPrimitives';

/** Lucide outline symbol helper for compact lists and night sheets (zero emojis). */
export function RoleGlyph({
  roleId,
  className = 'w-5 h-5',
}: {
  roleId: string;
  className?: string;
}) {
  switch (roleId) {
    case 'washerwoman':
      return <Shirt className={className} />;
    case 'librarian':
      return <ScrollText className={className} />;
    case 'investigator':
      return <Eye className={className} />;
    case 'chef':
      return <Users className={className} />;
    case 'empath':
      return <Heart className={className} />;
    case 'fortune_teller':
      return <Moon className={className} />;
    case 'undertaker':
      return <Skull className={className} />;
    case 'monk':
      return <Shield className={className} />;
    case 'ravenkeeper':
      return <Sparkles className={className} />;
    case 'virgin':
      return <Crown className={className} />;
    case 'slayer':
      return <Crosshair className={className} />;
    case 'soldier':
      return <Shield className={className} />;
    case 'mayor':
      return <UserCheck className={className} />;
    case 'butler':
      return <Vote className={className} />;
    case 'drunk':
      return <Beer className={className} />;
    case 'recluse':
      return <Ghost className={className} />;
    case 'saint':
      return <Heart className={className} />;
    case 'poisoner':
      return <FlaskConical className={className} />;
    case 'spy':
      return <Eye className={className} />;
    case 'scarlet_woman':
      return <Droplets className={className} />;
    case 'baron':
      return <Crown className={className} />;
    case 'imp':
      return <Swords className={className} />;
    case 'died_today':
      return <Hammer className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}

export function getTeamColorStyles(team: ExtendedTeamType) {
  switch (team) {
    case 'townsfolk':
      return {
        bgGradient: 'bg-[#173963]',
        borderRing: 'border-[#5fa3e6]/60',
        badgeBg: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-[#0064ac]/25 dark:text-[#7ec3ff] dark:border-[#5fa3e6]/40',
        iconText: 'text-[#5fa3e6]',
        label: 'TOWNSFOLK',
      };
    case 'outsider':
      return {
        bgGradient: 'bg-[#144352]',
        borderRing: 'border-[#4cb8c4]/60',
        badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-200 dark:border-cyan-500/40',
        iconText: 'text-cyan-300',
        label: 'OUTSIDER',
      };
    case 'minion':
      return {
        bgGradient: 'bg-[#5a161b]',
        borderRing: 'border-[#e0574b]/60',
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-[#760a0d]/35 dark:text-[#ffa299] dark:border-[#e0574b]/45',
        iconText: 'text-[#e0574b]',
        label: 'MINION',
      };
    case 'demon':
      return {
        bgGradient: 'bg-[#460709]',
        borderRing: 'border-[#ef4444]/75',
        badgeBg: 'bg-red-100 text-red-900 border-red-400 dark:bg-[#760a0d]/45 dark:text-[#ffb4ab] dark:border-red-500/50',
        iconText: 'text-red-400',
        label: 'DEMON',
      };
    case 'traveller':
      return {
        bgGradient: 'bg-[#3c2454]',
        borderRing: 'border-[#a884d2]/60',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-[#5a3a7a]/35 dark:text-[#d5c2f2] dark:border-[#a884d2]/45',
        iconText: 'text-[#a884d2]',
        label: 'TRAVELLER',
      };
  }
}

export function formatRoleNameLines(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return words;
  if (words.length === 2) return words;
  return [words[0], words.slice(1).join(' ')];
}

export type TokenSizePreset =
  | 'xs'
  | 'sm'
  | 'circle-sm'
  | 'circle-md'
  | 'circle-lg'
  | 'md'
  | 'lg'
  | 'xl';

const TOKEN_PIXEL_SIZES: Record<TokenSizePreset, number> = {
  xs: 36,
  sm: 52,
  'circle-sm': 60,
  'circle-md': 76,
  'circle-lg': 92,
  md: 86,
  lg: 118,
  xl: 152,
};

export function CharacterToken({
  roleId,
  size = 'md',
  pixelSize,
  alignment,
  isDead = false,
  isPoisoned = false,
  isDrunkSecret = false,
  isExecutedToday = false,
  hasGhostVote = false,
  deathCause,
  showSetupLeaf = true,
  showAbility = false,
  onClick,
  className = '',
}: {
  roleId: string;
  size?: TokenSizePreset;
  pixelSize?: number;
  alignment?: AlignmentSide;
  isDead?: boolean;
  isPoisoned?: boolean;
  isDrunkSecret?: boolean;
  isExecutedToday?: boolean;
  hasGhostVote?: boolean;
  deathCause?: 'demon' | 'execution' | 'slayer';
  showSetupLeaf?: boolean;
  showAbility?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const role = ROLE_MAP[roleId];
  const resolvedPx = pixelSize ?? TOKEN_PIXEL_SIZES[size];

  if (!role) {
    return (
      <div
        className={`rounded-full bg-[#232b26] border border-[#c9963a]/40 flex items-center justify-center text-[#efe6d2] ${className}`}
        style={{ width: resolvedPx, height: resolvedPx }}
      >
        <HelpCircle className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: resolvedPx, height: resolvedPx }}
    >
      <CharacterTokenFront
        role={role}
        size={resolvedPx}
        alignment={alignment}
        dead={isDead}
        isPoisoned={isPoisoned}
        hasGhostVote={hasGhostVote}
        deathCause={deathCause}
        showSetupLeaf={showSetupLeaf}
        showAbility={showAbility}
      />

      {isDrunkSecret && (
        <span
          title="Ini sebenarnya The Drunk"
          className="pointer-events-none absolute -top-1 -right-1 z-20 inline-flex items-center gap-0.5 rounded-full border border-[#c9963a] bg-[#2a2018] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#f2c56b] shadow-md"
        >
          <Beer className="w-2.5 h-2.5" />
          {resolvedPx >= 64 && <span>Drunk</span>}
        </span>
      )}

      {isExecutedToday && (
        <span
          title="Dieksekusi hari ini"
          className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 rounded-full border border-[#c9963a]/80 bg-[#760a0d] px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-[#efe6d2] shadow whitespace-nowrap"
        >
          Dieksekusi
        </span>
      )}
    </div>
  );
}

export function ReminderTokenChip({
  reminderId,
  customNote,
  size = 'sm',
  pixelSize,
  onClick,
  onRemove,
  className = '',
}: {
  reminderId: string;
  customNote?: string;
  size?: 'xs' | 'sm' | 'md' | 'circle';
  pixelSize?: number;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
  className?: string;
}) {
  const px =
    pixelSize ??
    (size === 'xs' ? 32 : size === 'sm' ? 40 : size === 'circle' ? 44 : 52);

  return (
    <div
      className={`group relative inline-flex items-center justify-center shrink-0 ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${className}`}
      onClick={onClick}
    >
      <ReminderDisc reminderId={reminderId} customNote={customNote} size={px} />
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          aria-label="Hapus reminder"
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#760a0d] border border-[#efe6d2]/80 text-[#efe6d2] flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

export function ReminderTokenTrayCard({
  reminderId,
  isSelected,
  showRuleDetail = true,
  onDragStart,
  onClick,
}: {
  reminderId: string;
  isSelected: boolean;
  showRuleDetail?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
}) {
  const rem = REMINDER_MAP[reminderId];
  const role = rem ? ROLE_MAP[rem.roleId] : null;
  if (!rem) return null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`group flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'border-[#c9963a] bg-[#c9963a]/20 shadow-md ring-1 ring-[#c9963a]'
          : 'border-[#655342]/35 bg-[#efe6d2]/75 dark:bg-[#1a1512]/80 hover:border-[#c9963a]/70'
      }`}
    >
      <ReminderDisc reminderId={reminderId} size={42} showTooltip={false} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-1">
          <span
            className="font-display text-sm font-bold truncate"
            style={{ color: undefined }}
          >
            <span className="text-[#2a2018] dark:text-[#efe6d2]">{rem.indonesianLabel}</span>
          </span>
          {role && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider shrink-0"
              style={{
                color:
                  role.team === 'minion' || role.team === 'demon'
                    ? GRIMOIRE_PALETTE.teamOnFelt.demon
                    : GRIMOIRE_PALETTE.teamOnFelt.townsfolk,
              }}
            >
              {role.name}
            </span>
          )}
        </div>
        {showRuleDetail && (
          <p className="text-[11px] leading-snug text-[#5c4a37] dark:text-[#a89f8c] line-clamp-2">
            {rem.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function EditionCrest({ size = 44 }: { size?: number }) {
  return (
    <img
      src="/art/editions/tb.webp"
      alt="Trouble Brewing"
      width={size}
      height={size}
      draggable={false}
      className="object-contain select-none pointer-events-none drop-shadow"
      style={{ width: size, height: size }}
    />
  );
}
