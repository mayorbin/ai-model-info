
## cwd 警告（ensure-branch 自动写入）

- 隔离上下文：`D:\Study\test\ai-model-info`
- Bash cwd 不持续：每条命令都会回到会话初始目录，不会记住上一次的 cd
- 强制规则：后续实现编辑必须使用隔离上下文内的绝对路径，或每条命令以前缀 `cd D:\Study\test\ai-model-info &&` 开头

## 2026-10-10 批次 1 · 厂商详情页 完成

- 结果：`/vendor/[slug]/` 上线，65 家厂商页静态导出（总页数 704）。月度分组抽到
  `src/lib/months.ts`（时间线页批次 3 复用）；新组件 VendorHero / VendorTimeline /
  VendorProvenance（vendor 目录）；i18n 新增 vendor 节；ProvenanceList 的
  INTERNAL_SOURCE 改为导出复用。厂商页类型构成是纯文字摘要，不带筛选外形——
  总表落地（批次 2）后再变链接。
- 验证：tsc/eslint 无输出；`npm run build` 过；`npm run check` 13 条全过（含
  「N 个有成绩的模型只有一个 214」）；shots 对 openai/deepseek/ai21 双断点无横向溢出
  （注意：Git Bash 下传路由参数要 `MSYS_NO_PATHCONV=1`）。
- 下一步：批次 2 排行榜与总表。
