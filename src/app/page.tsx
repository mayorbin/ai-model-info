import { ChampionStrip } from '@/components/home/ChampionStrip';
import { KindStrip } from '@/components/home/KindStrip';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { StatusBar } from '@/components/home/StatusBar';
import { VendorSection } from '@/components/home/VendorSection';
import { canonicalVendorId, VENDOR_REGISTRY } from '@/data/vendor-registry';
import { buildAptitudeScale } from '@/lib/aptitude';
import { buildChampions } from '@/lib/champions';
import { buildKindGroups } from '@/lib/kind';
import { buildOverviewRoster } from '@/lib/roster';
import { loadSnapshot } from '@/lib/snapshot';
import type { ModelRecord } from '@/lib/types';

/**
 * 总览页。
 *
 * 五段的顺序是有讲究的，与原项目一致：
 * 状态行说明数据有多新 → 今日格局先给结论 → 按类型给出三个门面看不到的类目
 * → 国外 / 国内两个区域摊开全部厂商 → 页脚交代数据出处。
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
  const apt = buildAptitudeScale(snapshot.models);

  const modelsByVendor = new Map<string, ModelRecord[]>();
  for (const m of snapshot.models) {
    const list = modelsByVendor.get(m.vendorId);
    if (list) list.push(m);
    else modelsByVendor.set(m.vendorId, [m]);
  }

  return (
    <main className="min-h-dvh">
      <SiteHeader />
      <StatusBar snapshot={snapshot} />

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
      </div>

      <SiteFooter snapshot={snapshot} />
    </main>
  );
}
