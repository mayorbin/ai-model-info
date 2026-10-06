import type { ReactNode } from 'react';
import { cx } from './cx';

interface PanelProps {
  children: ReactNode;
  /** 左缘 3px 竖条的颜色。传 CSS 颜色值，通常取 var(--color-west/east) 或厂商品牌色 */
  accentColor?: string;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'section';
  /** 悬停时是否提亮边框。列表里的行建议关掉，避免整屏都在闪 */
  interactive?: boolean;
}

/**
 * 基础容器：背景 + 1px 边框 + 小圆角，**不带阴影**。
 *
 * 暗色界面上阴影几乎不可见，却会让相邻层次糊成一团；层级一律交给
 * 背景明度差与那根 1px 线。这条约定写在 globals.css 的顶部。
 */
export function Panel({
  children,
  accentColor,
  className,
  as: Tag = 'div',
  interactive = true,
}: PanelProps) {
  return (
    <Tag
      className={cx(
        'rounded-md border border-line bg-panel',
        interactive && 'transition-colors duration-120 hover:border-line-strong hover:bg-raised',
        className,
      )}
      /*
       * 用 inset 阴影而不是 border-left 画竖条：border-left 会挤动内容，
       * 而这条竖条是纯装饰，不该影响任何一行的排版。
       */
      style={accentColor ? { boxShadow: `inset 3px 0 0 0 ${accentColor}` } : undefined}
    >
      {children}
    </Tag>
  );
}
