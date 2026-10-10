import { CompareGrid, RowLabel } from './CompareGrid';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { cutoffMonth, cutoffText, modalities, short, specWinners, usd, yesNo, type SpecBetter } from './insights';
import type { CmpModel } from './types';

const dict = getDict(DEFAULT_LANG);

/**
 * 基本信息表：左边标签，右边每个模型一列。
 *
 * 两条规矩来自参考项目的实测：
 * - **各家一样的行折进「都一样」**，不重复渲染 N 遍（发布日期例外：即使同一天，
 *   它也是读者在这一屏里要找的信息）；
 * - 数值缺席写「暂无」并压暗，不填 0——价格、上下文为 0 与「没有数据」是两件事。
 */

interface SpecDef {
  label: string;
  text: (m: CmpModel) => string | null;
  value?: (m: CmpModel) => number | null;
  better?: SpecBetter;
  /** 各家一样时也照常占一行 */
  keep?: boolean;
}

const SPECS: SpecDef[] = [
  { label: dict.cmp.spec.date, text: (m) => m.dateText, keep: true },
  { label: dict.cmp.spec.kind, text: (m) => (m.kind ? `${dict.kind.label[m.kind]}${dict.cmp.spec.kindSuffix}` : null) },
  { label: dict.cmp.spec.ctx, text: (m) => short(m.ctx), value: (m) => m.ctx, better: 'high' },
  { label: dict.cmp.spec.maxOut, text: (m) => short(m.maxOut), value: (m) => m.maxOut, better: 'high' },
  { label: dict.cmp.spec.priceIn, text: (m) => usd(m.priceIn), value: (m) => m.priceIn, better: 'low' },
  { label: dict.cmp.spec.priceOut, text: (m) => usd(m.priceOut), value: (m) => m.priceOut, better: 'low' },
  { label: dict.cmp.spec.priceCached, text: (m) => usd(m.priceCached), value: (m) => m.priceCached, better: 'low' },
  { label: dict.cmp.spec.cutoff, text: (m) => cutoffText(m.cutoff), value: (m) => cutoffMonth(m.cutoff), better: 'high' },
  { label: dict.cmp.spec.reads, text: (m) => modalities(m.inputs) },
  { label: dict.cmp.spec.generates, text: (m) => modalities(m.outputs) },
  { label: dict.cmp.spec.reasoning, text: (m) => yesNo(m.reasoning) },
  { label: dict.cmp.spec.toolCall, text: (m) => yesNo(m.tool) },
  { label: dict.cmp.spec.openWeights, text: (m) => (m.open == null ? null : m.open ? dict.openness.open : dict.openness.closed) },
  { label: dict.cmp.spec.params, text: (m) => m.params ?? dict.unknown.noData },
];

export function CompareSpecs({ picked }: { picked: CmpModel[] }) {
  const n = picked.length;
  const same: [string, string][] = [];

  const rows = SPECS.flatMap((spec) => {
    const texts = picked.map(spec.text);
    // 各家一样就折进「都一样」那一行；`keep` 的行即使一样也照常渲染
    if (!spec.keep && n >= 2 && texts.every((t) => t === texts[0])) {
      same.push([spec.label.replace(' / 百万 tokens', ''), texts[0] ?? dict.unknown.noData]);
      return [];
    }
    const winners = spec.value ? specWinners(picked.map(spec.value), spec.better ?? null) : [];
    return [
      <CompareGrid key={spec.label} n={n} className="border-b border-line-faint">
        <RowLabel>{spec.label}</RowLabel>
        {picked.map((m, i) => {
          const text = texts[i];
          return (
            <div
              key={m.slug}
              className={`tnum py-2 text-xs ${
                text == null ? 'text-fg-dim' : winners.includes(i) ? 'font-medium text-gold' : 'text-fg-muted'
              }`}
            >
              {text ?? dict.unknown.noData}
            </div>
          );
        })}
      </CompareGrid>,
    ];
  });

  return (
    <>
      <SectionHeading title={dict.cmp.section.specs} />
      {rows}
      {same.length > 0 && (
        <CompareGrid n={n}>
          <RowLabel>{dict.cmp.section.same}</RowLabel>
          <p
            className="flex flex-wrap gap-x-5 gap-y-1 py-2 text-xs leading-relaxed"
            style={{ gridColumn: 'span var(--n) / span var(--n)' }}
          >
            {same.map(([label, value]) => (
              <span key={label} className="whitespace-nowrap">
                <span className="text-fg-dim">{label}</span>
                <span className="tnum ml-1.5 text-fg-muted">{value}</span>
              </span>
            ))}
          </p>
        </CompareGrid>
      )}
    </>
  );
}
