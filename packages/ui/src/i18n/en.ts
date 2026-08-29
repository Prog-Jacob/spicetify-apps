import type { MessageValue } from '@shared/i18n';

const en = {
  tryAgain: 'Try Again',
  cancel: 'Cancel',
  'filter.placeholder': 'Filter by name…',
  'filter.showing': '{filtered} of {total}',
  'filter.clear': 'Clear search',
  'update.available': 'A new version of {appName} is available',
  'update.copied': 'Copied!',
  'update.update': 'Update',
  'update.release': 'Release',
  'progress.counter': '{current} / {total}',
  'update.copyCommand': 'Copy install command',
  'update.viewRelease': 'View release',
  'update.dismiss': 'Dismiss',
} as const;

export type UiMessages = Record<keyof typeof en, MessageValue>;
export default en;
