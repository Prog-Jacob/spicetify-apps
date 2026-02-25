import en from './en';
import sharedEn from '@ui/i18n/en';
import { t as sharedT } from '@ui/i18n';
import { createTranslator, loadAllTranslations } from '@shared/i18n';

const combinedEnTranslations = { ...sharedEn, ...en };

export const t = createTranslator({ en: combinedEnTranslations });

export type MessageKey = keyof typeof combinedEnTranslations & string;

export const loadTranslations = () => loadAllTranslations(sharedT, t);
