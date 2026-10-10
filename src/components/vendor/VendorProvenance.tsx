import { INTERNAL_SOURCE } from '@/components/model/ProvenanceList';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord, SourceId } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface VendorProvenanceProps {
  /** 该厂全部型号，含已退役——出处统计不该悄悄换统计口径 */
  family: ModelRecord[];
}

/**
 * 厂商级数据出处：这家全部型号的逐字段来源按上游汇总。
 *
 * 型号详情页有逐字段的 `provenance` 表；厂商页不重复摊开几百行，
 * 而是回答厂商这一层级的问题——「这家的数字主要从哪读来的」。
 * 「主要」用字段数表达：一个来源承载的字段越多，它对这一页的影响越大。
 */
export function VendorProvenance({ family }: VendorProvenanceProps) {
  const counts = new Map<SourceId, number>();
  let total = 0;
  for (const m of family) {
    for (const source of Object.values(m.provenance)) {
      if (source == null) continue;
      counts.set(source, (counts.get(source) ?? 0) + 1);
      total += 1;
    }
  }

  if (total === 0) return null;

  const entries = Array.from(counts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return (
    <section aria-labelledby="vendor-provenance-heading">
      <SectionHeading
        id="vendor-provenance-heading"
        title={dict.vendor.provenanceTitle}
        count={dict.vendor.fieldCount(total)}
      />
      <p className="mt-2 text-2xs text-fg-dim">{dict.vendor.provenanceNote}</p>

      <dl className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([source, n]) => (
          <div key={source} className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="min-w-0 truncate text-2xs text-fg-dim" title={source}>
              {INTERNAL_SOURCE[source] ?? source}
            </dt>
            <dd className="tnum shrink-0 text-2xs text-fg-muted">{dict.vendor.fieldCount(n)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
