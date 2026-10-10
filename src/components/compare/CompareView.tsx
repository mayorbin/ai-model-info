'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CompareBench } from './CompareBench';
import { CompareGrid, RowLabel } from './CompareGrid';
import { CompareModelCard } from './CompareModelCard';
import { CompareSpecs } from './CompareSpecs';
import { ModelPicker } from './ModelPicker';
import { aptRow, headToHead, highlightsFor, presetsOf, tally, type Tally } from './insights';
import { MAX_PICK, parsePicked, writePicked, COMPARE_STORAGE_KEY } from './storage';
import type { CmpModel, CompareData } from './types';
import { MetricBar } from '@/components/ui/MetricBar';
import { APTITUDES } from '@/lib/aptitude';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { useUrlQuery } from '@/components/leaderboard/useUrlQuery';

const dict = getDict(DEFAULT_LANG);

/**
 * 模型对比页的交互层。
 *
 * 选中的模型记在地址栏 `?m=a,b` 里——复制链接就是分享这一场对阵；
 * 同时存一份到 localStorage，**用地址栏没有 `?m` 时读回来**，于是
 * 「上次比过的那几个」在再次进入这一页时还在（无痕模式下降级为只认 URL）。
 *
 * 数据不在服务端渲染：组合是 C(635,2) 起步，只能在浏览器里现拼，
 * 所以构建期先把全体分布压成 `compare-data.json`，这里按需拉取。
 *
 * 版面按「一张截图讲清楚」来排：对阵卡与比分 → 各自长处 → 能力分位 → 跑分 → 规格。
 * 越往下越细，截到哪里都成立。刚发布、还没有共同跑分的两个模型，规格反而是主要差别，
 * 这时规格排到跑分前面。
 */

const MIN_CONTESTED = 3;

/** 厂商色撞车（两个 Anthropic 模型）时换用的固定色板，否则两列的条分不清谁是谁 */
const PALETTE = ['#7fd4ff', '#ffb27f', '#9ae6a0', '#e0a3ff'];

