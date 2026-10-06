import { cx } from '@/components/ui/cx';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { KindGroup } from '@/lib/kind';

const dict = getDict(DEFAULT_LANG);

/**
 * 按类型看：六个入口，一行排开，彼此用 1px 竖线分隔。
 *
 * 首页上展示的门面必然是对话模型，所以图像生成、视频生成、语音这三类
 * 在这里是它们唯一的露脸机会。
 *
 * **但它们目前还不是链接**：对应的路由不在交付范围内，所以这里只是不可点的展示，
 * 于是也**不能给它们悬停反馈**——六张 chip 一起亮起来却什么都点不了，
 * 和曾经那 47 张发光卡片是同一个错误。等路由落地再换成 <Link> 并把悬停加回来。
 */
export function KindStrip({ groups }: { groups: KindGroup[] }) {
  return (
    <section aria-labelledby="kinds-heading">
      <SectionHeading id="kinds-heading" title={dict.kind.sectionTitle} />
      <div className="mt-3 flex flex-wrap items-stretch overflow-hidden rounded-md border border-line bg-panel">
        {groups.map((g, i) => (
          <div
            key={g.kind}
            className={cx(
              'flex min-w-0 flex-1 basis-40 items-center gap-2 px-3 py-2.5',
              i > 0 && 'border-l border-line',
            )}
            title={dict.kind.hint[g.kind]}
          >
            <span className="truncate text-sm text-fg">{dict.kind.label[g.kind]}</span>
            {/*
              计数紧跟标签，不用 ml-auto 推到右缘：chip 被 flex-1 拉到 ~219px，
              推到右缘后计数离下一个 chip 的标签只有 ~25px、离自己的标签 180px，
              按邻近性读起来像是归了下一格。
            */}
            <span className="tnum shrink-0 text-xs text-fg-dim">{g.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
