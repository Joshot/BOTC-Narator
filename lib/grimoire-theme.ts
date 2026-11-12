/**
 * Authentic Grimoire visual tokens, material finishes, Velvet surfaces,
 * and asset path resolvers adapted faithfully from botcgrimoire-main (Trouble Brewing).
 */

export type VelvetColour = 'midnight' | 'burgundy' | 'forest' | 'plum';

export type TeamKey = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller';
export type AlignmentSide = 'good' | 'evil';

export const VELVET_COLOURS: readonly {
  readonly id: VelvetColour;
  readonly label: string;
  readonly swatch: string;
  readonly art: string;
}[] = [
  { id: 'midnight', label: 'Midnight Felt', swatch: '#18242e', art: '/art/velvet/midnight.webp' },
  { id: 'burgundy', label: 'Burgundy Crimson', swatch: '#4f161b', art: '/art/velvet/burgundy.webp' },
  { id: 'forest', label: 'Forest Baize', swatch: '#142f22', art: '/art/velvet/forest.webp' },
  { id: 'plum', label: 'Plum Velvet', swatch: '#2e1635', art: '/art/velvet/plum.webp' },
] as const;

export const GRIMOIRE_PALETTE = {
  felt: '#121614',
  feltRaised: '#232b26',
  parchment: '#eadbbf',
  parchmentShade: '#d1bb87',
  paperInset: 'rgba(102, 83, 63, 0.08)',
  paperPressed: 'rgba(102, 83, 63, 0.18)',
  ink: '#2a2018',
  inkMuted: '#5c4a37',
  text: '#efe6d2',
  muted: '#a89f8c',
  line: '#2f3a33',
  accent: '#c9963a',
  onAccent: '#2a2018',
  danger: '#b03a2e',
  onDanger: '#efe6d2',
  teamOnPaper: {
    townsfolk: '#0064ac',
    outsider: '#0064ac',
    minion: '#760a0d',
    demon: '#760a0d',
    traveller: '#5a3a7a',
  } satisfies Record<TeamKey, string>,
  teamOnFelt: {
    townsfolk: '#5fa3e6',
    outsider: '#5fa3e6',
    minion: '#e0574b',
    demon: '#e0574b',
    traveller: '#a884d2',
  } satisfies Record<TeamKey, string>,
} as const;

export const TOKEN_MATERIAL = {
  edge: '#b88a44',
  edgeMid: '#6f5129',
  edgeShade: '#2c1f12',
  rim: 'inset 0 1.5px 2px rgba(255, 250, 226, 0.65), inset 0 -1.5px 3px rgba(36, 21, 8, 0.55)',
  reminderRim: 'inset 0 0 0 1.5px rgba(239, 214, 152, 0.65), inset 0 0 0 3px rgba(0, 0, 0, 0.36)',
  deadFilter: 'saturate(0.38) brightness(0.84) contrast(1.04)',
} as const;

export const TEAM_TOKEN_ACCENT: Record<
  TeamKey,
  { ring: string; glow: string; badge: string }
> = {
  townsfolk: {
    ring: 'rgba(12, 95, 168, 0.42)',
    glow: 'rgba(59, 130, 246, 0.14)',
    badge: '#1d4ed8',
  },
  outsider: {
    ring: 'rgba(14, 116, 144, 0.45)',
    glow: 'rgba(6, 182, 212, 0.14)',
    badge: '#0e7490',
  },
  minion: {
    ring: 'rgba(153, 27, 27, 0.48)',
    glow: 'rgba(220, 38, 38, 0.15)',
    badge: '#b91c1c',
  },
  demon: {
    ring: 'rgba(127, 29, 29, 0.62)',
    glow: 'rgba(185, 28, 28, 0.2)',
    badge: '#991b1b',
  },
  traveller: {
    ring: 'rgba(109, 40, 217, 0.48)',
    glow: 'rgba(139, 92, 246, 0.15)',
    badge: '#6d28d9',
  },
};

