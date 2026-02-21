import React from 'react';
import { cn } from '@shared/lib/utils';
import StatusHeader from './status-header';
import { SpicetifyIcon } from '@ui/components/ui/icon';
import { Card, CardContent } from '@ui/components/ui/card';
import type { PlaylistConflict, PlaylistConflictResolution } from '../types/import';

const { TextComponent, ButtonPrimary, ButtonTertiary } = Spicetify.ReactComponent;

const RESOLUTION_OPTIONS: { value: PlaylistConflictResolution; label: string }[] = [
  { value: 'merge', label: 'Merge' },
  { value: 'skip', label: 'Skip' },
  { value: 'create-new', label: 'Create New' },
];

type ResolutionPickerProps = {
  active?: PlaylistConflictResolution;
  onChange: (value: PlaylistConflictResolution) => void;
  ariaLabel?: string;
};

const ResolutionPicker = ({ active, onChange, ariaLabel }: ResolutionPickerProps) => (
  <div className="flex shrink-0 items-center gap-2" role="radiogroup" aria-label={ariaLabel}>
    {RESOLUTION_OPTIONS.map(({ value, label }, i) => (
      <React.Fragment key={value}>
        {i > 0 && <span className="text-spice-subtext/30">&middot;</span>}
        <button
          type="button"
          role="radio"
          aria-checked={active === value}
          onClick={() => onChange(value)}
          className={cn(
            'cursor-pointer border-0 bg-transparent p-0 text-sm transition-colors',
            active === value
              ? 'font-semibold text-spice-button'
              : 'text-spice-subtext hover:text-spice-text',
          )}
        >
          {label}
        </button>
      </React.Fragment>
    ))}
  </div>
);

type ConflictCardProps = {
  conflicts: PlaylistConflict[];
  resolutions: Map<string, PlaylistConflictResolution>;
  onResolutionChange: (name: string, value: PlaylistConflictResolution) => void;
  onApplyAll: (value: PlaylistConflictResolution) => void;
  onContinue: () => void;
  onCancel: () => void;
};

const ConflictCard = ({
  conflicts,
  resolutions,
  onResolutionChange,
  onApplyAll,
  onContinue,
  onCancel,
}: ConflictCardProps) => {
  const first = resolutions.get(conflicts[0]?.importedName);
  const allSame = conflicts.every((c) => resolutions.get(c.importedName) === first)
    ? first
    : undefined;

  return (
    <Card className="animate-fade-in-up border-0 py-5">
      <CardContent className="flex flex-col gap-5">
        <StatusHeader
          variant="warning"
          title={`${conflicts.length} playlist${conflicts.length === 1 ? '' : 's'} already exist`}
        />

        <div className="max-h-72 overflow-y-auto overflow-x-hidden rounded-lg border border-spice-highlight/20">
          {conflicts.length >= 2 && (
            <>
              <div className="flex items-center justify-between bg-spice-highlight/20 px-4 py-3">
                <TextComponent variant="ballad" semanticColor="textSubdued">
                  Apply to all
                </TextComponent>
                <ResolutionPicker
                  active={allSame}
                  onChange={onApplyAll}
                  ariaLabel="Apply resolution to all"
                />
              </div>
              <div className="px-4">
                <div className="border-b border-spice-subtext/20" />
              </div>
            </>
          )}

          {conflicts.map(({ importedName }, i) => (
            <div
              key={importedName}
              className={cn(
                'animate-fade-in-up flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-spice-highlight/10',
                i < conflicts.length - 1 && 'border-b border-spice-highlight/15',
              )}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <SpicetifyIcon icon="playlist" size={16} className="shrink-0 text-spice-subtext" />
                <TextComponent variant="mesto" weight="bold" className="truncate">
                  {importedName}
                </TextComponent>
              </div>
              <ResolutionPicker
                active={resolutions.get(importedName)}
                onChange={(v) => onResolutionChange(importedName, v)}
                ariaLabel={`Resolution for ${importedName}`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <ButtonPrimary onClick={onContinue} buttonSize="md">
            Continue Import
          </ButtonPrimary>
          <ButtonTertiary onClick={onCancel} buttonSize="md">
            Cancel
          </ButtonTertiary>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConflictCard;
