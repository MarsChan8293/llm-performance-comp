# LLM 性能对比平台 - AI 编码指南

## 项目概览
一个基于 React 的平台，用于管理和对比 LLM（大语言模型）的性能基准测试数据。支持 CSV 批量导入、手动录入以及侧边栏性能对比分析。

## 架构与状态管理
- **框架**: React 19 + Vite + TypeScript。
- **持久化**: 使用 `@github/spark/hooks` 的 `useKV` 进行本地存储持久化。
  - 示例: `const [benchmarks, setBenchmarks] = useKV<Benchmark[]>('benchmarks', [])` 见 [src/App.tsx](src/App.tsx)。
- **数据模型**: 定义在 [src/lib/types.ts](src/lib/types.ts)。
  - `Benchmark`: 包含 `config`（元数据）和 `metrics`（`PerformanceMetrics` 数组）。
  - `PerformanceMetrics`: 包含 `ttft`、`tpot`、`tokensPerSecond` 等指标。

## 关键模式与约定
- **CSV 解析**: 逻辑位于 [src/lib/csv-parser.ts](src/lib/csv-parser.ts)。预期特定的表头：`Process Num`, `Input Length`, `Output Length`, `TTFT (ms)`, `TPS (with prefill)`。
- **对比逻辑**: 实现在 [src/components/ComparisonPanel.tsx](src/components/ComparisonPanel.tsx)。指标通过唯一键 `${concurrency}-${inputLength}-${outputLength}` 进行聚合和平均。
- **UI 组件**: 基于 **Shadcn UI** (Radix UI) 和 **Tailwind CSS 4.0** 构建。
  - 使用 [src/lib/utils.ts](src/lib/utils.ts) 中的 `cn` 工具函数进行类名合并。
  - 图标: 通过 `@phosphor-icons/react` 使用 **Phosphor Icons**。
- **通知**: 使用 `sonner` 进行用户反馈（例如：`toast.success('...')`）。
- **导入路径**: 使用 `@/` 别名指向 `src/` 目录。

## 开发工作流
- **开发**: `npm run dev` 启动 Vite 服务器。
- **构建**: `npm run build`（运行 `tsc` 和 `vite build`）。
- **代码检查**: `npm run lint`。

## 设计原则（源自 PRD）
- **配色方案**: 蓝紫色基调（基于 `oklch`）。参见 [theme.json](theme.json) 和 [tailwind.config.js](tailwind.config.js)。
- **字体**: 标题使用 `Space Grotesk`，正文使用 `Inter`，数据展示使用 `JetBrains Mono`。
- **语调**: 专业、精准且具有技术感。

## 核心文件
- [src/App.tsx](src/App.tsx): 主应用逻辑和状态编排。
- [src/lib/types.ts](src/lib/types.ts): 核心数据结构。
- [src/lib/csv-parser.ts](src/lib/csv-parser.ts): CSV 导入逻辑。
- [src/components/ComparisonPanel.tsx](src/components/ComparisonPanel.tsx): 性能差异计算逻辑。
