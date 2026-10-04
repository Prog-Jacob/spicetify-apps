import { t } from '../i18n';
import { stagger } from '@ui/lib';
import { useLatestRef } from '@shared/hooks';
import { FOCUS_RING_INSET } from '@ui/styles';
import { cn, SPOTIFY_URI } from '@shared/lib';
import type { DataType, ExportData } from '../types/export';
import { resolveUriMetadata, type UriMeta } from '@shared/api';
import { DATA_TYPE_CONFIGS, type PreviewItem } from '../data-types';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pill,
  Dialog,
  Artwork,
  FilterBar,
  IconButton,
  SpicetifyIcon,
  TextComponent,
  ButtonTertiary,
} from '@ui/components';

const PAGE_SIZE = 100;

type Drill = { title: string; items: PreviewItem[] };

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
  const [drill, setDrill] = useState<Drill | null>(null);
  const allItems = drill?.items ?? topItems;
  const title = drill?.title ?? t(config.labelKey);

  const goTo = useCallback((target: Drill | null) => {
    setDrill(target);
    setFilter('');
    setLimit(PAGE_SIZE);
  }, []);
  const openItem = useCallback(
    (item: PreviewItem) => goTo({ title: item.primary, items: item.children ?? [] }),
    [goTo],
  );

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
  const metaRef = useLatestRef(meta);
  useEffect(() => {
    const uris = new Set(
      visible.flatMap(({ uri }) => (uri && !metaRef.current.has(uri) ? [uri] : [])),
    );
    if (!uris.size) return;
    let alive = true;
    let frame = 0;
    const landed = new Map<string, UriMeta>();
    // per-URI lookups so early results paint first, merged once per frame
    for (const uri of uris) {
      void resolveUriMetadata([uri]).then((m) => {
        if (!alive || !m.size) return;
        for (const [key, value] of m) landed.set(key, value);
        frame ||= requestAnimationFrame(() => {
          frame = 0;
          const batch = [...landed];
          landed.clear();
          setMeta((prev) => new Map([...prev, ...batch]));
        });
      });
    }
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [visible, metaRef]);

  const keys = useMemo(() => {
    const seen = new Map<string, number>();
    return visible.map((item) => {
      const base = item.uri ?? item.primary;
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      return n ? `${base}#${n}` : base;
    });
  }, [visible]);

  return (
    <Dialog
      label={title}
      onClose={(reason) => (reason === 'escape' && drill ? goTo(null) : onClose())}
    >
      <div className="flex items-center gap-3 p-4 pb-3">
        {drill && (
          <IconButton
            icon="chevron-left"
            shape="round"
            label={t('preview.back')}
            onClick={() => goTo(null)}
            className="rtl:-scale-x-100"
          />
        )}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-spice-button/20 text-spice-button">
          <SpicetifyIcon icon={config.icon} size={20} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TextComponent variant="ballad" weight="bold" className="truncate">
            {title}
          </TextComponent>
          <TextComponent variant="minuet" semanticColor="textSubdued">
            {t('dataType.itemCount', { count: allItems.length })}
          </TextComponent>
        </div>
        <IconButton icon="x" shape="round" label={t('preview.close')} onClick={onClose} />
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
            key={keys[i]}
            item={item}
            index={i}
            icon={config.icon}
            meta={item.uri ? meta.get(item.uri) : undefined}
            onOpen={openItem}
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
    </Dialog>
  );
};

const ROW = 'flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-spice-highlight/10';

const PreviewRow = memo(
  ({
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
    onOpen: (item: PreviewItem) => void;
  }) => {
    // rows whose primary is a bare URI (old exports) get the resolved name
    const primary = meta?.name && item.primary === item.uri ? meta.name : item.primary;

    const content = (
      <>
        <TextComponent
          variant="minuet"
          semanticColor="textSubdued"
          className="w-6 shrink-0 text-end tabular-nums"
        >
          {index + 1}
        </TextComponent>
        <Artwork
          src={item.imageUrl ?? meta?.imageUrl}
          size={32}
          shape={item.uri?.startsWith(SPOTIFY_URI.ARTIST) ? 'circle' : 'square'}
          fallback={<SpicetifyIcon icon={icon} size={14} className="text-spice-subtext/50" />}
        />
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
      </>
    );

    return (
      <div role="listitem" className="animate-fade-in-up" style={stagger(index)}>
        {item.children?.length ? (
          <button
            type="button"
            onClick={() => onOpen(item)}
            aria-label={t('preview.open', { label: primary })}
            className={cn(
              ROW,
              'cursor-pointer border-0 bg-transparent text-start',
              FOCUS_RING_INSET,
            )}
          >
            {content}
            <SpicetifyIcon
              icon="chevron-right"
              size={12}
              className="shrink-0 text-spice-subtext/50 rtl:rotate-180"
            />
          </button>
        ) : (
          <div className={ROW}>{content}</div>
        )}
      </div>
    );
  },
);
PreviewRow.displayName = 'PreviewRow';

export default ContentPreview;
