import type { Metadata } from 'next';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { ChronicleTimeline } from '@/components/chronicle/ChronicleTimeline';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { groupByMonth } from '@/lib/months';
import { loadSnapshot } from '@/lib/snapshot';

const dict = getDict(DEFAULT_LANG);

export const metadata: Metadata = { title: dict.nav.chronicle };

/**
 * 时间线。全站唯一回答「这些年到底发生了什么」的一屏。
 *
 * 数据上的一个讲究：上游的发布日期有三种精度（日/月/年），
 * 只精确到月的必须显示成「2026 年 3 月」而不是补成 1 号，
 * 否则就是在编造一个不存在的确切日期（`formatDate` 负责这件事）。
 *
 * 「发布日期不详」的桶被挡在页面之外：它们在时间轴上没有位置，
 * 硬塞进任何一个月都是编造。想知道有哪些模型没有日期，去总表按列排。
 */
export default function ChroniclePage() {
  const snapshot = loadSnapshot();
  const months = groupByMonth(snapshot.models).filter((g) => g.key !== 'unknown');
  const vendorsById = new Map(snapshot.vendors.map((v) => [v.id, v]));

  return (
    <>
      <SiteHeader current="/chronicle/" />
      <main id="top" className="min-h-dvh">
        <div className="page-shell pt-5">
          <h1 className="text-xl font-semibold text-fg sm:text-2xl">{dict.nav.chronicle}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fg-muted">
            {dict.chronicle.intro(snapshot.models.length)}
          </p>

          <div className="mt-5">
            <ChronicleTimeline months={months} vendorsById={vendorsById} />
          </div>
        </div>
      </main>
      <SiteFooter snapshot={snapshot} />
    </>
  );
}