export function CompareView({ dataUrl }: { dataUrl: string }) {
  const [params, update] = useUrlQuery();
  const [data, setData] = useState<CompareData | null>(null);
  const [failed, setFailed] = useState(false);
  const [scope, setScope] = useState<'auto' | 'common' | 'all'>('auto');
  /* 从 localStorage 回填只做一次：之后用户的删除动作不该被它重新塞回去 */
  const restored = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch(dataUrl)
      .then((r) => (r.ok ? (r.json() as Promise<CompareData>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [dataUrl]);

  const slugs = useMemo(() => {
    const raw = (params?.get('m') ?? '').split(',').filter(Boolean);
    return [...new Set(raw)].slice(0, MAX_PICK);
  }, [params]);

  // 地址栏没写选了谁时，回填上一次的选择。
  // 必须等 `data` 到位才能做：存的 slug 可能来自旧快照，得先按现快照过滤，
  // 否则会往地址栏里写一个查无此人的 slug，页面停在空状态而 URL 看起来像坏了。
  useEffect(() => {
    if (restored.current || params == null || data == null || slugs.length > 0) return;
    restored.current = true;
    let stored: string[] = [];
    try {
      stored = parsePicked(localStorage.getItem(COMPARE_STORAGE_KEY));
    } catch {
      // 存储不可用就停在空状态，不是错误
    }
    const known = new Set(data.models.map((m) => m.slug));
    const valid = stored.filter((s) => known.has(s)).slice(0, MAX_PICK);
    if (valid.length > 0) update({ m: valid.join(',') });
  }, [params, data, slugs.length, update]);

  // 选了谁就记住谁。含「带 ?m= 打开别人的分享链接」这一次——
  // 否则分享链接看过就忘，下次回到这一页仍是空的。
  useEffect(() => {
    if (slugs.length > 0) writePicked(slugs);
  }, [slugs]);

  const bySlug = useMemo(() => new Map((data?.models ?? []).map((m) => [m.slug, m])), [data]);
  const picked = useMemo(
    () => slugs.map((s) => bySlug.get(s)).filter((m): m is CmpModel => m != null),
    [slugs, bySlug],
  );

  const setSlugs = (next: string[]) => {
    update({ m: next.length ? next.join(',') : null });
    writePicked(next);
  };

  const accents = useMemo(() => {
    if (!data) return [];
    const own = picked.map((m) => data.vendors[m.vendor]?.accent ?? '#9fb3c8');
    return new Set(own).size < own.length ? picked.map((_, i) => PALETTE[i]) : own;
  }, [data, picked]);

  const rows = useMemo(() => (data ? headToHead(data, picked) : []), [data, picked]);
  const score = useMemo(() => tally(rows, picked.length), [rows, picked.length]);

  if (failed) {
    return (
      <p className="mt-6 rounded-md border border-line bg-panel p-6 text-sm text-fg-muted">{dict.cmp.loadFailed}</p>
    );
  }

  if (!data || !params) {
    return <p className="py-16 text-center text-sm text-fg-dim">{dict.cmp.loading}</p>;
  }

  const n = picked.length;
  const duel = n === 2;
  // 跑分是对比页的主角：共同项够多、或者跑分行本身就不少时，都排在规格前面
  const scoresFirst = score.contested >= MIN_CONTESTED || rows.length >= 6;
  const specs = <CompareSpecs picked={picked} />;
  const scores = <CompareBench rows={rows} picked={picked} accents={accents} scope={scope} setScope={setScope} />;

  return (
    <div>
      {/* 选择器固定在内容顶部：它是这一页唯一的主操作，滚到哪都该够得着 */}
      <div className="flex justify-end">
        <ModelPicker
          data={data}
          picked={slugs}
          onPick={(s) => setSlugs([...slugs, s])}
          disabled={n >= MAX_PICK}
        />
      </div>

      {n === 0 && (
        <div className="rounded-md border border-line bg-panel p-6">
          <p className="text-sm text-fg-muted">{dict.cmp.emptyHint}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {presetsOf(data).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSlugs(p.slugs)}
                className="rounded-md border border-line bg-inset px-3 py-2 text-left text-xs text-fg-muted transition-colors duration-120 hover:text-fg"
              >
                <span className="block font-medium text-fg">{p.label}</span>
                <span className="mt-0.5 block text-2xs text-fg-dim">
                  {p.slugs.map((s) => bySlug.get(s)?.name).join(' 对 ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {n > 0 && (
        <>
          <CompareGrid n={n}>
            <div className="col-span-full mb-3 flex flex-col justify-center sm:col-span-1 sm:mb-0">
              <Scoreboard n={n} score={score} accents={accents} />
            </div>
            {picked.map((m, i) => (
              <CompareModelCard
                key={m.slug}
                model={m}
                vendor={data.vendors[m.vendor]}
                accent={accents[i]}
                wins={n >= 2 && score.contested > 0 ? score.wins[i] : null}
                duel={duel}
                onRemove={() => setSlugs(slugs.filter((s) => s !== m.slug))}
              />
            ))}
          </CompareGrid>

          {n >= 2 && (
            <CompareGrid n={n} className="mt-4">
              <RowLabel>{dict.cmp.section.highlights}</RowLabel>
              {picked.map((m, i) => {
                const hs = highlightsFor(rows, picked, i);
                return (
                  <ul key={m.slug} className="flex flex-col gap-1.5 py-2">
                    {hs.length === 0 && <li className="text-xs text-fg-dim">{dict.cmp.noHighlights}</li>}
                    {hs.map((h) => (
                      <li key={h.text} className="flex gap-1.5 text-xs leading-snug text-fg-muted">
                        <span aria-hidden className="shrink-0" style={{ color: accents[i] }}>
                          {h.kind === 'bench' ? '▲' : '■'}
                        </span>
                        <span>{h.text}</span>
                      </li>
                    ))}
                  </ul>
                );
              })}
            </CompareGrid>
          )}

          <CompareGrid n={n} className="mt-2">
            <RowLabel title={dict.cmp.aptitudeHint}>{dict.cmp.section.aptitude}</RowLabel>
            {/*
              390 下每个模型**独占一整行**（`col-span-full`）：`MetricBar` 是给 240px 卡片设计的，
              标签 + 8 格 + 读数最少要 ~220px，塞进双列栅格里会横向溢出（实测 33px）。
              独占一行时补一个只在窄屏出现的型号名，否则两段条看不出谁是谁。
            */}
            {picked.map((m) => (
              <div key={m.slug} className="col-span-full py-2 sm:col-span-1">
                <p className="mb-1 text-2xs text-fg-dim sm:hidden">{m.name}</p>
                <div className="flex flex-col gap-1">
                  {APTITUDES.map((meta) => {
                    const v = aptRow(m).values[meta.id];
                    return (
                      <MetricBar
                        key={meta.id}
                        label={v.labelOverride ?? meta.label}
                        fill={v.fill}
                        literal={
                          v.selfReported && v.literal != null
                            ? `${v.literal} ${dict.badge.selfReported}`
                            : v.literal
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </CompareGrid>

          {scoresFirst ? (
            <>
              {scores}
              {specs}
            </>
          ) : (
            <>
              {specs}
              {scores}
            </>
          )}

          <p className="mt-8 max-w-3xl text-2xs leading-relaxed text-fg-dim">{dict.cmp.note}</p>
        </>
      )}
    </div>
  );
}

/** 左上角的总比分。两人对阵是「20 : 5」，三四人时只在各自的列头卡里报数 */
function Scoreboard({ n, score, accents }: { n: number; score: Tally; accents: string[] }) {
  if (n < 2) return <p className="text-xs text-fg-dim">{dict.cmp.addOneMore}</p>;
  if (score.contested === 0) return <p className="text-xs leading-relaxed text-fg-dim">{dict.cmp.noCommon}</p>;
  if (n > 2) return <p className="text-xs text-fg-dim">{dict.cmp.contested(score.contested)}</p>;
  return (
    <div>
      <p className="text-xs text-fg-dim">{dict.cmp.contested(score.contested)}</p>
      <p className="tnum mt-1 text-3xl leading-none font-medium">
        <span style={{ color: accents[0] }}>{score.wins[0]}</span>
        <span className="mx-2 text-fg-dim">:</span>
        <span style={{ color: accents[1] }}>{score.wins[1]}</span>
      </p>
      {score.ties > 0 && <p className="mt-1 text-2xs text-fg-dim">{dict.cmp.ties(score.ties)}</p>}
    </div>
  );
}
