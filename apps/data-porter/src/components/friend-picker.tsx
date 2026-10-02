import { t } from '../i18n';
import React, { useEffect, useState } from 'react';
import { parseUserId, SPOTIFY_URI } from '@shared/lib';
import { listSocialGraph, type ProfileRef } from '@shared/api';
import { SpicetifyIcon, TextComponent, ToggleChip } from '@ui/components';

type FriendPickerProps = {
  value: string;
  disabled: boolean;
  onPick: (value: string) => void;
};

// Friends are who you follow plus who follows you; if neither loads, the picker stays hidden.
const FriendPicker = ({ value, disabled, onPick }: FriendPickerProps) => {
  const [friends, setFriends] = useState<ProfileRef[]>([]);
  const picked = `${SPOTIFY_URI.USER}${parseUserId(value)}`;

  useEffect(() => {
    let alive = true;
    listSocialGraph().then(
      ({ following, followers }) => {
        if (!alive) return;
        const byUri = new Map([...following, ...followers].map((p) => [p.uri, p]));
        setFriends(
          [...byUri.values()].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
          ),
        );
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);

  if (!friends.length) return null;

  return (
    <fieldset disabled={disabled} className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0">
        <TextComponent variant="mesto" weight="bold" semanticColor="textSubdued">
          {t('export.friends')}
        </TextComponent>
      </legend>
      {/* padded so focus rings aren't clipped by the scroll box */}
      <div className="-m-1 flex max-h-40 flex-wrap gap-2 overflow-y-auto p-1">
        {friends.map(({ uri, name, imageUrl }) => {
          const active = uri === picked;
          return (
            <ToggleChip
              key={uri}
              active={active}
              onToggle={() => onPick(active ? '' : uri)}
              className="flex items-center gap-1.5 ps-1 disabled:pointer-events-none disabled:opacity-60"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="grid size-5 place-items-center rounded-full bg-spice-subtext/20">
                  <SpicetifyIcon icon="artist" size={12} />
                </span>
              )}
              <bdi className="max-w-48 truncate" title={name}>
                {name}
              </bdi>
            </ToggleChip>
          );
        })}
      </div>
    </fieldset>
  );
};

export default FriendPicker;
