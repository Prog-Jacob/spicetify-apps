import React, { useState } from 'react';
import { SpicetifyIcon } from './icon';
import { platform } from '@shared/api/platform';

const BASE_URL = 'https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main';

const { TextComponent, ButtonTertiary } = Spicetify.ReactComponent;

const toDisplayName = (appName: string) =>
  appName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const getInstallCommand = (appName: string) =>
  navigator.userAgent.toLowerCase().includes('windows')
    ? `iex "& { $(iwr -useb ${BASE_URL}/install.ps1) } ${appName}"`
    : `curl -fsSL ${BASE_URL}/install.sh | bash -s ${appName}`;

type UpdateBannerProps = {
  appName: string;
  releaseUrl: string;
};

const UpdateBanner = ({ appName, releaseUrl }: UpdateBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (dismissed) return null;

  const handleCopy = () => {
    platform.ClipboardAPI.copy(getInstallCommand(appName));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-lg bg-spice-card py-2.5 pr-2.5 pl-0">
      <div className="w-1 shrink-0 self-stretch rounded-r-sm bg-spice-notification" />

      <SpicetifyIcon icon="download" size={16} className="shrink-0 text-spice-notification" />

      <TextComponent variant="mesto" semanticColor="textSubdued" className="flex-1">
        A new version of {toDisplayName(appName)} is available
      </TextComponent>

      <div className="flex shrink-0 items-center gap-1">
        <ButtonTertiary
          buttonSize="sm"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy install command'}
        >
          <span className="flex items-center gap-1.5">
            <SpicetifyIcon icon={copied ? 'check' : 'copy'} size={14} />
            {copied ? 'Copied!' : 'Update'}
          </span>
        </ButtonTertiary>

        <ButtonTertiary
          buttonSize="sm"
          onClick={() => window.open(releaseUrl, '_blank')}
          aria-label="View release"
        >
          <span className="flex items-center gap-1.5">
            <SpicetifyIcon icon="external-link" size={14} />
            Release
          </span>
        </ButtonTertiary>

        <ButtonTertiary buttonSize="sm" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <SpicetifyIcon icon="x" size={14} />
        </ButtonTertiary>
      </div>
    </div>
  );
};

export default UpdateBanner;
