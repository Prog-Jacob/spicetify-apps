const BASE_URL = 'https://spclient.wg.spotify.com/user-profile-view/v3/profile';

export const userProfileUrl = (userId: string) => `${BASE_URL}/${encodeURIComponent(userId)}`;
