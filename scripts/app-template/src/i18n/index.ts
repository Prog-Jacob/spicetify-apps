import en from './en';
import { t as sharedT } from '@ui/i18n';
import { createTranslator, loadAllTranslations } from '@shared/i18n';

export const t = createTranslator({ en });

export type MessageKey = keyof typeof en & string;

export const loadTranslations = () => loadAllTranslations(sharedT, t, __BUNDLED_LOCALES__);
