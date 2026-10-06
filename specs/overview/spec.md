# overview

## Purpose

把「大模型世界」的像素世界观换成一个深色数据终端：数据与判定规则全部沿用，
视觉层整体重写，厂商身份由官方 logo 表达。本 delta 规定这一层必须成立的可测行为，
其中多数是从原项目用三次失败换来的教训固化而来。

## Requirements

### Requirement: 颜色只在一处定义

The system SHALL 在 `globals.css` 的 `@theme` 中定义全部设计 token，
组件与页面不得出现字面色值。

#### Scenario: 新增一个强调色

- **WHEN** 需要为某个状态引入新颜色
- **THEN** 在 `@theme` 中新增 token，组件通过 CSS 变量或 Tailwind 工具类引用
- **AND** 全仓除 `layout.tsx` 的 `viewport.themeColor`（浏览器地址栏用，引用不到 CSS 变量）外，无其他字面色值

### Requirement: 厂商标识始终有可见呈现

The system SHALL 为每个出现在快照中的厂商渲染一个可见标识，且永不渲染空元素。

#### Scenario: 厂商有官方 logo

- **WHEN** `vendor-logos.ts` 能为该 `vendorId` 给出素材
- **THEN** 以 alpha 蒙版渲染该 SVG，颜色随 `currentColor`，20 / 24 / 32 三档均不糊

#### Scenario: 厂商没有可用 logo

- **WHEN** 映射表中该厂商为空或不存在
- **THEN** 渲染单字徽章：取中文名首字或拉丁首字母大写，底色为品牌色 18% alpha，文字为提亮后的品牌色
- **AND** 标识整体 `aria-hidden`，因为厂商名永远紧邻出现

### Requirement: 颜色不是唯一的信息载体

The system SHALL 让每条能力条在颜色之外携带可读的数值文本。

#### Scenario: 色弱读者或灰度打印

- **WHEN** 能力条按分位填充格数
- **THEN** 条右侧显示等宽数值短标（如「世界#1」「1M」「$0.10」），无数据时显示占位符

### Requirement: 数据缺失与零分必须可区分

The system SHALL 把「没有数据」渲染成空槽，把「分数为 0」渲染成一格不亮，二者外观不同。

#### Scenario: 没有评测成绩

- **WHEN** 某一维度的分位为 `null`
- **THEN** 该条画成 8 个空槽，且不得画成 0 格填充

#### Scenario: 分位极低但有数据

- **WHEN** 分位大于 0
- **THEN** 至少点亮一格，避免被误读成「没有数据」

### Requirement: 厂商自报成绩必须显式标注

The system SHALL 在任何展示厂商自报成绩的位置标注其未经独立复核。

#### Scenario: 编程成绩来自厂商自报

- **WHEN** 某条能力条的取值为 `vendor-self-reported`
- **THEN** 数值短标后追加「自报」后缀
- **AND** 悬停提示中说明「厂商自报，未经独立复核」

### Requirement: 首页计数自洽

The system SHALL 保证状态行的在役模型数与「按类型看」六个计数之和相等。

#### Scenario: 快照含已退役模型

- **WHEN** 快照中存在 `retiredAt` 非空的模型
- **THEN** 状态行报在役数量，不含已退役模型
- **AND** 该不变式可被 `npm run check` 检出，破坏时以非零码退出

### Requirement: 派生口径不得被渲染层改写

The system SHALL 让冠军、类型、厂商分组的判定规则只来自既有派生模块，
渲染层只做排版。

#### Scenario: 渲染八个冠军

- **WHEN** 页面渲染今日格局
- **THEN** 每格的型号名与读数逐字来自 `buildChampions()` 的输出，可在导出产物中逐字命中

### Requirement: 不可达路由不得渲染为链接

The system SHALL 在静态导出下避免产出指向不存在路由的链接。

#### Scenario: 导航项对应的页面尚未实现

- **WHEN** 某导航项的路由不在本次交付范围内
- **THEN** 该项渲染为不可点的文字并带 `aria-disabled`，而不是指向会 404 的链接

### Requirement: 键盘焦点必须可见

The system SHALL 为所有可获得焦点的元素提供可见的焦点环。

#### Scenario: 键盘 Tab 导航

- **WHEN** 用户用 Tab 移动焦点
- **THEN** 元素显示 2px `--accent` 焦点环、2px 偏移
- **AND** 全仓不存在 `outline: none` 或等价写法

### Requirement: 组件文件规模受限

The system SHALL 保持单个组件文件不超过 400 行，并以 250 行为日常目标。

#### Scenario: 新增或修改组件

- **WHEN** 组件文件接近 250 行
- **THEN** 按职责缝拆分（容器/展示分离、抽出行级结构、抽出 hook、外移常量表），而不是按行数对半切
