import Link from 'next/link';
import { cx } from '@/components/ui/cx';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { GlobalSearch } from './GlobalSearch';

const dict = getDict(DEFAULT_LANG);

/**
 * 导航项。`ready` 为 false 的两条指向尚未实现的路由。
 *
 * 静态导出下指向不存在的路由会得到一个真的 404 页——那是坏链接，不是占位。
 * 所以未实现的**不进 `<nav>`**，渲染成旁边一条不可点的文字，对应批次落地时
 * 把 ready 改成 true 即可。
 *
 * 为什么这一轮把「不进 nav」落实了：此前那三条是 `<nav>` 里带 `aria-disabled` 的
 * `<span>`，而 `aria-disabled` 挂在没有 role 的元素上会被读屏忽略。于是读屏用户的
 * 实际体验是「导航里有四项，只有一项是链接」，而哪三项是坏的、为什么坏，一句话都没有。
 * 现在 `<nav>` 里只有真链接，那三条是旁边一句陈述，各自带一份 sr-only 说明。
 */
const NAV = [
  { key: 'overview', href: '/', ready: true },
  { key: 'chronicle', href: '/chronicle/', ready: false },
  { key: 'leaderboard', href: '/leaderboard/', ready: true },
  { key: 'compare', href: '/compare/', ready: false },
] as const;

/**
 * `current` 是当前所在的路径。详情页也要用这个页头，而它上面的「总览」不是当前页——
 * 此前 `aria-current` 是写死的，详情页会对着读屏说「总览，当前页」，
 * 而用户根本不在总览上。
 *
 * 它同时决定站名是不是 `<h1>`：**一个页面只能有一个 h1**。首页的 h1 是站名，
 * 详情页的 h1 是型号名（`ModelHero`），所以站名在这里降级成同样样式的 `<span>`。
 * 一个页面两个 h1 会让读屏的标题导航多出一个同级的、内容却不是页面主题的条目。
 */
export function SiteHeader({ current = '/' }: { current?: string | null }) {
  const ready = NAV.filter((i) => i.ready);
  const unbuilt = NAV.filter((i) => !i.ready);
  const siteNameIsH1 = current === '/';

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base/95 backdrop-blur">
      <div className="page-shell flex h-14 items-center justify-between gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {siteNameIsH1 ? (
            <h1 className="shrink-0 text-lg font-semibold text-fg sm:text-xl">{dict.siteName}</h1>
          ) : (
            <span className="shrink-0 text-lg font-semibold text-fg sm:text-xl">{dict.siteName}</span>
          )}

          <nav aria-label="主导航">
            {ready.map((item) => {
              const here = item.href === current;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={here ? 'page' : undefined}
                  className={cx(
                    'flex min-h-11 shrink-0 items-center px-1.5 text-xs transition-colors duration-120 sm:px-2.5 sm:text-sm',
                    here ? 'text-fg' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  <span className={cx('border-b-2 pb-1', here ? 'border-accent' : 'border-transparent')}>
                    {dict.nav[item.key]}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
          <div className="w-full min-w-0 max-w-[170px] sm:max-w-xs">
            <GlobalSearch />
          </div>

          {/*
            这三条在**任何宽度都留在页面上**。此前它们被 `hidden md:flex` 从 390 下整条移除，
            而它们承载的是「这三个页面还没做」这个事实，不是装饰——按本项目的规矩，
            信息不进颜色，也不该进断点。窄屏省下的空间从内边距和缝隙里取：
            `px-2→px-1`、`gap-1→gap-0.5`，12px 字号与 `--fg-dim` 不动。
          */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {unbuilt.map((item) => (
              <span
                key={item.key}
                className="shrink-0 px-1 text-xs text-fg-dim sm:px-2"
                title={dict.nav.unbuilt}
              >
                {dict.nav[item.key]}
                <span className="sr-only">（{dict.nav.unbuilt}）</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
