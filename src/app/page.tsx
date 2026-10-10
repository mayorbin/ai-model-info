import { ChampionStrip } from '@/components/home/ChampionStrip';
import { KindStrip } from '@/components/home/KindStrip';
import { RankingList } from '@/components/home/RankingList';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { StatusBar } from '@/components/home/StatusBar';
import { VendorSection } from '@/components/home/VendorSection';
import { BackToTop } from '@/components/ui/BackToTop';
import { canonicalVendorId, VENDOR_REGISTRY } from '@/data/vendor-registry';
import { buildAptitudeScale } from '@/lib/aptitude';
import { buildChampions } from '@/lib/champions';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { buildKindGroups } from '@/lib/kind';
import { buildLeaderboard } from '@/lib/leaderboard';
import { buildOverviewRoster } from '@/lib/roster';
import { loadSnapshot } from '@/lib/snapshot';
import type { ModelRecord } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

/** 页内跳转的目标。id 分别挂在 SectionHeading 的 h2 与 VendorSection / RankingList 的 section 上 */
const SECTIONS = [
  { id: 'champions-heading', label: dict.champions.title },
  { id: 'kinds-heading', label: dict.kind.sectionTitle },
  { id: 'region-west', label: dict.continent.west },
  { id: 'region-east', label: dict.continent.east },
  { id: 'leaderboard', label: dict.leaderboard.title },
];

/**
 * 总览页。
 *
 * 五段的顺序是有讲究的，与原项目一致：
 * 状态行说明数据有多新 → 今日格局先给结论 → 按类型给出三个门面看不到的类目
 * → 国外 / 国内两个区域摊开全部厂商 → 综合智力排行给出可上下扫的完整次序
 * → 页脚交代数据出处。
 *
 * 页面是静态导出的：`loadSnapshot()` 在构建期把 2.9 MB 的快照解析进 HTML，
 * 没有服务端运行时，也没有客户端取数。
 */
export default function Page() {
  const snapshot = loadSnapshot();
  const now = new Date(snapshot.generatedAt);

  /* 注册表兼作「这是不是一家真的模型厂商」的判据，见 roster.ts 的 isFeatured */
  const registryHas = (id: string) => canonicalVendorId(id) in VENDOR_REGISTRY;

  const rosters = buildOverviewRoster(snapshot.models, snapshot.vendors, now, registryHas);
  const champions = buildChampions(snapshot.models, snapshot.vendors, now, registryHas);
  const kinds = buildKindGroups(snapshot.models, now, registryHas);
  const board = buildLeaderboard(snapshot.models, snapshot.vendors);
  const apt = buildAptitudeScale(snapshot.models);

  const modelsByVendor = new Map<string, ModelRecord[]>();
  for (const m of snapshot.models) {
    const list = modelsByVendor.get(m.vendorId);
    if (list) list.push(m);
    else modelsByVendor.set(m.vendorId, [m]);
  }

  /*
   * 页头与页脚在 `<main>` **外面**。
   *
   * 嵌在 `<main>` 里的 `<header>` / `<footer>` 不再产生 `banner` / `contentinfo`
   * 这两个地标——读屏用户因此失去「跳到页脚」这类快速跳转。此前两页都嵌着。
   */
  return (
    <>
      <SiteHeader />
      <main id="top" className="min-h-dvh">
        <StatusBar snapshot={snapshot} />

        {/*
          页内跳转。390px 下这一页有一万多像素，而整页此前只有 1 个可聚焦元素——
          读者往下走只能靠滚。这四个是真链接（分区 id 早就存在，只是没人指向它们），
          所以它们长成控件的形状是理所应当的，与类型 chip 那种伪控件不是一回事。
        */}
        <nav
          aria-label={dict.sectionNav.ariaLabel}
          className="page-shell flex flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-xs"
        >
          <span className="text-fg-dim">{dict.sectionNav.label}</span>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              /* py-1 把命中区从 19px 抬到 27px，过 WCAG 2.5.8 的 24×24 */
              className="py-1 text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="page-shell flex flex-col gap-10 py-6">
          <ChampionStrip champions={champions} />
          <KindStrip groups={kinds} />

          {rosters.map((roster) => (
            <VendorSection
              key={roster.continent}
              roster={roster}
              modelsByVendor={modelsByVendor}
              apt={apt}
              now={now}
            />
          ))}

          <RankingList board={board} />
        </div>
        <BackToTop />
      </main>
      <SiteFooter snapshot={snapshot} />
    </>
  );
}
