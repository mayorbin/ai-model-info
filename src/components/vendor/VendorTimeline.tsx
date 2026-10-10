import { ModelCard } from '@/components/home/ModelCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { AptitudeScale } from '@/lib/aptitude';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { monthLabel, type MonthGroup } from '@/lib/months';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface VendorTimelineProps {
  vendor: Vendor;
  groups: MonthGroup[];
  /** 与首页卡片同一个标尺：详情层不重算分位，见 DESIGN.md「模型详情页」第 2 条 */
  apt: AptitudeScale;
  now: Date;
}

/**
 * 厂商发布时间线：这家这些年是怎么走过来的。
 *
 * 一个月一个桶，桶内直接复用首页的 `ModelCard`——同一家厂商不需要再每卡重复
 * logo 与厂商名，但四条能力条正是「同月发布的两个型号谁强」的答案，
 * 而这个问题只有在这种全量摊开的页面上才问得出来。
 */
export function VendorTimeline({ vendor, groups, apt, now }: VendorTimelineProps) {
  const total = groups.reduce((n, g) => n + g.models.length, 0);

  return (
    <section aria-labelledby="vendor-timeline-heading">
      <SectionHeading
        id="vendor-timeline-heading"
        title={dict.vendor.timelineTitle}
        count={dict.vendor.modelCount(total)}
        hint={dict.vendor.timelineNote}
      />
      <span className="sr-only">{dict.vendor.timelineNote}</span>

      <ol className="mt-4 flex flex-col gap-6">
        {groups.map((g) => (
          <li key={g.key}>
            {/*
             * 月份标题不套 SectionHeading：那一条 16px + 贯穿分隔线的规格属于
             * 「分区」这一层级，而月份是分区内的一个时间点——14px/500 + 等宽，
             * 与型号名（14px/600 无衬线）在字重与字体两轴上同时区分。
             */}
            <h3 className="flex flex-wrap items-baseline gap-2">
              <span className="tnum text-sm font-medium text-fg">
                {g.key === 'unknown' ? dict.vendor.unknownDate : monthLabel(g.key)}
              </span>
              <span className="tnum text-2xs text-fg-dim">{dict.vendor.releases(g.models.length)}</span>
            </h3>

            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.models.map((m: ModelRecord) => (
                <ModelCard key={m.id} model={m} vendor={vendor} apt={apt.rowOf(m)} now={now} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
