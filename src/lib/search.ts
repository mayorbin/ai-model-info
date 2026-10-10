/**
 * 全站搜索。
 *
 * 解决三个「找不到」：
 * 1. 知道模型名直达详情页；
 * 2. 知道厂商名直达厂商分组或区域；
 * 3. 按能力词（多模态 / 视觉 / 开源 / 国内）查找数量与入口。
 *
 * 构建期：scripts/search-index.ts 跑 buildSearchIndex 输出 public/search-index.json。
 * 运行时：GlobalSearch 组件按需加载索引，runSearch 纯函数执行过滤。
 */

import { continentForCountry, profileFor } from '../data/vendor-registry';
import { kindOf, type ModelKind } from './kind';
import type { Continent, WorldSnapshot } from './types';

export interface IndexVendor {
  /** 厂商 id */
  i: string;
  /** 中文名 */
  n: string;
  c: Continent;
  /** 在役模型数 */
  t: number;
}

export interface IndexModel {
  /** slug */
  s: string;
  /** name */
  n: string;
  /** vendors[] 下标 */
  v: number;
  k: ModelKind | null;
  /** 综合智力名次，没有为 null */
  r: number | null;
  /** 权重：o 开源、c 闭源 */
  w?: 'o' | 'c';
  /** 1 表示已退役 */
  x?: 1;
}

export interface SearchIndex {
  generatedAt: string;
  vendors: IndexVendor[];
  models: IndexModel[];
}

export function buildSearchIndex(snapshot: WorldSnapshot): SearchIndex {
  const vendorIds = [...new Set(snapshot.models.map((m) => m.vendorId))];
  const known = new Map(snapshot.vendors.map((v) => [v.id, v]));
  const aliveByVendor = new Map<string, number>();
  for (const m of snapshot.models) {
    if (m.retiredAt) continue;
    aliveByVendor.set(m.vendorId, (aliveByVendor.get(m.vendorId) ?? 0) + 1);
  }

  const vendors: IndexVendor[] = vendorIds.map((id) => {
    const v = known.get(id);
    const p = profileFor(id);
    return {
      i: id,
      n: v?.nameZh ?? p.nameZh,
      c: v?.continent ?? continentForCountry(p.country),
      t: aliveByVendor.get(id) ?? 0,
    };
  });

  const vendorIndex = new Map(vendorIds.map((id, i) => [id, i]));

  const ranked = snapshot.models
    .filter((m) => !m.retiredAt && m.benchmarks?.eci != null)
    .sort((a, b) => b.benchmarks.eci! - a.benchmarks.eci!);
  const rankOf = new Map(ranked.map((m, i) => [m.id, i + 1]));

  const models: IndexModel[] = snapshot.models.map((m) => ({
    s: m.slug,
    n: m.name,
    v: vendorIndex.get(m.vendorId)!,
    k: kindOf(m),
    r: rankOf.get(m.id) ?? null,
    ...(m.openWeights === true ? { w: 'o' as const } : m.openWeights === false ? { w: 'c' as const } : {}),
    ...(m.retiredAt ? { x: 1 as const } : {}),
  }));

  return { generatedAt: snapshot.generatedAt, vendors, models };
}

export type ConceptDimension = 'kind' | 'weights' | 'region';

export interface Concept {
  id: string;
  dimension: ConceptDimension;
  value: string;
  label: string;
  hint: string;
  keywords: string[];
}

