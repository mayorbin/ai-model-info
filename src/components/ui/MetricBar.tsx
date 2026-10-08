import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { cx } from './cx';

/** 格数。8 格是能在 240px 卡片宽度里同时装下标签、格子和数值的上限 */
const CELLS = 8;

const dict = getDict(DEFAULT_LANG);

interface MetricBarProps {
  /**
   * 填充比例 0~1。**null 表示没有数据**，画成空槽。
   * 这与 0 是两件事：没测过 ≠ 得了零分，界面上必须分得清。
   */
  fill: number | null;
  /** 条子左边的标签，两个字 */
  label?: string;
  /** 条右边的短标，如「世界#1」「1M」「$50」 */
  literal?: string | null;
  /** 填充色。默认 accent，冠军场景传 var(--color-gold) */
  tone?: string;
  /** 完整出处与样本量。会被渲染成视觉隐藏文本，鼠标悬停也能看到 */
  title?: string;
  className?: string;
}

/**
 * 能力条。有数据的格数 = 分位档，空槽 = 没有数据。
 *
 * **分母写进文字**（`5/8 · 世界#1`）。空槽那一圈最多只能提到 3.14:1
 * （见 `--meter-empty`）：几何能承载「大概几格」，承载不了「精确的 8 分之几」，
 * 而分母是这一行一半的信息。这也让项目自己的那条规则落到几何上——
 * **颜色和形状都不是唯一的信息载体**。
 *
 * **值比标签亮一档**：数字是内容，标签是周边说明。全站用量长期堆在两端、
 * 中间那档没人用，这是把它用起来的其中一处。
 */
export function MetricBar({ fill, label, literal, tone, title, className }: MetricBarProps) {
  const hasData = fill != null;
  /*
   * 有数据时至少点亮一格。分位 0.03 若按四舍五入画成 0 格，
   * 读者会读成「没有数据」——而它其实只是「很弱」，两者差得很远。
   */
  const filled = hasData
    ? Math.max(1, Math.round(Math.min(1, Math.max(0, fill)) * CELLS))
    : 0;

  const display = hasData
    ? `${filled}/${CELLS}${literal ? ` · ${literal}` : ''}`
    : (literal ?? dict.unknown.notMeasured);

  return (
    <div className={cx('flex items-center gap-2', className)} title={title}>
      {label != null && <span className="w-8 shrink-0 text-xs text-fg-dim">{label}</span>}

      <span className="flex gap-[2px]" role="presentation">
        {Array.from({ length: CELLS }, (_, i) => (
          <span
            key={i}
            className={cx(
              'h-2.5 w-2.5 rounded-sm',
              /*
               * 空格子用 --meter-empty（3.14:1）而不是 --line-strong（1.62:1）或
               * --line（1.27:1）：这一圈是「8 格里的第几格」这个分母唯一的**图形**
               * 载体，WCAG 1.4.11 要求承载含义的图形 ≥3:1。
               */
              i >= filled && 'border border-meter-empty bg-inset',
            )}
            style={i < filled ? { background: tone ?? 'var(--color-accent)' } : undefined}
          />
        ))}
      </span>

      <span className="tnum ml-auto shrink-0 text-xs text-fg-muted">{display}</span>

      {/*
        `title` 挂在 div 上，键盘与触屏都拿不到，而且它作为可访问性描述并不可靠。
        同一段文字放进视觉隐藏的 span，读屏就能念出来——零像素成本。
        `title` 保留，作为鼠标用户的冗余入口。
      */}
      {title != null && <span className="sr-only">{title}</span>}
    </div>
  );
}
