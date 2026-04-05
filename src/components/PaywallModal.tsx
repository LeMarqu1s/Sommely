import { useState } from 'react';
import { X, Star, Lock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { redirectToCheckout } from '../utils/stripe';
import { Logo } from './Logo';

const isNative = Capacitor.isNativePlatform();
const PREMIUM_WEB_URL = 'https://sommely.shop/premium';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
}

export function PaywallModal({ isOpen, onClose, feature, description }: PaywallModalProps) {
  const [opening, setOpening] = useState(false);

  const openPremiumInBrowser = async () => {
    setOpening(true);
    try {
      onClose();
      await Browser.open({ url: PREMIUM_WEB_URL });
    } finally {
      setOpening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      className="bg-black/60 flex items-end justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                  <Logo size={32} variant="default" />
                </div>
                <Lock size={20} color="#D4AF37" className="flex-shrink-0" />
              </div>
              <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1">
                <X size={20} color="#6B5D56" />
              </button>
            </div>
            <h3 className="font-display text-xl font-bold text-black-wine mb-2">{feature}</h3>
            <p className="text-gray-dark text-sm leading-relaxed mb-6">{description}</p>
            <div className="bg-cream rounded-2xl p-4 mb-6">
              <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-2">Avec Sommely Pro :</p>
              <ul className="space-y-2">
                {['Scans illimités', 'Cave illimitée', 'Chat Antoine sommelier IA', 'Toutes les fonctionnalités premium'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-black-wine">
                    <Star size={14} color="#D4AF37" fill="#D4AF37" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {isNative ? (
              <>
                <p className="text-sm text-gray-dark text-center leading-relaxed mb-4">
                  Pour vous abonner, rendez-vous sur sommely.shop
                </p>
                <button
                  type="button"
                  disabled={opening}
                  onClick={() => void openPremiumInBrowser()}
                  className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold border-none cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-60"
                >
                  {opening ? 'Ouverture...' : 'Ouvrir sommely.shop'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { onClose(); void redirectToCheckout('monthly'); }}
                  className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold border-none cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  Débloquer · 8,99€/mois
                </button>

                <button
                  type="button"
                  onClick={() => { onClose(); void redirectToCheckout('annual'); }}
                  className="w-full py-3 mt-2 border-2 border-burgundy-dark/20 text-burgundy-dark rounded-2xl font-semibold text-sm bg-transparent cursor-pointer active:scale-95 transition-all"
                >
                  Ou 47,99€/an (4€/mois) · Meilleure valeur 🎯
                </button>
              </>
            )}
      </div>
    </div>
  );
}
