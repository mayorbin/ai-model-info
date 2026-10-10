'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { runSearch, type SearchIndex, type SearchResult } from '@/lib/search';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';

const dict = getDict(DEFAULT_LANG);
const DEBOUNCE_MS = 120;

let cachedIndex: SearchIndex | null = null;
let inflight: Promise<SearchIndex | null> | null = null;

function loadIndex(): Promise<SearchIndex | null> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  inflight ??= fetch('/search-index.json')
    .then((r) => (r.ok ? (r.json() as Promise<SearchIndex>) : null))
    .then((i) => {
      cachedIndex = i;
      return i;
    })
    .catch(() => null);
  return inflight;
}

interface Row {
  key: string;
  href: string;
  title: string;
  note: string;
  tail?: string;
  group?: string;
}

function toRows(r: SearchResult): Row[] {
  const rows: Row[] = [];

  r.shortcuts.forEach((s, i) => {
    rows.push({
      key: `s${i}`,
      href: s.href,
      title: s.label,
      note: s.hint,
      tail: s.count != null ? `${s.count} 个` : undefined,
      group: i === 0 ? '快捷定位' : undefined,
    });
  });

  r.vendors.forEach((v, i) => {
    rows.push({
      key: `v${v.vendor.i}`,
      href: v.href,
      title: v.vendor.n,
      note: `${dict.continent[v.vendor.c]}厂商`,
      tail: `${v.vendor.t} 个模型`,
      group: i === 0 ? '厂商' : undefined,
    });
  });

  r.models.forEach((m, i) => {
    const kind = m.model.k ? dict.kind.label[m.model.k] : dict.kind.unknown;
    rows.push({
      key: `m${m.model.s}`,
      href: m.href,
      title: m.model.n,
      note: `${m.vendor.n} · ${kind}${m.model.x ? ' · 已退役' : ''}`,
      tail: m.model.r != null ? `#${m.model.r}` : undefined,
      group: i === 0 ? '模型' : undefined,
    });
  });

  return rows;
}

export function GlobalSearch() {
  const [index, setIndex] = useState<SearchIndex | null>(cachedIndex);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [composing, setComposing] = useState(false);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const warm = useCallback(() => {
    if (cachedIndex) return;
    void loadIndex().then(setIndex);
  }, []);

  // 全局 Ctrl+K / Cmd+K / 斜杠 聚焦搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        warm();
        setOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        warm();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [warm]);

  useEffect(() => {
    if (composing) return;
    const t = setTimeout(() => setTerm(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q, composing]);

  const result = useMemo(() => runSearch(index, term), [index, term]);
  const rows = useMemo(() => toRows(result), [result]);
  const hasRows = rows.length > 0;
  const active = Math.min(cursor, Math.max(0, rows.length - 1));
  const pending = term.trim() !== q.trim();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const dismiss = () => {
    setOpen(false);
    setQ('');
    setTerm('');
    inputRef.current?.blur();
  };

  const activate = (selector: string) => {
    boxRef.current?.querySelector<HTMLElement>(selector)?.click();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || !hasRows) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((active + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((active - 1 + rows.length) % rows.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate('[data-active="1"]');
    }
  };

  const showPanel = open && q.trim() !== '';

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex h-8 w-full items-center gap-1.5 rounded border border-line bg-inset px-2 transition-colors focus-within:border-accent sm:gap-2 sm:px-2.5">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-fg-dim"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onFocus={() => {
            warm();
            setOpen(true);
          }}
          onPointerEnter={warm}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={onKeyDown}
          placeholder="搜索模型、厂商、能力…"
          aria-label="搜索模型、厂商或能力"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          role="combobox"
          className="w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-dim"
        />
        <kbd className="hidden shrink-0 rounded border border-line-strong px-1 text-[10px] text-fg-dim md:inline-block">
          ⌘K
        </kbd>
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1.5 max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded border border-line bg-panel p-1 shadow-2xl sm:w-80"
        >
          {!index && <div className="px-3 py-2 text-2xs text-fg-dim">正在载入索引…</div>}

          {index && !hasRows && pending && (
            <div className="px-3 py-2 text-2xs text-fg-dim">搜索中…</div>
          )}

          {index && !hasRows && !pending && (
            <div className="px-3 py-2 text-2xs text-fg-dim">
              未找到匹配项。可试试「多模态」「开源」「国内」或厂商名称。
            </div>
          )}

          {rows.map((row, i) => (
            <div key={row.key}>
              {row.group && (
                <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium text-fg-dim">
                  {row.group}
                </div>
              )}
              <Link
                href={row.href}
                role="option"
                aria-selected={i === active}
                data-active={i === active ? '1' : undefined}
                onPointerEnter={() => setCursor(i)}
                onClick={dismiss}
                className={`flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-xs transition-colors duration-100 ${
                  i === active ? 'bg-raised text-fg' : 'text-fg-muted hover:bg-raised/60 hover:text-fg'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-fg">{row.title}</div>
                  <div className="truncate text-2xs text-fg-dim">{row.note}</div>
                </div>
                {row.tail && (
                  <span className="tnum shrink-0 text-2xs text-fg-muted">{row.tail}</span>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
