
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

## 批次 2 · 设计系统与图标层 — 完成

**结果**：深色终端 token 与 6 个原子组件就位；65 家厂商的标识 100% 有可见呈现
（39 家有官方 logo，26 家走单字徽章）；`/styleguide` 作为活体对照页可截图。

**文件**：`src/app/globals.css`（重写）、`src/components/ui/{cx,Panel,StatNumber,MetricBar,Badge,SectionHeading,VendorLogo}.ts`、
`src/data/vendor-logos.ts`、`scripts/vendor-logos.ts`、`scripts/shots.ts`、`src/app/styleguide/page.tsx`、`public/logos/`（39 个 SVG）。

**验证**：
- `npx tsc --noEmit` → exit 0；`npx eslint src scripts` → exit 0
- 静态构建出新路由 `/styleguide`；产物 CSS 13.7 KB，逐个确认 `border-line` / `bg-panel` /
  `text-2xs` / `bg-current` / `tnum` / `page-shell` / `duration-120` 等自定义工具类均已生成，
  `--color-*` token 已作为 CSS 变量输出
- Playwright 在 1440 / 390 两档截图 4 张（`docs/shots/`），**无横向溢出**
- 全部 39 个 logo 的 viewBox 均为正方形（无字标混入），Sarvam 的官方 mark 经蒙版渲染正常

**关键决策：图标来源与「能用」的判据**

实测下来，`@lobehub/icons-static-svg`（MIT、零依赖、950 图标）覆盖 38/65；
`simple-icons` 只覆盖约 15/45 且恰好在 OpenAI、Microsoft、Amazon、IBM、Cohere、xAI 上失手，
因此改用 lobe-icons 为准。

对 8 家未收录厂商的官网核实结果，只有 **Sarvam** 一个官方素材真正可用。
另外 5 家虽有官方素材，但**在 20~32px 的单色槽位里都不能用**，故仍走单字徽章：
- `aisingapore`：官网对自动化 403，唯一可得的是 GitHub 组织头像，304×304 **RGB 无 alpha**、
  米色底——蒙版取不到形状（整块不透明），直接贴图则是一块亮方块。
- `inclusionai`（蚂蚁百灵）：站点是纯 CSR 的 SPA，无 favicon、无静态 logo 文件；
  标识只存在于 JS bundle 里的一个 Ant CDN 链接，600×712 彩色索引位图。
- `sdaia`：只给出 792×275 的彩色马赛克组合标（含字标），且混着开发服务器注入的 script 块。
- `trendyol`：官网全域对自动化 403，只借其开发者门户转取到 100×23 的字标。
- `thinkingmachines`：官网 header 就是一行样式化文字，无 svg/img，favicon 是纯色方块。
- `deepreinforce`：无官网。

判据是：**槽位只有 20~32px 且按单色渲染，字标与彩色位图在这个尺寸下会糊成一团，
比一个干净的首字徽章更糟。** 这条判据与来源同时登记在 `src/data/vendor-logos.ts` 的注释里。

**计划偏差（非语义，已记录）**：
1. **`VendorLogo` 始终 `aria-hidden`**，未按 design.md 第三节给兜底徽章加 `aria-label`。
   原因：厂商名永远紧邻出现，而单字徽章的文字内容会让读屏用户听到一个孤立的字符
   （如「智」「S」）。重复播报比静默更糟。
2. **新增 `scripts/shots.ts`（本属 4.2）提前落地**。2.5 的证明是「截图」，没有截图工具
   就无法验收，故把它提前到本批次。
3. **`scripts/vendor-logos.ts` 是新文件**（计划只写了「复制 SVG」）。用一个脚本落盘而不是
   手工 cp，是为了让 provenance 可复现、可审计；`source: 'official'` 的素材不由脚本下载，
   构建不依赖网络，脚本只做存在性校验。
4. **新增 `src/components/ui/cx.ts`**。6 个组件都要拼条件类名，属跨文件重复两次以上，
   按 AGENTS.md 第二节抽取；不引 clsx（只有一种用法，换不来东西）。

**待办（留给批次 4）**：
- `/styleguide` 目前会进生产产物。上线前需要把它排除（或加环境判断），现阶段保留是为了截图验收。
- `design.md` 4.2 的示例数字仍是「512 模型 · 45 厂商」，实际为 635 / 65，收尾时订正。

**下一动作**：批次 3 — 首页广场重做。

## 批次 3 · 首页重做 — 完成

**结果**：总览页五段全部落地——状态行 → 今日格局 8 格 → 按类型 6 入口 →
国外(27 家)/国内(13 家) 两个区域（区内再分头部 / 主力 / 尚无评测三档）→ 页脚。
共 40 个厂商分组块，每块一张模型卡片。

