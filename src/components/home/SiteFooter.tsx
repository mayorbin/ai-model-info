import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { WorldSnapshot } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

/**
 * 页脚。左边交代数据出处，右边给出可核对的原始源清单。
 *
 * 只列**本次抓取成功**的数据源：把失败的一起列出来会让「数据来自这些地方」
 * 变成一句不准确的话。全部失败时如实说明。
 */
/** 管线内部的加工阶段，不是「数据来自哪里」，不该出现在出处声明里 */
const INTERNAL_STAGES = new Set(['derived', 'override']);

export function SiteFooter({ snapshot }: { snapshot: WorldSnapshot }) {
  const ok = Object.entries(snapshot.sources)
    .filter(([id, s]) => s.ok && !INTERNAL_STAGES.has(id))
    .map(([id]) => id);

  return (
    <footer className="mt-14 border-t border-line">
      <div className="page-shell flex flex-wrap items-baseline gap-x-3 gap-y-2 py-6 text-2xs text-fg-dim">
        <span className="text-fg-muted">{dict.footer.dataFrom}</span>
        {/*
          basis-full：窄屏下让数据源清单独占一行。否则清单折成 4 行时，快照日期
          会和它挤在同一条 flex 线上、并按基线对齐到清单的第一行，读起来变成
          「…litellm 快照 2026-10-06 · livebench…」——信任锚点看起来像第 4 个数据源。
        */}
        <span className="tnum min-w-0 basis-full sm:flex-1">
          {ok.length > 0 ? ok.join(' · ') : '本次同步没有任何数据源成功'}
        </span>
        {/*
          快照日期是读者用来判断这页可不可信的锚点，不能是全页最读不清的一行。
          用 muted 而不是 dim：它是**状态**，不是标签。
        */}
        <span className="tnum text-fg-muted">快照 {snapshot.generatedAt.slice(0, 10)}</span>
      </div>
    </footer>
  );
}
