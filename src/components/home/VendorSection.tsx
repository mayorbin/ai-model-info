import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { ModelCard } from './ModelCard';
import { VendorRow } from './VendorRow';
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
    /* scroll-mt-20：页内跳转的落点要躲开 56px 的吸顶导航 */
    <section id={`region-${roster.continent}`} className="scroll-mt-20">
      <SectionHeading
        title={dict.continent[roster.continent]}
        count={dict.plaza.vendorCount(roster.entries.length)}
        accentColor={CONTINENT_ACCENT[roster.continent]}
      />

      {tiers.map(({ tier, entries }) => (
        <div key={tier} className="mt-5">
          {/*
           * 档位这一行是整页的骨架，而它凭什么这么分以前只有鼠标用户知道。
           * 现在档位名后面跟一句**常显**的压缩注解，完整的判定依据仍留在 title 里、
           * 并复制一份 sr-only 给读屏——title 挂在不聚焦的 div 上，键盘与触屏都拿不到。
           */}
          <div className="mb-3 flex items-center gap-2" title={dict.plaza.tierHint[tier]}>
            <span className="shrink-0 text-2xs font-medium text-fg-muted">
              {dict.plaza.tier[tier]}
            </span>
            <span className="shrink-0 text-2xs text-fg-dim">
              {dict.plaza.tierShort[tier]}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className="tnum shrink-0 text-2xs text-fg-dim">
              {dict.plaza.vendorCount(entries.length)}
            </span>
            <span className="sr-only">{dict.plaza.tierHint[tier]}</span>
          </div>

          {/*
           * **档位决定密度，这是这一页唯一的分层手段。**
           *
           * 「尚无评测」档换成行列表：这一档的四条能力条全是空槽（实测整页 160 条量表行
           * 有 59 条如此，其中多数落在这里），给它 209px 的卡片等于用同样的版面说「什么都没有」。
           * 换成行之后这一档短了约三分之二，而且档位边界第一次在版面上真的看得出来——
           * 这正是档位这条路牌本来要干的事，此前它只由一行 11px 的标题承担。
           */}
          {tier === 'unscored' ? (
            <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <VendorRow key={entry.vendor.id} model={entry.model} vendor={entry.vendor} />
              ))}
            </ul>
          ) : (
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
          )}
        </div>
      ))}

      {/* 「还有 N 家」是这一页唯一披露 617 个模型没有全部展示的地方，必须读得清 */}
      {roster.others.length > 0 && (
        <p className="mt-4 text-2xs text-fg-dim">
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
    /*
     * `<article>` + `<h3>` 不只是语义装饰：此前这 40 个厂商块是 div 里的一串裸 span，
     * 读屏用户听到的是一条没有地标的连续名字流，标题导航也只到 h2 就断了。
     * `data-vendor` 同时是 `check-consistency.ts` 的稳定计数锚点——
     * 那个脚本原先靠匹配一串 className 计数，改一次样式就会误报。
     */
    <article data-vendor={vendor.id} className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <VendorLogo
          vendorId={vendor.id}
          name={vendor.nameZh}
          brandColor={vendor.accentColor}
          size={24}
        />
        {/* 厂商名是**标签**不是内容：降为 12px/500 弱化色，把 13px/600 让给模型名独占 */}
        <h3 className="min-w-0 flex-1 truncate text-xs font-medium text-fg-muted">
          {vendor.nameZh}
        </h3>
      </div>

      <ModelCard model={model} vendor={vendor} apt={apt.rowOf(model)} now={now} />

      {/*
       * 门面按实力选，代价是评测滞后时新发的型号暂时看不见。这行小字补的就是这个缺口：
       * 不动选拔结果，只说出事实。
       *
       * **它现在是链接。** 此前它是 `<p>`，文案里那句「点这行可以直接去看它」被删掉了——
       * 因为当时没有可去的地方，删得对。现在型号有详情页了，于是**动作回来了**：
       * 一个「有更新的型号但你够不着」的提示，是这一页最容易让人挫败的一句话。
       */}
      {newer != null && (
        <Link
          href={`/model/${newer.slug}/`}
          className="flex min-w-0 items-center gap-1.5 text-2xs text-fg-dim transition-colors duration-120 hover:text-fg hover:underline hover:underline-offset-4"
          title={dict.plaza.newerHint(newer.name, newer.releaseDate ?? '')}
        >
          <Badge tone="pos" className="shrink-0">
            {dict.plaza.newerBadge}
          </Badge>
          <span className="min-w-0 truncate">{newer.name}</span>
          {/*
            `title` 挂在不聚焦的元素上，键盘与触屏都拿不到 → 同一句话放进 sr-only，
            照 MetricBar 的既有做法（零像素成本）。
          */}
          <span className="sr-only">
            {dict.plaza.newerHint(newer.name, newer.releaseDate ?? '')}
          </span>
        </Link>
      )}
    </article>
  );
}
