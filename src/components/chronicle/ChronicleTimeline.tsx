import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { monthLabel, type MonthGroup } from '@/lib/months';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface ChronicleTimelineProps {
  /** 已按月份倒序、且**不含**「发布日期不详」桶 */
  months: MonthGroup[];
  vendorsById: Map<string, Vendor>;
}

/**
 * 时间线：年份分区 → 月份行 → 该月发布的模型。
 *
 * 版面不画参考项目那条左侧竖轴与大小随数量变化的节点：那是像素风的装饰系统，
 * 而本项目的立场是「几何不承载数据」。这里把月份做成等宽的等宽字标签、
 * 年份做成 `SectionHeading`，读者靠对齐扫读，靠计数（`N 个发布`）判断密度。
 *
 * 一个个模型是**链接**：这一页的全部意义就是把「这些年发了什么」变成可点进去的清单。
 */
export function ChronicleTimeline({ months, vendorsById }: ChronicleTimelineProps) {
  // 年份分区由月份的键现推，不额外排序：months 已倒序，年份天然从新到旧
  const years = [...new Set(months.map((g) => g.key.slice(0, 4)))];

  return (
    <>
      {/*
        年份锚点：这一页在窄屏下有好几万像素，没有它就没有第二条路。
        它们是**真的链接**（锚点跳转），所以按项目的规则可以长得像控件。
      */}
      <nav aria-label={dict.chronicle.jumpLabel} className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="shrink-0 text-2xs text-fg-dim">{dict.chronicle.jump}</span>
        {years.map((y) => (
          <a
            key={y}
            href={`#y-${y}`}
            className="tnum min-h-7 rounded-md border border-line bg-inset px-2 text-xs leading-7 text-fg-muted transition-colors duration-120 hover:text-fg"
          >
            {y}
          </a>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-10">
        {years.map((year) => {
          const group = months.filter((g) => g.key.startsWith(`${year}-`));
          const total = group.reduce((n, g) => n + g.models.length, 0);
          return (
            <section key={year} id={`y-${year}`} className="scroll-mt-20">
              <SectionHeading title={dict.chronicle.yearTitle(Number(year))} count={dict.chronicle.releases(total)} />

              <ol className="mt-3">
                {group.map((g) => (
                  <li
                    key={g.key}
                    className="flex flex-col gap-1.5 border-b border-line-faint py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <h3 className="tnum w-16 shrink-0 text-xs text-fg-muted">{monthLabel(g.key)}</h3>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {g.models.map((m) => (
                        <MonthModel key={m.id} model={m} vendor={vendorsById.get(m.vendorId)} />
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </>
  );
}

/**
 * 一枚模型链接。有第三方综合成绩的用主文字色、没有的压一档——
 * 「有成绩」是这一页唯一的筛选信号，靠颜色区分而不是靠徽章，
 * 所以颜色之外还必须在 `title` 里写明事实（不把信息只编码进颜色）。
 */
function MonthModel({ model, vendor }: { model: ModelRecord; vendor: Vendor | undefined }) {
  const scored = model.benchmarks.eci != null;
  const vendorName = vendor?.nameZh ?? model.vendorId;
  const title = [
    vendorName,
    model.releaseDate ?? dict.unknown.noData,
    model.releaseDatePrecision === 'month' || model.releaseDatePrecision === 'year'
      ? dict.chronicle.monthOnly
      : null,
    scored ? null : dict.badge.unranked,
    model.retiredAt != null ? dict.chronicle.retired : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="min-w-0">
      <Link
        href={`/model/${model.slug}/`}
        title={title}
        className="flex min-w-0 items-center gap-1.5 text-xs transition-colors duration-120 hover:underline hover:underline-offset-4"
      >
        <VendorLogo vendorId={model.vendorId} name={vendorName} brandColor={vendor?.accentColor} size={20} />
        <span className={`truncate ${scored ? 'text-fg' : 'text-fg-dim'}`}>{model.name}</span>
      </Link>
      <span className="sr-only">{title}</span>
    </li>
  );
}
