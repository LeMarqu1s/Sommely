import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, getProfile, getSubscription, getScansCountThisMonth, upsertProfile } from '../lib/supabase';
import type { Profile, Subscription } from '../lib/supabase';

export interface SubscriptionState {
  isPro: boolean;
  isTrial: boolean;
  isFree: boolean;
  daysLeftInTrial: number;
  scansThisMonth: number;
  trialEndsAt: string | null;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  subscriptionState: SubscriptionState;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(defaultSubscriptionState);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await getProfile(user.id);
    setProfile(data ?? null);
  }, [user?.id]);

  const refreshSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setSubscriptionState(defaultSubscriptionState);
      return;
    }
    const [{ data: sub }, { count: scansThisMonth }] = await Promise.all([
      getSubscription(user.id),
      getScansCountThisMonth(user.id),
    ]);
    setSubscription(sub ?? null);

    const now = new Date();
    const trialEndsAt = sub?.trial_ends_at ?? null;
    const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
    const isTrial = !!(sub?.status === 'trial' && trialEnd && trialEnd > now);
    const isPro = sub?.status === 'active';
    const daysLeftInTrial = trialEnd && trialEnd > now
      ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
      : 0;

    setSubscriptionState({
      isPro,
      isTrial,
      isFree: !isPro && !isTrial,
      daysLeftInTrial,
      scansThisMonth: scansThisMonth ?? 0,
      trialEndsAt,
      plan: sub?.plan ?? 'free',
    });
  }, [user?.id]);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Supabase session:', err);
        setIsLoading(false);
      });

    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        let { data: p } = await getProfile(session.user.id);
        if (!p) {
          await upsertProfile(session.user.id, {
            email: session.user.email ?? undefined,
            name: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0],
          });
          const res = await getProfile(session.user.id);
          p = res.data ?? null;
        }
        setProfile(p ?? null);
        const { data: s } = await getSubscription(session.user.id);
        if (!s) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);
          await supabase.from('subscriptions').insert({
            user_id: session.user.id,
            plan: 'free',
            status: 'trial',
            trial_ends_at: trialEnd.toISOString(),
          });
        }
        const { data: s2 } = await getSubscription(session.user.id);
        setSubscription(s ?? s2 ?? null);
      } else {
        setProfile(null);
        setSubscription(null);
        setSubscriptionState(defaultSubscriptionState);
      }
      // isLoading passe à false SEULEMENT après que tout soit chargé
      setIsLoading(false);
    });

    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    refreshSubscription();
  }, [user?.id, refreshSubscription]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
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
    const keysToKeep = ['sommely_theme', 'sommely_lang'];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !keysToKeep.includes(k)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
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
