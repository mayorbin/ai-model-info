/**
 * 生成对比页数据：`public/compare-data.json`。
 *
 * 与 `search-index.ts` 同一套做法——prebuild 期跑，产物进 `public/`，
 * 静态导出时原样发布，对比页在浏览器里按需拉取。
 * 用法：npx tsx scripts/compare-data.ts
 */

import fs from 'node:fs';
import path from 'node:path';

import { buildCompareData } from '../src/lib/compare-data.ts';
import type { WorldSnapshot } from '../src/lib/types.ts';

const ROOT = process.cwd();
const SNAPSHOT = path.join(ROOT, 'data', 'models.json');
const OUT = path.join(ROOT, 'public', 'compare-data.json');

function main() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.log('[compare-data] 没有 data/models.json，跳过');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as WorldSnapshot;
  const data = buildCompareData(snapshot);
  const json = JSON.stringify(data);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, json);

  const kb = (Buffer.byteLength(json) / 1024).toFixed(0);
  console.log(
    `[compare-data] ${data.models.length} 个模型 / ${data.benches.length} 个成绩池 -> public/compare-data.json (${kb} KB)`,
  );
}

main();
