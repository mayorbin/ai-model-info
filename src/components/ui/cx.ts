/**
 * 条件类名拼接。丢假值、用空格连接——只做这一件事。
 *
 * 不引 clsx/classnames：全站只有这一种用法（字符串 + 布尔条件），
 * 多一个依赖换不来任何东西。
 */
export type ClassValue = string | false | null | undefined;

export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
