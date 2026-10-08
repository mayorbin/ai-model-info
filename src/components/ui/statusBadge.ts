import { daysSince } from '@/lib/derive';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { hasCoreData } from '@/lib/roster';
import type { ModelRecord } from '@/lib/types';
import type { BadgeTone } from './Badge';

const dict = getDict(DEFAULT_LANG);

/** 「新发布」的判定窗口。只是徽章阈值，与 roster.ts 的选拔规则无关。 */
const FRESH_DAYS = 30;

/**
 * 状态徽章。**最多一个**——挂满徽章等于一个都没挂，
 * 这是原项目用实测数据确认过的（原项目里 74% 的屋子挂同一个图标，于是它传递零比特）。
 *
 * 优先次序有讲究：**已退役 > 新发布 > 资料不全 > 未参评**。
 * 退役与在役是二选一的事实，必须先说；「新发布」是时间事实，比数据完整度更值得先说。
 *
 * 首页的厂商卡与模型详情页都要给出同一个结论，所以定义在这里而不是私有在某个卡片里——
 * 两处各写一遍的话，「什么算未参评」迟早会在两处给出不同答案。
 */
export function statusBadge(
  model: ModelRecord,
  now: Date,
): { tone: BadgeTone; label: string } | null {
  if (model.retiredAt) return { tone: 'neg', label: dict.badge.retired };
  const age = daysSince(model.releaseDate, now);
  if (age != null && age >= 0 && age <= FRESH_DAYS) return { tone: 'pos', label: dict.badge.fresh };
  if (!hasCoreData(model)) return { tone: 'accent', label: dict.badge.partialData };
  if (model.benchmarks.eci == null) return { tone: 'neutral', label: dict.badge.unranked };
  return null;
}
