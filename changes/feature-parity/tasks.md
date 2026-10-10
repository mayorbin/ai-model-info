# 实现任务

## 交付与证明

| 批次 | 交付结果 | 依赖 | 证明 |
|---|---|---|---|
| 1 | 厂商详情页 `/vendor/[id]` 上线 | 无 | 3 家厂商页 1440/390 截图 + 404 兜底 |
| 2 | 排行榜 `/leaderboard` 与总表 `/leaderboard/all` 上线 | 1 | 带 query 的 URL 复原筛选态 + `npm run check` |
| 3 | 时间线 `/chronicle` 与对比页 `/compare` 上线 | 1 | 刷新不丢选择 + 无共同成绩池不判胜负 |
| 4 | 全站入口收口与统一验证 | 1–3 | `npm run verify` + `npm run shots` 双断点 |

## 任务

### 批次 1 · 厂商详情页

- [x] **1.1 建立厂商页路由**：`src/app/vendor/[slug]/`，`generateStaticParams` 枚举 `VENDOR_REGISTRY` 全部厂商，未收录 id 走 notFound。证明：`npm run build` 后 65 家厂商页出现在 `out/vendor/`。
- [x] **1.2 厂商页头部**：官方 logo（复用 `src/data/vendor-logos.ts`）+ 中文名 + 品牌色左缘条 + 国别与国内/国外归属 + 主页外链。证明：`npx tsc --noEmit` + 截图。
- [x] **1.3 厂商页主体**：该厂全部模型按发布月份分组（参考 `ai-model-world` vendor 页的分组逻辑，用本项目卡片语言重写），含数据溯源区（与首页/详情页同款式）。证明：3 家厂商页 1440/390 截图无横向滚动。

### 批次 2 · 排行榜与总表

- [x] **2.1 排行榜派生层**：对齐参考项目的分榜清单（智力/性价比/上下文/价格/编程赛制）到 `src/lib/`，复用本项目已有 `derive.ts`/`champions.ts` 口径。证明：`npx tsc --noEmit`。
- [x] **2.2 排行榜页面**：`src/app/leaderboard/page.tsx`，分榜 tab + 表格化排行。证明：`npm run build` + 截图。
- [x] **2.3 筛选与 URL query 同步**：地区（国内/国外）、开源/闭源、类型、退役四维筛选，状态同步 URL query（借鉴参考项目 `useUrlQuery.ts`，静态导出下客户端读取）。证明：带 query 的 URL 直接打开能复原筛选态。
- [x] **2.4 总表页面**：`src/app/leaderboard/all/page.tsx` 全模型平铺，关键列（名称/厂商/类型/发布/上下文/价格/退役），复用 2.3 的筛选交互，行内链接到模型与厂商页。证明：`npm run check` 过（行数与既有口径不冲突）。

### 批次 3 · 时间线与对比页

- [ ] **3.1 时间线页面**：`src/app/chronicle/page.tsx` 全模型按发布月份分桶、时间倒序，年份锚点导航（复用首页锚点导航模式）。证明：双断点截图；月份桶内模型总数守恒人工核对一次。
- [ ] **3.2 对比数据静态化**：构建期生成对比数据 JSON（参照 `scripts/search-index.ts` 的 prebuild 做法，替代参考项目的动态 `/compare-data.json` 路由）。证明：`npm run build` 后产物含该 JSON。
- [ ] **3.3 对比页选择器**：`src/app/compare/page.tsx` 模型选择接现有全局搜索索引，最多选 4 个，localStorage 持久化。证明：刷新页面选择不丢。
- [ ] **3.4 对比页对照与胜负判定**：并排对照能力刻度、上下文、价格、编程成绩；同成绩池才判胜负（移植参考项目 `compare/insights.ts` 的判据）。证明：两个无共同成绩池的模型不显示胜负。

### 批次 4 · 收口与验证

- [ ] **4.1 全站入口**：首页锚点导航/页脚补 4 个新页面入口；厂商卡片（首页 roster）链接到厂商详情页；排行榜行链接到模型/厂商页。证明：从首页可一次跳达全部 5 个新页面。
- [ ] **4.2 统一验证**：`npm run verify` 四项全过；`npm run shots` 1440/390 含新页面截图自查；组件行数自查（`find src/components -name "*.tsx" -exec wc -l {} + | sort -rn | head -20` 无超 400，目标 250）；`changes/feature-parity/` 下补记验证结论。证明：上述命令输出全绿。
