import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { ModelCard } from './ModelCard';
import type { AptitudeScale } from '@/lib/aptitude';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import {
  newerThanFlagship,
  type ContinentRoster,
  type OverviewTier,
  type RosterEntry,
} from '@/lib/roster';
import type { ModelRecord } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

const TIER_ORDER: OverviewTier[] = ['top', 'main', 'unscored'];

/** 区域识别色只出现在这里和 SectionHeading 的竖条上，不做大面积填充 */
const CONTINENT_ACCENT = {
  west: 'var(--color-west)',
  east: 'var(--color-east)',
} as const;

interface VendorSectionProps {
  roster: ContinentRoster;
  /** 厂商 id → 该厂全部模型。用来自查「本家有没有更新的型号」 */
  modelsByVendor: Map<string, ModelRecord[]>;
  apt: AptitudeScale;
  now: Date;
}

/**
 * 一个区域（国外 / 国内）。
 *
 * 区内按厂商实力分三档，每个厂商一块自己的分组。**档位这条路牌必须留着**：
 * 原项目的 DESIGN.md 反复强调读者要回答两个问题——「哪里的」和「多强」。
 * 少了档位，一个毫无评测成绩的社区微调者会和 OpenAI 在视觉上平起平坐。
 */
export function VendorSection({ roster, modelsByVendor, apt, now }: VendorSectionProps) {
  const tiers = TIER_ORDER.map((tier) => ({
    tier,
    entries: roster.entries.filter((e) => e.tier === tier),
  })).filter((g) => g.entries.length > 0);

  return (
    <section id={`region-${roster.continent}`}>
      <SectionHeading
        title={dict.continent[roster.continent]}
        count={dict.plaza.vendorCount(roster.entries.length)}
        accentColor={CONTINENT_ACCENT[roster.continent]}
      />

      {tiers.map(({ tier, entries }) => (
        <div key={tier} className="mt-5">
          <div className="mb-3 flex items-center gap-2" title={dict.plaza.tierHint[tier]}>
            <span className="shrink-0 text-2xs font-medium text-fg-muted">
              {dict.plaza.tier[tier]}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="tnum shrink-0 text-2xs text-fg-dim">
              {dict.plaza.vendorCount(entries.length)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entries.map((entry) => (
              <VendorBlock
                key={entry.vendor.id}
                entry={entry}
                modelsByVendor={modelsByVendor}
                apt={apt}
                now={now}
              />
            ))}
          </div>
        </div>
      ))}

      {roster.others.length > 0 && (
        <p className="mt-4 text-2xs text-fg-faint">
          {dict.plaza.moreVendors(roster.others.length)}
        </p>
      )}
    </section>
  );
}

interface VendorBlockProps {
  entry: RosterEntry;
  modelsByVendor: Map<string, ModelRecord[]>;
  apt: AptitudeScale;
  now: Date;
}

/** 一家厂商：分组头 + 它的当家门面卡片 + 可选的「本家更新」小注。 */
function VendorBlock({ entry, modelsByVendor, apt, now }: VendorBlockProps) {
  const { vendor, model } = entry;
  const newer = newerThanFlagship(model, modelsByVendor.get(vendor.id) ?? [model]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <VendorLogo
          vendorId={vendor.id}
          name={vendor.nameZh}
          brandColor={vendor.accentColor}
          size={24}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
          {vendor.nameZh}
        </span>
      </div>

      <ModelCard model={model} vendor={vendor} apt={apt.rowOf(model)} now={now} />

      {/*
       * 门面按实力选，代价是评测滞后时新发的型号暂时看不见。这行小字补的就是这个缺口：
       * 不动选拔结果，只说出事实。整行可截断，完整信息在 title 里。
       */}
      {newer != null && (
        <p
          className="flex items-center gap-1.5 text-2xs text-fg-dim"
          title={dict.plaza.newerHint(newer.name, newer.releaseDate ?? '')}
        >
          <Badge tone="pos" className="shrink-0">
            {dict.plaza.newerBadge}
          </Badge>
          <span className="min-w-0 truncate">{newer.name}</span>
        </p>
      )}
    </div>
  );
}
