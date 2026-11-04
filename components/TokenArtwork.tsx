'use client';

import React from 'react';
import {
  Award,
  Beer,
  Bird,
  BookOpen,
  ChefHat,
  ConciergeBell,
  Crosshair,
  Crown,
  Eye,
  Feather,
  Flame,
  FlaskConical,
  Gavel,
  Gem,
  Heart,
  Landmark,
  Search,
  Shield,
  ShieldPlus,
  Shirt,
  Shovel,
  Skull,
  Swords,
  VenetianMask,
} from 'lucide-react';
import { REMINDER_MAP, ROLE_MAP, TeamType } from '@/lib/botc-data';

export function RoleGlyph({
  roleId,
  className = 'w-6 h-6',
}: {
  roleId: string;
  className?: string;
}) {
  switch (roleId) {
    case 'washerwoman':
      return <Shirt className={className} />;
    case 'librarian':
      return <BookOpen className={className} />;
    case 'investigator':
      return <Search className={className} />;
    case 'chef':
      return <ChefHat className={className} />;
    case 'empath':
      return <Heart className={className} />;
    case 'fortune_teller':
      return <Eye className={className} />;
    case 'undertaker':
      return <Shovel className={className} />;
    case 'monk':
      return <ShieldPlus className={className} />;
    case 'ravenkeeper':
      return <Bird className={className} />;
    case 'virgin':
      return <Gem className={className} />;
    case 'slayer':
      return <Crosshair className={className} />;
    case 'soldier':
      return <Shield className={className} />;
    case 'mayor':
      return <Landmark className={className} />;
    case 'butler':
      return <ConciergeBell className={className} />;
    case 'drunk':
      return <Beer className={className} />;
    case 'recluse':
      return <Flame className={className} />;
    case 'saint':
      return <Feather className={className} />;
    case 'poisoner':
      return <FlaskConical className={className} />;
    case 'spy':
      return <VenetianMask className={className} />;
    case 'scarlet_woman':
      return <Crown className={className} />;
    case 'baron':
      return <Award className={className} />;
    case 'imp':
      return <Swords className={className} />;
    default:
      return <Gavel className={className} />;
  }
}

export function getTeamColorStyles(team: TeamType) {
  switch (team) {
    case 'townsfolk':
      return {
        ring: 'border-[3px] sm:border-[3.5px] border-[#3B82F6] ring-2 ring-[#60A5FA]/40 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
        iconText: 'text-[#93C5FD]',
        bgGradient: 'bg-radial from-[#222938] via-[#161B26] to-[#0E1119]',
        labelText: 'text-[#BFDBFE]',
      };
    case 'outsider':
      return {
        ring: 'border-[3px] sm:border-[3.5px] border-[#38BDF8] ring-2 ring-[#7DD3FC]/40 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
        iconText: 'text-[#7DD3FC]',
        bgGradient: 'bg-radial from-[#1A2A38] via-[#121E29] to-[#0B131A]',
        labelText: 'text-[#BAE6FD]',
      };
    case 'minion':
      return {
        ring: 'border-[3px] sm:border-[3.5px] border-[#EF4444] ring-2 ring-[#F87171]/40 shadow-[0_0_12px_rgba(239,68,68,0.35)]',
        iconText: 'text-[#FCA5A5]',
        bgGradient: 'bg-radial from-[#351A1E] via-[#241114] to-[#160A0C]',
        labelText: 'text-[#FECACA]',
      };
    case 'demon':
      return {
        ring: 'border-[3px] sm:border-[3.5px] border-[#DC2626] ring-2 ring-[#EF4444]/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]',
        iconText: 'text-[#F87171]',
        bgGradient: 'bg-radial from-[#3E161A] via-[#290E11] to-[#1A080A]',
        labelText: 'text-[#FECACA]',
      };
  }
}

export function formatRoleNameLines(name: string): string[] {
  if (name.includes(' ')) {
    return name.split(' ');
  }
  return [name];
}

