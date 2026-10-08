import Link from 'next/link';
import { Fragment } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { KindGroup } from '@/lib/kind';

const dict = getDict(DEFAULT_LANG);

/**
 * 按类型看：六个类目，每格给出计数与三个代表型号。
 *
 * 首页上展示的门面必然是对话模型，所以图像生成、视频生成、语音这三类
 * 在这里是它们唯一的露脸机会。
 *
 * **这六个类目不是控件，所以不长成控件的样子**——没有边框、没有底色、没有 chip 外形，
 * 只有「标签 计数」和下面一行代表型号。此前它们装在一个带 1px 边框的容器里、
 * 被 `flex-1` 拉成等宽、彼此用竖线分隔，读起来就是一条筛选条，而对应路由不存在，
 * 于是六格看起来都能点、点了什么都不发生（与曾经那 47 张发光卡片同源，只是错在形状）。
 *
 * **代表型号是链接**，而这不是把筛选条请回来：那三个型号真的有页面可去，
 * 所以它们有资格长成链接。`kind.ts` 一直在算这三个名字（`representatives`），
 * 此前没人渲染它——于是「图像生成 23」只告诉读者存在，不给任何抓手。
 */
export function KindStrip({ groups }: { groups: KindGroup[] }) {
  return (
    <section aria-labelledby="kinds-heading">
      <SectionHeading id="kinds-heading" title={dict.kind.sectionTitle} />
      {/*
        两列 / 三列栅格而不是一行 flex-wrap：六个类目各占一格，
        代表型号才有地方排成一行而不被挤成一团。390 下每格独占一行，读起来是六条定义。
      */}
      <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.kind} className="min-w-0">
            <dt className="flex items-baseline gap-1.5" title={dict.kind.hint[g.kind]}>
              <span className="text-fg">{dict.kind.label[g.kind]}</span>
              <span className="tnum text-xs text-fg-dim">{g.count}</span>
              {/* title 挂在不可聚焦的 dt 上，键盘与触屏都拿不到 → 同一句话放进 sr-only */}
              <span className="sr-only">{dict.kind.hint[g.kind]}</span>
            </dt>
            <dd className="mt-1 flex min-w-0 items-center gap-x-1.5 text-2xs">
              {g.representatives.map((m, i) => (
                <Fragment key={m.id}>
                  {/* 「·」绑在后一段前面，折行时行尾不会留下孤零零的分隔符 */}
                  {i > 0 && (
                    <span aria-hidden className="shrink-0 text-line-strong">
                      ·
                    </span>
                  )}
                  <Link
                    href={`/model/${m.slug}/`}
                    /*
                     * `title` 是必需的：390 下这三个名字一律被截断，
                     * 而鼠标用户没有第二条路读到全名（链接本身能点进去，
                     * 但「点到哪个才是我要的那个」这一步就靠它了）。
                     */
                    title={m.name}
                    className="min-w-0 truncate text-fg-dim transition-colors duration-120 hover:text-fg hover:underline hover:underline-offset-4"
                  >
                    {m.name}
                  </Link>
                </Fragment>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
