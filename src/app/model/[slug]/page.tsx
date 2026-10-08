import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { ModelHero } from '@/components/model/ModelHero';
import { ModelMetrics } from '@/components/model/ModelMetrics';
import { ProvenanceList } from '@/components/model/ProvenanceList';
import { ScoreTable } from '@/components/model/ScoreTable';
import { SiblingModels } from '@/components/model/SiblingModels';
import { buildAptitudeScale, type AptitudeScale } from '@/lib/aptitude';
import { rankByEci } from '@/lib/derive';
import { loadSnapshot } from '@/lib/snapshot';
import type { ModelRecord, Vendor, WorldSnapshot } from '@/lib/types';

/**
 * 模型详情页：`/model/<slug>/`，全快照 635 个模型各一页，构建期静态导出。
 *
 * 这一页存在的理由是首页的一个结构性缺陷：首页只给结论（八格冠军条、四十张门面卡、
 * 二百一十四行名次），而**每个结论都是终点**——整页只有 8 个可聚焦元素，
 * 没有一条通往「凭什么」的路。参考项目在同一个位置有 80 条 `/model/<slug>/` 直链。
 *
 * 它回答的是首页回答不了的问题：原始分数是多少、分别被谁测的、数据从哪个上游读到的、
 * 这家还有别的型号吗。
 *
 * 页面是纯静态的：没有客户端取数、没有客户端状态、没有一行 `'use client'`。
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 派生结果只算一次。
 *
 * `buildAptitudeScale` 要建 11 个分位池、`rankByEci` 要排 214 个模型，
 * 而这一页有 635 个实例。不缓存的话构建期要把同一件事做 635 遍——
 * 在一台构建机上这不是「稍微慢一点」，是几十秒变几分钟。
 *
 * 放在模块作用域而不是 `loadSnapshot()` 里：那些是**视图层的派生**，
 * 快照模块不该知道详情页要什么。
 */
interface DetailIndex {
  snapshot: WorldSnapshot;
  apt: AptitudeScale;
  ranks: Map<string, number>;
  /** 名次池的大小。与排行区的分母同源，见 check-consistency 的第四条不变式 */
  rankedTotal: number;
  bySlug: Map<string, ModelRecord>;
  vendorsById: Map<string, Vendor>;
  modelsByVendor: Map<string, ModelRecord[]>;
}

let index: DetailIndex | null = null;

function detailIndex(): DetailIndex {
  if (index != null) return index;

  const snapshot = loadSnapshot();
  const alive = snapshot.models.filter((m) => !m.retiredAt);
  const ranks = rankByEci(alive);

  const modelsByVendor = new Map<string, ModelRecord[]>();
  for (const m of snapshot.models) {
    const list = modelsByVendor.get(m.vendorId);
    if (list) list.push(m);
    else modelsByVendor.set(m.vendorId, [m]);
  }

  index = {
    snapshot,
    apt: buildAptitudeScale(snapshot.models),
    ranks,
    rankedTotal: ranks.size,
    bySlug: new Map(snapshot.models.map((m) => [m.slug, m])),
    vendorsById: new Map(snapshot.vendors.map((v) => [v.id, v])),
    modelsByVendor,
  };
  return index;
}

/** 635 条静态路由。快照里每个模型都有唯一 slug（实测 635/635）。 */
export function generateStaticParams() {
  return loadSnapshot().models.map((m) => ({ slug: m.slug }));
}

/* 构建期已经穷举了全部 slug，所以任何动态参数都是不存在的页面——
   交给 `dynamicParams = false` 给出真 404，而不是尝试渲染一个空壳。 */
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = detailIndex().bySlug.get(slug);
  if (model == null) return {};

  const vendor = detailIndex().vendorsById.get(model.vendorId);
  const eci = model.benchmarks.eci;
  /*
   * 描述里只写能从快照里查到的事实。**不写形容词**——
   * 一个以「让人看到真实状态」为使命的站点，它的 meta 描述也该守着同一条规矩。
   */
  const description =
    (vendor != null ? `${vendor.nameZh} 的 ` : '') +
    `${model.name}。` +
    (eci != null ? `综合智力指数 ${eci.toFixed(1)}。` : '没有公开的综合智力成绩。') +
    `${Object.keys(model.provenance).length} 个字段的数据出处逐条可查。`;

  return { title: model.name, description };
}

export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const d = detailIndex();
  const model = d.bySlug.get(slug);
  if (model == null) notFound();

  const vendor = d.vendorsById.get(model.vendorId);
  const siblings = d.modelsByVendor.get(model.vendorId) ?? [model];

  /*
   * 页头与页脚在 `<main>` 外面：嵌在里面的 `<header>` / `<footer>` 不产生
   * `banner` / `contentinfo` 地标。`current={null}` 让页头不认领「当前页」，
   * 同时也让站名降级成 `<span>`——**这一页的 h1 是型号名**，一个页面只能有一个 h1。
   */
  return (
    <>
      <SiteHeader current={null} />
      <main id="top" className="min-h-dvh">
        <ModelHero
          model={model}
          vendor={vendor}
          rank={d.ranks.get(model.id) ?? null}
          rankedTotal={d.rankedTotal}
          now={new Date(d.snapshot.generatedAt)}
        />

        <div className="page-shell flex flex-col gap-10 py-6">
          <ModelMetrics model={model} apt={d.apt.rowOf(model)} />
          <ScoreTable model={model} />
          <ProvenanceList model={model} />
          <SiblingModels
            models={siblings}
            currentId={model.id}
            vendorName={vendor?.nameZh ?? model.vendorId}
          />
        </div>
      </main>
      <SiteFooter snapshot={d.snapshot} />
    </>
  );
}