export const CONCEPTS: readonly Concept[] = [
  {
    id: 'multimodal',
    dimension: 'kind',
    value: 'multimodal',
    label: '多模态',
    hint: '除纯文本以外的全部：能看图、能听声、能出图出视频',
    keywords: ['多模态', '多模', 'multimodal', 'mm', '非纯文本'],
  },
  {
    id: 'vision',
    dimension: 'kind',
    value: 'vision',
    label: '视觉',
    hint: '能看图或看视频，输出文字',
    keywords: ['视觉', '看图', '识图', '图片理解', '图像理解', '读图', 'vision', 'vl', 'vlm'],
  },
  {
    id: 'omni',
    dimension: 'kind',
    value: 'omni',
    label: '全模态',
    hint: '既能听声音又能看画面',
    keywords: ['全模态', '又听又看', 'omni'],
  },
  {
    id: 'image-gen',
    dimension: 'kind',
    value: 'image-gen',
    label: '图像生成',
    hint: '输出里含图片',
    keywords: ['图像生成', '文生图', '画图', '出图', '生图', '绘图', '生成图片', 'imagegen', 'texttoimage', 't2i'],
  },
  {
    id: 'video-gen',
    dimension: 'kind',
    value: 'video-gen',
    label: '视频生成',
    hint: '输出里含视频',
    keywords: ['视频生成', '文生视频', '出视频', '生成视频', 'videogen', 'texttovideo', 't2v'],
  },
  {
    id: 'speech',
    dimension: 'kind',
    value: 'speech',
    label: '语音',
    hint: '语音识别、语音合成，或只听不看的语音对话',
    keywords: ['语音', '声音', '音频', '语音识别', '语音合成', '转写', 'speech', 'audio', 'tts', 'asr', 'voice'],
  },
  {
    id: 'text',
    dimension: 'kind',
    value: 'text',
    label: '文本',
    hint: '只读文字、只出文字',
    keywords: ['文本', '纯文本', '文字', 'text', 'llm'],
  },
  {
    id: 'open',
    dimension: 'weights',
    value: 'open',
    label: '开源',
    hint: '权重公开，可以自己部署',
    keywords: ['开源', '开放权重', '权重公开', '可自部署', 'open', 'openweights', 'opensource'],
  },
  {
    id: 'closed',
    dimension: 'weights',
    value: 'closed',
    label: '闭源',
    hint: '权重不公开，只能走 API',
    keywords: ['闭源', '不开源', '闭源模型', 'closed', 'proprietary'],
  },
  {
    id: 'east',
    dimension: 'region',
    value: 'east',
    label: '国内',
    hint: '总部在中国（含港澳台）的厂商',
    keywords: ['国内', '国产', '中国', '大陆', 'china', 'chinese', 'domestic'],
  },
  {
    id: 'west',
    dimension: 'region',
    value: 'west',
    label: '国外',
    hint: '总部在中国以外的厂商',
    keywords: ['国外', '海外', '外国', 'foreign', 'overseas', 'us'],
  },
];

function fold(s: string): string {
  return s.toLowerCase().replace(/[\s._\-/·、，,]+/g, '');
}

export interface ShortcutHit {
  label: string;
  hint: string;
  href: string;
  count: number | null;
  vendor: IndexVendor | null;
}

export interface VendorHit {
  vendor: IndexVendor;
  href: string;
}

export interface ModelHit {
  model: IndexModel;
  vendor: IndexVendor;
  href: string;
}

export interface SearchResult {
  shortcuts: ShortcutHit[];
  vendors: VendorHit[];
  models: ModelHit[];
  modelTotal: number;
}

const EMPTY: SearchResult = { shortcuts: [], vendors: [], models: [], modelTotal: 0 };

const MAX_VENDORS = 4;
const MAX_MODELS = 8;

function conceptScore(keywords: readonly string[], token: string): number {
  let best = 0;
  for (const kw of keywords) {
    if (kw === token) best = Math.max(best, 3);
    else if (token.length >= 2 && kw.startsWith(token)) best = Math.max(best, 2);
    else if (kw.length >= 2 && token.includes(kw)) best = Math.max(best, 1);
  }
  return best;
}

function bestBy<T>(items: readonly T[], score: (t: T) => number): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  for (const item of items) {
    const s = score(item);
    if (s > 0 && (best == null || s > best.score)) best = { item, score: s };
  }
  return best;
}

function vendorScore(v: IndexVendor, token: string): number {
  const n = fold(v.n);
  const id = fold(v.i);
  if (n === token || id === token) return 3;
  if (n.startsWith(token) || id.startsWith(token)) return 2;
  if (token.length >= 2 && (n.includes(token) || id.includes(token))) return 1;
  return 0;
}

