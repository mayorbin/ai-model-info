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
  themeColor: '#07080b',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={htmlLang(DEFAULT_LANG)} data-scroll-behavior="smooth" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
