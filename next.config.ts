import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * 全站静态导出：数据在构建期由 loadSnapshot() 解析进 HTML，没有服务端运行时。
   * 这也意味着新增任何依赖运行时接口的功能（搜索、筛选）都要先想清楚构建期能不能算出来。
   */
  output: 'export',
  /* 开发服务器运行时执行 next build 会覆写同一个 .next 目录，导致 dev 立刻 404 */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
