/**
 * 多语言。首版只有中文，英文放第二期。
 *
 * 架子的设计要点：所有页面文案都由结构化数据套模板生成，不展示上游返回的任何自由文本，
 * 所以增加一门语言 = 增加一份字典，不需要翻译服务，也不存在「新模型出现时英文版滞后」的问题。
 * 视图组件一律接收 `lang` 参数，第二期只需新增 src/app/en/ 这层薄路由即可。
 */

export const LANGS = ['zh', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'zh';

export interface Dict {
  siteName: string;
  siteTagline: string;
  siteDescription: string;

  nav: {
    overview: string;
    chronicle: string;
    leaderboard: string;
    compare: string;
    /**
     * 尚未实现的路由旁边那句解释。
     * 上一版写的是「该页面不在本次变更范围内」——那是**发布流程的语言**，
     * 读者不关心变更范围，他只想知道是不是自己点错了。改成说人话。
     */
    unbuilt: string;
  };

  continent: {
    west: string;
    east: string;
  };

  /** 擂台赛道名。键与 Benchmarks 的字段以及派生指标对应。 */
  track: {
    eci: string;
    swe_bench_verified: string;
    value: string;
    memory: string;
    cheap: string;
    hardcore: string;
    webdev_arena_elo: string;
  };

  /** 模型属性的展示标签 */
  attr: {
    releaseDate: string;
    knowledgeCutoff: string;
    contextWindow: string;
    maxOutput: string;
    inputPrice: string;
    outputPrice: string;
    cachedInputPrice: string;
    params: string;
    trainingCompute: string;
    license: string;
    openWeights: string;
    modalities: string;
    toolCall: string;
    reasoning: string;
    promptCaching: string;
    structuredOutput: string;
    /** 模型类型（文本 / 视觉 / …），见 kind.ts */
    kind: string;
  };

  /**
   * 模型类型的名称与一句话解释。键对应 kind.ts 的 ModelKind。
   * 名称要短到能当筛选按钮，解释要让外行一眼明白判定依据。
   */
  kind: {
    label: Record<'text' | 'vision' | 'omni' | 'image-gen' | 'video-gen' | 'speech', string>;
    hint: Record<'text' | 'vision' | 'omni' | 'image-gen' | 'video-gen' | 'speech', string>;
    /** 上游没标模态时的兜底 */
    unknown: string;
    /** 筛选条上「类型」这一组的标题 */
    filterLabel: string;
    /** 跨类的「多模态」筛选：除纯文本以外的全部 */
    multimodal: string;
    multimodalHint: string;
    /** 首页「按类型看」那一块的标题 */
    sectionTitle: string;
    /** 每张类型卡上大数字后面的单位 */
    countUnit: string;
    /** 卡片悬停提示：「点开看全部 N 个 xx 模型」 */
    viewAll: (n: number, label: string) => string;
  };

  /**
   * 卡片上的状态徽章。语义有且只有这五种，
   * 每一种都必须对应一个能从数据里判定的事实，不做装饰性徽章。
   */
  badge: {
    /** 发布日期在 30 天以内 */
    fresh: string;
    retired: string;
    /** 没有任何第三方综合评测成绩 */
    unranked: string;
    /** 成绩由厂商自报，未经独立复核 */
    selfReported: string;
    /** 只有 id 与发布日期，缺价格与上下文 */
    partialData: string;
  };

  /** 卡片底部那行事实里的开放权重状态 */
  openness: {
    open: string;
    closed: string;
  };

  /** 数据缺失与可信度提示。这些措辞是这个站的诚信底线，改动需谨慎。 */
  unknown: {
    /** 参数量是推算出来的，官方从未公布 */
    sizeEstimated: string;
    /** 有参数量但来自型号名推断而非官方权重文件时的提示 */
    sizeApprox: string;
    noData: string;
    /** 能力条空槽里的短文案：没测过，不是零分 */
    notMeasured: string;
    /** 只被多源发现收录、缺少价格与上下文的模型 */
    singleSource: string;
    /** 只精确到月的发布日期 */
    monthOnly: (year: number, month: number) => string;
  };

  status: {
    /** 距今天数 */
    ageDays: (days: number) => string;
    ageYears: (years: number) => string;
  };

  /** 首页厂商分组 */
  plaza: {
    /** 区域标题后的计数 */
    vendorCount: (n: number) => string;
    /** 折叠区：数据太少、进不了默认列表的厂商 */
    moreVendors: (n: number) => string;
    /** 按厂商实力分的街区。分组依据见 roster.ts */
    tier: {
      top: string;
      main: string;
      unscored: string;
    };
    /**
     * 档位名旁边**常显**的一句话注解，tierHint 的压缩版。
     * 档位是这一页的骨架，而它凭什么这么分原先只有鼠标用户知道（挂在 title 上）。
     */
    tierShort: {
      top: string;
      main: string;
      unscored: string;
    };
    tierHint: {
      top: string;
      main: string;
      unscored: string;
    };
    /** 本家有更新的型号、但它没资格替下门面时，分组头上那条提示 */
    newer: (name: string) => string;
    /** 上面那条提示用的短徽章 */
    newerBadge: string;
    newerHint: (name: string, date: string) => string;
  };

  /** 首屏的页内分区跳转。这一页在 390px 下有一万多像素，没有它就没有第二条路 */
  sectionNav: {
    /** 跳转行的可见前缀 */
    label: string;
    /** nav 的无障碍名 */
    ariaLabel: string;
  };

  /** 首屏「今日格局」冠军横条 */
  champions: {
    title: string;
    smart: string;
    code: string;
    value: string;
    cheap: string;
    memory: string;
    newest: string;
    east: string;
    open: string;
  };

  /** 页脚之前的「综合智力排行」。补的是「可上下扫的完整次序」这个缺口 */
  leaderboard: {
    title: string;
    count: (n: number) => string;
    /** 排序轴说明。正文里第一次给出 ECI 的全称 */
    note: string;
    /** sr-only：多列栅格在线性读屏里说不清列的含义 */
    columns: string;
    expand: (n: number) => string;
    collapse: string;
  };

  /** 顶栏状态行 */
  hud: {
    updatedAt: (date: string) => string;
    modelCount: (models: number, vendors: number) => string;
    /** 数据源在线数，如「数据源 6/6」 */
    sources: (ok: number, total: number) => string;
  };

  footer: {
    dataFrom: string;
    credits: string;
    author: string;
    sourceCode: string;
    sourceCodeHint: string;
    /** 页脚的回顶链接。390px 下这一页有一万多像素，走到页脚时它就是用得上的时候 */
    backToTop: string;
  };

  /**
   * 模型详情页。首页的每一个结论都必须有地方可追——
   * 冠军卡、厂商卡、排行行全部指向这里，所以这一节文案是首页「可点」的兑现条件。
   */
  model: {
    /** 返回总览 */
    back: string;
    section: {
      /** 能力与读数 */
      metrics: string;
      /** 全部评测成绩 */
      scores: string;
      /** 数据出处 */
      provenance: string;
      /** 同厂其他型号 */
      siblings: string;
    };
    /** 头部名次行。分母与排行区同源（rankByEci 的池子大小） */
    rank: (rank: number, total: number) => string;
    /** 没有第三方综合成绩时的头部说明 */
    unranked: string;
    /** 已退役提示 */
    retired: string;
    /** 成绩表计数 */
    scoreCount: (n: number) => string;
    /** 一条成绩都没有 */
    noScores: string;
    provenanceNote: string;
    /** 数据出处那一区的计数，如「23 个字段」 */
    fieldCount: (n: number) => string;
    siblingCount: (n: number) => string;
    noSiblings: string;
  };
}

/*
 * 文案原则：
 *
 * 1. **直说**。「西岸都会 / 东方城邦」改成「国外 / 国内」，「往生堂」改成「已退役」，
 *    「听你说话的价格」改成「输入价格」。界面文字只负责让人一秒看懂。
 * 2. **不说废话**。自我介绍式的开场全部删掉——用户点进来是看格局的，不是来听站点自述的。
 * 3. 保留少量有信息量的口语词：「记性」比「上下文窗口」对外行更好懂，这类留着。
 * 4. **不用世界观的词**：小屋、街道、居民、旅人、家徽一律不出现——它们要读者先理解隐喻。
 */
const zh: Dict = {
  siteName: '模型情报',
  siteTagline: '一眼看懂大模型的当下格局',
  siteDescription:
    '把「谁最聪明、谁最会编程、谁最便宜」摆在明面上，用能力条和排行榜横向比较。数据来自第三方公开评测，自动同步。',

  nav: {
    overview: '总览',
    chronicle: '时间线',
    leaderboard: '排行榜',
    compare: '对比',
    unbuilt: '这个页面还没有做',
  },

  continent: {
    west: '国外',
    east: '国内',
  },

  track: {
    eci: '综合智力',
    swe_bench_verified: '编程',
    value: '性价比',
    memory: '上下文',
    cheap: '最便宜',
    hardcore: '硬核推理',
    webdev_arena_elo: '实战口碑',
  },

  attr: {
    releaseDate: '发布日期',
    knowledgeCutoff: '知识截止',
    contextWindow: '上下文窗口',
    maxOutput: '单次最大输出',
    inputPrice: '输入价格',
    outputPrice: '输出价格',
    cachedInputPrice: '缓存输入价格',
    params: '参数量',
    trainingCompute: '训练算力',
    license: '开源许可',
    openWeights: '开放权重',
    modalities: '支持的输入',
    toolCall: '工具调用',
    reasoning: '深度思考',
    promptCaching: '提示缓存',
    structuredOutput: '结构化输出',
    kind: '模型类型',
  },

  kind: {
    label: {
      text: '文本',
      vision: '视觉',
      omni: '全模态',
      'image-gen': '图像生成',
      'video-gen': '视频生成',
      speech: '语音',
    },
    hint: {
      text: '只读文字、只写文字的对话模型',
      vision: '除了文字还能看图片或视频，输出文字',
      omni: '能听声音、也能看图，文字、图、声音一起理解',
      'image-gen': '能生成图片',
      'video-gen': '能生成视频',
      speech: '语音识别、语音合成或语音对话，不看图',
    },
    unknown: '类型未知',
    filterLabel: '类型',
    multimodal: '多模态',
    multimodalHint: '除纯文本以外的全部：能看图、能听声、能出图出视频',
    sectionTitle: '按类型看',
    countUnit: '个',
    viewAll: (n, label) => `查看全部 ${n} 个${label}模型`,
  },

  badge: {
    fresh: '新发布',
    retired: '已退役',
    unranked: '未参评',
    selfReported: '自报',
    partialData: '资料不全',
  },

  openness: {
    open: '开源',
    closed: '闭源',
  },

  unknown: {
    sizeEstimated: '规模为估算值，官方从未公布参数量',
    sizeApprox: '参数量由型号名推断，非官方权重实测',
    noData: '暂无数据',
    /*
     * 能力条空槽里的那句短文案。它此前是一个「—」——一个破折号既可能是「没测过」
     * 也可能是「得了零分」，而这一页最贵的一条区分恰恰就是这两个。
     * 参考项目在同一个位置写「暂无」但只有 2.71:1 的对比度；这里取「未测」，
     * 两个字、放得下 8 格条的右端，且与 `fill: 0`（真的零分）在字面上就分得开。
     */
    notMeasured: '未测',
    singleSource: '单源数据，未经交叉校验',
    monthOnly: (year, month) => `${year} 年 ${month} 月`,
  },

  status: {
    ageDays: (days) => `${days} 天前发布`,
    ageYears: (years) => `发布 ${years} 年`,
  },

  plaza: {
    vendorCount: (n) => `${n} 家`,
    moreVendors: (n) => `还有 ${n} 家资料不全的厂商`,
    tier: {
      top: '头部',
      main: '主力',
      unscored: '尚无评测',
    },
    tierShort: {
      top: '厂商实力前十',
      main: '参加过第三方评测',
      unscored: '没有第三方成绩',
    },
    tierHint: {
      top: '实力排名前十的厂商，按各家头号模型的综合智力算',
      main: '参加过第三方综合评测的厂商',
      unscored: '还没有任何第三方综合评测成绩',
    },
    newer: (name) => `本家更新：${name}`,
    newerBadge: '本家更新',
    /*
     * 这条提示的定位是「不动选拔结果，只说出事实」（见 roster.ts 的 newerThanFlagship）。
     * 它曾以「点这行可以直接去看它。」结尾——而它挂在 `VendorSection` 一个没有链接的 `<p>` 上，
     * 详情路由也不在交付范围内，于是那句话承诺了一个永远不会发生的动作。
     * **事实可以写在 title 里，动作不行**：要么有链接，要么别这么说。
     */
    newerHint: (name, date) =>
      `${name} 发布于 ${date}，比当前展示的这位更新。\n` +
      '这里展示的是这家当下实力第一的型号，而新型号往往还没拿到第三方评测成绩，\n' +
      '所以不会仅因为「更新」就替换。',
  },

  sectionNav: {
    label: '跳到',
    ariaLabel: '页内分区跳转',
  },

  champions: {
    title: '今日格局',
    smart: '最聪明',
    code: '最会编程',
    value: '最划算',
    cheap: '最便宜',
    memory: '记性最好',
    newest: '最新发布',
    east: '国内第一',
    open: '开源第一',
  },

  leaderboard: {
    title: '综合智力排行',
    count: (n) => `${n} 个有成绩的模型`,
    note: '按 ECI（Epoch AI 的 Epoch Capabilities Index）从高到低；分数相同的模型并列同名次。',
    columns: '每行依次是：名次、型号、厂商、综合智力指数。',
    expand: (n) => `展开其余 ${n} 个`,
    collapse: '收起',
  },

  hud: {
    updatedAt: (date) => `数据更新于 ${date}`,
    modelCount: (models, vendors) => `${models} 个模型 · ${vendors} 家厂商`,
    sources: (ok, total) => `数据源 ${ok}/${total}`,
  },

  footer: {
    dataFrom: '数据来自',
    credits: '素材署名',
    author: '作者',
    sourceCode: '源码开源',
    sourceCodeHint: '本站代码与数据管线全部开源（MIT）',
    backToTop: '回到顶部',
  },

  model: {
    back: '返回总览',
    section: {
      metrics: '能力与读数',
      scores: '全部评测成绩',
      provenance: '数据出处',
      siblings: '同厂其他型号',
    },
    rank: (rank, total) => `在 ${total} 个有第三方综合成绩的模型里排第 ${rank}`,
    unranked: '没有第三方综合智力成绩。没测过不等于不聪明。',
    retired: '已退役。已退役的模型不参与首页的任何一处展示与名次。',
    scoreCount: (n) => `${n} 条成绩`,
    noScores:
      '公开渠道没有查到任何评测成绩。这不代表它不会写代码或者不聪明，只代表没有第三方测过它。',
    provenanceNote:
      '逐字段记录这条数据是从哪里读到的。同一个模型的不同字段来自不同上游时，以本表为准。',
    fieldCount: (n) => `${n} 个字段`,
    siblingCount: (n) => `${n} 个型号`,
    noSiblings: '这家厂商在本快照里只有这一个型号。',
  },
};

/**
 * 第二期在这里加 `en`。视图层已经全部按 lang 参数化，届时是纯增量改动。
 */
const dictionaries: Partial<Record<Lang, Dict>> = { zh };

export function getDict(lang: Lang): Dict {
  return dictionaries[lang] ?? zh;
}

export function htmlLang(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en';
}
