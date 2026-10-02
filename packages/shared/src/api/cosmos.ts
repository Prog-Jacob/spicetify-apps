type Body = Spicetify.CosmosAsync.Body;

// CosmosAsync may resolve with error bodies instead of throwing.
export const validateResponse = <T>(response: unknown, context: string, rejectNull = false): T => {
  if (response == null) {
    if (rejectNull) throw new Error(`${context}: empty response`);
    return response as T;
  }
  if (typeof response !== 'object') throw new Error(`${context}: empty response`);

  const res = response as Record<string, unknown>;
  if ('error' in res) {
    if (typeof res.error === 'string') throw new Error(`${context}: ${res.error}`);
    const err = res.error as { status?: number; message?: string };
    throw new Error(`${context}: ${err.status ?? 'unknown'} — ${err.message ?? 'no details'}`);
  }

  return response as T;
};

// Spicetify's version gate hands https to native Cosmos on Spotify 1.3.x, which can't resolve it,
// so take the route its wrapper means to: Transport for Spotify's API, its CORS proxy for the rest.
const TRANSPORT_HOSTS = new Set(['api.spotify.com', 'spclient.wg.spotify.com']);
const CORS_PROXY = 'https://cors-proxy.spicetify.app/{url}';

const request = async (url: string): Promise<unknown> => {
  const transport = Spicetify.Platform.Transport;
  if (!transport || !url.startsWith('https://')) return Spicetify.CosmosAsync.get(url);
  if (TRANSPORT_HOSTS.has(new URL(url).hostname)) {
    const res = await transport.request(url, {
      method: 'GET',
      responseType: 'json',
      authorize: true,
    });
    if (!res.ok) throw new Error(`${url}: ${res.status || 'network error'}`);
    return res.body;
  }
  const template = localStorage.getItem('spicetify:corsProxyTemplate') ?? CORS_PROXY;
  const res = await fetch(template.replace('{url}', url));
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

export const cosmos = {
  get: <T>(url: string): Promise<T> => request(url).then((r) => validateResponse<T>(r, url, true)),

  post: <T = void>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.post(url, body).then((r) => validateResponse<T>(r, url)),

  put: <T = void>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.put(url, body).then((r) => validateResponse<T>(r, url)),

  del: <T = void>(url: string, body?: Body): Promise<T> =>
    Spicetify.CosmosAsync.del(url, body).then((r) => validateResponse<T>(r, url)),
};
