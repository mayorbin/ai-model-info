import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import { KINDS } from '@/lib/kind';

const dict = getDict(DEFAULT_LANG);

/**
 * 总表的列定义与排序键。
 *
 * 这是**静态配置**：列的顺序、列名、默认排序方向、窄屏要不要隐藏，
 * 与表的渲染逻辑是两件事（AGENTS.md 第一节的拆分缝之四）。放在这里之后，
 * `AllModelsTable` 只剩下筛选、排序与渲染的主干。
 */

export type SortKey =
  | 'name'
  | 'vendor'
  | 'region'
  | 'kind'
  | 'date'
  | 'open'
  | 'ctx'
  | 'price'
  | 'eci'
  | 'code'
  | 'n';
export type Dir = 'asc' | 'desc';

/** 类型列按 KINDS 的顺序排（文本 → 视觉 → … → 语音），不按中文字符排 */
export const KIND_ORDER = new Map(KINDS.map((k, i) => [k, i]));

export const DEFAULT_LIMIT = 100;
export const DEFAULT_SORT: { key: SortKey; dir: Dir } = { key: 'eci', dir: 'desc' };

export interface Column {
  key: SortKey;
  label: string;
  /** 该列默认的排序方向：数值列先看最大，名字列先看 A */
  defaultDir: Dir;
  /** 窄屏隐藏的次要列 */
  secondary?: boolean;
  align?: 'left' | 'right';
}

export const COLUMNS: Column[] = [
  { key: 'name', label: dict.board.col.model, defaultDir: 'asc' },
  { key: 'vendor', label: dict.board.col.vendor, defaultDir: 'asc', secondary: true },
  { key: 'region', label: dict.board.col.region, defaultDir: 'asc', secondary: true },
  { key: 'kind', label: dict.board.col.kind, defaultDir: 'asc', secondary: true },
  { key: 'date', label: dict.board.col.date, defaultDir: 'desc', secondary: true },
  { key: 'open', label: dict.board.col.open, defaultDir: 'desc', secondary: true },
  { key: 'ctx', label: dict.board.col.ctx, defaultDir: 'desc', secondary: true, align: 'right' },
  { key: 'price', label: dict.board.col.price, defaultDir: 'asc', align: 'right' },
  { key: 'eci', label: dict.board.col.eci, defaultDir: 'desc', align: 'right' },
  { key: 'code', label: dict.board.col.code, defaultDir: 'desc', align: 'right' },
  { key: 'n', label: dict.board.col.n, defaultDir: 'desc', secondary: true, align: 'right' },
];
