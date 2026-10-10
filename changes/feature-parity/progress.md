
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
