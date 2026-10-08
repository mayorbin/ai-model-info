import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { BENCHMARK_CATEGORIES, benchmarkOf } from '@/data/benchmark-registry';
import { attributionLabel } from '@/data/coding-leagues';
import { formatScoreByUnit } from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { BenchmarkScore, ModelRecord } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface ScoreTableProps {
  model: ModelRecord;
}

/**
 * 全部评测成绩。首页的能力条把每一条压成一个分位档，
 * 这里把**原始分数、赛制名、测量方、出处链接**还回来。
 *
 * 三条口径不能动：
 *
 * 1. **按榜单元信息里的分类分组，不自己造类目。** 类目与排序都读
 *    `benchmark-registry.ts` 的 `BENCHMARK_CATEGORIES`——那是全站唯一一份分类定义。
 * 2. **测量方必须逐条标出来。** 一个厂商自报的 95 和一个第三方复跑的 78
 *    光看数字会得出完全相反的结论，而这是这一页唯一能把它们分开的地方。
 * 3. **原始分数只在本赛制内部有意义。** 所以同一张表里既给分数、也给单位和测量方，
 *    并且**不排序成一个大榜**——把 40 个互不兼容的赛制按分数高矮排成一列，
 *    是这张表最容易犯、也最像在骗人的那个错。
 */
export function ScoreTable({ model }: ScoreTableProps) {
  /* `scores` 是 `coding[]` 与 `benchmarks.*` 的超集；旧快照没有它，回落到编程成绩 */
  const scores: BenchmarkScore[] = model.scores ?? model.coding ?? [];

  if (scores.length === 0) {
    return (
      <section aria-labelledby="scores-heading">
        <SectionHeading id="scores-heading" title={dict.model.section.scores} />
        <p className="mt-3 text-xs text-fg-muted">{dict.model.noScores}</p>
      </section>
    );
  }

  const groups = BENCHMARK_CATEGORIES.map((category) => ({
    category,
    rows: scores
      .filter((s) => benchmarkOf(s.league).category === category)
      .sort((a, b) => {
        /* 同类里先按注册表给的关注度，再让第三方实测压过厂商自报 */
        const pa = benchmarkOf(a.league).priority;
        const pb = benchmarkOf(b.league).priority;
        if (pa !== pb) return pa - pb;
        if (a.attribution !== b.attribution) return a.attribution === 'third-party' ? -1 : 1;
        return b.score - a.score;
      }),
  })).filter((g) => g.rows.length > 0);

  return (
    <section aria-labelledby="scores-heading">
      <SectionHeading
        id="scores-heading"
        title={dict.model.section.scores}
        count={dict.model.scoreCount(scores.length)}
      />

      <div className="mt-3 flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.category}>
            <h3 className="text-xs font-medium text-fg-muted">{g.category}</h3>
            <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
              {g.rows.map((s) => {
                const info = benchmarkOf(s.league);
                const self = s.attribution !== 'third-party';
                return (
                  <li
                    key={`${s.league}:${s.attribution}`}
                    className="flex min-w-0 items-baseline gap-2 border-b border-line-faint py-1.5"
                    title={info.blurb}
                  >
                    <span className="min-w-0 flex-1 truncate text-xs text-fg">{info.label}</span>
                    {self && (
                      <Badge tone="warn" className="shrink-0">
                        {dict.badge.selfReported}
                      </Badge>
                    )}
                    <span className="tnum shrink-0 text-xs text-fg-muted">
                      {formatScoreByUnit(s.score, s.unit)}
                    </span>
                    {/*
                      出处：有原始链接就给链接（第三方复核可查证），
                      没有就写清楚是从哪个源读到的——**不伪造 URL**，
                      上游没给就是没给（见 types.ts 对 sourceUrl 的约定）。
                    */}
                    {s.sourceUrl != null ? (
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="shrink-0 text-2xs text-fg-dim underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline"
                      >
                        {s.source}
                      </a>
                    ) : (
                      <span className="shrink-0 text-2xs text-fg-dim">{s.source}</span>
                    )}
                    {/*
                      自报的那一条有可见徽章，读屏已经念到了；**第三方那条没有可见标记**，
                      所以这里只给它补一句。否则「第三方的标志是没标志」——
                      那等于把信息编码进「某个东西不存在」，是这一页最不该有的那种编码。
                    */}
                    {!self && <span className="sr-only">{attributionLabel(s.attribution)}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
