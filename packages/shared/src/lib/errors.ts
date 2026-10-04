/** A user-input problem: shown as a toast, never as a failure screen. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
