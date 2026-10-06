import type { ReactNode } from 'react';
import { cx } from './cx';

type StatSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<StatSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

interface StatNumberProps {
  value: ReactNode;
  /** 数值后面的单位或说明。小一号、弱化，但**必须带等宽数字**，否则数字会对不齐 */
  unit?: ReactNode;
  size?: StatSize;
  className?: string;
}

/**
 * 大号读数。全站数字的呈现方式统一在这里：
 * 等宽 + tabular-nums + 中等字重。这是「终端感」的主要来源，
 * 也让同一列里的数字纵向对齐——对齐是能被扫读的前提。
 */
export function StatNumber({ value, unit, size = 'md', className }: StatNumberProps) {
  return (
    <span className={cx('tnum font-medium text-fg', SIZE[size], className)}>
      {value}
      {unit != null && <span className="ml-1 text-xs font-normal text-fg-dim">{unit}</span>}
    </span>
  );
}
