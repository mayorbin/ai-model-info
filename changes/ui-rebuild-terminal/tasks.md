# 实现任务

## 交付与证明

| 批次 | 交付结果 | 依赖 | 证明 |
|---|---|---|---|
| 1 | 新工程可编译；数据层与派生逻辑就位，首页能读出快照 | 无 | `npx tsc --noEmit` + 快照计数打印 |
| 2 | 设计 token 与原子组件就位；45 家厂商 logo 全部可显示 | 1 | `/styleguide` 页 1440 / 390 截图 |
| 3 | 首页广场完整可用 | 2 | `npm run build` + 1440 / 390 截图 |
| 4 | 收尾核验：lint / 类型 / 构建 / 数字一致性 | 3 | `npx eslint src` + 计数核对 |

## 任务

### 批次 1 · 脚手架与数据层移植

- [x] **1.1 建立工程脚手架**：新建 `package.json`（next 16 / react 19 / tailwind 4 / tsx / playwright，devDeps 去除 sharp）、`tsconfig.json`、`next.config.ts`（保留 `output: 'export'`、`trailingSlash: true`、`images.unoptimized: true`，**删除** `NEXT_BASE_PATH` 分支）、`postcss.config.mjs`、`eslint.config.mjs`、`.gitignore`。证明：`npm run build` 在临时首页上通过。
- [x] **1.2 原样移植纯数据层**：复制 `src/data/{vendor-registry,coding-leagues,benchmark-registry,official-scores}.ts` 与 `src/lib/{types,snapshot,sample-snapshot,scores,kind,format,color,coding-consensus,outbound}.ts`，改 `@/` 别名指向新工程。**不复制** `crests.ts`、`sprite*`、`assets.ts`。证明：`npx tsc --noEmit`。
- [x] **1.3 拆分 `derive.ts`**：只保留评分半区 `buildPriceScale` / `buildSizeScale` / `buildValueScore` / `daysSince` / `rankByEci`；删除角色视觉半区 `garmentOf` / `crownOf` / `lifeStageOf` / `signsOf` / `buildComputerScale` / `bookshelfOf` / `shelfDustOf` / `visualOf` / `buildVisualPruning` / `isSingleSource` / `CharacterVisual`。证明：`grep -nE "garmentOf|bookshelfOf|visualOf|crownOf|lifeStageOf" src/lib/derive.ts` 无输出 且 `npx tsc --noEmit`。
- [x] **1.4 移植派生层并去角色化**：复制 `champions.ts` / `roster.ts` / `aptitude.ts` / `coding-consensus.ts`，删掉其中的角色视觉字段与文案；重写 `i18n.ts` 词表，去掉「村落 / 小屋 / 居民 / 旅人 / 往生堂」一类措辞，改为「厂商 / 分组 / 已退役」。证明：`grep -rnE "村落|小屋|居民|旅人|往生堂|家徽" src/lib src/components` 无输出 且 `npx tsc --noEmit`。
- [x] **1.5 落位数据快照**：复制 `data/models.json`、`data/benchmark-attribution.json`（不复制 `bilibili.json`、`params-tier.json`）。证明：`npx tsx -e "..."` 打印 `models` / `vendors` 数量且与源快照一致。
- [x] **1.6 首页最小可渲染冒烟页**：`src/app/page.tsx` 临时渲染「模型数 / 厂商数 / 前 20 个模型名」，验证 `loadSnapshot()` 在新工程 cwd 下能读到数据。证明：`npm run build` 成功且产出 `out/index.html`。

### 批次 2 · 设计系统与图标层

- [x] **2.1 重写 `globals.css`**：按 `design.md` 第一、二节落全部 token（背景 5 级 / 描边 4 级 / 文字 4 级 / 语义色 / 区域色 / 圆角 / 间距）、系统无衬线 + 等宽数字分工、focus ring。删除像素字体 `@font-face`、`image-rendering: pixelated`、零圆角约定。证明：`grep -nE "pixel|Fusion Pixel|--radius-none" src/app/globals.css` 无输出。
- [x] **2.2 新增原子组件**：`src/components/ui/{Panel,StatNumber,MetricBar,Badge,SectionHeading}.tsx`，规格见 `design.md` 第三节。证明：`/styleguide` 页展示全部变体并截图。
- [x] **2.3 新增厂商 logo 映射与组件**：`src/data/vendor-logos.ts`（`vendorId → { slug, color }`，45 家全覆盖）+ `src/components/ui/VendorLogo.tsx`（20/24/32 三档、单色与品牌色两态、兜底单字徽章走 `readableOnDark()`）。证明：`/styleguide` 页渲染全部 45 家，无空白、无缺图。
- [x] **2.4 自托管 logo 资源**：把用到的 SVG 从 `@lobehub/icons-static-svg` 复制到 `public/logos/`，`package.json` 中该包降为 devDependency 或移除（构建期不依赖）；未收录的 8 家（`thinkingmachines` / `sdaia` / `trendyol` / `deepreinforce` / `aisingapore` / `sarvam` / `inclusionai` / `naver`）逐家核实官网可取得的官方 logo 并落地，确认取不到的显式登记为兜底。证明：`ls public/logos | wc -l` + 兜底徽章截图。
- [x] **2.5 新增 `/styleguide` 页**：仅开发用，不进导航（`design.md` 的活体对照）。证明：`npm run build` 后该路由可访问。

