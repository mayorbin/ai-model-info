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

  /*
   * 报**在役**模型数而不是快照总量：下方「按类型看」的六个数字合计正是这个数，
   * 两处对不上会让读者以为哪边算错了。已退役的模型不进任何一处展示，
   * 把它们的数量混进状态行只会制造矛盾。
   */
  const alive = snapshot.models.filter((m) => !m.retiredAt).length;

  return (
    /*
     * 用 --fg-muted 而不是 --fg-dim：这是**页面级状态**（数据新旧、规模、源健康度），
     * 不是周边的说明文字。全站用量此前堆在两端、中间那档没人用，这是把它用起来的其中一处。
     */
    <div className="page-shell flex flex-wrap items-center gap-x-2.5 gap-y-1 py-2 text-2xs text-fg-muted">
      <span className="inline-flex items-center gap-1.5">
        {/*
          没有辉光。此前这里挂了 `box-shadow: 0 0 6px`，是这套明令禁止渐变光晕的
          系统里唯一的辉光——零偏移的彩色光晕是装饰，不是深度，删掉。灯本身的颜色
          已经足够传达状态，何况旁边永远跟着「数据源 10/10」的文字。
        */}
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone }} />
        <span className="tnum">{dict.hud.updatedAt(snapshot.generatedAt.slice(0, 10))}</span>
      </span>
      <span aria-hidden className="text-line-strong">
        ·
      </span>
      <span className="tnum">{dict.hud.modelCount(alive, snapshot.vendors.length)}</span>
      <span aria-hidden className="text-line-strong">
        ·
      </span>
      <span className="tnum">{dict.hud.sources(ok, sources.length)}</span>
    </div>
  );
}