function matchesConcept(c: Concept, m: IndexModel, v: IndexVendor): boolean {
  switch (c.dimension) {
    case 'kind':
      return c.value === 'multimodal' ? m.k != null && m.k !== 'text' : m.k === c.value;
    case 'region':
      return v.c === c.value;
    case 'weights':
      return m.w === (c.value === 'open' ? 'o' : 'c');
  }
}

export function runSearch(index: SearchIndex | null, raw: string): SearchResult {
  const query = raw.trim();
  if (!index || query === '') return EMPTY;

  const tokens = query.split(/[\s　]+/).filter(Boolean).map(fold).filter(Boolean);
  const q = fold(query);
  if (q === '') return EMPTY;

  const shortcuts: ShortcutHit[] = [];
  const picked: Concept[] = [];
  let pickedVendor: IndexVendor | null = null;
  let allUnderstood = tokens.length > 0;

  for (const t of tokens) {
    const c = bestBy(CONCEPTS, (x) => conceptScore(x.keywords, t));
    if (c && !picked.some((p) => p.dimension === c.item.dimension)) {
      picked.push(c.item);
      continue;
    }
    const v = bestBy(index.vendors, (x) => vendorScore(x, t));
    if (v && pickedVendor == null) {
      pickedVendor = v.item;
      continue;
    }
    if (!c) allUnderstood = false;
  }

  if (picked.length > 0 && allUnderstood) {
    const vendorId = pickedVendor?.i ?? null;
    const count = index.models.filter(
      (m) =>
        !m.x &&
        (vendorId == null || index.vendors[m.v].i === vendorId) &&
        picked.every((c) => matchesConcept(c, m, index.vendors[m.v])),
    ).length;

    // 根据选取的概念定位到首页区域
    let targetHref = '#top';
    if (picked.some((c) => c.dimension === 'kind')) {
      targetHref = '#kinds-heading';
    } else if (pickedVendor) {
      targetHref = `#vendor-${pickedVendor.i}`;
    } else if (picked.some((c) => c.value === 'east')) {
      targetHref = '#region-east';
    } else if (picked.some((c) => c.value === 'west')) {
      targetHref = '#region-west';
    }

    shortcuts.push({
      label: [pickedVendor?.n, ...picked.map((c) => c.label)].filter(Boolean).join(' · '),
      hint: picked.map((c) => c.hint).join('；'),
      href: targetHref,
      count,
      vendor: pickedVendor,
    });
  }

  const vendorHits: { hit: VendorHit; score: number }[] = [];
  for (const v of index.vendors) {
    const s = vendorScore(v, q);
    if (s > 0) vendorHits.push({ hit: { vendor: v, href: `#vendor-${v.i}` }, score: s });
  }
  vendorHits.sort((a, b) => b.score - a.score || b.hit.vendor.t - a.hit.vendor.t);

  const modelHits: { hit: ModelHit; score: number }[] = [];
  for (const m of index.models) {
    const name = fold(m.n);
    const vendor = index.vendors[m.v];
    let score = 0;
    if (name === q) score = 4;
    else if (name.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 2;
    else if (fold(m.s).includes(q) || fold(vendor.n).includes(q)) score = 1;
    if (score === 0) continue;
    modelHits.push({ hit: { model: m, vendor, href: `/model/${m.s}/` }, score });
  }
  modelHits.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const ax = a.hit.model.x ? 1 : 0;
    const bx = b.hit.model.x ? 1 : 0;
    if (ax !== bx) return ax - bx;
    const ar = a.hit.model.r ?? Number.POSITIVE_INFINITY;
    const br = b.hit.model.r ?? Number.POSITIVE_INFINITY;
    if (ar !== br) return ar - br;
    return a.hit.model.n.localeCompare(b.hit.model.n);
  });

  return {
    shortcuts: shortcuts.slice(0, 3),
    vendors: vendorHits.slice(0, MAX_VENDORS).map((x) => x.hit),
    models: modelHits.slice(0, MAX_MODELS).map((x) => x.hit),
    modelTotal: modelHits.length,
  };
}
