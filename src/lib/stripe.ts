import { loadStripe } from '@stripe/stripe-js';

// En prod, remplacez la clé publique par une vraie via les variables d'environnement Vite.
const STRIPE_PUBLIC_KEY = (import.meta.env && import.meta.env.VITE_STRIPE_PUBLIC_KEY) || 'pk_test_REMPLACE_PAR_TA_CLE';

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

/** Deux seuls plans : mensuel 8,99€ / annuel 47,99€ — pas de Prestige */
export const PRICING_TIERS = {
  monthly: {
    id: 'monthly',
    priceId: 'price_MONTHLY_ID',
    name: 'Mensuel',
    badge: null,
    price: 8.99,
    currency: 'eur',
    interval: 'month',
    displayPrice: '8,99',
    displaySub: 'par mois',
    firstPayment: '8,99',
    firstPaymentLabel: 'Aujourd\'hui',
    features: ['Scans illimités', 'Score personnalisé', 'Accords mets-vins'],
    cta: 'Payer avec carte bancaire',
    highlight: false,
  },
  annual: {
    id: 'annual',
    priceId: 'price_ANNUAL_ID',
    name: 'Annuel',
    badge: 'POPULAIRE',
    badgeColor: '#D4AF37',
    price: 47.99,
    currency: 'eur',
    interval: 'year',
    displayPrice: '47,99',
    displaySub: 'par an',
    firstPayment: '47,99',
    firstPaymentLabel: 'Aujourd\'hui',
    features: [
      'Scans illimités',
      'Sommelier IA 24h/24',
      'Gestion de cave',
      'Historique complet',
      'Accords mets-vins IA',
    ],
    cta: 'Payer avec carte bancaire',
    highlight: true,
  },
} as const;

export type TierKey = keyof typeof PRICING_TIERS;
