import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

export type Currency = { code: string; symbol: string; rate: number };

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', rate: 1 },
  { code: 'USD', symbol: '$', rate: 1.08 },
  { code: 'GBP', symbol: '£', rate: 0.85 },
  { code: 'CHF', symbol: 'CHF', rate: 0.95 },
];

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (amount: number) => string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  currency: CURRENCIES[0],
  setCurrency: () => {},
  formatPrice: (n) => {
    const c = Math.round(n * 100) / 100;
    return `${c % 1 === 0 ? c.toString() : c.toFixed(2).replace('.', ',')} €`;
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('sommely_theme') as Theme) || 'light';
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('sommely_currency');
    return CURRENCIES.find(c => c.code === saved) || CURRENCIES[0];
  });

  useEffect(() => {
    localStorage.setItem('sommely_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('sommely_currency', c.code);
  };

  const formatPrice = (amount: number): string => {
    if (!amount) return '';
    const converted = Math.round(amount * currency.rate * 100) / 100;
    const formatted = converted % 1 === 0
      ? converted.toString()
      : converted.toFixed(2).replace('.', ',');
    return `${formatted} ${currency.symbol}`;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currency, setCurrency, formatPrice }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
