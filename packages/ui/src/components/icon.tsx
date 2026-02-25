import * as React from 'react';

type SpicetifyIconProps = React.ComponentProps<'svg'> & {
  icon: Spicetify.Icon;
  size?: number;
};

const SpicetifyIcon = ({ icon, size = 16, className, ...rest }: SpicetifyIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    dangerouslySetInnerHTML={{ __html: Spicetify.SVGIcons[icon] }}
    {...rest}
  />
);

export default SpicetifyIcon;
