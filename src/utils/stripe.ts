const STRIPE_LINKS = {
  annual: 'https://buy.stripe.com/dRmdR89jX2cS8WC6XRefC03',
  monthly: 'https://buy.stripe.com/fZu4gy0NreZEfl0aa3efC04',
} as const;

export function redirectToCheckout(plan: 'monthly' | 'annual') {
  const monthlyLink = import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK || STRIPE_LINKS.monthly;
  const annualLink = import.meta.env.VITE_STRIPE_ANNUAL_PAYMENT_LINK || STRIPE_LINKS.annual;

  let url: string;
  if (plan === 'monthly') url = monthlyLink;
  else url = annualLink;

  if (!url) {
    alert('Lien de paiement non configuré.');
    return;
  }

  window.location.href = url;
}
