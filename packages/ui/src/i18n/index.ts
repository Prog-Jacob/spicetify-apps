import en from './en';
import { createTranslator } from '@shared/i18n';

export { default as en } from './en';
export type { UiMessages } from './en';
export { default as ar } from './ar.json';
export const t = createTranslator({ en });
