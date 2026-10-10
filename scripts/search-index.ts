/**
 * 生成全站搜索索引。
 *
 * 读 `data/models.json`，写 `public/search-index.json`。
 * 用法：npx tsx scripts/search-index.ts
 */

import fs from 'node:fs';
import path from 'node:path';

import { buildSearchIndex } from '../src/lib/search.ts';
import type { WorldSnapshot } from '../src/lib/types.ts';

const ROOT = process.cwd();
const SNAPSHOT = path.join(ROOT, 'data', 'models.json');
const OUT = path.join(ROOT, 'public', 'search-index.json');

function main() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.log('[search-index] 没有 data/models.json，跳过');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as WorldSnapshot;
  const index = buildSearchIndex(snapshot);
  const json = JSON.stringify(index);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, json);

  const kb = (Buffer.byteLength(json) / 1024).toFixed(1);
  console.log(
    `[search-index] ${index.models.length} 个模型 / ${index.vendors.length} 家厂商 -> public/search-index.json (${kb} KB)`,
  );
}

main();
