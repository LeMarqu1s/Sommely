import type { SubscriptionState } from '../context/AuthContext';

const FREE_SCAN_LIMIT = 3;
const FREE_CAVE_LIMIT = 5;

export function getGatingFromState(state: SubscriptionState | null | undefined) {
  if (!state) {
    return { isPro: false, isTrial: false, isFree: true, scansThisMonth: 0, scansRemaining: 3, canScanUnlimited: false, caveLimit: 5 };
  }
  const isPro = state.isPro;
  const isTrial = state.isTrial;
  const isFree = state.isFree;
  const scansThisMonth = state.scansThisMonth;

  return {
    isPro,
    isTrial,
    isFree,
    scansThisMonth,
    scansRemaining: isPro || isTrial ? 999 : Math.max(0, FREE_SCAN_LIMIT - scansThisMonth),
    canScanUnlimited: isPro || isTrial,
    caveLimit: isPro || isTrial ? 999 : FREE_CAVE_LIMIT,
  };
}

export function canScan(state: SubscriptionState | null | undefined) {
  const { isPro, isTrial, scansThisMonth } = getGatingFromState(state);
  if (isPro || isTrial) return { allowed: true };
  if (scansThisMonth >= FREE_SCAN_LIMIT) {
    return { allowed: false, reason: 'Limite de 3 scans gratuits atteinte ce mois-ci' };
  }
  return { allowed: true, remaining: FREE_SCAN_LIMIT - scansThisMonth };
}

export function canAddToCave(state: SubscriptionState | null | undefined, currentBottleCount: number) {
  const { caveLimit } = getGatingFromState(state);
  return currentBottleCount < caveLimit;
}

export function canAccessFeature(
  state: SubscriptionState | null | undefined,
  feature: 'cave' | 'menu' | 'food' | 'investment' | 'antoine' | 'cavemeal' | 'shop',
  currentBottleCount?: number
): boolean {
  const { isPro, isTrial, caveLimit } = getGatingFromState(state);
  if (isPro || isTrial) return true;
  if (feature === 'cave') {
    return (currentBottleCount ?? 0) <= caveLimit;
  }
  return false;
}

export function getSubscriptionStatus() {
  return {
    tier: 'free' as const,
    type: null as string | null,
    expiry: null as string | null,
    isPro: false,
    isFree: true,
  };
}
