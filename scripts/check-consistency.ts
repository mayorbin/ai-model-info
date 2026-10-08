/**
 * 一致性核对。四条不变式，任一条不成立就以非零码退出：
 *
 * 1. 状态行报的在役模型数 == 「按类型看」六个计数之和。
 *    两处对不上，读者会以为哪边算错了。
 * 2. 渲染出的厂商分组块数 == roster 各区域 `entries` 之和。
 * 3. 八个冠军的型号名与读数都能在导出产物里逐字找到。
 *    渲染层只做排版、不做变换，所以这里应当逐字命中；
 *    找不到就说明渲染把数字改掉了，或者口径和 `champions.ts` 脱节了。
 * 4. 「N 个有成绩的模型」在产物里**只能有一个 N**。
 *    能力条的悬停文案与排行区的计数都这么说。实测曾经一个说 216（全量模型）、
 *    一个说 214（在役模型），两个数相隔一次悬停——这正是本脚本存在的理由。
 *
 * 需要先构建（读 `NEXT_DIST_DIR` 指向的导出产物）。用法：`npm run check`
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VENDOR_REGISTRY, canonicalVendorId } from '../src/data/vendor-registry.ts';
import { buildChampions } from '../src/lib/champions.ts';
import { buildKindGroups } from '../src/lib/kind.ts';
import { buildLeaderboard } from '../src/lib/leaderboard.ts';
import { buildOverviewRoster } from '../src/lib/roster.ts';
import { loadSnapshot } from '../src/lib/snapshot.ts';

const failures: string[] = [];

function check(ok: boolean, message: string) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${message}`);
  if (!ok) failures.push(message);
}

const snapshot = loadSnapshot();
const now = new Date(snapshot.generatedAt);
const registryHas = (id: string) => canonicalVendorId(id) in VENDOR_REGISTRY;

const alive = snapshot.models.filter((m) => !m.retiredAt).length;
const kinds = buildKindGroups(snapshot.models, now, registryHas);
const kindSum = kinds.reduce((n, g) => n + g.count, 0);
check(alive === kindSum, `在役模型数 ${alive} == 按类型计数之和 ${kindSum}`);

const rosters = buildOverviewRoster(snapshot.models, snapshot.vendors, now, registryHas);
const entries = rosters.reduce((n, r) => n + r.entries.length, 0);

/*
 * 去掉两类噪声再搜：
 * - SSR 在相邻文本节点之间插入的 `<!-- -->`，否则「617 个模型」会被拆成三段；
 * - `<script>` 里的 RSC flight payload —— 它把同一份 DOM 序列化了第二遍，
 *   不去掉会让分组块数翻倍（实测 40 变成 80）。
 *
 * 导出目录：`output: 'export'` 默认写 `out/`；一旦覆盖了 `distDir`（如 `.next-build`），
 * 产物就落进 `distDir` 本身、不再有 `out/`。两条路径都要认。
 */
const exportDir = resolve(process.cwd(), process.env.NEXT_DIST_DIR ?? 'out');
const html = readFileSync(resolve(exportDir, 'index.html'), 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<!--.*?-->/g, '');

/*
 * 计数锚点用 `data-vendor` 属性，不要用 className。
 * 这个脚本曾经靠匹配一串 className 统计厂商块，结果一次样式调整（厂商名降级）
 * 就让计数变成 0、误报成"分组块丢失"。**样式会变，语义锚点不会。**
 */
const blockMarker = 'data-vendor=';
const blocks = html.split(blockMarker).length - 1;
check(blocks === entries, `厂商分组块数 ${blocks} == roster entries 合计 ${entries}`);

check(
  html.includes(`${alive} 个模型 · ${snapshot.vendors.length} 家厂商`),
  `状态行逐字命中「${alive} 个模型 · ${snapshot.vendors.length} 家厂商」`,
);

const champions = buildChampions(snapshot.models, snapshot.vendors, now, registryHas);
for (const c of champions) {
  const hit = html.includes(c.model.name) && html.includes(c.figure);
  check(hit, `冠军 ${c.key}：${c.model.name} / ${c.figure} 在产物中命中`);
}

/*
 * 4. 「N 个有成绩的模型」只能有一个 N。
 *    这句话出现在能力条的悬停文案里（数十次）和排行区的计数里（一次）。
 *    两处读的是不同的函数——`buildAptitudeScale` 和 `buildLeaderboard`——所以
 *    它们的池子一旦不一致，页面上就会出现同一个数量的两个数。
 */
const denominators = [
  ...new Set([...html.matchAll(/(\d+) 个有成绩的模型/g)].map((m) => Number(m[1]))),
].sort((a, b) => a - b);
const expected = buildLeaderboard(snapshot.models, snapshot.vendors).total;
check(
  denominators.length === 1 && denominators[0] === expected,
  `「N 个有成绩的模型」只有一个 N：${denominators.join(' / ') || '(产物里未出现)'}（应为 ${expected}）`,
);

console.log(`\n${failures.length === 0 ? '全部通过。' : `${failures.length} 条不成立。`}`);
if (failures.length > 0) process.exitCode = 1;
