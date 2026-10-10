'use client';

import { useMemo } from 'react';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { KINDS, type ModelKind } from '@/lib/kind';
import { Segment } from './FilterControls';
import { EMPTY_FILTER, isFilterActive, type FilterState, type Kind, type Region, type Weights } from './filters';
import type { LeanModel, LeanVendor } from './types';
import { CONTROL, FOCUS } from './ui';

const dict = getDict(DEFAULT_LANG);

/**
 * 排行榜与总表共用的筛选条。
 *
 * 全部控件都是受控的，状态由调用方持有并同步到 URL——这样两个页面的
 * `?region=east&weights=open` 是同一个意思，链接可以互相带着参数跳。
 *
 * 形状遵循 DESIGN.md：按下态靠「边框 + 背景」两个轴的明度变化表达，
 * 不做彩色填充、不做阴影；未选中不装成禁用（`--fg-faint`）——它们都能点。
 */

interface ModelFiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  vendors: LeanVendor[];
  models: LeanModel[];
  /** 当前筛选后剩多少个模型，显示在清空按钮旁 */
  matched?: number;
}

export function ModelFilters({ value, onChange, vendors, models, matched }: ModelFiltersProps) {
  /*
   * 类型按钮只列快照里真有的类型，并带上数量：读者一眼知道「视频生成」是 5 个还是 50 个。
   * 数量按全库算而不按当前筛选算——否则点了「国内」之后「语音 0」会闪来闪去。
   * 只有「含已退役」这一项会影响它：退役模型默认不在任何名单里，数进去会对不上。
   */
  const kindOptions = useMemo(() => {
    const count = new Map<ModelKind, number>();
    let multimodal = 0;
    for (const m of models) {
      if (m.retired && !value.retired) continue;
      if (!m.kind) continue;
      count.set(m.kind, (count.get(m.kind) ?? 0) + 1);
      if (m.kind !== 'text') multimodal += 1;
    }
    const present = KINDS.filter((k) => (count.get(k) ?? 0) > 0);
    return [
      { id: 'all' as Kind, text: dict.board.filter.all },
      // 「多模态」排在六个具体类型前面：它是读者最常用的问法，而且是这几类的并集
      ...(multimodal > 0
        ? [
            {
              id: 'multimodal' as Kind,
              text: `${dict.kind.multimodal} ${multimodal}`,
              title: dict.kind.multimodalHint,
            },
          ]
        : []),
      ...present.map((k) => ({
        id: k as Kind,
        text: `${dict.kind.label[k]} ${count.get(k)}`,
        title: dict.kind.hint[k],
      })),
    ];
  }, [models, value.retired]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const m of models) if (m.year != null) set.add(m.year);
    return [...set].sort((a, b) => b - a);
  }, [models]);

  const vendorGroups = useMemo(() => {
    const used = new Set(models.map((m) => m.vendor));
    const list = vendors.filter((v) => used.has(v.id));
    const sortByName = (a: LeanVendor, b: LeanVendor) => a.nameZh.localeCompare(b.nameZh, 'zh-Hans-CN');
    return [
      { label: dict.continent.east, items: list.filter((v) => v.continent === 'east').sort(sortByName) },
      { label: dict.continent.west, items: list.filter((v) => v.continent === 'west').sort(sortByName) },
    ];
  }, [vendors, models]);

  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...value, [k]: v });
  const toggleVendor = (id: string) =>
    set(
      'vendors',
      value.vendors.includes(id) ? value.vendors.filter((x) => x !== id) : [...value.vendors, id],
    );

  const active = isFilterActive(value);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-panel px-3 py-2">
      <label className="flex items-center gap-1.5">
        <span className="text-2xs text-fg-dim">{dict.board.filter.search}</span>
        <input
          type="search"
          value={value.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder={dict.board.filter.searchPlaceholder}
          aria-label={dict.board.filter.searchPlaceholder}
          className={`${CONTROL} w-36 placeholder:text-fg-dim sm:w-44`}
        />
      </label>

      <Segment<Region>
        label={dict.board.filter.region}
        value={value.region}
        options={[
          { id: 'all', text: dict.board.filter.all },
          { id: 'east', text: dict.continent.east },
          { id: 'west', text: dict.continent.west },
        ]}
        onChange={(v) => set('region', v)}
      />

      <Segment<Weights>
        label={dict.board.filter.weights}
        value={value.weights}
        options={[
          { id: 'all', text: dict.board.filter.all },
          { id: 'open', text: dict.openness.open },
          { id: 'closed', text: dict.openness.closed },
        ]}
        onChange={(v) => set('weights', v)}
      />

      <Segment<Kind>
        label={dict.kind.filterLabel}
        value={value.kind}
        options={kindOptions}
        onChange={(v) => set('kind', v)}
      />

      <label className="flex items-center gap-1.5">
        <span className="text-2xs text-fg-dim">{dict.board.filter.year}</span>
        <select
          value={value.year ?? ''}
          onChange={(e) => set('year', e.target.value ? Number(e.target.value) : null)}
          className={CONTROL}
          aria-label={dict.board.filter.year}
        >
          <option value="">{dict.board.filter.unlimited}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      {/* 厂商多选：原生 details 做下拉，不需要额外状态，点外面收起靠浏览器自己 */}
      <details className="relative">
        <summary
          className={`flex min-h-7 cursor-pointer list-none items-center gap-1.5 rounded-md border px-2 text-xs select-none transition-colors duration-120 ${FOCUS} ${
            value.vendors.length
              ? 'border-line-strong bg-raised text-fg'
              : 'border-line bg-inset text-fg-muted hover:text-fg'
          }`}
        >
          {dict.board.filter.vendor}
          {value.vendors.length > 0 ? `（${value.vendors.length}）` : ''}
          <span aria-hidden className="text-2xs">
            ▼
          </span>
        </summary>
        <div className="absolute top-full left-0 z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-line bg-raised p-2 shadow-none">
          {vendorGroups.map((g) => (
            <div key={g.label} className="mb-2 last:mb-0">
              <div className="mb-1 text-2xs text-fg-dim">{g.label}</div>
              <ul className="grid grid-cols-2 gap-x-2">
                {g.items.map((v) => {
                  const on = value.vendors.includes(v.id);
                  return (
                    <li key={v.id}>
                      <label className="flex cursor-pointer items-center gap-1.5 py-0.5 text-xs leading-5 text-fg-muted hover:text-fg">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleVendor(v.id)}
                          className="accent-[var(--color-accent)]"
                        />
                        <VendorLogo vendorId={v.id} name={v.nameZh} brandColor={v.accent} size={20} />
                        <span className={`truncate ${on ? 'text-fg' : ''}`}>{v.nameZh}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {value.vendors.length > 0 && (
            <button
              type="button"
              onClick={() => set('vendors', [])}
              className={`mt-1 text-2xs text-fg-dim underline-offset-4 hover:text-fg hover:underline ${FOCUS}`}
            >
              {dict.board.filter.clearVendors}
            </button>
          )}
        </div>
      </details>

      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={value.retired}
          onChange={(e) => set('retired', e.target.checked)}
          className="accent-[var(--color-accent)]"
        />
        {dict.board.filter.retired}
      </label>

      <span className="ml-auto flex items-center gap-3 text-2xs text-fg-dim">
        {matched != null && <span className="tnum">{dict.board.filter.matched(matched)}</span>}
        {active && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTER)}
            className={`text-fg-muted underline underline-offset-4 hover:text-fg ${FOCUS}`}
          >
            {dict.board.filter.clear}
          </button>
        )}
      </span>
    </div>
  );
}
