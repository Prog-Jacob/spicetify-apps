import type { ReactNode } from 'react';
import { errorMessage } from './errors';

export const notifyError = (e: unknown, prefix?: string) => {
  const msg = errorMessage(e);
  console.error(`[${__APP_NAME__}] ${prefix ?? 'Error'}:`, e);
  Spicetify.showNotification(prefix ? `${prefix}: ${msg}` : msg, true);
};

export const notifyDone = (message: ReactNode) => Spicetify.showNotification(message);
