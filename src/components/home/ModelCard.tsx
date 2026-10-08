import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { MetricBar } from '@/components/ui/MetricBar';
import { Panel } from '@/components/ui/Panel';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { statusBadge } from '@/components/ui/statusBadge';
import { APTITUDES, type AptitudeRow } from '@/lib/aptitude';
import { formatDate } from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface ModelCardProps {
  model: ModelRecord;
  vendor: Vendor;
  apt: AptitudeRow;
  now: Date;
}

/**
 * 模型卡片。取代原项目的「小屋 + 像素小人」。
 *
 * 分工与原项目一致、也是它用三次失败换来的结论：**图形只回答「这是谁」，
 * 比较交给四条能力条**。这里把「谁」压缩成一个厂商 logo，把省下的空间
 * 全部让给数据——同样的宽度能多排一倍卡片。
 *
 * **整张卡是一张通往详情页的链接。** 此前它是纯容器、没有悬停——
 * 那是对的，因为当时没有可去的地方；现在详情页存在了，悬停态就从「误导」变回
 * 「控件的特权」。这也是这一页从「终点」变回「入口」的那一处。
 */
export function ModelCard({ model, vendor, apt, now }: ModelCardProps) {
  const badge = statusBadge(model, now);
  const date = model.releaseDate
    ? formatDate(model.releaseDate, model.releaseDatePrecision, DEFAULT_LANG)
    : null;
  const openness =
    model.openWeights == null ? null : model.openWeights ? dict.openness.open : dict.openness.closed;

  return (
    /*
     * 整块都是命中区——卡内没有第二个链接，所以不冲突。
     * **刻意不给 aria-label**：它会把卡内全部内容从无障碍树里顶掉，
     * 而这张卡的信息量恰恰在那四条能力条里。读屏念出来是长了一点，
     * 但「长而完整」好过「短而把数据藏起来」。
     */
    <Link href={`/model/${model.slug}/`} className="group flex min-w-0 flex-1 flex-col">
      <Panel className="flex h-full flex-col gap-2.5 p-3 transition-colors duration-120 group-hover:border-line-strong">
        <div className="flex items-start gap-2">
          <VendorLogo
            vendorId={vendor.id}
            name={vendor.nameZh}
            brandColor={vendor.accentColor}
            size={20}
            className="mt-0.5"
          />
          {/*
            模型名是 h4 而不是 span：厂商块已经是 h3（厂商名），
            而读者跳读标题时找的是**型号**。此前它是裸 span，
            读屏的标题导航只能跳到「Anthropic」，跳不到「Claude Opus 5.5」。
          */}
          <h4 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-fg">
            {model.name}
          </h4>
          {badge != null && <Badge tone={badge.tone}>{badge.label}</Badge>}
        </div>

        <div className="flex flex-col gap-1.5">
          {APTITUDES.map((meta) => {
            const v = apt.values[meta.id];
            return (
              <MetricBar
                key={meta.id}
                label={v.labelOverride ?? meta.label}
                fill={v.fill}
                /*
                 * 自报成绩必须显式标出来：一个厂商自报的 95 和一个第三方实测的 78，
                 * 光看数字会得出完全相反的结论。
                 */
                literal={
                  v.selfReported && v.literal != null
                    ? `${v.literal} ${dict.badge.selfReported}`
                    : v.literal
                }
                title={v.title}
              />
            );
          })}
        </div>

        {/* 底部一行事实。不是营销文案，每一项都能从快照里查到 */}
        <div className="flex items-center gap-1.5 text-2xs text-fg-dim">
          <span className="min-w-0 truncate">{vendor.nameZh}</span>
          {date != null && (
            <>
              <span aria-hidden className="shrink-0 text-line-strong">
                ·
              </span>
              <span className="tnum shrink-0">{date}</span>
            </>
          )}
          {openness != null && (
            <>
              <span aria-hidden className="shrink-0 text-line-strong">
                ·
              </span>
              <span className="shrink-0">{openness}</span>
            </>
          )}
        </div>
      </Panel>
    </Link>
  );
}
