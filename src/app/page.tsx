import { isSampleData, loadSnapshot } from '@/lib/snapshot';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';

/**
 * 批次 1 的冒烟页：只验证 loadSnapshot() 在新工程的 cwd 下能读到快照，
 * 以及派生的评分链路（ECI 排序）可用。批次 3 会用真正的总览页替换掉它。
 */
export default function Page() {
  const dict = getDict(DEFAULT_LANG);
  const snapshot = loadSnapshot();
  const top = snapshot.models
    .filter((m) => m.benchmarks.eci != null)
    .sort((a, b) => b.benchmarks.eci! - a.benchmarks.eci!)
    .slice(0, 20);

  return (
    <main className="p-6 font-mono text-sm">
      <h1 className="text-xl font-semibold">{dict.siteName}</h1>
      <p className="mt-2">
        {snapshot.models.length} 模型 · {snapshot.vendors.length} 厂商 · 生成于 {snapshot.generatedAt}
        {isSampleData(snapshot) ? ' （样本数据）' : ''}
      </p>
      <ol className="mt-4 list-decimal space-y-1 pl-5">
        {top.map((m) => (
          <li key={m.id}>
            {m.name} — {m.vendorId} — ECI {m.benchmarks.eci}
          </li>
        ))}
      </ol>
    </main>
  );
}
