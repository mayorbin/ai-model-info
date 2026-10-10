'use client';

import { useMemo } from 'react';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { EMPTY_FILTER, filterFromParams, filterToParams, makePredicate, type FilterState } from './filters';
import { LeaderboardRow } from './LeaderboardRow';
import { ModelFilters } from './ModelFilters';
import type { ExplorerData, LeanTrack } from './types';
import { FOCUS } from './ui';
import { useUrlQuery } from './useUrlQuery';

const dict = getDict(DEFAULT_LANG);

/**
 * 排行榜的交互层。
 *
 * 服务端已经把每条赛道算好、排好、格式化好，这里只做三件事：切赛道、筛人、展开。
 * 所有状态都在 URL 的 query 里，刷新与分享都不丢。
 *
 * 一条赛道内条形的长短按**当前显示的名单**的最小值到最大值归一：只看国内模型时，
 * 国内第一名的条就是满的，而不是被国外榜首压成一小截。
 */

const DEFAULT_LIMIT = 30;

function barFraction(track: LeanTrack, values: number[], v: number): number {
  const xf = track.scale === 'log' ? (x: number) => Math.log10(Math.max(x, 1e-9)) : (x: number) => x;
  const xs = values.map(xf);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  if (max === min) return 1;
  const x = xf(v);
  return track.higherIsBetter ? (x - min) / (max - min) : (max - x) / (max - min);
}

export function LeaderboardExplorer({ data }: { data: ExplorerData }) {
  const [params, update] = useUrlQuery();

  const filter = useMemo(() => (params ? filterFromParams(params) : EMPTY_FILTER), [params]);
  const showLegacy = params?.get('legacy') === '1';
  const showAll = params?.get('all') === '1';

  const vendorMap = useMemo(() => new Map(data.vendors.map((v) => [v.id, v])), [data.vendors]);

  const visibleTracks = useMemo(
    () => data.tracks.filter((t) => showLegacy || !t.superseded),
    [data.tracks, showLegacy],
  );
  const hasLegacy = data.tracks.some((t) => t.superseded);

  const requested = params?.get('track') ?? data.defaultTrack;
  const track =
    data.tracks.find((t) => t.id === requested) ??
    data.tracks.find((t) => t.id === data.defaultTrack) ??
    data.tracks[0];

  const grouped = useMemo(() => {
    const map = new Map<string, LeanTrack[]>();
    for (const t of visibleTracks) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return data.categories.filter((c) => map.has(c)).map((c) => ({ category: c, tracks: map.get(c)! }));
  }, [visibleTracks, data.categories]);

  const predicate = useMemo(() => makePredicate(filter, vendorMap), [filter, vendorMap]);
  const eligible = useMemo(() => data.models.filter(predicate).length, [data.models, predicate]);

  const entries = useMemo(
    () => (track ? track.entries.filter((e) => predicate(data.models[e.m])) : []),
    [track, predicate, data.models],
  );
  const shown = useMemo(() => (showAll ? entries : entries.slice(0, DEFAULT_LIMIT)), [entries, showAll]);
  // 条形按**当前显示的这一截**归一。ECI 前 30 名只差几分，若按全榜归一，
  // 三十根条会长得一模一样，条形图就白画了。
  const values = useMemo(() => shown.map((e) => e.v), [shown]);

  const setFilter = (next: FilterState) => update({ ...filterToParams(next), all: null });
  const setTrack = (id: string) => update({ track: id === data.defaultTrack ? null : id, all: null });

  if (!track) {
    return (
      <p className="rounded-md border border-line bg-panel px-3 py-4 text-sm text-fg-muted">
        {dict.board.noTracks}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      {/* 赛道切换：桌面端左侧竖排，移动端折成下拉 */}
      <nav
        aria-label={dict.board.trackNav}
        className="lg:sticky lg:top-16 lg:max-h-[calc(100dvh-5rem)] lg:w-52 lg:shrink-0 lg:overflow-y-auto lg:pr-1"
      >
        <div className="lg:hidden">
          <select
            value={track.id}
            onChange={(e) => setTrack(e.target.value)}
            aria-label={dict.board.trackSelect}
            className={`min-h-8 w-full rounded-md border border-line bg-inset px-2 text-xs text-fg ${FOCUS}`}
          >
            {grouped.map((g) => (
              <optgroup key={g.category} label={g.category}>
                {g.tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}（{t.entries.length}）
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="hidden flex-col gap-3 lg:flex">
          {grouped.map((g) => (
            <div key={g.category}>
              <div className="mb-1 pl-1 text-2xs text-fg-dim">{g.category}</div>
              <ul className="flex flex-col gap-1">
                {g.tracks.map((t) => {
                  const on = t.id === track.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTrack(t.id)}
                        className={`flex min-h-7 w-full items-center justify-between gap-2 rounded-md border px-2 py-0.5 text-left text-xs leading-5 transition-colors duration-120 ${FOCUS} ${
                          on
                            ? 'border-line-strong bg-raised text-fg'
                            : 'border-transparent text-fg-muted hover:text-fg'
                        }`}
                      >
                        <span className="truncate">{t.label}</span>
                        <span className="tnum shrink-0 text-2xs text-fg-dim">{t.entries.length}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {hasLegacy && (
            <label className="mt-1 flex cursor-pointer items-center gap-1.5 pl-1 text-2xs text-fg-dim">
              <input
                type="checkbox"
                checked={showLegacy}
                onChange={(e) => update({ legacy: e.target.checked ? '1' : null })}
                className="accent-[var(--color-accent)]"
              />
              {dict.board.legacy}
            </label>
          )}
        </div>
      </nav>

      <section className="min-w-0 flex-1">
        <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-lg font-semibold text-fg">
            {track.label}
            {track.selfReported && <span className="ml-2 text-xs font-normal text-fg-dim">{dict.badge.selfReported}</span>}
          </h2>
          <span className="tnum text-2xs text-fg-dim">
            {dict.board.onBoard(entries.length)} · {dict.board.offBoard(Math.max(0, eligible - entries.length))}
          </span>
        </header>
        <p className="mb-3 text-xs leading-relaxed text-fg-muted">
          {track.note}
          {track.homepage != null && (
            <>
              {' '}
              <a
                href={track.homepage}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-4 hover:text-fg"
              >
                {dict.board.homepage}
                <span aria-hidden className="ml-0.5">
                  ↗
                </span>
              </a>
            </>
          )}
        </p>

        <ModelFilters
          value={filter}
          onChange={setFilter}
          vendors={data.vendors}
          models={data.models}
          matched={eligible}
        />

        <ol className="mt-3 rounded-md border border-line bg-panel px-3 py-1 sm:px-4">
          {shown.length === 0 && (
            <li className="py-6 text-center text-sm text-fg-muted">{dict.board.emptyTrack}</li>
          )}
          {shown.map((e, i) => (
            <LeaderboardRow key={e.m} rank={i + 1} entry={e} data={data} fraction={barFraction(track, values, e.v)} />
          ))}
        </ol>

        {entries.length > DEFAULT_LIMIT && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => update({ all: showAll ? null : '1' })}
              className={`min-h-8 rounded-md border border-line bg-inset px-4 text-xs text-fg-muted transition-colors duration-120 hover:text-fg ${FOCUS}`}
            >
              {showAll ? dict.board.collapse(DEFAULT_LIMIT) : dict.board.expandAll(entries.length)}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
