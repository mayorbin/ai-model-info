import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { formatDate } from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface SiblingModelsProps {
  /** 同一家厂商的全部型号，含当前这个 */
  models: ModelRecord[];
  currentId: string;
  vendorName: string;
}

/**
 * 同厂其他型号。
 *
 * 这一块补的是首页一直缺的那个问题：**「智谱都有什么型号」**。
 * 首页每个厂商只渲染一个门面（`roster.ts` 的选拔结果），所以 617 个模型里
 * 读者在首页最多看到 40 个，而「还有 N 家资料不全的厂商」那句话是个死胡同。
 *
 * 排序按**在役优先 → 综合智力降序 → 发布日期降序**：读者来这一页多半是
 * 顺着某个结论来的（「Claude Opus 5.5 最聪明，那这家还有别的吗」），
 * 所以同厂里更强的型号要先出现；没有成绩的再按新旧排。
 */
export function SiblingModels({ models, currentId, vendorName }: SiblingModelsProps) {
  const others = models
    .filter((m) => m.id !== currentId)
    .sort((a, b) => {
      const ar = a.retiredAt != null;
      const br = b.retiredAt != null;
      if (ar !== br) return ar ? 1 : -1;
      const ea = a.benchmarks.eci;
      const eb = b.benchmarks.eci;
      if (ea != null || eb != null) {
        if (ea == null) return 1;
        if (eb == null) return -1;
        if (ea !== eb) return eb - ea;
      }
      return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '') || a.name.localeCompare(b.name);
    });

  return (
    <section aria-labelledby="siblings-heading">
      {/*
        计数数的是**它下面那张表里的行数**，也就是「其他」的个数，不含当前这一页。
        此前传的是 `models.length`（含自己），于是 AI21 那一页写着「2 个型号」而表里只有一行——
        标题说的是「其他型号」，计数就必须回答同一件事。
      */}
      <SectionHeading
        id="siblings-heading"
        title={`${vendorName} · ${dict.model.section.siblings}`}
        count={dict.model.siblingCount(others.length)}
      />

      {others.length === 0 ? (
        <p className="mt-3 text-xs text-fg-muted">{dict.model.noSiblings}</p>
      ) : (
        <ul className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((m) => (
            <li key={m.id} className="border-b border-line-faint">
              <Link
                href={`/model/${m.slug}/`}
                className="group flex min-w-0 items-baseline gap-2 py-1.5 transition-colors duration-120"
              >
                <span
                  className="min-w-0 flex-1 truncate text-xs text-fg group-hover:underline group-hover:underline-offset-4"
                  title={m.name}
                >
                  {m.name}
                </span>
                {m.retiredAt != null && (
                  <span className="shrink-0 text-2xs text-fg-dim">{dict.badge.retired}</span>
                )}
                <span className="tnum shrink-0 text-2xs text-fg-dim">
                  {m.releaseDate
                    ? formatDate(m.releaseDate, m.releaseDatePrecision, DEFAULT_LANG)
                    : dict.unknown.noData}
                </span>
                <span className="tnum w-11 shrink-0 text-right text-xs text-fg-muted">
                  {m.benchmarks.eci != null ? m.benchmarks.eci.toFixed(1) : dict.badge.unranked}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
