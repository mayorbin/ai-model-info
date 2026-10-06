import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { WorldSnapshot } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

/**
 * 数据状态行。一行等宽读数 + 一颗状态灯，取代原项目那个带像素描边与呼吸灯的
 * 「HUD 仪器读数」——同样的意图（这台机器正在联机），去掉游戏化的外壳。
 *
 * 灯的颜色是**唯一**会用语义色的地方之一：全部数据源成功 = 绿，全部失败 = 红，
 * 部分成功 = 黄。它旁边永远有「数据源 4/6」的文字，颜色不是唯一的信息载体。
 */
export function StatusBar({ snapshot }: { snapshot: WorldSnapshot }) {
  const sources = Object.values(snapshot.sources);
  const ok = sources.filter((s) => s.ok).length;
  const tone =
    ok === sources.length
      ? 'var(--color-pos)'
      : ok === 0
        ? 'var(--color-neg)'
        : 'var(--color-warn)';

  return (
    <div className="page-shell flex flex-wrap items-center gap-x-2.5 gap-y-1 py-2 text-2xs text-fg-dim">
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: tone, boxShadow: `0 0 6px ${tone}` }}
        />
        <span className="tnum">{dict.hud.updatedAt(snapshot.generatedAt.slice(0, 10))}</span>
      </span>
      <span aria-hidden className="text-fg-faint">
        ·
      </span>
      <span className="tnum">
        {dict.hud.modelCount(snapshot.models.length, snapshot.vendors.length)}
      </span>
      <span aria-hidden className="text-fg-faint">
        ·
      </span>
      <span className="tnum">{dict.hud.sources(ok, sources.length)}</span>
    </div>
  );
}
