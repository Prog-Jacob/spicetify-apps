import * as React from 'react';

type SpicetifyIconProps = React.ComponentProps<'svg'> & {
  icon: Spicetify.Icon;
  size?: number;
};

/** One of Spotify's built-in 16px icons. Decorative unless given an `aria-label`. */
export const SpicetifyIcon = ({ icon, size = 16, ...rest }: SpicetifyIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden={rest['aria-label'] ? undefined : true}
    focusable="false"
    dangerouslySetInnerHTML={{ __html: Spicetify.SVGIcons[icon] }}
    {...rest}
  />
);
