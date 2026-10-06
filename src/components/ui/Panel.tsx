import type { ReactNode } from 'react';
import { cx } from './cx';

interface PanelProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'section';
}

/**
 * 基础容器：背景 + 1px 边框 + 小圆角，**不带阴影，也不带悬停反馈**。
 *
 * 暗色界面上阴影几乎不可见，却会让相邻层次糊成一团；层级一律交给背景明度差
 * 与那根 1px 线。
 *
 * 刻意**没有**悬停提亮。卡片是容器，不是控件：此前每张卡片都会 hover 提亮，
 * 而整页只有 1 个可聚焦元素——于是 47 张卡片一起发光却什么都点不了，
 * 那是页面上最误导的一处交互。**悬停态是控件的特权。**
 *
 * 也刻意**没有** accentColor 左缘竖条：全站唯一的使用者是样式规范页的演示，
 * 产品里一处没用到，而「卡片上加一条几像素的彩色边」是品类默认做法，
 * 不是这套世界挣来的。真要标示归属，用分区标题上那根 3px 竖条。
 */
export function Panel({ children, className, as: Tag = 'div' }: PanelProps) {
  return <Tag className={cx('rounded-md border border-line bg-panel', className)}>{children}</Tag>;
}
