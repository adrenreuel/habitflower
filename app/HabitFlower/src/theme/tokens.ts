/**
 * Habitflower design tokens (HANDOFF.md section 5).
 * This is the only file allowed to contain raw colour values for UI.
 * Selection is always a tinted fill, never an outline.
 */

export const colors = {
  /** Screen base under the grain (UPDATES-2026-11-16). */
  bg: '#1A0C1D',
  bgDeep: '#180B1B',
  /** Bottom nav: no top border and no shadow. */
  tabBg: '#2F1F36',
  sheet: '#241628',
  card: '#2A1C2F',
  raised: '#3A2A40',
  divider: '#3D2D43',

  text: '#F6EEF8',
  text2: '#B9A8C0',
  text3: '#8C7992',
  /** Use for small (<15px) tertiary text, better contrast than text3. */
  text3Small: '#A895AE',

  accent: '#74D447',
  onAccent: '#1F1023',
  accentTint: 'rgba(116,212,71,0.22)',
  accentTintText: '#B8EE98',

  missed: 'rgba(255,158,107,0.24)',
  missedText: '#FFB894',
  wilting: '#FFB894',
  driedUp: '#FF7B7B',
  driedUpTint: 'rgba(255,123,123,0.16)',
  destructive: '#FF7B7B',

  pausedStripeA: 'rgba(122,167,255,0.26)',
  pausedStripeB: 'rgba(122,167,255,0.10)',
  /** Small legend swatch: the same stripes, strong enough to read at 10px. */
  pausedSwatchA: 'rgba(122,167,255,0.85)',
  pausedSwatchB: 'rgba(122,167,255,0.35)',
  pausedText: '#A9C6FF',
  info: 'rgba(122,167,255,0.18)',
  infoStrong: 'rgba(122,167,255,0.22)',
  infoText: '#A9C6FF',

  scrim: 'rgba(12,5,14,0.6)',
  transparent: 'transparent',

  // Supporting values taken from the mockups.
  cardPressed: '#33243A',
  chipMutedText: '#C9B9CF',
  restRing: '#6E5B74',
  completeHeading: '#9BE36F',
  onAccentDeep: '#142008',
  badge: '#FF9E6B',
  badgeText: '#2A1206',
  missedDot: 'rgba(255,158,107,0.55)',
  chipText: '#E4D7E9',
  inputPlaceholder: '#8C7992',
  switchOn: '#4E8A2F',
  switchOff: '#4A3950',
  grabHandle: '#4A3950',
  sheetScrim: 'rgba(10,4,12,0.72)',
  checkboxOff: '#463550',
  sheetBody: '#D9CCDF',
  deleteText: '#FF8F85',
  onDelete: '#2A0B08',
  selectedDesc: '#9BCB80',
  headerBorder: '#33243A',
  taskBlue: '#7AA7FF',
  onTaskBlue: '#0F1E3A',
  friendPink: '#F28FB8',
  friendPinkText: '#F7B6CF',
  onFriendPink: '#2A0E1A',
  friendTileRing: '#2E1D33',
  repeatIcon: '#C9B6F4',
  shade: 'rgba(0,0,0,0.2)',
  overdueBox: 'rgba(255,158,107,0.32)',
  doneDueText: '#7D6A83',
  onSunflower: '#3A2600',
} as const;

export type FlowerKind =
  | 'sunflower'
  | 'daisy'
  | 'tulip'
  | 'rose'
  | 'spider'
  | 'lavender'
  | 'blossom'
  | 'marigold';

export const flowerColors: Record<FlowerKind, string> = {
  sunflower: '#FFC93C',
  daisy: '#F7F2EA',
  tulip: '#FF6B8A',
  rose: '#E8455A',
  spider: '#FF5A4E',
  lavender: '#A98BEA',
  blossom: '#FFB7C9',
  marigold: '#FF9F1C',
};

/** Text on a solid flower-colour button (taken from the growth moment boards). */
const ON_FLOWER: Partial<Record<FlowerKind, string>> = {
  sunflower: '#3A2600',
  marigold: '#2A1206',
  tulip: '#2A0A14',
  rose: '#FFFFFF',
};

/** Habit pages use the flower colour as accent; this is the text colour on top of it. */
export function onFlowerColor(kind: FlowerKind): string {
  return ON_FLOWER[kind] ?? colors.onAccent;
}

/** rgba() helper for tints of a hex colour. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const space = {
  page: 20,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  card: 22,
  cardLg: 24,
  chip: 20,
  row: 18,
  sheet: 28,
  tile: 18,
  pill: 999,
} as const;

export const sizes = {
  chipHeight: 40,
  buttonHeight: 56,
  buttonHeightSm: 52,
  buttonHeightLg: 60,
  tapTarget: 44,
  grabHandle: { width: 40, height: 5 },
  tabBar: 84,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  /** Young Serif 400: display text only (page titles, habit names, celebrations, empty-state titles). */
  display: 'YoungSerif_400Regular',
} as const;

/** Display letter spacing for Young Serif. */
export const DISPLAY_TRACKING = -0.3;

export type Weight = 400 | 500 | 600 | 700 | 800;

export function fontFor(weight: Weight): string {
  switch (weight) {
    case 400:
      return fonts.regular;
    case 500:
      return fonts.medium;
    case 600:
      return fonts.semibold;
    case 700:
      return fonts.bold;
    default:
      return fonts.extrabold;
  }
}

