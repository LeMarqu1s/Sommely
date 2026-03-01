import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

const GA_ID = (import.meta.env && import.meta.env.VITE_GA_ID) || '';

export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(script2);
  }, []);

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_ID, { page_path: location.pathname });
    }
  }, [location]);

  return null;
}

export function trackGA(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

