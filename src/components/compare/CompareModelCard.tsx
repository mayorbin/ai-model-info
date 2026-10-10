import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { CmpModel, CmpVendor } from './types';

const dict = getDict(DEFAULT_LANG);

interface CompareModelCardProps {
  model: CmpModel;
  vendor: CmpVendor | undefined;
  /** 这一列的身份色。同时是下面条形图的颜色，读者靠它把列与条对上 */
  accent: string;
  /** 已结束的交手里赢了几项。只有两个模型对阵、且有共同成绩时才显示 */
  wins: number | null;
  /** 两个模型时写「胜」，三个以上写「第一」 */
  duel: boolean;
  onRemove: () => void;
}

/**
 * 对比页的列头卡：这是谁、来自哪、排第几、交手赢了几项。
 *
 * 参考项目在这里放的是像素小人；本项目用官方 logo + 一条 3px 身份色小条——
 * 那条小条是**图例**，不是装饰：它把这一列和下面条形图的颜色对上，
 * 而条形的颜色是逐列分别的（厂商色撞车时会换成固定色板）。
 *
 * 不为卡片加彩色边框：那会与「卡片是容器」的规矩冲突，
 * 身份由 logo、名字旁的小条与条形图三处共同承担。
 */
export function CompareModelCard({ model, vendor, accent, wins, duel, onRemove }: CompareModelCardProps) {
  const vendorName = vendor?.name ?? model.vendor;

  return (
    <div className="relative flex flex-col items-start rounded-md border border-line bg-panel px-3 pt-3 pb-4">
      <button
        type="button"
        onClick={onRemove}
        aria-label={dict.cmp.remove(model.name)}
        title={dict.cmp.remove(model.name)}
        className="absolute top-1 right-1.5 min-h-7 min-w-7 rounded-md px-1.5 text-base leading-none text-fg-dim transition-colors duration-120 hover:text-fg"
      >
        ×
      </button>

      <VendorLogo vendorId={model.vendor} name={vendorName} brandColor={vendor?.accent} size={32} />
      <h3 className="mt-2 min-w-0 text-sm leading-snug font-semibold text-fg">
        <Link href={`/model/${model.slug}/`} className="hover:underline hover:underline-offset-4">
          {model.name}
        </Link>
      </h3>
      <span aria-hidden className="mt-2 h-[3px] w-8 rounded-sm" style={{ background: accent }} />

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs">
        <span className="text-fg-muted">{vendorName}</span>
        <span className="text-fg-dim">
          {vendor?.continent === 'east' ? dict.continent.east : dict.continent.west}
        </span>
      </div>

      <div className="tnum mt-1.5 text-xs text-fg-muted">
        {model.eciRank != null ? dict.cmp.eciRank(model.eciRank) : dict.cmp.eciUnranked}
      </div>
      {model.retired && (
        <Badge tone="neg" className="mt-1.5">
          {dict.badge.retired}
        </Badge>
      )}

      {wins != null && (
        <div className="mt-3 text-xs text-fg-muted">
          {duel ? dict.cmp.wins : dict.cmp.winsMulti}
          <span className="tnum ml-1.5 text-base font-medium" style={{ color: accent }}>
            {wins}
          </span>
        </div>
      )}
    </div>
  );
}
