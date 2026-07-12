import { t } from '../i18n';
import { cn, SPOTIFY_URI } from '@shared/lib';
import { ANIMATION_STAGGER_MS } from '../constants';
import type { DataType, ExportData } from '../types/export';
import { resolveUriMetadata, type UriMeta } from '@shared/api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DATA_TYPE_CONFIGS, type PreviewItem } from '../data-types';
import { Pill, FilterBar, SpicetifyIcon, TextComponent, ButtonTertiary } from '@ui/components';

const PAGE_SIZE = 100;
const STAGGER_CAP = 15;

const ICON_BUTTON_CLASS =
  'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-spice-subtext transition-colors hover:bg-spice-highlight hover:text-spice-text';

type ContentPreviewProps = {
  type: DataType;
  data: ExportData;
  onClose: () => void;
};

const ContentPreview = ({ type, data, onClose }: ContentPreviewProps) => {
  const config = DATA_TYPE_CONFIGS[type];
  const topItems = useMemo(() => config.getPreviewItems(data), [config, data]);

  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  // one drill level: a row with children (e.g. a playlist) swaps the list
  const [drill, setDrill] = useState<{ title: string; items: PreviewItem[] } | null>(null);
  const allItems = drill?.items ?? topItems;

  const goTo = (target: typeof drill) => {
    setDrill(target);
    setFilter('');
    setLimit(PAGE_SIZE);
  };

  const panelRef = useRef<HTMLDivElement>(null);
  // callers pass inline closures; refs keep the mount-only effects stable
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const drillRef = useRef(drill);
  drillRef.current = drill;

  // pages stay mounted and this modal portals to document.body, so it would
  // outlive its (now hidden) page on navigation; close on any route change
  useEffect(() => {
    return Spicetify.Platform.History.listen(() => onCloseRef.current());
  }, []);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      // Escape backs out of a drill first, then closes the modal
      if (e.key === 'Escape') return drillRef.current ? goTo(null) : onCloseRef.current();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, input');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
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
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return allItems;
    const needle = filter.toLowerCase();
    // optional chains: hand-edited import files can lack fields despite the types
    return allItems.filter((item) =>
      [item.primary, item.secondary, item.badge].some((field) =>
        field?.toLowerCase().includes(needle),
      ),
    );
  }, [filter, allItems]);

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
  const remaining = filtered.length - visible.length;

  // artwork + name enrichment for the visible page only; cached in the resolver
  const [meta, setMeta] = useState<Map<string, UriMeta>>(new Map());
  useEffect(() => {
    const uris = visible.map((item) => item.uri).filter((uri): uri is string => !!uri);
    if (!uris.length) return;
    let alive = true;
    // per-URI lookups merged as they land, so early results paint immediately
    for (const uri of uris) {
      void resolveUriMetadata([uri]).then(
        (m) => alive && m.size && setMeta((prev) => new Map([...prev, ...m])),
      );
    }
    return () => {
      alive = false;
    };
  }, [visible]);

  // portal to body: an ancestor with a retained transform/filter (animated
  // cards) would otherwise become the containing block for this fixed overlay
  return Spicetify.ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCloseRef.current()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={t(config.labelKey)}
        className="flex max-h-[80vh] w-[min(92vw,34rem)] animate-scale-in flex-col overflow-hidden rounded-xl bg-spice-card shadow-2xl shadow-spice-shadow/50 outline-none"
      >
        <div className="flex items-center gap-3 p-4 pb-3">
          {drill && (
            <button
              type="button"
              onClick={() => goTo(null)}
              aria-label={t('preview.back')}
              className={ICON_BUTTON_CLASS}
            >
              <SpicetifyIcon icon="chevron-left" size={16} className="rtl:rotate-180" />
            </button>
          )}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-spice-button/20 text-spice-button">
            <SpicetifyIcon icon={config.icon} size={20} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <TextComponent variant="ballad" weight="bold" className="truncate">
              {drill?.title ?? t(config.labelKey)}
            </TextComponent>
            <TextComponent variant="minuet" semanticColor="textSubdued">
              {t('dataType.itemCount', { count: allItems.length })}
            </TextComponent>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('preview.close')}
            className={ICON_BUTTON_CLASS}
          >
            <SpicetifyIcon icon="x" size={16} />
          </button>
        </div>

        {allItems.length > 10 && (
          <FilterBar
            value={filter}
            total={allItems.length}
            filtered={filtered.length}
            className="px-4 pb-3"
            onChange={(value) => {
              setFilter(value);
              setLimit(PAGE_SIZE);
            }}
          />
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-2" role="list">
          {visible.map((item, i) => (
            <PreviewRow
              key={`${item.uri ?? item.primary}-${i}`}
              item={item}
              index={i}
              icon={config.icon}
              meta={item.uri ? meta.get(item.uri) : undefined}
              onOpen={
                item.children?.length
                  ? () => goTo({ title: item.primary, items: item.children! })
                  : undefined
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <TextComponent variant="mesto" semanticColor="textSubdued">
                {t('preview.noResults')}
              </TextComponent>
            </div>
          )}
        </div>

        {remaining > 0 && (
          <div className="flex justify-center border-t border-spice-highlight/20 p-2">
            <ButtonTertiary onClick={() => setLimit((l) => l + PAGE_SIZE)} buttonSize="sm">
              {t('preview.showMore', { remaining })}
            </ButtonTertiary>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

const PreviewRow = ({
  item,
  index,
  icon,
  meta,
  onOpen,
}: {
  item: PreviewItem;
  index: number;
  icon: Spicetify.Icon;
  meta?: UriMeta;
  onOpen?: () => void;
}) => {
  const image = item.imageUrl ?? meta?.imageUrl;
  // rows whose primary is a bare URI (old exports) get the resolved name
  const primary = meta?.name && item.primary === item.uri ? meta.name : item.primary;
  const isArtist = item.uri?.startsWith(SPOTIFY_URI.ARTIST);

  // drillable rows are real buttons so the focus trap and keyboard pick them up
  const Row = onOpen ? 'button' : 'div';

  return (
    <Row
      role="listitem"
      onClick={onOpen}
      {...(onOpen && { type: 'button', 'aria-label': t('preview.open', { label: primary }) })}
      className={cn(
        'flex w-full animate-fade-in-up items-center gap-3 rounded-md px-3 py-2 hover:bg-spice-highlight/10',
        onOpen && 'cursor-pointer border-0 bg-transparent text-start',
      )}
      style={{
        animationDelay: `${Math.min(index, STAGGER_CAP) * ANIMATION_STAGGER_MS.LIST_ITEM}ms`,
      }}
    >
      <TextComponent
        variant="minuet"
        semanticColor="textSubdued"
        className="w-6 shrink-0 text-end tabular-nums"
      >
        {index + 1}
      </TextComponent>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center overflow-hidden bg-spice-highlight/40',
          isArtist ? 'rounded-full' : 'rounded-md',
        )}
      >
        {image ? (
          <img src={image} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <SpicetifyIcon icon={icon} size={14} className="text-spice-subtext/50" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TextComponent variant="viola" className="truncate">
          {primary}
        </TextComponent>
        {item.secondary && (
          <TextComponent variant="minuet" semanticColor="textSubdued" className="truncate">
            {item.secondary}
          </TextComponent>
        )}
      </div>
      {item.badge && <Pill className="shrink-0 text-spice-subtext">{item.badge}</Pill>}
      {onOpen && (
        <SpicetifyIcon
          icon="chevron-right"
          size={12}
          className="shrink-0 text-spice-subtext/50 rtl:rotate-180"
        />
      )}
    </Row>
  );
};

export default ContentPreview;
