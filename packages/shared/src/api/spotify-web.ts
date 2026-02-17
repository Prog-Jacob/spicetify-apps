import { cosmos } from './cosmos';

type Body = Spicetify.CosmosAsync.Body;

const API_BASE = 'https://api.spotify.com/v1';

export const spotifyWeb = {
  get: <T = unknown>(path: string): Promise<T> => cosmos.get<T>(`${API_BASE}${path}`),

  post: <T = unknown>(path: string, body?: Body): Promise<T> =>
    cosmos.post<T>(`${API_BASE}${path}`, body),

  put: <T = unknown>(path: string, body?: Body): Promise<T> =>
    cosmos.put<T>(`${API_BASE}${path}`, body),

  del: <T = unknown>(path: string, body?: Body): Promise<T> =>
    cosmos.del<T>(`${API_BASE}${path}`, body),
};
