import Link from 'next/link';
import { cx } from '@/components/ui/cx';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { GlobalSearch } from './GlobalSearch';

const dict = getDict(DEFAULT_LANG);

/**
 * 导航项。
 *
 * 四条路由现在**全部落地**，所以 `ready` 这个开关连同「未实现」那一串文字一起删掉了。
 * 那条规则本身仍然成立，只是当前没有适用对象：静态导出下指向不存在的路由会得到
 * 一个真的 404 页——那是坏链接，不是占位；一旦再出现「计划中但还没做」的页面，
 * 就照旧做成 `<nav>` 外面的一句陈述 + sr-only 说明，而不是 `<nav>` 里的假链接。
 */
const NAV = [
  { key: 'overview', href: '/' },
  { key: 'chronicle', href: '/chronicle/' },
  { key: 'leaderboard', href: '/leaderboard/' },
  { key: 'compare', href: '/compare/' },
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
            {NAV.map((item) => {
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
        </div>
      </div>
    </header>
  );
}
