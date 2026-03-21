import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  getSubscription,
  getScansCountThisMonth,
  applyReferralCode,
} from '../lib/supabase';
import type { Profile, Subscription } from '../lib/supabase';

const PRODUCTION_AUTH_REDIRECT = 'https://sommely.shop';

export interface SubscriptionState {
  isPro: boolean;
  isTrial: boolean;
  isFree: boolean;
  daysLeftInTrial: number;
  scansThisMonth: number;
  trialEndsAt: string | null;
  plan: string;
  /** Scans restants pendant l’essai (plafond `trialScansLimit` − `trialScansUsed`) */
  trialScansRemaining: number;
  trialScansUsed: number;
  trialScansLimit: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  subscriptionState: SubscriptionState;
  isLoading: boolean;
  isOnboardingInProgress: boolean;
  setIsOnboardingInProgress: (v: boolean) => void;
  refreshProfile: () => Promise<void>;
  refreshSubscription: (overrideUserId?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: unknown }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: unknown }>;
  signUpWithEmail: (email: string, password: string, firstName: string, referralCode?: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const defaultSubscriptionState: SubscriptionState = {
  isPro: false,
  isTrial: false,
  isFree: true,
  daysLeftInTrial: 0,
  scansThisMonth: 0,
  trialEndsAt: null,
  plan: 'free',
  trialScansRemaining: 3,
  trialScansUsed: 0,
  trialScansLimit: 3,
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(defaultSubscriptionState);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingInProgress, setIsOnboardingInProgress] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(data ?? null);
  }, [user?.id]);

  const refreshSubscription = useCallback(async (overrideUserId?: string) => {
    const uid = overrideUserId ?? user?.id;
    if (!uid) {
      setSubscription(null);
      setSubscriptionState(defaultSubscriptionState);
      return;
    }
    const [{ data: sub }, { count: scansThisMonth }] = await Promise.all([
      getSubscription(uid),
      getScansCountThisMonth(uid),
    ]);
    setSubscription(sub ?? null);

    const now = new Date();
    const trialEndsAt = sub?.trial_ends_at ?? null;
    const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
    const isTrial = !!(sub?.status === 'trial' && trialEnd && trialEnd > now);
    const isPro = sub?.status === 'active';
    const daysLeftInTrial =
      trialEnd && trialEnd > now
        ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
        : 0;

    const trialScansLimit = sub?.scans_limit ?? 3;
    const trialScansUsed = sub?.scans_used ?? 0;
    const trialScansRemaining =
      isTrial ? Math.max(0, trialScansLimit - trialScansUsed) : 0;

    setSubscriptionState({
      isPro,
      isTrial,
      isFree: !isPro && !isTrial,
      daysLeftInTrial,
      scansThisMonth: scansThisMonth ?? 0,
      trialEndsAt,
      plan: sub?.plan ?? 'free',
      trialScansRemaining,
      trialScansUsed,
      trialScansLimit,
    });
  }, [user?.id]);

  const ensureTrialSubscription = useCallback(async (userId: string) => {
    const { data: existingSub } = await getSubscription(userId);
    if (!existingSub) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      await supabase.from('subscriptions').insert({
        user_id: userId,
        plan: 'free',
        status: 'trial',
        trial_ends_at: trialEnd.toISOString(),
        scans_used: 0,
        scans_limit: 3,
      });
    }
  }, []);

  const applyPendingReferral = useCallback(async (userId: string, p: Profile | null) => {
    const pendingRef = localStorage.getItem('pending_referral');
    if (!pendingRef || !p || p.referred_by) return;
    const ok = await applyReferralCode(userId, pendingRef);
    if (ok.success) {
      localStorage.removeItem('pending_referral');
      const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (refreshed) setProfile(refreshed);
    }
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      let { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

      if (!data) {
        const { data: authData } = await supabase.auth.getUser();
        const u = authData.user;
        const { data: created, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: u?.email ?? null,
            name: u?.user_metadata?.full_name ?? u?.email?.split('@')[0] ?? null,
            onboarding_completed: false,
            referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            taste_profile: {},
          })
          .select()
          .single();
        if (error) console.warn('[Auth] profile insert:', error);
        data = created ?? undefined;
      }

      if (data) {
        setProfile(data);
        if (data.onboarding_completed) localStorage.setItem('sommely_onboarding_done', 'true');
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await new Promise((r) => setTimeout(r, 800));
      if (!mounted) return;

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (initialSession?.user && mounted) {
        setSession(initialSession);
        setUser(initialSession.user);
        await loadProfile(initialSession.user.id);
        await ensureTrialSubscription(initialSession.user.id);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', initialSession.user.id).maybeSingle();
        await applyPendingReferral(initialSession.user.id, p);
        await refreshSubscription(initialSession.user.id);
      }

      if (mounted) setIsLoading(false);
    };

    void init();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      console.log('[Auth]', event, nextSession?.user?.email);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          await loadProfile(nextSession.user.id);
          await ensureTrialSubscription(nextSession.user.id);
          const { data: p } = await supabase.from('profiles').select('*').eq('id', nextSession.user.id).maybeSingle();
          await applyPendingReferral(nextSession.user.id, p);
          await refreshSubscription(nextSession.user.id);
        }
        setIsLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setSubscription(null);
        setSubscriptionState(defaultSubscriptionState);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      authSub.unsubscribe();
    };
  }, [loadProfile, ensureTrialSubscription, applyPendingReferral, refreshSubscription]);

  useEffect(() => {
    void refreshSubscription();
  }, [user?.id, refreshSubscription]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) return;

      try {
        const {
          data: { session: current },
          error,
        } = await supabase.auth.getSession();

        if (error || !current) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setSubscription(null);
          setSubscriptionState(defaultSubscriptionState);
          return;
        }

        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        const activeSession = refreshed.session ?? current;

        if (refreshErr && !activeSession) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setSubscription(null);
          setSubscriptionState(defaultSubscriptionState);
          return;
        }

        if (!activeSession?.user) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setSubscription(null);
          setSubscriptionState(defaultSubscriptionState);
          return;
        }

        setSession(activeSession);
        setUser(activeSession.user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeSession.user.id)
          .maybeSingle();
        setProfile(profileData ?? null);

        await refreshSubscription(activeSession.user.id);
      } catch (err) {
        console.error('Visibility change error:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshSubscription]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) void supabase.auth.getSession();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: PRODUCTION_AUTH_REDIRECT,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: PRODUCTION_AUTH_REDIRECT,
        shouldCreateUser: true,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    firstName: string,
    referralCode?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: firstName,
          ...(referralCode ? { referral_code: referralCode.toUpperCase() } : {}),
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
    setSubscriptionState(defaultSubscriptionState);
    setUser(null);
    setSession(null);
    localStorage.removeItem('sommely_onboarding_done');
    localStorage.removeItem('sommely_profile');
    const keysToKeep = ['sommely_theme', 'sommely_lang'];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keysToKeep.includes(k)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        subscriptionState,
        isLoading,
        isOnboardingInProgress,
        setIsOnboardingInProgress,
        refreshProfile,
        refreshSubscription,
        signInWithGoogle,
        signInWithMagicLink,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
