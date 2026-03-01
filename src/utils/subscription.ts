export function getSubscriptionStatus() {
  const tier = localStorage.getItem('sommely_subscription_tier') || 'free';
  const type = localStorage.getItem('sommely_subscription_type') || null;
  const expiry = localStorage.getItem('sommely_subscription_expiry') || null;

  const isPro = (tier === 'pro' || tier === 'annual' || tier === 'monthly') && (!expiry || new Date(expiry) > new Date());

  return {
    tier,
    type,
    expiry,
    isPro,
    isFree: !isPro,
  };
}

export function getScanCount() {
  return parseInt(localStorage.getItem('sommely_scan_count') || '0');
}

export function incrementScanCount() {
  const count = getScanCount() + 1;
  localStorage.setItem('sommely_scan_count', String(count));
  return count;
}

export function canScan() {
  const { isPro } = getSubscriptionStatus();
  if (isPro) return { allowed: true };

  const count = getScanCount();
  if (count >= 3) return { allowed: false, reason: 'Limite de 3 scans gratuits atteinte' };

  return { allowed: true, remaining: 3 - count };
}

export function canAccessFeature(feature: 'cave' | 'menu' | 'food' | 'investment' | 'antoine' | 'cavemeal' | 'shop') {
  const { isPro } = getSubscriptionStatus();
  if (isPro) return true;

  if (feature === 'cave') {
    try {
      const cave = JSON.parse(localStorage.getItem('sommely_cave_v3') || '[]');
      const totalBottles = cave.reduce((sum: number, b: { quantity?: number }) => sum + (b.quantity || 1), 0);
      return totalBottles <= 5;
    } catch {
      return true;
    }
  }

  return false;
}

export function canAddToCave() {
  const { isPro } = getSubscriptionStatus();
  if (isPro) return true;
  try {
    const cave = JSON.parse(localStorage.getItem('sommely_cave_v3') || '[]');
    const totalBottles = cave.reduce((sum: number, b: { quantity?: number }) => sum + (b.quantity || 1), 0);
    return totalBottles < 5;
  } catch {
    return true;
  }
}
