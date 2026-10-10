/**
 * 排行榜 / 总表共用的控件外观常量。
 *
 * 三个文件都要这套字符串：`ModelFilters` 的输入框与下拉、`AllModelsTable` 的列头按钮、
 * `LeaderboardExplorer` 的赛道按钮与展开按钮。**只写一遍**——它会随设计系统一起改
 * （比如焦点环颜色），抄在四处就一定会漏掉一处。
 */

/** 焦点环：与全站一致，只在键盘 tab 时可见 */
export const FOCUS =
  'outline-none focus-visible:border-line-focus focus-visible:ring-1 focus-visible:ring-line-focus';

/** 输入框 / 下拉框的公共外观 */
export const CONTROL =
  `min-h-7 rounded-md border border-line bg-inset px-2 text-xs leading-6 text-fg transition-colors duration-120 ${FOCUS}`;
