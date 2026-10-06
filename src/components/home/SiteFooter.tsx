import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { WorldSnapshot } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

/**
 * 页脚。左边交代数据出处，右边给出可核对的原始源清单。
 *
 * 只列**本次抓取成功**的数据源：把失败的一起列出来会让「数据来自这些地方」
 * 变成一句不准确的话。全部失败时如实说明。
 */
export function SiteFooter({ snapshot }: { snapshot: WorldSnapshot }) {
  const ok = Object.entries(snapshot.sources)
    .filter(([, s]) => s.ok)
    .map(([id]) => id);

  return (
    <footer className="mt-14 border-t border-line">
      <div className="page-shell flex flex-wrap items-baseline gap-x-3 gap-y-2 py-6 text-2xs text-fg-dim">
        <span className="text-fg-muted">{dict.footer.dataFrom}</span>
        <span className="tnum min-w-0 flex-1">
          {ok.length > 0 ? ok.join(' · ') : '本次同步没有任何数据源成功'}
        </span>
        <span className="tnum text-fg-faint">
          快照 {snapshot.generatedAt.slice(0, 10)}
        </span>
      </div>
    </footer>
  );
}