export function CharacterToken({
  roleId,
  size = 'md',
  isDead = false,
  deathCause,
  isDrunkSecret = false,
  isPoisoned = false,
  showIndonesianSubtitle = false,
}: {
  roleId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDead?: boolean;
  deathCause?: 'demon' | 'execution' | 'slayer';
  isDrunkSecret?: boolean;
  isPoisoned?: boolean;
  showIndonesianSubtitle?: boolean;
}) {
  const role = ROLE_MAP[roleId];
  if (!role) return null;

  const styles = getTeamColorStyles(role.team);

  // Enlarged sizes for high visibility and responsiveness on mobile and tablet
  const sizeMap = {
    sm: {
      circle: 'w-[68px] h-[68px] sm:w-[78px] sm:h-[78px]',
      icon: 'w-5 h-5 sm:w-6 sm:h-6',
    },
    md: {
      circle: 'w-[82px] h-[82px] sm:w-[98px] sm:h-[98px]',
      icon: 'w-6 h-6 sm:w-7 sm:h-7',
    },
    lg: {
      circle: 'w-[102px] h-[102px] sm:w-[120px] sm:h-[120px]',
      icon: 'w-10 h-10 sm:w-12 sm:h-12',
    },
    xl: {
      circle: 'w-36 h-36 sm:w-44 sm:h-44',
      icon: 'w-14 h-14 sm:w-16 sm:h-16',
    },
  }[size];

  const nameLines = formatRoleNameLines(role.name);
  const maxWordLen = Math.max(...nameLines.map((w) => w.length));

  // Determine font size so long words like INVESTIGATOR or WASHERWOMAN never get truncated
  let fontClasses = 'text-[9px] sm:text-[11px]';
  if (size === 'sm') {
    if (maxWordLen >= 11) {
      fontClasses = 'text-[7px] sm:text-[8px] tracking-tighter';
    } else if (maxWordLen >= 8) {
      fontClasses = 'text-[8px] sm:text-[9px] tracking-tight';
    } else {
      fontClasses = 'text-[9px] sm:text-[10px] tracking-tight';
    }
  } else if (size === 'md') {
    if (maxWordLen >= 11) {
      fontClasses = 'text-[8px] sm:text-[9.5px] tracking-tighter';
    } else if (maxWordLen >= 8) {
      fontClasses = 'text-[9px] sm:text-[10.5px] tracking-tight';
    } else {
      fontClasses = 'text-[10px] sm:text-[12px] tracking-tight';
    }
  } else if (size === 'lg') {
    fontClasses = maxWordLen >= 11 ? 'text-xs sm:text-sm' : 'text-sm sm:text-base';
  } else {
    fontClasses = 'text-base sm:text-lg';
  }

  return (
    <div
      className={`relative rounded-full flex flex-col items-center justify-center select-none shadow-2xl transition-transform ${
        sizeMap.circle
      } ${styles.bgGradient} ${
        isDead
          ? 'border-[3.5px] border-[#52525B] ring-2 ring-[#71717A]/40 opacity-80 grayscale-[40%]'
          : styles.ring
      }`}
    >
      {/* Crisp inner brass ring */}
      <div className="absolute inset-[3px] sm:inset-[4px] rounded-full border border-[#D4AF37]/45 pointer-events-none" />

      {/* Differentiated Death Shroud Ribbon: Demon Kill vs Execution */}
      {isDead && (
        deathCause === 'demon' ? (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-[#3B070B] border-2 border-[#EF4444] rounded-md px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-xl whitespace-nowrap"
            title="Mati: Dibunuh Demon Malam Hari"
          >
            <Swords className="w-3 h-3 text-[#FCA5A5]" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-[#FECACA] uppercase tracking-wider">DEMON KILL</span>
          </div>
        ) : deathCause === 'execution' ? (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-[#291B07] border-2 border-[#D4AF37] rounded-md px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-xl whitespace-nowrap"
            title="Mati: Digantung / Eksekusi Siang Hari"
          >
            <Gavel className="w-3 h-3 text-[#FDE68A]" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-[#FDE68A] uppercase tracking-wider">GANTUNG</span>
          </div>
        ) : (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-[#09090B] border-2 border-[#E4E4E7] rounded-md px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-md whitespace-nowrap"
            title="Pemain Telah Mati"
          >
            <Skull className="w-3 h-3 text-white" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-white uppercase tracking-wider">MATI</span>
          </div>
        )
      )}

      {/* Secret Drunk indicator badge for Storyteller - Centered, sharp, high contrast */}
      {isDrunkSecret && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-[#78350F] border-2 border-[#FDE68A] flex items-center justify-center gap-1 shadow-xl whitespace-nowrap"
          title="Sebenarnya adalah THE DRUNK"
        >
          <Beer className="w-3.5 h-3.5 text-[#FDE68A]" />
          <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-wider">DRUNK</span>
        </div>
      )}

      {/* Poisoned status badge for Storyteller */}
      {isPoisoned && (
        <div
          className="absolute -top-1 -right-1 z-20 px-1.5 py-0.5 rounded-full bg-[#991B1B] border-2 border-[#FCA5A5] flex items-center justify-center gap-1 shadow-lg animate-pulse whitespace-nowrap"
          title="Sedang Diracun (Poisoned)"
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#FECACA]" />
          <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-wider">RACUN</span>
        </div>
      )}

      <RoleGlyph roleId={role.id} className={`${sizeMap.icon} ${styles.iconText} shrink-0 mb-0.5`} />

      <div
        className={`w-full px-0.5 font-sans font-black uppercase text-center leading-[1.08] text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] ${fontClasses}`}
      >
        {nameLines.map((line, idx) => (
          <span key={idx} className="block whitespace-nowrap">
            {line}
          </span>
        ))}
      </div>

      {showIndonesianSubtitle && (
        <span className="text-[10px] font-bold text-[#D6CFC2] truncate max-w-[90%] mt-0.5">
          {role.indonesianName}
        </span>
      )}
    </div>
  );
}

export function ReminderTokenChip({
  reminderId,
  size = 'sm',
  onClick,
  draggable = false,
  onDragStart,
  isSelected = false,
}: {
  reminderId: string;
  size?: 'xs' | 'sm' | 'md';
  onClick?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  isSelected?: boolean;
}) {
  const rem = REMINDER_MAP[reminderId];
  if (!rem) return null;

  const toneClasses =
    rem.team === 'evil'
      ? 'border-[#EF4444]/80 bg-[#2C181B] text-[#FECACA]'
      : rem.team === 'good'
      ? 'border-[#38BDF8]/80 bg-[#182633] text-[#BAE6FD]'
      : 'border-[#D4AF37]/80 bg-[#27231C] text-[#FDE68A]';

  const iconColor =
    rem.team === 'evil'
      ? 'text-[#F87171]'
      : rem.team === 'good'
      ? 'text-[#38BDF8]'
      : 'text-[#FBBF24]';

  if (size === 'xs') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`${rem.label} (${rem.indonesianLabel}) — Klik untuk melepas`}
        aria-label={`Hapus token pengingat ${rem.indonesianLabel}`}
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center shadow transition-transform hover:scale-110 active:scale-95 cursor-pointer ${toneClasses}`}
      >
        <RoleGlyph roleId={rem.roleId} className={`w-3.5 h-3.5 ${iconColor}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      aria-label={`Token pengingat ${rem.indonesianLabel}`}
      className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 min-h-[42px] text-left transition-all cursor-pointer select-none ${toneClasses} ${
        isSelected
          ? 'ring-2 ring-[#FBBF24] scale-[1.02] shadow-md'
          : 'hover:brightness-110 active:scale-95'
      }`}
    >
      <span className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center shrink-0">
        <RoleGlyph roleId={rem.roleId} className={`w-3.5 h-3.5 ${iconColor}`} />
      </span>
      <span className="flex flex-col leading-none pr-1">
        <span className="text-xs font-semibold text-[#F5EFE6] whitespace-nowrap">
          {rem.label}
        </span>
        <span className="text-[10px] text-[#C8C0B3] whitespace-nowrap mt-0.5">
          {rem.indonesianLabel}
        </span>
      </span>
    </button>
  );
}
