import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { AllModelsTable } from '@/components/leaderboard/AllModelsTable';
import { serializeAllTable } from '@/components/leaderboard/serialize';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { loadSnapshot } from '@/lib/snapshot';

const dict = getDict(DEFAULT_LANG);

export const metadata: Metadata = { title: dict.board.allTitle };

/**
 * 全部模型总表。排行榜回答「谁最强」，这一页回答「有哪些、各是什么样」——
 * 一张可排序、可筛选的表，每一行都能点进详情页看全部原始数值与出处。
 *
 * 与排行榜共用同一套筛选（`leaderboard/filters.ts`），所以
 * `?region=east&weights=open` 在两个页面是同一个意思，链接可以带着参数互跳。
 */
export default function AllModelsPage() {
  const snapshot = loadSnapshot();
  const data = serializeAllTable(snapshot);
  const alive = snapshot.models.filter((m) => !m.retiredAt).length;

  return (
    <>
      {/* 这一页是排行榜的下钻层，导航里仍认领「排行榜」 */}
      <SiteHeader current="/leaderboard/" />
      <main id="top" className="min-h-dvh">
        <div className="page-shell pt-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-fg sm:text-2xl">{dict.board.allTitle}</h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fg-muted">
                {dict.board.allIntro(snapshot.models.length, alive)}
              </p>
            </div>
            <Link
              href="/leaderboard/"
              className="min-h-8 shrink-0 rounded-md border border-line bg-inset px-3 text-xs leading-8 text-fg-muted transition-colors duration-120 hover:text-fg"
            >
              <span aria-hidden className="mr-1">
                ←
              </span>
              {dict.board.back}
            </Link>
          </header>

          <div className="mt-5">
            <AllModelsTable data={data} />
          </div>

          <p className="mt-10 max-w-3xl text-2xs leading-relaxed text-fg-dim">{dict.board.note}</p>
        </div>
      </main>
      <SiteFooter snapshot={snapshot} />
    </>
  );
}
