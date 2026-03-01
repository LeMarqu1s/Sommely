export function redirectToCheckout(plan: 'monthly' | 'annual') {
  const monthlyLink = import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK;
  const annualLink = import.meta.env.VITE_STRIPE_ANNUAL_PAYMENT_LINK;

  const url = plan === 'monthly' ? monthlyLink : annualLink;

  if (!url) {
    alert('Lien de paiement non configuré.');
    return;
  }

  window.location.href = url;
}
