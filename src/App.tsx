import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClarityScript } from './components/analytics/Clarity';
import { GoogleAnalytics } from './components/analytics/Analytics';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Scanner } from './pages/Scanner';
import { MenuScanner } from './pages/MenuScanner';
import { FoodPairing } from './pages/FoodPairing';
import { WineResult } from './pages/WineResult';
import { Premium } from './pages/Premium';
import { Sommelier } from './pages/Sommelier';
import { CaveMeal } from './pages/CaveMeal';
import { WineShop } from './pages/WineShop';
import { SommelierButton } from './components/SommelierButton';
import { Profile } from './pages/Profile';
import { Success } from './pages/Success';
import { Cave } from './pages/Cave';
import { Investment } from './pages/Investment';
import { BottomNav } from './components/BottomNav';
import { OnboardingGuard } from './components/OnboardingGuard';

const NAV_HIDDEN = ['/onboarding', '/result', '/premium', '/sommelier', '/menu', '/food-pairing', '/investment', '/auth', '/success', '/cave-meal', '/shop'];

function AppContent() {
  const { pathname } = useLocation();
  const showNav = !NAV_HIDDEN.some(p => pathname.startsWith(p));
  return (
    <>
      <div className={showNav ? 'pb-20' : ''}>
        <ClarityScript />
        <GoogleAnalytics />
        <Routes>
          <Route path="/investment" element={<Investment />} />
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/menu" element={<MenuScanner />} />
          <Route path="/food-pairing" element={<FoodPairing />} />
          <Route path="/result" element={<WineResult />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/sommelier" element={<Sommelier />} />
          <Route path="/cave-meal" element={<CaveMeal />} />
          <Route path="/shop" element={<WineShop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cave" element={<Cave />} />
        </Routes>
      </div>
      <BottomNav />
        <SommelierButton />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OnboardingGuard>
          <AppContent />
        </OnboardingGuard>
      </BrowserRouter>
    </AuthProvider>
  );
}

