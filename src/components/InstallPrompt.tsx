import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_DISMISSED = 'sommely_install_dismissed';
const STORAGE_LATER = 'install_prompt_dismissed';
const LATER_DAYS = 7;

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroidChrome(): boolean {
  return /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return deferredPrompt;
}

// Icône Partager iOS (carré avec flèche vers le haut)
function ShareIconIOS({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="10" width="16" height="12" rx="2" />
      <path d="M12 2v8M12 2l-4 4M12 2l4 4" />
    </svg>
  );
}

export function InstallPrompt() {
  const { profile } = useAuth();
  const deferredPrompt = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [isIOSSheet, setIsIOSSheet] = useState(false);

  const totalScans = profile?.total_scans ?? 0;
  const nav = navigator as Navigator & { standalone?: boolean };
  const iosSafari = isIOS() && nav.standalone === false;
  const androidChrome = isAndroidChrome() && !!deferredPrompt;

  const shouldShow = useCallback(() => {
    if (isStandalone()) return false;
    if (totalScans < 3) return false;
    const dismissed = localStorage.getItem(STORAGE_DISMISSED);
    if (dismissed === '1') return false;
    const later = localStorage.getItem(STORAGE_LATER);
    if (later) {
      const ts = parseInt(later, 10);
      if (Date.now() - ts < LATER_DAYS * 24 * 60 * 60 * 1000) return false;
    }
    return iosSafari || androidChrome;
  }, [totalScans, iosSafari, androidChrome]);

  useEffect(() => {
    if (!shouldShow()) return;
    setVisible(true);
    setIsIOSSheet(iosSafari);
  }, [shouldShow, iosSafari]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_DISMISSED, '1');
    setVisible(false);
  }, []);

  const handleLater = useCallback(() => {
    localStorage.setItem(STORAGE_LATER, String(Date.now()));
    setVisible(false);
  }, []);

  const handleInstallAndroid = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(STORAGE_DISMISSED, '1');
    setVisible(false);
  }, [deferredPrompt]);

  if (!visible) return null;

  if (androidChrome && !isIOSSheet) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-safe"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-2xl bg-white p-0 shadow-xl overflow-hidden"
            style={{ borderRadius: 16 }}
          >
            <div className="p-4" style={{ background: '#722F37' }}>
              <div className="flex justify-between items-start">
                <h3 className="font-display text-xl font-bold text-white">Installez Sommely</h3>
                <button onClick={handleLater} className="p-1 -m-1 rounded-full hover:bg-white/10 text-white" aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-black-wine text-sm mb-6">
                Ajoutez Sommely sur votre écran d'accueil pour une expérience optimale.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLater}
                  className="flex-1 py-3 rounded-2xl border border-gray-light text-black-wine font-semibold text-sm"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleInstallAndroid}
                  className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                  style={{ background: '#722F37' }}
                >
                  Installer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (iosSafari) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white pb-safe shadow-xl overflow-hidden"
            style={{ borderRadius: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <div className="p-4" style={{ background: '#722F37' }}>
              <div className="flex justify-between items-start">
                <h3 className="font-display text-xl font-bold text-white">Installez Sommely sur votre écran d'accueil</h3>
                <button onClick={handleLater} className="p-1 -m-1 rounded-full hover:bg-white/10 text-white" aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex justify-center my-6 px-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(114,47,55,0.15)' }}
              >
                <span style={{ color: '#722F37' }}><ShareIconIOS className="w-10 h-10" /></span>
              </motion.div>
            </div>

            <ol className="space-y-3 text-sm text-black-wine px-6 mb-6">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(114,47,55,0.2)', color: '#722F37' }}>1</span>
                <span>Appuyez sur <strong>[icône partage]</strong> en bas de Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(114,47,55,0.2)', color: '#722F37' }}>2</span>
                <span>Faites défiler et appuyez sur &quot;Sur l&apos;écran d&apos;accueil&quot;</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(114,47,55,0.2)', color: '#722F37' }}>3</span>
                <span>Appuyez sur &quot;Ajouter&quot; — c&apos;est tout !</span>
              </li>
            </ol>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleLater}
                className="flex-1 py-3 rounded-2xl border border-gray-light text-black-wine font-semibold text-sm"
              >
                Plus tard
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: '#722F37' }}
              >
                J'ai compris
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
