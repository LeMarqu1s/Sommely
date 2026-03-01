import { useEffect } from 'react';

declare global {
  interface Window {
    clarity: any;
  }
}

const CLARITY_ID = (import.meta.env && import.meta.env.VITE_CLARITY_ID) || 'REMPLACE_PAR_TON_ID_CLARITY';

export function ClarityScript() {
  useEffect(() => {
    if (!CLARITY_ID || CLARITY_ID === 'REMPLACE_PAR_TON_ID_CLARITY') return;
    // Ne charger Clarity qu'en production (évite ERR_BLOCKED_BY_CLIENT en dev avec adblocker)
    if (import.meta.env.DEV) return;

    (function (c: any, l: any, a: string, r: string, i: any, t: any, y: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID, null, null);
  }, []);

  return null;
}

export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('event', eventName, data);
  }
}

