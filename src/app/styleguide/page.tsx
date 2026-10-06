import { Badge } from '@/components/ui/Badge';
import { MetricBar } from '@/components/ui/MetricBar';
import { Panel } from '@/components/ui/Panel';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatNumber } from '@/components/ui/StatNumber';
import { VendorLogo } from '@/components/ui/VendorLogo';
import { logoFor } from '@/data/vendor-logos';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { loadSnapshot } from '@/lib/snapshot';

/*
 * 设计系统的活体对照页。改 design.md 之后应当同步改这里——
 * 两者的规格必须一致，而这页能被截图，所以它是可验证的那一份。
 *
 * 刻意不进导航。上线前应当把它从产物里排除（见 progress.md 的待办）。
 */

export const metadata = { title: '样式规范' };

const dict = getDict(DEFAULT_LANG);

const TOKEN_GROUPS: Array<{ title: string; tokens: string[] }> = [
  { title: '背景层级', tokens: ['--color-void', '--color-base', '--color-panel', '--color-raised', '--color-inset'] },
  { title: '描边', tokens: ['--color-line-faint', '--color-line', '--color-line-strong', '--color-line-focus'] },
  { title: '文字', tokens: ['--color-fg', '--color-fg-muted', '--color-fg-dim', '--color-fg-faint'] },
  { title: '语义色', tokens: ['--color-accent', '--color-accent-soft', '--color-pos', '--color-neg', '--color-warn', '--color-gold'] },
  { title: '区域识别色', tokens: ['--color-west', '--color-east'] },
];

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;
const BADGES = [
  ['fresh', 'pos'],
  ['retired', 'neg'],
  ['unranked', 'neutral'],
  ['selfReported', 'warn'],
  ['partialData', 'accent'],
] as const;

export default function StyleguidePage() {
  const snapshot = loadSnapshot();
  const vendors = [...snapshot.vendors].sort((a, b) => a.id.localeCompare(b.id));
  const withoutLogo = vendors.filter((v) => logoFor(v.id) == null);

  return (
    <main className="page-shell py-8">
      <h1 className="text-2xl font-semibold">样式规范</h1>
      <p className="mt-1 text-sm text-fg-muted">
        设计 token 与原子组件的对照页。规格以 changes/ui-rebuild-terminal/design.md 为准。
      </p>

      <section className="mt-8">
        <SectionHeading title="设计 token" count={`${TOKEN_GROUPS.reduce((n, g) => n + g.tokens.length, 0)} 个`} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOKEN_GROUPS.map((group) => (
            <Panel key={group.title} className="p-3" interactive={false}>
              <div className="text-2xs text-fg-dim">{group.title}</div>
              <ul className="mt-2 space-y-1.5">
                {group.tokens.map((token) => (
                  <li key={token} className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-sm border border-line"
                      style={{ background: `var(${token})` }}
                    />
                    <span className="tnum text-2xs text-fg-muted">{token}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="Panel" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Panel className="p-4">
            <div className="text-sm font-medium">普通面板</div>
            <p className="mt-1 text-2xs text-fg-muted">1px 边框 + 6px 圆角，无阴影</p>
          </Panel>
          <Panel className="p-4" accentColor="var(--color-west)">
            <div className="text-sm font-medium">带识别色竖条</div>
            <p className="mt-1 text-2xs text-fg-muted">左缘 3px inset 阴影，不挤动排版</p>
          </Panel>
          <Panel className="p-4" interactive={false}>
            <div className="text-sm font-medium">不可交互</div>
            <p className="mt-1 text-2xs text-fg-muted">悬停不提亮，用于静态容器</p>
          </Panel>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="StatNumber" />
        <div className="mt-4 flex flex-wrap items-baseline gap-8">
          {SIZES.map((size) => (
            <StatNumber key={size} size={size} value="162.5" unit="ECI" />
          ))}
          <StatNumber size="md" value="—" unit="未参评" />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="MetricBar" count="8 格" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Panel className="p-4" interactive={false}>
            <MetricBar label="聪明" fill={0.92} literal="世界#1" title="悬停全文承载出处与样本量" />
            <MetricBar label="编程" fill={0.5} literal="很强" className="mt-3" />
            <MetricBar label="记性" fill={0.03} literal="4K" className="mt-3" title="有数据但很弱，至少点亮一格" />
            <MetricBar label="便宜" fill={null} literal={null} className="mt-3" title="没有数据：空槽，与 0 分不是一回事" />
          </Panel>
          <Panel className="p-4" interactive={false}>
            <MetricBar label="聪明" fill={1} literal="162" tone="var(--color-gold)" />
            <MetricBar label="编程" fill={0} literal="$0.10" className="mt-3" title="确实为 0：一格不亮" />
            <MetricBar label="记性" fill={0.68} literal="1M" className="mt-3" />
            <MetricBar label="便宜" fill={0.2} literal="偏贵" className="mt-3" />
          </Panel>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="Badge" count="5 种语义" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {BADGES.map(([key, tone]) => (
            <Badge key={key} tone={tone}>
              {dict.badge[key]}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="SectionHeading" />
        <div className="mt-4 space-y-4">
          <SectionHeading title="国外" count="27 家" accentColor="var(--color-west)" />
          <SectionHeading title="国内" count="17 家" accentColor="var(--color-east)" />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading
          title="VendorLogo"
          count={`${vendors.length} 家 · ${withoutLogo.length} 家兜底`}
        />
        <p className="mt-3 text-2xs text-fg-muted">
          三档尺寸并列，验证不会因为尺寸变化而糊或掉形。左起 20 / 24 / 32。
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => {
            const ref = logoFor(v.id);
            return (
              <Panel key={v.id} as="li" className="flex items-center gap-3 p-2.5">
                <VendorLogo vendorId={v.id} name={v.nameZh} brandColor={v.accentColor} size={20} />
                <VendorLogo vendorId={v.id} name={v.nameZh} brandColor={v.accentColor} size={24} />
                <VendorLogo vendorId={v.id} name={v.nameZh} brandColor={v.accentColor} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{v.nameZh}</span>
                  <span className="tnum block truncate text-2xs text-fg-dim">
                    {v.id} · {ref ? `${ref.source}:${ref.file}` : '单字徽章'}
                  </span>
                </span>
              </Panel>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
