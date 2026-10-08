import Link from 'next/link';
import { cx } from '@/components/ui/cx';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';

const dict = getDict(DEFAULT_LANG);

/**
 * 导航项。`ready` 为 false 的三条指向尚未实现的路由。
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
  { key: 'leaderboard', href: '/leaderboard/', ready: false },
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
      <div className="page-shell flex h-14 items-center gap-4">
        {/*
          真 <h1>。首页此前一个 h1 都没有，文档大纲直接从 h2 开始，
          读屏用户的标题导航会整层缺失。

          **20px 而不是 16px。** 16px 是为了「不低于自己的 h2」而定的
          （分区标题也是 16px/600），可那只解决了「不大于」，没解决「不大」——
          实测那一版 h1 与每一个分区标题同号同重，站名成了全页最安静的三个字，
          而它上面只有 26px 的冠军读数。20px 仍然低于冠军读数，不喧宾夺主，
          但站名第一次有了站名的体量。
        */}
        {siteNameIsH1 ? (
          <h1 className="shrink-0 text-xl font-semibold text-fg">{dict.siteName}</h1>
        ) : (
          <span className="shrink-0 text-xl font-semibold text-fg">{dict.siteName}</span>
        )}

        {/*
          这里此前有个「搜索」占位：一个带边框、圆角、bg-inset、固定高度的 span。
          注释写着「不做成假输入框骗取点击」，但它的形状就是输入框——而它挂在
          不可聚焦的元素上，那个解释用的 title 在键盘和触屏上都拿不到。
          读者按键、点击、什么都不发生，于是把这一页读成坏了而不是静态的。
          搜索真的接进来之前，它就该待在这里。

          导航链接用 min-h-11 + 横向内边距把命中区抬到 44px 见方（实测此前是 26×27）。
          下划线移到内层 span 上，位置与改前一致。
        */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <nav aria-label="主导航">
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
          </nav>

          {unbuilt.map((item) => (
            /*
             * `--fg-dim`（6.41:1）而不是 `--fg-faint`（3.44:1）。
             *
             * 这一条是被 finish review 抓到的：它们此前挂 `--fg-faint`，依据是
             * 「WCAG 对 disabled 控件有豁免」——可它们**已经从 `<nav>` 里出来了**，
             * 现在是三个普通的文字标签，不是 inactive 的 UI 组件，豁免不再覆盖它们。
             * 而它们确实承载信息（这三个页面计划要做）。
             *
             * 于是按这套系统自己的规矩办：`--fg-faint` 只表示 disabled、不承载信息文本，
             * 而这三条是信息文本 → 走 `--fg-dim`。
             * 「还没做」这件事改由 `title` + `sr-only` 那句话承担，
             * 不再靠把字调暗来表达——**那正是「不把信息编码进颜色」的反面**。
             */
            <span
              key={item.key}
              className="shrink-0 px-2.5 text-sm text-fg-dim"
              title={dict.nav.unbuilt}
            >
              {dict.nav[item.key]}
              {/* title 挂在不聚焦的元素上，键盘与触屏都拿不到 → 同一句话放进 sr-only */}
              <span className="sr-only">（{dict.nav.unbuilt}）</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
