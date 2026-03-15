import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup' | 'magic';

export function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('referral')?.trim().toUpperCase() || undefined;
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithMagicLink, isAuthenticated, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(referralCode ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  // Si Supabase a mis le token dans le hash de /auth, attendre que la session soit établie
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;
    
    // Supabase va traiter le hash via detectSessionInUrl et déclencher onAuthStateChange
    // On attend que isAuthenticated soit true avant de rediriger
    const timeout = setTimeout(() => {
      // Fallback si onAuthStateChange ne se déclenche pas
      const done = localStorage.getItem('sommely_onboarding_done');
      navigate(done ? '/home' : '/onboarding', { replace: true });
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [navigate]);

  // Redirige seulement quand loading est terminé ET user authentifié
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) return; // Géré par l'autre useEffect
      const done = localStorage.getItem('sommely_onboarding_done');
      navigate(done ? '/home' : '/onboarding', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (referralCode) setMode('signup');
  }, [referralCode]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
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
      const { error } = await signInWithMagicLink(email);
      if (error) throw error;
      setMagicSent(true);
    } catch (err: any) {
      setError(err.message || 'Erreur. Vérifiez votre email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password, firstName, referralCode);
        if (error) throw error;
        navigate('/onboarding');
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.');
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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 font-body">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-burgundy-dark flex items-center justify-center shadow-lg overflow-hidden p-1">
            <img
              src="/IMG_1639-transparent.png"
              alt="Sommely"
              width={36}
              height={36}
              className="object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg';
                (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)';
              }}
            />
          </div>
          <span className="font-display text-2xl font-bold text-burgundy-dark">Sommely</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-black-wine text-center mb-2">
          {mode === 'signin' ? 'Bon retour ! 👋' : mode === 'signup' ? 'Rejoindre Sommely' : 'Connexion sans mot de passe'}
        </h1>
        <p className="text-gray-dark text-sm text-center mb-6">
          {mode === 'signin' ? 'Connectez-vous pour accéder à vos vins'
            : mode === 'signup' ? 'Créez votre compte en quelques secondes'
            : 'Recevez un lien magique par email'}
        </p>

        {/* Google */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full h-14 bg-white border-2 border-gray-light rounded-2xl font-semibold text-base flex items-center justify-center gap-3 mb-3 shadow-md hover:shadow-lg hover:border-gray-dark/30 transition-all cursor-pointer disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader size={20} className="animate-spin" color="#722F37" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuer avec Google
            </>
          )}
        </motion.button>

        {/* Magic Link */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => switchMode('magic')}
          className="w-full h-14 bg-white border-2 border-gray-light rounded-2xl font-semibold text-base flex items-center justify-center gap-3 mb-4 shadow-md hover:shadow-lg hover:border-gray-dark/30 transition-all cursor-pointer"
        >
          <Sparkles size={20} color="#D4AF37" />
          Lien magique par email
        </motion.button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-light/60" />
          <span className="text-xs text-gray-dark">ou avec mot de passe</span>
          <div className="flex-1 h-px bg-gray-light/60" />
        </div>

        {/* Magic Link form */}
        <AnimatePresence mode="wait">
          {mode === 'magic' && (
            <motion.div key="magic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {magicSent ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">📬</div>
                  <p className="font-bold text-green-800 text-sm mb-1">Lien envoyé !</p>
                  <p className="text-green-700 text-xs">Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.</p>
                  <button onClick={() => setMagicSent(false)} className="mt-3 text-xs text-green-700 underline bg-transparent border-none cursor-pointer">
                    Renvoyer un lien
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-3">
                  <div className="relative">
                    <Mail size={16} color="#D1CBC4" className="absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="Votre adresse email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 border-2 border-gray-light rounded-2xl text-sm text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none transition-colors bg-white"
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
                      <p className="text-danger text-xs font-medium">{error}</p>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full h-14 bg-burgundy-dark text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 border-none cursor-pointer shadow-lg hover:bg-burgundy-medium transition-colors disabled:opacity-60">
                    {isLoading ? <Loader size={20} className="animate-spin" /> : <><Sparkles size={18} /> Envoyer le lien magique</>}
                  </button>
                  <button type="button" onClick={() => switchMode('signin')} className="w-full text-center text-xs text-gray-dark hover:text-burgundy-dark bg-transparent border-none cursor-pointer mt-1">
                    ← Retour à la connexion classique
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* Email + password form */}
          {(mode === 'signin' || mode === 'signup') && (
            <motion.form key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <div className="relative">
                  <User size={16} color="#D1CBC4" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 border-2 border-gray-light rounded-2xl text-sm text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none transition-colors bg-white"
                    required
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={16} color="#D1CBC4" className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 border-2 border-gray-light rounded-2xl text-sm text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none transition-colors bg-white"
                  required
                />
              </div>
              <div className="relative">
                <Lock size={16} color="#D1CBC4" className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Mot de passe (6 caractères minimum)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 border-2 border-gray-light rounded-2xl text-sm text-black-wine placeholder-gray-light focus:border-burgundy-dark focus:outline-none transition-colors bg-white"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
                  <p className="text-danger text-xs font-medium">{error}</p>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full h-14 bg-burgundy-dark text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 border-none cursor-pointer shadow-lg hover:bg-burgundy-medium transition-colors disabled:opacity-60">
                {isLoading ? <Loader size={20} className="animate-spin" /> : <>{mode === 'signin' ? 'Se connecter' : 'Créer mon compte'} <ArrowRight size={18} /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Toggle signin/signup */}
        {mode !== 'magic' && (
          <p className="text-center text-sm text-gray-dark mt-6">
            {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-burgundy-dark font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        )}

        <p className="text-center text-xs text-gray-dark/60 mt-6">
          En continuant, vous acceptez notre{' '}
          <button onClick={() => navigate('/privacy')} className="underline hover:text-burgundy-dark bg-transparent border-none cursor-pointer">
            politique de confidentialité
          </button>
        </p>
      </motion.div>
    </div>
  );
}
