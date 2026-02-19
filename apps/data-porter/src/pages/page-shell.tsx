import React from 'react';

const { TextComponent } = Spicetify.ReactComponent;

type PageShellProps = {
  title: string;
  subtitle: string;
  navButton?: React.ReactNode;
  children: React.ReactNode;
};

const PageShell = ({ title, subtitle, navButton, children }: PageShellProps) => (
  <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-6 pt-16">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <TextComponent variant="canon" weight="bold">
            {title}
          </TextComponent>
          <span className="rounded bg-[var(--spice-card)] px-1.5 py-0.5 text-[11px] text-[var(--spice-subtext)]">
            v{__APP_VERSION__}
          </span>
        </div>
        <TextComponent variant="viola" semanticColor="textSubdued">
          {subtitle}
        </TextComponent>
      </div>
      {navButton && <div className="shrink-0 pt-1">{navButton}</div>}
    </div>
    {children}
  </div>
);

export default PageShell;
