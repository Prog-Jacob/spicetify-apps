type Body = Spicetify.CosmosAsync.Body;

// CosmosAsync may resolve with error bodies instead of throwing.
export const validateResponse = <T>(response: unknown, context: string, rejectNull = false): T => {
  if (response == null && !rejectNull) return response as T;
  if (typeof response !== 'object') throw new Error(`${context}: empty response`);

  const res = response as Record<string, unknown>;
  if ('error' in res) {
    if (typeof res.error === 'string') throw new Error(`${context}: ${res.error}`);
    const err = res.error as { status?: number; message?: string };
    throw new Error(`${context}: ${err.status ?? 'unknown'} — ${err.message ?? 'no details'}`);
  }

  return response as T;
};

export const cosmos = {
  get: <T>(url: string): Promise<T> =>
    Spicetify.CosmosAsync.get(url).then((r) => validateResponse<T>(r, url, true)),

  post: <T = void>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.post(url, body).then((r) => validateResponse<T>(r, url)),

  put: <T = void>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.put(url, body).then((r) => validateResponse<T>(r, url)),

  del: <T = void>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.del(url, body).then((r) => validateResponse<T>(r, url)),
};
