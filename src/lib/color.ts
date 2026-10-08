/**
 * 厂商主色直接拿来当深色背景上的文字或剪影会出问题——
 * xAI 的品牌色是近乎纯黑的 #1d1d1f，画在夜色地面上等于隐形。
 * 这里把过暗的颜色按需提亮，但保留色相，让品牌识别度不丢。
 *
 * **在 HSL 空间里做，不在 RGB 里做。** 此前是「通道乘 1.18 再加 6」逐步逼近亮度下限，
 * 有两个后果，实测都成立：
 *
 * 1. **通道截断把色相推走。** 蓝色一族的 B 通道先撞到 255、R/G 还在涨，比值一变形，
 *    Google 的 #4285f4 被提亮成了 #69c6ff——一个青色，不是它自己的蓝。
 * 2. **每一步都过冲。** 一步就从相对亮度 0.325 跳到 0.462（目标 0.42），
 *    提亮后中位明度到了 73%，最亮的到 84%。
 *
 * 加上彩度同时被顶到 100%，65 家里有 **31 家**的最终颜色是「又亮又满」= 最大化的霓虹感，
 * 在全站唯一一条「克制」的设计立场上，logo 反而成了最扎眼的东西。
 *
 * 现在：固定色相与（夹过的）彩度，二分找出刚好越线的明度，不过冲、不截断。
 */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(rgb: [number, number, number]): string {
  return (
    '#' +
    rgb
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** WCAG 相对亮度 */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** 色相 h、彩度 s、明度 l，三者都在 0–1。 */
function rgbToHsl(r: number, g: number, b: number) {
  const ch = [r / 255, g / 255, b / 255];
  const max = Math.max(ch[0], ch[1], ch[2]);
  const min = Math.min(ch[0], ch[1], ch[2]);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === ch[0]
      ? ((ch[1] - ch[2]) / d + (ch[1] < ch[2] ? 6 : 0)) / 6
      : max === ch[1]
        ? ((ch[2] - ch[0]) / d + 2) / 6
        : ((ch[0] - ch[1]) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

/**
 * 把品牌色收到「深色底上可用」的区间：提亮到至少 `minLum` 的相对亮度，
 * 同时把彩度压到 `maxSat` 以内。
 *
 * - **色相不动**，厂商标识度靠色相 + 蒙版形状保住；
 * - **彩度上限**：暗色页面靠明度建层级，满彩度的元素会盖过内容。
 *   0.72 是「还看得出是这家品牌色」与「不再是霓虹」之间的取位，65 家里的
 *   满彩度色数从 31 降到 0；
 * - 纯灰阶色（品牌色是黑或白的情况）没有色相可保，直接抬到中性亮灰。
 */
export function readableOnDark(hex: string, minLum = 0.22, maxSat = 0.72): string {
  const rgb = parseHex(hex);
  if (Math.max(rgb[0], rgb[1], rgb[2]) < 12) return '#c8ccd8';

  const { h, s, l } = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const sat = Math.min(s, maxSat);

  // 已经够亮：只把过艳的收一收，明度不动——原样的品牌色不该被我们改写
  if (luminance(rgb) >= minLum) {
    return s <= maxSat ? hex : toHex(hslToRgb(h, sat, l));
  }

  // 需要提亮：固定色相与彩度，二分出**刚好**越线的最小值，避免过冲
  let lo = l;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (luminance(hslToRgb(h, sat, mid)) >= minLum) hi = mid;
    else lo = mid;
  }
  return toHex(hslToRgb(h, sat, hi));
}
