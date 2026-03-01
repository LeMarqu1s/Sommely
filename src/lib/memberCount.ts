const STORAGE_KEY = 'sommely_member_count';
const BASE_COUNT = 7628;

export function getMemberCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (_e) { /* ignore */ }
  return BASE_COUNT;
}

export function incrementMemberCount(): number {
  const current = getMemberCount();
  const next = current + 1;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch (_e) { /* ignore */ }
  return next;
}

/** Formate le nombre pour l'affichage (ex: 7 628) */
export function formatMemberCount(count: number): string {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