/** Type scale. Page titles 30-32/800, section headings 18/700, labels 13/800 uppercase +0.6. */
export const type = {
  /** Display: Young Serif. Sizes: page titles 30 to 32, empty-state titles 22, celebration 28. */
  display: { fontFamily: fonts.display, letterSpacing: DISPLAY_TRACKING, color: colors.text },
  pageTitle: { fontFamily: fonts.display, fontSize: 31, lineHeight: 38, letterSpacing: DISPLAY_TRACKING, color: colors.text },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.text },
  section: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: colors.text2,
  },
  body: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.text2 },
  small: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, color: colors.text2 },
  button: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22 },
} as const;

export const theme = { colors, flowerColors, space, radius, sizes, fonts, type };
export default theme;

/** Mix a hex colour toward white (chips on habit pages, e.g. #FF9F1C -> #FFD29A). */
export function lighten(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mixc = (c: number) => Math.round(c + (255 - c) * t);
  const r = mixc((n >> 16) & 255);
  const g = mixc((n >> 8) & 255);
  const b = mixc(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

export const calendar = {
  emptyCell: '#3A2A40',
  emptyText: '#7D6A83',
  doneTextOnColor: '#1F1023',
  revivedTitle: '#C8F2AE',
  revivedBody: '#D9EFCB',
  driedChipText: '#FF9C9C',
  windowDoneSub: '#FFC27A',
  /** Disabled month arrow in the History sheet. */
  navDisabled: '#6E5C75',
} as const;

/** Glass dome over paused flowers (Archived.dc.html). */
export const glass = {
  fill: 'rgba(210,230,255,0.10)',
  stroke: 'rgba(220,235,255,0.6)',
  shine: 'rgba(255,255,255,0.5)',
  knob: 'rgba(210,230,255,0.25)',
  base: '#5A4660',
  toastText: '#C8F2AE',
} as const;

/** Drop shadows (CSS box-shadow strings, RN new architecture). */
export const shadows = {
  /** Cards floating over a tinted tile, e.g. the Friends empty-state art. */
  floatingCard: '0 10px 24px rgba(10,4,12,0.45)',
  /** Blurred shadow under the soil on habit pages. */
  soil: 'rgba(0,0,0,0.35)',
};

/** Soil oval drawn behind a swaying flower (it never sways itself). */
export const soilColor = '#6B4436';

/**
 * Soft gradient of the flower colour at the top of a habit page:
 * 0.24 at the top, 0.09 at 240pt, gone by 420pt.
 */
export const pageTint = { top: 0.24, mid: 0.09, midAt: 240, endAt: 420 } as const;
/** Dried up pages are tinted brown instead of the flower colour. */
export const driedUpPageColor = '#D6966E';

/** Growth moments (full-screen celebration when a flower changes state). */
export const growth = {
  bg: '#140918',
  glowAlpha: 0.22,
  rayAlpha: 0.2,
  track: 'rgba(42,28,47,0.85)',
  trackLine: '#3A2A40',
  futureText: '#6E5C75',
  body: '#C9B9CF',
} as const;

/** Away mode overlay on Home. */
export const away = {
  scrim: 'rgba(20,9,24,0.74)',
  title: '#E3ECFF',
  body: '#A9B8D9',
  iconTile: 'rgba(122,167,255,0.18)',
  button: '#F6EEF8',
  onButton: '#1F1023',
} as const;

/** Flower picker on New / Edit habit. */
export const picker = {
  changePill: '#F6EEF8',
  onChangePill: '#1F1023',
  usedTag: '#3D2D43',
  usedText: '#C9B9CF',
  pickButton: '#F6EEF8',
  onPickButton: '#1F1023',
} as const;

/** Blue info note, e.g. "Changes start tomorrow." */
export const infoNote = { bg: 'rgba(122,167,255,0.12)', text: '#C9D8FF' } as const;

/** Seed-packet suggestion cards on the empty Home: meta line colour per flower. */
export const packetMeta: Partial<Record<FlowerKind, string>> = {
  lavender: '#CDB9F5',
  sunflower: '#FFE08A',
  blossom: '#FFD3DF',
  daisy: '#E9E2D6',
};

export const celebrationScrim = 'rgba(20,9,24,0.94)';

/** Continuous (squircle) corners for cards and sheets. */
export const squircle = { borderCurve: 'continuous' as const };

/** Tinted icon tiles on Settings rows: [background, icon]. */
export const iconTiles = {
  green: ['rgba(116,212,71,0.18)', '#B8EE98'],
  pink: ['rgba(242,143,184,0.18)', '#F7B3CF'],
  blue: ['rgba(122,167,255,0.18)', '#A9C6FF'],
  purple: ['rgba(169,139,234,0.20)', '#C9B6F4'],
  amber: ['rgba(255,201,60,0.18)', '#FFD873'],
  grey: ['#3A2A40', '#E4D7E9'],
} as const;

export const settingsGood = '#9BDB78';
export const onLight = '#120814';

/**
 * Bottom tab bar geometry, shared by the tab bar and the "Add new" sheet so
 * its close button lands exactly where the + button is. The + is a green
 * pill sitting inside the bar, lined up with the other tabs.
 */
export const tabBar = {
  paddingTop: 8,
  slotMinHeight: 44,
  addWidth: 52,
  addHeight: 40,
  /** The pill sits this much above the centre of its slot. */
  addNudge: 4,
  minBottomPadding: 12,
} as const;

/** Distance from the screen bottom to the bottom edge of the + button. */
export function addButtonBottom(insetBottom: number): number {
  const pad = Math.max(insetBottom, tabBar.minBottomPadding);
  const belowPillInSlot = (tabBar.slotMinHeight - tabBar.addHeight) / 2 + tabBar.addNudge;
  return pad + belowPillInSlot;
}
