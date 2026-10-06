import type { ReactNode } from 'react';
import { cx } from './cx';

export type BadgeTone = 'pos' | 'neg' | 'warn' | 'accent' | 'neutral';

/**
 * 语义色取自 token，底色与边框用 `color-mix` 现算，
 * 这样组件里不必出现任何字面色值——改配色只动 globals.css。
 */
const TONE_TOKEN: Record<BadgeTone, string> = {
  pos: 'var(--color-pos)',
  neg: 'var(--color-neg)',
  warn: 'var(--color-warn)',
  accent: 'var(--color-accent)',
  neutral: 'var(--color-fg-muted)',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  title?: string;
  className?: string;
}

/**
 * 状态徽章。**只承载能从数据里判定的事实**（新发布 / 已退役 / 未参评 / 自报 / 资料不全），
 * 不做装饰性徽章——挂满徽章等于一个都没挂。
 */
export function Badge({ children, tone = 'neutral', title, className }: BadgeProps) {
  const token = TONE_TOKEN[tone];
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-2xs leading-[1.5] whitespace-nowrap',
        className,
      )}
      style={{
        color: token,
        borderColor: `color-mix(in srgb, ${token} 35%, transparent)`,
        background: `color-mix(in srgb, ${token} 12%, transparent)`,
      }}
      title={title}
    >
      {children}
    </span>
  );
}
