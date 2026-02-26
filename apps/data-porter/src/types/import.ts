import type { ExportData } from './export';
import type { SOURCE_FORMAT, LOG_STATUS, CONFLICT_RESOLUTION } from '../constants';

export type PlaylistConflictResolution =
  (typeof CONFLICT_RESOLUTION)[keyof typeof CONFLICT_RESOLUTION];
export type LogStatus = (typeof LOG_STATUS)[keyof typeof LOG_STATUS];
export type SourceFormat = (typeof SOURCE_FORMAT)[keyof typeof SOURCE_FORMAT];

export type ParsedFile = {
  data: ExportData;
  sourceFormat: SourceFormat;
  fileName: string;
};

export type ImportLogEntry = {
  label: string;
  status: LogStatus;
  detail?: string;
};

export type ImportResult = {
  log: ImportLogEntry[];
  warnings: string[];
};

export type PlaylistConflict = {
  importedName: string;
  existingUri: string;
};
