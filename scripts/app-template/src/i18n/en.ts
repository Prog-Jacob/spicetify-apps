import type { MessageValue } from '@shared/i18n';

const en = {
  'app.title': '{{NAME}}',
  'app.subtitle': '{{DESCRIPTION}}',
  'app.error': 'Something went wrong.',
  'likes.count': 'Count Liked Songs',
  'likes.progress': 'Reading Liked Songs',
  'likes.result': { one: 'You have # liked song', other: 'You have # liked songs' },
  'likes.failed': 'Could not read your Liked Songs',
  'likes.again': 'Count again',
} as const;

export type AppMessages = Record<keyof typeof en, MessageValue>;
export default en;
