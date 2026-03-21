import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  String(import.meta.env.VITE_SUPABASE_URL ?? ''),
  String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storageKey: 'sommely-auth',
    },
  }
);

// ─── TYPES ────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  taste_profile: Record<string, unknown>;
  onboarding_completed: boolean;
  referral_code: string | null;
  discount_used?: boolean;
  created_at: string;
  referred_by?: string | null;
  referral_reward_given?: boolean;
  first_name?: string | null;
  birthday?: string | null;
  last_scan_at?: string | null;
  total_scans?: number;
  push_enabled?: boolean;
  referral_reward_months?: number;
  subscription_extended_until?: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'monthly' | 'annual';
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'paused';
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface CaveBottleRow {
  id: string;
  user_id: string;
  name: string;
  vintage: number;
  region: string | null;
  appellation: string | null;
  wine_type: string | null;
  grapes: string | null;
  price_paid: number;
  current_price: number;
  quantity: number;
  peak_start: number | null;
  peak_end: number | null;
  peak_year: number | null;
  drink_from: number | null;
  drink_until: number | null;
  image_url: string | null;
  notes: string | null;
  price_history: { date: string; price: number; event?: string }[];
  price_variation_24h: number;
  last_price_update: string | null;
  alert: string | null;
  location: string | null;
  added_at: string;
}

export interface ScanRow {
  id: string;
  user_id: string;
  type: 'bottle' | 'menu';
  result: Record<string, unknown>;
  created_at: string;
}

// ─── PROFILES ──────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data: data as Profile | null, error };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data: data as Profile | null, error };
}

export async function upsertProfile(userId: string, profile: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile }, { onConflict: 'id' })
    .select()
    .single();
  return { data: data as Profile | null, error };
}

// ─── SUBSCRIPTIONS ─────────────────────────────────────────

export async function getSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data as Subscription | null, error };
}

// ─── CAVE_BOTTLES ─────────────────────────────────────────

export async function getCaveBottles(userId: string) {
  const { data, error } = await supabase
    .from('cave_bottles')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  return { data: (data || []) as CaveBottleRow[], error };
}

export async function insertCaveBottle(userId: string, row: Omit<CaveBottleRow, 'id' | 'user_id' | 'added_at'>) {
  const { data, error } = await supabase
    .from('cave_bottles')
    .insert({ user_id: userId, ...row })
    .select()
    .single();
  return { data: data as CaveBottleRow | null, error };
}

export async function updateCaveBottle(userId: string, bottleId: string, updates: Partial<CaveBottleRow>) {
  const { data, error } = await supabase
    .from('cave_bottles')
    .update(updates)
    .eq('id', bottleId)
    .eq('user_id', userId)
    .select()
    .single();
  return { data: data as CaveBottleRow | null, error };
}

export async function deleteCaveBottle(userId: string, bottleId: string) {
  const { error } = await supabase
    .from('cave_bottles')
    .delete()
    .eq('id', bottleId)
    .eq('user_id', userId);
  return { error };
}

// ─── SCANS ────────────────────────────────────────────────

export async function insertScan(userId: string, type: 'bottle' | 'menu', result: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('scans')
    .insert({ user_id: userId, type, result })
    .select()
    .single();
  return { data: data as ScanRow | null, error };
}

export async function getScansCountThisMonth(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count, error } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth);
  return { count: count ?? 0, error };
}

export async function getScansCountTotal(userId: string) {
  const { count, error } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return { count: count ?? 0, error };
}

export async function getUserScans(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = (data || []) as ScanRow[];
  return {
    data: rows.map((r) => ({
      id: r.id,
      wine_name: (r.result as any)?.name ?? (r.result as any)?.wine?.name ?? 'Vin',
      wine_region: (r.result as any)?.region ?? (r.result as any)?.wine?.region ?? null,
      wine_type: (r.result as any)?.type ?? (r.result as any)?.wine?.type ?? null,
      wine_year: (r.result as any)?.year ?? (r.result as any)?.wine?.year ?? null,
      score: (r.result as any)?.score ?? 0,
      created_at: r.created_at,
    })),
    error,
  };
}

// ─── REFERRALS ────────────────────────────────────────────

/** Appliquer un code de parrainage (insert referrals puis profil ; notif push au parrain) */
export async function applyReferralCode(
  userId: string,
  code: string
): Promise<{ success?: boolean; error?: string }> {
  const upperCode = code.toUpperCase().trim();

  const { data: referrer, error: refError } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('referral_code', upperCode)
    .maybeSingle();

  if (refError || !referrer) {
    return { error: 'Code invalide ou inexistant.' };
  }

  if (referrer.id === userId) {
    return { error: 'Vous ne pouvez pas utiliser votre propre code.' };
  }

  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referral_code', upperCode);

  if ((count || 0) >= 3) {
    return { error: 'Ce code a déjà été utilisé 3 fois.' };
  }

  const { data: alreadyUsed } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', userId)
    .maybeSingle();

  if (alreadyUsed?.referred_by) {
    return { error: 'Vous avez déjà utilisé un code de parrainage.' };
  }

  const { error: insertError } = await supabase.from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: userId,
    referral_code: upperCode,
    status: 'pending',
  });

  if (insertError) {
    return { error: "Erreur lors de l'application du code." };
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ referred_by: upperCode })
    .eq('id', userId);

  if (updateErr) {
    return { error: "Erreur lors de l'application du code." };
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, trial_ends_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.trial_ends_at) {
    const currentEnd = new Date(sub.trial_ends_at);
    currentEnd.setDate(currentEnd.getDate() + 30);
    await supabase
      .from('subscriptions')
      .update({ trial_ends_at: currentEnd.toISOString() })
      .eq('id', sub.id);
  }

  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: referrer.id,
        title: '🔔 Sommely',
        body: `Quelqu'un a utilisé votre code de parrainage ! S'il s'abonne, vous gagnez 1 mois gratuit. 🍷`,
        url: '/profile',
      }),
    });
  } catch (e) {
    console.error('Push notification failed:', e);
  }

  return { success: true };
}

/** Stats de parrainage d'un user (nombre parrainés, rewarded, pending) */
export async function getReferralStats(userId: string) {
  const { data } = await supabase
    .from('referrals')
    .select('status, created_at')
    .eq('referrer_id', userId);

  return {
    total: data?.length || 0,
    rewarded: data?.filter((r) => r.status === 'rewarded').length || 0,
    pending: data?.filter((r) => r.status === 'pending').length || 0,
  };
}

export async function getProfileByReferralCode(code: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle();
  return { data, error };
}

// ─── FEEDBACK (SaveFlow exit survey) ─────────────────────────

export interface FeedbackRow {
  id: string;
  user_id: string;
  reason: string;
  text: string | null;
  created_at: string;
}

export async function insertFeedback(userId: string, reason: string, text?: string | null) {
  const { data, error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, reason, text: text ?? null })
    .select()
    .single();
  return { data: data as FeedbackRow | null, error };
}
