import { loadStripe } from '@stripe/stripe-js';

// En prod, remplacez la clé publique par une vraie via les variables d'environnement Vite.
const STRIPE_PUBLIC_KEY = (import.meta.env && import.meta.env.VITE_STRIPE_PUBLIC_KEY) || 'pk_test_REMPLACE_PAR_TA_CLE';

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export const PRICING_TIERS = {
  monthly: {
    id: 'monthly',
    priceId: 'price_MONTHLY_ID',
    name: 'Mensuel',
    badge: null,
    price: 4.99,
    currency: 'eur',
    interval: 'month',
    displayPrice: '4.99',
    displaySub: 'par mois',
    firstPayment: '4.99',
    firstPaymentLabel: 'Aujourd\'hui',
    features: ['10 scans par mois', 'Score personnalisé', 'Accords mets-vins'],
    cta: 'Commencer',
    highlight: false,
  },
  annual: {
    id: 'annual',
    priceId: 'price_ANNUAL_ID',
    name: 'Annuel',
    badge: 'POPULAIRE',
    badgeColor: '#D4AF37',
    price: 29.99,
    currency: 'eur',
    interval: 'year',
    displayPrice: '2.50',
    displaySub: 'par mois',
    firstPayment: '1',
    firstPaymentLabel: 'Puis 29,99 €/an',
    originalPrice: '49.99',
    savings: '-40%',
    features: [
      'Scans illimités',
      'Sommelier IA 24h/24',
      'Gestion de cave',
      'Alertes promotions',
      'Historique complet',
      'Accords mets-vins IA',
    ],
    cta: 'Commencer pour 1 €',
    highlight: true,
  },
};

export type TierKey = keyof typeof PRICING_TIERS;

