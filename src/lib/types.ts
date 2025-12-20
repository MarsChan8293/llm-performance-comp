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

export interface Benchmark {
  id: string
  config: BenchmarkConfig
  metrics: PerformanceMetrics
  createdAt: string
}
