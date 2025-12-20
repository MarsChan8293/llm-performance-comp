# LLM Performance Comp - AI Coding Instructions

## Project Overview
A React-based platform for managing and comparing LLM performance benchmarks. It supports CSV batch imports, manual entry, and side-by-side performance analysis.

## Architecture & State Management
- **Framework**: React 19 + Vite + TypeScript.
- **Persistence**: Uses `@github/spark/hooks`'s `useKV` for local storage persistence.
  - Example: `const [benchmarks, setBenchmarks] = useKV<Benchmark[]>('benchmarks', [])` in [src/App.tsx](src/App.tsx).
- **Data Model**: Defined in [src/lib/types.ts](src/lib/types.ts).
  - `Benchmark`: Contains `config` (metadata) and `metrics` (array of `PerformanceMetrics`).
  - `PerformanceMetrics`: Includes `ttft`, `tpot`, `tokensPerSecond`, etc.

## Key Patterns & Conventions
- **CSV Parsing**: Logic resides in [src/lib/csv-parser.ts](src/lib/csv-parser.ts). It expects specific headers: `Process Num`, `Input Length`, `Output Length`, `TTFT (ms)`, `TPS (with prefill)`.
- **Comparison Logic**: Implemented in [src/components/ComparisonPanel.tsx](src/components/ComparisonPanel.tsx). Metrics are aggregated and averaged by a unique key: `${concurrency}-${inputLength}-${outputLength}`.
- **UI Components**: Built with **Shadcn UI** (Radix UI) and **Tailwind CSS 4.0**.
  - Use the `cn` utility from [src/lib/utils.ts](src/lib/utils.ts) for class merging.
  - Icons: Use **Phosphor Icons** via `@phosphor-icons/react`.
- **Notifications**: Use `sonner` for user feedback (e.g., `toast.success('...')`).
- **Imports**: Use the `@/` alias for `src/` directory imports.

## Developer Workflows
- **Development**: `npm run dev` to start the Vite server.
- **Build**: `npm run build` (runs `tsc` and `vite build`).
- **Linting**: `npm run lint`.

## Design Principles (from PRD)
- **Color Palette**: Blue-purple foundation (`oklch` based). See [theme.json](theme.json) and [tailwind.config.js](tailwind.config.js).
- **Typography**: `Space Grotesk` for headings, `Inter` for body, `JetBrains Mono` for data.
- **Tone**: Professional, precise, and technical.

## Critical Files
- [src/App.tsx](src/App.tsx): Main application logic and state orchestration.
- [src/lib/types.ts](src/lib/types.ts): Core data structures.
- [src/lib/csv-parser.ts](src/lib/csv-parser.ts): CSV import logic.
- [src/components/ComparisonPanel.tsx](src/components/ComparisonPanel.tsx): Performance delta calculations.