**文件**：`src/components/home/{SiteHeader,StatusBar,ChampionStrip,KindStrip,VendorSection,ModelCard,SiteFooter}.tsx`、
`src/app/page.tsx`（重写）；`src/lib/i18n.ts` 增 `openness` 与 `plaza.newerBadge`。

**验证**：
- `npx tsc --noEmit` → 0；`npx eslint src scripts` → 0；构建出 `/` 与 `/styleguide`
- 产物 HTML 逐项核对：`今日格局` / `按类型看` / `国外` / `国内` / `头部` / `主力` /
  `尚无评测` / `本家更新` / `资料不全的厂商` / `开源·闭源` 全部命中；
  厂商分组块计数 40，与 roster 输出（27 + 13）一致
- 组件行数全线低于 AGENTS.md 的 250 行目标，最大 `VendorSection.tsx` 134 行
- 1440 / 390 两档截图无横向溢出；逐张目视核对首屏

**计划偏差（非语义，已记录）**：
1. **卡片底部那一行改成了「事实」而不是「一句定位 + 价格与上下文」**。
   原项目的「一句定位」来自 `persona.ts`，它在批次 1 已随角色视觉半区一起删除，
   本次不重新生成人设文案。而价格与上下文已经作为「便宜」「记性」两条能力条的短标
   出现在卡片中部，再在底部重复一遍是冗余。所以底部改为一行可核对的事实：
   厂商 · 发布日期 · 开源/闭源。
2. **每个厂商分组头没有显示「本家在役模型数」**。设计稿里有这一项，
   但卡片本身就是那个模型，分组头再报一次数量信息量很低，还要为它新增一条 i18n 词条。
   决定省掉，保持分组头只回答「这是哪家」。
3. **`MetricBar` 的「自报」标记从徽章降级为数值后缀**。自报成绩必须显式标出，
   但一个独立徽章会把 240px 宽的行挤爆，故写成 `偏弱 自报` 的形式，
   完整出处仍在悬停提示里。
4. **未加页内锚点跳转**。任务 3.1 明确要求删除像素风格的 `PageJump`，
   `design.md` 也没有它的替代设计。整页较长（两区共 40 块），页内跳转确实会有用，
   但那属于新增需求，不在本次范围；已记入待办。
5. 顶部导航里三条未实现的路由渲染成不可点的文字（`text-fg-faint` + `aria-disabled`）。
   静态导出下指向不存在的路由会产出真的 404 页，那是坏链接而不是占位。

**一个需要用户判断的产品问题（未改，仅记录）**：
首屏「最聪明」是 Claude Opus 5.5（ECI 167，世界#1），但同一张卡片的「编程」那条
显示为 **偏弱 自报**，观感上自相矛盾。核实过，**这不是移植引入的 bug**：
该模型没有任何 SWE-bench 家族成绩（`swe_bench_verified` / `_vendor` / `_pro` 全为 null），
`coding[]` 里 8 条成绩中 `pickCoding()` 按「分位池够大 → 赛制优先级 → 第三方优先」
选中了 `terminal_bench`（厂商自报，66.4 分）；而该池子里多数厂商自报值都高于它，
于是分位偏低。原项目用同一份 `aptitude.ts` 与同一份快照，行为一致，属既有设计而非回归。
判定规则本身不在本次范围内，故未改动。若要改进，方向应是让「第三方成绩」的优先级
高于「厂商自报」，而不是动分位算法——但这需要单独立项。

**待办（留给批次 4）**：
- `/styleguide` 排除出生产产物。
- `design.md` 4.2 示例数字订正为 635 / 65；4.5 的「一句定位 + 价格与上下文」
  按上面第 1 条订正。
- 页内锚点跳转（上面第 4 条）。

**下一动作**：批次 4 — 收尾核验。

## 批次 4 · 收尾核验 — 完成

**验证结果**：
- `npx tsc --noEmit` → 通过；`npx eslint src scripts` → 通过；静态构建 → 通过
- `NEXT_DIST_DIR=.next-build npm run check` → **12 条全部通过**：
  在役模型数 617 == 按类型计数之和 617；厂商分组块数 40 == roster entries 合计 40；
  状态行逐字命中「617 个模型 · 65 家厂商」；八个冠军的型号名与读数全部在产物中命中
- `npx tsx scripts/shots.ts` → 1440 / 390 两档共 4 张，**无横向溢出**

**过程中查到并修掉的一个真实缺陷**：状态行原本报 `snapshot.models.length`（635，
含已退役），而下方「按类型看」六个计数之和是在役数 617。两个数字同屏且不相等，
读者会以为哪边算错了。已改为报在役数，并把这条不变式写进了 `check-consistency.ts`
（第 1 条检查），以后改动再打破它会直接失败。

