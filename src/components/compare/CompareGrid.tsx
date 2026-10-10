import type { CSSProperties, ReactNode } from 'react';

/**
 * 对比页每一行共用的网格：左边一列标签，右边每个模型一列。
 * 窄屏上标签独占一行，横向不再分栏——四列的对比表在 390px 下没法读。
 *
 * 列数通过 CSS 变量 `--n` 传，因为它是运行时的（1–4 个模型），
 * 而 Tailwind 的栅格类名必须在构建期写全。
 */
export function CompareGrid({
  n,
  children,
  className = '',
}: {
  n: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-x-3 sm:grid-cols-[minmax(120px,200px)_repeat(var(--n),minmax(0,1fr))] sm:gap-x-5 ${className}`}
      style={{ '--n': n } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** 行首标签。窄屏占满一行（`col-span-full`），桌面回到第一列 */
export function RowLabel({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div
      title={title}
      className="col-span-full pt-2 text-xs leading-snug text-fg-dim sm:col-span-1 sm:py-2"
    >
      {children}
    </div>
  );
}
