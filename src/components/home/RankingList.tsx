import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_LANG, getDict } from '@/lib/i18n';
import type { Leaderboard, LeaderboardRow } from '@/lib/leaderboard';

const dict = getDict(DEFAULT_LANG);

/** 直接展开的名次数量，其余收进 `<details>`。四列排布时正好是五行。 */
const VISIBLE = 20;

/**
 * 综合智力排行：全部有成绩的模型按 ECI 从高到低排成一列。
 *
 * 这一块补的是首页最大的一个缺口——站点自我描述是「用能力条和排行榜**横向比较**」，
 * 而此前整页只有八个结论和四十张门面卡，没有任何一条可以上下扫的完整次序。
 * 冠军条给出「谁第一」，这里给出「第三十七是谁」。
 *
 * 三条约束：
 *
 * 1. **构建期算好，零客户端运行时**（`next.config.ts` 是 `output: 'export'`）。
 *    名次直接取自 `derive.ts` 的 `rankByEci`，这里不写第二个排序器。
 * 2. **行不可点，所以不长成可点的样子。** 详情路由不在交付范围内，
 *    那就既不做链接、也不给悬停——不做「形状先于能力」的第四次。
 * 3. **214 行全渲染会把 390px 的页面再加高约 45%**，所以只展开前 20 名，
 *    其余收进原生 `<details>`。渐进披露用的是原生元素：静态导出下可用、
 *    键盘可聚焦、读屏语义正确，不需要一行脚本。
 *
 * **同分并列同名次，所以行号会重复、会跳号**（1, 2, 2, 4）。看着像 bug，其实是这一页
 * 最诚实的地方：实测 214 个有成绩的模型里 **39 个并列组覆盖 96 个（45%）**，
 * 最大一组 5 个。上游的 ECI 是按「一起测的那一批」给的，同分就是上游没把它们分开，
 * 连续编号等于凭空造一个先后。
 *
 * **刻意不做的一件事：按名字去重。** 评审曾把「排行把别名排了两遍」列为 P1，
 * 我按它去查了数据，结论是**不能按名字去重**——所谓「别名」实测全是字段不同的真实记录：
 * 六条 `Mistral Large` 覆盖 2024-02 → 2025-12、价格 $6 → $1.5、上下文 128K → 262K，
 * 上游只是给了它们同一个 ECI；而按归一化名字合并还会把 `Command R` 和 `Command R+`
 * 合成一个（两个不同的模型，输出价 $0.6 vs $10）。**名字去重会删掉真实模型**，
 * 所以这里保留原始记录，用并列名次如实表达「上游没有把它们分开」。
 */
export function RankingList({ board }: { board: Leaderboard }) {
  const head = board.rows.slice(0, VISIBLE);
  const rest = board.rows.slice(VISIBLE);

  return (
    <section id="leaderboard" aria-labelledby="leaderboard-heading" className="scroll-mt-20">
      <SectionHeading
        id="leaderboard-heading"
        title={dict.leaderboard.title}
        count={dict.leaderboard.count(board.total)}
      />
      {/* 正文里第一次给出 ECI 的全称——此前它只活在某一行能力条的 title 里，
          而它是首页最显眼的一个数 */}
      <p className="mt-2 text-2xs text-fg-dim">{dict.leaderboard.note}</p>
      {/* 多列栅格里每行都自带名次，「下一列接着排」不会有歧义；
          但读屏看到的是一条线性流，列的含义要用一句话交代 */}
      <p className="sr-only">{dict.leaderboard.columns}</p>

      <RankGrid rows={head} />

      {rest.length > 0 && (
        <details className="group mt-4">
          {/*
            `w-fit` 是把命中区收回到标签本身。`summary` 默认是块级（`display: list-item`），
            实测它的矩形有**1312px 宽**——标签右边一大片空白也是可点区域，
            而这一页最贵的一次误点就是它（展开会让页面长出约 1200px / 390 下约 4700px）。
          */}
          <summary className="w-fit cursor-pointer list-none py-1 text-xs text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-fg hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{dict.leaderboard.expand(rest.length)}</span>
            <span className="hidden group-open:inline">{dict.leaderboard.collapse}</span>
          </summary>
          <RankGrid rows={rest} />
        </details>
      )}
    </section>
  );
}

/** 栅格本身。两处（展开前 / 展开后）必须一起改，所以抽出来。 */
function RankGrid({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <ol className="mt-3 grid list-none gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((row) => (
        <RankRow key={row.model.id} row={row} />
      ))}
    </ol>
  );
}

/**
 * 一行：名次 · 型号 · 厂商 · ECI。
 *
 * 名次用 `--fg-dim`（它是计数，是周边说明），型号用 `--fg`（它是内容），
 * ECI 用 `--fg-muted`（它是值）。三层都是 §1.3b 里定好的角色，不是随手挑的。
 *
 * 厂商列在窄屏只是收窄（`max-w-16`）而不是隐藏。**曾经试过 `sr-only sm:not-sr-only`
 * 让它在窄屏只留给读屏，实测不行**：`not-sr-only` 会把 `white-space` 重置成 `normal`，
 * 于是它排在 `truncate` 之后、盖掉后者的 `nowrap`，厂商名从「截断」变成「折行」——
 * 实测「Thinking Machines」折成两行，整行的节奏就断了。收窄则不需要任何技巧，
 * 厂商始终在无障碍树里，也就不会出现「说明介绍了一个不存在的列」那种问题。
 */
function RankRow({ row }: { row: LeaderboardRow }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="tnum w-7 shrink-0 text-right text-2xs text-fg-dim">{row.rank}</span>
      <span
        className="min-w-0 flex-1 truncate text-xs text-fg"
        /* 1440 下实测有 5 个长名（如 Qwen3 235B-A22B Instruct 2507）会被截断。
           行不可点，所以鼠标用户没有第二条路读到全名——title 是这一页既有的冗余入口做法。
           读屏不受影响：文本在 DOM 里是完整的。 */
        title={row.model.name}
      >
        {row.model.name}
      </span>
      {/* 窄屏收到 max-w-16，长厂商名会被截断，所以同样给 title */}
      <span
        className="max-w-16 shrink-0 truncate text-2xs text-fg-muted sm:max-w-24"
        title={row.vendor?.nameZh ?? row.model.vendorId}
      >
        {row.vendor?.nameZh ?? row.model.vendorId}
      </span>
      {/*
        一位小数，**与 `rankByEci` 分组用的精度一致**。这两个精度必须一样：
        早先是名次按原始浮点分组、这里按整数显示，结果六行都写着「157」却排在 15–20 号。
        名次是这三列里唯一看不出对错的东西，读者只能靠旁边的数字验证它。
      */}
      <span className="tnum w-11 shrink-0 text-right text-xs text-fg-muted">
        {row.eci.toFixed(1)}
      </span>
    </li>
  );
}
