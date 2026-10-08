/**
 * 模型属性 → 可比较的档位推导。
 *
 * 这里是原项目 `ai-model-world/src/lib/derive.ts` 的**评分半区**。
 * 同一文件里还有另一半——服饰华丽度、头顶冠冕、书架层数、桌上电脑档次、
 * 能力符号那一整组映射——那是给 64×64 像素角色用的视觉编码，没有移植过来。
 * 理由记在原项目的 DESIGN.md 里：把数据编码进画面要求读者先学一遍图例、
 * 记住它、再回到画面上解码，实测十个维度里有六个在缩略尺寸下读不出来。
 * 新站只保留「数」的一半，「画」的一半由厂商 logo 与能力条接管。
 *
 * 所有函数都是纯函数且不含随机性：同一个 ModelRecord 永远推导出同一套档位。
 */

import type { ModelRecord } from './types';
import { percentile } from './percentile';

export type Tier = 1 | 2 | 3 | 4 | 5;

// ─── 价格档位：按当前全体模型的分位数自校准 ───────────────────

/**
 * 价格档位不能用写死的美元阈值。
 *
 * 两个原因。其一，同一时刻的旗舰模型定价高度聚集，固定阈值会把它们全塞进同一档，
 * 档位就失去了区分度。其二，token 价格逐年下降，写死的阈值会让若干年后
 * 全世界的模型都落进最低档——这正是一个「发布后没人维护」的站点最容易悄悄烂掉的地方。
 *
 * 改用当前快照内的五分位：档位表达的是「在今天的模型里算贵还是算便宜」，
 * 这个语义既自校准，也正是用户真正想知道的。
 */
export interface PriceScale {
  /** 五分位切点，长度为 4 */
  cuts: number[];
  tierOf(price: number | null | undefined): Tier | null;
}

export function buildPriceScale(models: ModelRecord[]): PriceScale {
  const prices = models
    .map((m) => m.pricing.outputPerMTok)
    .filter((p): p is number => p != null && p > 0)
    .sort((a, b) => a - b);

  // 样本太少时退回一组保守的绝对阈值，总比全部挤在一档强
  const cuts =
    prices.length < 10
      ? [0.5, 2, 10, 30]
      : [0.2, 0.4, 0.6, 0.8].map((q) => prices[Math.floor(q * (prices.length - 1))]);

  return {
    cuts,
    tierOf(price) {
      if (price == null || price <= 0) return null;
      let tier = 1;
      for (const cut of cuts) if (price > cut) tier++;
      return Math.min(5, tier) as Tier;
    },
  };
}

// ─── 体型档位 ← 模型规模 ───────────────────────────────────────

export interface SizeResult {
  tier: Tier;
  /**
   * 档位不是由精确参数量算出来的。用于提示文案的措辞。
   * 注意这和 `opaque` 是两件事：从模型名里抽出的「235B」不精确但确实存在，
   * 这类模型 estimated 为 true 而 opaque 为 false。
   */
  estimated: boolean;
  /** 完全没有参数量可显示。界面上必须如实标注，不能让它看起来言之凿凿。 */
  opaque: boolean;
}

/**
 * 从模型名里读出厂商自己的规格暗示。
 * 这是闭源模型唯一能用的规模信号之一——厂商不公布参数量，但会用命名告诉你这是大杯还是小杯。
 * 返回 0~1 的连续值，方便与分位数在同一量纲里合成。
 */
function namingScore(id: string): number {
  const s = id.toLowerCase();
  if (/(nano|mini|flash|lite|small|tiny|micro|air)/.test(s)) return 0;
  if (/(pro|max|ultra|opus|large|xl|plus|heavy)/.test(s)) return 1;
  return 0.5;
}

export interface SizeScale {
  sizeOf(model: ModelRecord): SizeResult;
}

/**
 * 体型标尺。
 *
 * 两次尝试都失败之后才走到这个方案，过程值得记下来：
 * 一开始用写死的美元阈值分档，结果旗舰模型全落进同一档；
 * 改成价格分位数之后，又因为「价格分位 × 命名档」是加权平均，
 * 数值向中位数回归，还是全挤在第 4 档。
 *
 * 平均永远会压缩值域。所以最终做法是：先给每个模型算一个 0~1 的连续规模分，
 * 再把全体模型的分数做一次五等分。这样五个档位在构造上一定都有人。
 *
 * 代价是档位表达的是「在当前这批模型里算大还是算小」而非绝对参数量。
 * 对一个展示「当下格局」的站点来说，这个相对语义反而更贴近用户想问的问题，
 * 而且它自校准——不会因为若干年后模型普遍变大变便宜就整体失真。
 */
