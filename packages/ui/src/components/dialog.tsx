import { cn } from '@shared/lib';
import { useLatestRef } from '@shared/hooks';
import React, { useRef, useEffect } from 'react';

export type DialogCloseReason = 'escape' | 'backdrop' | 'navigate';

type DialogProps = {
  label: string;
  /** Called on Escape, a backdrop click, or a route change. Ignore a reason to keep it open. */
  onClose: (reason: DialogCloseReason) => void;
  className?: string;
  children: React.ReactNode;
};

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * A modal over the whole client: focus trap, focus restore, Escape and backdrop close. Portalled to
 * `<body>`, since an animated ancestor with a retained transform would otherwise capture `fixed`.
 */
export const Dialog = ({ label, onClose, className, children }: DialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useLatestRef(onClose);

  // Pages stay mounted while hidden, so a dialog would outlive its page on navigation.
  useEffect(() => Spicetify.Platform.History.listen(() => close.current('navigate')), [close]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.stopPropagation();
        return close.current('escape');
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === panelRef.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [close]);

  return Spicetify.ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-spice-shadow/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close.current('backdrop')}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'flex max-h-[80vh] w-[min(92vw,34rem)] animate-scale-in flex-col overflow-hidden overscroll-contain rounded-xl bg-spice-card shadow-2xl shadow-spice-shadow/50 outline-none',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
