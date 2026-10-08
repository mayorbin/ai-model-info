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

/**
 * `current` 是当前所在的路径。详情页也要用这个页头，而它上面的「总览」不是当前页——
 * 此前 `aria-current` 是写死的，详情页会对着读屏说「总览，当前页」，
 * 而用户根本不在总览上。
 */
export function SiteHeader({ current = '/' }: { current?: string | null }) {
  const ready = NAV.filter((i) => i.ready);
  const unbuilt = NAV.filter((i) => !i.ready);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base/95 backdrop-blur">
      <div className="page-shell flex h-14 items-center gap-4">
        {/*
          真 <h1>。首页此前一个 h1 都没有，文档大纲直接从 h2 开始，
          读屏用户的标题导航会整层缺失。

          16px 是为了**不低于自己的 h2**（分区标题也是 16px/600）——曾经是 14px，
          标题层级的最上层反而比第二层小。另外去掉了 tracking-tight：负字距对 CJK
          是错的，中文没有英文那种需要收紧的字距对。
        */}
        <h1 className="shrink-0 text-lg font-semibold text-fg">{dict.siteName}</h1>

        {/*
          这里此前有个「搜索」占位：一个带边框、圆角、bg-inset、固定高度的 span。
          注释写着「不做成假输入框骗取点击」，但它的形状就是输入框——而它挂在
          不可聚焦的元素上，那个解释用的 title 在键盘和触屏上都拿不到。
          读者按键、点击、什么都不发生，于是把这一页读成坏了而不是静态的。
          搜索真的接进来之前，它就该待在这里。

          导航链接用 min-h-11 + 横向内边距把命中区抬到 44px 见方（实测此前是 26×27）。
          下划线移到内层 span 上，位置与改前一致。
        */}
        <nav className="ml-auto flex shrink-0 items-center gap-3" aria-label="主导航">
          {ready.map((item) => {
            const here = item.href === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={here ? 'page' : undefined}
                className={cx(
                  'flex min-h-11 shrink-0 items-center px-2.5 text-sm transition-colors duration-120',
                  here ? 'text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                <span className={cx('border-b-2 pb-1', here ? 'border-accent' : 'border-transparent')}>
                  {dict.nav[item.key]}
                </span>
              </Link>
            );
          })}
          {unbuilt.map((item) => (
            <span
              key={item.key}
              className="shrink-0 px-2.5 text-sm text-fg-faint"
              title="该页面不在本次变更范围内"
              aria-disabled
            >
              {dict.nav[item.key]}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
