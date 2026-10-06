import { cx } from './cx';

/** 格数。8 格是能在 240px 卡片宽度里同时装下标签、格子和数值的上限 */
const CELLS = 8;

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
  /** 悬停全文：含数据出处与「在多少个有成绩的模型里排第几」 */
  title?: string;
  className?: string;
}

/**
 * 能力条。有数据的格数 = 分位档，空槽 = 没有数据。
 *
 * 颜色**不是唯一的信息载体**：右侧永远跟着一个等宽数值文本，
 * 色弱读者与灰度打印都能正确读出信息。
 */
export function MetricBar({ fill, label, literal, tone, title, className }: MetricBarProps) {
  /*
   * 有数据时至少点亮一格。分位 0.03 若按四舍五入画成 0 格，
   * 读者会读成「没有数据」——而它其实只是「很弱」，两者差得很远。
   */
  const filled = fill == null ? 0 : Math.max(1, Math.round(Math.min(1, Math.max(0, fill)) * CELLS));

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
               * --line（1.27:1）：这一圈是「8 格里的第几格」这个分母唯一的载体，
               * WCAG 1.4.11 要求承载含义的图形 ≥3:1。
               */
              i >= filled && 'border border-meter-empty bg-inset',
            )}
            style={i < filled ? { background: tone ?? 'var(--color-accent)' } : undefined}
          />
        ))}
      </span>

      <span className="tnum ml-auto shrink-0 text-xs text-fg-dim">{literal ?? '—'}</span>
    </div>
  );
}
