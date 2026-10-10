'use client';

import { useMemo, useRef, useState } from 'react';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { CmpModel, CompareData } from './types';

const dict = getDict(DEFAULT_LANG);
const FOCUS = 'outline-none focus-visible:border-line-focus focus-visible:ring-1 focus-visible:ring-line-focus';

/**
 * 对比页的「添加模型」输入框。
 *
 * 只在已下发的 `compare-data.json` 里本地匹配，不走全站搜索那一套：
 * 这里要的是「挑一个模型」，不需要厂商、能力概念那些结果类型。
 * 结果是**按钮**而不是链接——点了只改地址栏的 query，不跳页。
 */

/** 与全站搜索同一种折叠：大小写、空格、连字符、点都不算差别，「gpt6sol」能搜到「GPT-6 Sol」 */
function fold(s: string): string {
  return s.toLowerCase().replace(/[\s\-_.·/()（）]+/g, '');
}

const LIMIT = 8;

export function ModelPicker({
  data,
  picked,
  onPick,
  disabled,
}: {
  data: CompareData;
  picked: string[];
  onPick: (slug: string) => void;
  disabled: boolean;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const composing = useRef(false);

  const index = useMemo(
    () =>
      data.models.map((m) => ({
        m,
        name: fold(m.name),
        hay: fold(`${m.name} ${m.slug} ${data.vendors[m.vendor]?.name ?? ''} ${m.vendor}`),
      })),
    [data],
  );

  const results = useMemo(() => {
    const f = fold(q);
    if (!f) return [];
    const taken = new Set(picked);
    return index
      .filter((e) => !taken.has(e.m.slug) && e.hay.includes(f))
      .map((e) => ({
        m: e.m,
        rank: e.name === f ? 0 : e.name.startsWith(f) ? 1 : e.name.includes(f) ? 2 : 3,
      }))
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          Number(a.m.retired) - Number(b.m.retired) ||
          (b.m.date ?? '').localeCompare(a.m.date ?? '') ||
          a.m.name.localeCompare(b.m.name),
      )
      .slice(0, LIMIT)
      .map((r) => r.m);
  }, [q, index, picked]);

  const choose = (m: CmpModel) => {
    onPick(m.slug);
    setQ('');
    setActive(0);
  };

  return (
    <div className="relative w-full sm:w-80">
      <input
        type="search"
        value={q}
        disabled={disabled}
        placeholder={disabled ? dict.cmp.pickDisabled : dict.cmp.pickPlaceholder}
        aria-label={dict.cmp.pickLabel}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={() => (composing.current = false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (composing.current) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className={`min-h-8 w-full rounded-md border border-line bg-inset px-2.5 text-xs text-fg placeholder:text-fg-dim disabled:opacity-60 ${FOCUS}`}
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          aria-label={dict.cmp.pickLabel}
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-96 overflow-y-auto rounded-md border border-line bg-raised py-1"
        >
          {results.map((m, i) => {
            const v = data.vendors[m.vendor];
            return (
              <li key={m.slug} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  // mousedown 先于 blur：不拦的话输入框失焦会先把列表关掉，点击落空
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(m)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                    i === active ? 'bg-panel text-fg' : 'text-fg-muted'
                  }`}
                >
                  {v && <VendorLogo vendorId={m.vendor} name={v.name} brandColor={v.accent} size={20} />}
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="tnum shrink-0 text-2xs text-fg-dim">
                    {m.retired ? dict.badge.retired : (m.date ?? '').slice(0, 7)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {open && fold(q) !== '' && results.length === 0 && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 rounded-md border border-line bg-raised px-3 py-2 text-xs text-fg-muted">
          {dict.cmp.noMatch}
        </div>
      )}
    </div>
  );
}
