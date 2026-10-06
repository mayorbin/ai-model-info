/**
 * 把用到的厂商 logo 从 `@lobehub/icons-static-svg` 复制进 `public/logos/` 自托管。
 *
 * 为什么要复制而不是运行时依赖那个包：构建期不再需要它，`public/` 下的静态文件
 * 直接由静态托管发出，也不会有 950 个图标被误打进产物的问题。
 * 相应地，`VendorLogo` 走的是 CSS `mask-image`，靠 **alpha 通道**取形状，
 * 于是颜色由 `currentColor` 决定——单色与品牌色两种形态共用同一份文件。
 *
 * `source: 'official'` 的条目不由本脚本下载：构建不该依赖网络，
 * 那几份素材随仓库提交，这里只做存在性校验。
 *
 * 用法：`npm run logos`
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { VENDOR_LOGOS } from '../src/data/vendor-logos.ts';

const SRC_DIR = join(process.cwd(), 'node_modules', '@lobehub', 'icons-static-svg', 'icons');
const OUT_DIR = join(process.cwd(), 'public', 'logos');

mkdirSync(OUT_DIR, { recursive: true });

const entries = Object.entries(VENDOR_LOGOS).filter(([, ref]) => ref != null);

const missingLobe: string[] = [];
let copied = 0;

for (const [vendorId, ref] of entries) {
  if (ref!.source !== 'lobe-icons') continue;
  const src = join(SRC_DIR, `${ref!.file}.svg`);
  if (!existsSync(src)) {
    missingLobe.push(`${vendorId} → ${ref!.file}.svg`);
    continue;
  }
  copyFileSync(src, join(OUT_DIR, `${ref!.file}.svg`));
  copied++;
}

const missingOfficial = entries
  .filter(([, ref]) => ref!.source === 'official' && !existsSync(join(OUT_DIR, `${ref!.file}.svg`)))
  .map(([vendorId]) => vendorId);

console.log(`lobe-icons：复制 ${copied} 个到 public/logos/`);

if (missingLobe.length > 0) {
  console.log(`\n上游找不到这些图标（映射表的 file 写错，或 lobe-icons 改名了）：`);
  for (const m of missingLobe) console.log(`  ${m}`);
}

if (missingOfficial.length > 0) {
  console.log(`\n缺少 official 素材（应随仓库提交）：`);
  for (const m of missingOfficial) console.log(`  ${m}`);
}

const fallback = Object.values(VENDOR_LOGOS).filter((r) => r == null).length;
console.log(`\npublic/logos/ 现有 ${readdirSync(OUT_DIR).length} 个文件；${fallback} 家厂商显式走单字徽章兜底。`);
