import Link from 'next/link';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { countKinds, KINDS } from '@/lib/kind';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface VendorHeroProps {
  vendor: Vendor;
  /** 该厂全部型号，含已退役——厂商页是历史页，退役型号也要出现在时间线上 */
  family: ModelRecord[];
}

/**
 * 厂商详情页头部：这是谁、一共多少型号、有没有能看图的。
 *
 * 排版完全沿用 `ModelHero` 的骨架（logo + 小字归属行 + h1），
 * 让「厂商页」和「型号页」读起来是同一个站的两级 Drill-down，
 * 而不是两种页面。h1 是厂商中文名，站名照例降级成 span。
 */
export function VendorHero({ vendor, family }: VendorHeroProps) {
  const retired = family.filter((m) => m.retiredAt != null).length;
  const alive = family.filter((m) => !m.retiredAt);
  const counts = countKinds(alive);
  const kinds = KINDS.filter((k) => counts[k] > 0);

  return (
    <header className="page-shell pt-5">
      <Link
        href="/"
        className="inline-flex min-h-6 items-center text-xs text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline"
      >
        {/* 「←」是纯装饰的方位提示，读屏念它只会多一个噪音 */}
        <span aria-hidden className="mr-1">
          ←
        </span>
        {dict.vendor.back}
      </Link>

      <div className="mt-3 flex items-start gap-3">
        <VendorLogo
          vendorId={vendor.id}
          name={vendor.nameZh}
          brandColor={vendor.accentColor}
          size={32}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          {/* 归属行与 ModelHero 同款式：国内/国外是标签，用 dim；厂商名自己是内容 */}
          <span className="block text-xs text-fg-dim">{dict.continent[vendor.continent]}</span>
          <h1 className="text-pretty text-xl font-semibold leading-snug text-fg">{vendor.nameZh}</h1>
        </div>
        {vendor.homepage != null && (
          <a
            href={vendor.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 shrink-0 text-xs text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline"
          >
            {dict.vendor.homepage}
            <span aria-hidden className="ml-0.5">
              ↗
            </span>
          </a>
        )}
      </div>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-fg-muted">
        <span className="tnum">{dict.vendor.modelCount(family.length)}</span>
        {retired > 0 && <span className="tnum text-fg-dim">{dict.vendor.retiredCount(retired)}</span>}
      </p>

      {/*
       * 类型构成是纯文字摘要，不是筛选条：总表路由还没有落地时，
       * 给它 chip 的外形等于承诺一个不存在的动作（DESIGN.md 拒绝清单：
       * 先有功能，再给它形状）。每类的判定依据挂 title + sr-only。
       */}
      {kinds.length > 0 && (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xs text-fg-dim">
          <span className="shrink-0">{dict.vendor.kindSummaryLabel}</span>
          {kinds.map((k) => (
            <span key={k} className="shrink-0">
              <span title={dict.kind.hint[k]}>
                {dict.kind.label[k]}
                <span className="tnum ml-0.5">{counts[k]}</span>
              </span>
              <span className="sr-only">：{dict.kind.hint[k]}</span>
            </span>
          ))}
        </p>
      )}
    </header>
  );
}
