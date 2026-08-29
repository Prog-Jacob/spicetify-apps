import type { EntityRef, TrackRef } from '../types/graph';

export type AlbumEnrichment = { tracks: TrackRef[] };
export type ArtistEnrichment = { related: EntityRef[]; albums: EntityRef[] };

type GqlEntity = { uri?: string; name?: string; profile?: { name?: string } };
type GqlList<T> = { items?: T[] };
type AlbumTrack = GqlEntity & { artists?: GqlList<GqlEntity> };

type ArtistOverviewResponse = {
  data?: {
    artistUnion?: {
      relatedContent?: { relatedArtists?: GqlList<GqlEntity> };
      discography?: { albums?: GqlList<{ releases?: GqlList<GqlEntity> }> };
    };
  };
};

type AlbumResponse = {
  data?: {
    albumUnion?: {
      tracks?: GqlList<{ track?: AlbumTrack }>;
      tracksV2?: GqlList<{ track?: AlbumTrack }>;
    };
  };
};

const items = <T>(list: GqlList<T> | undefined): T[] => list?.items ?? [];
const present = <T>(values: (T | null)[]): T[] => values.filter((v): v is T => v !== null);

const toRef = (entity: GqlEntity | undefined): EntityRef | null => {
  const name = entity?.name ?? entity?.profile?.name;
  return entity?.uri && name ? { uri: entity.uri, name } : null;
};

export const parseArtistOverview = (raw: unknown): ArtistEnrichment => {
  const artist = (raw as ArtistOverviewResponse)?.data?.artistUnion;
  return {
    related: present(items(artist?.relatedContent?.relatedArtists).map(toRef)),
    albums: present(
      items(artist?.discography?.albums).flatMap((entry) => items(entry.releases).map(toRef)),
    ),
  };
};

export const parseAlbumTracks = (raw: unknown): AlbumEnrichment => {
  const album = (raw as AlbumResponse)?.data?.albumUnion;
  return {
    tracks: present(
      items(album?.tracks ?? album?.tracksV2).map(({ track }) => {
        const ref = toRef(track);
        return ref ? { ...ref, artists: present(items(track?.artists).map(toRef)) } : null;
      }),
    ),
  };
};
