/**
 * 升序数组里 value 的分位，0~1。
 *
 * 全站在三个地方需要「这个数在当前这批数据里算什么水平」：体型档位、性价比、
 * 四条能力条。三处必须用同一把尺子，否则同一个分位在不同卡片上会算出不同的长度。
 * 空数组与单元素都回落到 0.5——样本不足时给中位而不是 0 或 1，
 * 免得把「没数据」画成「最差」或「最好」。
 */
export function percentile(sorted: number[], value: number): number {
  if (sorted.length === 0) return 0.5;
  if (sorted.length === 1) return 0.5;
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo / (sorted.length - 1);
}
