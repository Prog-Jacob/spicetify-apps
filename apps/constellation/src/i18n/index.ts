import en from './en';
import * as ui from '@ui/i18n';
import { createAppTranslator } from '@shared/i18n';

export const { t, loadTranslations } = createAppTranslator(en, ui);
