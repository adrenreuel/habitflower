/**
 * Flower growth rules (HANDOFF.md section 6, plus owner decisions):
 *
 * - Stages sprout (seed) -> bud -> bloom. Each completed scheduled day grows one stage.
 * - The day it reaches bloom counts as bloom day 1 (the chip says "Just bloomed"); each later completed day adds 1.
 * - 1 missed scheduled day: bud and bloom wilt, the bloom count pauses.
 *   A sprout has no wilting state: 1 miss dries it up.
 * - 2 missed scheduled days in a row: dried up, bloom count resets.
 * - A check-in while wilting restores the previous state. Nothing extra that day.
 * - A check-in while dried up revives it as a bud (or as a sprout if it dried up
 *   as a sprout). Nothing extra that day.
 * - Rest days, paused days and Away days never count (handled in schedule.ts).
 * - A partly completed day counts as a miss (handled in schedule.ts).
 */
import { classifyDays, type DayInfo, type HabitHistory } from './schedule';
import type { FlowerHealth, FlowerStage, FlowerState, LocalDay } from './types';

type Acc = {
  stage: FlowerStage;
  health: FlowerHealth;
  bloomDays: number;
  missStreak: number;
};

export const INITIAL_FLOWER: Acc = { stage: 'seed', health: 'ok', bloomDays: 0, missStreak: 0 };

function grow(s: Acc): Acc {
  if (s.health === 'wilt') return { ...s, health: 'ok', missStreak: 0 };
  if (s.health === 'dormant') {
    return { stage: s.stage === 'seed' ? 'seed' : 'bud', health: 'ok', bloomDays: 0, missStreak: 0 };
  }
  if (s.stage === 'seed') return { ...s, stage: 'bud', missStreak: 0 };
  if (s.stage === 'bud') return { ...s, stage: 'bloom', bloomDays: 1, missStreak: 0 };
  return { ...s, bloomDays: s.bloomDays + 1, missStreak: 0 };
}

function miss(s: Acc): Acc {
  const missStreak = s.missStreak + 1;
  if (s.health === 'dormant') return { ...s, missStreak };
  if (s.stage === 'seed' || missStreak >= 2) {
    // Keep the stage it dried up from; it decides what a revive brings back.
    return { ...s, health: 'dormant', bloomDays: 0, missStreak };
  }
  return { ...s, health: 'wilt', missStreak };
}

export function applyDays(start: Acc, days: Pick<DayInfo, 'effect'>[]): Acc {
  let s = start;
  for (const d of days) {
    if (d.effect === 'grow') s = grow(s);
    else if (d.effect === 'miss') s = miss(s);
  }
  return s;
}

export function evaluateFlower(h: HabitHistory): FlowerState {
  const s = applyDays(INITIAL_FLOWER, classifyDays(h));
  return { ...s, lastEvaluatedDay: h.today };
}

/** Flower as of the end of a given day (used to detect a stage change on check-in). */
export function flowerOn(h: HabitHistory, day: LocalDay): FlowerState {
  return { ...applyDays(INITIAL_FLOWER, classifyDays(h, day)), lastEvaluatedDay: day };
}

/** Longest run of completed scheduled days, ignoring rest, paused and Away days. */
export function bestStreak(days: Pick<DayInfo, 'effect'>[]): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (d.effect === 'grow') best = Math.max(best, ++run);
    else if (d.effect === 'miss') run = 0;
  }
  return best;
}

/** Display label used on cards and widgets. */
export function healthLabel(state: Pick<FlowerState, 'health'>): 'Wilting' | 'Dried up' | null {
  if (state.health === 'wilt') return 'Wilting';
  if (state.health === 'dormant') return 'Dried up';
  return null;
}

export type HistoryStats = {
  /** Longest run of completed scheduled days. */
  bestStreak: number;
  /** Completed share of the days that counted (done or missed), 0 to 100. */
  completion: number;
  /** Days with a completed check-in, rest days included. */
  totalCheckIns: number;
  /** Most days the flower stayed in bloom in one stretch. */
  longestBloom: number;
};

/** Stats for the History sheet. `days` comes from classifyDays. */
export function historyStats(days: Pick<DayInfo, 'effect' | 'status'>[]): HistoryStats {
  const grew = days.filter((d) => d.effect === 'grow').length;
  const missed = days.filter((d) => d.effect === 'miss').length;
  let s = INITIAL_FLOWER;
  let longestBloom = 0;
  for (const d of days) {
    s = applyDays(s, [d]);
    if (s.stage === 'bloom' && s.health !== 'dormant') longestBloom = Math.max(longestBloom, s.bloomDays);
  }
  return {
    bestStreak: bestStreak(days),
    completion: grew + missed ? Math.round((grew / (grew + missed)) * 100) : 0,
    totalCheckIns: days.filter((d) => d.status === 'done').length,
    longestBloom,
  };
}
