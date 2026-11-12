'use client';

import React, { useId } from 'react';
import {
  ART_ASSETS,
  AlignmentSide,
  GRIMOIRE_PALETTE,
  TOKEN_MATERIAL,
  TeamKey,
  getCharacterArtUri,
  printedNameMetrics,
  tokenShadow,
} from '@/lib/grimoire-theme';
import {
  REMINDER_MAP,
  ROLE_MAP,
  RoleDefinition,
  getCustomNoteText,
  noteInitials,
} from '@/lib/botc-data';

interface TokenDiscProps {
  size: number;
  dead?: boolean;
  selected?: boolean;
  ringColor?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Physical cut cardboard disc shell with 3D underside rim and soft contact shadow.
 */
export function TokenDisc({
  size,
  dead = false,
  selected = false,
  ringColor,
  children,
  className = '',
  style,
}: TokenDiscProps) {
  const edgeThickness = Math.max(2, Math.round(size * 0.036));
  const rimShadow = selected
    ? `0 0 0 2.5px ${ringColor || GRIMOIRE_PALETTE.accent}, ${tokenShadow(size)}`
    : ringColor
    ? `0 0 0 2px ${ringColor}, ${tokenShadow(size)}`
    : tokenShadow(size);

  return (
    <div
      className={`relative rounded-full select-none shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        paddingBottom: edgeThickness,
        backgroundColor: TOKEN_MATERIAL.edgeShade,
        backgroundImage: `linear-gradient(180deg, ${TOKEN_MATERIAL.edge} 0%, ${TOKEN_MATERIAL.edgeShade} 100%)`,
        boxShadow: rimShadow,
        filter: dead ? TOKEN_MATERIAL.deadFilter : undefined,
        ...style,
      }}
    >
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          boxShadow: TOKEN_MATERIAL.rim,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Curved character name rendered along the lower semi-circular rim in Grenze serif.
 */
function CurvedTokenName({
  name,
  diameter,
  color = '#1e150e',
}: {
  name: string;
  diameter: number;
  color?: string;
}) {
  const uid = useId().replace(/:/g, '_');
  const { fontSize } = printedNameMetrics(diameter);
  // Automatically scale SVG font size slightly for multi-word TB names
  const lenFactor = name.length >= 13 ? 0.8 : name.length >= 10 ? 0.9 : 1;
  const svgFont = Math.max(9.5, Math.min(14.5, (fontSize / Math.max(40, diameter)) * 100 * lenFactor));

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    >
      <defs>
        <path id={`arc_${uid}`} d="M 11,52 A 39,39 0 0,0 89,52" />
      </defs>
      <text
        fill={color}
        fontSize={svgFont}
        fontWeight="700"
        fontFamily="var(--font-display), Georgia, serif"
        letterSpacing="0.025em"
      >
        <textPath href={`#arc_${uid}`} startOffset="50%" textAnchor="middle">
          {name}
        </textPath>
      </text>
    </svg>
  );
}

/**
 * Curved reminder text along the bottom arc of a reminder chip.
 */
function CurvedReminderLabel({
  label,
  size,
}: {
  label: string;
  size: number;
}) {
  const uid = useId().replace(/:/g, '_');
  const trimmed = label.length > 14 ? `${label.slice(0, 12)}..` : label;
  const fontSize = Math.max(11, Math.min(15.5, size < 44 ? 14 : 12.5));

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    >
      <defs>
        <path id={`rem_${uid}`} d="M 12,56 A 38,38 0 0,0 88,56" />
      </defs>
      <text
        fill={GRIMOIRE_PALETTE.text}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="var(--font-display), Georgia, serif"
        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.92)' }}
      >
        <textPath href={`#rem_${uid}`} startOffset="50%" textAnchor="middle">
          {trimmed}
        </textPath>
      </text>
    </svg>
  );
}

