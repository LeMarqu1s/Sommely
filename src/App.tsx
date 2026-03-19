import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClarityScript } from './components/analytics/Clarity';
import { GoogleAnalytics } from './components/analytics/Analytics';
import { Landing } from './pages/Landing';
import { OnboardingGuard } from './components/OnboardingGuard';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Invite } from './pages/Invite';
import { Onboarding } from './pages/Onboarding';
import { Scanner } from './pages/Scanner';
import { MenuScanner } from './pages/MenuScanner';
import { FoodPairing } from './pages/FoodPairing';
import { Premium } from './pages/Premium';
import { CaveMeal } from './pages/CaveMeal';
import { WineShop } from './pages/WineShop';
import { SommelierButton } from './components/SommelierButton';
import { Profile } from './pages/Profile';
import { AuthCallback } from './pages/AuthCallback';
import { Success } from './pages/Success';
import { Investment } from './pages/Investment';
import { BottomNav } from './components/BottomNav';
import { GlobalLogoHeader } from './components/GlobalLogoHeader';
import { Privacy } from './pages/Privacy';
import { ShareResult } from './pages/ShareResult';

const Cave = lazy(() => import('./pages/Cave').then(m => ({ default: m.Cave })));
const WineResult = lazy(() => import('./pages/WineResult').then(m => ({ default: m.WineResult })));
const Sommelier = lazy(() => import('./pages/Sommelier').then(m => ({ default: m.Sommelier })));

const NAV_HIDDEN = ['/', '/onboarding', '/privacy', '/result', '/share', '/sommelier', '/menu', '/food-pairing', '/investment', '/auth', '/auth/callback', '/success', '/cave-meal', '/shop'];

function AppContent({ onReady }: { onReady?: () => void }) {
  const { pathname } = useLocation();
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const showNav = !NAV_HIDDEN.some(p => pathname.startsWith(p));
  return (
    <div style={{ minHeight: '100vh' }}>
      <GlobalLogoHeader />
      <div className={`${showNav ? 'pb-28' : ''} w-full`} style={{ maxWidth: 430, margin: '0 auto' }}>
        <ClarityScript />
        <GoogleAnalytics />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}><div className="w-8 h-8 rounded-full border-2 border-burgundy-dark border-t-transparent animate-spin" /></div>}>
        <Routes>
          <Route path="/investment" element={<Investment />} />
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/invite/:code" element={<Invite />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/menu" element={<MenuScanner />} />
          <Route path="/food-pairing" element={<FoodPairing />} />
          <Route path="/result" element={<WineResult />} />
          <Route path="/share" element={<ShareResult />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/sommelier" element={<Sommelier />} />
          <Route path="/cave-meal" element={<CaveMeal />} />
          <Route path="/shop" element={<WineShop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success" element={<Success />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cave" element={<Cave />} />
        </Routes>
        </Suspense>
      </div>
      <BottomNav />
      <SommelierButton />
    </div>
  );
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.pointerEvents = 'none'; // Débloque les clics immédiatement
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.2s ease';
    setTimeout(() => splash.remove(), 200);
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <OnboardingGuard />
            <AppContent onReady={hideSplash} />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

