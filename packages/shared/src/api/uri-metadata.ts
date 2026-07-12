import { cosmos } from './cosmos';

export type UriMeta = { name?: string; imageUrl?: string };

// oEmbed is public and uniform across entity types; the Web API
// (api.spotify.com) is aggressively rate-limited for client tokens (429s
// even on single-id batches), so it is not usable from inside the client.
// Fetched via cosmos rather than window.fetch: CosmosAsync is exempt from
// the renderer's CORS policy.
const OEMBED_URL = 'https://open.spotify.com/oembed?url=';
const CONCURRENCY = 8;

const SUPPORTED = new Set(['track', 'album', 'artist', 'show', 'episode', 'playlist']);

// one promise per URI so overlapping calls share in-flight lookups
const cache = new Map<string, Promise<UriMeta>>();

let active = 0;
const waiters: (() => void)[] = [];

async function lookup(uri: string): Promise<UriMeta> {
  if (active < CONCURRENCY) active++;
  else await new Promise<void>((resolve) => waiters.push(resolve)); // slot handed off below
  try {
    const res = await cosmos.get<{ title?: string; thumbnail_url?: string }>(
      OEMBED_URL + encodeURIComponent(uri),
    );
    return { name: res.title, imageUrl: res.thumbnail_url };
  } catch {
    return {}; // best-effort decoration; the empty result is cached so it is not retried
  } finally {
    const waiter = waiters.shift();
    if (waiter) waiter();
    else active--;
  }
}

/**
 * Best-effort lookup of display metadata (name + thumbnail) for Spotify URIs.
 * Results are cached for the session, including failures.
 */
export async function resolveUriMetadata(uris: string[]): Promise<Map<string, UriMeta>> {
  const wanted = [...new Set(uris)].filter((uri) => SUPPORTED.has(uri.split(':')[1]));
  for (const uri of wanted) if (!cache.has(uri)) cache.set(uri, lookup(uri));
  const metas = await Promise.all(wanted.map((uri) => cache.get(uri)!));
  return new Map(wanted.map((uri, i) => [uri, metas[i]]));
}
