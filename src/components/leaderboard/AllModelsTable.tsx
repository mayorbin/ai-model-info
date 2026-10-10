'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { COLUMNS, DEFAULT_LIMIT, DEFAULT_SORT, KIND_ORDER, type Column, type Dir, type SortKey } from './allColumns';
import { EMPTY_FILTER, filterFromParams, filterToParams, makePredicate, type FilterState } from './filters';
import { ModelFilters } from './ModelFilters';
import type { AllRow, AllTableData } from './types';
import { FOCUS } from './ui';
import { useUrlQuery } from '@/components/ui/useUrlQuery';

const dict = getDict(DEFAULT_LANG);

/**
 * 全部模型总表：查询能力的主入口。
 *
 * 一行一个模型，可按任意列排序。没有数据的格子写「—」并排到末尾，绝不填 0。
 * 编程那一列只显示分位档（顶尖/很强/中等……），原始分数放在悬停提示里——
 * 二十多个赛制的分数互不可比，并排摆出来一定会被读者直接比大小。
 */

export function AllModelsTable({ data }: { data: AllTableData }) {
  const [params, update] = useUrlQuery();
  const filter = useMemo(() => (params ? filterFromParams(params) : EMPTY_FILTER), [params]);
  const showAll = params?.get('all') === '1';

  const sortKey = (COLUMNS.find((c) => c.key === params?.get('sort'))?.key ?? DEFAULT_SORT.key) as SortKey;
  const dir: Dir =
    params?.get('dir') === 'asc' ? 'asc' : params?.get('dir') === 'desc' ? 'desc' : DEFAULT_SORT.dir;

  const vendorMap = useMemo(() => new Map(data.vendors.map((v) => [v.id, v])), [data.vendors]);
  const predicate = useMemo(() => makePredicate(filter, vendorMap), [filter, vendorMap]);

  const rows = useMemo(() => {
    const kept = data.rows.filter((r) => predicate(data.models[r.m]));
    const sign = dir === 'asc' ? 1 : -1;
    // 缺数据的一律排最后，与方向无关：谁都不想翻到底才看见有数据的
    const num = (a: number | null, b: number | null) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return (a - b) * sign;
    };
    const str = (a: string, b: string) => a.localeCompare(b, 'zh-Hans-CN') * sign;
    const byName = (a: AllRow, b: AllRow) =>
      data.models[a.m].name.localeCompare(data.models[b.m].name, 'zh-Hans-CN');

    const cmp = (a: AllRow, b: AllRow): number => {
      const ma = data.models[a.m];
      const mb = data.models[b.m];
      switch (sortKey) {
        case 'name':
          return str(ma.name, mb.name);
        case 'vendor':
          return str(
            vendorMap.get(ma.vendor)?.nameZh ?? ma.vendor,
            vendorMap.get(mb.vendor)?.nameZh ?? mb.vendor,
          );
        case 'region':
          return str(
            vendorMap.get(ma.vendor)?.continent ?? 'west',
            vendorMap.get(mb.vendor)?.continent ?? 'west',
          );
        case 'kind':
          return num(
            ma.kind ? (KIND_ORDER.get(ma.kind) ?? null) : null,
            mb.kind ? (KIND_ORDER.get(mb.kind) ?? null) : null,
          );
        case 'date':
          return num(a.date ? Date.parse(a.date) : null, b.date ? Date.parse(b.date) : null);
        case 'open':
          return num(ma.open == null ? null : ma.open ? 1 : 0, mb.open == null ? null : mb.open ? 1 : 0);
        case 'ctx':
          return num(a.ctx, b.ctx);
        case 'price':
          return num(a.price, b.price);
        case 'eci':
          return num(a.eci, b.eci);
        case 'code':
          return num(a.code?.fill ?? null, b.code?.fill ?? null);
        case 'n':
          return num(a.n, b.n);
      }
    };
    return kept.sort((a, b) => cmp(a, b) || byName(a, b));
  }, [data, predicate, sortKey, dir, vendorMap]);

  const shown = showAll ? rows : rows.slice(0, DEFAULT_LIMIT);

  const setFilter = (next: FilterState) => update({ ...filterToParams(next), all: null });
  const setSort = (col: Column) => {
    const nextDir: Dir = sortKey === col.key ? (dir === 'asc' ? 'desc' : 'asc') : col.defaultDir;
    const isDefault = col.key === DEFAULT_SORT.key && nextDir === DEFAULT_SORT.dir;
    update({ sort: isDefault ? null : col.key, dir: isDefault ? null : nextDir });
  };

  return (
    <div>
      <ModelFilters
        value={filter}
        onChange={setFilter}
        vendors={data.vendors}
        models={data.models}
        matched={rows.length}
      />

      <div className="mt-3 overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-line text-2xs text-fg-dim">
              {COLUMNS.map((c) => {
                const on = c.key === sortKey;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={on ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={`px-1.5 py-2 font-normal whitespace-nowrap first:pl-2 sm:px-2 sm:first:pl-3 sm:last:pr-3 ${
                      c.secondary ? 'hidden md:table-cell' : ''
                    } ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSort(c)}
                      className={`inline-flex items-center gap-1 transition-colors duration-120 hover:text-fg ${FOCUS} ${on ? 'text-fg' : ''}`}
                    >
                      {c.label}
                      <span aria-hidden className="text-2xs text-fg-dim">
                        {on ? (dir === 'asc' ? '▲' : '▼') : '·'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-6 text-center text-sm text-fg-muted">
                  {dict.board.noMatch}
                </td>
              </tr>
            )}
            {shown.map((r) => {
              const m = data.models[r.m];
              const v = vendorMap.get(m.vendor);
              return (
                <tr key={m.id} className="border-b border-line-faint transition-colors duration-120 last:border-b-0 hover:bg-raised">
                  <td className="max-w-[8rem] px-1.5 py-1.5 pl-2 sm:max-w-[14rem] sm:px-2 sm:pl-3">
                    <Link
                      href={`/model/${m.slug}/`}
                      className="flex items-center gap-1.5 text-fg hover:underline hover:underline-offset-4"
                    >
                      <VendorLogo
                        vendorId={m.vendor}
                        name={v?.nameZh ?? m.vendor}
                        brandColor={v?.accent}
                        size={20}
                      />
                      <span className="truncate" title={m.name}>
                        {m.name}
                      </span>
                      {m.retired && <span className="shrink-0 text-2xs text-fg-dim">{dict.badge.retired}</span>}
                    </Link>
                  </td>
                  <td className="hidden truncate px-2 py-1.5 md:table-cell">
                    <Link
                      href={`/vendor/${m.vendor}/`}
                      className="text-fg-muted transition-colors duration-120 hover:text-fg hover:underline hover:underline-offset-4"
                    >
                      {v?.nameZh ?? m.vendor}
                    </Link>
                  </td>
                  <td className="hidden px-2 py-1.5 whitespace-nowrap text-fg-muted md:table-cell">
                    {v?.continent === 'east' ? dict.continent.east : dict.continent.west}
                  </td>
                  <td className="hidden px-2 py-1.5 whitespace-nowrap md:table-cell">
                    {m.kind ? (
                      <span title={dict.kind.hint[m.kind]} className="text-fg-muted">
                        {dict.kind.label[m.kind]}
                      </span>
                    ) : (
                      <Cell v={null} />
                    )}
                  </td>
                  <td className="hidden px-2 py-1.5 whitespace-nowrap text-fg-muted md:table-cell">{r.dateText}</td>
                  <td className="hidden px-2 py-1.5 whitespace-nowrap md:table-cell">
                    <Cell v={m.open == null ? null : m.open ? dict.openness.open : dict.openness.closed} />
                  </td>
                  <td className="hidden px-2 py-1.5 text-right whitespace-nowrap md:table-cell">
                    <Cell v={r.ctxText} />
                  </td>
                  <td className="px-1.5 py-1.5 text-right whitespace-nowrap sm:px-2">
                    <Cell v={r.priceText} />
                  </td>
                  <td className="px-1.5 py-1.5 text-right whitespace-nowrap sm:px-2">
                    {r.eci != null ? (
                      <span className="tnum" title={`ECI ${r.eci.toFixed(1)}`}>
                        <span className="text-fg-muted">{r.eci.toFixed(1)}</span>
                        {r.eciRank != null && (
                          <span className="ml-1.5 hidden text-2xs text-fg-dim sm:inline">#{r.eciRank}</span>
                        )}
                      </span>
                    ) : (
                      <Cell v={null} />
                    )}
                  </td>
                  <td className="px-1.5 py-1.5 pr-2 text-right whitespace-nowrap sm:px-2">
                    {r.code ? (
                      <span title={r.code.title} className="text-fg-muted">
                        {r.code.verdict}
                        {r.code.self && <span className="ml-1 text-2xs text-fg-dim">{dict.badge.selfReported}</span>}
                      </span>
                    ) : (
                      <Cell v={null} />
                    )}
                  </td>
                  <td className="hidden px-2 py-1.5 pr-3 text-right whitespace-nowrap md:table-cell">
                    {r.n > 0 ? <span className="tnum text-fg-muted">{r.n}</span> : <Cell v={null} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > DEFAULT_LIMIT && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => update({ all: showAll ? null : '1' })}
            className={`min-h-8 rounded-md border border-line bg-inset px-4 text-xs text-fg-muted transition-colors duration-120 hover:text-fg ${FOCUS}`}
          >
            {showAll ? dict.board.collapse(DEFAULT_LIMIT) : dict.board.expandAll(rows.length)}
          </button>
        </div>
      )}
    </div>
  );
}

/** 空值统一写成一根短横，颜色压暗——它是「没有数据」，不是一个值 */
function Cell({ v }: { v: string | null }) {
  if (v == null) {
    return (
      <span className="text-fg-dim" title={dict.board.emptyCell}>
        —
      </span>
    );
  }
  return <span className="tnum text-fg-muted">{v}</span>;
}
