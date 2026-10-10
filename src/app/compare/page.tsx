import type { Metadata } from 'next';
import { SiteFooter } from '@/components/home/SiteFooter';
import { SiteHeader } from '@/components/home/SiteHeader';
import { CompareView } from '@/components/compare/CompareView';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { loadSnapshot } from '@/lib/snapshot';

const dict = getDict(DEFAULT_LANG);

export const metadata: Metadata = { title: dict.cmp.title };

/**
 * 模型对比。选哪几个全在地址栏里（`?m=a,b`），页面本身是一张空壳，
 * 数据由 `public/compare-data.json` 按需拉取（构建期由 `scripts/compare-data.ts` 生成）。
 *
 * 只有 `CompareView` 及其子组件是客户端组件；这一页的外壳（标题、头尾）留在服务端，
 * 页头页脚在 `<main>` 外面，保住 banner / contentinfo 地标。
 */
export default function ComparePage() {
  const snapshot = loadSnapshot();

  return (
    <>
      <SiteHeader current="/compare/" />
      <main id="top" className="min-h-dvh">
        <div className="page-shell pt-5">
          <h1 className="text-xl font-semibold text-fg sm:text-2xl">{dict.cmp.title}</h1>
          <div className="mt-5">
            <CompareView dataUrl="/compare-data.json" />
          </div>
        </div>
      </main>
      <SiteFooter snapshot={snapshot} />
    </>
  );
}
