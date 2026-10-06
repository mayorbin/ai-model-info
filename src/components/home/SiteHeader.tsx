import Link from 'next/link';
import { cx } from '@/components/ui/cx';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';

const dict = getDict(DEFAULT_LANG);

/**
 * 导航项。`ready` 为 false 的三条指向尚未实现的路由。
 *
 * 静态导出下指向不存在的路由会得到一个真的 404 页——那是坏链接，不是占位。
 * 所以未实现的渲染成不可点的文字，对应批次落地时把 ready 改成 true 即可。
 */
const NAV = [
  { key: 'overview', href: '/', ready: true },
  { key: 'chronicle', href: '/chronicle/', ready: false },
  { key: 'leaderboard', href: '/leaderboard/', ready: false },
  { key: 'compare', href: '/compare/', ready: false },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base/95 backdrop-blur">
      <div className="page-shell flex h-14 items-center gap-4">
        <span className="shrink-0 text-base font-semibold tracking-tight text-fg">
          {dict.siteName}
        </span>

        {/* 搜索在本次变更范围外，这里只占位，不做成假输入框骗取点击 */}
        <span
          className="hidden h-7 max-w-[220px] flex-1 items-center rounded-sm border border-line bg-inset px-2.5 text-2xs text-fg-faint md:flex"
          title="搜索尚未接入（不在本次变更范围内）"
        >
          搜索模型 / 厂商 / 能力
        </span>

        <nav className="ml-auto flex shrink-0 items-center gap-5" aria-label="主导航">
          {NAV.map((item) => {
            const label = dict.nav[item.key];
            if (item.ready) {
              const current = item.key === 'overview';
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={cx(
                    'border-b-2 pb-1 text-sm transition-colors duration-120',
                    current ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg',
                  )}
                >
                  {label}
                </Link>
              );
            }
            return (
              <span
                key={item.key}
                className="text-sm text-fg-faint"
                title="该页面不在本次变更范围内"
                aria-disabled
              >
                {label}
              </span>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
