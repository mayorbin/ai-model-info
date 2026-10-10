'use client';

import type { ReactNode } from 'react';
import { FOCUS } from './ui';

/**
 * 筛选条上的两种小控件。
 *
 * 按下态靠「边框提亮 + 背景抬一档」表达，不做彩色填充、不做阴影；
 * 未选中的**不装成禁用**（`--fg-faint`）——它们都能点，只是没被选中。
 *
 * 这两个只在筛选条里用，从 `ModelFilters` 拆出来只是因为它俩是自成一体的
 * 展示件：它们不认识 `FilterState`，只认识 `pressed` 与 `onClick`。
 */

/** 一组互斥的小按钮 */
export function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; text: string; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={label}>
      <span className="mr-0.5 shrink-0 text-2xs text-fg-dim">{label}</span>
      {options.map((o) => (
        <Chip key={o.id} pressed={o.id === value} onClick={() => onChange(o.id)} title={o.title}>
          {o.text}
        </Chip>
      ))}
    </div>
  );
}

export function Chip({
  pressed,
  onClick,
  children,
  title,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      onClick={onClick}
      className={`inline-flex min-h-7 items-center rounded-md border px-2 text-xs transition-colors duration-120 ${FOCUS} ${
        pressed ? 'border-line-strong bg-raised text-fg' : 'border-line bg-inset text-fg-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}
