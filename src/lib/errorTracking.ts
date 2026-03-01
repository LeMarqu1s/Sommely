import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    environment: import.meta.env.MODE,
  });
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error(error);
  Sentry.captureException(error, { extra: context });
}

export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email });
}
