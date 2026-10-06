import type { CSSProperties } from 'react';
import { logoFor } from '@/data/vendor-logos';
import { readableOnDark } from '@/lib/color';
import { cx } from './cx';

type LogoSize = 20 | 24 | 32;

interface VendorLogoProps {
  vendorId: string;
  /** 展示名。没有官方 logo 时用它取首字做兜底徽章 */
  name: string;
  /** 厂商品牌色（快照里的 accentColor）。给了就按品牌色渲染，否则跟 `--color-fg-muted` */
  brandColor?: string;
  size?: LogoSize;
  className?: string;
}

/**
 * 厂商标识。
 *
 * 有官方 logo 时走 **alpha 蒙版**：`mask-image` 只取形状，颜色由 CSS 决定。
 * 这样单色态与品牌色态共用同一份文件，不需要第二套素材，
 * 26 个兜底徽章也能与真 logo 在同一尺寸下保持一致的视觉重量。
 *
 * 没有 logo 时回落成单字徽章：品牌色 18% 的底 + 提亮后的品牌色字。
 * **永远不渲染空元素**——一个缺口会让整行看起来像坏掉了。
 *
 * 整体 `aria-hidden`：厂商名永远紧挨着它出现，把首字母再念一遍
 * 只会让读屏用户听到一个孤立的字符。
 */
export function VendorLogo({ vendorId, name, brandColor, size = 24, className }: VendorLogoProps) {
  const ref = logoFor(vendorId);

  /* 品牌色必须先提亮才能在深色底上当文字用；xAI 那种近黑色号不提亮等于隐形 */
  const tone = brandColor ? readableOnDark(brandColor, 0.42) : undefined;
  /* 走 CSS 变量而不是直接写 color，才能同时拥有「默认弱化」与「hover 转亮」 */
  const vars = { '--logo-tone': tone ?? 'var(--color-fg-muted)' } as CSSProperties;

  if (ref) {
    return (
      <span
        aria-hidden
        className={cx('inline-block shrink-0 bg-current text-[var(--logo-tone)] hover:text-fg', className)}
        style={{
          ...vars,
          width: size,
          height: size,
          maskImage: `url(/logos/${ref.file}.svg)`,
          WebkitMaskImage: `url(/logos/${ref.file}.svg)`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-sm font-medium leading-none',
        className,
      )}
      style={{
        ...vars,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        color: 'var(--logo-tone)',
        background: brandColor
          ? `color-mix(in srgb, ${brandColor} 18%, transparent)`
          : 'var(--color-raised)',
      }}
    >
      {initialOf(name)}
    </span>
  );
}

/** 中文取首字，拉丁取首字母并大写。`[...]` 展开是为了不切坏代理对。 */
function initialOf(name: string): string {
  const first = [...name.trim()][0] ?? '?';
  return /[a-z]/.test(first) ? first.toUpperCase() : first;
}
