import { Panel } from '@/components/ui/Panel';
import { StatNumber } from '@/components/ui/StatNumber';
import { VendorLogo } from '@/components/ui/VendorLogo';
import type { Champion } from '@/lib/champions';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';

const dict = getDict(DEFAULT_LANG);

/**
 * 今日格局：八个问题，八个答案，横着铺满一行。
 *
 * 首屏先给结论——读者不必扫完几十张卡片才知道谁最强。
 * 八格的口径完全来自 `champions.ts`，这里只负责排版，不改任何判定规则。
 */
export function ChampionStrip({ champions }: { champions: Champion[] }) {
  return (
    <section aria-labelledby="champions-heading">
      <h2 id="champions-heading" className="text-sm font-semibold text-fg">
        {dict.champions.title}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        {champions.map((c) => {
          const vendorName = c.vendor?.nameZh ?? c.model.vendorId;
          return (
            <Panel key={c.key} className="flex flex-col gap-1.5 p-3">
              <span className="text-2xs text-fg-dim">{dict.champions[c.key]}</span>
              <span className="text-sm font-semibold leading-snug text-fg">{c.model.name}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <VendorLogo
                  vendorId={c.model.vendorId}
                  name={vendorName}
                  brandColor={c.vendor?.accentColor}
                  size={20}
                />
                <span className="truncate text-2xs text-fg-dim">{vendorName}</span>
              </span>
              <StatNumber value={c.figure} size="lg" />
              <span className="text-2xs leading-snug text-fg-muted">{c.detail}</span>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
