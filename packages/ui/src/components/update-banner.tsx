import { t } from '../i18n';
import TextComponent from './text';
import SpicetifyIcon from './icon';
import { REPO_RAW } from '@shared/lib';
import { platform } from '@shared/api';
import React, { useRef, useState, useEffect } from 'react';

const COPY_FEEDBACK_MS = 2000;
const { ButtonTertiary } = Spicetify.ReactComponent;

const toDisplayName = (appName: string) =>
  appName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const getInstallCommand = (appName: string) =>
  navigator.userAgent.toLowerCase().includes('windows')
    ? `iex "& { $(iwr -useb ${REPO_RAW}/install.ps1) } ${appName}"`
    : `curl -fsSL ${REPO_RAW}/install.sh | bash -s ${appName}`;

type UpdateBannerProps = {
  appName: string;
  releaseUrl: string;
};

const UpdateBanner = ({ appName, releaseUrl }: UpdateBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (dismissed) return null;

  const handleCopy = () => {
    platform.ClipboardAPI.copy(getInstallCommand(appName));
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-lg bg-spice-card py-2.5 pe-2.5 ps-0">
      <div className="w-1 shrink-0 self-stretch rounded-e-sm bg-spice-notification" />

      <SpicetifyIcon icon="download" size={16} className="shrink-0 text-spice-notification" />

      <TextComponent variant="mesto" semanticColor="textSubdued" className="flex-1">
        {t('update.available', { appName: toDisplayName(appName) })}
      </TextComponent>

      <div className="flex shrink-0 items-center gap-1">
        <ButtonTertiary
          buttonSize="sm"
          onClick={handleCopy}
          aria-label={copied ? t('update.copied') : t('update.copyCommand')}
        >
          <span className="flex items-center gap-1.5">
            <SpicetifyIcon icon={copied ? 'check' : 'copy'} size={14} />
            {copied ? t('update.copied') : t('update.update')}
          </span>
        </ButtonTertiary>

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

        <ButtonTertiary
          buttonSize="sm"
          onClick={() => setDismissed(true)}
          aria-label={t('update.dismiss')}
        >
          <SpicetifyIcon icon="x" size={14} />
        </ButtonTertiary>
      </div>
    </div>
  );
};

export default UpdateBanner;
