import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { VendorHero } from '@/components/vendor/VendorHero';
import { VendorProvenance } from '@/components/vendor/VendorProvenance';
import { VendorTimeline } from '@/components/vendor/VendorTimeline';
import { buildAptitudeScale, type AptitudeScale } from '@/lib/aptitude';
import { groupByMonth } from '@/lib/months';
import { loadSnapshot } from '@/lib/snapshot';
import type { ModelRecord, Vendor, WorldSnapshot } from '@/lib/types';

/**
 * 厂商详情页：`/vendor/<id>/`，快照里 65 家厂商各一页，构建期静态导出。
 *
 * 它回答的是首页回答不了的问题：一家厂商的全部型号、按发布月份排成的
 * 完整时间线、以及这家的数字主要从哪些上游读来。首页每家只露一个门面
 * （roster 的选拔结果），65 家里读者在首页最多看到 40 个——这一页是
 * 「还有谁、还有什么」那条路的尽头。
 *
 * 与型号详情页同构：纯静态、无客户端取数、无 `'use client'`，
 * 头尾在 `<main>` 外面以保住 banner / contentinfo 地标。
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 派生结果只算一次（与型号详情页同一套手法）。
 *
 * `buildAptitudeScale` 要建 11 个分位池，而这一页有 65 个实例；
 * 放在模块作用域缓存，构建期同一件事只做一遍。
 */
interface VendorIndex {
  snapshot: WorldSnapshot;
  apt: AptitudeScale;
  vendorsById: Map<string, Vendor>;
  familyByVendor: Map<string, ModelRecord[]>;
}

let index: VendorIndex | null = null;

function vendorIndex(): VendorIndex {
  if (index != null) return index;

  const snapshot = loadSnapshot();
  const familyByVendor = new Map<string, ModelRecord[]>();
  for (const m of snapshot.models) {
    const list = familyByVendor.get(m.vendorId);
    if (list) list.push(m);
    else familyByVendor.set(m.vendorId, [m]);
  }

  index = {
    snapshot,
    apt: buildAptitudeScale(snapshot.models),
    vendorsById: new Map(snapshot.vendors.map((v) => [v.id, v])),
    familyByVendor,
  };
  return index;
}

/** 65 条静态路由。构建期穷举了全部 id，动态参数一律是真 404。 */
export function generateStaticParams() {
  return vendorIndex().snapshot.vendors.map((v) => ({ slug: v.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const d = vendorIndex();
  const vendor = d.vendorsById.get(slug);
  if (vendor == null) return {};

  const family = d.familyByVendor.get(vendor.id) ?? [];
  const retired = family.filter((m) => m.retiredAt != null).length;
  /* 描述只写查得到的事实，不写形容词——与型号详情页同一条规矩 */
  const description =
    `${vendor.nameZh}（${vendor.continent === 'east' ? '国内' : '国外'}）。` +
    `共 ${family.length} 个型号` +
    (retired > 0 ? `，其中 ${retired} 个已退役` : '') +
    `，逐字段数据出处可查。`;

  return { title: `${vendor.nameZh} · 厂商`, description };
}

export default async function VendorPage({ params }: PageProps) {
  const { slug } = await params;
  const d = vendorIndex();
  const vendor = d.vendorsById.get(slug);
  if (vendor == null) notFound();

  const family = d.familyByVendor.get(vendor.id) ?? [];
  const groups = groupByMonth(family);

  /* 站名降级成 span：这一页的 h1 是厂商名（SiteHeader 的 current 规则） */
  return (
    <>
      <SiteHeader current={null} />
      <main id="top" className="min-h-dvh">
        <VendorHero vendor={vendor} family={family} />

        <div className="page-shell flex flex-col gap-10 py-6">
          <VendorTimeline vendor={vendor} groups={groups} apt={d.apt} now={new Date(d.snapshot.generatedAt)} />
          <VendorProvenance family={family} />
        </div>
      </main>
      <SiteFooter snapshot={d.snapshot} />
    </>
  );
}
