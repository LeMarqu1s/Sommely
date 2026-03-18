export function detectCurrency(): { symbol: string; code: string } {
  const locale = navigator.language || 'fr-FR';
  const region = locale.split('-')[1]?.toUpperCase() || 'FR';

  const map: Record<string, { symbol: string; code: string }> = {
    US: { symbol: '$', code: 'USD' },
    GB: { symbol: '£', code: 'GBP' },
    CH: { symbol: 'CHF', code: 'CHF' },
    JP: { symbol: '¥', code: 'JPY' },
    CA: { symbol: 'CA$', code: 'CAD' },
    AU: { symbol: 'A$', code: 'AUD' },
  };

  return map[region] || { symbol: '€', code: 'EUR' };
}

export function formatPrice(amount: number, symbol: string): string {
  if (!amount) return '';
  return `${Math.round(amount)} ${symbol}`;
}
