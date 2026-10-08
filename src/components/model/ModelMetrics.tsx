import { MetricBar } from '@/components/ui/MetricBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { APTITUDES, type AptitudeRow } from '@/lib/aptitude';
import {
  formatBool,
  formatContext,
  formatCount,
  formatModalities,
  formatParams,
  formatPrice,
} from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { kindOf } from '@/lib/kind';
import type { ModelRecord } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);
const LANG = DEFAULT_LANG;

/**
 * 训练算力按科学计数法写。它的跨度为 6.6e22 ~ 1e27，八个数级——
 * 写成「×10²²」要 Superscript 字符集，写成 `toExponential(2)` 又会多出一个 `+`（6.60e+22）。
 * `6.6e22 FLOP` 是这一行唯一既短、又量纲正确、又不用读者心算的说法。
 */
function formatFlop(flop: number | null | undefined): string {
  return flop == null ? dict.unknown.noData : `${flop.toExponential(1).replace('e+', 'e')} FLOP`;
}

interface ModelMetricsProps {
  model: ModelRecord;
  apt: AptitudeRow;
}

/**
 * 能力与读数。首页卡片上的四条能力条在这里**原样重排一遍**——同一个 `AptitudeRow`、
 * 同一个 `MetricBar`，不重算任何分位。
 *
 * 这正是首页与详情页分工的落点：首页只用四条条回答「它在同一批模型里排哪一档」，
 * 详情页把**具体数字**摊开。一个模型在首页能拿到的空间是 240×209，
 * 在这里是一整页，所以「不知道就得说不知道」的那部分才有可能讲清楚。
 */
export function ModelMetrics({ model, apt }: ModelMetricsProps) {
  const kind = kindOf(model);

  const numbers: Array<[string, string]> = [
    [dict.attr.contextWindow, formatContext(model.contextWindow, LANG)],
    [
      dict.attr.maxOutput,
      model.maxOutput == null ? dict.unknown.noData : `${formatCount(model.maxOutput)} tokens`,
    ],
    [dict.attr.inputPrice, formatPrice(model.pricing.inputPerMTok, LANG)],
    [dict.attr.outputPrice, formatPrice(model.pricing.outputPerMTok, LANG)],
    [dict.attr.cachedInputPrice, formatPrice(model.pricing.cachedInputPerMTok, LANG)],
    /* `formatParams` 自己会把「官方从未公布 / 由型号名推断」写进同一格，
       所以这里不再补第二句话说同一件事 */
    [dict.attr.params, formatParams(model, LANG)],
    [dict.attr.trainingCompute, formatFlop(model.trainingComputeFlop)],
  ];

  const facts: Array<[string, string]> = [
    [dict.attr.kind, kind == null ? dict.kind.unknown : dict.kind.label[kind]],
    [dict.attr.modalities, formatModalities(model.modalities.input, LANG)],
    [dict.attr.openWeights, formatBool(model.openWeights, LANG)],
    [dict.attr.license, model.license ?? dict.unknown.noData],
    [dict.attr.knowledgeCutoff, model.knowledgeCutoff ?? dict.unknown.noData],
  ];

  const caps: Array<[string, string]> = [
    [dict.attr.toolCall, formatBool(model.capabilities.toolCall, LANG)],
    [dict.attr.reasoning, formatBool(model.capabilities.reasoning, LANG)],
    [dict.attr.promptCaching, formatBool(model.capabilities.promptCaching, LANG)],
    [dict.attr.structuredOutput, formatBool(model.capabilities.structuredOutput, LANG)],
  ];

  return (
    <section aria-labelledby="metrics-heading">
      <SectionHeading
        id="metrics-heading"
        title={dict.model.section.metrics}
        count={`${apt.known}/4`}
      />

      <div className="mt-3 flex flex-col gap-1.5">
        {APTITUDES.map((meta) => {
          const v = apt.values[meta.id];
          return (
            <MetricBar
              key={meta.id}
              label={v.labelOverride ?? meta.label}
              fill={v.fill}
              literal={
                v.selfReported && v.literal != null
                  ? `${v.literal} ${dict.badge.selfReported}`
                  : v.literal
              }
              title={v.title}
            />
          );
        })}
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...numbers, ...facts, ...caps].map(([label, value]) => (
          <div key={label} className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="shrink-0 text-2xs text-fg-dim">{label}</dt>
            {/* 值是内容、标签是说明，所以值亮一档；数字一律等宽 */}
            <dd className="tnum min-w-0 truncate text-xs text-fg-muted" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
