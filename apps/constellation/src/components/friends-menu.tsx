import { t } from '../i18n';
import { cn } from '@shared/lib';
import React, { useState } from 'react';
import { FOCUS_RING } from './chrome-styles';
import { SpicetifyIcon } from '@ui/components';
import { monogram } from '../graph/node-style';
import { listFriends, type Friend } from '@shared/api';

type Props = {
  disabled: boolean;
  onPick: (uri: string) => void;
};

const FriendAvatar = ({ friend }: { friend: Friend }) =>
  friend.imageUrl ? (
    <img src={friend.imageUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spice-button/30 text-[10px] font-semibold text-spice-text">
      {monogram(friend.name)}
    </span>
  );

const FriendsMenu = ({ disabled, onPick }: Props) => {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[] | null>(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && friends === null) setFriends(await listFriends());
  };

  const pick = (friend: Friend) => {
    setOpen(false);
    onPick(friend.uri);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void toggle()}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium text-spice-subtext transition-colors hover:text-spice-text disabled:opacity-40',
          FOCUS_RING,
        )}
      >
        <SpicetifyIcon icon="follow" size={13} />
        {t('friends.add')}
      </button>
      {open && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-md border border-spice-subtext/20 bg-spice-card/95 p-1 shadow-lg backdrop-blur">
          {friends === null ? (
            <li className="px-2 py-1.5 text-xs text-spice-subtext/70">{t('friends.loading')}</li>
          ) : friends.length === 0 ? (
            <li className="px-2 py-1.5 text-xs text-spice-subtext/70">{t('friends.empty')}</li>
          ) : (
            friends.map((friend) => (
              <li key={friend.uri}>
                <button
                  type="button"
                  onClick={() => pick(friend)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-start transition-colors hover:bg-spice-highlight/20',
                    FOCUS_RING,
                  )}
                >
                  <FriendAvatar friend={friend} />
                  <span className="truncate text-sm text-spice-text">{friend.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default FriendsMenu;
