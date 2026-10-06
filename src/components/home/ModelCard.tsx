import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { MetricBar } from '@/components/ui/MetricBar';
import { Panel } from '@/components/ui/Panel';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { APTITUDES, type AptitudeRow } from '@/lib/aptitude';
import { daysSince } from '@/lib/derive';
import { formatDate } from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { hasCoreData } from '@/lib/roster';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

/** 「新发布」的判定窗口。只是徽章阈值，与 roster.ts 的选拔规则无关。 */
const FRESH_DAYS = 30;

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
 */
export function ModelCard({ model, vendor, apt, now }: ModelCardProps) {
  const badge = statusBadge(model, now);
  const date = model.releaseDate
    ? formatDate(model.releaseDate, model.releaseDatePrecision, DEFAULT_LANG)
    : null;
  const openness =
    model.openWeights == null ? null : model.openWeights ? dict.openness.open : dict.openness.closed;

  return (
    <Panel className="flex h-full flex-col gap-2.5 p-3">
      <div className="flex items-start gap-2">
        <VendorLogo
          vendorId={vendor.id}
          name={vendor.nameZh}
          brandColor={vendor.accentColor}
          size={20}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-fg">
          {model.name}
        </span>
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
  );
}

/**
 * 卡片右上角的状态徽章。**最多一个**——挂满徽章等于一个都没挂，
 * 这是原项目用实测数据确认过的（原项目里 74% 的屋子挂同一个图标，于是它传递零比特）。
 * 优先级：已退役 > 新发布 > 资料不全 > 未参评。
 */
function statusBadge(model: ModelRecord, now: Date): { tone: BadgeTone; label: string } | null {
  if (model.retiredAt) return { tone: 'neg', label: dict.badge.retired };
  const age = daysSince(model.releaseDate, now);
  if (age != null && age >= 0 && age <= FRESH_DAYS) return { tone: 'pos', label: dict.badge.fresh };
  if (!hasCoreData(model)) return { tone: 'accent', label: dict.badge.partialData };
  if (model.benchmarks.eci == null) return { tone: 'neutral', label: dict.badge.unranked };
  return null;
}
