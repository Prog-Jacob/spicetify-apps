import { spotifyImageUrl } from '@shared/lib';
import type { SpotifyImage } from '@shared/types';

export const rememberImage = (images: Map<string, string>, uri: string, raw?: string): void => {
  if (images.has(uri)) return;
  const url = spotifyImageUrl(raw);
  if (url) images.set(uri, url);
};

export const rememberFirstImage = (
  images: Map<string, string>,
  uri: string,
  list?: SpotifyImage[],
): void => rememberImage(images, uri, list?.[0]?.url);
