import Link from 'next/link';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { formatCount, formatDate, formatParams } from '@/lib/format';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { ModelRecord, Vendor } from '@/lib/types';

const dict = getDict(DEFAULT_LANG);

interface VendorRowProps {
  model: ModelRecord;
  vendor: Vendor;
}

/**
 * 「尚无评测」档的行。**这一档不该和头部厂商用同一张卡。**
 *
 * 档位本来的使命是「不让毫无成绩的厂商和 OpenAI 视觉上平起平坐」
 * （见 `VendorSection` 顶部注释），可此前三档共用同一个 `ModelCard`：
 * 同尺寸、同结构、同四条能力条，区别只有一行 11px 的档位名。
 * 而这一档里 25 张卡的能力条**四条全是空槽**——实测整页 160 条量表行有 59 条如此。
 *
 * 所以同一份数据换一种密度：一行的信息是「谁 · 哪个型号 · 什么时候发的 · 多少钱 ·
 * 能吃多少字」，而它**恰好就是这一档真实拥有的全部信息**。
 * 实测 390 下这一档从约 5200px 收到约 1750px，档位边界也第一次真的看得见。
 *
 * 仍然是一张通往详情页的链接——行不改变它可点这件事。
 */
export function VendorRow({ model, vendor }: VendorRowProps) {
  const date = model.releaseDate
    ? formatDate(model.releaseDate, model.releaseDatePrecision, DEFAULT_LANG)
    : null;
  const price =
    model.pricing.outputPerMTok != null && model.pricing.outputPerMTok > 0
      ? `$${model.pricing.outputPerMTok}/M`
      : null;
  const context = model.contextWindow != null ? `${formatCount(model.contextWindow)} tokens` : null;
  const openness =
    model.openWeights == null ? null : model.openWeights ? dict.openness.open : dict.openness.closed;
  /*
   * 参数量只在它是**官方给的**时候进这一行。`formatParams` 对推断值会追加
   * 「由型号名推断」，那是给详情页读的句子；挤进一行事实里会把这一行撑爆，
   * 而这一行的职责是给出可扫的骨架，不是承载全部口径。
   */
  const params =
    model.params.totalB != null && model.params.confidence === 'exact'
      ? formatParams(model, DEFAULT_LANG)
      : null;

  const facts = [date, openness, params, price, context].filter((x): x is string => x != null);

  return (
    /*
     * `data-vendor` 是 `check-consistency.ts` 的计数锚点，不是样式钩子。
     * 这一档换成行之后忘记带它，脚本立刻报「厂商分组块数 15 ≠ roster entries 40」——
     * 那条不变式的意思是「每条 roster 记录都渲染了一次」，与用卡片还是用行无关。
     * 这正是用语义属性而不是 className 计数的价值：换密度不会误报，漏渲染才会。
     */
    /* min-w-0 不能省：栅格项的 `min-width` 默认是 auto，一行长型号名会把整列撑出容器，
       实测 390 下「Sakana AI / Fugu Ultra V2」这一行宽到 486px，整页因此横向溢出 */
    <li data-vendor={vendor.id} className="min-w-0 border-b border-line-faint">
      <Link
        href={`/model/${model.slug}/`}
        className="group flex min-w-0 items-start gap-2.5 py-2 transition-colors duration-120"
      >
        <VendorLogo
          vendorId={vendor.id}
          name={vendor.nameZh}
          brandColor={vendor.accentColor}
          size={20}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2xs text-fg-dim">{vendor.nameZh}</span>
          {/* 整行可点，所以型号名不再需要单独的 title：鼠标停在哪一格都能点进去读全名 */}
          <span className="block truncate text-sm text-fg group-hover:underline group-hover:underline-offset-4">
            {model.name}
          </span>
          <span className="tnum block truncate text-2xs text-fg-dim">
            {facts.length > 0 ? facts.join(' · ') : dict.badge.partialData}
          </span>
        </span>
      </Link>
    </li>
  );
}
