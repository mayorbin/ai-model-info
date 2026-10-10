import Link from 'next/link';
import { CompareGrid, RowLabel } from './CompareGrid';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { isContested, type H2HRow } from './insights';
import type { CmpModel } from './types';

const dict = getDict(DEFAULT_LANG);

/**
 * 评测跑分：按榜单分池，一行一个池，每列一个模型。
 *
 * 胜负只在**同一个池**里判（同榜单 + 同测量方），所以自报与第三方实测分成两行，
 * 各自「未参赛」——这与排行榜的分池规则是同一条。
 *
 * 「共同参加 / 全部」的切换默认自动：共同项够多（≥3）就只看共同项，
 * 否则全列出来。新发布的模型往往一个共同项都没有，那时全列才有信息量。
 */

const MIN_CONTESTED = 3;

export function CompareBench({
  rows,
  picked,
  accents,
  scope,
  setScope,
}: {
  rows: H2HRow[];
  picked: CmpModel[];
  accents: string[];
  scope: 'auto' | 'common' | 'all';
  setScope: (s: 'common' | 'all') => void;
}) {
  const n = picked.length;
  const common = rows.filter(isContested);
  const effective = scope === 'auto' ? (common.length >= MIN_CONTESTED ? 'common' : 'all') : scope;
  const shown = n >= 2 && effective === 'common' ? common : rows;

  const byCategory = new Map<string, H2HRow[]>();
  for (const r of shown) {
    const list = byCategory.get(r.bench.category) ?? [];
    list.push(r);
    byCategory.set(r.bench.category, list);
  }

  const aside =
    n >= 2 && common.length > 0 && common.length < rows.length ? (
      <div className="flex gap-1.5" role="group" aria-label={dict.cmp.scopeGroup}>
        {(
          [
            ['common', dict.cmp.scopeCommon(common.length)],
            ['all', dict.cmp.scopeAll(rows.length)],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={effective === key}
            onClick={() => setScope(key)}
            className={`min-h-7 rounded-md border px-2 text-xs transition-colors duration-120 ${
              effective === key ? 'border-line-strong bg-raised text-fg' : 'border-line text-fg-muted hover:text-fg'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <>
      <SectionHeading title={dict.cmp.section.scores} aside={aside} />

      {rows.length === 0 && <p className="py-4 text-xs leading-relaxed text-fg-muted">{dict.cmp.noScores}</p>}

      {[...byCategory.entries()].map(([category, list]) => (
        <div key={category}>
          <div className="mt-3 text-xs font-medium text-gold">{category}</div>
          {list.map((row) => (
            <CompareGrid key={row.bench.key} n={n} className="border-b border-line-faint">
              <RowLabel title={row.bench.blurb}>
                {/* 池够 5 人、在排行榜开过榜的，标签直接链到那条赛道 */}
                {row.bench.track ? (
                  <Link
                    href={`/leaderboard/?track=${encodeURIComponent(row.bench.track)}`}
                    className="text-fg-muted transition-colors duration-120 hover:text-fg"
                  >
                    {row.bench.label}
                  </Link>
                ) : (
                  <span className="text-fg-muted">{row.bench.label}</span>
                )}
                {!row.bench.higherIsBetter && <span className="ml-1 text-2xs">{dict.cmp.lowerIsBetter}</span>}
                {row.bench.superseded && <span className="ml-1 text-2xs">{dict.cmp.superseded}</span>}
              </RowLabel>
              {row.cells.map((c, i) => {
                const win = row.winners.includes(i);
                return (
                  <div key={picked[i].slug} className="flex items-center gap-2 py-1.5 sm:py-2">
                    {c ? (
                      <>
                        <span
                          className={`tnum w-[4.5rem] shrink-0 text-xs sm:w-24 ${
                            win ? 'font-medium text-gold' : 'text-fg-muted'
                          }`}
                        >
                          {c.text}
                          {row.bench.selfReported && (
                            <span className="ml-1 text-2xs text-fg-dim">{dict.badge.selfReported}</span>
                          )}
                        </span>
                        <div aria-hidden className="h-1.5 min-w-0 flex-1 rounded-sm bg-inset">
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: `${Math.max(2, c.frac * 100)}%`,
                              background: accents[i],
                              // 没赢的条压暗：胜负是这一屏的主信息，颜色不能抢它
                              opacity: win || row.present < 2 ? 1 : 0.45,
                            }}
                          />
                        </div>
                        {/* 榜上不足 3 个模型时「#1/1」没有信息量，官方自报的新榜常常只有它自己 */}
                        <span
                          className="tnum hidden w-14 shrink-0 text-right text-2xs text-fg-dim sm:inline"
                          title={`${dict.cmp.rankOf(row.bench.n)} ${c.rank}`}
                        >
                          {row.bench.n >= 3 ? `#${c.rank}/${row.bench.n}` : ''}
                        </span>
                      </>
                    ) : (
                      // 自报的榜是厂商自己挑着公布的，另一方没有数字是「没公布」，不是「没参加」
                      <span className="text-xs text-fg-dim">
                        {row.bench.selfReported ? dict.cmp.notPublished : dict.cmp.notEntered}
                      </span>
                    )}
                  </div>
                );
              })}
            </CompareGrid>
          ))}
        </div>
      ))}
    </>
  );
}
