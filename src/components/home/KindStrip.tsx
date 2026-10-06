import { cx } from '@/components/ui/cx';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { KindGroup } from '@/lib/kind';

const dict = getDict(DEFAULT_LANG);

/**
 * 按类型看：六个入口，一行排开，彼此用 1px 竖线分隔。
 *
 * 首页上展示的门面必然是对话模型，所以图像生成、视频生成、语音这三类
 * 在这里是它们唯一的露脸机会，也是按类型钻进总表的入口。
 */
export function KindStrip({ groups }: { groups: KindGroup[] }) {
  return (
    <section aria-labelledby="kinds-heading">
      <h2 id="kinds-heading" className="text-sm font-semibold text-fg">
        {dict.kind.sectionTitle}
      </h2>
      <div className="mt-3 flex flex-wrap items-stretch overflow-hidden rounded-md border border-line bg-panel">
        {groups.map((g, i) => (
          <div
            key={g.kind}
            className={cx(
              'flex min-w-0 flex-1 basis-40 items-center gap-2 px-3 py-2.5 transition-colors duration-120 hover:bg-raised',
              i > 0 && 'border-l border-line',
            )}
            title={dict.kind.hint[g.kind]}
          >
            <span className="truncate text-sm text-fg">{dict.kind.label[g.kind]}</span>
            <span className="tnum ml-auto shrink-0 text-xs text-fg-dim">{g.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