export function buildSizeScale(models: ModelRecord[]): SizeScale {
  const paramValues = models
    .filter((m) => m.params.totalB != null)
    .map((m) => Math.log10(m.params.totalB!))
    .sort((a, b) => a - b);

  const priceValues = models
    .map((m) => m.pricing.outputPerMTok)
    .filter((p): p is number => p != null && p > 0)
    .map((p) => Math.log10(p))
    .sort((a, b) => a - b);

  function rawScore(m: ModelRecord): { score: number; estimated: boolean; opaque: boolean } {
    // 只要拿得到参数量就用它，不要求 confidence 是 exact。
    // 从模型名里正则抽出的「235B」虽然不算精确，但它是厂商自己写在名字里的真实规模，
    // 远比价格代理可靠。早先卡 exact 的写法把 119 个已知参数量的模型白白丢进了价格通道。
    if (m.params.totalB != null) {
      return {
        score: percentile(paramValues, Math.log10(m.params.totalB)),
        estimated: m.params.confidence !== 'exact',
        opaque: false,
      };
    }
    const price = m.pricing.outputPerMTok;
    if (price != null && price > 0) {
      const p = percentile(priceValues, Math.log10(price));
      return { score: 0.75 * p + 0.25 * namingScore(m.id), estimated: true, opaque: true };
    }
    return { score: namingScore(m.id), estimated: true, opaque: true };
  }

  // 全体分数的五等分切点。用分数本身的分布切，而不是均分 0~1 区间，
  // 因为分数分布本身也是聚集的。
  const allScores = models.map((m) => rawScore(m).score).sort((a, b) => a - b);
  const cuts =
    allScores.length < 5
      ? [0.2, 0.4, 0.6, 0.8]
      : [0.2, 0.4, 0.6, 0.8].map((q) => allScores[Math.floor(q * (allScores.length - 1))]);

  return {
    sizeOf(model) {
      const { score, estimated, opaque } = rawScore(model);
      let tier = 1;
      for (const cut of cuts) if (score > cut) tier++;
      return { tier: Math.min(5, tier) as Tier, estimated, opaque };
    },
  };
}

// ─── 性价比 ───────────────────────────────────────────────────

/**
 * 「每块钱买到多少智力」。
 *
 * 第一版直接算 `eci / outputPerMTok`，**是错的**，而且错得很隐蔽。
 * 比值型指标在分母趋近于零时会爆炸：实算下来前三名是
 * Llama-3.1-8B（$0.08，ECI 115 → 1441）、Mistral Nemo（789）、GPT OSS 20B（684），
 * 而 Claude Fable 5 只有 3.25。于是「性价比之王」这块牌子永远颁给最便宜的那批，
 * 而不是「又好又省」的那批——和这块牌子想表达的意思正好相反。
 *
 * 改成**两个分位相减**：智力分位减价格分位，两个都是 0~1 的无量纲量，
 * 差值落在 -1~1 之间，不会爆炸，也不需要任何可调参数。
 * 一个模型只有在「比同价位的更聪明」或「比同智力的更便宜」时才拿得到高分，
 * 这正是性价比的本义。
 */
export function buildValueScore(models: ModelRecord[]): (m: ModelRecord) => number | null {
  const eciAsc = models
    .map((m) => m.benchmarks.eci)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);

  const priceAsc = models
    .filter((m) => m.modalities.output.includes('text'))
    .map((m) => m.pricing.outputPerMTok)
    .filter((v): v is number => v != null && v > 0)
    .map((v) => Math.log10(v))
    .sort((a, b) => a - b);

  return (m) => {
    const eci = m.benchmarks.eci;
    const price = m.pricing.outputPerMTok;
    if (eci == null || price == null || price <= 0) return null;
    if (!m.modalities.output.includes('text')) return null;
    return percentile(eciAsc, eci) - percentile(priceAsc, Math.log10(price));
  };
}

// ─── 年龄 ─────────────────────────────────────────────────────

const DAY = 86_400_000;

export function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  // 宽松解析：上游存在 YYYY-MM 甚至 YYYY 的低精度日期，补齐到当月/当年首日
  const parts = iso.split('-').map(Number);
  const d = Date.UTC(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1);
  if (Number.isNaN(d)) return null;
  return Math.floor((now.getTime() - d) / DAY);
}

// ─── 名次 ─────────────────────────────────────────────────────

/**
 * 按综合智力分给模型排名。没有分数的模型不进这张表。
 *
 * **同分并列同名次，名次会跳过**（1, 2, 2, 4）。实测在役 214 个有成绩的模型里
 * **39 个并列组覆盖 96 个模型（45%）**，最大一组 5 个。上游的 ECI 是按「一起测的那一批」给的，
 * 同分说明上游并没有把它们分开——连续编号会凭空造出一个数据里不存在的先后。
 *
 * **名次用的精度必须与页面所示精度一致。** 界面上的 ECI 是一位小数
 * （排行区与能力条的出处文案都是 `toFixed(1)`），所以这里也按一位小数分组。
 * 曾经按原始浮点分组、界面按整数显示，结果是**六行都写着「157」却排在 15–20 号**——
 * 看着像 bug，其实是同一个数量被两个精度各说了一遍。
 * **读者能把名次和数字对上，是这一页唯一不能省的东西。**
 *
 * 这条规则是**全站唯一定义**：能力条的「世界#N」、冠军依据行的「全球 #N」、
 * 排行区的行号，全部读这里。此前能力条另有一套「数严格大于自己的有几个」的算法，
 * 两套算法在 **57 个模型（26.6%）** 上给出不同的名次——同一个模型两个名次，
 * 是这一页最不该有的不一致。现在只有一套。
 */
export function rankByEci(models: ModelRecord[]): Map<string, number> {
  const scored = models
    .filter((m) => m.benchmarks.eci != null)
    .sort((a, b) => b.benchmarks.eci! - a.benchmarks.eci! || a.id.localeCompare(b.id));

  const ranks = new Map<string, number>();
  let prev: number | null = null;
  let rank = 0;
  scored.forEach((m, i) => {
    // 舍入是单调的，所以同一个「所示值」的成员在按原值排序后必定连续
    const shown = Math.round(m.benchmarks.eci! * 10) / 10;
    if (prev === null || shown !== prev) {
      rank = i + 1;
      prev = shown;
    }
    ranks.set(m.id, rank);
  });
  return ranks;
}

