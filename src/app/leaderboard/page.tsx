import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { LeaderboardExplorer } from '@/components/leaderboard/LeaderboardExplorer';
import { serializeExplorer } from '@/components/leaderboard/serialize';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { loadSnapshot } from '@/lib/snapshot';
import { buildTrackIndex } from '@/lib/scores';

const dict = getDict(DEFAULT_LANG);

export const metadata: Metadata = { title: dict.board.title };

/**
 * 排行榜。
 *
 * 快照里每个够 5 个模型的榜单都是一条赛道，外加性价比、上下文、价格等派生赛道。
 * 赛道在构建期由 `buildTrackIndex` 算好、排好、格式化好，客户端只负责切换与筛选
 * （`LeaderboardExplorer` 是本站仅有的两处 `'use client'` 之一，另一处是总表）。
 *
 * 没上榜的模型就是「未参赛」，不给假分数：一个模型没被某项评测收录，
 * 不代表它做不到，用估算值填空会让整张榜失去意义。
 *
 * 页头页脚在 `<main>` 外面，保住 banner / contentinfo 地标（与首页、详情页同一约定）。
 */
export default function LeaderboardPage() {
  const snapshot = loadSnapshot();
  const tracks = buildTrackIndex(snapshot);
  const data = serializeExplorer(snapshot, tracks);
  const benchmarkTracks = tracks.filter((t) => t.category !== '实用指标' && !t.superseded).length;

  return (
    <>
      <SiteHeader current="/leaderboard/" />
      <main id="top" className="min-h-dvh">
        <div className="page-shell pt-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-fg sm:text-2xl">{dict.board.title}</h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fg-muted">
                {dict.board.intro(benchmarkTracks, snapshot.models.length)}
              </p>
            </div>
            <Link
              href="/leaderboard/all/"
              className="min-h-8 shrink-0 rounded-md border border-line bg-inset px-3 text-xs leading-8 text-fg-muted transition-colors duration-120 hover:text-fg"
            >
              {dict.board.allLink(snapshot.models.length)}
            </Link>
          </header>

          <div className="mt-5">
            <LeaderboardExplorer data={data} />
          </div>

          <p className="mt-10 max-w-3xl text-2xs leading-relaxed text-fg-dim">{dict.board.note}</p>
        </div>
      </main>
      <SiteFooter snapshot={snapshot} />
    </>
  );
}
