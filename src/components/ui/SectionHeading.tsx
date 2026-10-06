import { cx } from './cx';

interface SectionHeadingProps {
  title: string;
  /** 右侧的等宽计数，如「13 家」 */
  count?: string;
  /** 分区识别色，会作为标题左侧的 3px 竖条。只用于国外/国内这类分区 */
  accentColor?: string;
  /** 悬停解释这一组的判定依据 */
  hint?: string;
  className?: string;
}

/** 分组标题：13px 半粗 + 右侧等宽计数 + 一条贯穿的分隔线。 */
export function SectionHeading({ title, count, accentColor, hint, className }: SectionHeadingProps) {
  return (
    <div
      className={cx('flex items-center gap-2 border-b border-line pb-2', className)}
      title={hint}
    >
      {accentColor != null && (
        <span
          aria-hidden
          className="h-3 w-[3px] shrink-0 rounded-sm"
          style={{ background: accentColor }}
        />
      )}
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {count != null && <span className="tnum ml-auto text-xs text-fg-dim">{count}</span>}
    </div>
  );
}
