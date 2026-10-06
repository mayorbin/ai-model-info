import { cx } from './cx';

interface SectionHeadingProps {
  title: string;
  /** 供 `aria-labelledby` 指向；给分区标题用 */
  id?: string;
  /** 右侧的等宽计数，如「13 家」 */
  count?: string;
  /** 分区识别色，会作为标题左侧的 3px 竖条。只用于国外/国内这类分区 */
  accentColor?: string;
  /** 悬停解释这一组的判定依据 */
  hint?: string;
  className?: string;
}

/**
 * 分组标题：16px 半粗 + 右侧等宽计数 + 一条贯穿的分隔线。
 *
 * 16px 是**块级标题**的唯一尺寸。此前 13px/600 同时当分区标题、厂商名、模型名和类型标签，
 * 四个语义层级长得一模一样——「这是什么块」和「这是哪个条目」读起来没有区别，
 * 40 张卡片因此无法被分块。现在 13px/600 只留给模型名。
 */
export function SectionHeading({
  title,
  id,
  count,
  accentColor,
  hint,
  className,
}: SectionHeadingProps) {
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
      <h2 id={id} className="text-lg font-semibold text-fg">
        {title}
      </h2>
      {count != null && <span className="tnum ml-auto text-xs text-fg-dim">{count}</span>}
    </div>
  );
}