/** Highlight brass/bold `[+N ...]` setup brackets when rendering full token ability text. */
export function renderAbilitySegments(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, idx) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <strong key={idx} className="font-bold text-[#760a0d] dark:text-[#f2c56b]">
        {part}
      </strong>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

interface CharacterTokenFrontProps {
  role: RoleDefinition;
  size: number;
  alignment?: AlignmentSide;
  dead?: boolean;
  selected?: boolean;
  isPoisoned?: boolean;
  hasGhostVote?: boolean;
  deathCause?: 'demon' | 'execution' | 'slayer';
  showSetupLeaf?: boolean;
  showAbility?: boolean;
  className?: string;
}

/**
 * Authentic Blood on the Clocktower circular token using character_bg.webp,
 * painted portrait (_g/_e.webp), full-disc leaf markers, and Grenze curved title.
 */
export function CharacterTokenFront({
  role,
  size,
  alignment,
  dead = false,
  selected = false,
  isPoisoned = false,
  hasGhostVote = false,
  deathCause,
  showSetupLeaf = true,
  showAbility = false,
  className = '',
}: CharacterTokenFrontProps) {
  const team = role.team as TeamKey;
  const artUri = getCharacterArtUri(role.artId || role.id, team, alignment);
  const ringColor = isPoisoned
    ? '#dc2626'
    : selected
    ? GRIMOIRE_PALETTE.accent
    : undefined;

  return (
    <TokenDisc
      size={size}
      dead={dead}
      selected={selected}
      ringColor={ringColor}
      className={className}
    >
      {/* Aged parchment grain disc */}
      <img
        src={ART_ASSETS.tokenBg}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 w-full h-full object-cover"
      />

      {/* Full-disc botanical markers positioned around perimeter */}
      {showSetupLeaf && role.setupModifier && (
        <img
          src={ART_ASSETS.markers.setup}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain"
        />
      )}
      {role.firstNightOrder !== null && (
        <img
          src={ART_ASSETS.markers.firstNight}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain"
        />
      )}
      {role.otherNightOrder !== null && (
        <img
          src={ART_ASSETS.markers.otherNight}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain"
        />
      )}
      {typeof role.reminderCountBadge === 'number' && role.reminderCountBadge > 0 && (
        <img
          src={ART_ASSETS.markers.count(role.reminderCountBadge)}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Main character icon */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          padding: showAbility ? '18% 18% 24%' : '14% 16% 24%',
        }}
      >
        <img
          src={artUri}
          alt={role.name}
          draggable={false}
          className="w-full h-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)]"
        />
      </div>

      {/* Optional compact English ability print on oversized bag/reveal tokens */}
      {showAbility && size >= 110 && role.abilityEn && (
        <div
          className="pointer-events-none absolute left-[17%] right-[17%] top-[9%] text-center leading-[1.06] font-sans text-[#2a2018]/90"
          style={{ fontSize: Math.max(6.5, Math.round(size * 0.056)) }}
        >
          {role.abilityEn.length > 72 ? `${role.abilityEn.slice(0, 69)}...` : role.abilityEn}
        </div>
      )}

      {/* Curved character title at 6 o'clock */}
      <CurvedTokenName name={role.name} diameter={size} />

      {/* Poisoned red inner pulse indicator */}
      {isPoisoned && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-red-600/80 animate-pulse"
        />
      )}

      {/* Dead shroud tint + Ghost Vote / Cause glyph */}
      {dead && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#121614]/25 flex items-start justify-center pt-[6%]"
        >
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider shadow"
            style={{
              backgroundColor:
                deathCause === 'demon'
                  ? 'rgba(118, 10, 13, 0.9)'
                  : 'rgba(42, 32, 24, 0.9)',
              color: GRIMOIRE_PALETTE.text,
              border: '1px solid rgba(201, 150, 58, 0.5)',
            }}
          >
            {deathCause === 'demon' ? 'Malam' : deathCause === 'slayer' ? 'Slayer' : 'Gantung'}
          </span>
        </div>
      )}

      {/* Ghost Vote shroud crystal indicator on top-right edge when dead with vote */}
      {dead && hasGhostVote && (
        <div
          title="Ghost Vote Tersedia"
          className="pointer-events-none absolute bottom-[22%] right-[10%] w-[20%] h-[20%] min-w-[12px] min-h-[12px] rounded-full border border-[#efe6d2]/80 bg-[#c9963a] shadow"
        />
      )}
    </TokenDisc>
  );
}

