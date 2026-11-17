/**
 * Growth moments: the full-screen celebration when a check-in changes the
 * flower's state (UPDATES-2026-11-16 section 4).
 */
import type { FlowerState } from './types';

export type GrowthMoment =
  /** Sprout -> bud. */
  | 'budded'
  /** Bud -> bloom. */
  | 'bloomed'
  /** Reached 30 days in bloom. */
  | 'milestone30'
  /** Wilting -> healthy again (same stage). */
  | 'recovered'
  /** Dried up bud or bloom -> bud. */
  | 'revivedBud'
  /** Dried up sprout -> sprout. */
  | 'revivedSprout';

export const MILESTONE_DAYS = 30;

type F = Pick<FlowerState, 'stage' | 'health' | 'bloomDays'>;

/** The moment a check-in caused, or null when the flower just kept its state. */
export function growthMoment(before: F, after: F): GrowthMoment | null {
  if (after.health !== 'ok') return null;
  if (before.health === 'dormant') return after.stage === 'seed' ? 'revivedSprout' : 'revivedBud';
  if (before.health === 'wilt') return 'recovered';
  if (before.stage === 'seed' && after.stage === 'bud') return 'budded';
  if (before.stage === 'bud' && after.stage === 'bloom') return 'bloomed';
  if (after.stage === 'bloom' && before.bloomDays < MILESTONE_DAYS && after.bloomDays >= MILESTONE_DAYS) return 'milestone30';
  return null;
}

/** The state the flower is drawn in before the moment (the loop goes old -> new). */
export function momentFrom(moment: GrowthMoment, before: F, after: F): Pick<FlowerState, 'stage' | 'health'> {
  if (moment === 'milestone30') return { stage: after.stage, health: after.health };
  return { stage: before.stage, health: before.health };
}
