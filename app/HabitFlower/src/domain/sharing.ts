/**
 * Sharing copy helpers (v1.1 friends). Pure so the wording is tested.
 * Usernames only, always written as @username.
 */
import type { HabitSharing, HistoryAudience } from './types';

/**
 * "@a", "@a and @b", "@a, @b and @c", "@a, @b and N others".
 * Used by the History hint and the check-in photos hint.
 */
export function formatNameList(usernames: string[]): string {
  const names = usernames.map((u) => (u.startsWith('@') ? u : `@${u}`));
  if (names.length <= 1) return names.join('');
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} others`;
}

export function historyAudience(sharing: HabitSharing): HistoryAudience {
  return sharing.history ?? 'nobody';
}

/** Shared with nobody: the Full history choice is hidden. */
export function isSharedWithNobody(sharing: HabitSharing): boolean {
  return sharing.progress.kind === 'friends' && sharing.progress.userIds.length === 0;
}

/** Hint under the Full history choice in the Share progress sheet. */
export function historyHint(audience: HistoryAudience, closeFriends: string[]): string {
  if (audience === 'everyone') return 'Everyone above can open the calendar and stats, back to day one.';
  if (audience === 'close') {
    return closeFriends.length
      ? `${formatNameList(closeFriends)} see everything. Everyone else sees this week.`
      : 'Close friends see everything. Everyone else sees this week.';
  }
  return 'Friends see your flower, streak and this week. Older days stay private.';
}

/** Value of the History row on the Sharing card. */
export function historyRowLabel(sharing: HabitSharing): 'This week' | 'Close friends' | 'Full history' | 'Only you' {
  if (isSharedWithNobody(sharing)) return 'Only you';
  const a = historyAudience(sharing);
  return a === 'everyone' ? 'Full history' : a === 'close' ? 'Close friends' : 'This week';
}

/** Can this viewer open the full calendar and stats? */
export function canSeeFullHistory(sharing: HabitSharing, viewer: { isCloseFriend: boolean }): boolean {
  const a = historyAudience(sharing);
  return a === 'everyone' || (a === 'close' && viewer.isCloseFriend);
}