### 批次 3 · 首页广场重做

- [ ] **3.1 重写站点头尾与状态行**：`SiteHeader`（站名 + 静态搜索框 + 导航）、`StatusBar`（等宽读数 + 状态灯）、`SiteFooter`。删除 `Sky` / `Ground` / `HorizonEdge` / `GroundBackdrop` / `PageJump`。证明：首页截图。
- [ ] **3.2 重写今日格局**：`ChampionStrip` 8 格响应式网格，**口径完全沿用 `champions.ts`，不改判定规则**，每格含 `VendorLogo`。证明：8 格数值与 `npx tsx` 直接调用 `buildChampions()` 的输出一致。
- [ ] **3.3 重写按类型**：`KindStrip` 6 个 chip 横排，计数来自 `buildKindGroups()`。证明：chip 计数与该函数输出一致。
- [ ] **3.4 重写广场与模型卡片**：`VendorSection`（厂商分组头 + 组体网格）+ `ModelCard`（模型名 / 状态徽章 / 四条能力条 / 一句定位 / 价格与上下文），布局规格见 `design.md` 4.5。替代 `Plaza` + `ModelRoom`。证明：1440 截图确认一屏 ≥ 12 张卡片。
- [ ] **3.5 组装 `page.tsx`**：删除精灵图相关调用（`listSpriteSlugs` / `spriteOverlaysBaked` / `overlaysNeeded`），顺序为 Header → StatusBar → 今日格局 → 按类型 → 广场 → Footer。证明：`npm run build` + 1440 / 390 截图。

### 批次 4 · 收尾核验

- [ ] **4.1 静态检查与构建**：`npx tsc --noEmit`、`npx eslint src`、`npm run build` 三者全过。证明：命令输出。
- [ ] **4.2 截图自查脚本**：新增 `scripts/shots.ts`（playwright，起静态服务指向 `out/`），输出 1440 / 390 两档截图到 `docs/shots/`。证明：`npx tsx scripts/shots.ts` 产出两张图，且无横向滚动。
- [ ] **4.3 数字一致性核对**：首页显示的模型数与厂商数与 `data/models.json` 逐一核对；8 个冠军与 `buildChampions()` 输出逐一核对。证明：核对结果记录。

## 实施备注（仅在必要时）

- **`derive.ts` 拆分是本次最大的一处外科手术**。原 `derive.ts` 同时被评分链路（`champions` / `roster`）与像素美术管线（`scripts/sprites`）引用，是两条链路唯一的共享脊柱。本次只保留评分半区；美术管线不移植。
- **`src/lib/compare.ts` 存在仓库内唯一的 lib → components 反向依赖**（`@/components/compare/types`）。对比页不在本次范围，因此**不移植 `compare.ts`**，该依赖自然不会出现。
- **`src/lib/asset.ts` 可简化为恒等函数**：不再有 B 站 Toy 的 `basePath` 场景，`NEXT_BASE_PATH` 分支与 `asset()` 前缀逻辑一并删除；若保留该文件则直接返回入参。
- **`next.config.ts` 必须保留 `output: 'export'`**：静态导出意味着没有服务端运行时，所有数据都必须在构建期由 `loadSnapshot()` 解析完成；这也是本次不接搜索接口（需要 `public/search-index.json` 构建步骤）的原因。
- **`search.ts` 刻意使用相对导入**以便 `tsx` 直接运行。本次不移植搜索，若后续批次补上，需保留其相对导入写法。
- **快照读取是 cwd 相对的**（`snapshot.ts` 硬编码 `join(process.cwd(), 'data', 'models.json')`），所以 `data/` 目录必须随工程一起存在，构建与截图脚本都要在工程根目录执行。
