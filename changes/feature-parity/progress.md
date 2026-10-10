
## 2026-10-10 批次 2 · 排行榜与总表 完成

- 结果：`/leaderboard/`（赛道切换 + 四维筛选 + URL query 同步）与 `/leaderboard/all/`
  （可排序总表，共用同一套筛选）上线。新增 `src/components/leaderboard/` 七个文件：
  types/filters/serialize/useUrlQuery/ModelFilters/LeaderboardExplorer/AllModelsTable。
  派生层无需改动——`buildTrackIndex` 早在数据层移植时就已就位（`src/lib/scores.ts`）。
  两处 `'use client'` 组件是全站仅有的客户端交互面；导航「排行榜」已置 ready。
- 验证：tsc/eslint 干净；build 过；`npm run check` 13 条全过；shots 双断点无横向溢出；
  临时脚本实测 URL query 复原：`?region=east&kind=vision&weights=open&track=eci` 复原出
  四个按下 chip 与 9 行结果；`?track=value` 切到性价比；总表 `?sort=price&dir=asc&region=east`
  按输出价格升序且首行 $0.03；点击「国内」后 URL 被写回 `?region=east`。
- 体积：leaderboard 656 KB / gzip 88 KB；all 表 579 KB / gzip 47 KB（首页 gzip 45 KB 量级）。
- 下一步：批次 3 时间线与对比页。

## 2026-10-10 批次 3 · 时间线与对比页 完成

- 结果：`/chronicle/`（年份锚点 + 月份行 + 635 个模型链接，复用 `src/lib/months.ts`）
  与 `/compare/`（构建期生成 `public/compare-data.json` 490 KB，客户端按需拉取）上线。
  新增 `src/components/chronicle/ChronicleTimeline.tsx` 与 `src/components/compare/`
  十个文件（types/insights/storage/ModelPicker/CompareGrid/CompareSpecs/CompareBench/
  CompareModelCard/CompareView）。参考项目里属于像素美术管线的三块（精灵图、人设句、
  体型缩放）整段删除。`SectionHeading` 增加 `aside` 插槽（对比页要放切换控件）。
  导航四条全部 ready，`ready` 开关与「未实现」提示文案一并删除。
- 验证：`npm run verify` 四项全过（check 13 条不变式含「N 个有成绩的模型只有一个 214」——
  对比页的列头名次因此刻意不用 `model.rank`，那句话里带分母）；
  临时脚本实测：`?m=<前二>` 出两张卡与 11:11 比分、25 条可跳排行榜的赛制行；
  图像生成 × 纯文本这对无共同池时报「还没有共同参加的评测」且不显示胜负；
  空状态给出 4 组推荐对阵；localStorage 能回填、坏 slug 被过滤、分享链接会写入存储；
  时间线 4 个年份区 / 40 个月份行 / 635 个模型（与快照守恒）。
- 修掉一处实测溢出：对比页能力分位块在 390 下双列栅格中溢出 33px
  （`MetricBar` 最少要 ~220px），改为窄屏整行独占并补型号名；四模型形态同样无溢出。
- 拆分（AGENTS.md 一节）：`leaderboard/ui.ts`（共用外观常量）、`FilterControls.tsx`
  （Chip/Segment）、`LeaderboardRow.tsx`、`allColumns.ts`（列配置）。最大组件回落到 263 行。
- 下一步：批次 4 收口（首页入口、厂商卡链接到厂商页）与最终统一验证。
