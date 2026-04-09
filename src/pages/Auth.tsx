import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type AuthMode = 'main' | 'magic';

export function Auth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('main');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const done = localStorage.getItem('sommely_onboarding_done');
      navigate(done ? '/home' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'https://sommely.shop',
        },
      });
      if (err) throw err;
    } catch {
      setError('Erreur avec Apple. Réessayez.');
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://sommely.shop',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (err) throw err;
    } catch {
      setError('Erreur avec Google. Réessayez.');
      setGoogleLoading(false);
    }
  };

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: 'https://sommely.shop',
          shouldCreateUser: true,
        },
      });
      if (err) throw err;
      setMagicSent(true);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Erreur. Vérifiez votre email.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setMagicSent(false);
  };

  return (
    <div className="min-h-screen font-body relative overflow-hidden" style={{ background: '#FAFAF8' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 100% 70% at 50% -10%, rgba(114,47,55,0.07) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.2,
            backgroundImage:
              'linear-gradient(rgba(114,47,55,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(114,47,55,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center justify-center gap-2.5 mb-10">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: '#722F37', boxShadow: '0 8px 24px rgba(114,47,55,0.35)' }}
            >
              <span className="text-white font-black text-base">S</span>
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#1a0508', letterSpacing: '-0.02em' }}>
              Sommely
            </span>
          </div>

          <div
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            <h1 className="font-display font-bold text-center mb-1.5" style={{ fontSize: '1.6rem', color: '#1a0508', letterSpacing: '-0.02em' }}>
              {mode === 'magic' ? 'Lien magique' : 'Bienvenue 👋'}
            </h1>
            <p className="text-center text-sm mb-7" style={{ color: '#9E9E9E' }}>
              {mode === 'magic' ? 'Recevez un lien de connexion par email' : 'Connectez-vous pour accéder à vos vins'}
            </p>

            <AnimatePresence mode="wait">
              {mode === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAppleSignIn}
                    disabled={appleLoading || googleLoading}
                    className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer border-none"
                    style={{
                      background: '#000000',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {appleLoading ? (
                      <Loader size={18} className="animate-spin" style={{ color: '#ffffff' }} />
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden={true}>
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                        Continuer avec Apple
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || appleLoading}
                    className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer border"
                    style={{
                      background: 'white',
                      borderColor: 'rgba(0,0,0,0.08)',
                      color: '#374151',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    {googleLoading ? (
                      <Loader size={18} className="animate-spin" style={{ color: '#722F37' }} />
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continuer avec Google
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => switchMode('magic')}
                    className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer border-none"
                    style={{
                      background: 'linear-gradient(135deg, #722F37, #8B4049)',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(114,47,55,0.3)',
                    }}
                  >
                    <Sparkles size={17} style={{ color: '#D4AF37' }} />
                    Lien magique par email
                  </motion.button>
                </motion.div>
              )}

              {mode === 'magic' && (
                <motion.div
                  key="magic"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {magicSent ? (
                    <div
                      className="rounded-2xl p-5 text-center"
                      style={{ background: 'rgba(114,47,55,0.05)', border: '1px solid rgba(114,47,55,0.1)' }}
                    >
                      <div className="text-3xl mb-2">📬</div>
                      <p className="font-bold text-sm mb-1" style={{ color: '#1a0508' }}>
                        Lien envoyé !
                      </p>
                      <p className="text-xs" style={{ color: '#9E9E9E' }}>
                        Vérifiez votre boîte mail et cliquez sur le lien.
                      </p>
                      <button
                        onClick={() => setMagicSent(false)}
                        className="mt-3 text-xs bg-transparent border-none cursor-pointer underline"
                        style={{ color: '#722F37' }}
                      >
                        Renvoyer
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLink} className="space-y-3">
                      <div className="relative">
                        <Mail
                          size={15}
                          style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#D1CBC4',
                          }}
                        />
                        <input
                          type="email"
                          placeholder="Votre email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none"
                          style={{
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            color: '#1a0508',
                          }}
                        />
                      </div>
                      {error && (
                        <p className="text-xs px-3 py-2.5 rounded-xl" style={{ background: 'rgba(198,40,40,0.06)', color: '#C62828' }}>
                          {error}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl font-bold text-sm text-white border-none cursor-pointer flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #722F37, #8B4049)',
                          boxShadow: '0 8px 24px rgba(114,47,55,0.3)',
                          opacity: isLoading ? 0.7 : 1,
                        }}
                      >
                        {isLoading ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Sparkles size={16} /> Envoyer le lien
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('main')}
                        className="w-full text-center text-xs bg-transparent border-none cursor-pointer"
                        style={{ color: '#9E9E9E' }}
                      >
                        ← Retour
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#9E9E9E' }}>
            En continuant, vous acceptez notre{' '}
            <button
              onClick={() => navigate('/privacy')}
              className="underline bg-transparent border-none cursor-pointer"
              style={{ color: '#9E9E9E' }}
            >
              politique de confidentialité
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
