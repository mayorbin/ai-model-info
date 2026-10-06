
## cwd 警告（ensure-branch 自动写入）

- 隔离上下文：`D:\Study\test\ai-model-info`
- Bash cwd 不持续：每条命令都会回到会话初始目录，不会记住上一次的 cd
- 强制规则：后续实现编辑必须使用隔离上下文内的绝对路径，或每条命令以前缀 `cd D:\Study\test\ai-model-info &&` 开头

## 批次 1 · 脚手架与数据层移植 — 完成

**结果**：新工程可编译，数据层与评分链路端到端跑通。静态导出产物中已渲染出
`635 模型 · 65 厂商`（构建期由 `loadSnapshot()` 解析）。

**文件**：`package.json` / `tsconfig.json` / `next.config.ts` / `postcss.config.mjs` /
`eslint.config.mjs` / `.gitignore` / `src/app/{layout.tsx,page.tsx,globals.css}`；
移植 `src/data/*`（4 个）+ `src/lib/*`（12 个）；新增 `src/lib/percentile.ts`；`data/models.json`。

**验证**：
- `npx tsc --noEmit` → exit 0
- `sha256sum` 比对 `data/models.json` 与源快照 → 完全一致
- `NEXT_DIST_DIR=.next-build npx next build` → 编译成功，产出 `.next-build/index.html`（10.4 KB），内含 `635 模型 · 65 厂商`
- `grep -nE "garmentOf|bookshelfOf|visualOf|crownOf|lifeStageOf" src/lib/derive.ts` → 无输出

**计划偏差（均为非语义修正，已记录）**：
1. **`TIER_SCALE` 未保留**。它是精灵图的显示缩放系数（`Record<Tier, number>`），
   新站没有精灵图，全仓无消费者。保留即死代码，故随角色视觉半区一并删除。
2. **未移植 `outbound.ts` / `attribution.ts` / `benchmark-attribution.json`**。
   `outbound.ts` 整个函数体以 `NEXT_PUBLIC_BASE_PATH` 是否以 `/toy/` 开头为条件，
   而 B 站 Toy 部署已明确排除在范围外；`attribution.ts` 只服务于 SWE-Bench Pro 的
   第三方归属判定，其唯一消费者 `buildComputerScale` 已随视觉半区删除。
   首页链路两者均无消费者，等排行榜/详情页批次再随各自消费者一起落地。
3. **新增 `src/lib/percentile.ts`**。`derive.ts` 的 `percentileIn` 与 `aptitude.ts` 的
   `percentile` 是逐字相同的实现，属跨模块重复两次，按 AGENTS.md 第二节抽取。
4. **重命名 `buildPlazaRoster` → `buildOverviewRoster`、`PlazaTier` → `OverviewTier`**。
   两者当时均无消费者（page.tsx 尚是冒烟页），重命名零风险，且把「广场」这个
   需要读者先理解隐喻的词从代码里去掉。同步修正了 `roster.ts` / `kind.ts` /
   `champions.ts` / `types.ts` / `vendor-registry.ts` 注释里描述的、已经不存在的村子与家徽系统。
   `motif` 字段保留（属快照数据契约，`sample-snapshot.ts` 与 `Vendor` 接口都依赖它），
   但注释已改为如实说明它只被未移植的美术管线消费。
5. **`layout.tsx` 用显式 `{ children: ReactNode }` 取代 `LayoutProps<'/'>`**。
   后者是 Next 构建期生成的全局类型，未 build 前 `tsc --noEmit` 会报错，
   与 AGENTS.md 要求的验证顺序（先 tsc 后 build）冲突。

**给后续批次的修正项**：`design.md` 4.2 的状态行示例写的是「512 模型 · 45 厂商」，
真实快照是 **635 模型 / 65 厂商**（45 是人工注册表的条目数，快照里含未收录厂商）。
批次 3 实现状态行时按快照实际值渲染，并在收尾时订正 `design.md` 的示例数字。

**下一动作**：批次 2 — 设计系统与图标层。
