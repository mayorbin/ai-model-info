# Final review — feature-parity

范围：`48a4666..2886b5b`（5 个提交，48 文件，+4140 / −50）
评论政策：Native `final`（单次整体评审，覆盖规格符合性与代码质量）

## 一、规格符合性

proposal 的 5 项差距与 tasks 的 4 个批次全部落地，逐条对证明复核：

| 任务 | 证明（本次复核方式） |
|---|---|
| 1.1–1.3 厂商页 | 构建产物含 65 个 `vendor/*/index.html`；`ai21`/`deepseek`/`openai` 双断点截图无溢出；h1/时间线/溯源区/类型构成/退役计数在产物中逐项 grep 命中 |
| 2.1–2.4 排行榜与总表 | `buildTrackIndex` 复用既有派生层（未新写第二套口径）；实测 `?region=east&kind=vision&weights=open&track=eci` 复原 4 个按下 chip 与 9 行；总表 `?sort=price&dir=asc&region=east` 升序首行 $0.03；点击筛选后 URL 被写回 |
| 3.1 时间线 | 4 个年份区 / 40 个月份行 / 635 个型号 = 快照模型数（守恒）；年份锚点 4 条 |
| 3.2–3.4 对比页 | prebuild 产出 `public/compare-data.json`；实测前二对阵 2 张卡 + 11:11 比分 + 25 条赛道链接；图像生成 × 纯文本无共同池时**不显示胜负**且报「还没有共同参加的评测」；空状态 4 组推荐；localStorage 回填 / 坏 slug 过滤 / 分享链接写入存储三条均实测 |
| 4.1 入口收口 | 首页 nav = 4 条路由、`/vendor/` 链接 15 条；搜索「deepseek」首条 = `/vendor/deepseek/`；厂商页类型链接落到总表 11 行（与数据核对一致） |
| 4.2 统一验证 | `npm run verify` 四项全过（含 check 13 条不变式）；6 个页面双断点无横向溢出；最大组件 263 行 < 400 硬上限 |

**范围外未做且已记录**：sitemap/robots/feed/数据导出（proposal 已列为「两边都缺」）；
概念搜索快捷方式仍指首页锚点（改指总表筛选属行为变更，未纳入本变更范围）。

## 二、代码质量

- 未新造第二套口径：排行榜复用 `scores.ts` 的 `buildTrackIndex`/`buildScorePools`，
  对比页复用同一套池与 `aptitude.ts` 的 `AptitudeRow`，月份分组抽到 `src/lib/months.ts`
  由厂商页与时间线共用一个定义。
- 客户端面收敛：全站仅 3 个 `'use client'` 组件（排行榜、总表、对比），
  且都不使用 `useSearchParams`（静态导出下会退化成整棵子树 CSR）。
- AGENTS.md 一行数规则：三个排行榜文件一度 282–286 行，已按职责缝拆出
  `ui.ts`（共用外观常量）、`FilterControls.tsx`（Chip/Segment）、`LeaderboardRow.tsx`、
  `allColumns.ts`（列配置），最大文件回落到 263 行。

## 三、评审中发现问题与处置（均在本范围内修复）

1. **Important｜生成的 490 KB `public/compare-data.json` 被提交进仓库**，而同类产物
   `search-index.json` 是忽略的。处置：加入 `.gitignore` 并 `git rm --cached`；
   验证重新 clone 场景由 `prebuild` 重新生成。
2. **Important｜`useUrlQuery` 被对比页跨模块从 `leaderboard/` 引入**，与
   AGENTS.md「跨模块才进共享位置」相悖。处置：移到 `src/components/ui/useUrlQuery.ts`，
   三处 import 更新。
3. **Important｜对比页能力分位块在 390 下横向溢出 33px**（`MetricBar` 最少需 ~220px，
   被放进双列窄栅格）。处置：窄屏整行独占并补型号名；四模型形态复测无溢出。
   `npm run shots` 当时未捕获，是因为它截的是 `/compare/` 空状态——
   **这是截图自查的一处盲区，已用临时探针补测并记录在 progress。**
4. **Minor｜`DESIGN.md` 与实现脱节**（「三条未实现路由」「筛选/对比/搜索仍然没有」）。
   处置：补一条 SiteHeader 修订说明、新增「四个探索页」小节（含三处实现约束），
   并把「仍然没有」的措辞改成指向新页面。

## 四、遗留（不阻塞，记录备查）

- `dict.status`（`ageDays`/`ageYears`）在本变更前后均无使用者，属既有死文案；
  `git log -S` 显示它从未被引用过。未在本变更删除（不在范围内）。
- `/styleguide` 仍会进生产产物（DESIGN.md §四.6 既列）。
- 对比页首屏是客户端取数，因此在 390 下用 `npm run shots` 只能截到空状态；
  带内容的形态需按 `?m=` 另行截图（本次用临时脚本完成，未固化为脚本）。

## 结论

verdict: **pass**。5 项差距全部补齐且各有实测证明；发现的三处 Important 问题已在同一
范围内修复并复测；无残留 Critical/Important 项。