export const BOARD_CHROME = {
  blockBg: 'rgba(42, 32, 24, 0.72)',
  blockBorder: 'rgba(201, 150, 58, 0.34)',
  wellBg: 'rgba(18, 22, 20, 0.72)',
  wellBorder: 'rgba(239, 230, 210, 0.14)',
  voteSurface: 'rgba(24, 24, 28, 0.94)',
  voteEdge: 'rgba(201, 150, 58, 0.48)',
  voteFitting: 'rgba(239, 230, 210, 0.14)',
  liftedShadow: '0 8px 20px rgba(0, 0, 0, 0.52), 0 2px 5px rgba(0, 0, 0, 0.34)',
} as const;

export const SEAT_METRICS = {
  nameGap: 4,
  nameMinHeight: 15,
  reminderSize: (token: number) => Math.round(Math.min(token, Math.max(32, token * 0.6))),
  seatNameSize: (token: number) => Math.max(11, Math.min(13, Math.round(token * 0.145))),
} as const;

export function tokenShadow(size: number): string {
  const drop = Math.max(2, Math.round(size * 0.04));
  const spread = Math.max(4, Math.round(size * 0.09));
  return `0 ${drop}px ${spread}px rgba(0, 0, 0, 0.56), 0 1px 3px rgba(0, 0, 0, 0.42)`;
}

export function printedNameMetrics(diameter: number) {
  return {
    fontSize: Math.max(10, Math.round(diameter * 0.16)),
    radiusRatio: 0.405,
  };
}

/** Map app role IDs (e.g. `fortune_teller`, `scarlet_woman`) to art file slugs. */
export function getCharacterArtSlug(roleId: string): string {
  switch (roleId) {
    case 'fortune_teller':
      return 'fortuneteller';
    case 'scarlet_woman':
      return 'scarletwoman';
    default:
      return roleId;
  }
}

export function getCharacterArtUri(
  roleId: string,
  team: TeamKey,
  alignment?: AlignmentSide
): string {
  const side: AlignmentSide =
    alignment ?? (team === 'minion' || team === 'demon' ? 'evil' : 'good');
  const suffix = side === 'evil' ? 'e' : 'g';
  const slug = getCharacterArtSlug(roleId);
  // All 22 core Trouble Brewing + 5 TB Travellers exist in /art/characters/tb/
  const tbKnown = new Set([
    'washerwoman',
    'librarian',
    'investigator',
    'chef',
    'empath',
    'fortuneteller',
    'undertaker',
    'monk',
    'ravenkeeper',
    'virgin',
    'slayer',
    'soldier',
    'mayor',
    'butler',
    'drunk',
    'recluse',
    'saint',
    'poisoner',
    'spy',
    'scarletwoman',
    'baron',
    'imp',
    'thief',
    'bureaucrat',
    'gunslinger',
    'beggar',
    'scapegoat',
  ]);
  if (tbKnown.has(slug)) {
    return `/art/characters/tb/${slug}_${suffix}.webp`;
  }
  return `/art/characters/generic/${team}_${suffix}.webp`;
}

export const ART_ASSETS = {
  paperVellum: '/art/paper/warm-vellum.webp',
  tokenBg: '/art/tokens/character_bg.webp',
  tokenBack: '/art/tokens/character_back.webp',
  reminderBg: '/art/tokens/reminder_bg.webp',
  editionTb: '/art/editions/tb.webp',
  markers: {
    setup: '/art/tokens/markers/setup.webp',
    firstNight: '/art/tokens/markers/firstnight.webp',
    otherNight: '/art/tokens/markers/othernight.webp',
    count: (n: number) => `/art/tokens/markers/count_${Math.max(1, Math.min(7, n))}.webp`,
  },
  generic: {
    dusk: '/art/generic/dusk.webp',
    dawn: '/art/generic/dawn.webp',
    minionInfo: '/art/generic/minioninfo.webp',
    demonInfo: '/art/generic/demoninfo.webp',
  },
} as const;
