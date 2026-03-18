export function redirectToCheckout(plan: 'monthly' | 'quarterly' | 'annual') {
  const monthlyLink = import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK;
  const quarterlyLink = import.meta.env.VITE_STRIPE_QUARTERLY_PAYMENT_LINK;
  const annualLink = import.meta.env.VITE_STRIPE_ANNUAL_PAYMENT_LINK;

  let url: string;
  if (plan === 'monthly') url = monthlyLink;
  else if (plan === 'quarterly') url = quarterlyLink;
  else url = annualLink;

  if (!url) {
    alert('Lien de paiement non configuré.');
    return;
  }

  window.location.href = url;
}
