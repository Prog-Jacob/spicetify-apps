import { REPO } from './repo';
import type { ReactNode } from 'react';

export const notifyError = (e: unknown, prefix?: string) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[${REPO}] ${prefix ?? 'Error'}:`, e);
  Spicetify.showNotification(prefix ? `${prefix}: ${msg}` : msg, true);
};

export const notifyDone = (message: ReactNode) => Spicetify.showNotification(message);
