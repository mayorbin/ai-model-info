import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { StatNumber } from '@/components/ui/StatNumber';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { statusBadge } from '@/components/ui/statusBadge';
import { formatDate } from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface ModelHeroProps {
  model: ModelRecord;
  vendor: Vendor | undefined;
  /** 全局名次。已退役的模型没有名次（名次表只建在在役模型上），此处为 null */
  rank: number | null;
  /** 名次池的大小，也就是「N 个有第三方综合成绩的模型」里的那个 N */
  rankedTotal: number;
  now: Date;
}

/**
 * 详情页头部：这是谁、它多强、这份数据算不算数。
 *
 * **三个 data 属性是给 `check-consistency.ts` 读的语义锚点**，不是样式钩子。
 * 详情页是 635 个静态页面，肉眼抽查没有意义；脚本按属性名读，
 * 于是「页面上写着的 ECI 与名次」和 `rankByEci` 之间只要有偏差就会被抓住。
 * 用属性而不是 className，理由见那个脚本里踩过的坑：样式会变，语义锚点不会。
 */
export function ModelHero({ model, vendor, rank, rankedTotal, now }: ModelHeroProps) {
  const badge = statusBadge(model, now);
  const eci = model.benchmarks.eci;
  const vendorName = vendor?.nameZh ?? model.vendorId;
  const released = model.releaseDate
    ? formatDate(model.releaseDate, model.releaseDatePrecision, DEFAULT_LANG)
    : null;

  return (
    <header
      data-model={model.id}
      data-eci={eci == null ? undefined : eci.toFixed(1)}
      data-rank={rank ?? undefined}
      className="page-shell pt-5"
    >
      <Link
        href="/"
        className="inline-flex min-h-6 items-center text-xs text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline"
      >
        {/* 「←」是纯装饰的方位提示，读屏念它只会多一个噪音 */}
        <span aria-hidden className="mr-1">
          ←
        </span>
        {dict.model.back}
      </Link>

      <div className="mt-3 flex items-start gap-3">
        <VendorLogo
          vendorId={model.vendorId}
          name={vendorName}
          brandColor={vendor?.accentColor}
          size={32}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          {/*
            厂商名是通往厂商详情页的入口：这一页回答了「它多强」，
            但「这家还有别的吗 / 这家这些年怎么走过来的」在厂商页上。
            它保持 12px `--fg-dim` 的标签体量——链接的身份由悬停态表达，不由字号表达。
          */}
          <Link
            href={`/vendor/${model.vendorId}/`}
            className="block w-fit max-w-full truncate text-xs text-fg-dim underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline"
          >
            {vendorName}
          </Link>
          {/*
            详情页的 h1 是 20px：高于分区的 16px h2，又低于下面那个 26px 的读数——
            这一页的主角是读数，标题只负责说明这是谁的读数。
          */}
          <h1 className="text-pretty text-xl font-semibold leading-snug text-fg">{model.name}</h1>
        </div>
        {badge != null && (
          <Badge tone={badge.tone} className="mt-4">
            {badge.label}
          </Badge>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {eci == null ? (
          <p className="text-sm text-fg-muted">{dict.model.unranked}</p>
        ) : (
          <>
            <StatNumber value={eci.toFixed(1)} unit="ECI" size="xl" />
            <span className="text-xs text-fg-muted">
              {rank == null ? dict.model.retired : dict.model.rank(rank, rankedTotal)}
            </span>
          </>
        )}
      </div>

      {released != null && (
        <p className="mt-2 text-2xs text-fg-dim">
          {dict.attr.releaseDate}
          <span className="tnum ml-1 text-fg-muted">{released}</span>
        </p>
      )}
    </header>
  );
}
