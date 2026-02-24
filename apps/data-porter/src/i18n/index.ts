import en from './en';
import { createTranslator } from '@shared/i18n';

export const t = createTranslator({ en });

export type MessageKey = keyof typeof en & string;
