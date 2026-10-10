import type { ModelRecord } from './types';

/**
 * 按发布月份分桶。
 *
 * 月份是本站已经验证过的粒度：按年分桶会把一整年的模型堆成一坨，
 * 按日分桶则几乎每桶只有一个。厂商详情页与时间线页共用这一套
 * （参考项目的教训：它两处各写了一份，措辞与排序随后分了叉）。
 */
export interface MonthGroup {
  /** `YYYY-MM`；发布日期不详的模型收进 `"unknown"` 桶 */
  key: string;
  models: ModelRecord[];
}

/**
 * `YYYY-MM` → 展示标签（`2026.03`）。
 *
 * 只换分隔符、不改数字：等宽字体里的 `2026.03` 与快照里其他日期写法一致。
 * 非 `YYYY-MM` 形状的键原样返回，由调用方决定怎么说（见 unknown 桶）。
 */
export function monthLabel(key: string): string {
  return /^\d{4}-\d{2}$/.test(key) ? key.replace('-', '.') : key;
}

/**
 * 分组规则与参考项目实测后的结论一致：
 * 组间**新的在上**（时间线倒着读，最新的动态最先看到）；
 * 组内按发布日期倒序，同日再按综合智力降序、最后按 id 兜底——
 * 早先组内按分数排，读者根本看不出谁先谁后。
 * `unknown` 桶排最后：它在时间轴上没有位置。
 */
export function groupByMonth(models: ModelRecord[]): MonthGroup[] {
  const map = new Map<string, ModelRecord[]>();
  for (const m of models) {
    const key = m.releaseDate?.slice(0, 7) ?? 'unknown';
    const list = map.get(key);
    if (list) list.push(m);
    else map.set(key, [m]);
  }

  return Array.from(map.entries())
    .map(([key, list]) => ({
      key,
      models: list.sort(
        (a, b) =>
          (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '') ||
          (b.benchmarks.eci ?? -1) - (a.benchmarks.eci ?? -1) ||
          a.id.localeCompare(b.id),
      ),
    }))
    .sort((a, b) =>
      a.key === 'unknown' ? 1 : b.key === 'unknown' ? -1 : b.key.localeCompare(a.key),
    );
}
