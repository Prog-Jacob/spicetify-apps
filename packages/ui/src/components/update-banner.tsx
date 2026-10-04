import { t } from '../i18n';
import { Pill } from './pill';
import { cn, REPO_RAW } from '@shared/lib';
import { IconButton } from './icon-button';
import { ButtonSecondary } from './button';
import { FOCUS_RING } from '../styles/surfaces';
import { SpicetifyIcon } from './spicetify-icon';
import { TextComponent } from './text-component';
import React, { useRef, useState, useEffect } from 'react';
import { usePersistentState, useUpdateCheck } from '@shared/hooks';

const COPY_FEEDBACK_MS = 2000;

const INSTALL_COMMAND = navigator.userAgent.toLowerCase().includes('windows')
  ? `iex "& { $(iwr -useb ${REPO_RAW}/install.ps1) } ${__APP_NAME__}"`
  : `curl -fsSL ${REPO_RAW}/install.sh | bash -s ${__APP_NAME__}`;

/** Fetches GitHub releases itself; renders nothing until a newer version exists. */
export const UpdateBanner = ({ className }: { className?: string }) => {
  const update = useUpdateCheck();
  const [dismissed, setDismissed] = usePersistentState<string | null>('update-dismissed', null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!update || dismissed === update.url) return null;

  const handleCopy = () => {
    void Spicetify.Platform.ClipboardAPI.copy(INSTALL_COMMAND);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <div className={className}>
      <div className="flex animate-fade-in-up items-center gap-3 overflow-hidden rounded-lg bg-spice-card py-2.5 pe-2.5 ps-0 text-spice-text">
        <div className="w-1 shrink-0 self-stretch rounded-e-sm bg-spice-button" />

        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-spice-button/20 text-spice-button">
          <SpicetifyIcon icon="download" size={16} />
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          <TextComponent variant="mesto" className="truncate">
            {t('update.available', { appName: __APP_DISPLAY_NAME__ })}
          </TextComponent>
          <Pill className="shrink-0 text-spice-subtext">
            <span dir="ltr">{`v${__APP_VERSION__} → v${update.version}`}</span>
          </Pill>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ButtonSecondary
            buttonSize="sm"
            onClick={handleCopy}
            title={t('update.copyCommand')}
            iconLeading={() => <SpicetifyIcon icon={copied ? 'check' : 'copy'} size={14} />}
          >
            <span aria-live="polite">{copied ? t('update.copied') : t('update.update')}</span>
          </ButtonSecondary>

          <a
            href={update.url}
            target="_blank"
            rel="noopener noreferrer"
            title={t('update.viewRelease')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-spice-text no-underline transition-colors hover:bg-spice-highlight/20',
              FOCUS_RING,
            )}
          >
            <SpicetifyIcon icon="external-link" size={14} />
            {t('update.release')}
          </a>

          <IconButton
            icon="x"
            size={14}
            shape="round"
            label={t('update.dismiss')}
            onClick={() => setDismissed(update.url)}
          />
        </div>
      </div>
    </div>
  );
};
