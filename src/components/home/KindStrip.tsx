import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { KindGroup } from '@/lib/kind';

const dict = getDict(DEFAULT_LANG);

/**
 * 按类型看：六个类目，一行排开，用「·」分隔。
 *
 * 首页上展示的门面必然是对话模型，所以图像生成、视频生成、语音这三类
 * 在这里是它们唯一的露脸机会。
 *
 * **这六格不是控件，所以不能长成控件的样子。** 此前它们装在一个带 1px 边框的容器里、
 * 被 `flex-1` 拉成等宽、彼此用竖线分隔——读起来就是一条筛选条，
 * 而对应的路由不在交付范围内，于是六格一起看起来能点、点了什么都不发生。
 * 与曾经那 47 张发光卡片是同一个错误，只是这次错在形状而不是错在悬停。
 *
 * 现在降级成一句陈述，用 StatusBar 已有的那个「标签 计数」句式。
 * 路由落地后再换成 <Link>，那时它才有资格长回控件的形状。
 */
export function KindStrip({ groups }: { groups: KindGroup[] }) {
  return (
    <section aria-labelledby="kinds-heading">
      <SectionHeading id="kinds-heading" title={dict.kind.sectionTitle} />
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        {groups.map((g, i) => (
          /*
           * 每一格是一个不可断开的 inline-flex，「·」跟在后一段前面而不是前一段后面。
           * 窄屏下再把它整个隐去（只留间距）——绑到后一段只解决了行尾孤儿，
           * 实测 390 下会变成行首孤儿（「· 视频生成 6」），StatusBar 早就用的是隐去这一招。
           * 计数紧跟标签（不用 ml-auto 推到右缘）：chip 被拉伸时计数离下一个标签比离自己的标签还近，
           * 按邻近性会读成归了下一格。
           */
          <span key={g.kind} className="inline-flex items-center gap-1.5" title={dict.kind.hint[g.kind]}>
            {i > 0 && (
              <span aria-hidden className="hidden text-line-strong sm:inline">
                ·
              </span>
            )}
            <span className="text-fg">{dict.kind.label[g.kind]}</span>
            <span className="tnum text-xs text-fg-dim">{g.count}</span>
            {/* title 挂在不聚焦的元素上，键盘与触屏都拿不到；同一句话放进 sr-only，零像素成本 */}
            <span className="sr-only">{dict.kind.hint[g.kind]}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
