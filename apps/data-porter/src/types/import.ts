import type { ExportData } from './export';

export type ParsedFile = {
  data: ExportData;
  sourceFormat: 'our-export' | 'spotify-official';
  fileName: string;
};

export type ImportLogEntry = {
  label: string;
  status: 'ok' | 'skipped' | 'error';
  detail?: string;
};

export type ImportResult = {
  log: ImportLogEntry[];
  warnings: string[];
};

export type PlaylistConflictResolution = 'merge' | 'skip' | 'create-new';

export type PlaylistConflict = {
  importedName: string;
  existingUri: string;
};
