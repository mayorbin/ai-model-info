import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { DEFAULT_LANG, getDict, htmlLang } from '@/lib/i18n';

const dict = getDict(DEFAULT_LANG);

export const metadata: Metadata = {
  title: {
    default: `${dict.siteName} · ${dict.siteTagline}`,
    template: `%s · ${dict.siteName}`,
  },
  description: dict.siteDescription,
  applicationName: dict.siteName,
};

export const viewport: Viewport = {
  /* 必须与 globals.css 的 --color-void 一致。这个值要交给浏览器渲染地址栏，
     没法引用 CSS 变量，所以只能在这里重复一次——改配色时两处都要动。 */
  themeColor: '#0b0d11',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={htmlLang(DEFAULT_LANG)} data-scroll-behavior="smooth" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
