/**
 * 厂商 → 官方 logo 的映射表。
 *
 * 只有确认是「该厂商自己的标识」的条目才写在这里。**宁可留空走兜底单字徽章，
 * 也不拿一个近似的商标充数**——标错认的 logo 比没有 logo 更糟，
 * 尤其在读者只扫一眼的情况下。
 *
 * 键是快照里的 `vendorId`，`file` 指向 `public/logos/<file>.svg`。
 * 没有条目、或条目值为 null，都会回落到 `VendorLogo` 的单字徽章。
 *
 * 素材来源见 `source` 字段，由 `scripts/vendor-logos.ts` 负责落盘。
 */

export type LogoSource = 'lobe-icons' | 'official';

export interface VendorLogoRef {
  /** `public/logos/` 下的文件名（不含扩展名）。来自 lobe-icons 时即其 slug */
  file: string;
  source: LogoSource;
  /** `official` 时填资源原始出处，便于复核；`lobe-icons` 时省略 */
  origin?: string;
}

/**
 * 自托管素材版。**不含** `-color` / `-brand` / `-text` 变体：
 * 槽位只有 20~32px 且按单色渲染，多色变体在这个尺寸下会糊，字标则完全不可辨。
 */
export const VENDOR_LOGOS: Record<string, VendorLogoRef | null> = {
  ai21: { file: 'ai21', source: 'lobe-icons' },
  'aion-labs': { file: 'aionlabs', source: 'lobe-icons' },
  alibaba: { file: 'alibaba', source: 'lobe-icons' },
  /* 亚马逊的模型跑在 Bedrock 上，官网字段也指向 aws.amazon.com/bedrock */
  amazon: { file: 'aws', source: 'lobe-icons' },
  anthropic: { file: 'anthropic', source: 'lobe-icons' },
  'arcee-ai': { file: 'arcee', source: 'lobe-icons' },
  baidu: { file: 'baidu', source: 'lobe-icons' },
  'bytedance-seed': { file: 'bytedance', source: 'lobe-icons' },
  cohere: { file: 'cohere', source: 'lobe-icons' },
  deepseek: { file: 'deepseek', source: 'lobe-icons' },
  fireworks: { file: 'fireworks', source: 'lobe-icons' },
  google: { file: 'google', source: 'lobe-icons' },
  ibm: { file: 'ibm', source: 'lobe-icons' },
  inception: { file: 'inception', source: 'lobe-icons' },
  'inference-net': { file: 'inference', source: 'lobe-icons' },
  kwaipilot: { file: 'kwaipilot', source: 'lobe-icons' },
  /* 快照里这家的中文名就叫「美团龙猫」，用 LongCat 标识与展示名一致 */
  meituan: { file: 'longcat', source: 'lobe-icons' },
  meta: { file: 'meta', source: 'lobe-icons' },
  microsoft: { file: 'microsoft', source: 'lobe-icons' },
  minimax: { file: 'minimax', source: 'lobe-icons' },
  mistral: { file: 'mistral', source: 'lobe-icons' },
  moonshotai: { file: 'moonshot', source: 'lobe-icons' },
  morph: { file: 'morph', source: 'lobe-icons' },
  nousresearch: { file: 'nousresearch', source: 'lobe-icons' },
  nvidia: { file: 'nvidia', source: 'lobe-icons' },
  openai: { file: 'openai', source: 'lobe-icons' },
  perceptron: { file: 'perceptron', source: 'lobe-icons' },
  perplexity: { file: 'perplexity', source: 'lobe-icons' },
  poolside: { file: 'poolside', source: 'lobe-icons' },
  /* 快照里的 id 是 rekaai，注册表与 lobe-icons 都叫 reka */
  rekaai: { file: 'reka', source: 'lobe-icons' },
  relace: { file: 'relace', source: 'lobe-icons' },
  sakana: { file: 'sakana', source: 'lobe-icons' },
  stepfun: { file: 'stepfun', source: 'lobe-icons' },
  tencent: { file: 'tencent', source: 'lobe-icons' },
  upstage: { file: 'upstage', source: 'lobe-icons' },
  xai: { file: 'xai', source: 'lobe-icons' },
  /* lobe-icons 只收录了小米的 AI 子品牌 MiMo，没有集团标识 */
  xiaomi: { file: 'xiaomimimo', source: 'lobe-icons' },
  zhipuai: { file: 'zhipu', source: 'lobe-icons' },

  /*
   * Sarvam AI：官网 brand 资源里有白底字标版，但字标在 20px 槽位不可辨；
   * 改用他们自家的 compact favicon，是唯一能在这个尺寸下读出来的官方标识。
   */
  sarvam: { file: 'sarvam', source: 'official', origin: 'https://www.sarvam.ai/favicon.svg' },

  /*
   * 以下几家**确认没有可用的官方图形标识**，显式登记为 null 而不是省略，
   * 免得后来者以为只是漏了。理由逐条写在下面。
   */

  /* 官网 header 就是一行样式化文字（THINKING MACHINES），无 svg/img，favicon 是纯色方块 */
  thinkingmachines: null,
  /* 没有官网 */
  deepreinforce: null,
  /*
   * AI Singapore：官网对自动化访问返回 403，唯一可得的官方标识是 GitHub 组织头像，
   * 而它是 304×304 的 RGB 位图、**不带 alpha**、米色底。放在深色底上是一块亮方块，
   * 既遮不住也掩不出剪影。
   */
  aisingapore: null,
  /*
   * 蚂蚁百灵（Ling）：站点是纯客户端渲染的 SPA，没有 favicon、也没有静态 logo 文件；
   * 标识只存在于 JS bundle 里的一个 Ant/Alipay CDN 链接，是 600×712 的彩色索引位图，
   * 在 20px 单色槽位里不可辨。
   */
  inclusionai: null,
  /* 官网只给出 792×275 的彩色马赛克组合标（含字标），且混着开发服务器注入的 script 块 */
  sdaia: null,
  /* 只拿得到 100×23 的字标（且官网对自动化访问 403，需借其开发者门户转取） */
  trendyol: null,
  /* Writer 没有可核实的官方图形标识 */
  writer: null,
  /*
   * 以下各家是社区微调者或推理托管商，不是有品牌标识的模型厂商。
   * 它们在 roster.ts 里都会被归入折叠区（others），默认不出现在首页。
   */
  'anthracite-org': null,
  cognitivecomputations: null,
  gryphe: null,
  mancer: null,
  mixedbread: null,
  'motif-technologies': null,
  'nex-agi': null,
  openbmb: null,
  'prism-ml': null,
  quiverai: null,
  sao10k: null,
  stealth: null,
  'swiss-ai': null,
  thedrummer: null,
  typesafe: null,
  unbiased: null,
  undi95: null,
  vispark: null,
  vivgrid: null,
};

export function logoFor(vendorId: string): VendorLogoRef | null {
  return VENDOR_LOGOS[vendorId] ?? null;
}
