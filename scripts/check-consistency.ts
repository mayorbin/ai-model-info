/**
 * 一致性核对。六条不变式，任一条不成立就以非零码退出：
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
 * 5. 「N 个有第三方综合成绩的模型」同样只能有一个 N（模型详情页的名次行）。
 *    第 4 条与它说的是同一个数量，只是量词不同；两句都守，才不会出现
 *    「首页说 214、详情页说 216」这种跨页面的漂移——第 4 条只扫首页是抓不到的。
 * 6. 635 个模型详情页逐页核对：页数 == 模型数，且每页 `data-eci` / `data-rank`
 *    与 `rankByEci` 重算的结果一致。详情页是 635 个静态页面，肉眼抽查没有意义。
 *
 * 需要先构建（读 `NEXT_DIST_DIR` 指向的导出产物）。用法：`npm run check`
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { VENDOR_REGISTRY, canonicalVendorId } from '../src/data/vendor-registry.ts';
import { buildChampions } from '../src/lib/champions.ts';
import { rankByEci } from '../src/lib/derive.ts';
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

/** 去掉 SSR 文本节点之间的 `<!-- -->` 与 RSC flight payload，只留可见 DOM */
function readableHtml(raw: string): string {
  return raw.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--.*?-->/g, '');
}

const html = readableHtml(readFileSync(resolve(exportDir, 'index.html'), 'utf8'));

/*
 * 详情页是 635 个静态页面，第 5 / 6 条不变式必须逐页读。
 * 只读 `model/` 下的 index.html——导出目录里还有 RSC payload（`__next.*.txt`）
 * 与 `_next/` 的静态资源，它们不是页面。
 */
const modelPages: Array<{ path: string; html: string }> = [];
try {
  for (const entry of readdirSync(resolve(exportDir, 'model'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(exportDir, 'model', entry.name, 'index.html');
    try {
      modelPages.push({ path: `model/${entry.name}`, html: readableHtml(readFileSync(file, 'utf8')) });
    } catch {
      /* 没有 index.html 的目录不是页面，跳过 */
    }
  }
} catch {
  /* 还没有 model/ 目录：下面的检查会如实报 0 页 */
}

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
const allHtml = [html, ...modelPages.map((p) => p.html)].join('\n');

const denominators = [
  ...new Set([...allHtml.matchAll(/(\d+) 个有成绩的模型/g)].map((m) => Number(m[1]))),
].sort((a, b) => a - b);
const expected = buildLeaderboard(snapshot.models, snapshot.vendors).total;
check(
  denominators.length === 1 && denominators[0] === expected,
  `「N 个有成绩的模型」只有一个 N：${denominators.join(' / ') || '(产物里未出现)'}（应为 ${expected}）`,
);

/*
 * 5. 详情页的名次行说的是同一个数量，只是量词不同。两句都守，
 *    跨页面的漂移才有东西拦得住——这两句分别出现在首页与 635 个详情页上。
 */
const qualified = [
  ...new Set([...allHtml.matchAll(/(\d+) 个有第三方综合成绩的模型/g)].map((m) => Number(m[1]))),
].sort((a, b) => a - b);
check(
  qualified.length === 1 && qualified[0] === expected,
  `「N 个有第三方综合成绩的模型」只有一个 N：${qualified.join(' / ') || '(产物里未出现)'}（应为 ${expected}）`,
);

/*
 * 6. 详情页逐页核对。
 *
 *    用 `data-model` / `data-eci` / `data-rank` 这三个属性读，不解析 DOM 结构：
 *    这个脚本曾经靠匹配一串 className 计数，一次样式调整就误报成"分组块丢失"。
 *    **样式会变，语义锚点不会。**
 */
check(
  modelPages.length === snapshot.models.length,
  `详情页数 ${modelPages.length} == 快照模型数 ${snapshot.models.length}`,
);

/* 名次池只建在在役模型上——与 `buildAptitudeScale` 和排行区一致 */
const ranks = rankByEci(snapshot.models.filter((m) => !m.retiredAt));
let rankMismatch = 0;
let eciMismatch = 0;
const seen = new Set<string>();

for (const page of modelPages) {
  const id = /data-model="([^"]+)"/.exec(page.html)?.[1];
  if (id == null) {
    rankMismatch++;
    continue;
  }
  seen.add(id);
  const model = snapshot.models.find((m) => m.id === id);
  if (model == null) {
    rankMismatch++;
    continue;
  }

  const shownEci = /data-eci="([^"]+)"/.exec(page.html)?.[1] ?? null;
  const wantEci = model.benchmarks.eci == null ? null : model.benchmarks.eci.toFixed(1);
  if (shownEci !== wantEci) eciMismatch++;

  const shownRank = /data-rank="([^"]+)"/.exec(page.html)?.[1] ?? null;
  const wantRank = ranks.get(id);
  if (shownRank !== (wantRank == null ? null : String(wantRank))) rankMismatch++;
}

check(eciMismatch === 0, `详情页 ECI 全部等于快照原值（不符 ${eciMismatch} 页）`);
check(rankMismatch === 0, `详情页名次全部等于 rankByEci（不符 ${rankMismatch} 页）`);
check(
  seen.size === snapshot.models.length,
  `详情页覆盖全部模型（覆盖 ${seen.size} / ${snapshot.models.length}）`,
);

console.log(`\n${failures.length === 0 ? '全部通过。' : `${failures.length} 条不成立。`}`);
if (failures.length > 0) process.exitCode = 1;
