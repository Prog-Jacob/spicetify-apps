import { t } from '../i18n';
import { cn } from '@shared/lib/utils';
import React, { useState, useRef } from 'react';
import { notifyError } from '@shared/lib/errors';
import type { ParsedFile } from '../types/import';
import { Input, SpicetifyIcon } from '@ui/components';
import { parseImportFile, parseImportText, checkFileSize } from '../services/file-parser';

const { TextComponent } = Spicetify.ReactComponent;

type FileDropZoneProps = {
  onFileSelected: (parsed: ParsedFile) => void;
};

const FileDropZone = ({ onFileSelected }: FileDropZoneProps) => {
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      onFileSelected(await parseImportFile(file));
    } catch (e) {
      notifyError(e);
    }
  };

  const handleUrl = async () => {
    const trimmed = url.trim();

    if (!/^https?:\/\//i.test(trimmed)) return notifyError(new Error(t('dropZone.invalidUrl')));

    setFetching(true);
    try {
      const res = await fetch(trimmed);
      if (!res.ok) throw new Error(t('import.failed'));

      const fileName = trimmed.split('/').pop()?.split('?')[0] || 'import.json';
      const length = Number(res.headers.get('content-length'));
      if (length) checkFileSize(length, fileName);

      onFileSelected(parseImportText(await res.text(), fileName));
    } catch (e) {
      notifyError(e);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label={t('dropZone.dropHere')}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())
        }
        className={cn(
          'flex min-h-[40vh] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-12 transition-colors',
          dragOver
            ? 'border-spice-button bg-spice-button/10'
            : 'border-spice-subtext/30 bg-spice-card hover:border-spice-subtext/60 hover:bg-spice-highlight',
        )}
      >
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-full transition-colors',
            dragOver
              ? 'bg-spice-button/20 text-spice-button'
              : 'bg-spice-sidebar text-spice-subtext',
          )}
        >
          <SpicetifyIcon icon="download" size={28} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <TextComponent variant="mesto" weight="bold">
            {t('dropZone.dropHere')}
          </TextComponent>
          <TextComponent variant="minuet" semanticColor="textSubdued">
            {t('dropZone.browse')}
          </TextComponent>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-3 text-spice-subtext/50">
        <div className="h-px flex-1 bg-current" />
        <TextComponent variant="minuet" semanticColor="textSubdued">
          {t('dropZone.orUrl')}
        </TextComponent>
        <div className="h-px flex-1 bg-current" />
      </div>

      <div className="flex gap-2">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
          placeholder="https://…"
          disabled={fetching}
          aria-label={t('dropZone.urlLabel')}
        />
        <button
          type="button"
          onClick={handleUrl}
          disabled={!url.trim() || fetching}
          className="flex items-center gap-1.5 border-0 bg-transparent text-sm font-bold text-spice-subtext transition-colors hover:text-spice-text disabled:opacity-50"
        >
          <SpicetifyIcon icon={fetching ? 'repeat' : 'download'} size={14} />
          {fetching ? t('dropZone.fetching') : t('dropZone.fetch')}
        </button>
      </div>
    </div>
  );
};

export default FileDropZone;
