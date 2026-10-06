/**
 * UI 截图自查：起一个静态服务指向导出产物，用 Playwright 在 1440 / 390 两个断点截图，
 * 并检查有没有横向溢出。AGENTS.md 第三节要求的自查就是这一步。
 *
 * 用系统 Chrome（`channel: 'chrome'`）而不是 Playwright 自带的 chromium：
 * 本机没下载过 chromium，而 Chrome 早就装好了，没必要为一个视觉自查再拉 150 MB。
 *
 * 产物落在 `docs/shots/`（已 gitignore）。
 *
 * 用法：
 *   npm run shots                 # 首页 + 样式规范
 *   npm run shots -- / /leaderboard
 *
 * 设 `SHOT_VIEWPORT=1` 只截首屏（不截整页）。整页截图在长页面上会高到无法阅读，
 * 核对首屏排版时用它。
 */

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(process.cwd(), process.env.NEXT_DIST_DIR ?? '.next');
const OUT = join(process.cwd(), 'docs', 'shots');
const PORT = 4319;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** `trailingSlash: true` 下每个路由都是目录，所以目录要回落到它自己的 index.html */
function resolveFile(urlPath: string): string | null {
  const rel = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^[/\\]+/, '');
  for (const candidate of [rel, join(rel, 'index.html'), `${rel}.html`]) {
    const full = join(ROOT, candidate);
    // 防目录穿越
    if (!full.startsWith(ROOT)) continue;
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

async function main() {
  if (!existsSync(ROOT)) {
    console.error(`找不到导出产物 ${ROOT}。先跑 NEXT_DIST_DIR=${process.env.NEXT_DIST_DIR ?? '.next'} npm run build`);
    process.exitCode = 1;
    return;
  }

  const server = createServer((req, res) => {
    const file = resolveFile(req.url ?? '/');
    if (!file) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(PORT, r));

  const routes = process.argv.slice(2).filter((a) => a.startsWith('/'));
  const targets = routes.length > 0 ? routes : ['/', '/styleguide'];
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome' });
  const overflow: string[] = [];

  for (const route of targets) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const response = await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });

      const box = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      if (box.scroll > box.client + 1) {
        overflow.push(`${route} @${vp.width}: 横向溢出 ${box.scroll}px > ${box.client}px`);
      }

      const name = `${route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-')}-${vp.width}`;
      await page.screenshot({
        path: join(OUT, `${name}.png`),
        fullPage: process.env.SHOT_VIEWPORT == null,
      });
      console.log(`${name}.png  http=${response?.status() ?? '?'}  ${box.client}px 视口`);
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (overflow.length > 0) {
    console.log('\n横向溢出：');
    for (const o of overflow) console.log(`  ${o}`);
    process.exitCode = 1;
  } else {
    console.log('\n无横向溢出。');
  }
}

main();
