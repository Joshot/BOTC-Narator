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
  const [imageError, setImageError] = React.useState(false);
  const role = ROLE_MAP[roleId];
  if (!role) return null;

  const styles = getTeamColorStyles(role.team);

  // Enlarged sizes for high visibility and crisp display on mobile, tablet, and desktop
  const sizeMap = {
    sm: {
      circle: 'w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]',
      icon: 'w-6 h-6',
    },
    md: {
      circle: 'w-[88px] h-[88px] sm:w-[104px] sm:h-[104px]',
      icon: 'w-7 h-7',
    },
    lg: {
      circle: 'w-[108px] h-[108px] sm:w-[124px] sm:h-[124px]',
      icon: 'w-10 h-10',
    },
    xl: {
      circle: 'w-36 h-36 sm:w-48 sm:h-48',
      icon: 'w-14 h-14',
    },
  }[size];

  const nameLines = formatRoleNameLines(role.name);

  return (
    <div
      className={`relative rounded-full shrink-0 aspect-square flex items-center justify-center select-none shadow-2xl transition-all duration-200 bg-[#14111B] ${
        sizeMap.circle
      } ${
        isDead
          ? 'border-[3.5px] border-[#22202A] ring-2 ring-black/90 shadow-[0_0_16px_rgba(0,0,0,0.95)]'
          : styles.ring
      }`}
    >
      {/* Storyteller Secret Drunk Halo */}
      {isDrunkSecret && (
        <div
          className="absolute -inset-[3px] rounded-full border-[3.5px] border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.85)] pointer-events-none z-10"
          title="Sebenarnya adalah THE DRUNK"
        />
      )}

      {/* Storyteller Poisoned Pulsing Halo */}
      {isPoisoned && (
        <div
          className="absolute -inset-[3px] rounded-full border-[3.5px] border-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.85)] pointer-events-none animate-pulse z-10"
          title="Sedang Diracun (Poisoned)"
        />
      )}

      {/* Authentic Official Token Artwork from PDF */}
      {!imageError ? (
        <img
          src={`/tokens/${role.id}.png`}
          alt={role.name}
          draggable={false}
          onError={() => setImageError(true)}
          className={`w-full h-full object-contain rounded-full select-none pointer-events-none filter drop-shadow transition-all duration-200 ${
            isDead
              ? 'grayscale-[95%] brightness-[0.35] contrast-[1.25]'
              : ''
          }`}
        />
      ) : (
        /* Fallback if image unavailable */
        <div
          className={`w-full h-full rounded-full flex flex-col items-center justify-center p-1 ${styles.bgGradient}`}
        >
          <RoleGlyph roleId={role.id} className={`${sizeMap.icon} ${styles.iconText} shrink-0 mb-0.5`} />
          <div className="w-full px-0.5 font-sans font-black uppercase text-center leading-[1.08] text-white text-[9px]">
            {nameLines.map((line, idx) => (
              <span key={idx} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deep Black Death Shroud Overlay for Dead Tokens */}
      {isDead && (
        <div className="absolute inset-0 rounded-full bg-black/60 pointer-events-none z-10" />
      )}

      {/* Differentiated Death Shroud Ribbon: Demon Kill vs Execution */}
      {isDead && (
        deathCause === 'demon' ? (
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 bg-[#2C0609] border-2 border-[#EF4444] rounded-md px-2 py-0.5 flex items-center justify-center gap-1 shadow-2xl whitespace-nowrap"
            title="Mati: Dibunuh Demon Malam Hari"
          >
            <Swords className="w-3.5 h-3.5 text-[#FCA5A5]" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-[#FECACA] uppercase tracking-wider">
              DIBUNUH DEMON
            </span>
          </div>
        ) : deathCause === 'execution' ? (
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 bg-[#241705] border-2 border-[#D4AF37] rounded-md px-2 py-0.5 flex items-center justify-center gap-1 shadow-2xl whitespace-nowrap"
            title="Mati: Digantung / Eksekusi Siang Hari"
          >
            <Gavel className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-[#FDE68A] uppercase tracking-wider">
              DIGANTUNG
            </span>
          </div>
        ) : (
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 bg-[#121118] border-2 border-[#71717A] rounded-md px-2 py-0.5 flex items-center justify-center gap-1 shadow-2xl whitespace-nowrap"
            title="Pemain Telah Mati"
          >
            <Skull className="w-3.5 h-3.5 text-[#E4E4E7]" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-[#E4E4E7] uppercase tracking-wider">
              MATI
            </span>
          </div>
        )
      )}

      {showIndonesianSubtitle && (
        <span className="absolute -bottom-4 text-[10px] font-bold text-[#D6CFC2] truncate max-w-[90%] whitespace-nowrap">
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
      ? 'border-[#EF4444] bg-red-950/80 dark:bg-[#2D171A] text-red-200'
      : rem.team === 'good'
      ? 'border-[#38BDF8] bg-sky-950/80 dark:bg-[#162536] text-sky-200'
      : 'border-[#D4AF37] bg-amber-950/80 dark:bg-[#2B2418] text-amber-200';

  if (size === 'xs') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`${rem.label} (${rem.indonesianLabel}) — Klik untuk melepas`}
        aria-label={`Hapus token pengingat ${rem.indonesianLabel}`}
        className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shadow-lg border border-white/30 transition-transform hover:scale-115 active:scale-90 cursor-pointer shrink-0 bg-[#14141B]"
      >
        <img
          src={`/reminders/${rem.id}.png`}
          alt={rem.label}
          className="w-full h-full object-cover filter drop-shadow select-none pointer-events-none"
          loading="lazy"
        />
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
      className={`group flex items-center gap-2.5 rounded-2xl border-2 p-2 min-h-[50px] text-left transition-all cursor-pointer select-none ${toneClasses} ${
        isSelected
          ? 'ring-2 ring-[#FBBF24] scale-[1.02] shadow-xl'
          : 'hover:brightness-110 active:scale-98 shadow-md'
      }`}
    >
      <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border border-white/30 shadow-md bg-[#14141B]">
        <img
          src={`/reminders/${rem.id}.png`}
          alt={rem.label}
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="text-xs sm:text-sm font-bold text-slate-100 dark:text-[#F5EFE6] truncate">
          {rem.label}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-300 dark:text-[#D6CFC2] truncate mt-0.5">
          {rem.indonesianLabel}
        </span>
      </div>
    </button>
  );
}

/**
 * Enhanced authentic Reminder Token Card for the Grimoire Tray (Baki Token Pengingat).
 * Highly detailed with authentic medallion art, ownership role, description, and mobile responsiveness.
 */
export function ReminderTokenTrayCard({
  reminderId,
  isSelected = false,
  onClick,
  onDragStart,
  showRuleDetail = false,
}: {
  reminderId: string;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  showRuleDetail?: boolean;
}) {
  const rem = REMINDER_MAP[reminderId];
  if (!rem) return null;

  const role = ROLE_MAP[rem.roleId];

  const borderClass =
    rem.team === 'evil'
      ? 'border-red-500/70 dark:border-[#EF4444]/80'
      : rem.team === 'good'
      ? 'border-sky-500/70 dark:border-[#38BDF8]/80'
      : 'border-amber-500/70 dark:border-[#D4AF37]/80';

  const badgeBg =
    rem.team === 'evil'
      ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
      : rem.team === 'good'
      ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30'
      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`relative group flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer select-none text-left shadow-sm hover:shadow-md ${borderClass} ${
        isSelected
          ? 'bg-amber-100/90 dark:bg-[#2C2415] ring-2 ring-amber-400 dark:ring-[#D4AF37] scale-[1.02]'
          : 'bg-white/95 dark:bg-[#15121E] hover:bg-slate-50 dark:hover:bg-[#1E192B]'
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        {/* Authentic 900x900 Reminder Medallion Image */}
        <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden shrink-0 border-2 border-white/40 shadow-md bg-[#100E17] group-hover:scale-105 transition-transform">
          <img
            src={`/reminders/${rem.id}.png`}
            alt={rem.label}
            className="w-full h-full object-cover select-none pointer-events-none"
            loading="lazy"
          />
        </div>

        {/* Labels & Role Tag */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <span className="font-display font-black text-xs sm:text-sm text-slate-900 dark:text-[#EDEAF0] truncate tracking-wide">
              {rem.label}
            </span>
            <span
              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border shrink-0 ${badgeBg}`}
            >
              {role?.name || rem.team}
            </span>
          </div>

          <p className="text-[11px] font-semibold text-purple-900 dark:text-[#FDE68A] truncate">
            {rem.indonesianLabel}
          </p>

          <p className="text-[10px] text-slate-500 dark:text-[#8E8A9E] truncate">
            Peran: <strong className="text-slate-700 dark:text-slate-300">{role?.name || '-'}</strong>
          </p>
        </div>
      </div>

      {/* Optional Expanded Rule / Effect Details */}
      {showRuleDetail && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/[0.08] text-[10px] text-slate-600 dark:text-[#B8B0A2] leading-tight">
          {rem.description}
        </div>
      )}
    </div>
  );
}
