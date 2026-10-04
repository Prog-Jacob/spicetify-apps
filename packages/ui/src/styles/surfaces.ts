export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-button';

/** For controls flush against a clipping edge (list rows, toolbars), where an outer ring is cut. */
export const FOCUS_RING_INSET = `${FOCUS_RING} focus-visible:ring-inset`;

export const INSET_SURFACE = 'rounded-lg border border-spice-subtext/10 bg-spice-text/[0.035]';

export const PANEL_SURFACE =
  'rounded-2xl border border-spice-subtext/12 bg-spice-card/80 shadow-xl shadow-spice-shadow/40 backdrop-blur-xl';

export const SECTION_LABEL = 'text-[11px] font-semibold text-spice-subtext';

/** Hides a row's secondary control until hover or focus, but only where hover exists (not touch). */
export const REVEAL_ON_HOVER =
  '[@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';
