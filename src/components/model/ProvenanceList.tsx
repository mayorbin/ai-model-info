import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord, SourceId } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

/**
 * 字段路径 → 中文名。快照里的键是接口路径（`pricing.outputPerMTok`），
 * 那句话对管线是精确的、对读者不是。表里没有的键原样显示——
 * 显示一个陌生的路径，好过猜一个可能不对的中文名。
 */
const FIELD: Record<string, string> = {
  name: '名称',
  vendorId: '厂商归属',
  releaseDate: dict.attr.releaseDate,
  releaseDatePrecision: '发布日期精度',
  retiredAt: '退役时间',
  knowledgeCutoff: dict.attr.knowledgeCutoff,
  contextWindow: dict.attr.contextWindow,
  maxOutput: dict.attr.maxOutput,
  modalities: dict.attr.modalities,
  openWeights: dict.attr.openWeights,
  license: dict.attr.license,
  'pricing.inputPerMTok': dict.attr.inputPrice,
  'pricing.outputPerMTok': dict.attr.outputPrice,
  'pricing.cachedInputPerMTok': dict.attr.cachedInputPrice,
  'params.totalB': dict.attr.params,
  'params.activeB': '激活参数量',
  'params.sizeTier': '体型档位',
  trainingComputeFlop: dict.attr.trainingCompute,
  'capabilities.toolCall': dict.attr.toolCall,
  'capabilities.reasoning': dict.attr.reasoning,
  'capabilities.promptCaching': dict.attr.promptCaching,
  'capabilities.structuredOutput': dict.attr.structuredOutput,
  /*
   * `benchmarks.*` 这一组是历史上写进 ModelRecord 的固定列（早于按赛制分列的
   * `scores[]`），它们的名字来自 `types.ts` 的 `Benchmarks` 接口，在前端各处
   * 另有自己的中文名，这里逐条对齐，**不要再出现第二套叫法**。
   */
  'benchmarks.eci': dict.track.eci,
  'benchmarks.swe_bench_verified': dict.track.swe_bench_verified,
  'benchmarks.swe_bench_vendor': '编程（厂商自报）',
  'benchmarks.swe_bench_pro': 'SWE-Bench Pro',
  'benchmarks.aime': 'AIME 数学',
  'benchmarks.gpqa_diamond': 'GPQA 科学',
  'benchmarks.arc_agi_2': 'ARC-AGI-2',
  'benchmarks.fiction_live': '长文本 Fiction.liveBench',
  'benchmarks.webdev_arena_elo': 'WebDev Arena 实战口碑',
  coding: '全部编程成绩',
  scores: '全部评测成绩',
};

/**
 * 两个非上游来源必须与真正的数据源区分开。把它们和 `models.dev` 并列写成
 * 「来源：derived」，读者会以为是某家没听过的机构；它们其实是**本站自己算的**。
 */
/* 导出给厂商页的数据出处区复用：两个非上游来源只有一套叫法（见上方注释） */
export const INTERNAL_SOURCE: Partial<Record<SourceId, string>> = {
  derived: '本站推导',
  override: '人工录入',
};

/**
 * 逐字段数据出处。
 *
 * 这一块是整站最「不讨好」的部分：没有它，上面那些数字看起来一样可信，
 * 而实际上「上下文窗口来自 models.dev」和「参数量来自 huggingface 的权重文件」
 * 是两件可信度完全不同的事。全站的诚信立场是「让人看到真实状态」，
 * 那这条链条就必须能查——**它不能只活在数据管线的文档里**。
 */
export function ProvenanceList({ model }: { model: ModelRecord }) {
  const entries = Object.entries(model.provenance).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="provenance-heading">
      <SectionHeading
        id="provenance-heading"
        title={dict.model.section.provenance}
        count={dict.model.fieldCount(entries.length)}
      />
      <p className="mt-2 text-2xs text-fg-dim">{dict.model.provenanceNote}</p>

      <dl className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([field, source]) => (
          <div key={field} className="flex min-w-0 items-baseline justify-between gap-3">
            <dt className="min-w-0 truncate text-2xs text-fg-dim" title={field}>
              {FIELD[field] ?? field}
            </dt>
            <dd className="tnum shrink-0 text-2xs text-fg-muted">
              {/* provenance 是 Partial：缺值说明这个字段没有记录来源，如实说，不要编一个 */}
              {source == null ? dict.unknown.noData : (INTERNAL_SOURCE[source] ?? source)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
