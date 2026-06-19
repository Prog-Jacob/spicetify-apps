import type { MessageValue, PluralEntry } from '@shared/i18n';

const en = {
  // Common
  download: 'Download',
  selectAll: 'Select All',
  deselectAll: 'Deselect All',

  // Navigation
  'nav.import': 'Import',
  'nav.export': 'Export',

  // Export page
  'export.title': 'Export Your Data',
  'export.subtitle': 'Choose what to include, then download as JSON.',
  'export.myData': 'My Data',
  'export.anotherUser': 'Another User',
  'export.whatToInclude': 'What to include',
  'export.selectItems': 'Select items to export',
  'export.count': 'Export {selected} of {total}',
  'export.spotifyProfile': 'Spotify profile',
  'export.profilePlaceholder': 'https://open.spotify.com/user/... or spotify:user:... or username',
  'export.exportUserData': 'Export User Data',
  'export.failed': 'Export Failed',
  'export.downloaded': 'File downloaded',

  // Import page
  'import.title': 'Import Data',
  'import.subtitle': 'Upload a JSON file or pull from a public Spotify profile.',
  'import.foundIn': 'Found in {fileName}',
  'import.sourceSpotify': 'Spotify official export',
  'import.sourceDataPorter': 'Data Porter export',
  'import.sourceProfile': 'Public profile import',
  'import.chooseDifferent': 'Choose Different File',
  'import.importSelected': 'Import Selected',
  'import.failed': 'Import Failed',

  // File drop zone
  'dropZone.dropHere': 'Drop a JSON file here',
  'dropZone.browse': 'or click to browse',
  'dropZone.orUrl': 'or paste a URL or Spotify profile',
  'dropZone.fetch': 'Fetch',
  'dropZone.fetching': 'Fetching\u2026',
  'dropZone.urlPlaceholder': 'URL, profile link, or username',
  'dropZone.urlLabel': 'Import URL or Spotify profile',

  // Playlist review
  'conflict.title': {
    one: 'Review # playlist',
    other: 'Review # playlists',
  } as PluralEntry,
  'conflict.continue': 'Continue Import',
  'conflict.filter': 'Filter by name\u2026',
  'conflict.applyToAll': 'Apply to all',
  'conflict.showing': '{filtered} of {total}',
  'conflict.resolutionFor': 'Resolution for {name}',
  'conflict.skip': 'Skip',
  'conflict.merge': 'Merge',
  'conflict.createNew': 'Create New',
  'conflict.exists': 'Exists',

  // Summaries
  'summary.complete': 'Complete',
  'summary.partial': 'Partially Complete',
  'summary.newExport': 'New Export',
  'summary.importAgain': 'Import Again',
  'summary.goToExport': 'Go to Export',

  // Data types
  'dataType.playlists': 'Playlists',
  'dataType.playlists.desc': 'Playlists with all their tracks',
  'dataType.likedSongs': 'Liked Songs',
  'dataType.likedSongs.desc': 'Songs you\u2019ve liked',
  'dataType.albums': 'Albums',
  'dataType.albums.desc': 'Albums you\u2019ve saved',
  'dataType.artists': 'Artists',
  'dataType.artists.desc': 'Artists you follow',
  'dataType.shows': 'Shows',
  'dataType.shows.desc': 'Podcasts you follow',
  'dataType.episodes': 'Episodes',
  'dataType.episodes.desc': 'Saved podcast episodes',
  'dataType.recentlyPlayed': 'Recently Played',
  'dataType.recentlyPlayed.desc': 'Your listening history',
  'dataType.bannedContent': 'Banned Content',
  'dataType.bannedContent.desc': 'Blocked tracks, artists, and taste exclusions',
  'dataType.profile': 'Profile',
  'dataType.profile.desc': 'Your account info',
  'dataType.searchHistory': 'Search History',
  'dataType.searchHistory.desc': 'Your recent searches',
  'dataType.exportOnly': 'Export Only',
  'dataType.itemCount': '{count} items',
  'dataType.include': 'Include {label}',

  // Progress labels
  'progress.starting': 'Starting',
  'progress.scanningLibrary': 'Scanning library',
  'progress.fetchingPlaylists': 'Fetching playlists',
  'progress.fetchingLikedSongs': 'Fetching liked songs',
  'progress.playlist': 'Playlist: {name}',
  'progress.savingLikedSongs': 'Saving liked songs',
  'progress.savingAlbums': 'Saving albums',
  'progress.followingArtists': 'Following artists',
  'progress.savingShows': 'Saving shows',
  'progress.importingPlaylist': 'Importing playlist "{name}"',
  'progress.checkingPlaylists': 'Checking for existing playlists',
  'progress.fetchingProfile': 'Fetching user profile',
  'progress.fetchingPlaylistList': 'Fetching playlist list',
  'progress.fetchingArtists': 'Fetching followed artists',
  'progress.fetchingEpisodes': 'Fetching saved episodes',
  'progress.savingEpisodes': 'Saving episodes',
  'progress.banningContent': 'Restoring banned content',
  'progress.fetchingRecentlyPlayed': 'Fetching recently played',
  'progress.fetchingBannedContent': 'Fetching banned content',
  'progress.fetchingUserProfile': 'Fetching profile',
  'progress.fetchingSearchHistory': 'Fetching search history',

  // Importer log entries
  'log.localTracks': '{count} local tracks skipped',
  'log.playlistSkipped': '"{name}" skipped',
  'log.playlistFailed': '"{name}" failed',
  'log.playlistCreated': 'Created "{name}" \u2014 {count} tracks',
  'log.playlistMerged': 'Merged into "{name}" \u2014 {count} tracks',
  'log.localSkipped': '"{name}": {count} local tracks skipped',
  'log.episodesNoUri': '"{name}": {count} episodes skipped (no URI in Spotify export)',
  'log.duplicatesSkipped': '"{name}": {count} duplicates skipped',
  'log.mergeReadFailed': '"{name}": could not read for merge, duplicates may exist',
  'log.saved': '{count} {noun}',
  'log.failed': 'Failed: {label}',
  'log.descriptionFailed': '"{name}": failed to set description',
  'log.permissionFailed': '"{name}": failed to set permissions',

  // Warnings and errors
  'warn.playlistsFailed': '{count} playlists failed to load: {names}',
  'warn.noPublicData': 'This user has no public playlists or followed artists to export.',
  'warn.fetchFailed': 'Failed to fetch {label}',
  'error.invalidProfile': 'Invalid Spotify profile URL or user ID.',
  'error.notValidJson': '"{fileName}" is not valid JSON',
  'error.notJsonObject': '"{fileName}" must be a JSON object',
  'error.invalidPlaylists': '"{fileName}": invalid playlists array',
  'error.invalidLibrary': '"{fileName}": invalid library object',
  'error.unrecognizedFormat':
    '"{fileName}" is not a recognized format. Expected a Data Porter export or Spotify YourLibrary.json / Playlist1.json.',
  'error.fileTooLargeSize': '"{name}" is too large ({size} MB). Maximum is 20 MB.',
  'error.unexpected': 'Something went wrong',
} as const;

export type DataPorterMessages = Record<keyof typeof en, MessageValue>;
export default en;
