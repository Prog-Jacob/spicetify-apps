import { REPO } from './repo';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const notifyError = (e: unknown, prefix?: string) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[${REPO}] ${prefix ?? 'Error'}:`, e);
  Spicetify.showNotification(prefix ? `${prefix}: ${msg}` : msg, true);
};