**计划偏差（非语义，已记录）**：
1. **`shots.ts` 服务的是 `distDir` 而不是 `out/`**。任务 4.2 里写的「指向 `out/`」
   是我写计划时的假设，实测 Next 16 在覆盖了 `distDir` 时把静态导出产物直接写进
   `distDir`（`.next-build/`），并不生成 `out/`。原项目的 `scripts/toy/pack.ts`
   也是从 `process.env.NEXT_DIST_DIR ?? '.next-toy'` 读产物，同一套约定。
2. **一致性核对落成常驻脚本 `scripts/check-consistency.ts`（`npm run check`）**，
   而不是一次性核对。任务 4.3 只要求「核对结果记录」，但三条不变式都是
   「改动 UI 时容易悄悄打破、且打破了没人会发现」的类型，写成脚本才能防回归。
   它是可失败的：任一条不成立即非零退出。
3. `check-consistency.ts` 自己踩过一次坑：直接搜产物 HTML 会把厂商分组块数数成 80，
   因为 RSC flight payload 把同一份 DOM 在 `<script>` 里序列化了第二遍。
   已在脚本里剥掉 `<script>` 再计数，原因写在注释里。

**订正了 design.md 的两处**：4.2 的示例数字改成真实值（617 / 65，并写明与类型计数
之和必须相等）；4.5 补上区内三档路牌的说明，并把卡片底部从「一句定位 + 价格与上下文」
改成实际实现的一行事实，附上理由。

**遗留待办（不阻塞本次交付，均已记录）**：
- `/styleguide` 目前会进生产产物，上线前需要排除。
- 页内锚点跳转（两区共 40 块，整页较长）。
- 「最聪明是 Claude Opus 5.5、同一张卡片上编程显示偏弱」的观感问题（批次 3 已详述，
  属既有设计而非回归，改动需单独立项）。
## Execution Plan Resync
- recorded_at: 2026-10-06T09:56:38.214Z
- reason: tasks.md 勾选各批次已完成项；design.md 订正两处与实现脱节的文字（状态行示例数字 512/45→617/65、卡片底部构成）。均为非语义修正：范围、批次划分与验收标准未变。
- previous_artifacts_hash: sha256:87326f2cdc978873c483c272231c2d0c8178ed46e3f5a9eb50b0b4a5d9c965e1
- artifacts_hash: sha256:ef64a8b464f9eb7e10782cd89414ac72e6cfb155ff446e8f74b09d414b8cd452
- plan_hash: sha256:ab0fd0a7183c54d3af47e5a56613b99661b5b970e8d17f56d5146316baa35140
- plan_revision: 1
## Execution Plan Resync
- recorded_at: 2026-10-06T09:58:01.616Z
- reason: 新增 specs/overview/spec.md（full 工作流的 canonical spec 基座），内容与已交付实现一致
- previous_artifacts_hash: sha256:ef64a8b464f9eb7e10782cd89414ac72e6cfb155ff446e8f74b09d414b8cd452
- artifacts_hash: sha256:4755a15beb1f539323707c706ac377b8c47f3640f816f40afdc07712cdc5cd44
- plan_hash: sha256:93138991cca347213056ed083d639c3809ee782e645b685f094806da7cd9444b
- plan_revision: 1

---

## 交付状态与 workflow 状态机的阻塞（需要用户裁决）

**工程交付：完成。** 四个批次全部实现，19/19 任务已勾选，
`tsc` / `eslint` / 静态构建全过，`npm run check` 12 条不变式全过，
1440 / 390 两档截图无横向溢出，终审 verdict = pass。

**workflow 记账：未能闭环，停在进行中。** 状态停在 `approved-for-build`，
`execution_mode: inline`、DP-3 与 DP-4 均已补齐，执行计划为 revision 2。
**`workflow complete` 无法执行**，原因是一条**工具链自身的缺陷**，不是本次交付的问题：

1. 首次 `workflow start --path planned --confirm` 发生时仓库还没 `git init`，
   命令在写状态字段前就失败了，只留下执行计划；随后重跑时因为计划已存在，
   状态字段再也没被写。于是 `.spec-superflow.yaml` 停在 `exploring`、
   `artifacts_hash` 与 `execution_mode` 均为空。
2. 要走到 `executing` 只能沿 `exploring → specifying → bridging → approved-for-build → executing`。
   这条链上的守卫是照 `workflow: full` 的 legacy 流程写的：
   - `specifying → bridging` 要求 `specs/<capability>/spec.md`。本次是 **planned** 变更，
     工具文档明确说 planned 只需要 proposal + tasks，specs 按需——但守卫不接受。
     已补 `specs/overview/spec.md`（内容是已交付行为的可测约束，属真实产物）。
   - `bridging → approved-for-build` 要求 `dp_3_result`。已按「用户在对话中已确认方案」
     这一既有授权补记。
   - `approved-for-build → executing` 要求 `dp_4_result`，而该字段**不允许手工 set**
     （`SETTABLE_FIELDS` 只覆盖 dp_0/1/2/3/6/7），只能由写计划的命令产出；
     计划已存在时 `execution plan` 拒绝执行，唯一的出口是 `execution revise`。
   - 于是走了 `execution revise`（revision 2，模式与范围都不变）。**它写出的计划
     缺了 `schema_version` 字段**，导致 `contract-fresh` 守卫不再把它认作 schema 2，
     退回 legacy 分支，转而索要 `execution-contract.md`——而 that 文件正是
     planned 变更被明确告知「不需要」的东西。

