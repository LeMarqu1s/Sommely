const SCAN_COUNT_KEY = 'sommely_scan_count'
const PROFILE_KEY = 'sommely_profile'
const MAX_FREE_SCANS = 3

export function getScanCount(): number {
  const v = localStorage.getItem(SCAN_COUNT_KEY)
  return v ? parseInt(v, 10) : 0
}

export function incrementScanCount(): number {
  const next = getScanCount() + 1
  localStorage.setItem(SCAN_COUNT_KEY, String(next))
  return next
}

export function shouldShowPaywall(): boolean {
  return getScanCount() > MAX_FREE_SCANS
}

export function resetScanCount(): void {
  localStorage.setItem(SCAN_COUNT_KEY, '0')
}

export interface UserProfile {
  prenom?: string
  typeVin?: string
  budget?: string
  acidite?: number
  tanins?: number
}

export function getProfile(): UserProfile | null {
  try {
    const v = localStorage.getItem(PROFILE_KEY)
    return v ? (JSON.parse(v) as UserProfile) : null
  } catch {
    return null
  }
}

export function setProfile(p: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}
