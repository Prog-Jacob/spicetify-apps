import Pill from './pill';
import { t } from '../i18n';
import TextComponent from './text';
import SpicetifyIcon from './icon';
import { REPO_RAW } from '@shared/lib';
import React, { useRef, useState, useEffect } from 'react';

const COPY_FEEDBACK_MS = 2000;
const STORAGE_KEY = `${__APP_NAME__}:update-dismissed`;
const { ButtonSecondary, ButtonTertiary } = Spicetify.ReactComponent;

const INSTALL_COMMAND = navigator.userAgent.toLowerCase().includes('windows')
  ? `iex "& { $(iwr -useb ${REPO_RAW}/install.ps1) } ${__APP_NAME__}"`
  : `curl -fsSL ${REPO_RAW}/install.sh | bash -s ${__APP_NAME__}`;

type UpdateBannerProps = {
  releaseUrl: string;
  version: string;
  className?: string;
};

const UpdateBanner = ({ releaseUrl, version, className }: UpdateBannerProps) => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === releaseUrl,
  );
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (dismissed) return null;

  const handleCopy = () => {
    Spicetify.Platform.ClipboardAPI.copy(INSTALL_COMMAND);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, releaseUrl);
    setDismissed(true);
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
            <span dir="ltr">{`v${__APP_VERSION__} → v${version}`}</span>
          </Pill>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ButtonSecondary
            buttonSize="sm"
            onClick={handleCopy}
            aria-label={copied ? t('update.copied') : t('update.copyCommand')}
          >
            <span className="flex items-center gap-1.5">
              <SpicetifyIcon icon={copied ? 'check' : 'copy'} size={14} />
              {copied ? t('update.copied') : t('update.update')}
            </span>
          </ButtonSecondary>

          <ButtonTertiary
            buttonSize="sm"
            onClick={() => window.open(releaseUrl, '_blank')}
            aria-label={t('update.viewRelease')}
          >
            <span className="flex items-center gap-1.5">
              <SpicetifyIcon icon="external-link" size={14} />
              {t('update.release')}
            </span>
          </ButtonTertiary>

          <ButtonTertiary buttonSize="sm" onClick={handleDismiss} aria-label={t('update.dismiss')}>
            <SpicetifyIcon icon="x" size={14} />
          </ButtonTertiary>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