/**
 * Face-down character card back (crescent moon filigree) for Velvet Bag Pick mode.
 */
export function TokenBackDisc({
  size,
  highlighted = false,
  className = '',
}: {
  size: number;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <TokenDisc
      size={size}
      selected={highlighted}
      ringColor={highlighted ? GRIMOIRE_PALETTE.accent : undefined}
      className={className}
    >
      <img
        src={ART_ASSETS.tokenBack}
        alt="Token Tertutup"
        draggable={false}
        className="pointer-events-none w-full h-full object-cover"
      />
    </TokenDisc>
  );
}

/**
 * Tactile dark plum Reminder Chit with reminder_bg.webp texture, double rim,
 * source character crest (or bold note initials), and curved serif label.
 */
export function ReminderDisc({
  reminderId,
  customNote,
  size = 44,
  className = '',
  showTooltip = true,
}: {
  reminderId: string;
  customNote?: string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}) {
  const isCustom = reminderId.startsWith('note:');
  const def = REMINDER_MAP[reminderId];
  const noteText = isCustom ? getCustomNoteText(reminderId, customNote) : '';
  const role = !isCustom && def ? ROLE_MAP[def.roleId] : null;
  const artUri = role
    ? getCharacterArtUri(role.artId || role.id, role.team as TeamKey)
    : undefined;

  const label = isCustom ? noteText || 'Catatan' : def?.indonesianLabel || def?.label || reminderId;
  const initials = isCustom ? noteInitials(noteText || 'CAT') : null;

  return (
    <div
      title={showTooltip ? `${label}${def?.description ? ` — ${def.description}` : ''}` : undefined}
      className={`relative rounded-full select-none overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#2d1c35',
        boxShadow: `0 2px 5px rgba(0, 0, 0, 0.55), ${TOKEN_MATERIAL.reminderRim}`,
      }}
    >
      <img
        src={ART_ASSETS.reminderBg}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 w-full h-full object-cover"
      />

      {isCustom ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-[14%] flex items-center justify-center font-display font-bold tracking-wide text-[#efe6d2]"
          style={{
            fontSize: Math.max(10, Math.round(size * 0.28)),
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
          }}
        >
          {initials}
        </div>
      ) : artUri ? (
        <div className="pointer-events-none absolute inset-x-[22%] top-[10%] bottom-[34%] flex items-center justify-center">
          <img
            src={artUri}
            alt=""
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
          />
        </div>
      ) : null}

      <CurvedReminderLabel label={label} size={size} />
    </div>
  );
}

/**
 * Smooth 3D card-flip stage for Pick-from-Bag reveal (rotateY 180deg).
 */
export function TokenFlip3D({
  flipped,
  size,
  front,
  back,
  onTransitionEnd,
}: {
  flipped: boolean;
  size: number;
  front: React.ReactNode;
  back: React.ReactNode;
  onTransitionEnd?: () => void;
}) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: size,
        height: size,
        perspective: '1000px',
      }}
    >
      <div
        onTransitionEnd={onTransitionEnd}
        className="relative w-full h-full preserve-3d transition-transform duration-700 ease-out"
        style={{
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div className="absolute inset-0 backface-hidden flex items-center justify-center">
          {back}
        </div>
        <div
          className="absolute inset-0 backface-hidden flex items-center justify-center"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {front}
        </div>
      </div>
    </div>
  );
}
