/**
 * 综合智力排行：把全部有 ECI 的模型按分数排成一列。
 *
 * 这一层存在的理由与 `champions.ts` 不同。冠军条回答「谁第一」，
 * 而读者真正会问的下一句是「那第三十七是谁」「ECI 150 以上还有哪些」——
 * 此前整页只有八个结论和四十张门面卡，没有一条能上下扫的完整次序。
 *
 * 纯函数、确定性，不依赖当前时间。
 */

import type { ModelRecord, Vendor } from './types';
import { rankByEci } from './derive';

export interface LeaderboardRow {
  model: ModelRecord;
  vendor: Vendor | undefined;
  /** 1 起的全球名次 */
  rank: number;
  eci: number;
}

export interface Leaderboard {
  /** 按名次升序，即 ECI 降序 */
  rows: LeaderboardRow[];
  /** 有成绩的模型总数，分区标题上的计数用它 */
  total: number;
}

/**
 * 名次的定义**只有一处**：`derive.ts` 的 `rankByEci`。这里只按它给出的名次重排，
 * 不再写第二个排序比较器——否则「并列怎么打破」这件事迟早会在两个地方分叉，
 * 而冠军条的依据行（「214 个受测模型中第一」）也读的是同一张表。
 */
export function buildLeaderboard(models: ModelRecord[], vendors: Vendor[]): Leaderboard {
  const alive = models.filter((m) => !m.retiredAt);
  const byId = new Map(alive.map((m) => [m.id, m]));
  const vendorOf = new Map(vendors.map((v) => [v.id, v]));

  const rows = [...rankByEci(alive).entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id, rank]) => {
      const model = byId.get(id)!;
      return { model, vendor: vendorOf.get(model.vendorId), rank, eci: model.benchmarks.eci! };
    });

  return { rows, total: rows.length };
}
