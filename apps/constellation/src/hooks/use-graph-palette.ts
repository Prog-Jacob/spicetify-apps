import { useThemeValue } from '@shared/hooks';
import { readGraphPalette, samePalette, type GraphPalette } from '../graph/theme';

export const useGraphPalette = (): GraphPalette => useThemeValue(readGraphPalette, samePalette);
