import type { Subscription } from '../lib/supabase';
import type { SubscriptionState } from '../context/AuthContext';

const FREE_CAVE_LIMIT = 5;
const DEFAULT_TRIAL_SCAN_LIMIT = 3;

export function getGatingFromState(state: SubscriptionState | null | undefined) {
  if (!state) {
    return {
      isPro: false,
      isTrial: false,
      isFree: true,
      scansThisMonth: 0,
      scansRemaining: DEFAULT_TRIAL_SCAN_LIMIT,
      canScanUnlimited: false,
      caveLimit: FREE_CAVE_LIMIT,
    };
  }
  const isPro = state.isPro;
  const isTrial = state.isTrial;
  const isFree = state.isFree;
  const scansThisMonth = state.scansThisMonth;

  if (isPro) {
    return {
      isPro,
      isTrial,
      isFree,
      scansThisMonth,
      scansRemaining: 999,
      canScanUnlimited: true,
      caveLimit: 999,
    };
  }
  if (isTrial) {
    const rem = state.trialScansRemaining ?? 0;
    return {
      isPro,
      isTrial,
      isFree,
      scansThisMonth,
      scansRemaining: rem,
      canScanUnlimited: false,
      caveLimit: 999,
    };
  }
  return {
    isPro,
    isTrial,
    isFree,
    scansThisMonth,
    scansRemaining: 0,
    canScanUnlimited: false,
    caveLimit: FREE_CAVE_LIMIT,
  };
}

/**
 * Règles : pas de ligne en base → trial implicite (ne pas bloquer).
 * `active` → illimité. `trial` → max `scans_limit` (souvent 3) avec `scans_used`.
 */
export function canScan(subscription: Subscription | null | undefined): {
  allowed: boolean;
  remaining?: number;
  reason?: string;
} {
  if (!subscription) {
    return { allowed: true, remaining: DEFAULT_TRIAL_SCAN_LIMIT };
  }
  if (subscription.status === 'active') {
    return { allowed: true, remaining: 999 };
  }
  if (subscription.status === 'trial') {
    const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    if (trialEnd && trialEnd <= new Date()) {
      return { allowed: false, reason: "Période d'essai terminée", remaining: 0 };
    }
    const scansUsed = subscription.scans_used ?? 0;
    const scansLimit = subscription.scans_limit ?? DEFAULT_TRIAL_SCAN_LIMIT;
    if (scansUsed >= scansLimit) {
      return { allowed: false, reason: 'Limite de scans atteinte', remaining: 0 };
    }
    return { allowed: true, remaining: scansLimit - scansUsed };
  }
  return { allowed: false, reason: 'Abonnement requis', remaining: 0 };
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
