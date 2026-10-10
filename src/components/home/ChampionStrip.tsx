import Link from 'next/link';
import { Panel } from '@/components/ui/Panel';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatNumber } from '@/components/ui/StatNumber';
import { VendorLogo } from '@/components/ui/VendorLogo';
import type { Champion } from '@/lib/champions';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';

const dict = getDict(DEFAULT_LANG);

/**
 * 今日格局：八个问题，八个答案，横着铺满一行。
 *
 * 首屏先给结论——读者不必扫完几十张卡片才知道谁最强。
 * 八格的口径完全来自 `champions.ts`，这里只负责排版，不改任何判定规则。
 */
export function ChampionStrip({ champions }: { champions: Champion[] }) {
  return (
    <section aria-labelledby="champions-heading">
      <SectionHeading id="champions-heading" title={dict.champions.title} />
      {/*
        最多 4 列。这条是为**溢出**加的：8 列在 1360px 的页壳里每格只有 ~153px，
        装不下 26px 的「10M tokens」（实测溢出 18px），4 列装得下。

        曾经把「同时可见的选择 ≤4」写成第二条理由，**实测不成立**：4 列×2 行
        一屏仍然看得见全部 8 张卡，工作记忆并没有因此变好。别把这个改动当成
        认知负荷的解法——要让一屏只剩 4 个主张，得真的只渲染 4 张。
      */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {champions.map((c) => {
          const vendorName = c.vendor?.nameZh ?? c.model.vendorId;
          return (
            /*
             * 八格现在是八条路。冠军条答「谁第一」，而读者紧接着要问的一定是
             * 「凭什么」——详情页答的正是这个（全部成绩 + 逐字段出处）。
             * 此前这八张卡是纯容器，点不动；现在它们是这一页最该点得动的地方。
             */
            <Link key={c.key} href={`/model/${c.model.slug}/`} className="group flex min-w-0 flex-1 flex-col">
              <Panel className="flex h-full flex-col gap-1.5 p-3 transition-colors duration-120 group-hover:border-line-strong">
                {/*
                  标签提到 12px --fg-muted。此前它是卡内最小最暗的元素（11px --fg-dim），
                  而它解释的 26px 数字最亮——阅读顺序被倒过来了：先读到「167」，
                  再找它是什么；现在标签先够得着。
                */}
                <span className="text-xs text-fg-muted">{dict.champions[c.key]}</span>
                <span
                  className="line-clamp-1 truncate text-sm font-semibold leading-snug text-fg"
                  title={c.model.name}
                >
                  {c.model.name}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <VendorLogo
                    vendorId={c.model.vendorId}
                    name={vendorName}
                    brandColor={c.vendor?.accentColor}
                    size={20}
                  />
                  <span className="truncate text-2xs text-fg-dim">{vendorName}</span>
                </span>
                <StatNumber value={c.figure} size="lg" />
                {/*
                  依据行固定 2 行高度槽位 + mt-auto，保证 8 张冠军卡片高度完全一致、数字与底边绝对水平对齐。
                */}
                <span className="mt-auto line-clamp-2 min-h-[2rem] text-pretty text-2xs leading-snug text-fg-muted">
                  {c.detail}
                </span>
              </Panel>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
