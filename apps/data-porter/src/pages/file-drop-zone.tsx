import { cn } from '@shared/lib/utils';
import React, { useState, useRef } from 'react';
import type { ParsedFile } from '../types/import';
import { SpicetifyIcon } from '@ui/components/ui/icon';
import { parseImportFile } from '../services/file-parser';

const { TextComponent } = Spicetify.ReactComponent;

type FileDropZoneProps = {
  onFileSelected: (parsed: ParsedFile) => void;
};

const FileDropZone = ({ onFileSelected }: FileDropZoneProps) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      onFileSelected(await parseImportFile(file));
    } catch (e) {
      Spicetify.showNotification(e instanceof Error ? e.message : String(e), true);
    }
  };

  return (
    <div
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
      className={cn(
        'flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-150',
        dragOver
          ? 'border-spice-button bg-spice-button/10'
          : 'border-spice-subtext/30 bg-spice-card hover:border-spice-subtext/60 hover:bg-spice-highlight',
      )}
    >
      <div
        className={cn(
          'flex size-14 items-center justify-center rounded-full transition-colors',
          dragOver ? 'bg-spice-button/20 text-spice-button' : 'bg-spice-sidebar text-spice-subtext',
        )}
      >
        <SpicetifyIcon icon="download" size={28} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <TextComponent variant="mesto" weight="bold">
          Drop a JSON file here
        </TextComponent>
        <TextComponent variant="minuet" semanticColor="textSubdued">
          or click to browse
        </TextComponent>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
};

export default FileDropZone;
