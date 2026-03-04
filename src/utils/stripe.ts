export function redirectToCheckout(plan: 'monthly' | 'annual' | 'prestige') {
  const monthlyLink = import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK;
  const annualLink = import.meta.env.VITE_STRIPE_ANNUAL_PAYMENT_LINK;
  const prestigeLink = import.meta.env.VITE_STRIPE_PRESTIGE_PAYMENT_LINK;

  let url: string;
  if (plan === 'monthly') url = monthlyLink;
  else if (plan === 'annual') url = annualLink;
  else url = prestigeLink;

  if (!url) {
    alert('Lien de paiement non configuré.');
    return;
  }

  window.location.href = url;
}
