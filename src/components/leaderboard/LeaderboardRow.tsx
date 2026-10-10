'use client';

import Link from 'next/link';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ExplorerData, LeanEntry } from './types';

const dict = getDict(DEFAULT_LANG);

/**
 * 排行榜的一行：名次 · 标识 · 型号（链接）· 厂商 · 条形 · 读数。
 *
 * 从 `LeaderboardExplorer` 拆出来只是为了让它自己可读：这一行承载了
 * 位置、身份、值、出处四种信息，混在赛道切换与筛选逻辑里会淹掉主干。
 *
 * 名次 1 用榜首色 `--gold`——它是全站唯一被允许的主角色。
 */
export function LeaderboardRow({
  rank,
  entry,
  data,
  fraction,
}: {
  rank: number;
  entry: LeanEntry;
  data: ExplorerData;
  fraction: number;
}) {
  const model = data.models[entry.m];
  const vendor = data.vendors.find((v) => v.id === model.vendor);
  const url = entry.u != null ? data.urls[entry.u] : null;
  const valueText =
    url != null ? (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title={dict.model.section.provenance}
        className="underline decoration-dotted underline-offset-4 hover:text-fg"
      >
        {entry.t}
      </a>
    ) : (
      entry.t
    );

  return (
    <li className="flex items-center gap-2 border-b border-line-faint py-1.5 last:border-b-0 sm:gap-3">
      <span
        className={`tnum w-7 shrink-0 text-right text-xs ${rank === 1 ? 'text-gold' : 'text-fg-dim'}`}
        aria-label={`第 ${rank} 名`}
      >
        {rank}
      </span>
      <VendorLogo
        vendorId={model.vendor}
        name={vendor?.nameZh ?? model.vendor}
        brandColor={vendor?.accent}
        size={20}
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/model/${model.slug}/`}
          className={`block truncate text-sm leading-5 transition-colors duration-120 hover:underline hover:underline-offset-4 ${
            rank === 1 ? 'text-gold' : 'text-fg'
          }`}
        >
          {model.name}
        </Link>
        <div className="truncate text-2xs leading-4 text-fg-dim">{vendor?.nameZh ?? model.vendor}</div>
      </div>
      {/* 条形是纯几何的分位提示，数字在右侧；窄屏隐藏，读数仍然完整 */}
      <div aria-hidden className="hidden h-1.5 w-36 shrink-0 rounded-sm bg-inset md:block lg:w-44">
        <div className="h-full rounded-sm bg-accent" style={{ width: `${12 + fraction * 88}%` }} />
      </div>
      <div className="flex w-28 shrink-0 flex-col items-end sm:w-36">
        <span className="tnum text-xs leading-5 text-fg-muted">{valueText}</span>
        {entry.s === 1 && <span className="text-2xs leading-4 text-fg-dim">{dict.badge.selfReported}</span>}
      </div>
    </li>
  );
}