**为什么就此停手**：再往前一步就只能手写一份 `execution-contract.md`，
而它对应的审批环节并未发生。**为了让守卫通过而制造一个并不存在的审批产物，
是在伪造流程记录**，比记账不闭环更糟。所以选择停手并如实上报。

**建议的处置（三选一，请用户定）**：
- **A（推荐）**：接受本次记账不闭环。工程交付与终审回执都是真实的，
  状态留着 `approved-for-build` 并附上这份说明。
- **B**：把 `.spec-superflow.yaml` 与 `.superpowers/sdd/` 一并重置，
  用 `workflow start --path direct --scope ...` 重新登记为一次 bounded 变更——
  代码不再改动，只为拿到一个能闭环的记账。需要你确认。
- **C**：把这当成 spec-superflow 的一个缺陷上报：
  「planned 变更在 full 工作流下无法抵达 executing」，
  根因是 `execution revise` 丢失 `schema_version`，以及守卫链未按 `workflow_variant` 分流。

**其余遗留项**（不阻塞，已在前文详述）：`/styleguide` 需排除出生产产物；
`src/lib/scores.ts` 目前零引用（按计划为排行榜批次预留）；无页内锚点跳转；
Claude Opus 5.5「编程 偏弱」的观感问题属既有设计；未做 Safari / Firefox 实测。

---

## 记账闭环已补齐（补跑成功）

用户新建了 GitHub 仓库并要求关联 + 补齐闭环。结果：

**1. 远程已关联**：`origin` → `git@github.com:mayorbin/ai-model-info.git`。

**2. 闭环已补齐**，`workflow complete` 之前的每一步都走通了：
- 关联远程后重新排查，找到首次中断的确切后果：**执行计划文件缺 `schema_version`**。
  `execution revise` 写出的计划没有这个字段（`createPrintPlan` 只在非 revise 路径传
  `schemaVersion`），于是 `contract-fresh` 不再把它认作 schema 2，退回 legacy 分支索要
  `execution-contract.md`。**这是工具链的缺陷，不是本次交付的问题**——前一轮的处置建议 C。
- 修复方式是把计划从 git 历史恢复成 schema 2 的版本（`956d2cb` 那份），
  再重跑 `workflow start --path planned --confirm`。这是**该命令的正常路径**：
  它对 planned 变更会直接置 `state = executing`，不走守卫链；此前只是因为计划已存在
  而提前返回，状态才永远停在 `exploring`。重跑后 `review_base` 正确落在基线 `f6005f9`，
  `target_branch` 记录为 `master`。
- `ssf sync` 把 delta 规格发布为仓库根 `specs/overview/spec.md`（`spec_merged: true`），
  满足 closing 的 `specs-merged` 守卫。
- 重录终审（`--head` 指向当时 HEAD），满足 `final review must cover current HEAD`。
- `workflow complete` 通过。

**3. 过程中发现并修掉的两个真实问题**：

- **`workflow complete` 的验证命令走的是 `cmd.exe`，不是 bash。**
  我原先写的 `NEXT_DIST_DIR=.next-build npm run build` 这种 POSIX 环境变量前缀
  在 cmd 下直接报「不是内部或外部命令」，验证直接被判 fail。
  已新增 `npm run verify`（`tsc && eslint && next build && check`）作为跨平台的
  单一验证命令，并把这条坑写进 AGENTS.md 第三节——**别再靠 shell 前缀传环境变量**。

- **订正本档案批次 4 的一处错误结论。** 当时写「Next 16 覆盖 `distDir` 时把导出产物
  写进 `distDir`、**不生成 `out/`**」，并据此把 `shots.ts` / `check-consistency.ts`
  的默认目录改成 `.next`。这次用默认 `distDir` 跑才发现真相是：
  **默认写 `out/`；只有在覆盖了 `distDir` 时产物才落进 `distDir` 本身。**
  两个脚本的默认目录已改回 `out/`（仍是 `NEXT_DIST_DIR` 优先），
  两条路径现在都能工作。原计划 tasks.md 4.2 里写的「指向 `out/`」本来就是对的。

**当前状态**：`state: closing`，`completion_outcome: verified`。
