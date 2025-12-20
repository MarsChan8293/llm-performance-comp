export interface BenchmarkConfig {
  modelName: string
  serverName: string
  networkConfig: string
  chipName: string
  framework: string
  frameworkParams: string
  testDate: string
}

export interface PerformanceMetrics {
  inputLength: number
  outputLength: number
  concurrency: number
  ttft: number
  tpot: number
  tokensPerSecond: number
}

// Multiple metric entries are supported per benchmark to represent one dataset.
export type BenchmarkMetricsEntry = PerformanceMetrics

export interface Benchmark {
  id: string
  config: BenchmarkConfig
  metrics: BenchmarkMetricsEntry[]
  createdAt: string
}
